<template>
  <div class="data-processor">
    <n-alert type="info" class="mb-4">
      在浏览器端处理 CSV / Excel 数据，支持去重、拆分列、合并文件、筛选排序与导出。
    </n-alert>

    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="dedup" tab="去重">
        <div class="card mb-4">
          <n-upload accept=".csv,.xlsx,.xls" :show-file-list="false" :custom-request="handleUpload">
            <n-button type="primary">上传文件</n-button>
          </n-upload>
          <div v-if="fileName" class="mt-2 text-sm text-gray-500">已上传：{{ fileName }}</div>
          <div class="mt-4">
            <n-button type="primary" @click="deduplicate" :disabled="!rows.length">按全行去重</n-button>
            <n-button class="ml-3" @click="downloadResult" :disabled="!resultRows.length">下载结果</n-button>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="split" tab="拆分列">
        <div class="card mb-4">
          <n-input v-model:value="inputText" type="textarea" :rows="8" placeholder="粘贴表格内容，每行一条" />
          <div class="mt-3 flex gap-3 items-center flex-wrap">
            <span>分隔符</span>
            <n-radio-group v-model:value="delimiter" size="small">
              <n-radio-button value=",">逗号</n-radio-button>
              <n-radio-button value="\t">Tab</n-radio-button>
              <n-radio-button value="|">竖线</n-radio-button>
              <n-radio-button value=" ">空格</n-radio-button>
            </n-radio-group>
            <n-button type="primary" @click="splitColumns">拆分</n-button>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="merge" tab="合并文件">
        <div class="card mb-4">
          <n-upload accept=".csv,.xlsx,.xls" multiple :show-file-list="false" :custom-request="handleMergeUpload">
            <n-button type="primary">选择多个文件</n-button>
          </n-upload>
          <div class="mt-3">
            <n-button type="primary" @click="mergeFiles" :disabled="mergeFilesList.length < 2">合并</n-button>
            <n-button class="ml-3" @click="downloadResult" :disabled="!resultRows.length">下载结果</n-button>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="filter" tab="筛选排序">
        <div class="card mb-4">
          <n-upload accept=".csv,.xlsx,.xls" :show-file-list="false" :custom-request="handleUpload">
            <n-button type="primary">上传文件</n-button>
          </n-upload>
          <div class="mt-4 flex gap-3 items-center flex-wrap">
            <n-input v-model:value="filterKeyword" placeholder="关键词筛选" />
            <n-select v-model:value="sortColumn" :options="columnOptions" placeholder="排序列" style="width: 160px" />
            <n-radio-group v-model:value="sortDirection" size="small">
              <n-radio-button value="asc">升序</n-radio-button>
              <n-radio-button value="desc">降序</n-radio-button>
            </n-radio-group>
            <n-button type="primary" @click="filterSort" :disabled="!rows.length">执行</n-button>
          </div>
          <div class="mt-3">
            <n-button @click="downloadResult" :disabled="!resultRows.length">下载结果</n-button>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <div class="card" v-if="resultRows.length">
      <h3 class="text-sm font-bold mb-3">结果预览（前 20 行）</h3>
      <n-data-table
        :columns="resultColumns"
        :data="previewRows"
        :bordered="false"
        :single-line="false"
        size="small"
        :max-height="400"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NTabs, NTabPane, NUpload, NButton, NInput, NRadioGroup, NRadioButton, NSelect, NDataTable } from 'naive-ui'
import type { DataTableColumns, UploadCustomRequestOptions } from 'naive-ui'

type Row = Record<string, string>

const activeTab = ref('dedup')
const fileName = ref('')
const rows = ref<Row[]>([])
const headers = ref<string[]>([])
const resultRows = ref<Row[]>([])

const inputText = ref('')
const delimiter = ref(',')
const mergeFilesList = ref<{ name: string; rows: Row[]; headers: string[] }[]>([])
const filterKeyword = ref('')
const sortColumn = ref('')
const sortDirection = ref<'asc' | 'desc'>('asc')

const columnOptions = computed(() => {
  return headers.value.map(h => ({ label: h, value: h }))
})

