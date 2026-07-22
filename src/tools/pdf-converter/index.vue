<template>
  <div class="pdf-converter">
    <n-alert type="info" class="mb-4">
      在浏览器端完成 PDF 转换。Word 转换仅提取文本内容，复杂排版可能丢失；图片转换按原始尺寸渲染。
    </n-alert>

    <div class="card mb-4">
      <n-upload
        accept=".pdf"
        :show-file-list="false"
        :custom-request="handleUpload"
      >
        <n-button type="primary">
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </template>
          选择 PDF 文件
        </n-button>
      </n-upload>

      <div v-if="fileName" class="file-info mt-3">
        <b>已选择：</b>{{ fileName }}（{{ formatSize(fileSize) }}）
      </div>

      <div class="toolbar mt-4">
        <n-radio-group v-model:value="mode" size="small">
          <n-radio-button value="word">转 Word</n-radio-button>
          <n-radio-button value="excel">转 Excel</n-radio-button>
          <n-radio-button value="ocr">OCR 识别</n-radio-button>
          <n-radio-button value="text">提取文本</n-radio-button>
          <n-radio-button value="images">转图片</n-radio-button>
        </n-radio-group>
      </div>

      <div class="options mt-4" v-if="mode === 'images'">
        <n-space align="center">
          <span>图片格式</span>
          <n-radio-group v-model:value="imageFormat" size="small">
            <n-radio-button value="png">PNG</n-radio-button>
            <n-radio-button value="jpeg">JPEG</n-radio-button>
          </n-radio-group>
          <span class="ml-4">缩放比例</span>
          <n-input-number v-model:value="scale" :min="0.5" :max="3" :step="0.1" />
        </n-space>
      </div>

      <n-button type="primary" class="mt-4" @click="convert" :loading="loading" :disabled="!pdfData">
        开始转换
      </n-button>
    </div>

    <div v-if="textResult || images.length || excelRows.length || ocrText" class="card">
      <div class="result-header mb-3 flex justify-between items-center flex-wrap gap-2">
        <h3 class="text-sm font-bold">转换结果</h3>
        <n-space>
          <n-button v-if="textResult" size="small" @click="downloadText">下载 TXT</n-button>
          <n-button v-if="ocrText" size="small" @click="downloadOcrText">下载 OCR 文本</n-button>
          <n-button v-if="docxBlob" size="small" @click="downloadWord">下载 Word</n-button>
          <n-button v-if="excelRows.length" size="small" @click="downloadExcel">下载 Excel</n-button>
          <n-button v-if="images.length" size="small" @click="downloadAllImages" :disabled="images.length === 1">打包下载</n-button>
        </n-space>
      </div>

      <n-input
        v-if="textResult"
        v-model:value="textResult"
        type="textarea"
        :rows="16"
        readonly
      />

      <n-input
        v-if="ocrText"
        v-model:value="ocrText"
        type="textarea"
        :rows="16"
        readonly
      />

      <div v-if="excelRows.length" class="excel-preview">
        <n-data-table
          :columns="excelColumns"
          :data="excelRows.slice(0, 20)"
          :bordered="false"
          :single-line="false"
          size="small"
          :max-height="400"
        />
        <div v-if="excelRows.length > 20" class="mt-2 text-sm text-gray-500">
          仅展示前 20 行，共 {{ excelRows.length }} 行
        </div>
      </div>

      <div v-if="images.length" class="images-grid">
        <div v-for="(img, index) in images" :key="index" class="image-card">
          <img :src="img.url" :alt="`第 ${index + 1} 页`" />
          <div class="image-actions">
            <span>第 {{ index + 1 }} 页</span>
            <n-button size="tiny" quaternary @click="downloadImage(img.url, index)">下载</n-button>
          </div>
        </div>
      </div>
    </div>

    <n-alert v-if="error" type="error" class="mt-4" closable @close="error = ''">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NUpload, NButton, NRadioGroup, NRadioButton, NInput, NInputNumber, NAlert, NSpace, NDataTable } from 'naive-ui'
