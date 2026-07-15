<template>
  <div class="port-scanner">
    <!-- 限制说明 -->
    <n-alert type="warning" :bordered="false" class="limit-alert">
      <template #header>浏览器限制说明</template>
      浏览器存在 CORS（跨域资源共享）与混合内容限制，扫描结果仅供参考。无法穿透内网隔离、无法扫描非 HTTP(S)/WebSocket 服务，结果可能存在误判。建议结合 nmap 等原生工具使用。
    </n-alert>

    <!-- 配置区 -->
    <div class="config-section">
      <div class="config-row">
        <n-form-item label="主机地址">
          <n-input
            v-model:value="host"
            placeholder="如 127.0.0.1 / example.com / 192.168.1.1"
            clearable
          />
        </n-form-item>
        <n-form-item label="协议">
          <n-select v-model:value="protocol" :options="protocolOptions" style="width: 140px" />
        </n-form-item>
      </div>

      <div class="config-row">
        <n-form-item label="起始端口">
          <n-input-number v-model:value="startPort" :min="1" :max="65535" style="width: 100%" />
        </n-form-item>
        <n-form-item label="结束端口">
          <n-input-number v-model:value="endPort" :min="1" :max="65535" style="width: 100%" />
        </n-form-item>
        <n-form-item label="超时(毫秒)">
          <n-input-number v-model:value="timeout" :min="500" :max="10000" :step="500" style="width: 100%" />
        </n-form-item>
      </div>

      <div class="config-row">
        <n-form-item label="并发数">
          <n-input-number v-model:value="concurrency" :min="1" :max="50" style="width: 100%" />
        </n-form-item>
        <n-space>
          <n-button type="primary" :loading="scanning" @click="startScan">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            {{ scanning ? '扫描中...' : '开始扫描' }}
          </n-button>
          <n-button @click="stopScan" :disabled="!scanning">停止</n-button>
          <n-button @click="loadPreset" quaternary>常用端口</n-button>
          <n-button @click="clearResults" quaternary>清空结果</n-button>
        </n-space>
      </div>
    </div>

    <!-- 校验提示 -->
    <n-alert v-if="warningMsg" type="error" :bordered="false" class="limit-alert">
      {{ warningMsg }}
    </n-alert>

    <!-- 进度 -->
    <div v-if="scanning || progress.total > 0" class="progress-section">
      <n-progress
        type="line"
        :percentage="progress.percentage"
        :indicator-placement="'inside'"
        :status="scanning ? 'default' : 'success'"
      />
      <span class="progress-text">{{ progress.done }} / {{ progress.total }}（开放 {{ openCount }}）</span>
    </div>

    <!-- 结果表格 -->
    <div class="result-section">
      <n-data-table
        :columns="columns"
        :data="results"
        :bordered="false"
        :pagination="{ pageSize: 50 }"
        :row-key="(row: PortResult) => row.port.toString()"
      />
      <n-empty v-if="!scanning && results.length === 0" description="尚未扫描，请配置参数后开始" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, h } from 'vue'
import {
  NAlert, NInput, NInputNumber, NSelect, NButton, NSpace,
  NFormItem, NProgress, NDataTable, NEmpty, NTag,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

// 端口扫描结果
interface PortResult {
  port: number
  status: 'open' | 'closed' | 'filtered'
  latency: number | null
  remark: string
}

const host = ref('127.0.0.1')
const protocol = ref<'http' | 'https' | 'ws' | 'wss'>('http')
const startPort = ref(80)
const endPort = ref(100)
const timeout = ref(3000)
const concurrency = ref(10)
const scanning = ref(false)
const stopFlag = ref(false)

const protocolOptions = [
  { label: 'HTTP', value: 'http' },
  { label: 'HTTPS', value: 'https' },
  { label: 'WS (WebSocket)', value: 'ws' },
  { label: 'WSS (WebSocket Secure)', value: 'wss' },
]

const results = ref<PortResult[]>([])

const progress = reactive({
  done: 0,
  total: 0,
  get percentage() {
    return this.total === 0 ? 0 : Math.round((this.done / this.total) * 100)
  },
})

const openCount = computed(() => results.value.filter(r => r.status === 'open').length)

// 校验提示
const warningMsg = ref('')

const columns: DataTableColumns<PortResult> = [
  { title: '端口', key: 'port', width: 100 },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render(row) {
      const map = {
        open: { type: 'success' as const, text: '开放' },
        closed: { type: 'error' as const, text: '关闭' },
        filtered: { type: 'warning' as const, text: '过滤/超时' },
      }
      const info = map[row.status]
      return h(NTag, { type: info.type, size: 'small', bordered: false }, { default: () => info.text })
    },
  },
  {
    title: '响应时间',
    key: 'latency',
    width: 120,
    render(row) {
      return row.latency === null ? '-' : `${row.latency} ms`
    },
  },
  { title: '备注', key: 'remark' },
]

