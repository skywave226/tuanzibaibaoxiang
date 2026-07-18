<template>
  <div class="base64-codec">
    <n-tabs v-model:value="mode" type="line" animated class="mb-4">
      <n-tab-pane name="text" tab="文本编解码">
        <div class="toolbar">
          <n-space>
            <n-button type="primary" @click="encode">编码 →</n-button>
            <n-button type="primary" @click="decode">← 解码</n-button>
            <n-button @click="copy(text)">复制原文</n-button>
            <n-button @click="copy(base64)">复制 Base64</n-button>
            <n-button @click="clearAll">清空</n-button>
          </n-space>
          <n-space>
            <n-checkbox v-model:checked="urlSafe">URL 安全（替换 +/）</n-checkbox>
          </n-space>
        </div>
        <n-alert v-if="errorMsg" type="error" class="mb-4">{{ errorMsg }}</n-alert>
        <div class="editor-area">
          <div class="editor-pane">
            <div class="pane-label">原文</div>
            <n-input
              v-model:value="text"
              type="textarea"
              placeholder="输入需要编码或解码的文本"
              rows="12"
              :autosize="false"
            />
          </div>
          <div class="editor-pane">
            <div class="pane-label">Base64</div>
            <n-input
              v-model:value="base64"
              type="textarea"
              placeholder="Base64 结果"
              rows="12"
              :autosize="false"
            />
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="file" tab="文件转 Base64">
        <n-alert type="info" class="mb-4">拖拽文件到下方，或点击上传，自动转换为 Base64 Data URL。</n-alert>
        <n-upload
          drag
          accept="*/*"
          :show-file-list="false"
          :custom-request="handleFileUpload"
          class="file-uploader"
        >
          <n-text>点击或拖拽文件到此处</n-text>
        </n-upload>

        <div v-if="fileInfo" class="file-result card mt-4">
          <div class="file-meta">
            <div><b>文件名：</b>{{ fileInfo.name }}</div>
            <div><b>类型：</b>{{ fileInfo.type || '未知' }}</div>
            <div><b>大小：</b>{{ formatSize(fileInfo.size) }}</div>
          </div>

          <div v-if="isImage" class="preview-section">
            <img :src="fileBase64" alt="预览" class="file-preview" />
          </div>
          <div v-else-if="isText" class="text-preview">
            <n-input :value="textPreview" type="textarea" readonly rows="4" />
          </div>

          <n-input :value="fileBase64" type="textarea" readonly rows="3" class="mt-3" />
          <n-space class="mt-3">
            <n-button size="small" @click="copy(fileBase64)">复制 Base64</n-button>
            <n-button size="small" @click="downloadFile">下载原文件</n-button>
          </n-space>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NInput, NTabs, NTabPane, NUpload, NAlert, NText, useMessage } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const message = useMessage()
const mode = ref('text')
const text = ref('')
const base64 = ref('')
const errorMsg = ref('')
const urlSafe = ref(false)

const fileInfo = ref<File | null>(null)
const fileBase64 = ref('')

const isImage = computed(() => fileInfo.value?.type.startsWith('image/') || false)
const isText = computed(() => {
  if (!fileInfo.value) return false
  const type = fileInfo.value.type
  return type.startsWith('text/') || type === 'application/json' || type === 'application/javascript' || type === 'application/xml'
})
const textPreview = computed(() => {
  if (!fileBase64.value) return ''
  try {
    const prefixEnd = fileBase64.value.indexOf(',')
    const b64 = prefixEnd > 0 ? fileBase64.value.slice(prefixEnd + 1) : fileBase64.value
    return decodeURIComponent(escape(atob(b64))).slice(0, 500)
  }
  catch {
    return ''
  }
})

function toBase64(str: string): string {
  let result = btoa(unescape(encodeURIComponent(str)))
  if (urlSafe.value) {
    result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  return result
}

function fromBase64(str: string): string {
  let input = str.replace(/\s/g, '')
  if (urlSafe.value) {
    input = input.replace(/-/g, '+').replace(/_/g, '/')
    while (input.length % 4) input += '='
  }
  return decodeURIComponent(escape(atob(input)))
}

function encode() {
  try {
    base64.value = toBase64(text.value)
    errorMsg.value = ''
  }
  catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
  }
}

function decode() {
  try {
    text.value = fromBase64(base64.value)
    errorMsg.value = ''
  }
  catch (e: unknown) {
    errorMsg.value = '解码失败，请检查 Base64 格式'
  }
}

function clearAll() {
  text.value = ''
  base64.value = ''
  errorMsg.value = ''
}

function copy(content: string) {
  if (!content) return
  navigator.clipboard.writeText(content)
  message.success('已复制')
}

function handleFileUpload({ file }: UploadCustomRequestOptions) {
  const f = file.file as File
  if (!f) return
  fileInfo.value = f
  const reader = new FileReader()
  reader.onload = (e) => {
    fileBase64.value = e.target?.result as string
    message.success('文件已转换')
  }
  reader.onerror = () => {
    message.error('文件读取失败')
  }
  reader.readAsDataURL(f)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function downloadFile() {
  if (!fileBase64.value || !fileInfo.value) return
  const a = document.createElement('a')
  a.href = fileBase64.value
  a.download = fileInfo.value.name
  a.click()
}
</script>

<style scoped>
.base64-codec {
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

.file-uploader {
  width: 100%;
}

.file-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}

.preview-section {
  text-align: center;
  margin-bottom: 12px;
}

.file-preview {
  max-width: 100%;
  max-height: 300px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.text-preview {
  margin-bottom: 12px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
