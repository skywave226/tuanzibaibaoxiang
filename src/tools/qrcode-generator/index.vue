<template>
  <div class="qrcode-generator">
    <n-alert type="info" class="mb-4">
      支持单条 / 批量生成二维码，可自定义颜色、纠错等级、中心 Logo，并导出 PNG / SVG。
    </n-alert>

    <n-tabs v-model:value="activeTab" type="line" animated class="mb-4">
      <n-tab-pane name="single" tab="单个生成">
        <div class="card mb-4">
          <div class="form-row">
            <n-input v-model:value="text" type="textarea" :rows="3" placeholder="输入文本、链接、WiFi 密码等内容" />
          </div>

          <div class="options-grid mt-4">
            <div class="option-item">
              <span class="option-label">前景色</span>
              <n-color-picker v-model:value="fgColor" :swatches="colorSwatches" />
            </div>
            <div class="option-item">
              <span class="option-label">背景色</span>
              <n-color-picker v-model:value="bgColor" :swatches="colorSwatches" />
            </div>
            <div class="option-item">
              <span class="option-label">尺寸</span>
              <n-select v-model:value="size" :options="sizeOptions" />
            </div>
            <div class="option-item">
              <span class="option-label">纠错等级</span>
              <n-select v-model:value="errorCorrectionLevel" :options="errorOptions" />
            </div>
          </div>

          <div class="logo-section mt-4">
            <div class="section-header mb-2">
              <span class="option-label">中心 Logo</span>
              <n-button v-if="logoUrl" size="tiny" quaternary type="error" @click="clearLogo">清除</n-button>
            </div>
            <n-upload
              accept="image/*"
              :show-file-list="false"
              :custom-request="handleLogoUpload"
            >
              <n-button size="small" dashed>上传 Logo</n-button>
            </n-upload>
            <img v-if="logoUrl" :src="logoUrl" class="logo-preview" alt="Logo 预览" />
          </div>

          <div class="actions mt-4">
            <n-button type="primary" @click="generateSingle" :loading="generating">生成二维码</n-button>
          </div>
        </div>

        <div v-if="singleResult" class="card result-card">
          <img :src="singleResult" alt="二维码" class="qrcode-img" />
          <n-space>
            <n-button size="small" @click="downloadPng(singleResult, text)">下载 PNG</n-button>
            <n-button size="small" @click="downloadSvg">下载 SVG</n-button>
            <n-button size="small" @click="copyImage(singleResult)">复制图片</n-button>
          </n-space>
        </div>
      </n-tab-pane>

      <n-tab-pane name="batch" tab="批量生成">
        <div class="card mb-4">
          <n-input v-model:value="batchText" type="textarea" :rows="6" placeholder="每行一个内容，将分别为每行内容生成二维码" />
          <div class="options-grid mt-4">
            <div class="option-item">
              <span class="option-label">前景色</span>
              <n-color-picker v-model:value="fgColor" :swatches="colorSwatches" />
            </div>
            <div class="option-item">
              <span class="option-label">背景色</span>
              <n-color-picker v-model:value="bgColor" :swatches="colorSwatches" />
            </div>
            <div class="option-item">
              <span class="option-label">尺寸</span>
              <n-select v-model:value="size" :options="sizeOptions" />
            </div>
            <div class="option-item">
              <span class="option-label">纠错等级</span>
              <n-select v-model:value="errorCorrectionLevel" :options="errorOptions" />
            </div>
          </div>
          <div class="actions mt-4">
            <n-button type="primary" @click="generateBatch" :loading="generating">批量生成</n-button>
            <n-button v-if="batchResults.length" size="small" @click="downloadBatchZip">打包下载 ZIP</n-button>
          </div>
        </div>

        <div v-if="batchResults.length" class="batch-results">
          <div v-for="(item, index) in batchResults" :key="index" class="batch-item card">
            <img :src="item.dataUrl" alt="二维码" />
            <div class="batch-text" :title="item.text">{{ item.text }}</div>
            <n-button size="tiny" @click="downloadPng(item.dataUrl, item.text)">下载</n-button>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="history" tab="历史记录">
        <div class="card">
          <div class="section-header mb-3">
            <span class="pane-label">生成历史</span>
            <n-button size="small" type="error" dashed @click="clearHistory">清空历史</n-button>
          </div>
          <n-empty v-if="history.length === 0" description="暂无生成历史" />
          <div v-else class="history-list">
            <div v-for="item in history" :key="item.id" class="history-item">
              <img :src="item.dataUrl" alt="二维码" />
              <div class="history-info">
                <div class="history-text" :title="item.text">{{ item.text }}</div>
                <div class="history-meta">{{ formatTime(item.timestamp) }}</div>
              </div>
              <n-space>
                <n-button size="tiny" @click="downloadPng(item.dataUrl, item.text)">下载</n-button>
                <n-button size="tiny" quaternary @click="loadFromHistory(item)">复用</n-button>
              </n-space>
            </div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NInput, NButton, NColorPicker, NSelect, NTabs, NTabPane, NAlert, NSpace, NUpload, NEmpty } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

interface BatchItem {
  text: string
  dataUrl: string
}

interface HistoryItem {
  id: string
  text: string
  dataUrl: string
  fgColor: string
  bgColor: string
  size: number
  errorCorrectionLevel: string
  timestamp: number
}

const HISTORY_KEY = 'qrcode_generator_history'

