<template>
  <div class="url-codec">
    <n-tabs v-model:value="activeTab" type="line" animated class="mb-4">
      <n-tab-pane name="codec" tab="编解码">
        <div class="toolbar">
          <n-space>
            <n-button type="primary" @click="encode">编码 →</n-button>
            <n-button type="primary" @click="decode">← 解码</n-button>
            <n-button @click="encodeAll">全部编码</n-button>
            <n-button @click="autoConvert">自动判断</n-button>
            <n-button @click="copy(result)">复制结果</n-button>
            <n-button @click="clearAll">清空</n-button>
          </n-space>
        </div>

        <div class="mode-switch mb-4">
          <n-radio-group v-model:value="mode" size="small">
            <n-radio-button value="component">encodeURI（保留 :/?&=）</n-radio-button>
            <n-radio-button value="full">encodeURIComponent（全部编码）</n-radio-button>
          </n-radio-group>
        </div>

        <div class="editor-area">
          <div class="editor-pane">
            <div class="pane-label">原文</div>
            <n-input
              v-model:value="text"
              type="textarea"
              placeholder="输入需要编码或解码的文本"
              rows="10"
              :autosize="false"
            />
          </div>
          <div class="editor-pane">
            <div class="pane-label">URL 编码结果</div>
            <n-input
              v-model:value="result"
              type="textarea"
              placeholder="编码/解码结果"
              rows="10"
              :autosize="false"
            />
          </div>
        </div>

        <n-alert type="error" v-if="errorMsg" class="mt-4" closable @close="errorMsg = ''">
          {{ errorMsg }}
        </n-alert>

        <div class="examples card mt-4">
          <h3 class="text-sm font-bold mb-3">常用示例</h3>
          <n-space vertical size="small">
            <div v-for="ex in examples" :key="ex.label" class="example-row">
              <span class="text-sm text-gray-500 w-24">{{ ex.label }}</span>
              <n-button text size="small" @click="text = ex.text" class="example-btn">
                {{ ex.text }}
              </n-button>
            </div>
          </n-space>
        </div>
      </n-tab-pane>

      <n-tab-pane name="parser" tab="URL 参数解析">
        <div class="card mb-4">
          <n-input v-model:value="urlInput" type="textarea" :rows="3" placeholder="粘贴完整 URL，例如 https://example.com/search?q=测试&page=1" />
          <n-button type="primary" class="mt-3" @click="parseUrl">解析 URL</n-button>
        </div>

        <div v-if="parsedUrl" class="card parsed-result">
          <div class="parsed-section">
            <div class="pane-label mb-2">基础信息</div>
            <div class="parsed-grid">
              <div><b>协议：</b>{{ parsedUrl.protocol }}</div>
              <div><b>主机：</b>{{ parsedUrl.host }}</div>
              <div><b>路径：</b>{{ parsedUrl.pathname }}</div>
              <div><b>哈希：</b>{{ parsedUrl.hash || '无' }}</div>
            </div>
          </div>

          <div class="parsed-section mt-4">
            <div class="pane-label mb-2">查询参数</div>
            <n-empty v-if="parsedParams.length === 0" description="无查询参数" />
            <n-data-table
              v-else
              :columns="paramColumns"
              :data="parsedParams"
              size="small"
              :bordered="false"
              :single-line="false"
            />
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="batch" tab="批量处理">
        <div class="card mb-4">
          <n-input v-model:value="batchInput" type="textarea" :rows="8" placeholder="每行一个内容，将分别进行编码或解码" />
          <div class="mode-switch mt-3">
            <n-radio-group v-model:value="batchMode" size="small">
              <n-radio-button value="encode">批量编码</n-radio-button>
              <n-radio-button value="decode">批量解码</n-radio-button>
            </n-radio-group>
          </div>
          <n-button type="primary" class="mt-3" @click="batchProcess">批量处理</n-button>
        </div>

        <div v-if="batchOutput" class="card">
          <div class="pane-label mb-2">批量结果</div>
          <n-input :value="batchOutput" type="textarea" readonly :rows="8" />
          <n-button size="small" class="mt-3" @click="copy(batchOutput)">复制结果</n-button>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace, NInput, NAlert, NRadioGroup, NRadioButton, NTabs, NTabPane, NDataTable, NEmpty, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const message = useMessage()
