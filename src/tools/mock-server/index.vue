<template>
  <div class="mock-server">
    <n-alert type="warning" class="mb-4">
      纯前端环境无法启动真实 HTTP 服务器（浏览器无权监听端口）。本工具用于定义 Mock 路由、生成可下载的配置 JSON，并提供本地请求模拟测试。
    </n-alert>

    <!-- 路由定义区 -->
    <div class="card mb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="pane-label">路由定义（{{ routes.length }} 条）</div>
        <div class="flex items-center gap-2">
          <n-switch v-model:value="running" size="small">
            <template #checked>模拟运行中</template>
            <template #unchecked>已停止</template>
          </n-switch>
          <n-button size="small" @click="addRoute">
            <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>添加路由
          </n-button>
        </div>
      </div>

      <!-- 模拟访问基础地址 -->
      <div class="base-url-line mb-3">
        <span class="pane-label">模拟基础地址：</span>
        <n-input v-model:value="baseUrl" style="width: 360px" />
      </div>

      <div v-if="routes.length === 0" class="text-gray-400 text-center py-8">
        点击"添加路由"开始定义 Mock 接口
      </div>

      <div v-else class="route-list">
        <div v-for="(route, index) in routes" :key="index" class="route-item">
          <div class="route-header">
            <n-select
              v-model:value="route.method"
              :options="methodOptions"
              style="width: 110px"
            />
            <n-input v-model:value="route.path" placeholder="/api/users" class="flex-1" />
            <n-input-number
              v-model:value="route.status"
              :min="100"
              :max="599"
              style="width: 100px"
              placeholder="状态码"
            />
            <n-button quaternary circle @click="removeRoute(index)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </n-button>
          </div>
          <div class="route-body">
            <n-input
              v-model:value="route.response"
              type="textarea"
              placeholder='{"code":0,"data":{"id":1}}'
              rows="3"
              :autosize="false"
              class="code-area"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 配置导出 / 模拟测试 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">配置与导出</div>
      <div class="flex items-center gap-2 flex-wrap">
        <n-button type="primary" @click="downloadConfig" :disabled="routes.length === 0">
          下载 Mock 配置 JSON
        </n-button>
        <n-button @click="copyConfig" :disabled="routes.length === 0">复制配置 JSON</n-button>
        <n-button @click="importConfig">导入配置</n-button>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="onFileSelected"
        />
      </div>
      <n-alert type="info" class="mt-3" :bordered="false">
        下载的 JSON 配置可用于 mockjs、msw 等服务端 Mock 框架加载，实现真实 HTTP 服务。
      </n-alert>
    </div>

    <!-- 本地请求模拟测试 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">本地请求模拟测试</div>
      <div class="sim-line">
        <n-select
          v-model:value="testMethod"
          :options="methodOptions"
          style="width: 110px"
        />
        <n-input
          v-model:value="testPath"
          placeholder="/api/users"
          class="flex-1"
          @keyup.enter="simulateRequest"
        />
        <n-button type="primary" @click="simulateRequest">发送模拟请求</n-button>
      </div>

      <div v-if="simResult" class="sim-result mt-3">
        <div class="sim-status mb-2">
          <n-tag :type="simResult.matched ? 'success' : 'warning'" size="small" :bordered="false">
            {{ simResult.status }} {{ simResult.statusText }}
          </n-tag>
          <span class="text-sm text-gray-500 ml-2">{{ simResult.matched ? '已匹配路由' : '未匹配路由（404）' }}</span>
          <span class="text-sm text-gray-500 ml-2">耗时 {{ simResult.duration }}ms</span>
        </div>
        <n-input
          :value="simResult.body"
          type="textarea"
          readonly
          rows="6"
          :autosize="false"
          class="code-area"
        />
      </div>
    </div>

    <!-- 请求日志 -->
    <div class="card">
      <div class="flex items-center justify-between mb-2">
        <div class="pane-label">请求日志（{{ requestLogs.length }} 条）</div>
        <n-button size="small" @click="clearLogs" :disabled="requestLogs.length === 0">清空日志</n-button>
      </div>
      <div v-if="requestLogs.length === 0" class="text-gray-400 text-center py-6">
        暂无请求日志
      </div>
      <div v-else class="log-list">
        <div v-for="(log, index) in requestLogs" :key="index" class="log-row">
          <n-tag :type="statusTagType(log.status)" size="small" :bordered="false">
            {{ log.status }}
          </n-tag>
          <n-tag size="small" :bordered="false" type="info">{{ log.method }}</n-tag>
          <span class="log-path font-mono">{{ log.path }}</span>
          <span class="log-time text-gray-400">{{ log.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NInput, NInputNumber, NSelect, NSwitch, NAlert, NTag, useMessage } from 'naive-ui'

interface MockRoute {
  method: string
  path: string
  status: number
  response: string
}

interface SimResult {
  matched: boolean
  status: number
  statusText: string
  body: string
  duration: number
}

interface RequestLog {
  method: string
  path: string
  status: number
  time: string
}

const message = useMessage()

const running = ref(false)
const baseUrl = ref('http://localhost:3000')
const routes = ref<MockRoute[]>([
  { method: 'GET', path: '/api/users', status: 200, response: '{\n  "code": 0,\n  "data": [\n    { "id": 1, "name": "张三" },\n    { "id": 2, "name": "李四" }\n  ]\n}' },
  { method: 'POST', path: '/api/login', status: 200, response: '{\n  "code": 0,\n  "token": "mock-token-abc123"\n}' },
])

const testMethod = ref('GET')
const testPath = ref('/api/users')
const simResult = ref<SimResult | null>(null)
const requestLogs = ref<RequestLog[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
]

function addRoute() {
  routes.value.push({ method: 'GET', path: '/api/new', status: 200, response: '{}' })
}

function removeRoute(index: number) {
  routes.value.splice(index, 1)
}

function statusTagType(status: number): 'success' | 'info' | 'warning' | 'error' {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'info'
  if (status >= 400 && status < 500) return 'warning'
  return 'error'
}

// 匹配路由（支持 :id 形式的路径参数）
function matchRoute(method: string, path: string): MockRoute | null {
  for (const route of routes.value) {
    if (route.method !== method) continue
    // 将路由路径转换为正则表达式
    const pattern = route.path
      .replace(/:[^/]+/g, '[^/]+')
      .replace(/\//g, '\\/')
    const regex = new RegExp(`^${pattern}$`)
    if (regex.test(path)) return route
  }
  return null
}

// 本地模拟请求
function simulateRequest() {
  if (!running.value) {
    message.warning('请先开启"模拟运行"开关')
    return
  }
  if (!testPath.value.trim()) {
    message.warning('请输入请求路径')
    return
  }

  const startTime = performance.now()
  const matched = matchRoute(testMethod.value, testPath.value.trim())
  // 模拟网络延迟
  setTimeout(() => {
    if (matched) {
      simResult.value = {
        matched: true,
        status: matched.status,
        statusText: statusTextOf(matched.status),
        body: formatJson(matched.response),
        duration: Math.round(performance.now() - startTime),
      }
      requestLogs.value.unshift({
        method: testMethod.value,
        path: testPath.value.trim(),
        status: matched.status,
        time: new Date().toLocaleTimeString(),
      })
    } else {
      const notFoundBody = JSON.stringify({
        code: 404,
        message: `无法匹配路由：${testMethod.value} ${testPath.value}`,
      }, null, 2)
      simResult.value = {
        matched: false,
        status: 404,
        statusText: 'Not Found',
        body: notFoundBody,
        duration: Math.round(performance.now() - startTime),
      }
      requestLogs.value.unshift({
        method: testMethod.value,
        path: testPath.value.trim(),
        status: 404,
        time: new Date().toLocaleTimeString(),
      })
    }
    // 限制日志数量
    if (requestLogs.value.length > 100) requestLogs.value = requestLogs.value.slice(0, 100)
  }, 50)
}

function statusTextOf(status: number): string {
  const map: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Internal Server Error',
  }
  return map[status] || ''
}

// 尝试格式化 JSON 字符串
function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

// 构建配置对象
function buildConfig() {
  return {
    name: 'Mock Server Config',
    baseUrl: baseUrl.value,
    routes: routes.value.map(r => ({
      method: r.method,
      path: r.path,
      status: r.status,
      response: r.response,
    })),
    exportedAt: new Date().toISOString(),
  }
}

// 下载配置 JSON
function downloadConfig() {
  const config = buildConfig()
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mock-config.json'
  a.click()
  URL.revokeObjectURL(url)
  message.success('配置已下载')
}

// 复制配置 JSON
async function copyConfig() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(buildConfig(), null, 2))
    message.success('配置已复制到剪贴板')
  } catch {
    message.error('复制失败')
  }
}

