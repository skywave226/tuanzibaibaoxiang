<template>
  <div class="excel-to-csv">
    <!-- 文件上传区域 -->
    <n-upload
      :show-file-list="false"
      accept=".xlsx,.xls"
      :multiple="false"
      @change="handleUpload"
    >
      <n-upload-dragger class="upload-dragger">
        <div class="upload-inner">
          <span class=" upload-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="10" y2="17"/></svg></span>
          <p class="upload-text">点击或拖拽 Excel 文件到此处</p>
          <p class="upload-hint">支持 .xlsx / .xls 格式</p>
        </div>
      </n-upload-dragger>
    </n-upload>

    <!-- 文件信息 -->
    <div class="card mt-4" v-if="fileName">
      <div class="file-info">
        <span class="file-name">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
          {{ fileName }}
        </span>
        <span class="file-meta" v-if="fileSize">（{{ fileSize }}）</span>
      </div>
    </div>

    <!-- 解析中提示 -->
    <div class="card mt-4" v-if="parsing">
      <div class="loading-row">
        <span class="loading-text">正在解析 Excel 文件...</span>
        <span class="loading-hint">首次使用需加载 xlsx 库，请稍候</span>
      </div>
    </div>

    <!-- 工作表选择 -->
    <div class="card mt-4" v-if="sheetNames.length > 0">
      <div class="config-title mb-2">选择工作表</div>
      <n-select
        v-model:value="selectedSheet"
        :options="sheetOptions"
        placeholder="选择要转换的工作表"
        @update:value="onSheetChange"
      />
    </div>

    <!-- CSV 配置 -->
    <div class="card mt-4" v-if="csvOutput">
      <div class="config-title mb-2">CSV 选项</div>
      <div class="config-grid">
        <div class="config-item">
          <label>分隔符</label>
          <n-select
            v-model:value="delimiter"
            :options="delimiterOptions"
            size="small"
          />
        </div>
        <div class="config-item">
          <label>换行符</label>
          <n-select
            v-model:value="lineEnding"
            :options="lineEndingOptions"
            size="small"
          />
        </div>
        <div class="config-item">
          <label>BOM 头</label>
          <n-switch v-model:value="withBom" size="small" />
        </div>
      </div>
    </div>

    <!-- CSV 输出 -->
    <div class="card mt-4" v-if="csvOutput">
      <div class="result-header">
        <div class="result-title">CSV 输出</div>
        <n-space>
          <n-button size="small" @click="copyCsv">复制</n-button>
          <n-button size="small" type="primary" @click="downloadCsv">
            下载 .csv
          </n-button>
        </n-space>
      </div>
      <n-input
        :value="csvOutput"
        type="textarea"
        :rows="14"
        readonly
        class="csv-output"
        placeholder="转换后的 CSV 内容"
      />
      <div class="csv-stats mt-2">
        <n-tag size="small">行数：{{ rowCount }}</n-tag>
        <n-tag size="small">列数：{{ colCount }}</n-tag>
      </div>
    </div>

    <!-- 错误提示 -->
    <n-alert v-if="errorMsg" type="error" class="mt-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NUpload,
  NUploadDragger,
  NSelect,
  NSwitch,
  NButton,
  NInput,
  NAlert,
  NTag,
  NSpace,
} from 'naive-ui'
import { useMessage } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

const message = useMessage()

// xlsx 库引用
let xlsxLib: any = null
// 工作簿引用（用于切换工作表）
let workbookRef: any = null

// 状态变量
const fileName = ref('')
const fileSize = ref('')
const parsing = ref(false)
const errorMsg = ref('')
const sheetNames = ref<string[]>([])
const selectedSheet = ref<string | null>(null)
const rawData = ref<any[][]>([])
const csvOutput = ref('')

// CSV 配置
const delimiter = ref(',')
const lineEnding = ref('\n')
const withBom = ref(true)

// 分隔符选项
const delimiterOptions = [
  { label: '逗号（,）', value: ',' },
  { label: '分号（;）', value: ';' },
  { label: '制表符（\\t）', value: '\t' },
  { label: '竖线（|）', value: '|' },
]

