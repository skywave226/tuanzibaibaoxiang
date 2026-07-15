<template>
  <div class="data-table-renderer">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <n-space>
        <n-radio-group v-model:value="inputType">
          <n-radio-button value="csv">CSV</n-radio-button>
          <n-radio-button value="json">JSON</n-radio-button>
        </n-radio-group>
        <n-button type="primary" @click="parseInput">解析</n-button>
        <n-button @click="loadExample">示例</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
      <n-tag v-if="errorMsg" type="error">{{ errorMsg }}</n-tag>
      <n-tag v-else-if="tableData.length > 0" type="success">{{ tableData.length }} 行 / {{ columns.length }} 列</n-tag>
    </div>

    <!-- 数据输入 -->
    <div class="input-section">
      <div class="pane-label">
        {{ inputType === 'csv' ? 'CSV 输入（首行为表头）' : 'JSON 输入（对象数组）' }}
      </div>
      <n-input
        v-model:value="inputText"
        type="textarea"
        :placeholder="inputType === 'csv' ? csvPlaceholder : jsonPlaceholder"
        class="code-input"
        :autosize="false"
        rows="8"
      />
    </div>

    <!-- 搜索过滤 -->
    <div class="filter-section" v-if="tableData.length > 0">
      <n-input
        v-model:value="searchQuery"
        placeholder="全表搜索（不区分大小写）"
        clearable
        class="search-input"
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
      <n-select
        v-model:value="pageSize"
        :options="pageSizeOptions"
        style="width: 130px"
      />
    </div>

    <!-- 数据表格 -->
    <div class="table-section" v-if="tableData.length > 0">
      <n-data-table
        :columns="tableColumns"
        :data="filteredData"
        :pagination="paginationConfig"
        :bordered="true"
        :single-line="false"
        size="small"
        striped
      />
    </div>

    <n-empty v-else description="输入数据并点击解析按钮" class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NButton, NSpace, NInput, NTag, NRadioGroup, NRadioButton,
  NDataTable, NEmpty, NSelect, useMessage,
} from 'naive-ui'
import type { DataTableColumn } from 'naive-ui'

const message = useMessage()
const inputType = ref<'csv' | 'json'>('csv')
const inputText = ref('')
const errorMsg = ref('')
const searchQuery = ref('')
const pageSize = ref(10)
const columns = ref<string[]>([])
const tableData = ref<Record<string, any>[]>([])

const pageSizeOptions = [
  { label: '10 行/页', value: 10 },
  { label: '20 行/页', value: 20 },
  { label: '50 行/页', value: 50 },
  { label: '100 行/页', value: 100 },
]

const csvPlaceholder = `month,sales,cost
Jan,100,80
Feb,150,120`
const jsonPlaceholder = `[
  {"name":"Tom","age":28},
  {"name":"Jerry","age":25}
]`

// 表格列定义（带排序）
const tableColumns = computed<DataTableColumn[]>(() => {
  return columns.value.map(col => ({
    title: col,
    key: col,
    sorter: (a: Record<string, any>, b: Record<string, any>) => {
      const va = a[col]
      const vb = b[col]
      // 数值比较
      const na = Number(va)
      const nb = Number(vb)
      if (!isNaN(na) && !isNaN(nb) && va !== '' && vb !== '') {
        return na - nb
      }
      // 字符串比较
      return String(va).localeCompare(String(vb))
    },
    render: (row: Record<string, any>) => {
      const v = row[col]
      if (v === null || v === undefined) return h('span', { class: 'null-cell' }, '—')
      return String(v)
    },
  }))
})

// 分页配置
const paginationConfig = computed(() => ({
  pageSize: pageSize.value,
  showSizePicker: false,
  prefix: (info: any) => `共 ${info.itemCount ?? 0} 条`,
}))

// 过滤后的数据
const filteredData = computed(() => {
  if (!searchQuery.value.trim()) return tableData.value
  const q = searchQuery.value.toLowerCase()
  return tableData.value.filter(row =>
    columns.value.some(col => {
      const v = row[col]
      return v !== null && v !== undefined && String(v).toLowerCase().includes(q)
    })
  )
})