const activeTab = ref('codec')
const text = ref('')
const result = ref('')
const errorMsg = ref('')
const mode = ref<'component' | 'full'>('component')

const urlInput = ref('')
const parsedUrl = ref<URL | null>(null)
const parsedParams = ref<{ key: string; value: string }[]>([])

const batchInput = ref('')
const batchMode = ref<'encode' | 'decode'>('encode')
const batchOutput = ref('')

interface ParamRow {
  key: string
  value: string
}

const paramColumns: DataTableColumns<ParamRow> = [
  { title: '参数名', key: 'key', width: 200 },
  { title: '值', key: 'value' },
]

const examples = [
  { label: '中文', text: '你好世界' },
  { label: 'URL', text: 'https://example.com/search?q=测试&page=1' },
  { label: '特殊字符', text: 'a=1&b=2&c=hello world' },
  { label: '路径', text: '/api/v1/users?name=张三&id=123' },
]

function doEncode(input: string): string {
  return mode.value === 'component' ? encodeURI(input) : encodeURIComponent(input)
}

function doDecode(input: string): string {
  return mode.value === 'component' ? decodeURI(input) : decodeURIComponent(input)
}

function encode() {
  errorMsg.value = ''
  try {
    result.value = doEncode(text.value)
  }
  catch (e: unknown) {
    errorMsg.value = '编码失败：' + (e instanceof Error ? e.message : String(e))
  }
}

function decode() {
  errorMsg.value = ''
  try {
    result.value = doDecode(text.value)
  }
  catch (e: unknown) {
    errorMsg.value = '解码失败：' + (e instanceof Error ? e.message : String(e))
  }
}

function encodeAll() {
  errorMsg.value = ''
  try {
    result.value = encodeURIComponent(text.value)
  }
  catch (e: unknown) {
    errorMsg.value = '编码失败：' + (e instanceof Error ? e.message : String(e))
  }
}

function autoConvert() {
  errorMsg.value = ''
  if (!text.value) return
  const looksEncoded = /^[%A-Za-z0-9_.~\-\/:=?&+#]*$/.test(text.value) && text.value.includes('%')
  try {
    if (looksEncoded) {
      result.value = decodeURIComponent(text.value)
    }
    else {
      result.value = encodeURIComponent(text.value)
    }
  }
  catch (e: unknown) {
    errorMsg.value = '转换失败：' + (e instanceof Error ? e.message : String(e))
  }
}

function clearAll() {
  text.value = ''
  result.value = ''
  errorMsg.value = ''
}

function copy(content: string) {
  if (!content) return
  navigator.clipboard.writeText(content)
  message.success('已复制')
}

function parseUrl() {
  parsedUrl.value = null
  parsedParams.value = []
  if (!urlInput.value.trim()) return
  try {
    const url = new URL(urlInput.value.trim())
    parsedUrl.value = url
    parsedParams.value = []
    url.searchParams.forEach((value, key) => {
      parsedParams.value.push({ key, value })
    })
  }
  catch (e: unknown) {
    message.error('URL 解析失败，请检查格式')
  }
}

function batchProcess() {
  batchOutput.value = ''
  const lines = batchInput.value.split('\n')
  const results = lines.map((line) => {
    try {
      return batchMode.value === 'encode' ? encodeURIComponent(line) : decodeURIComponent(line)
    }
    catch {
      return `[错误] ${line}`
    }
  })
  batchOutput.value = results.join('\n')
}
</script>

<style scoped>
.url-codec {
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.mode-switch {
  display: flex;
  justify-content: center;
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.card {
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 16px;
}

.example-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.example-btn {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
}

.parsed-result .parsed-section:not(:last-child) {
  border-bottom: 1px solid var(--n-border-color);
  padding-bottom: 16px;
}

.parsed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  font-size: 14px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.w-24 {
  width: 96px;
  flex-shrink: 0;
}

.text-sm {
  font-size: 14px;
}

.text-gray-500 {
  color: #888;
}

.font-bold {
  font-weight: 600;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
