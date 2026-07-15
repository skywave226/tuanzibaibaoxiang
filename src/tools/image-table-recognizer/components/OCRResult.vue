<template>
  <div class="ocr-result card" v-if="result">
    <div class="result-header">
      <h3 class="text-lg font-bold">识别结果</h3>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-500">置信度：{{ result.confidence.toFixed(1) }}%</span>
      </div>
    </div>
    <div class="result-content">
      <pre class="result-text">{{ result.text }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OCRResult } from '../composables/useOCR'

defineProps<{
  result: OCRResult
}>()
</script>

<style scoped>
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-content {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  max-height: 300px;
  overflow: auto;
}

.dark .result-content {
  background: #1a1a2e;
}

.result-text {
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}

.dark .result-text {
  color: #e0e0e0;
}
</style>
