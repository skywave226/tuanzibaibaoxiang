<template>
  <div class="http-request">
    <n-alert type="info" class="mb-4">
      基于 fetch API 发送请求。受浏览器同源策略限制，跨域请求需目标服务器支持 CORS。
    </n-alert>

    <div class="card mb-4">
      <div class="request-line">
        <n-select
          v-model:value="method"
          :options="methodOptions"
          style="width: 140px"
        />
        <n-input
          v-model:value="url"
          placeholder="https://api.example.com/users"
          class="url-input"
          @keyup.enter="send"
        />
        <n-button type="primary" @click="send" :loading="loading">发送</n-button>
      </div>

      <div class="options mt-3">
        <n-space align="center">
          <n-checkbox v-model:checked="includeHeaders">自定义请求头</n-checkbox>
          <n-checkbox v-model:checked="includeBody" v-if="hasBody">请求体</n-checkbox>
          <n-checkbox v-model:checked="noCors">no-cors 模式（绕过预检，但读取受限）</n-checkbox>
        </n-space>
      </div>

      <div class="headers-section mt-3" v-if="includeHeaders">
        <div class="pane-label mb-2">请求头</div>
        <div v-for="(header, index) in headers" :key="index" class="header-row">
          <n-input v-model:value="header.key" placeholder="Key" style="width: 200px" />
          <n-input v-model:value="header.value" placeholder="Value" class="flex-1" />
          <n-button quaternary circle @click="removeHeader(index)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </n-button>
        </div>
        <n-button size="small" dashed @click="addHeader" class="mt-2">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
          添加请求头
        </n-button>
      </div>

      <div class="body-section mt-3" v-if="includeBody && hasBody">
        <div class="pane-label mb-2">请求体（JSON）</div>
        <n-input
          v-model:value="body"
          type="textarea"
          placeholder='{"key": "value"}'
          rows="6"
          :autosize="false"
        />
      </div>
    </div>

    <div class="card" v-if="response">
      <div class="response-header mb-3">
        <div class="response-status">
          <n-tag :type="statusType" size="large" :bordered="false">
            {{ response.status }} {{ response.statusText }}
          </n-tag>
          <span class="text-sm text-gray-500 ml-3">耗时 {{ duration }}ms</span>
          <span class="text-sm text-gray-500 ml-3">{{ responseSize }}</span>
        </div>
      </div>

      <n-tabs type="line" animated>
        <n-tab-pane name="body" tab="响应体">
          <n-input
            :value="responseBody"
            type="textarea"
            readonly
            rows="20"
            :autosize="false"
            class="response-body"
          />
        </n-tab-pane>
        <n-tab-pane name="headers" tab="响应头">
          <n-data-table
            :columns="headerColumns"
            :data="responseHeaders"
            :bordered="false"
            :single-line="false"
            size="small"
          />
        </n-tab-pane>
        <n-tab-pane name="raw" tab="原始响应">
          <n-input
            :value="rawResponse"
            type="textarea"
            readonly
            rows="20"
            :autosize="false"
            class="response-body"
          />
        </n-tab-pane>
      </n-tabs>
    </div>

    <n-alert type="error" v-if="errorMsg" class="mt-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NInput, NSelect, NCheckbox, NSpace, NAlert, NTabs, NTabPane, NTag, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface HeaderItem {
  key: string
  value: string
}

interface ResponseHeader {
  key: string
  value: string
}

const method = ref('GET')
const url = ref('https://jsonplaceholder.typicode.com/posts/1')
const includeHeaders = ref(false)
const includeBody = ref(false)
const noCors = ref(false)
const headers = ref<HeaderItem[]>([{ key: '', value: '' }])
const body = ref('')

const loading = ref(false)
const errorMsg = ref('')
const response = ref<Response | null>(null)
const responseBody = ref('')
const rawResponse = ref('')
const responseHeaders = ref<ResponseHeader[]>([])
const duration = ref(0)
const responseSize = ref('')

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'HEAD', value: 'HEAD' },
]

const hasBody = computed(() => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.value))

const statusType = computed<'success' | 'warning' | 'error' | 'info'>(() => {
  if (!response.value) return 'info'
  const status = response.value.status
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'info'
  if (status >= 400 && status < 500) return 'warning'
  return 'error'
})

const headerColumns: DataTableColumns<ResponseHeader> = [
  { title: '名称', key: 'key', width: 200 },
  { title: '值', key: 'value' },
]

function addHeader() {
  headers.value.push({ key: '', value: '' })
}

function removeHeader(index: number) {
  headers.value.splice(index, 1)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

async function send() {
  if (!url.value.trim()) {
    errorMsg.value = '请输入 URL'
    return
  }

  // 验证 URL 格式
  try {
    new URL(url.value)
  } catch {
    errorMsg.value = 'URL 格式无效'
    return
  }

  loading.value = true
  errorMsg.value = ''
  response.value = null
  responseBody.value = ''
  rawResponse.value = ''
  responseHeaders.value = []

  const startTime = performance.now()

  try {
    // 构建请求配置
    const fetchOptions: RequestInit = {
      method: method.value,
      mode: noCors.value ? 'no-cors' : 'cors',
    }

    // 添加请求头
    const headerMap: Record<string, string> = {}
    if (includeHeaders.value) {
      headers.value.forEach(h => {
        if (h.key.trim()) {
          headerMap[h.key.trim()] = h.value
        }
      })
    }

    // 添加请求体
    if (includeBody.value && hasBody.value && body.value.trim()) {
      // 尝试解析 JSON 校验
      try {
        JSON.parse(body.value)
        headerMap['Content-Type'] = 'application/json'
        fetchOptions.body = body.value
      } catch {
        errorMsg.value = '请求体不是有效的 JSON'
        loading.value = false
        return
      }
    }

    if (Object.keys(headerMap).length > 0) {
      fetchOptions.headers = headerMap
    }

    const res = await fetch(url.value, fetchOptions)
    response.value = res

    // 读取响应体
    const text = await res.text()
    const bytes = new Blob([text]).size
    responseSize.value = formatSize(bytes)

    // 尝试格式化 JSON
    try {
      const json = JSON.parse(text)
      responseBody.value = JSON.stringify(json, null, 2)
    } catch {
      responseBody.value = text
    }

    // 构建原始响应（含状态行和响应头）
    let raw = `${res.status} ${res.statusText}\n`
    res.headers.forEach((value, key) => {
      raw += `${key}: ${value}\n`
    })
    raw += `\n${text}`
    rawResponse.value = raw

    // 解析响应头
    res.headers.forEach((value, key) => {
      responseHeaders.value.push({ key, value })
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '请求失败：' + msg + '（可能是 CORS 跨域限制，可尝试开启 no-cors 模式）'
  } finally {
    duration.value = Math.round(performance.now() - startTime)
    loading.value = false
  }
}
</script>

<style scoped>
.http-request {
  max-width: 1000px;
  margin: 0 auto;
}

.request-line {
  display: flex;
  gap: 12px;
  align-items: center;
}

.url-input {
  flex: 1;
}

.header-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.flex-1 {
  flex: 1;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.response-header {
  display: flex;
  align-items: center;
}

.response-status {
  display: flex;
  align-items: center;
}

.response-body :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}
</style>
