<template>
  <div class="qrcode-reader">
    <n-upload :show-file-list="false" @change="handleUpload" accept="image/*">
      <n-button type="primary">选择二维码图片</n-button>
    </n-upload>
    <div v-if="preview" class="preview">
      <img :src="preview" alt="预览" />
    </div>
    <div v-if="result !== null" class="result">
      <div class="label">识别结果</div>
      <n-input v-model:value="result" type="textarea" :rows="4" readonly />
      <n-button @click="copy" style="margin-top: 10px">复制</n-button>
    </div>
    <div v-if="error" class="error">
      <n-alert type="error">{{ error }}</n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NUpload, NButton, NInput, NAlert } from 'naive-ui'
import { useMessage } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

const message = useMessage()
const preview = ref('')
const result = ref<string | null>(null)
const error = ref('')

const handleUpload = async (data: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; event?: Event }) => {
  const rawFile = data.file?.file
  if (!rawFile) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    preview.value = e.target?.result as string
    const img = new Image()
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) { error.value = '无法创建画布'; return }
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const jsQR = (await import('jsqr')).default
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code) {
        result.value = code.data
        error.value = ''
      } else {
        result.value = null
        error.value = '未识别到二维码'
      }
    }
    img.src = preview.value
  }
  reader.readAsDataURL(rawFile)
}

const copy = () => {
  if (result.value) {
    navigator.clipboard.writeText(result.value)
    message.success('已复制到剪贴板')
  }
}
</script>

<style scoped>
.qrcode-reader {
  max-width: 800px;
  margin: 0 auto;
}
.preview {
  margin-top: 20px;
  text-align: center;
}
.preview img {
  max-width: 100%;
  max-height: 300px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.result {
  margin-top: 20px;
}
.label {
  margin-bottom: 10px;
  font-weight: 500;
}
.error {
  margin-top: 20px;
}
</style>
