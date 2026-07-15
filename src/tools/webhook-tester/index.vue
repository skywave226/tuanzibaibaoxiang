<template>
  <div class="webhook-tester">
    <!-- CORS 提示 -->
    <n-alert type="info" class="mb-4" :bordered="false">
      <template #header>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        关于浏览器 CORS 限制
      </template>
      纯前端发送请求受同源策略限制，目标服务器需配置 CORS 允许跨域。若服务器未配置 CORS，可勾选「no-cors 模式」发送请求，但浏览器将无法读取响应内容（仅适用于触发型 Webhook，如 IFTTT、Slack 通知）。
    </n-alert>

    <!-- 请求配置 -->
    <n-card class="config-card" :bordered="false">
      <div class="card-title">
        <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 16.98a6.94 6.94 0 0 0 1.4-4.18c0-3.87-3.13-7-7-7-3.29 0-6.05 2.27-6.8 5.33"/><path d="M12 2v4"/><path d="M6.34 7.66l-2.83-2.83"/><path d="M17.66 7.66l2.83-2.83"/><path d="M12 18a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg></span>
        <span>请求配置</span>
      </div>

      <!-- 请求行 -->
      <div class="request-line">
        <n-select
          v-model:value="method"
          :options="methodOptions"
          style="width: 130px"
        />
        <n-input
          v-model:value="url"
          placeholder="https://hooks.example.com/services/..."
          class="url-input"
          @keyup.enter="send"
        />
        <n-button type="primary" @click="send" :loading="loading">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></span>
          发送
        </n-button>
      </div>

      <!-- 选项 -->
      <div class="options mt-3">
        <n-space align="center">
          <n-checkbox v-model:checked="noCors">no-cors 模式</n-checkbox>
          <n-checkbox v-model:checked="includeHeaders">自定义请求头</n-checkbox>
          <n-checkbox v-if="hasBody" v-model:checked="includeBody">请求体</n-checkbox>
          <n-checkbox v-model:checked="verifyJson" v-if="includeBody && hasBody">校验 JSON</n-checkbox>
        </n-space>
      </div>

      <!-- 请求头 -->
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

      <!-- 请求体 -->
      <div class="body-section mt-3" v-if="includeBody && hasBody">
        <div class="pane-label mb-2">
          请求体
          <n-radio-group v-model:value="bodyType" size="small" class="ml-2">
            <n-radio-button value="json">JSON</n-radio-button>
            <n-radio-button value="text">Text</n-radio-button>
            <n-radio-button value="form">Form</n-radio-button>
          </n-radio-group>
        </div>
        <n-input
          v-model:value="body"
          type="textarea"
          :placeholder="bodyPlaceholder"
          rows="6"
          :autosize="false"
          class="body-input"
        />
        <div class="body-hint" v-if="bodyType === 'json' && body">
          <n-tag :type="bodyValid ? 'success' : 'error'" size="tiny" :bordered="false">
            {{ bodyValid ? 'JSON 格式有效' : 'JSON 格式错误' }}
          </n-tag>
        </div>
      </div>
    </n-card>

    <!-- 错误提示 -->
    <n-alert v-if="errorMsg" type="error" class="mt-4" closable @close="errorMsg = ''" :bordered="false">
      {{ errorMsg }}
    </n-alert>

    <!-- 响应展示 -->
    <n-card v-if="response" class="mt-4 response-card" :bordered="false">
      <div class="card-title">
        <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg></span>
        <span>响应结果</span>
      </div>

      <div class="response-summary">
        <n-tag :type="statusType" :bordered="false">
          {{ noCors && response.status === 0 ? 'opaque' : response.status + ' ' + response.statusText }}
        </n-tag>
        <span class="meta-item">耗时 {{ duration }}ms</span>
        <span class="meta-item" v-if="responseSize">{{ responseSize }}</span>
        <span class="meta-item" v-if="noCors && response.status === 0">
          no-cors 模式下无法读取响应内容
        </span>
      </div>

      <n-tabs type="line" animated class="mt-3" v-if="!(noCors && response.status === 0)">
        <n-tab-pane name="body" tab="响应体">
          <n-input
            :value="responseBody"
            type="textarea"
            readonly
            rows="16"
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
      </n-tabs>
    </n-card>

    <!-- 历史记录 -->
    <n-card v-if="history.length > 0" class="mt-4 history-card" :bordered="false">
      <div class="card-title">
        <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
        <span>历史记录</span>
        <n-button text size="tiny" class="ml-auto" @click="history = []">清空</n-button>
      </div>
      <div class="history-list">
        <div class="history-item" v-for="(item, i) in history" :key="i">
          <div class="history-left">
            <n-tag :type="historyStatusType(item.status)" size="tiny" :bordered="false">
              {{ item.status || (item.noCors ? 'opaque' : '-') }}
            </n-tag>
            <span class="history-method">{{ item.method }}</span>
            <span class="history-url" :title="item.url">{{ item.url }}</span>
          </div>
          <div class="history-right">
            <span class="history-time">{{ item.time }}</span>
            <span class="history-duration">{{ item.duration }}ms</span>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NInput, NButton, NSelect, NCheckbox, NSpace, NAlert, NCard, NTag,
  NTabs, NTabPane, NDataTable, NRadioGroup, NRadioButton,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface HeaderItem { key: string; value: string }
interface ResponseHeader { key: string; value: string }
interface HistoryItem {
  method: string
  url: string
  status: number
  duration: number
  time: string
  noCors: boolean
}

