<template>
  <div class="json-table-editor">
    <n-alert type="info" class="mb-4">
      将 JSON 数组粘贴到左侧，右侧会自动渲染为可编辑表格。支持对象数组和二维数组。
    </n-alert>

    <div class="main-grid">
      <div class="editor-pane">
        <div class="pane-label flex justify-between mb-2">
          <span>JSON 输入</span>
          <n-space>
            <n-button size="tiny" quaternary @click="loadExample">示例</n-button>
            <n-button size="tiny" quaternary @click="copyJson">复制 JSON</n-button>
            <n-button size="tiny" quaternary @click="clearAll">清空</n-button>
          </n-space>
        </div>
        <n-input
          v-model:value="jsonText"
          type="textarea"
          :rows="24"
          :autosize="false"
          placeholder='[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]'
          @blur="parseJson"
        />
      </div>

      <div class="table-pane">
        <div class="pane-label flex justify-between mb-2 flex-wrap gap-2">
          <span>表格编辑</span>
          <n-space>
            <n-button size="small" @click="addRow" :disabled="!columns.length">+ 行</n-button>
            <n-button size="small" @click="addColumn" :disabled="!columns.length">+ 列</n-button>
            <n-button size="small" @click="exportCsv" :disabled="!columns.length">导出 CSV</n-button>
            <n-button size="small" @click="exportJson" :disabled="!columns.length">导出 JSON</n-button>
          </n-space>
        </div>

        <n-empty v-if="!columns.length" description="输入有效 JSON 数组后生成表格" />

        <div v-else class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="row-num">#</th>
                <th v-for="(col, index) in columns" :key="col" class="col-header">
                  <div class="header-cell">
                    <n-input v-model:value="columns[index]" size="small" @blur="onColumnNameChange(index)" />
                    <n-button size="tiny" quaternary type="error" @click="removeColumn(index)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </n-button>
                  </div>
                </th>
                <th class="actions-col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
                <td class="row-num">{{ rowIndex + 1 }}</td>
                <td v-for="col in columns" :key="col" class="data-cell">
                  <n-input v-model:value="row[col]" size="small" />
                </td>
                <td class="actions-col">
                  <n-button size="tiny" quaternary type="error" @click="removeRow(rowIndex)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </n-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <n-alert v-if="error" type="error" class="mt-4" closable @close="error = ''">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NInput, NButton, NAlert, NEmpty, NSpace, useMessage } from 'naive-ui'

const message = useMessage()
const jsonText = ref('')
const columns = ref<string[]>([])
const rows = ref<Record<string, string>[]>([])
const error = ref('')

watch(rows, () => {
  syncJson()
}, { deep: true })

