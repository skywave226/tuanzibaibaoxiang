<template>
  <div class="graphql-tester">
    <n-alert type="info" class="mb-4">
      基于 fetch API 发送 GraphQL 查询。受浏览器同源策略限制，跨域请求需目标服务器支持 CORS。
    </n-alert>

    <!-- 请求配置区 -->
    <div class="card mb-4">
      <div class="request-line">
        <n-input
          v-model:value="url"
          placeholder="https://api.example.com/graphql"
          class="url-input"
        />
        <n-button type="primary" @click="send" :loading="loading">发送查询</n-button>
      </div>

      <n-tabs type="line" animated class="mt-3">
        <!-- 查询编辑器 -->
        <n-tab-pane name="query" tab="查询">
          <n-input
            v-model:value="query"
            type="textarea"
            placeholder="query Hero($id: ID!) {&#10;  hero(id: $id) {&#10;    name&#10;    friends {&#10;      name&#10;    }&#10;  }&#10;}"
            rows="12"
            :autosize="false"
            class="code-area"
          />
        </n-tab-pane>

        <!-- 变量编辑 -->
        <n-tab-pane name="variables" tab="变量">
          <n-input
            v-model:value="variables"
            type="textarea"
            placeholder='{ "id": "1000" }'
            rows="12"
            :autosize="false"
            class="code-area"
          />
        </n-tab-pane>

        <!-- 请求头编辑 -->
        <n-tab-pane name="headers" tab="请求头">
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
        </n-tab-pane>

        <!-- 历史记录 -->
        <n-tab-pane name="history" :tab="`历史 (${history.length})`">
          <div v-if="history.length === 0" class="text-gray-400 text-center py-8">
            暂无历史记录
          </div>
          <div v-else class="history-list">
            <div v-for="(item, index) in history" :key="index" class="history-item">
              <div class="history-header">
                <n-tag :type="item.success ? 'success' : 'error'" size="small" :bordered="false">
                  {{ item.success ? '成功' : '失败' }}
                </n-tag>
                <span class="history-time text-gray-400">{{ item.time }}</span>
                <span class="history-url font-mono text-sm">{{ item.url }}</span>
                <n-button text size="tiny" @click="restoreHistory(index)">恢复</n-button>
                <n-button text size="tiny" @click="removeHistory(index)">删除</n-button>
              </div>
              <div class="history-query font-mono text-sm text-gray-500">
                {{ item.query.slice(0, 80) }}{{ item.query.length > 80 ? '...' : '' }}
              </div>
            </div>
            <n-button size="small" @click="clearHistory" class="mt-2">清空历史</n-button>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 响应展示 -->
    <div class="card" v-if="response || errorMsg">
      <div class="response-header mb-3" v-if="response">
        <div class="response-status">
          <n-tag :type="statusType" size="large" :bordered="false">
            {{ response.status }} {{ response.statusText }}
          </n-tag>
          <span class="text-sm text-gray-500 ml-3">耗时 {{ duration }}ms</span>
        </div>
      </div>

      <n-tabs type="line" animated v-if="response">
        <n-tab-pane name="body" tab="响应体">
          <n-input
            :value="responseBody"
            type="textarea"
            readonly
            rows="20"
            :autosize="false"
            class="code-area"
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

      <n-alert type="error" v-if="errorMsg" closable @close="errorMsg = ''">
        {{ errorMsg }}
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NButton, NInput, NAlert, NTabs, NTabPane, NTag, NDataTable, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface HeaderItem {
  key: string
  value: string
}

interface ResponseHeader {
  key: string
  value: string
}

interface HistoryItem {
  url: string
  query: string
  variables: string
  headers: HeaderItem[]
  success: boolean
  time: string
}

const message = useMessage()

const url = ref('https://countries.trevorblades.com/')
const query = ref('query {\n  countries {\n    code\n    name\n  }\n}')
const variables = ref('')
const headers = ref<HeaderItem[]>([{ key: '', value: '' }])

const loading = ref(false)
const errorMsg = ref('')
const response = ref<Response | null>(null)
const responseBody = ref('')
const responseHeaders = ref<ResponseHeader[]>([])
const duration = ref(0)
const history = ref<HistoryItem[]>([])