// CSV 解析
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      cur += ch
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      if (cur.length > 0) lines.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  if (cur.length > 0) lines.push(cur)

  const splitLine = (line: string): string[] => {
    const result: string[] = []
    let field = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { field += '"'; i++ }
        else inQ = !inQ
      } else if (ch === ',' && !inQ) {
        result.push(field)
        field = ''
      } else {
        field += ch
      }
    }
    result.push(field)
    return result.map(s => s.trim())
  }

  if (lines.length === 0) return { headers: [], rows: [] }
  const hdrs = splitLine(lines[0])
  const dataRows = lines.slice(1).map(splitLine)
  return { headers: hdrs, rows: dataRows }
}

// 解析输入数据
function parseInput(): void {
  errorMsg.value = ''
  columns.value = []
  tableData.value = []
  if (!inputText.value.trim()) {
    errorMsg.value = '请输入数据'
    return
  }
  try {
    if (inputType.value === 'csv') {
      const { headers, rows } = parseCSV(inputText.value)
      if (headers.length === 0) {
        errorMsg.value = 'CSV 解析失败'
        return
      }
      columns.value = headers
      tableData.value = rows.map((row, idx) => {
        const obj: Record<string, any> = {}
        headers.forEach((h, i) => {
          obj[h] = row[i] !== undefined ? row[i] : null
        })
        obj.__index = idx + 1
        return obj
      })
    } else {
      // JSON 解析：要求对象数组
      const obj = JSON.parse(inputText.value)
      if (!Array.isArray(obj)) {
        errorMsg.value = 'JSON 必须是对象数组'
        return
      }
      if (obj.length === 0) {
        errorMsg.value = '数组为空'
        return
      }
      // 收集所有 key（保持首次出现的顺序）
      const keySet = new Set<string>()
      obj.forEach((item: any) => {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach(k => keySet.add(k))
        }
      })
      const hdrs = Array.from(keySet)
      columns.value = hdrs
      tableData.value = obj.map((item: any, idx: number) => {
        const row: Record<string, any> = { __index: idx + 1 }
        if (item && typeof item === 'object') {
          hdrs.forEach(h => { row[h] = item[h] !== undefined ? item[h] : null })
        }
        return row
      })
    }
    message.success(`解析成功：${tableData.value.length} 行`)
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
  }
}

// 加载示例
function loadExample(): void {
  if (inputType.value === 'csv') {
    inputText.value = `id,name,age,city,salary
1,Tom,28,Beijing,15000
2,Jerry,25,Shanghai,12000
3,Anna,32,Shenzhen,20000
4,Bob,29,Guangzhou,18000
5,Lily,26,Beijing,16000
6,David,35,Shanghai,22000
7,Emma,30,Shenzhen,19000
8,Alex,24,Guangzhou,11000`
  } else {
    inputText.value = JSON.stringify([
      { id: 1, name: 'Tom', age: 28, city: 'Beijing', salary: 15000 },
      { id: 2, name: 'Jerry', age: 25, city: 'Shanghai', salary: 12000 },
      { id: 3, name: 'Anna', age: 32, city: 'Shenzhen', salary: 20000 },
      { id: 4, name: 'Bob', age: 29, city: 'Guangzhou', salary: 18000 },
    ], null, 2)
  }
  parseInput()
}

function clearAll(): void {
  inputText.value = ''
  errorMsg.value = ''
  columns.value = []
  tableData.value = []
  searchQuery.value = ''
}
</script>

<style scoped>
.data-table-renderer {
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

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.input-section {
  margin-bottom: 20px;
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 220px;
}

.table-section {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.null-cell {
  color: #bbb;
  font-style: italic;
}

:deep(.n-data-table) {
  font-size: 13px;
}

/* 深色模式 */
.dark .pane-label {
  color: #888;
}

.dark .table-section {
  border-color: #2a2a4a;
}

.dark .null-cell {
  color: #555;
}
</style>
