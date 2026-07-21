<template>
  <div class="id-photo">
    <n-alert type="info" class="mb-4">
      适合纯色背景证件照快速换底色。上传照片后选择目标背景色和尺寸，即可下载标准证件照。
    </n-alert>

    <div class="card mb-4">
      <n-upload accept="image/*" :show-file-list="false" :custom-request="handleUpload">
        <n-button type="primary">
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </template>
          选择照片
        </n-button>
      </n-upload>

      <div class="controls mt-4">
        <div class="control-row">
          <span>背景颜色</span>
          <n-radio-group v-model:value="bgPreset" size="small">
            <n-radio-button value="white">白色 #FFFFFF</n-radio-button>
            <n-radio-button value="blue">蓝色 #438EDB</n-radio-button>
            <n-radio-button value="red">红色 #E60012</n-radio-button>
            <n-radio-button value="custom">自定义</n-radio-button>
          </n-radio-group>
          <input v-if="bgPreset === 'custom'" type="color" v-model="customColor" class="color-picker" />
        </div>

        <div class="control-row">
          <span>证件照尺寸</span>
          <n-select v-model:value="size" :options="sizeOptions" style="width: 180px" size="small" />
        </div>

        <div class="control-row">
          <span>原背景色（用于抠图）</span>
          <input type="color" v-model="targetColor" class="color-picker" />
          <n-button size="tiny" quaternary @click="autoPick">自动识别</n-button>
          <span class="ml-2">容差</span>
          <n-slider v-model:value="tolerance" :min="0" :max="120" :step="1" style="width: 120px" />
          <span>{{ tolerance }}</span>
        </div>
      </div>

      <n-button type="primary" class="mt-4" @click="process" :loading="loading" :disabled="!imageLoaded">生成证件照</n-button>
    </div>

    <div class="preview-area" v-if="imageLoaded">
      <div class="preview-box">
        <div class="preview-label">原图</div>
        <canvas ref="sourceCanvas" class="preview-canvas"></canvas>
      </div>
      <div class="preview-box">
        <div class="preview-label">证件照</div>
        <canvas ref="resultCanvas" class="preview-canvas"></canvas>
      </div>
    </div>

    <div class="card mt-4" v-if="resultUrl">
      <n-space>
        <n-button type="primary" @click="download">下载证件照</n-button>
        <span class="text-sm text-gray-500">{{ selectedSize.label }} {{ selectedSize.width }}×{{ selectedSize.height }}px</span>
      </n-space>
    </div>

    <n-alert v-if="error" type="error" class="mt-4" closable @close="error = ''">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import { NUpload, NButton, NRadioGroup, NRadioButton, NSelect, NSlider, NAlert, NSpace } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const sourceCanvas = ref<HTMLCanvasElement | null>(null)
const resultCanvas = ref<HTMLCanvasElement | null>(null)
const bgPreset = ref<'white' | 'blue' | 'red' | 'custom'>('blue')
const customColor = ref('#438edb')
const targetColor = ref('#ffffff')
const tolerance = ref(35)
const size = ref('one-inch')
const loading = ref(false)
const error = ref('')
const imageLoaded = ref(false)
const resultUrl = ref('')
const fileName = ref('')

const sizeOptions = [
  { label: '一寸照 295×413', value: 'one-inch', width: 295, height: 413 },
  { label: '二寸照 413×626', value: 'two-inch', width: 413, height: 626 },
  { label: '小一寸 260×378', value: 'small-one-inch', width: 260, height: 378 },
  { label: '大一寸 390×567', value: 'big-one-inch', width: 390, height: 567 },
  { label: '小二寸 413×531', value: 'small-two-inch', width: 413, height: 531 },
  { label: '五寸 1050×1500', value: 'five-inch', width: 1050, height: 1500 },
  { label: '原图尺寸', value: 'original', width: 0, height: 0 },
]

const selectedSize = computed(() => {
  return sizeOptions.find(s => s.value === size.value) || sizeOptions[0]
})

