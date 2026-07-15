<template>
  <div class="pdf-split">
    <n-alert type="info" class="mb-4">
      上传 PDF 文件并按页码范围拆分为多个 PDF。处理过程在浏览器本地完成。基于 pdf-lib 实现。
    </n-alert>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">上传 PDF 文件</h3>
      <n-upload
        accept="application/pdf"
        :max="1"
        :show-file-list="false"
        @change="handleUpload"
      >
        <n-upload-dragger>
          <div class="upload-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          </div>
          <div class="upload-text">点击或拖拽 PDF 文件到此处</div>
          <div class="upload-hint">仅支持单个文件</div>
        </n-upload-dragger>
      </n-upload>

      <div class="file-info-box" v-if="pdfFile">
        <div class="file-name">
          <span class=" file-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="7" y="19" font-size="7" stroke="none" fill="currentColor">PDF</text></svg></span>
          {{ pdfFile.name }}
        </div>
        <div class="file-meta">{{ formatSize(pdfFile.size) }} · 共 {{ pageCount }} 页</div>
        <n-button size="small" quaternary type="error" @click="clearFile">移除</n-button>
      </div>
    </div>

    <div class="card mb-4" v-if="pdfFile">
      <h3 class="text-sm font-bold mb-3">拆分设置</h3>

      <div class="config-section">
        <div class="config-item" style="flex: 1; min-width: 280px;">
          <label>页码范围</label>
          <n-input
            v-model:value="rangesInput"
            placeholder="例如：1-3, 5-10, 12"
            style="width: 100%"
          />
          <div class="hint">用逗号分隔多个范围，每个范围生成一个 PDF 文件</div>
        </div>
      </div>

      <div class="range-preview mt-3" v-if="parsedRanges.length > 0">
        <div class="range-label">将拆分为 {{ parsedRanges.length }} 个文件：</div>
        <div class="range-tags">
          <n-tag v-for="(r, i) in parsedRanges" :key="i" size="small" type="info">
            文件{{ i + 1 }}: 第 {{ r.start }}-{{ r.end }} 页（{{ r.end - r.start + 1 }} 页）
          </n-tag>
        </div>
      </div>

      <div class="toolbar mt-4">
        <n-button type="primary" @click="split" :loading="splitting" :disabled="!canSplit">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg></span>
          拆分 PDF
        </n-button>
      </div>
    </div>

    <div class="card" v-if="results.length > 0">
      <h3 class="text-sm font-bold mb-3">拆分结果（{{ results.length }} 个文件）</h3>
      <div class="result-list">
        <div v-for="(item, index) in results" :key="index" class="result-item">
          <div class="result-info">
            <span class=" result-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="7" y="19" font-size="7" stroke="none" fill="currentColor">PDF</text></svg></span>
            <div>
              <div class="result-name">{{ item.name }}</div>
              <div class="result-meta">{{ formatSize(item.size) }} · {{ item.pages }} 页</div>
            </div>
          </div>
          <n-button size="small" type="primary" @click="download(item)">下载</n-button>
        </div>
      </div>
      <n-button class="mt-3" size="small" @click="downloadAll">全部下载</n-button>
    </div>

    <n-alert :type="statusType" v-if="statusMsg" class="mt-4" closable @close="statusMsg = ''">
      {{ statusMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NUpload, NUploadDragger, NInput, NAlert, NTag } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

interface RangeItem {
  start: number
  end: number
}

interface ResultItem {
  name: string
  size: number
  pages: number
  bytes: Uint8Array
}

const pdfFile = ref<File | null>(null)
const fileName = ref('')
const pageCount = ref(0)
const rangesInput = ref('')
const splitting = ref(false)
const results = ref<ResultItem[]>([])
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// 解析页码范围
const parsedRanges = computed<RangeItem[]>(() => {
  const input = rangesInput.value.trim()
  if (!input) return []
  const ranges: RangeItem[] = []
  const parts = input.split(/[,，]/).map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    const match = part.match(/^(\d+)\s*[-–]\s*(\d+)$/)
    if (match) {
      const start = parseInt(match[1])
      const end = parseInt(match[2])
      if (start > 0 && end >= start) {
        ranges.push({ start, end })
      }
    } else if (/^\d+$/.test(part)) {
      const page = parseInt(part)
      if (page > 0) {
        ranges.push({ start: page, end: page })
      }
    }
  }
  return ranges
})

// 是否可拆分
const canSplit = computed(() => {
  return pdfFile.value !== null && parsedRanges.value.length > 0 && !splitting.value
})

