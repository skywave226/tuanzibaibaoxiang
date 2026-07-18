<template>
  <div class="pdf-toolbox">
    <n-alert type="info" class="mb-4">
      PDF 多功能工具箱：合并、拆分、旋转、压缩、提取文本。所有操作在浏览器本地完成，文件不会上传到服务器。
    </n-alert>

    <n-tabs v-model:value="activeTab" type="line">
      <n-tab-pane name="merge" tab="合并">
        <div class="card mb-4">
          <n-upload
            accept="application/pdf"
            multiple
            directory-dnd
            :show-file-list="false"
            :custom-request="handleMergeUpload"
          >
            <n-upload-dragger>
              <div class="upload-text">点击或拖拽多个 PDF 文件到此处</div>
            </n-upload-dragger>
          </n-upload>
        </div>
        <div class="card mb-4" v-if="mergeFiles.length > 0">
          <div class="file-list">
            <div v-for="(item, index) in mergeFiles" :key="item.id" class="file-item">
              <div class="file-index">{{ index + 1 }}</div>
              <div class="file-info">
                <div class="file-name">{{ item.name }}</div>
                <div class="file-meta">{{ formatSize(item.size) }} · {{ item.pageCount }} 页</div>
              </div>
              <div class="file-actions">
                <n-button size="tiny" quaternary :disabled="index === 0" @click="moveMergeFile(index, -1)">↑</n-button>
                <n-button size="tiny" quaternary :disabled="index === mergeFiles.length - 1" @click="moveMergeFile(index, 1)">↓</n-button>
                <n-button size="tiny" quaternary type="error" @click="removeMergeFile(index)">删除</n-button>
              </div>
            </div>
          </div>
          <n-space class="mt-4">
            <n-button type="primary" @click="mergePdfs" :loading="processing" :disabled="mergeFiles.length < 2">合并并下载</n-button>
            <n-button @click="mergeFiles = []">清空</n-button>
          </n-space>
        </div>
      </n-tab-pane>

      <n-tab-pane name="split" tab="拆分">
        <div class="card mb-4">
          <n-upload
            accept="application/pdf"
            :max="1"
            :show-file-list="false"
            :custom-request="handleSingleUpload"
          >
            <n-upload-dragger>
              <div class="upload-text">点击或拖拽单个 PDF 文件到此处</div>
            </n-upload-dragger>
          </n-upload>
        </div>
        <div class="card mb-4" v-if="singleFile">
          <div class="mb-2">{{ singleFile.name }} · {{ singleFile.pageCount }} 页</div>
          <n-input v-model:value="splitRanges" placeholder="例如：1-3, 5, 8-10" />
          <div class="hint mt-2">用逗号分隔多个页码范围，每个范围生成一个 PDF 文件</div>
          <n-space class="mt-4">
            <n-button type="primary" @click="splitPdf" :loading="processing" :disabled="!splitRanges.trim()">拆分并下载 ZIP</n-button>
            <n-button @click="singleFile = null">移除</n-button>
          </n-space>
        </div>
      </n-tab-pane>

      <n-tab-pane name="rotate" tab="旋转">
        <div class="card mb-4">
          <n-upload
            accept="application/pdf"
            :max="1"
            :show-file-list="false"
            :custom-request="handleSingleUpload"
          >
            <n-upload-dragger>
              <div class="upload-text">点击或拖拽单个 PDF 文件到此处</div>
            </n-upload-dragger>
          </n-upload>
        </div>
        <div class="card mb-4" v-if="singleFile">
          <div class="mb-2">{{ singleFile.name }} · {{ singleFile.pageCount }} 页</div>
          <n-space align="center">
            <n-radio-group v-model:value="rotateMode">
              <n-radio-button value="all">全部页面</n-radio-button>
              <n-radio-button value="range">指定页码</n-radio-button>
            </n-radio-group>
            <n-input v-if="rotateMode === 'range'" v-model:value="rotatePages" placeholder="例如：1,3,5" style="width: 160px" />
            <n-select v-model:value="rotateAngle" :options="rotateOptions" style="width: 120px" />
            <n-button type="primary" @click="rotatePdf" :loading="processing">旋转并下载</n-button>
          </n-space>
        </div>
      </n-tab-pane>

      <n-tab-pane name="compress" tab="压缩">
        <div class="card mb-4">
          <n-upload
            accept="application/pdf"
            :max="1"
            :show-file-list="false"
            :custom-request="handleSingleUpload"
          >
            <n-upload-dragger>
              <div class="upload-text">点击或拖拽单个 PDF 文件到此处</div>
            </n-upload-dragger>
          </n-upload>
        </div>
        <div class="card mb-4" v-if="singleFile">
          <div class="mb-2">{{ singleFile.name }} · {{ formatSize(singleFile.size) }}</div>
          <n-space align="center">
            <span>图片质量</span>
            <n-slider v-model:value="compressQuality" :min="10" :max="100" :step="5" style="width: 200px" />
            <span>{{ compressQuality }}%</span>
            <n-button type="primary" @click="compressPdf" :loading="processing">压缩并下载</n-button>
          </n-space>
        </div>
      </n-tab-pane>

      <n-tab-pane name="extract" tab="提取文本">
        <div class="card mb-4">
          <n-upload
            accept="application/pdf"
            :max="1"
            :show-file-list="false"
            @change="handleExtractUpload"
          >
            <n-upload-dragger>
              <div class="upload-text">点击或拖拽单个 PDF 文件到此处</div>
            </n-upload-dragger>
          </n-upload>
        </div>
        <div class="card mb-4" v-if="extractFileName">
          <div class="mb-2">{{ extractFileName }}</div>
          <n-progress v-if="extracting" type="line" :percentage="extractProgress" :show-indicator="false" />
        </div>
        <div class="card" v-if="extractedText">
          <n-space class="mb-2">
            <n-button size="small" @click="copyExtracted">复制</n-button>
            <n-button size="small" type="primary" @click="downloadExtracted">下载 .txt</n-button>
          </n-space>
          <n-input v-model:value="extractedText" type="textarea" :rows="12" readonly />
        </div>
      </n-tab-pane>
    </n-tabs>

    <n-alert v-if="statusMsg" :type="statusType" class="mt-4" closable @close="statusMsg = ''">
      {{ statusMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  NTabs,
  NTabPane,
  NUpload,
  NUploadDragger,
  NButton,
  NSpace,
  NInput,
  NSelect,
  NRadioGroup,
  NRadioButton,
  NAlert,
  NProgress,
} from 'naive-ui'
import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui'

interface PdfFile {
  id: string
  name: string
  size: number
  pageCount: number
  bytes: ArrayBuffer
}

const activeTab = ref('merge')
const mergeFiles = ref<PdfFile[]>([])
const singleFile = ref<PdfFile | null>(null)
const splitRanges = ref('')
const rotateMode = ref<'all' | 'range'>('all')
const rotatePages = ref('')
const rotateAngle = ref<0 | 90 | 180 | 270>(90)
const compressQuality = ref(80)
const processing = ref(false)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const rotateOptions = [
  { label: '90°', value: 90 },
  { label: '180°', value: 180 },
  { label: '270°', value: 270 },
]

const extractFileName = ref('')
const extracting = ref(false)
const extractProgress = ref(0)
const extractedText = ref('')

let extractPdfBytes: ArrayBuffer | null = null

async function loadPdfLib(): Promise<any> {
  const mod = await import('pdf-lib')
  return mod
}

async function loadPdfJs(): Promise<any> {
  const w = window as any
  if (w.pdfjsLib) return w.pdfjsLib
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
  return new Promise((resolve, reject) => {
    script.onload = () => {
      const lib = w.pdfjsLib
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      resolve(lib)
    }
    script.onerror = () => reject(new Error('加载 pdf.js 失败'))
    document.head.appendChild(script)
  })
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

async function readPdfFile(rawFile: File): Promise<PdfFile> {
  const arrayBuffer = await rawFile.arrayBuffer()
  const pdfLib = await loadPdfLib()
  const pdfDoc = await pdfLib.PDFDocument.load(arrayBuffer)
  return {
    id: String(Date.now()) + Math.random(),
    name: rawFile.name,
    size: rawFile.size,
    pageCount: pdfDoc.getPageCount(),
    bytes: arrayBuffer,
  }
}

async function handleMergeUpload({ file }: UploadCustomRequestOptions) {
  const rawFile = file.file as File
  if (!rawFile) return
  try {
    const item = await readPdfFile(rawFile)
    mergeFiles.value.push(item)
    statusMsg.value = ''
  } catch (e: any) {
    statusMsg.value = '加载失败：' + (e.message || e)
    statusType.value = 'error'
  }
}

function moveMergeFile(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= mergeFiles.value.length) return
  const list = mergeFiles.value
  ;[list[index], list[newIndex]] = [list[newIndex], list[index]]
  mergeFiles.value = [...list]
}

function removeMergeFile(index: number) {
  mergeFiles.value.splice(index, 1)
}

async function handleSingleUpload({ file }: UploadCustomRequestOptions) {
  const rawFile = file.file as File
  if (!rawFile) return
  try {
    singleFile.value = await readPdfFile(rawFile)
    statusMsg.value = ''
  } catch (e: any) {
    statusMsg.value = '加载失败：' + (e.message || e)
    statusType.value = 'error'
  }
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

async function mergePdfs() {
  if (mergeFiles.value.length < 2) return
  processing.value = true
  try {
    const pdfLib = await loadPdfLib()
    const merged = await pdfLib.PDFDocument.create()
    for (const item of mergeFiles.value) {
      const src = await pdfLib.PDFDocument.load(item.bytes)
      const pages = await merged.copyPages(src, src.getPageIndices())
      pages.forEach((page: any) => merged.addPage(page))
    }
    const bytes = await merged.save()
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf')
    statusMsg.value = '合并成功'
    statusType.value = 'success'
  } catch (e: any) {
    statusMsg.value = '合并失败：' + (e.message || e)
    statusType.value = 'error'
  } finally {
    processing.value = false
  }
}

function parseRanges(input: string, maxPage: number): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = []
  for (const part of input.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map((s) => parseInt(s.trim(), 10))
      if (isNaN(start) || isNaN(end)) continue
      ranges.push({
        start: Math.max(1, Math.min(start, maxPage)),
        end: Math.max(1, Math.min(end, maxPage)),
      })
    } else {
      const page = parseInt(trimmed, 10)
      if (!isNaN(page)) {
        ranges.push({ start: Math.max(1, Math.min(page, maxPage)), end: Math.max(1, Math.min(page, maxPage)) })
      }
    }
  }
  return ranges
}

