<template>
  <div class="image-uploader card">
    <div
      class="upload-area"
      :class="{ 'is-dragging': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileChange"
      />
      <div class="upload-content">
        <span class=" text-4xl text-gray-400 mb-4"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="16 13 12 9 8 13"/><line x1="12" y1="9" x2="12" y2="19"/></svg></span>
        <div class="text-lg font-medium mb-2">拖拽图片到此处，或点击上传</div>
        <div class="text-sm text-gray-500">支持 JPG、PNG、BMP、WebP 格式</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  'imageSelected': [imageSrc: string, fileName: string]
}>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    processFile(file)
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

function processFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const imageSrc = e.target?.result as string
    emit('imageSelected', imageSrc, file.name)
  }
  reader.readAsDataURL(file)
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed #d0d0d0;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #36ad6a;
  background: #f0f9eb;
}

.dark .upload-area:hover {
  background: #1a3a2a;
}

.upload-area.is-dragging {
  border-color: #36ad6a;
  background: #f0f9eb;
}

.dark .upload-area.is-dragging {
  background: #1a3a2a;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
