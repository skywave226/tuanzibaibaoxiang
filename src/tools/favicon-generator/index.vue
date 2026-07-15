<template>
  <div class="favicon-generator">
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">设计配置</h3>

      <div class="config-section">
        <div class="config-item">
          <label>内容类型</label>
          <n-radio-group v-model:value="contentType" size="small">
            <n-radio-button value="text">文字</n-radio-button>
            <n-radio-button value="emoji">Emoji</n-radio-button>
          </n-radio-group>
        </div>

        <div class="config-item">
          <label>{{ contentType === 'text' ? '文字内容' : 'Emoji' }}</label>
          <n-input
            v-model:value="content"
            :placeholder="contentType === 'text' ? '如：A、网、★' : '如：😀'"
            :maxlength="contentType === 'text' ? 2 : 4"
            style="width: 160px"
          />
        </div>

        <div class="config-item">
          <label>背景色</label>
          <div class="color-row">
            <input type="color" v-model="bgColor" class="color-input" />
            <n-input v-model:value="bgColor" style="width: 120px" />
          </div>
        </div>

        <div class="config-item">
          <label>文字颜色</label>
          <div class="color-row">
            <input type="color" v-model="fgColor" class="color-input" />
            <n-input v-model:value="fgColor" style="width: 120px" />
          </div>
        </div>

        <div class="config-item">
          <label>圆角</label>
          <n-slider v-model:value="radius" :min="0" :max="50" :step="1" style="width: 160px" />
        </div>

        <div class="config-item">
          <label>字号比例</label>
          <n-slider v-model:value="fontScale" :min="0.3" :max="0.9" :step="0.05" style="width: 160px" />
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">预览</h3>
      <div class="preview-row">
        <div v-for="size in sizes" :key="size" class="preview-item">
          <canvas
            :ref="el => setCanvasRef(el, size)"
            class="preview-canvas"
            :style="{ width: size + 'px', height: size + 'px' }"
          ></canvas>
          <div class="preview-label">{{ size }}×{{ size }}</div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="export-header">
        <h3 class="text-sm font-bold">导出</h3>
        <n-button type="primary" size="small" @click="downloadAll">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
          全部下载（ZIP）
        </n-button>
      </div>

      <div class="export-list mt-3">
        <div v-for="size in exportSizes" :key="size" class="export-item">
          <canvas
            :ref="el => setExportCanvasRef(el, size)"
            :style="{ width: '32px', height: '32px' }"
            class="export-canvas"
          ></canvas>
          <span class="export-size">favicon-{{ size }}x{{ size }}.png</span>
          <n-button size="small" @click="downloadPng(size)">下载 PNG</n-button>
          <n-button size="small" v-if="size === 32" @click="downloadIco">下载 ICO</n-button>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="text-sm font-bold mb-3">HTML 引用代码</h3>
      <n-input
        :value="htmlCode"
        type="textarea"
        readonly
        rows="8"
        class="code-output"
      />
      <n-button size="small" @click="copyHtml" class="mt-2">复制代码</n-button>
    </div>

    <n-alert type="success" v-if="copiedMsg" class="mt-4" closable @close="copiedMsg = ''">
      {{ copiedMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { NInput, NRadioGroup, NRadioButton, NSlider, NButton, NAlert } from 'naive-ui'

const contentType = ref<'text' | 'emoji'>('text')
const content = ref('A')
const bgColor = ref('#3366ff')
const fgColor = ref('#ffffff')
const radius = ref(20)
const fontScale = ref(0.6)
const copiedMsg = ref('')

const sizes = [16, 32, 48, 64, 128]
const exportSizes = [16, 32, 48, 64, 128, 180, 192, 256]

// Canvas 引用管理
const canvasRefs = new Map<number, HTMLCanvasElement>()
const exportCanvasRefs = new Map<number, HTMLCanvasElement>()

function setCanvasRef(el: any, size: number) {
  if (el) canvasRefs.set(size, el)
}

function setExportCanvasRef(el: any, size: number) {
  if (el) exportCanvasRefs.set(size, el)
}

function drawFavicon(canvas: HTMLCanvasElement, size: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = size
  canvas.height = size
  ctx.clearRect(0, 0, size, size)

  // 圆角矩形背景
  const r = (radius.value / 100) * size
  ctx.fillStyle = bgColor.value
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  // 绘制文字
  const text = content.value || 'A'
  const fontSize = size * fontScale.value
  ctx.fillStyle = fgColor.value
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (contentType.value === 'emoji') {
    // Emoji 需要特定字体
    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
  } else {
    ctx.font = `bold ${fontSize}px -apple-system, "Microsoft YaHei", sans-serif`
  }

  ctx.fillText(text, size / 2, size / 2 + size * 0.02)
}

function redrawAll() {
  canvasRefs.forEach((canvas, size) => drawFavicon(canvas, size))
  exportCanvasRefs.forEach((canvas, size) => drawFavicon(canvas, size))
}

const htmlCode = ref(`<!-- Favicon HTML 引用代码 -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="shortcut icon" href="/favicon.ico">`)

function downloadPng(size: number) {
  const canvas = exportCanvasRefs.get(size)
  if (!canvas) return

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `favicon-${size}x${size}.png`
    a.click()
    URL.revokeObjectURL(url)
    copiedMsg.value = `已下载 favicon-${size}x${size}.png`
    setTimeout(() => { copiedMsg.value = '' }, 2000)
  })
}