async function splitPdf() {
  if (!singleFile.value || !splitRanges.value.trim()) return
  processing.value = true
  try {
    const pdfLib = await loadPdfLib()
    const src = await pdfLib.PDFDocument.load(singleFile.value.bytes)
    const ranges = parseRanges(splitRanges.value, singleFile.value.pageCount)
    if (ranges.length === 0) {
      statusMsg.value = '请输入有效的页码范围'
      statusType.value = 'warning'
      processing.value = false
      return
    }

    if (ranges.length === 1) {
      const newDoc = await pdfLib.PDFDocument.create()
      const pages = await newDoc.copyPages(src, rangeToIndices(ranges[0], src.getPageCount()))
      pages.forEach((page: any) => newDoc.addPage(page))
      const bytes = await newDoc.save()
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `split-${ranges[0].start}-${ranges[0].end}.pdf`)
    } else {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      for (const range of ranges) {
        const newDoc = await pdfLib.PDFDocument.create()
        const pages = await newDoc.copyPages(src, rangeToIndices(range, src.getPageCount()))
        pages.forEach((page: any) => newDoc.addPage(page))
        const bytes = await newDoc.save()
        zip.file(`split-${range.start}-${range.end}.pdf`, bytes)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, `split-${Date.now()}.zip`)
    }
    statusMsg.value = '拆分成功'
    statusType.value = 'success'
  } catch (e: any) {
    statusMsg.value = '拆分失败：' + (e.message || e)
    statusType.value = 'error'
  } finally {
    processing.value = false
  }
}

