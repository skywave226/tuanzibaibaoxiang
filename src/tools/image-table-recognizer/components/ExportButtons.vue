<template>
  <div class="export-buttons card">
    <h3 class="text-lg font-bold mb-4">导出表格</h3>
    <n-space>
      <n-button type="primary" @click="$emit('export', 'csv')">
        <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
        导出 CSV
      </n-button>
      <n-button type="primary" @click="$emit('export', 'excel')">
        <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg></span>
        导出 Excel
      </n-button>
      <n-button @click="$emit('export', 'html')">
        <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></span>
        导出 HTML
      </n-button>
      <n-button @click="$emit('export', 'markdown')">
        <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M4 12h2l2 4 2-4h2v8h-2v-4l-2 4-2-4v4H4z"/><path d="M16 12h2l2 3 2-3h2v8h-2v-5l-2 3-2-3v5h-2z"/></svg></span>
        导出 Markdown
      </n-button>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { NButton, NSpace } from 'naive-ui'

defineEmits<{
  'export': [format: 'csv' | 'excel' | 'html' | 'markdown']
}>()
</script>

<style scoped>
.export-buttons {
  padding: 16px;
}
</style>