const activeTab = ref('single')
const text = ref('')
const batchText = ref('')
const fgColor = ref('#000000')
const bgColor = ref('#ffffff')
const size = ref(300)
const errorCorrectionLevel = ref<'L' | 'M' | 'Q' | 'H'>('M')
const generating = ref(false)
const singleResult = ref('')
const batchResults = ref<BatchItem[]>([])
const logoUrl = ref('')
const logoFile = ref<File | null>(null)
const history = ref<HistoryItem[]>([])

const colorSwatches = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff6600', '#9900ff']
const sizeOptions = [
  { label: '200x200', value: 200 },
  { label: '300x300', value: 300 },
  { label: '400x400', value: 400 },
  { label: '500x500', value: 500 },
  { label: '800x800', value: 800 },
]
const errorOptions = [
  { label: 'L（低）', value: 'L' },
  { label: 'M（中）', value: 'M' },
  { label: 'Q（较高）', value: 'Q' },
  { label: 'H（高）', value: 'H' },
]

onMounted(() => {
  loadHistory()
})

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as HistoryItem[]
      if (Array.isArray(parsed)) history.value = parsed
    }
  }
  catch {
    // ignore
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value.slice(0, 50)))
}

function clearHistory() {
  history.value = []
  saveHistory()
}

function addHistory(dataUrl: string) {
  const item: HistoryItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    text: text.value,
    dataUrl,
    fgColor: fgColor.value,
    bgColor: bgColor.value,
    size: size.value,
    errorCorrectionLevel: errorCorrectionLevel.value,
    timestamp: Date.now(),
  }
  history.value.unshift(item)
  saveHistory()
}

function loadFromHistory(item: HistoryItem) {
  text.value = item.text
  fgColor.value = item.fgColor
  bgColor.value = item.bgColor
  size.value = item.size
  errorCorrectionLevel.value = item.errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H'
  singleResult.value = item.dataUrl
  activeTab.value = 'single'
}

function handleLogoUpload({ file }: UploadCustomRequestOptions) {
  logoFile.value = file.file as File
  const reader = new FileReader()
  reader.onload = (e) => {
    logoUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(logoFile.value)
}

function clearLogo() {
  logoUrl.value = ''
  logoFile.value = null
}

async function generateQrDataUrl(input: string): Promise<string> {
  const QRCode = await import('qrcode')
  const baseDataUrl = await QRCode.toDataURL(input, {
    width: size.value,
    color: {
      dark: fgColor.value,
      light: bgColor.value,
    },
    errorCorrectionLevel: errorCorrectionLevel.value,
    margin: 2,
  })

  if (!logoUrl.value) return baseDataUrl

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return resolve(baseDataUrl)

    const qrImg = new Image()
    qrImg.crossOrigin = 'anonymous'
    qrImg.onload = () => {
      canvas.width = qrImg.width
      canvas.height = qrImg.height
      ctx.drawImage(qrImg, 0, 0)

      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      logoImg.onload = () => {
        const logoSize = Math.round(canvas.width * 0.2)
        const x = (canvas.width - logoSize) / 2
        const y = (canvas.height - logoSize) / 2
        ctx.fillStyle = bgColor.value
        ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8)
        ctx.drawImage(logoImg, x, y, logoSize, logoSize)
        resolve(canvas.toDataURL('image/png'))
      }
      logoImg.onerror = () => resolve(baseDataUrl)
      logoImg.src = logoUrl.value
    }
    qrImg.onerror = () => resolve(baseDataUrl)
    qrImg.src = baseDataUrl
  })
}

async function generateSingle() {
  if (!text.value.trim()) return
  generating.value = true
  try {
    singleResult.value = await generateQrDataUrl(text.value.trim())
    addHistory(singleResult.value)
  }
  finally {
    generating.value = false
  }
}

async function generateBatch() {
  const lines = batchText.value.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return
  generating.value = true
  batchResults.value = []
  try {
    for (const line of lines) {
      const dataUrl = await generateQrDataUrl(line)
      batchResults.value.push({ text: line, dataUrl })
    }
  }
  finally {
    generating.value = false
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\-_]/g, '_').slice(0, 50) || 'qrcode'
}

function downloadPng(dataUrl: string, name: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${sanitizeFileName(name)}.png`
  a.click()
}

async function downloadSvg() {
  if (!text.value.trim()) return
  const QRCode = await import('qrcode')
  const svg = await QRCode.toString(text.value.trim(), {
    type: 'svg',
    width: size.value,
    color: {
      dark: fgColor.value,
      light: bgColor.value,
    },
    errorCorrectionLevel: errorCorrectionLevel.value,
    margin: 2,
  })
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFileName(text.value)}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

async function copyImage(dataUrl: string) {
  try {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
  }
  catch {
    // ignore
  }
}

async function downloadBatchZip() {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  batchResults.value.forEach((item, index) => {
    const base64 = item.dataUrl.split(',')[1]
    zip.file(`${sanitizeFileName(item.text) || `qrcode_${index + 1}`}.png`, base64, { base64: true })
  })
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = 'qrcodes.zip'
  a.click()
  URL.revokeObjectURL(url)
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.qrcode-generator {
  max-width: 900px;
  margin: 0 auto;
}

.card {
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-preview {
  margin-top: 12px;
  max-width: 80px;
  max-height: 80px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 4px;
}

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.result-card {
  text-align: center;
}

.qrcode-img {
  max-width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 16px;
}

.batch-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.batch-item {
  text-align: center;
}

.batch-item img {
  width: 100%;
  max-width: 160px;
  margin-bottom: 8px;
  border-radius: 8px;
}

.batch-text {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.history-item img {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-meta {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}
</style>
