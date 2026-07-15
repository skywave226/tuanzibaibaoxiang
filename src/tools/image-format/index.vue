<template>
  <div class="image-format">
    <n-upload :show-file-list="false" @change="handleUpload" accept="image/*">
      <n-button type="primary">选择图片</n-button>
    </n-upload>
    <div v-if="originalImage" class="preview">
      <div class="image-box">
        <div class="label">原图 ({{ originalFormat }})</div>
        <img :src="originalImage" alt="原图" />
      </div>
      <div class="image-box" v-if="convertedImage">
        <div class="label">转换后 ({{ targetFormat }})</div>
        <img :src="convertedImage" alt="转换后" />
      </div>
    </div>
    <div class="controls" v-if="originalImage">
      <n-select v-model:value="targetFormat" :options="formatOptions" style="width: 150px" />
      <n-button type="primary" @click="convert" :loading="converting">转换</n-button>
      <n-button @click="download" v-if="convertedImage">下载</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { NUpload, NButton, NSelect } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

const originalImage = ref('')
const convertedImage = ref('')
const originalFormat = ref('')
const targetFormat = ref('png')
const converting = ref(false)
const blobUrl = ref('')

const formatOptions = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'WebP', value: 'webp' },
]

const handleUpload = (data: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; event?: Event }) => {
  const rawFile = data.file?.file
  if (!rawFile) return
  const reader = new FileReader()
  reader.onload = (e) => {
    originalImage.value = e.target?.result as string
    const match = rawFile.type.match(/image\/(\w+)/)
    originalFormat.value = match ? match[1].toUpperCase() : 'UNKNOWN'
    convertedImage.value = ''
  }
  reader.readAsDataURL(rawFile)
}

const convert = () => {
  converting.value = true
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
          convertedImage.value = blobUrl.value
        }
        converting.value = false
      },
      `image/${targetFormat.value}`
    )
  }
  img.src = originalImage.value
}

const download = () => {
  if (!convertedImage.value) return
  const a = document.createElement('a')
  a.href = convertedImage.value
  a.download = `converted.${targetFormat.value}`
  a.click()
}

onBeforeUnmount(() => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})
</script>

<style scoped>
.image-format {
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
</style>