function parseJson() {
  error.value = ''
  if (!jsonText.value.trim()) {
    columns.value = []
    rows.value = []
    return
  }

  try {
    const parsed = JSON.parse(jsonText.value)

    if (!Array.isArray(parsed)) {
      throw new Error('仅支持 JSON 数组')
    }

    if (parsed.length === 0) {
      columns.value = []
      rows.value = []
      return
    }

    // 二维数组
    if (Array.isArray(parsed[0])) {
      const colCount = Math.max(...parsed.map(r => (r as unknown[]).length))
      columns.value = Array.from({ length: colCount }, (_, i) => `col${i + 1}`)
      rows.value = parsed.map((row: unknown) => {
        const obj: Record<string, string> = {}
        columns.value.forEach((col, i) => {
          obj[col] = String((row as unknown[])[i] ?? '')
        })
        return obj
      })
      return
    }

    // 对象数组
    const allKeys = new Set<string>()
    parsed.forEach((item: unknown) => {
      if (item && typeof item === 'object') {
        Object.keys(item as Record<string, unknown>).forEach(k => allKeys.add(k))
      }
    })
    columns.value = Array.from(allKeys)
    rows.value = parsed.map((item: unknown) => {
      const obj: Record<string, string> = {}
      columns.value.forEach(key => {
        const v = (item as Record<string, unknown>)[key]
        obj[key] = v === undefined || v === null ? '' : String(v)
      })
      return obj
    })
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function syncJson() {
  if (!columns.value.length) return

  // 尝试保持原始数据类型
  const data = rows.value.map(row => {
    const obj: Record<string, unknown> = {}
    columns.value.forEach(col => {
      obj[col] = autoCast(row[col])
    })
    return obj
  })

  jsonText.value = JSON.stringify(data, null, 2)
}

function autoCast(value: string): unknown {
  const trimmed = value.trim()
  if (trimmed === '') return ''
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed)
  if (/^-?\d+\.\d+$/.test(trimmed)) return Number(trimmed)
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function addRow() {
  const obj: Record<string, string> = {}
  columns.value.forEach(col => { obj[col] = '' })
  rows.value.push(obj)
  syncJson()
}

function removeRow(index: number) {
  rows.value.splice(index, 1)
  syncJson()
}

function addColumn() {
  const newCol = `col${columns.value.length + 1}`
  columns.value.push(newCol)
  rows.value.forEach(row => { row[newCol] = '' })
  syncJson()
}

function removeColumn(index: number) {
  const col = columns.value[index]
  columns.value.splice(index, 1)
  rows.value.forEach(row => { delete row[col] })
  syncJson()
}

function onColumnNameChange(index: number) {
  const oldName = columns.value[index]
  // 去重
  let newName = columns.value[index]
  let count = 1
  while (columns.value.some((c, i) => c === newName && i !== index)) {
    newName = `${columns.value[index]}_${count++}`
  }
  columns.value[index] = newName

  rows.value.forEach(row => {
    row[newName] = row[oldName]
    delete row[oldName]
  })
  syncJson()
}

function exportJson() {
  const data = rows.value.map(row => {
    const obj: Record<string, unknown> = {}
    columns.value.forEach(col => { obj[col] = autoCast(row[col]) })
    return obj
  })
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, 'data.json')
}

function exportCsv() {
  const lines: string[] = []
  lines.push(columns.value.map(escapeCsv).join(','))
  rows.value.forEach(row => {
    lines.push(columns.value.map(col => escapeCsv(row[col])).join(','))
  })
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, 'data.csv')
}

function escapeCsv(value: string): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function copyJson() {
  navigator.clipboard.writeText(jsonText.value)
  message.success('已复制 JSON')
}

function clearAll() {
  jsonText.value = ''
  columns.value = []
  rows.value = []
  error.value = ''
}

function loadExample() {
  jsonText.value = JSON.stringify([
    { name: 'Alice', age: 30, city: 'Beijing' },
    { name: 'Bob', age: 25, city: 'Shanghai' },
    { name: 'Carol', age: 28, city: 'Shenzhen' },
  ], null, 2)
  parseJson()
}
</script>

<style scoped>
.json-table-editor { max-width: 1400px; margin: 0 auto; }

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 16px;
}

@media (max-width: 1024px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}

.pane-label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.dark .pane-label { color: #aaa; }

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.dark .table-wrapper { border-color: #2a2a4a; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 400px;
}

.data-table th, .data-table td {
  border: 1px solid #e8e8e8;
  padding: 6px 8px;
}

.dark .data-table th, .dark .data-table td {
  border-color: #2a2a4a;
}

.data-table th {
  background: #f9f9f9;
  font-weight: 600;
}

.dark .data-table th {
  background: #1e1e1e;
}

.row-num {
  width: 40px;
  text-align: center;
  color: #999;
  background: #fafafa;
}

.dark .row-num {
  background: #181818;
  color: #888;
}

.col-header {
  min-width: 140px;
}

.header-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.data-cell {
  min-width: 120px;
}

.actions-col {
  width: 40px;
  text-align: center;
}

.data-table input {
  width: 100%;
}
</style>
