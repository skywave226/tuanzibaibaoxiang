<template>
  <div class="image-table-recognizer">
    <!-- 图片上传 -->
    <ImageUploader
      v-if="!imageSrc"
      @imageSelected="handleImageSelected"
    />

    <!-- 图片预览 -->
    <ImagePreview
      v-else
      :imageSrc="imageSrc"
      :fileName="fileName"
      @clear="handleClear"
    />

    <!-- 处理进度 -->
    <ProgressBar
      v-if="processing"
      :loading="processing"
      :progress="processProgress"
      label="图片处理中..."
      class="mt-4"
    />

    <!-- 表格检测进度 -->
    <ProgressBar
      v-if="detecting"
      :loading="detecting"
      :progress="detectProgress"
      label="表格结构检测中..."
      class="mt-4"
    />

    <!-- OCR 进度 -->
    <ProgressBar
      v-if="recognizing"
      :loading="recognizing"
      :progress="ocrProgress"
      label="文字识别中..."
      class="mt-4"
    />

    <!-- 表格编辑器 -->
    <TableEditor
      v-if="tableData"
      :table="tableData"
      @update:table="tableData = $event"
      @clear="handleClearTable"
      class="mt-4"
    />

    <!-- 导出按钮 -->
    <ExportButtons
      v-if="tableData"
      @export="handleExport"
      class="mt-4"
    />

    <!-- 操作按钮 -->
    <div class="card mt-4" v-if="imageSrc && !processing && !detecting && !recognizing">
      <n-space>
        <n-button type="primary" @click="handleRecognize" :loading="recognizing || detecting">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg></span>
          开始识别
        </n-button>
        <n-button @click="handleClear">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
          重新上传
        </n-button>
      </n-space>
    </div>

    <!-- 错误提示 -->
    <n-alert type="error" v-if="errorMsg" class="mt-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace, NAlert } from 'naive-ui'
import ImageUploader from './components/ImageUploader.vue'
import ImagePreview from './components/ImagePreview.vue'
import ProgressBar from './components/ProgressBar.vue'
import TableEditor from './components/TableEditor.vue'
import ExportButtons from './components/ExportButtons.vue'
import { useImageProcessor } from './composables/useImageProcessor'
import { useTableDetector, type TableCell } from './composables/useTableDetector'
import { useOCR } from './composables/useOCR'
import { useTableExporter } from './composables/useTableExporter'

const imageSrc = ref('')
const fileName = ref('')
const processing = ref(false)
const processProgress = ref(0)
const detecting = ref(false)
const detectProgress = ref(0)
const recognizing = ref(false)
const ocrProgress = ref(0)
const errorMsg = ref('')

const tableData = ref<{
  rows: number
  cols: number
  cells: TableCell[]
} | null>(null)

const { processImage } = useImageProcessor()
const { detectTable, cropCell } = useTableDetector()
const { recognize } = useOCR()
const { exportToCSV, exportToExcel, exportToHTML, exportToMarkdown } = useTableExporter()

function handleImageSelected(src: string, name: string) {
  imageSrc.value = src
  fileName.value = name
  tableData.value = null
  errorMsg.value = ''
}

async function handleRecognize() {
  if (!imageSrc.value) return

  errorMsg.value = ''
  tableData.value = null

  try {
    // 步骤 1: 图片预处理
    processing.value = true
    processProgress.value = 0
    const processed = await processImage(imageSrc.value)
    processing.value = false

    // 步骤 2: 表格结构检测
    detecting.value = true
    detectProgress.value = 0
    const structure = await detectTable(processed.processed)
    detecting.value = false

    // 步骤 3: 逐单元格 OCR 识别
    recognizing.value = true
    ocrProgress.value = 0
    const totalCells = structure.cells.length
    let completedCells = 0

    const recognizedCells: TableCell[] = []

    for (const cell of structure.cells) {
      try {
        // 裁剪单元格
        const cellImage = await cropCell(processed.processed, cell)

        // OCR 识别
        const result = await recognize(cellImage, 'chi_sim+eng')
        recognizedCells.push({
          ...cell,
          text: result.text.trim(),
        })
      } catch (e) {
        recognizedCells.push({
          ...cell,
          text: '',
        })
      }

      completedCells++
      ocrProgress.value = Math.round((completedCells / totalCells) * 100)
    }

    tableData.value = {
      rows: structure.rows,
      cols: structure.cols,
      cells: recognizedCells,
    }

    recognizing.value = false
  } catch (e: unknown) {
    errorMsg.value = (e instanceof Error ? e.message : String(e)) || '识别失败，请重试'
    recognizing.value = false
    detecting.value = false
    processing.value = false
  }
}

function handleClear() {
  imageSrc.value = ''
  fileName.value = ''
  tableData.value = null
  errorMsg.value = ''
}

function handleClearTable() {
  if (tableData.value) {
    tableData.value = {
      ...tableData.value,
      cells: tableData.value.cells.map(c => ({ ...c, text: '' })),
    }
  }
}

async function handleExport(format: 'csv' | 'excel' | 'html' | 'markdown') {
  if (!tableData.value) return

  const baseName = fileName.value.replace(/\.[^.]+$/, '') || 'table'

  switch (format) {
    case 'csv':
      exportToCSV(tableData.value.cells, `${baseName}.csv`)
      break
    case 'excel':
      await exportToExcel(tableData.value.cells, `${baseName}.xlsx`)
      break
    case 'html':
      exportToHTML(tableData.value.cells, `${baseName}.html`)
      break
    case 'markdown':
      exportToMarkdown(tableData.value.cells, `${baseName}.md`)
      break
  }
}
</script>

<style scoped>
.image-table-recognizer {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