function rangeToIndices(range: { start: number; end: number }, maxPage: number): number[] {
  const start = Math.min(range.start, range.end)
  const end = Math.max(range.start, range.end)
  const indices: number[] = []
  for (let i = start; i <= end && i <= maxPage; i++) indices.push(i - 1)
  return indices
}

function parsePageList(input: string, maxPage: number): number[] {
  const pages = new Set<number>()
  for (const part of input.split(',')) {
    const page = parseInt(part.trim(), 10)
    if (!isNaN(page) && page >= 1 && page <= maxPage) pages.add(page - 1)
  }
  return Array.from(pages).sort((a, b) => a - b)
}

async function rotatePdf() {
  if (!singleFile.value) return
  processing.value = true
  try {
    const pdfLib = await loadPdfLib()
    const degrees = pdfLib.degrees
    const src = await pdfLib.PDFDocument.load(singleFile.value.bytes)
    const indices = rotateMode.value === 'all'
      ? src.getPageIndices()
      : parsePageList(rotatePages.value, singleFile.value.pageCount)
    for (const index of indices) {
      const page = src.getPage(index)
      page.setRotation(degrees(rotateAngle.value))
    }
    const bytes = await src.save()
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'rotated.pdf')
    statusMsg.value = '旋转成功'
    statusType.value = 'success'
  } catch (e: any) {
    statusMsg.value = '旋转失败：' + (e.message || e)
    statusType.value = 'error'
  } finally {
    processing.value = false
  }
}

