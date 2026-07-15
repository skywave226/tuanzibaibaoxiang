<template>
  <div class="image-compress">
    <n-upload :show-file-list="false" @change="handleUpload" accept="image/*">
      <n-button type="primary">选择图片</n-button>
    </n-upload>
    <div v-if="originalImage" class="preview">
      <div class="image-box">
        <div class="label">原图 ({{ originalSize }})</div>
        <img :src="originalImage" alt="原图" />
      </div>
      <div class="image-box" v-if="compressedImage">
        <div class="label">压缩后 ({{ compressedSize }})</div>
        <img :src="compressedImage" alt="压缩后" />
      </div>
    </div>
    <div class="controls" v-if="originalImage">
      <n-slider v-model:value="quality" :min="10" :max="100" :step="5" />
      <div class="quality-label">质量: {{ quality }}%</div>
      <n-button type="primary" @click="compress" :loading="compressing">压缩</n-button>
      <n-button @click="download" v-if="compressedImage">下载</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { NUpload, NButton, NSlider } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

const originalImage = ref('')
const compressedImage = ref('')
const originalSize = ref('')
const compressedSize = ref('')
const quality = ref(80)
const compressing = ref(false)
const blobUrl = ref('')
let originalFile: File | null = null

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const handleUpload = (data: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; event?: Event }) => {
  const rawFile = data.file?.file
  if (!rawFile) return
  originalFile = rawFile
  const reader = new FileReader()
  reader.onload = (e) => {
    originalImage.value = e.target?.result as string
    originalSize.value = formatSize(rawFile.size)
    compressedImage.value = ''
  }
  reader.readAsDataURL(rawFile)
}

const compress = () => {
  if (!originalFile) return
  compressing.value = true
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
          blobUrl.value = URL.createObjectURL(blob)
          compressedImage.value = blobUrl.value
          compressedSize.value = formatSize(blob.size)
        }
        compressing.value = false
      },
      'image/jpeg',
      quality.value / 100
    )
  }
  img.src = originalImage.value
}

const download = () => {
  if (!compressedImage.value) return
  const a = document.createElement('a')
  a.href = compressedImage.value
  a.download = 'compressed.jpg'
  a.click()
}

onBeforeUnmount(() => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})
</script>

<style scoped>
.image-compress {
  max-width: 1200px;
  margin: 0 auto;
}
.preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}
.image-box {
  text-align: center;
}
.image-box img {
  max-width: 100%;
  max-height: 400px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.label {
  margin-bottom: 10px;
  font-weight: 500;
}
.controls {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.controls .n-slider {
  flex: 1;
}
.quality-label {
  min-width: 80px;
}
</style>