// 触发文件选择
function importConfig() {
  fileInput.value?.click()
}

// 选择文件后导入配置
function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string)
      if (Array.isArray(data.routes)) {
        routes.value = data.routes.map((r: MockRoute) => ({
          method: r.method || 'GET',
          path: r.path || '/',
          status: r.status || 200,
          response: r.response || '{}',
        }))
        if (data.baseUrl) baseUrl.value = data.baseUrl
        message.success(`已导入 ${routes.value.length} 条路由`)
      } else {
        message.error('配置文件格式无效：缺少 routes 字段')
      }
    } catch {
      message.error('配置文件解析失败')
    }
    input.value = ''
  }
  reader.readAsText(file)
}

function clearLogs() {
  requestLogs.value = []
}
</script>

<style scoped>
.mock-server {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.base-url-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.route-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.route-item {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  padding: 10px;
}

.dark .route-item {
  border-color: rgba(255, 255, 255, 0.1);
}

.route-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.flex-1 {
  flex: 1;
}

.code-area :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.sim-line {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sim-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.log-list {
  max-height: 360px;
  overflow-y: auto;
}

.log-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.log-row:hover {
  background: rgba(0, 0, 0, 0.04);
}

.dark .log-row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.log-path {
  flex: 1;
  font-size: 13px;
  word-break: break-all;
}

.log-time {
  font-size: 12px;
}
</style>
