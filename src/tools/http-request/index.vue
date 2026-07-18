<template>
  <div class="http-request">
    <n-alert type="info" class="mb-4">
      基于 fetch API 发送请求。受浏览器同源策略限制，跨域请求需目标服务器支持 CORS。支持环境变量（<code v-pre>{{varName}}</code>）、历史记录与 cURL 导入导出。
    </n-alert>

    <n-tabs v-model:value="activeTab" type="line" animated>
      <!-- 请求 -->
      <n-tab-pane name="request" tab="请求">
        <div class="card mb-4">
          <div class="request-line">
            <n-select v-model:value="method" :options="methodOptions" style="width: 140px" />
            <n-input v-model:value="url" placeholder="https://api.example.com/users" class="url-input" @keyup.enter="send" />
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
              <span class="mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
              添加请求头
            </n-button>
          </div>

          <div class="body-section mt-3" v-if="includeBody && hasBody">
            <div class="pane-label mb-2">请求体（JSON）</div>
            <n-input v-model:value="body" type="textarea" placeholder='{"key": "value"}' rows="6" :autosize="false" />
          </div>

          <div class="curl-actions mt-3">
            <n-button size="small" @click="exportCurl">复制 cURL 命令</n-button>
            <n-button size="small" @click="showCurlImport = true">从 cURL 导入</n-button>
          </div>
        </div>

        <div class="card" v-if="response">
          <div class="response-header mb-3">
            <div class="response-status">
              <n-tag :type="statusType" size="large" :bordered="false">{{ response.status }} {{ response.statusText }}</n-tag>
              <span class="text-sm text-gray-500 ml-3">耗时 {{ duration }}ms</span>
              <span class="text-sm text-gray-500 ml-3">{{ responseSize }}</span>
            </div>
          </div>

          <n-tabs type="line" animated>
            <n-tab-pane name="body" tab="响应体">
              <n-input :value="responseBody" type="textarea" readonly rows="20" :autosize="false" class="response-body" />
            </n-tab-pane>
            <n-tab-pane name="headers" tab="响应头">
              <n-data-table :columns="headerColumns" :data="responseHeaders" :bordered="false" :single-line="false" size="small" />
            </n-tab-pane>
            <n-tab-pane name="raw" tab="原始响应">
              <n-input :value="rawResponse" type="textarea" readonly rows="20" :autosize="false" class="response-body" />
            </n-tab-pane>
          </n-tabs>
        </div>

        <n-alert type="error" v-if="errorMsg" class="mt-4" closable @close="errorMsg = ''">{{ errorMsg }}</n-alert>
      </n-tab-pane>

      <!-- 环境变量 -->
      <n-tab-pane name="env" tab="环境变量">
        <div class="card">
          <div class="section-header mb-3">
            <span class="pane-label">环境变量</span>
            <n-button size="small" dashed @click="addEnvVar">添加变量</n-button>
          </div>
          <div v-for="(env, index) in envVars" :key="index" class="env-row">
            <n-input v-model:value="env.key" placeholder="变量名" style="width: 200px" />
            <n-input v-model:value="env.value" placeholder="变量值" class="flex-1" />
            <n-button quaternary circle @click="removeEnvVar(index)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </n-button>
          </div>
          <n-empty v-if="envVars.length === 0" description="暂无环境变量，添加后可在 URL / 请求头 / 请求体中使用 {{变量名}} 引用" />
          <div class="env-preview mt-3" v-if="envVars.some(e => e.key)">
            <div class="pane-label mb-2">实时替换预览</div>
            <div class="preview-item"><b>URL:</b> {{ previewUrl }}</div>
          </div>
        </div>
      </n-tab-pane>

      <!-- 历史 -->
      <n-tab-pane name="history" tab="历史记录">
        <div class="card">
          <div class="section-header mb-3">
            <span class="pane-label">请求历史</span>
            <n-button size="small" type="error" dashed @click="clearHistory">清空历史</n-button>
          </div>
          <n-empty v-if="history.length === 0" description="暂无请求历史，发送请求后会自动记录" />
          <div v-else class="history-list">
            <div v-for="item in history" :key="item.id" class="history-item" @click="restoreHistory(item)">
              <div class="history-main">
                <n-tag size="small" :type="methodTagType(item.method)">{{ item.method }}</n-tag>
                <span class="history-url">{{ item.url }}</span>
              </div>
              <div class="history-meta">
                <span class="history-time">{{ formatTime(item.timestamp) }}</span>
                <n-button size="tiny" quaternary type="error" @click.stop="deleteHistory(item.id)">删除</n-button>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <!-- cURL 导入弹窗 -->
    <n-modal v-model:show="showCurlImport" preset="dialog" title="从 cURL 导入" style="width: 600px">
      <n-input v-model:value="curlImportText" type="textarea" rows="8" placeholder="粘贴 cURL 命令..." />
      <n-alert v-if="curlImportError" type="error" class="mt-3" :show-icon="false">{{ curlImportError }}</n-alert>
      <template #action>
        <n-button @click="showCurlImport = false">取消</n-button>
        <n-button type="primary" @click="importCurl">导入</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NButton, NInput, NSelect, NCheckbox, NSpace, NAlert, NTabs, NTabPane, NTag, NDataTable, NEmpty, NModal } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface HeaderItem {
  key: string
  value: string
}