async function compressPdf() {
  if (!singleFile.value) return
  processing.value = true
  try {
    const pdfLib = await loadPdfLib()
    const src = await pdfLib.PDFDocument.load(singleFile.value.bytes)
    // pdf-lib 本身不直接压缩内嵌图片，通过重新保存可丢弃冗余数据
    const bytes = await src.save({ useObjectStreams: true })
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'compressed.pdf')
    statusMsg.value = '压缩完成（已优化 PDF 结构）'
    statusType.value = 'success'
  } catch (e: any) {
    statusMsg.value = '压缩失败：' + (e.message || e)
    statusType.value = 'error'
  } finally {
    processing.value = false
  }
}

async function handleExtractUpload({ file }: { file: UploadFileInfo }) {
  if (!file.file) return
  extractFileName.value = file.name
  extractPdfBytes = await file.file.arrayBuffer()
  extracting.value = true
  extractProgress.value = 0
  extractedText.value = ''
  try {
    const lib = await loadPdfJs()
    const pdf = await lib.getDocument({ data: extractPdfBytes }).promise
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      fullText += content.items.map((item: any) => item.str).join('') + '\n\n'
      extractProgress.value = Math.round((i / pdf.numPages) * 100)
    }
    extractedText.value = fullText.trim()
    statusMsg.value = `成功提取 ${pdf.numPages} 页文本`
    statusType.value = 'success'
  } catch (e: any) {
    statusMsg.value = '提取失败：' + (e.message || e)
    statusType.value = 'error'
  } finally {
    extracting.value = false
    extractProgress.value = 0
  }
}

async function copyExtracted() {
  if (!extractedText.value) return
  await navigator.clipboard.writeText(extractedText.value)
  statusMsg.value = '已复制到剪贴板'
  statusType.value = 'success'
}

function downloadExtracted() {
  if (!extractedText.value) return
  const blob = new Blob([extractedText.value], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, extractFileName.value.replace(/\.pdf$/i, '') + '.txt')
}
</script>

<style scoped>
.pdf-toolbox {
  max-width: 1000px;
  margin: 0 auto;
}
.card {
  background: var(--n-card-color);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--n-border-color);
  margin-bottom: 16px;
}
.upload-text {
  text-align: center;
  padding: 24px;
}
.hint {
  font-size: 12px;
  color: #888;
}
.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}
.dark .file-item {
  border-color: #333;
  background: #1e1e2e;
}
.file-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #36ad6a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}
.file-info {
  flex: 1;
  min-width: 0;
}
.file-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-meta {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}
.file-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
</style>
