<template>
  <div class="image-merge">
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">上传图片</h3>
      <n-upload
        list-type="image-card"
        accept="image/*"
        multiple
        :custom-request="handleUpload"
        v-model:file-list="fileList"
      />
      <div class="text-sm text-gray-500 mt-2">
        已上传 {{ imageList.length }} 张图片 · 可拖拽排序
      </div>
    </div>

    <div class="card mb-4" v-if="imageList.length > 0">
      <h3 class="text-sm font-bold mb-3">拼接设置</h3>

      <div class="config-section">
        <div class="config-item">
          <label>拼接方向</label>
          <n-radio-group v-model:value="direction" size="small">
            <n-radio-button value="horizontal">横向</n-radio-button>
            <n-radio-button value="vertical">竖向</n-radio-button>
          </n-radio-group>
        </div>

        <div class="config-item">
          <label>间距</label>
          <n-input-number v-model:value="gap" :min="0" :max="100" :step="1" />
        </div>

        <div class="config-item">
          <label>边距</label>
          <n-input-number v-model:value="padding" :min="0" :max="100" :step="1" />
        </div>

        <div class="config-item">
          <label>背景色</label>
          <div class="color-row">
            <input type="color" v-model="bgColor" class="color-input" />
            <n-input v-model:value="bgColor" style="width: 120px" />
          </div>
        </div>

        <div class="config-item">
          <label>尺寸模式</label>
          <n-radio-group v-model:value="resizeMode" size="small">
            <n-radio-button value="none">原始</n-radio-button>
            <n-radio-button value="uniform">统一宽度</n-radio-button>
          </n-radio-group>
        </div>

        <div class="config-item" v-if="resizeMode === 'uniform' && direction === 'horizontal'">
          <label>统一高度</label>
          <n-input-number v-model:value="uniformSize" :min="50" :max="2000" :step="10" />
        </div>
        <div class="config-item" v-else-if="resizeMode === 'uniform'">
          <label>统一宽度</label>
          <n-input-number v-model:value="uniformSize" :min="50" :max="2000" :step="10" />
        </div>
      </div>

      <div class="toolbar mt-4">
        <n-button type="primary" @click="merge">开始拼接</n-button>
        <n-button @click="download" :disabled="!resultImage">下载图片</n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>
    </div>

    <div class="card" v-if="resultImage">
      <h3 class="text-sm font-bold mb-3">预览（{{ resultWidth }}×{{ resultHeight }}）</h3>
      <div class="preview-container">
        <img :src="resultImage" class="preview-img" />
      </div>
    </div>

    <n-alert type="error" v-if="errorMsg" class="mt-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NUpload, NInput, NInputNumber, NRadioGroup, NRadioButton, NAlert } from 'naive-ui'
import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui'

interface ImageItem {
  id: string
  name: string
  src: string
  width: number
  height: number
  image: HTMLImageElement
}

const fileList = ref<UploadFileInfo[]>([])
const imageList = ref<ImageItem[]>([])
const resultImage = ref('')
const resultWidth = ref(0)
const resultHeight = ref(0)
const errorMsg = ref('')

const direction = ref<'horizontal' | 'vertical'>('horizontal')
const gap = ref(10)
const padding = ref(10)
const bgColor = ref('#ffffff')
const resizeMode = ref<'none' | 'uniform'>('uniform')
const uniformSize = ref(400)

function handleUpload({ file }: UploadCustomRequestOptions) {
  const rawFile = file.file as File
  if (!rawFile) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      imageList.value.push({
        id: file.id,
        name: file.name || 'image',
        src: e.target?.result as string,
        width: img.naturalWidth,
        height: img.naturalHeight,
        image: img,
      })
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(rawFile)
}

function getDimensions(img: ImageItem): { width: number; height: number } {
  if (resizeMode.value === 'uniform') {
    if (direction.value === 'horizontal') {
      // 统一高度，按比例缩放宽度
      const targetHeight = uniformSize.value
      const scale = targetHeight / img.height
      return { width: Math.round(img.width * scale), height: targetHeight }
    } else {
      // 统一宽度，按比例缩放高度
      const targetWidth = uniformSize.value
      const scale = targetWidth / img.width
      return { width: targetWidth, height: Math.round(img.height * scale) }
    }
  }
  return { width: img.width, height: img.height }
}

function merge() {
  if (imageList.value.length === 0) {
    errorMsg.value = '请先上传图片'
    return
  }

  // 计算所有图片的最终尺寸
  const dimensions = imageList.value.map(getDimensions)

  let canvasWidth: number
  let canvasHeight: number

  if (direction.value === 'horizontal') {
    canvasWidth = dimensions.reduce((sum, d) => sum + d.width, 0) + gap.value * (imageList.value.length - 1) + padding.value * 2
    canvasHeight = Math.max(...dimensions.map(d => d.height)) + padding.value * 2
  } else {
    canvasWidth = Math.max(...dimensions.map(d => d.width)) + padding.value * 2
    canvasHeight = dimensions.reduce((sum, d) => sum + d.height, 0) + gap.value * (imageList.value.length - 1) + padding.value * 2
  }

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 填充背景色
  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 绘制图片
  let offset = padding.value
  imageList.value.forEach((img, index) => {
    const { width, height } = dimensions[index]
    let x: number, y: number
    if (direction.value === 'horizontal') {
      x = offset
      y = padding.value + (canvasHeight - padding.value * 2 - height) / 2
    } else {
      x = padding.value + (canvasWidth - padding.value * 2 - width) / 2
      y = offset
    }
    ctx.drawImage(img.image, x, y, width, height)
    offset += (direction.value === 'horizontal' ? width : height) + gap.value
  })

  resultWidth.value = canvasWidth
  resultHeight.value = canvasHeight
  resultImage.value = canvas.toDataURL('image/png')
  errorMsg.value = ''
}

function download() {
  if (!resultImage.value) return
  const a = document.createElement('a')
  a.href = resultImage.value
  a.download = 'merged-image.png'
  a.click()
}

function clearAll() {
  fileList.value = []
  imageList.value = []
  resultImage.value = ''
  resultWidth.value = 0
  resultHeight.value = 0
  errorMsg.value = ''
}
</script>

<style scoped>
.image-merge {
  max-width: 900px;
  margin: 0 auto;
}

.config-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label {
  color: #aaa;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 40px;
  height: 34px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  background: none;
}

.toolbar {
  display: flex;
  gap: 12px;
}

.preview-container {
  text-align: center;
  max-height: 600px;
  overflow: auto;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
}

.dark .preview-container {
  background: #1e2a4a;
}

.preview-img {
  max-width: 100%;
  border-radius: 4px;
}
</style>
