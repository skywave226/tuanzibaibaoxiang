<template>
  <div class="table-editor card">
    <div class="editor-header">
      <h3 class="text-lg font-bold">表格编辑器</h3>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">{{ table.rows }} 行 × {{ table.cols }} 列</span>
        <n-button size="small" @click="$emit('clear')">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
          清空
        </n-button>
      </div>
    </div>

    <div class="editor-content">
      <table class="data-table">
        <tbody>
          <tr v-for="row in table.rows" :key="row">
            <td
              v-for="col in table.cols"
              :key="col"
              class="cell"
              :class="{ 'is-empty': !getCellText(row - 1, col - 1) }"
            >
              <n-input
                :value="getCellText(row - 1, col - 1)"
                size="small"
                @update:value="updateCell(row - 1, col - 1, $event)"
                placeholder="点击编辑"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="editor-footer" v-if="table.rows === 0 || table.cols === 0">
      <n-alert type="warning" :bordered="false">
        未检测到表格结构，将作为单列文本处理
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NAlert } from 'naive-ui'
import type { TableCell } from '../composables/useTableDetector'

const props = defineProps<{
  table: {
    rows: number
    cols: number
    cells: TableCell[]
  }
}>()

const emit = defineEmits<{
  'update:table': [table: typeof props.table]
  'clear': []
}>()

function getCellText(row: number, col: number): string {
  const cell = props.table.cells.find(c => c.row === row && c.col === col)
  return cell?.text || ''
}

function updateCell(row: number, col: number, text: string) {
  const cells = props.table.cells.map(c => {
    if (c.row === row && c.col === col) {
      return { ...c, text }
    }
    return c
  })
  emit('update:table', {
    ...props.table,
    cells,
  })
}
</script>

<style scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.editor-content {
  overflow: auto;
  max-height: 500px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.dark .editor-content {
  border-color: #2a2a4a;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table td {
  border: 1px solid #e8e8e8;
  padding: 4px;
  min-width: 80px;
}

.dark .data-table td {
  border-color: #2a2a4a;
}

.data-table td.is-empty {
  background: #fafafa;
}

.dark .data-table td.is-empty {
  background: #1a1a2e;
}

.editor-footer {
  margin-top: 16px;
}
</style>