interface ResponseHeader {
  key: string
  value: string
}

interface EnvVar {
  key: string
  value: string
}

interface HistoryItem {
  id: string
  method: string
  url: string
  headers: HeaderItem[]
  body: string
  includeHeaders: boolean
  includeBody: boolean
  noCors: boolean
  timestamp: number
}

const HISTORY_KEY = 'http_request_history'
const ENV_KEY = 'http_request_env'

const activeTab = ref('request')
const method = ref('GET')
const url = ref('https://jsonplaceholder.typicode.com/posts/1')
const includeHeaders = ref(false)
const includeBody = ref(false)
const noCors = ref(false)
const headers = ref<HeaderItem[]>([{ key: '', value: '' }])
const body = ref('')
const envVars = ref<EnvVar[]>([])
const history = ref<HistoryItem[]>([])

const loading = ref(false)
const errorMsg = ref('')
const response = ref<Response | null>(null)
const responseBody = ref('')
const rawResponse = ref('')
const responseHeaders = ref<ResponseHeader[]>([])
const duration = ref(0)
const responseSize = ref('')

const showCurlImport = ref(false)
const curlImportText = ref('')
const curlImportError = ref('')

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

const envMap = computed(() => {
  const map: Record<string, string> = {}
  for (const e of envVars.value) {
    if (e.key) map[e.key] = e.value
  }
  return map
})

const previewUrl = computed(() => applyEnvVars(url.value))

onMounted(() => {
  loadHistory()
  loadEnv()
})

function addHeader() {
  headers.value.push({ key: '', value: '' })
}

function removeHeader(index: number) {
  headers.value.splice(index, 1)
}

function addEnvVar() {
  envVars.value.push({ key: '', value: '' })
  saveEnv()
}

function removeEnvVar(index: number) {
  envVars.value.splice(index, 1)
  saveEnv()
}

function saveEnv() {
  localStorage.setItem(ENV_KEY, JSON.stringify(envVars.value))
}

function loadEnv() {
  try {
    const raw = localStorage.getItem(ENV_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as EnvVar[]
      if (Array.isArray(parsed)) envVars.value = parsed
    }
  } catch {
    // ignore
  }
}

function applyEnvVars(text: string): string {
  const map = envMap.value
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => map[key] ?? match)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as HistoryItem[]
      if (Array.isArray(parsed)) history.value = parsed
    }
  } catch {
    // ignore
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value.slice(0, 50)))
}

function addHistory() {
  const item: HistoryItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    method: method.value,
    url: url.value,
    headers: headers.value.map(h => ({ ...h })),
    body: body.value,
    includeHeaders: includeHeaders.value,
    includeBody: includeBody.value,
    noCors: noCors.value,
    timestamp: Date.now(),
  }
  history.value.unshift(item)
  saveHistory()
}

function deleteHistory(id: string) {
  history.value = history.value.filter(h => h.id !== id)
  saveHistory()
}

function clearHistory() {
  history.value = []
  saveHistory()
}

function restoreHistory(item: HistoryItem) {
  method.value = item.method
  url.value = item.url
  headers.value = item.headers.length ? item.headers.map(h => ({ ...h })) : [{ key: '', value: '' }]
  body.value = item.body
  includeHeaders.value = item.includeHeaders
  includeBody.value = item.includeBody
  noCors.value = item.noCors
  activeTab.value = 'request'
}