function downloadIco() {
  const canvas = exportCanvasRefs.get(32)
  if (!canvas) return

  // 简易 ICO 格式（仅包含 32x32 PNG）
  canvas.toBlob((blob) => {
    if (!blob) return
    const reader = new FileReader()
    reader.onload = () => {
      const pngData = new Uint8Array(reader.result as ArrayBuffer)
      // ICO 文件头（6 字节）+ 目录项（16 字节）+ PNG 数据
      const ico = new Uint8Array(6 + 16 + pngData.length)
      const view = new DataView(ico.buffer)

      // ICO 文件头
      view.setUint16(0, 0, true)  // 保留字段
      view.setUint16(2, 1, true)  // 图像类型（1 = ICO）
      view.setUint16(4, 1, true)  // 图像数量

      // 目录项
      view.setUint8(6, 32)        // 宽度
      view.setUint8(7, 32)        // 高度
      view.setUint8(8, 0)         // 颜色数
      view.setUint8(9, 0)         // 保留
      view.setUint16(10, 1, true) // 色彩平面
      view.setUint16(12, 32, true) // 位深度
      view.setUint32(14, pngData.length, true) // 数据大小
      view.setUint32(18, 22, true) // 数据偏移

      ico.set(pngData, 22)

      const blob = new Blob([ico], { type: 'image/x-icon' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'favicon.ico'
      a.click()
      URL.revokeObjectURL(url)
      copiedMsg.value = '已下载 favicon.ico'
      setTimeout(() => { copiedMsg.value = '' }, 2000)
    }
    reader.readAsArrayBuffer(blob)
  })
}

function downloadAll() {
  exportSizes.forEach((size, index) => {
    setTimeout(() => downloadPng(size), index * 200)
  })
  setTimeout(() => downloadIco(), exportSizes.length * 200)
}

function copyHtml() {
  navigator.clipboard.writeText(htmlCode.value)
  copiedMsg.value = 'HTML 代码已复制'
  setTimeout(() => { copiedMsg.value = '' }, 2000)
}

// 监听配置变化重绘
watch([contentType, content, bgColor, fgColor, radius, fontScale], () => {
  nextTick(redrawAll)
})

onMounted(() => {
  nextTick(redrawAll)
})
</script>

<style scoped>
.favicon-generator {
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

.preview-row {
  display: flex;
  gap: 24px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-canvas {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  image-rendering: pixelated;
}

.preview-label {
  font-size: 12px;
  color: #888;
  font-family: 'Fira Code', monospace;
}

.export-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.export-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  background: #f5f5f5;
}

.dark .export-item {
  background: #1e2a4a;
}

.export-canvas {
  image-rendering: pixelated;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.export-size {
  flex: 1;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

.code-output :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}
</style>