const presetColors: Record<string, string> = {
  white: '#ffffff',
  blue: '#438edb',
  red: '#e60012',
}

let originalImage: HTMLImageElement | null = null

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2))
}

function handleUpload({ file }: UploadCustomRequestOptions) {
  const uploadFile = file.file as File
  error.value = ''
  resultUrl.value = ''
  fileName.value = uploadFile.name

  const reader = new FileReader()
  reader.onload = () => {
    originalImage = new Image()
    originalImage.onload = () => {
      drawSource()
      imageLoaded.value = true
      autoPick()
    }
    originalImage.src = reader.result as string
  }
  reader.readAsDataURL(uploadFile)
}

function drawSource() {
  if (!originalImage || !sourceCanvas.value) return
  const canvas = sourceCanvas.value
  const maxWidth = 400
  let { width, height } = originalImage
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(originalImage, 0, 0, width, height)
}

function autoPick() {
  if (!sourceCanvas.value) return
  const ctx = sourceCanvas.value.getContext('2d')
  if (!ctx) return
  const data = ctx.getImageData(0, 0, 1, 1).data
  targetColor.value = rgbToHex(data[0], data[1], data[2])
}

function process() {
  if (!sourceCanvas.value || !resultCanvas.value || !originalImage) return
  loading.value = true

  try {
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = originalImage.width
    tmpCanvas.height = originalImage.height
    const tmpCtx = tmpCanvas.getContext('2d')
    if (!tmpCtx) return
    tmpCtx.drawImage(originalImage, 0, 0)

    const srcData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height)
    const target = hexToRgb(targetColor.value)
    const bgHex = bgPreset.value === 'custom' ? customColor.value : presetColors[bgPreset.value]
    const bg = hexToRgb(bgHex)

    for (let i = 0; i < srcData.data.length; i += 4) {
      const r = srcData.data[i]
      const g = srcData.data[i + 1]
      const b = srcData.data[i + 2]
      const dist = colorDistance({ r, g, b }, target)
      if (dist <= tolerance.value) {
        srcData.data[i] = bg.r
        srcData.data[i + 1] = bg.g
        srcData.data[i + 2] = bg.b
      }
    }

    tmpCtx.putImageData(srcData, 0, 0)

    const dst = resultCanvas.value
    let { width, height } = originalImage
    if (size.value !== 'original') {
      const targetRatio = selectedSize.value.width / selectedSize.value.height
      const currentRatio = width / height

      let cropWidth = width
      let cropHeight = height
      if (currentRatio > targetRatio) {
        cropWidth = height * targetRatio
      } else {
        cropHeight = width / targetRatio
      }

      const sx = (width - cropWidth) / 2
      const sy = (height - cropHeight) / 6 // 偏上一点，人像居中
      dst.width = selectedSize.value.width
      dst.height = selectedSize.value.height
      const dctx = dst.getContext('2d')
      if (!dctx) return
      dctx.drawImage(tmpCanvas, sx, sy, cropWidth, cropHeight, 0, 0, dst.width, dst.height)
    } else {
      dst.width = width
      dst.height = height
      const dctx = dst.getContext('2d')
      if (!dctx) return
      dctx.drawImage(tmpCanvas, 0, 0)
    }

    resultUrl.value = dst.toDataURL('image/jpeg', 0.95)
  } catch (e: unknown) {
    error.value = '处理失败：' + (e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

function download() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = fileName.value.replace(/\.[^.]+$/, '') + '-id-photo.jpg'
  a.click()
}

onUnmounted(() => {
  originalImage = null
})
</script>

<style scoped>
.id-photo { max-width: 1000px; margin: 0 auto; }

.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.color-picker {
  width: 40px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.preview-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.preview-box {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.dark .preview-box { border-color: #2a2a4a; }

.preview-label {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  background: #f9f9f9;
}

.dark .preview-label { background: #1e1e1e; }

.preview-canvas {
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 768px) {
  .preview-area { grid-template-columns: 1fr; }
}

.ml-2 { margin-left: 8px; }
</style>