function methodTagType(m: string): 'success' | 'warning' | 'error' | 'info' {
  if (m === 'GET') return 'success'
  if (m === 'POST' || m === 'PUT' || m === 'PATCH') return 'warning'
  if (m === 'DELETE') return 'error'
  return 'info'
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

async function send() {
  if (!url.value.trim()) {
    errorMsg.value = '请输入 URL'
    return
  }

  const finalUrl = applyEnvVars(url.value.trim())

  try {
    new URL(finalUrl)
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
    const fetchOptions: RequestInit = {
      method: method.value,
      mode: noCors.value ? 'no-cors' : 'cors',
    }

    const headerMap: Record<string, string> = {}
    if (includeHeaders.value) {
      headers.value.forEach(h => {
        if (h.key.trim()) {
          headerMap[h.key.trim()] = applyEnvVars(h.value)
        }
      })
    }

    if (includeBody.value && hasBody.value && body.value.trim()) {
      try {
        JSON.parse(body.value)
        headerMap['Content-Type'] = 'application/json'
        fetchOptions.body = applyEnvVars(body.value)
      } catch {
        errorMsg.value = '请求体不是有效的 JSON'
        loading.value = false
        return
      }
    }

    if (Object.keys(headerMap).length > 0) {
      fetchOptions.headers = headerMap
    }

    const res = await fetch(finalUrl, fetchOptions)
    response.value = res

    const text = await res.text()
    const bytes = new Blob([text]).size
    responseSize.value = formatSize(bytes)

    try {
      const json = JSON.parse(text)
      responseBody.value = JSON.stringify(json, null, 2)
    } catch {
      responseBody.value = text
    }

    let raw = `${res.status} ${res.statusText}\n`
    res.headers.forEach((value, key) => {
      raw += `${key}: ${value}\n`
    })
    raw += `\n${text}`
    rawResponse.value = raw

    res.headers.forEach((value, key) => {
      responseHeaders.value.push({ key, value })
    })

    addHistory()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '请求失败：' + msg + '（可能是 CORS 跨域限制，可尝试开启 no-cors 模式）'
  } finally {
    duration.value = Math.round(performance.now() - startTime)
    loading.value = false
  }
}

// cURL 导出
function exportCurl() {
  const parts: string[] = ['curl']
  if (noCors.value) parts.push('--no-cors')
  parts.push('-X', method.value)

  if (includeHeaders.value) {
    headers.value.forEach(h => {
      if (h.key.trim()) {
        parts.push('-H', `'${h.key.trim()}: ${applyEnvVars(h.value)}'`)
      }
    })
  }

  if (includeBody.value && hasBody.value && body.value.trim()) {
    parts.push('-H', "'Content-Type: application/json'")
    parts.push('-d', `'${applyEnvVars(body.value)}'`)
  }

  parts.push(`'${applyEnvVars(url.value.trim())}'`)
  const cmd = parts.join(' ')
  navigator.clipboard.writeText(cmd)
  alert('cURL 命令已复制到剪贴板')
}

// cURL 导入
function importCurl() {
  curlImportError.value = ''
  const text = curlImportText.value.trim()
  if (!text) {
    curlImportError.value = '请输入 cURL 命令'
    return
  }
  try {
    const parsed = parseCurl(text)
    method.value = parsed.method
    url.value = parsed.url
    headers.value = parsed.headers.length ? parsed.headers : [{ key: '', value: '' }]
    includeHeaders.value = parsed.headers.length > 0
    body.value = parsed.body
    includeBody.value = !!parsed.body
    noCors.value = parsed.noCors
    showCurlImport.value = false
    curlImportText.value = ''
    activeTab.value = 'request'
  } catch (e: unknown) {
    curlImportError.value = e instanceof Error ? e.message : '解析失败'
  }
}

function parseCurl(cmd: string) {
  let method = 'GET'
  let url = ''
  let body = ''
  const headers: HeaderItem[] = []
  let noCors = false

  const tokens = tokenizeCurl(cmd)
  let i = 0
  while (i < tokens.length) {
    const t = tokens[i]
    if (t === '-X' || t === '--request') {
      method = tokens[++i]?.toUpperCase() || 'GET'
    } else if (t === '-H' || t === '--header') {
      const h = tokens[++i] || ''
      const idx = h.indexOf(':')
      if (idx > 0) {
        headers.push({ key: h.slice(0, idx).trim(), value: h.slice(idx + 1).trim() })
      }
    } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary') {
      body = tokens[++i] || ''
    } else if (t === '--no-cors') {
      noCors = true
    } else if (t === '--url') {
      url = tokens[++i] || ''
    } else if (t.startsWith('http://') || t.startsWith('https://')) {
      url = t
    }
    i++
  }

  if (!url) throw new Error('未能解析出 URL')
  return { method, url, headers, body, noCors }
}

function tokenizeCurl(cmd: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inQuote = false
  let quoteChar = ''
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i]
    if (inQuote) {
      if (ch === quoteChar && cmd[i - 1] !== '\\') {
        inQuote = false
        tokens.push(current)
        current = ''
      } else {
        current += ch
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = true
      quoteChar = ch
      if (current.trim()) {
        tokens.push(current.trim())
        current = ''
      }
    } else if (ch === ' ' || ch === '\n') {
      if (current.trim()) {
        tokens.push(current.trim())
        current = ''
      }
    } else {
      current += ch
    }
  }
  if (current.trim()) tokens.push(current.trim())
  return tokens
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

.header-row,
.env-row {
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.curl-actions {
  display: flex;
  gap: 8px;
}

.env-preview .preview-item {
  font-size: 13px;
  word-break: break-all;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  border-color: #2080f0;
  background: #f7faff;
}

.history-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.history-url {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.history-time {
  font-size: 12px;
  color: #999;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.mt-3 {
  margin-top: 12px;
}

.ml-3 {
  margin-left: 12px;
}

.text-sm {
  font-size: 14px;
}

.text-gray-500 {
  color: #888;
}
</style>
