<template>
  <div class="image-preview card">
    <div class="preview-header">
      <h3 class="text-lg font-bold">图片预览</h3>
      <n-button size="small" @click="$emit('clear')">
        <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
        清除
      </n-button>
    </div>
    <div class="preview-content">
      <img :src="imageSrc" :alt="fileName" class="preview-image" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'

defineProps<{
  imageSrc: string
  fileName: string
}>()

defineEmits<{
  'clear': []
}>()
</script>

<style scoped>
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-content {
  display: flex;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
  max-height: 400px;
}

.dark .preview-content {
  background: #1a1a2e;
}

.preview-image {
  max-width: 100%;
  max-height: 368px;
  object-fit: contain;
}
</style>