// 动态加载 pdf-lib CDN 脚本
function loadPdfLib(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any
    if (w.PDFLib) {
      resolve(w.PDFLib)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'
    script.async = true
    script.onload = () => {
      if (w.PDFLib) resolve(w.PDFLib)
      else reject(new Error('pdf-lib 加载失败'))
    }
    script.onerror = () => reject(new Error('pdf-lib 加载失败，请检查网络连接'))
    document.head.appendChild(script)
  })
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 处理文件上传
async function handleUpload(data: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; event?: Event }) {
  const rawFile = data.file?.file
  if (!rawFile) return
  try {
    const pdfLib = await loadPdfLib()
    const pdfDoc = await pdfLib.PDFDocument.load(await rawFile.arrayBuffer())
    pdfFile.value = rawFile
    fileName.value = rawFile.name
    pageCount.value = pdfDoc.getPageCount()
    results.value = []
    statusMsg.value = ''
  } catch (e: any) {
    statusMsg.value = '加载文件失败：' + (e.message || e)
    statusType.value = 'error'
  }
}

// 清除文件
function clearFile() {
  pdfFile.value = null
  fileName.value = ''
  pageCount.value = 0
  rangesInput.value = ''
  results.value = []
  statusMsg.value = ''
}

// 拆分 PDF
async function split() {
  if (!pdfFile.value || parsedRanges.value.length === 0) return

  splitting.value = true
  statusMsg.value = '正在拆分...'
  statusType.value = 'info'
  results.value = []

  try {
    const pdfLib = await loadPdfLib()
    const srcDoc = await pdfLib.PDFDocument.load(await pdfFile.value.arrayBuffer())
    const total = srcDoc.getPageCount()
    const baseName = fileName.value.replace(/\.pdf$/i, '') || 'document'

    for (let i = 0; i < parsedRanges.value.length; i++) {
      const range = parsedRanges.value[i]
      // 校验页码范围是否超出总页数
      if (range.end > total) {
        throw new Error(`范围 ${range.start}-${range.end} 超出总页数 ${total}`)
      }
      const newDoc = await pdfLib.PDFDocument.create()
      // pdf-lib 页码从 0 开始
      const pageIndices: number[] = []
      for (let p = range.start - 1; p <= range.end - 1; p++) {
        pageIndices.push(p)
      }
      const pages = await newDoc.copyPages(srcDoc, pageIndices)
      pages.forEach((page: any) => newDoc.addPage(page))

      const bytes = await newDoc.save()
      results.value.push({
        name: `${baseName}_${range.start}-${range.end}.pdf`,
        size: bytes.length,
        pages: range.end - range.start + 1,
        bytes,
      })
    }

    statusMsg.value = `拆分成功！共生成 ${results.value.length} 个 PDF 文件`
    statusType.value = 'success'
  } catch (e: any) {
    statusMsg.value = '拆分失败：' + (e.message || e)
    statusType.value = 'error'
  } finally {
    splitting.value = false
  }
}

// 下载单个文件
function download(item: ResultItem) {
  const blob = new Blob([item.bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = item.name
  a.click()
  URL.revokeObjectURL(url)
}

// 全部下载（依次下载）
function downloadAll() {
  results.value.forEach((item, index) => {
    setTimeout(() => download(item), index * 300)
  })
}
</script>

<style scoped>
.pdf-split {
  max-width: 1000px;
  margin: 0 auto;
}

.upload-icon {
  font-size: 40px;
  color: #888;
  margin-bottom: 8px;
}

.dark .upload-icon {
  color: #aaa;
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.file-info-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.dark .file-info-box {
  border-color: #333;
  background: #1e1e2e;
}

.file-info-box .file-name {
  flex: 1;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.file-icon {
  color: #ff5252;
  font-size: 18px;
}

.file-meta {
  font-size: 12px;
  color: #888;
}

.dark .file-meta {
  color: #aaa;
}

.config-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label {
  color: #aaa;
}

.hint {
  font-size: 12px;
  color: #888;
}

.dark .hint {
  color: #999;
}

.range-label {
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
}

.dark .range-label {
  color: #aaa;
}

.range-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar {
  display: flex;
  gap: 12px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.dark .result-item {
  border-color: #333;
  background: #1e1e2e;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-icon {
  color: #ff5252;
  font-size: 20px;
}

.result-name {
  font-size: 14px;
  font-weight: 500;
}

.result-meta {
  font-size: 12px;
  color: #888;
}

.dark .result-meta {
  color: #aaa;
}
</style>
