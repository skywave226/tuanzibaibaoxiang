<template>
  <div class="image-to-base64">
    <n-upload :show-file-list="false" @change="handleUpload" accept="image/*">
      <n-button type="primary">选择图片</n-button>
    </n-upload>
    <div v-if="preview" class="preview">
      <img :src="preview" alt="预览" />
    </div>
    <div v-if="base64" class="result">
      <div class="label">Base64 编码</div>
      <n-input v-model:value="base64" type="textarea" :rows="8" readonly />
      <n-button @click="copy" style="margin-top: 10px">复制</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NUpload, NButton, NInput } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
import { useCopy } from '@/composables/useCopy'

const { copy: copyText } = useCopy()
const preview = ref('')
const base64 = ref('')

const handleUpload = (data: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; event?: Event }) => {
  const rawFile = data.file?.file
  if (!rawFile) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    preview.value = result
    base64.value = result
  }
  reader.readAsDataURL(rawFile)
}

const copy = () => {
  copyText(base64.value)
}
</script>

<style scoped>
.image-to-base64 {
  max-width: 1000px;
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
</style>