const STORAGE_KEY = 'graphql-tester-history'

const headerColumns: DataTableColumns<ResponseHeader> = [
  { title: '名称', key: 'key', width: 200 },
  { title: '值', key: 'value' },
]

const statusType = computed<'success' | 'warning' | 'error' | 'info'>(() => {
  if (!response.value) return 'info'
  const status = response.value.status
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'info'
  if (status >= 400 && status < 500) return 'warning'
  return 'error'
})

// 从本地存储加载历史记录
onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) history.value = JSON.parse(stored)
  } catch {
    // 忽略解析错误
  }
})

// 保存历史记录到本地存储
function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value.slice(0, 20)))
  } catch {
    // 忽略写入错误
  }
}

function addHeader() {
  headers.value.push({ key: '', value: '' })
}

function removeHeader(index: number) {
  headers.value.splice(index, 1)
}

// 发送 GraphQL 查询
async function send() {
  if (!url.value.trim()) {
    errorMsg.value = '请输入 GraphQL 端点 URL'
    return
  }
  if (!query.value.trim()) {
    errorMsg.value = '请输入 GraphQL 查询语句'
    return
  }

  // 校验 URL
  try {
    new URL(url.value)
  } catch {
    errorMsg.value = 'URL 格式无效'
    return
  }

  // 校验变量 JSON
  let variablesObj: Record<string, unknown> | undefined
  if (variables.value.trim()) {
    try {
      variablesObj = JSON.parse(variables.value)
    } catch {
      errorMsg.value = '变量不是有效的 JSON'
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
    // 构建请求头
    const headerMap: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    headers.value.forEach(h => {
      if (h.key.trim()) headerMap[h.key.trim()] = h.value
    })

    // 构建请求体
    const bodyObj: Record<string, unknown> = { query: query.value }
    if (variablesObj) bodyObj.variables = variablesObj

    const res = await fetch(url.value, {
      method: 'POST',
      headers: headerMap,
      body: JSON.stringify(bodyObj),
    })
    response.value = res

    const text = await res.text()
    // 尝试格式化 JSON
    try {
      const json = JSON.parse(text)
      responseBody.value = JSON.stringify(json, null, 2)
    } catch {
      responseBody.value = text
    }

    // 解析响应头
    res.headers.forEach((value, key) => {
      responseHeaders.value.push({ key, value })
    })

    // 记录历史
    const success = res.ok && !responseBody.value.includes('"errors"')
    history.value.unshift({
      url: url.value,
      query: query.value,
      variables: variables.value,
      headers: JSON.parse(JSON.stringify(headers.value)),
      success,
      time: new Date().toLocaleTimeString(),
    })
    if (history.value.length > 20) history.value = history.value.slice(0, 20)
    saveHistory()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '请求失败：' + msg + '（可能是 CORS 跨域限制）'
    history.value.unshift({
      url: url.value,
      query: query.value,
      variables: variables.value,
      headers: JSON.parse(JSON.stringify(headers.value)),
      success: false,
      time: new Date().toLocaleTimeString(),
    })
    if (history.value.length > 20) history.value = history.value.slice(0, 20)
    saveHistory()
  } finally {
    duration.value = Math.round(performance.now() - startTime)
    loading.value = false
  }
}

// 恢复历史记录到表单
function restoreHistory(index: number) {
  const item = history.value[index]
  url.value = item.url
  query.value = item.query
  variables.value = item.variables
  headers.value = JSON.parse(JSON.stringify(item.headers))
  message.success('已恢复历史记录')
}

function removeHistory(index: number) {
  history.value.splice(index, 1)
  saveHistory()
}

function clearHistory() {
  history.value = []
  saveHistory()
}
</script>

<style scoped>
.graphql-tester {
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

.code-area :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.response-header {
  display: flex;
  align-items: center;
}

.response-status {
  display: flex;
  align-items: center;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  padding: 10px 8px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 8px;
}

.dark .history-item {
  border-color: rgba(255, 255, 255, 0.08);
}

.history-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.history-time {
  font-size: 12px;
}

.history-url {
  flex: 1;
  min-width: 200px;
  word-break: break-all;
}

.history-query {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