const resultColumns = computed<DataTableColumns<Row>>(() => {
  return (resultRows.value.length ? Object.keys(resultRows.value[0]) : []).map(key => ({
    title: key,
    key,
    ellipsis: { tooltip: true },
  }))
})

const previewRows = computed(() => resultRows.value.slice(0, 20))

async function parseFile(file: File): Promise<{ rows: Row[]; headers: string[] }> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') {
    const text = await file.text()
    return parseCsv(text)
  } else {
    const XLSX = await import('xlsx')
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]
    return arrayToRows(json)
  }
}

function parseCsv(text: string): { rows: Row[]; headers: string[] } {
  const lines = text.trim().split('\n')
  if (lines.length === 0) return { rows: [], headers: [] }

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuote = false
    for (const char of line) {
      if (char === '"') {
        inQuote = !inQuote
      } else if (char === ',' && !inQuote) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headersArr = parseLine(lines[0])
  const data = lines.slice(1).map(line => {
    const values = parseLine(line)
    const row: Row = {}
    headersArr.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })

  return { rows: data, headers: headersArr }
}

function arrayToRows(arr: string[][]): { rows: Row[]; headers: string[] } {
  if (arr.length === 0) return { rows: [], headers: [] }
  const headersArr = arr[0]
  const rows = arr.slice(1).map(values => {
    const row: Row = {}
    headersArr.forEach((h, i) => { row[h] = String(values[i] || '') })
    return row
  })
  return { rows, headers: headersArr }
}

async function handleUpload({ file }: UploadCustomRequestOptions) {
  const uploadFile = file.file as File
  fileName.value = uploadFile.name
  const parsed = await parseFile(uploadFile)
  rows.value = parsed.rows
  headers.value = parsed.headers
  resultRows.value = []
}

async function handleMergeUpload({ file }: UploadCustomRequestOptions) {
  const uploadFile = file.file as File
  const parsed = await parseFile(uploadFile)
  mergeFilesList.value.push({ name: uploadFile.name, rows: parsed.rows, headers: parsed.headers })
}

function deduplicate() {
  const seen = new Set<string>()
  resultRows.value = rows.value.filter(row => {
    const key = JSON.stringify(row)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function splitColumns() {
  const lines = inputText.value.trim().split('\n')
  const data = lines.map((line, index) => {
    const values = line.split(delimiter.value)
    const row: Row = { 行号: String(index + 1) }
    values.forEach((v, i) => { row[`列${i + 1}`] = v.trim() })
    return row
  })
  resultRows.value = data
}

function mergeFiles() {
  const allHeaders = new Set<string>()
  mergeFilesList.value.forEach(f => f.headers.forEach(h => allHeaders.add(h)))
  const headerArr = Array.from(allHeaders)
  const merged: Row[] = []
  mergeFilesList.value.forEach(f => {
    f.rows.forEach(row => {
      const newRow: Row = {}
      headerArr.forEach(h => { newRow[h] = row[h] || '' })
      merged.push(newRow)
    })
  })
  resultRows.value = merged
  headers.value = headerArr
}

function filterSort() {
  let data = [...rows.value]
  if (filterKeyword.value.trim()) {
    const kw = filterKeyword.value.trim().toLowerCase()
    data = data.filter(row => Object.values(row).some(v => v.toLowerCase().includes(kw)))
  }
  if (sortColumn.value) {
    data.sort((a, b) => {
      const av = a[sortColumn.value] || ''
      const bv = b[sortColumn.value] || ''
      const an = Number(av)
      const bn = Number(bv)
      if (!isNaN(an) && !isNaN(bn)) {
        return sortDirection.value === 'asc' ? an - bn : bn - an
      }
      return sortDirection.value === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }
  resultRows.value = data
}

function downloadResult() {
  if (!resultRows.value.length) return
  const cols = Object.keys(resultRows.value[0])
  const lines: string[] = []
  lines.push(cols.map(escapeCsv).join(','))
  resultRows.value.forEach(row => {
    lines.push(cols.map(c => escapeCsv(row[c])).join(','))
  })
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'processed-data.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCsv(value: string): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
</script>

<style scoped>
.data-processor { max-width: 1000px; margin: 0 auto; }

.card .ml-3 { margin-left: 12px; }
</style>
