<template>
  <div class="bg-remover">
    <n-alert type="info" class="mb-4">
      基于颜色容差算法，适合处理纯色背景图片。复杂背景建议使用专业 AI 抠图服务。
    </n-alert>

    <div class="card mb-4">
      <n-upload accept="image/*" :show-file-list="false" :custom-request="handleUpload">
        <n-button type="primary">
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </template>
          选择图片
        </n-button>
      </n-upload>

      <div class="controls mt-4">
        <div class="control-row">
          <span>目标颜色</span>
          <input type="color" v-model="targetColor" class="color-picker" />
          <n-button size="tiny" quaternary @click="pickCornerColor">取左上角颜色</n-button>
          <n-button size="tiny" quaternary @click="pickCenterColor">取中心颜色</n-button>
        </div>
        <div class="control-row">
          <span>容差</span>
          <n-slider v-model:value="tolerance" :min="0" :max="120" :step="1" style="width: 200px" />
          <span>{{ tolerance }}</span>
        </div>
        <div class="control-row">
          <span>输出背景</span>
          <n-radio-group v-model:value="outputMode" size="small">
            <n-radio-button value="transparent">透明</n-radio-button>
            <n-radio-button value="color">纯色</n-radio-button>
          </n-radio-group>
          <input v-if="outputMode === 'color'" type="color" v-model="bgColor" class="color-picker" />
        </div>
        <div class="control-row">
          <n-checkbox v-model:checked="feather">边缘羽化</n-checkbox>
          <n-checkbox v-model:checked="invert">反选（保留背景）</n-checkbox>
        </div>
      </div>

      <n-button type="primary" class="mt-4" @click="process" :loading="loading" :disabled="!imageLoaded">处理</n-button>
    </div>

    <div class="preview-area" v-if="imageLoaded">
      <div class="preview-box">
        <div class="preview-label">原图</div>
        <canvas ref="sourceCanvas" class="preview-canvas"></canvas>
      </div>
      <div class="preview-box">
        <div class="preview-label">结果</div>
        <canvas ref="resultCanvas" class="preview-canvas"></canvas>
      </div>
    </div>

    <div class="card mt-4" v-if="resultUrl">
      <n-button type="primary" @click="download">下载结果</n-button>
    </div>

    <n-alert v-if="error" type="error" class="mt-4" closable @close="error = ''">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { NUpload, NButton, NSlider, NRadioGroup, NRadioButton, NCheckbox, NAlert } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const sourceCanvas = ref<HTMLCanvasElement | null>(null)
const resultCanvas = ref<HTMLCanvasElement | null>(null)
const targetColor = ref('#ffffff')
const bgColor = ref('#00ff00')
const tolerance = ref(30)
const outputMode = ref<'transparent' | 'color'>('transparent')
const feather = ref(true)
const invert = ref(false)
const loading = ref(false)
const error = ref('')
const imageLoaded = ref(false)
const resultUrl = ref('')
const fileName = ref('')

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
      autoPickBackground()
    }
    originalImage.src = reader.result as string
  }
  reader.readAsDataURL(uploadFile)
}

function drawSource() {
  if (!originalImage || !sourceCanvas.value) return
  const canvas = sourceCanvas.value
  const maxWidth = 800
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

function getCanvasPixel(canvas: HTMLCanvasElement, x: number, y: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  return ctx.getImageData(x, y, 1, 1).data
}

function autoPickBackground() {
  if (!sourceCanvas.value) return
  const data = getCanvasPixel(sourceCanvas.value, 0, 0)
  if (data) {
    targetColor.value = rgbToHex(data[0], data[1], data[2])
  }
}

function pickCornerColor() {
  if (!sourceCanvas.value) return
  const data = getCanvasPixel(sourceCanvas.value, 0, 0)
  if (data) targetColor.value = rgbToHex(data[0], data[1], data[2])
}

function pickCenterColor() {
  if (!sourceCanvas.value) return
  const canvas = sourceCanvas.value
  const data = getCanvasPixel(sourceCanvas.value, Math.floor(canvas.width / 2), Math.floor(canvas.height / 2))
  if (data) targetColor.value = rgbToHex(data[0], data[1], data[2])
}

function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2))
}

function process() {
  if (!sourceCanvas.value || !resultCanvas.value) return
  loading.value = true

  try {
    const src = sourceCanvas.value
    const dst = resultCanvas.value
    dst.width = src.width
    dst.height = src.height

    const sctx = src.getContext('2d')
    const dctx = dst.getContext('2d')
    if (!sctx || !dctx) return

    const srcData = sctx.getImageData(0, 0, src.width, src.height)
    const dstData = dctx.createImageData(src.width, src.height)
    const target = hexToRgb(targetColor.value)
    const bg = hexToRgb(bgColor.value)

    for (let i = 0; i < srcData.data.length; i += 4) {
      const r = srcData.data[i]
      const g = srcData.data[i + 1]
      const b = srcData.data[i + 2]
      const a = srcData.data[i + 3]

      const dist = colorDistance({ r, g, b }, target)
      const isBackground = dist <= tolerance.value
      const keepBackground = invert.value ? !isBackground : isBackground

      if (keepBackground) {
        if (outputMode.value === 'transparent') {
          dstData.data[i] = 0
          dstData.data[i + 1] = 0
          dstData.data[i + 2] = 0
          dstData.data[i + 3] = 0
        } else {
          dstData.data[i] = bg.r
          dstData.data[i + 1] = bg.g
          dstData.data[i + 2] = bg.b
          dstData.data[i + 3] = a
        }
      } else {
        dstData.data[i] = r
        dstData.data[i + 1] = g
        dstData.data[i + 2] = b
        dstData.data[i + 3] = a
      }
    }

    if (feather.value && outputMode.value === 'transparent') {
      featherEdges(dstData, src.width, src.height, target)
    }

    dctx.putImageData(dstData, 0, 0)
    resultUrl.value = dst.toDataURL('image/png')
  } catch (e: unknown) {
    error.value = '处理失败：' + (e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

function featherEdges(data: ImageData, width: number, height: number, target: { r: number; g: number; b: number }) {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4
      if (data.data[i + 3] === 0) continue

      const dist = colorDistance({ r: data.data[i], g: data.data[i + 1], b: data.data[i + 2] }, target)
      if (dist < tolerance.value + 20 && dist > tolerance.value - 10) {
        const alpha = Math.max(0, Math.min(255, 255 - (dist - tolerance.value + 10) * 8))
        data.data[i + 3] = alpha
      }
    }
  }
}

function download() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = fileName.value.replace(/\.[^.]+$/, '') + '-bg-removed.png'
  a.click()
}

onUnmounted(() => {
  originalImage = null
})
</script>

<style scoped>
.bg-remover { max-width: 1000px; margin: 0 auto; }

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
</style>