const method = ref('POST')
const url = ref('')
const noCors = ref(false)
const includeHeaders = ref(false)
const includeBody = ref(true)
const verifyJson = ref(true)
const bodyType = ref<'json' | 'text' | 'form'>('json')
const headers = ref<HeaderItem[]>([{ key: 'Content-Type', value: 'application/json' }])
const body = ref('{\n  "event": "test",\n  "data": {\n    "message": "Hello Webhook"\n  }\n}')

const loading = ref(false)
const errorMsg = ref('')
const response = ref<Response | null>(null)
const responseBody = ref('')
const responseHeaders = ref<ResponseHeader[]>([])
const duration = ref(0)
const responseSize = ref('')
const history = ref<HistoryItem[]>([])

const methodOptions = [
  { label: 'POST', value: 'POST' },
  { label: 'GET', value: 'GET' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
]

const hasBody = computed(() => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.value))

const bodyPlaceholder = computed(() => {
  if (bodyType.value === 'json') return '{"key": "value"}'
  if (bodyType.value === 'form') return 'field1=value1&field2=value2'
  return '请求体文本内容...'
})

// JSON 校验
const bodyValid = computed(() => {
  if (bodyType.value !== 'json' || !body.value.trim()) return true
  try {
    JSON.parse(body.value)
    return true
  } catch {
    return false
  }
})

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

function historyStatusType(status: number): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (status === 0) return 'default'
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'info'
  if (status >= 400 && status < 500) return 'warning'
  return 'error'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

async function send() {
  if (!url.value.trim()) {
    errorMsg.value = '请输入 Webhook URL'
    return
  }
  try {
    new URL(url.value)
  } catch {
    errorMsg.value = 'URL 格式无效'
    return
  }

  // JSON 校验
  if (includeBody.value && hasBody.value && bodyType.value === 'json' && verifyJson.value && body.value.trim()) {
    if (!bodyValid.value) {
      errorMsg.value = '请求体不是有效的 JSON'
      return
    }
  }

  loading.value = true
  errorMsg.value = ''
  response.value = null
  responseBody.value = ''
  responseHeaders.value = []

  const startTime = performance.now()

  try {
    const fetchOptions: RequestInit = {
      method: method.value,
      mode: noCors.value ? 'no-cors' : 'cors',
    }

    const headerMap: Record<string, string> = {}
    if (includeHeaders.value) {
      headers.value.forEach(h => {
        if (h.key.trim()) headerMap[h.key.trim()] = h.value
      })
    }

    // 处理请求体
    if (includeBody.value && hasBody.value && body.value.trim()) {
      if (bodyType.value === 'json') {
        headerMap['Content-Type'] = headerMap['Content-Type'] || 'application/json'
        fetchOptions.body = body.value
      } else if (bodyType.value === 'form') {
        headerMap['Content-Type'] = headerMap['Content-Type'] || 'application/x-www-form-urlencoded'
        fetchOptions.body = body.value
      } else {
        headerMap['Content-Type'] = headerMap['Content-Type'] || 'text/plain'
        fetchOptions.body = body.value
      }
    }

    if (Object.keys(headerMap).length > 0) {
      fetchOptions.headers = headerMap
    }

    const res = await fetch(url.value, fetchOptions)
    response.value = res

    // no-cors 模式下 status 为 0，无法读取响应
    if (noCors.value && res.status === 0) {
      responseBody.value = '[no-cors 模式下无法读取响应内容]'
      responseSize.value = ''
    } else {
      const text = await res.text()
      responseSize.value = formatSize(new Blob([text]).size)
      try {
        const json = JSON.parse(text)
        responseBody.value = JSON.stringify(json, null, 2)
      } catch {
        responseBody.value = text
      }
      res.headers.forEach((value, key) => {
        responseHeaders.value.push({ key, value })
      })
    }

    // 记录历史
    duration.value = Math.round(performance.now() - startTime)
    history.value.unshift({
      method: method.value,
      url: url.value,
      status: res.status,
      duration: duration.value,
      time: new Date().toLocaleTimeString('zh-CN'),
      noCors: noCors.value,
    })
    if (history.value.length > 10) history.value.pop()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '请求失败：' + msg + '（可能是 CORS 跨域限制，可尝试开启 no-cors 模式）'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.webhook-tester {
  max-width: 1000px;
  margin: 0 auto;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.ml-2 {
  margin-left: 8px;
}

.ml-auto {
  margin-left: auto;
}

.mr-1 {
  margin-right: 4px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.title-icon {
  font-size: 18px;
  color: #18a058;
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
  display: flex;
  align-items: center;
}

.body-hint {
  margin-top: 8px;
}

.body-input :deep(textarea),
.response-body :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.response-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 13px;
  color: #888;
}

/* 历史记录 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 13px;
  gap: 12px;
}

.history-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.history-method {
  font-weight: 600;
  color: #2080f0;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.history-url {
  flex: 1;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.history-time,
.history-duration {
  font-size: 12px;
  color: #999;
  font-family: 'Fira Code', 'Consolas', monospace;
}

/* 深色模式适配 */
.dark .card-title,
.dark .pane-label {
  color: rgba(255, 255, 255, 0.85);
}

.dark .history-item {
  background: rgba(255, 255, 255, 0.03);
}

.dark .history-url,
.dark .meta-item,
.dark .history-time,
.dark .history-duration {
  color: rgba(255, 255, 255, 0.55);
}

.dark .history-method {
  color: #70c0e8;
}

.dark .title-icon {
  color: #63e2b6;
}
</style>
