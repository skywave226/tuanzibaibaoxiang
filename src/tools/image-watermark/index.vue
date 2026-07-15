<template>
  <div class="image-watermark">
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">上传图片</h3>
      <n-upload
        :show-file-list="false"
        accept="image/*"
        :custom-request="handleUpload"
      >
        <n-button>选择图片</n-button>
      </n-upload>
      <span class="text-sm text-gray-500 ml-3" v-if="originalImage">
        {{ imageName }} · {{ imageWidth }}×{{ imageHeight }}
      </span>
    </div>

    <div class="card mb-4" v-if="originalImage">
      <h3 class="text-sm font-bold mb-3">水印设置</h3>

      <div class="config-section">
        <div class="config-item">
          <label>水印类型</label>
          <n-radio-group v-model:value="watermarkType" size="small">
            <n-radio-button value="text">文字水印</n-radio-button>
            <n-radio-button value="tile">平铺水印</n-radio-button>
          </n-radio-group>
        </div>

        <div class="config-item">
          <label>水印文字</label>
          <n-input v-model:value="watermarkText" placeholder="如：版权所有" style="width: 220px" />
        </div>

        <div class="config-item">
          <label>字体大小</label>
          <n-input-number v-model:value="fontSize" :min="8" :max="200" :step="2" />
        </div>

        <div class="config-item">
          <label>字体颜色</label>
          <div class="color-row">
            <input type="color" v-model="fontColor" class="color-input" />
            <n-input v-model:value="fontColor" style="width: 120px" />
          </div>
        </div>

        <div class="config-item">
          <label>透明度</label>
          <n-slider v-model:value="opacity" :min="0.1" :max="1" :step="0.1" style="width: 200px" />
        </div>

        <div class="config-item">
          <label>旋转角度</label>
          <n-slider v-model:value="rotation" :min="-90" :max="90" :step="5" style="width: 200px" />
        </div>

        <div class="config-item" v-if="watermarkType === 'text'">
          <label>位置</label>
          <n-select v-model:value="position" :options="positionOptions" style="width: 140px" />
        </div>

        <div class="config-item" v-if="watermarkType === 'tile'">
          <label>平铺间距</label>
          <n-input-number v-model:value="tileSpacing" :min="50" :max="500" :step="10" />
        </div>
      </div>

      <div class="toolbar mt-4">
        <n-button type="primary" @click="applyWatermark">应用水印</n-button>
        <n-button @click="download" :disabled="!resultImage">下载图片</n-button>
        <n-button @click="reset">重置</n-button>
      </div>
    </div>

    <div class="card" v-if="resultImage">
      <h3 class="text-sm font-bold mb-3">预览</h3>
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
import { NButton, NUpload, NInput, NInputNumber, NSelect, NSlider, NRadioGroup, NRadioButton, NAlert } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const originalImage = ref<HTMLImageElement | null>(null)
const imageName = ref('')
const imageWidth = ref(0)
const imageHeight = ref(0)
const resultImage = ref('')
const errorMsg = ref('')

const watermarkType = ref<'text' | 'tile'>('tile')
const watermarkText = ref('版权所有')
const fontSize = ref(32)
const fontColor = ref('#ffffff')
const opacity = ref(0.3)
const rotation = ref(-30)
const position = ref('center')
const tileSpacing = ref(200)

const positionOptions = [
  { label: '左上', value: 'top-left' },
  { label: '上中', value: 'top-center' },
  { label: '右上', value: 'top-right' },
  { label: '左中', value: 'center-left' },
  { label: '居中', value: 'center' },
  { label: '右中', value: 'center-right' },
  { label: '左下', value: 'bottom-left' },
  { label: '下中', value: 'bottom-center' },
  { label: '右下', value: 'bottom-right' },
]

function handleUpload({ file }: UploadCustomRequestOptions) {
  const rawFile = file.file as File
  if (!rawFile) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      imageName.value = rawFile.name
      imageWidth.value = img.naturalWidth
      imageHeight.value = img.naturalHeight
      resultImage.value = ''
      errorMsg.value = ''
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(rawFile)
}

function applyWatermark() {
  if (!originalImage.value || !watermarkText.value) {
    errorMsg.value = '请上传图片并输入水印文字'
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = imageWidth.value
  canvas.height = imageHeight.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 绘制原图
  ctx.drawImage(originalImage.value, 0, 0)

  // 设置水印样式
  ctx.font = `bold ${fontSize.value}px -apple-system, "Microsoft YaHei", sans-serif`
  ctx.fillStyle = fontColor.value
  ctx.globalAlpha = opacity.value
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (watermarkType.value === 'tile') {
    // 平铺水印
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation.value * Math.PI) / 180)

    const spacing = tileSpacing.value
    const cols = Math.ceil(Math.max(canvas.width, canvas.height) * 2 / spacing)
    for (let x = -cols; x <= cols; x++) {
      for (let y = -cols; y <= cols; y++) {
        ctx.fillText(watermarkText.value, x * spacing, y * spacing)
      }
    }
    ctx.restore()
  } else {
    // 单个水印
    const pos = getPosition(position.value, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(pos.x, pos.y)
    ctx.rotate((rotation.value * Math.PI) / 180)
    ctx.fillText(watermarkText.value, 0, 0)
    ctx.restore()
  }

  ctx.globalAlpha = 1
  resultImage.value = canvas.toDataURL('image/png')
}

function getPosition(pos: string, w: number, h: number): { x: number; y: number } {
  const padding = 20
  const positions: Record<string, { x: number; y: number }> = {
    'top-left': { x: padding, y: padding },
    'top-center': { x: w / 2, y: padding },
    'top-right': { x: w - padding, y: padding },
    'center-left': { x: padding, y: h / 2 },
    'center': { x: w / 2, y: h / 2 },
    'center-right': { x: w - padding, y: h / 2 },
    'bottom-left': { x: padding, y: h - padding },
    'bottom-center': { x: w / 2, y: h - padding },
    'bottom-right': { x: w - padding, y: h - padding },
  }
  return positions[pos] || positions.center
}

function download() {
  if (!resultImage.value) return
  const a = document.createElement('a')
  a.href = resultImage.value
  a.download = `watermarked-${imageName.value || 'image.png'}`
  a.click()
}

function reset() {
  originalImage.value = null
  imageName.value = ''
  imageWidth.value = 0
  imageHeight.value = 0
  resultImage.value = ''
  errorMsg.value = ''
}
</script>

<style scoped>
.image-watermark {
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