import type { UploadCustomRequestOptions, DataTableColumns } from 'naive-ui'

const fileName = ref('')
const fileSize = ref(0)
const pdfData = ref<ArrayBuffer | null>(null)
const mode = ref<'word' | 'excel' | 'ocr' | 'text' | 'images'>('word')
const imageFormat = ref<'png' | 'jpeg'>('png')
const scale = ref(1.5)
const loading = ref(false)
const error = ref('')
const textResult = ref('')
const docxBlob = ref<Blob | null>(null)
const images = ref<{ url: string; name: string }[]>([])
const excelRows = ref<Record<string, string>[]>([])
const excelHeaders = ref<string[]>([])
const ocrText = ref('')

const excelColumns = computed<DataTableColumns<Record<string, string>>>(() => {
  return excelHeaders.value.map(h => ({
    title: h,
    key: h,
    ellipsis: { tooltip: true },
  }))
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function handleUpload({ file }: UploadCustomRequestOptions) {
  const uploadFile = file.file as File
  error.value = ''
  textResult.value = ''
  docxBlob.value = null
  images.value.forEach(img => URL.revokeObjectURL(img.url))
  images.value = []
  excelRows.value = []
  excelHeaders.value = []
  ocrText.value = ''

  fileName.value = uploadFile.name
  fileSize.value = uploadFile.size

  const reader = new FileReader()
  reader.onload = () => {
    pdfData.value = reader.result as ArrayBuffer
  }
  reader.readAsArrayBuffer(uploadFile)
}

async function convert() {
  if (!pdfData.value) return
  loading.value = true
  error.value = ''
  textResult.value = ''
  docxBlob.value = null
  ocrText.value = ''
  images.value.forEach(img => URL.revokeObjectURL(img.url))
  images.value = []
  excelRows.value = []
  excelHeaders.value = []

  try {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = ''

    const pdf = await pdfjs.getDocument({ data: pdfData.value }).promise
    const totalPages = pdf.numPages
    const texts: string[] = []
    const imgUrls: { url: string; name: string }[] = []

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i)

      if (mode.value === 'text' || mode.value === 'word') {
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(' ')
        texts.push(`--- 第 ${i} 页 ---\n${pageText}`)
      }

      if (mode.value === 'excel') {
        const pageData = await extractPageTable(page)
        if (pageData.length > 0) {
          if (excelRows.value.length === 0) {
            excelHeaders.value = Object.keys(pageData[0])
          }
          excelRows.value.push(...pageData)
        }
      }

      if (mode.value === 'images' || mode.value === 'ocr') {
        const viewport = page.getViewport({ scale: mode.value === 'ocr' ? 2 : scale.value })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvas, viewport }).promise

        if (mode.value === 'images') {
          const url = canvas.toDataURL(`image/${imageFormat.value}`)
          imgUrls.push({ url, name: `page-${String(i).padStart(3, '0')}.${imageFormat.value}` })
        } else {
          const pageOcr = await recognizePage(canvas)
          ocrText.value += `--- 第 ${i} 页 ---\n${pageOcr}\n\n`
        }
      }
    }

    if (mode.value === 'text') {
      textResult.value = texts.join('\n\n')
    } else if (mode.value === 'word') {
      textResult.value = texts.join('\n\n')
      await generateDocx(texts)
    } else if (mode.value === 'excel') {
      if (excelRows.value.length === 0) {
        throw new Error('未检测到表格数据，可尝试先用"提取文本"模式查看内容')
      }
    } else if (mode.value === 'ocr') {
      if (!ocrText.value.trim()) {
        throw new Error('OCR 未识别到文字')
      }
    } else if (mode.value === 'images') {
      images.value = imgUrls
    }
  } catch (e: unknown) {
    error.value = '转换失败：' + (e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

async function recognizePage(canvas: HTMLCanvasElement): Promise<string> {
  const Tesseract = await import('tesseract.js')
  const result = await Tesseract.recognize(canvas.toDataURL('image/png'), 'chi_sim+eng', {
    logger: () => {},
  })
  return result.data.text
}

async function extractPageTable(page: any): Promise<Record<string, string>[]> {
  const textContent = await page.getTextContent()
  const items = textContent.items as Array<{ str: string; transform: number[]; width: number; height: number }>

  if (items.length === 0) return []

  // 按 Y 坐标分组到行，允许 4px 误差
  const rows: Map<number, typeof items> = new Map()
  items.forEach(item => {
    const y = Math.round(item.transform[5] / 4) * 4
    if (!rows.has(y)) rows.set(y, [])
    rows.get(y)!.push(item)
  })

  const sortedRows = Array.from(rows.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([_, rowItems]) => rowItems.sort((a, b) => a.transform[4] - b.transform[4]))

  if (sortedRows.length < 2) return []

  // 根据所有 X 坐标构建统一列
  const xPositions = Array.from(new Set(
    sortedRows.flatMap(row => row.map(item => Math.round(item.transform[4] / 8) * 8))
  )).sort((a, b) => a - b)

  const headers = xPositions.map((_, i) => `列${i + 1}`)

  return sortedRows.map(row => {
    const rowData: Record<string, string> = {}
    headers.forEach(h => { rowData[h] = '' })

    row.forEach(item => {
      const x = Math.round(item.transform[4] / 8) * 8
      const index = xPositions.indexOf(x)
      if (index >= 0) {
        rowData[headers[index]] = (rowData[headers[index]] || '') + item.str
      }
    })

    return rowData
  })
}

async function generateDocx(pageTexts: string[]) {
  const docx = await import('docx')
  const { Document, Packer, Paragraph, TextRun } = docx

  const children: any[] = []
  pageTexts.forEach((page, index) => {
    if (index > 0) {
      children.push(new Paragraph({ text: '' }))
    }
    children.push(new Paragraph({
      children: [new TextRun({ text: `第 ${index + 1} 页`, bold: true })],
    }))
    children.push(new Paragraph({ text: '' }))

    const lines = page.split('\n')
    lines.forEach(line => {
      children.push(new Paragraph({ children: [new TextRun(line)] }))
    })
  })

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(doc)
  docxBlob.value = blob
}

function downloadText() {
  const blob = new Blob([textResult.value], { type: 'text/plain' })
  downloadBlob(blob, fileName.value.replace(/\.pdf$/i, '.txt'))
}

function downloadOcrText() {
  const blob = new Blob([ocrText.value], { type: 'text/plain' })
  downloadBlob(blob, fileName.value.replace(/\.pdf$/i, '-ocr.txt'))
}

function downloadWord() {
  if (!docxBlob.value) return
  downloadBlob(docxBlob.value, fileName.value.replace(/\.pdf$/i, '.docx'))
}

async function downloadExcel() {
  if (!excelRows.value.length) return
  const XLSX = await import('xlsx')
  const data = excelRows.value.map(row => {
    const obj: Record<string, string> = {}
    excelHeaders.value.forEach(h => { obj[h] = row[h] || '' })
    return obj
  })
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, fileName.value.replace(/\.pdf$/i, '.xlsx'))
}

function downloadImage(url: string, index: number) {
  const a = document.createElement('a')
  a.href = url
  a.download = `page-${String(index + 1).padStart(3, '0')}.${imageFormat.value}`
  a.click()
}

async function downloadAllImages() {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  images.value.forEach(img => {
    const base64 = img.url.split(',')[1]
    zip.file(img.name, base64, { base64: true })
  })
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, fileName.value.replace(/\.pdf$/i, '-images.zip'))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.pdf-converter { max-width: 1000px; margin: 0 auto; }

.file-info {
  font-size: 14px;
  color: #666;
}

.dark .file-info { color: #aaa; }

.options {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.image-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.dark .image-card { border-color: #2a2a4a; }

.image-card img {
  width: 100%;
  height: auto;
  display: block;
}

.image-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ml-4 { margin-left: 16px; }
</style>
