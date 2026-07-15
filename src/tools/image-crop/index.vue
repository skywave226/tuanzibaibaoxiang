<template>
  <div class="image-crop">
    <n-upload :show-file-list="false" @change="handleUpload" accept="image/*">
      <n-button type="primary">选择图片</n-button>
    </n-upload>
    <div v-if="imageSrc" class="crop-container">
      <div class="crop-area">
        <img ref="imageRef" :src="imageSrc" alt="原图" />
      </div>
      <div class="controls">
        <div class="size-inputs">
          <n-input-number v-model:value="cropWidth" :min="1" placeholder="宽度" />
          <span>x</span>
          <n-input-number v-model:value="cropHeight" :min="1" placeholder="高度" />
        </div>
        <n-button type="primary" @click="crop">裁剪</n-button>
        <n-button @click="download" v-if="croppedImage">下载</n-button>
      </div>
      <div v-if="croppedImage" class="preview">
        <div class="label">裁剪结果</div>
        <img :src="croppedImage" alt="裁剪后" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NUpload, NButton, NInputNumber } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

const imageSrc = ref('')
const imageRef = ref<HTMLImageElement>()
const cropWidth = ref(200)
const cropHeight = ref(200)
const croppedImage = ref('')

const handleUpload = (data: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; event?: Event }) => {
  const rawFile = data.file?.file
  if (!rawFile) return
  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target?.result as string
    croppedImage.value = ''
  }
  reader.readAsDataURL(rawFile)
}

const crop = () => {
  if (!imageRef.value) return
  const canvas = document.createElement('canvas')
  canvas.width = cropWidth.value
  canvas.height = cropHeight.value
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    imageRef.value,
    0,
    0,
    cropWidth.value,
    cropHeight.value,
    0,
    0,
    cropWidth.value,
    cropHeight.value
  )
  croppedImage.value = canvas.toDataURL('image/png')
}

const download = () => {
  if (!croppedImage.value) return
  const a = document.createElement('a')
  a.href = croppedImage.value
  a.download = 'cropped.png'
  a.click()
}
</script>

<style scoped>
.image-crop {
  max-width: 1200px;
  margin: 0 auto;
}
.crop-container {
  margin-top: 20px;
}
.crop-area {
  margin-bottom: 20px;
  text-align: center;
}
.crop-area img {
  max-width: 100%;
  max-height: 400px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}
.size-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}
.size-inputs .n-input-number {
  width: 120px;
}
.preview {
  text-align: center;
}
.preview img {
  max-width: 100%;
  max-height: 400px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.label {
  margin-bottom: 10px;
  font-weight: 500;
}
</style>