// 常用端口预设范围（覆盖常见服务端口）
function loadPreset() {
  startPort.value = 21
  endPort.value = 27017
}

function clearResults() {
  results.value = []
  progress.done = 0
  progress.total = 0
}

// 使用 fetch 探测单个端口
async function scanPort(port: number): Promise<PortResult> {
  const startTime = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout.value)
  const baseUrl = `${protocol.value}://${host.value}:${port}/`
  try {
    // 使用 no-cors 模式，即使跨域也能感知到服务端响应
    await fetch(baseUrl, {
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)
    const latency = Date.now() - startTime
    return { port, status: 'open', latency, remark: '服务响应' }
  } catch (e: any) {
    clearTimeout(timer)
    const latency = Date.now() - startTime
    if (e.name === 'AbortError') {
      return { port, status: 'filtered', latency: null, remark: '超时，可能被过滤' }
    }
    // 立即抛出的网络错误有两种情况：连接被拒（端口关闭）或 CORS 预检失败
    // 通过响应时间区分：极短时间内报错通常是连接被拒
    if (latency < timeout.value * 0.3) {
      return { port, status: 'closed', latency, remark: '连接被拒' }
    }
    return { port, status: 'filtered', latency: null, remark: '响应不确定' }
  }
}

// 并发控制
async function runWithConcurrency(tasks: (() => Promise<void>)[], limit: number) {
  const queue = [...tasks]
  const workers: Promise<void>[] = []
  for (let i = 0; i < limit; i++) {
    workers.push((async () => {
      while (queue.length > 0 && !stopFlag.value) {
        const task = queue.shift()
        if (task) await task()
      }
    })())
  }
  await Promise.all(workers)
}

async function startScan() {
  // 参数校验
  warningMsg.value = ''
  if (!host.value.trim()) return
  if (startPort.value > endPort.value) {
    const tmp = startPort.value
    startPort.value = endPort.value
    endPort.value = tmp
  }
  // 限制扫描端口数量，避免浏览器卡死
  const portRange = endPort.value - startPort.value + 1
  if (portRange > 2000) {
    warningMsg.value = '为保证浏览器性能，单次扫描端口数量限制为 2000 个以内，请缩小端口范围'
    return
  }

  scanning.value = true
  stopFlag.value = false
  results.value = []
  progress.done = 0
  progress.total = portRange

  const tasks: (() => Promise<void>)[] = []
  for (let port = startPort.value; port <= endPort.value; port++) {
    tasks.push(async () => {
      const result = await scanPort(port)
      results.value.push(result)
      // 按端口排序展示
      results.value.sort((a, b) => a.port - b.port)
      progress.done++
    })
  }

  await runWithConcurrency(tasks, concurrency.value)
  scanning.value = false
}

function stopScan() {
  stopFlag.value = true
  scanning.value = false
}
</script>

<style scoped>
.port-scanner {
  max-width: 1000px;
  margin: 0 auto;
}

.limit-alert {
  margin-bottom: 20px;
}

.config-section {
  margin-bottom: 20px;
}

.config-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.config-row .n-form-item {
  flex: 1;
  min-width: 180px;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-text {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.7;
}

.result-section {
  margin-top: 10px;
}

:deep(.n-data-table) {
  font-size: 14px;
}

.dark .limit-alert {
  opacity: 0.95;
}
</style>
