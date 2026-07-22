<template>
  <div class="watermark-remover">
    <n-alert type="info" class="mb-4">
      用图片上相邻的干净区域覆盖水印。适合纯色/纹理简单背景，复杂背景效果有限。
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

      <div v-if="imageLoaded" class="controls mt-4">
        <div class="control-row">
          <span>修复方式</span>
          <n-radio-group v-model:value="mode" size="small">
            <n-radio-button value="clone">仿制图章</n-radio-button>
            <n-radio-button value="blur">高斯模糊</n-radio-button>
          </n-radio-group>
        </div>
        <div class="control-row">
          <span>笔刷大小</span>
          <n-slider v-model:value="brushSize" :min="10" :max="200" :step="5" style="width: 200px" />
          <span>{{ brushSize }}px</span>
        </div>
        <div class="control-row">
          <span>取样偏移（仿制图章）</span>
          <n-slider v-model:value="cloneOffset" :min="10" :max="200" :step="5" style="width: 160px" />
          <span>{{ cloneOffset }}px</span>
        </div>
      </div>

      <n-button v-if="imageLoaded" type="primary" class="mt-4" @click="download">下载结果</n-button>
    </div>

    <div v-if="imageLoaded" class="canvas-area card">
      <div class="canvas-header mb-2">
        <span class="text-sm font-bold">在水印上涂抹覆盖</span>
        <n-button size="tiny" quaternary @click="reset">重置</n-button>
      </div>
      <div class="canvas-wrapper" ref="wrapperRef">
        <canvas
          ref="canvasRef"
          class="edit-canvas"
          @mousedown="startDraw"
          @mousemove="draw"
          @mouseup="stopDraw"
          @mouseleave="stopDraw"
          @touchstart.prevent="startTouchDraw"
          @touchmove.prevent="touchDraw"
          @touchend="stopDraw"
        />
      </div>
      <div class="hint mt-2 text-sm text-gray-500">
        提示：按住鼠标在水印区域涂抹，工具会用左侧相邻区域取样覆盖。
      </div>
    </div>

    <n-alert v-if="error" type="error" class="mt-4" closable @close="error = ''">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { NUpload, NButton, NSlider, NRadioGroup, NRadioButton, NAlert } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)
const imageLoaded = ref(false)
const brushSize = ref(40)
const cloneOffset = ref(60)
const mode = ref<'clone' | 'blur'>('clone')
const error = ref('')
const fileName = ref('')

let originalImage: HTMLImageElement | null = null
let isDrawing = false
let scaleRatio = 1

function handleUpload({ file }: UploadCustomRequestOptions) {
  const uploadFile = file.file as File
  error.value = ''
  fileName.value = uploadFile.name

  const reader = new FileReader()
  reader.onload = () => {
    originalImage = new Image()
    originalImage.onload = () => {
      initCanvas()
      imageLoaded.value = true
    }
    originalImage.src = reader.result as string
  }
  reader.readAsDataURL(uploadFile)
}

function initCanvas() {
  if (!originalImage || !canvasRef.value || !wrapperRef.value) return

  const canvas = canvasRef.value
  const maxWidth = Math.min(wrapperRef.value.clientWidth || 800, 900)
  scaleRatio = Math.min(1, maxWidth / originalImage.width)

  canvas.width = originalImage.width * scaleRatio
  canvas.height = originalImage.height * scaleRatio

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height)
}

function getPos(e: MouseEvent): { x: number; y: number } {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  }
}

function getTouchPos(e: TouchEvent): { x: number; y: number } {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]
  return {
    x: (touch.clientX - rect.left) * (canvas.width / rect.width),
    y: (touch.clientY - rect.top) * (canvas.height / rect.height),
  }
}

function startDraw(e: MouseEvent) {
  isDrawing = true
  draw(e)
}

function startTouchDraw(e: TouchEvent) {
  isDrawing = true
  touchDraw(e)
}

function draw(e: MouseEvent) {
  if (!isDrawing) return
  const pos = getPos(e)
  applyTool(pos.x, pos.y)
}

function touchDraw(e: TouchEvent) {
  if (!isDrawing) return
  const pos = getTouchPos(e)
  applyTool(pos.x, pos.y)
}

function stopDraw() {
  isDrawing = false
}

function applyTool(x: number, y: number) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const r = brushSize.value * scaleRatio

  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.clip()

  if (mode.value === 'clone') {
    const offset = cloneOffset.value * scaleRatio
    const sx = Math.max(0, x - offset)
    ctx.drawImage(canvas, sx - r, y - r, r * 2, r * 2, x - r, y - r, r * 2, r * 2)
  } else {
    ctx.filter = `blur(${r * 0.6}px)`
    ctx.drawImage(canvas, 0, 0)
  }

  ctx.restore()
}

function reset() {
  initCanvas()
}

function download() {
  const canvas = canvasRef.value
  if (!canvas) return
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.value.replace(/\.[^.]+$/i, '-cleaned.png') || 'cleaned.png'
  a.click()
}

onUnmounted(() => {
  originalImage = null
})
</script>

<style scoped>
.watermark-remover { max-width: 1000px; margin: 0 auto; }

.controls { display: flex; flex-direction: column; gap: 12px; }

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.canvas-area { padding: 16px; }

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.canvas-wrapper {
  width: 100%;
  overflow: auto;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.dark .canvas-wrapper { border-color: #2a2a4a; }

.edit-canvas {
  display: block;
  max-width: 100%;
  cursor: crosshair;
}
</style>