// 换行符选项
const lineEndingOptions = [
  { label: 'LF（\\n）', value: '\n' },
  { label: 'CRLF（\\r\\n）', value: '\r\n' },
]

// 工作表选项
const sheetOptions = computed(() =>
  sheetNames.value.map(name => ({ label: name, value: name }))
)

// 行数与列数统计
const rowCount = computed(() => rawData.value.length)
const colCount = computed(() =>
  rawData.value.length > 0
    ? Math.max(...rawData.value.map(row => row.length))
    : 0
)

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 处理文件上传
async function handleUpload({ file }: { file: UploadFileInfo }) {
  if (!file.file) return
  // 重置状态
  errorMsg.value = ''
  csvOutput.value = ''
  rawData.value = []
  sheetNames.value = []
  selectedSheet.value = null
  fileName.value = file.name
  fileSize.value = formatSize(file.file.size)

  parsing.value = true
  try {
    // 动态加载 xlsx 库
    const XLSX = await import('xlsx')
    xlsxLib = XLSX
    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    workbookRef = workbook

    sheetNames.value = workbook.SheetNames
    if (sheetNames.value.length === 0) {
      throw new Error('未找到工作表')
    }

    // 默认选择第一个工作表
    selectedSheet.value = sheetNames.value[0]
    parseSheet(workbook, selectedSheet.value)
    message.success(`解析成功，共 ${sheetNames.value.length} 个工作表`)
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    message.error('Excel 文件解析失败')
  } finally {
    parsing.value = false
  }
}

// 解析单个工作表为二维数组
function parseSheet(workbook: any, sheetName: string) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet || !xlsxLib) {
    rawData.value = []
    csvOutput.value = ''
    return
  }
  // 转换为二维数组
  const data = xlsxLib.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  rawData.value = data
  generateCsv()
}

// 工作表切换
function onSheetChange(name: string) {
  if (workbookRef) {
    parseSheet(workbookRef, name)
  }
}

// 生成 CSV 字符串
function generateCsv() {
  if (rawData.value.length === 0) {
    csvOutput.value = ''
    return
  }
  const delim = delimiter.value
  const lines = rawData.value.map(row =>
    row.map((cell: any) => {
      const str = cell === null || cell === undefined ? '' : String(cell)
      // 包含分隔符、引号或换行符的字段需要加引号
      if (str.includes(delim) || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }).join(delim)
  )
  csvOutput.value = lines.join(lineEnding.value)
}

// 监听配置变化重新生成 CSV
watch([delimiter, lineEnding], generateCsv)

// 复制 CSV
async function copyCsv() {
  if (!csvOutput.value) return
  await navigator.clipboard.writeText(csvOutput.value)
  message.success('已复制到剪贴板')
}

// 下载 CSV 文件
function downloadCsv() {
  if (!csvOutput.value) return
  let content = csvOutput.value
  // 添加 BOM 头以确保 Excel 正确识别 UTF-8 编码
  const prefix = withBom.value ? '\ufeff' : ''
  const blob = new Blob([prefix + content], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.value.replace(/\.(xlsx|xls)$/i, '') + '.csv'
  a.click()
  URL.revokeObjectURL(url)
  message.success('CSV 文件已下载')
}
</script>

<style scoped>
.excel-to-csv {
  max-width: 1000px;
  margin: 0 auto;
}

.upload-dragger {
  padding: 40px 20px;
}

.upload-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 48px;
  color: #18a058;
}

.dark .upload-icon {
  color: #36ad6a;
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.upload-hint {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.file-name {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.file-meta {
  color: #999;
}

.loading-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.loading-text {
  font-size: 14px;
  font-weight: 500;
}

.loading-hint {
  font-size: 12px;
  color: #999;
}

.config-title {
  font-size: 14px;
  font-weight: 600;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-item label {
  font-size: 13px;
  color: #666;
}

.dark .config-item label {
  color: #aaa;
}

.config-item :deep(.n-select),
.config-item :deep(.n-switch) {
  width: 100%;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
}

.csv-output :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.csv-stats {
  display: flex;
  gap: 8px;
}
</style>
