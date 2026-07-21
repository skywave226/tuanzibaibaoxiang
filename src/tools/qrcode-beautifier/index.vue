<template>
  <div class="qrcode-beautifier">
    <n-alert type="info" class="mb-4">高颜值二维码生成器，支持圆点、圆角、渐变、中心 Logo 与多种 eye 样式。</n-alert>

    <div class="two-col">
      <div class="left">
        <div class="card mb-4">
          <div class="pane-label mb-2">内容</div>
          <n-input v-model:value="text" type="textarea" :rows="3" placeholder="输入文本、链接、WiFi 配置等内容" />
          <div class="actions mt-3">
            <n-button type="primary" @click="render" :loading="rendering">生成 / 更新</n-button>
            <n-button @click="loadExample">示例</n-button>
            <n-button @click="clear">清空</n-button>
          </div>
        </div>

        <div class="card mb-4">
          <div class="pane-label mb-3">样式设置</div>

          <div class="options-grid">
            <div class="option-item">
              <span class="option-label">码点样式</span>
              <n-select v-model:value="pattern" :options="patternOptions" />
            </div>
            <div class="option-item">
              <span class="option-label"> eye 样式</span>
              <n-select v-model:value="eyeStyle" :options="eyeOptions" />
            </div>
            <div class="option-item">
              <span class="option-label">前景色</span>
              <n-color-picker v-model:value="fgColor" :swatches="colorSwatches" />
            </div>
            <div class="option-item">
              <span class="option-label">渐变结束色</span>
              <n-color-picker v-model:value="fgColor2" :swatches="colorSwatches" />
            </div>
            <div class="option-item">
              <span class="option-label">背景色</span>
              <n-color-picker v-model:value="bgColor" :swatches="colorSwatches" />
            </div>
            <div class="option-item">
              <span class="option-label">尺寸</span>
              <n-select v-model:value="size" :options="sizeOptions" />
            </div>
            <div class="option-item">
              <span class="option-label">纠错等级</span>
              <n-select v-model:value="errorCorrectionLevel" :options="errorOptions" />
            </div>
            <div class="option-item">
              <span class="option-label">渐变方向</span>
              <n-select v-model:value="gradientDirection" :options="gradientOptions" />
            </div>
          </div>

          <n-checkbox v-model:checked="useGradient" class="mt-3">启用渐变前景色</n-checkbox>

          <div class="logo-section mt-4">
            <div class="section-header mb-2">
              <span class="option-label">中心 Logo</span>
              <n-button v-if="logoUrl" size="tiny" quaternary type="error" @click="clearLogo">清除</n-button>
            </div>
            <n-upload accept="image/*" :show-file-list="false" :custom-request="handleLogoUpload">
              <n-button size="small" dashed>上传 Logo</n-button>
            </n-upload>
            <img v-if="logoUrl" :src="logoUrl" class="logo-preview" alt="Logo 预览" />
          </div>
        </div>
      </div>

      <div class="right">
        <div class="card preview-card">
          <div class="section-header mb-3">
            <span class="pane-label">预览</span>
            <n-space>
              <n-button size="small" @click="downloadPng">下载 PNG</n-button>
              <n-button size="small" @click="downloadSvg">下载 SVG</n-button>
              <n-button size="small" @click="copyImage">复制</n-button>
            </n-space>
          </div>
          <div class="preview-wrap">
            <canvas ref="canvasRef" class="qrcode-canvas"></canvas>
            <n-empty v-if="!text.trim() && !dataUrl" description="输入内容后生成二维码" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { NInput, NButton, NSelect, NColorPicker, NAlert, NSpace, NUpload, NEmpty, NCheckbox } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const text = ref('https://tool.youxianmengguan.com')
const pattern = ref<'square' | 'rounded' | 'dot' | 'liquid'>('rounded')
const eyeStyle = ref<'square' | 'rounded' | 'circle'>('rounded')
const fgColor = ref('#000000')
const fgColor2 = ref('#6366f1')
const bgColor = ref('#ffffff')
const useGradient = ref(false)
const gradientDirection = ref<'horizontal' | 'vertical' | 'diagonal'>('diagonal')
const size = ref(400)
const errorCorrectionLevel = ref<'L' | 'M' | 'Q' | 'H'>('H')
const rendering = ref(false)
const logoUrl = ref('')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const dataUrl = ref('')
let svgString = ''
let logoFile: File | null = null

const colorSwatches = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff6600', '#9900ff', '#6366f1', '#ec4899']
const patternOptions = [
  { label: '方点', value: 'square' },
  { label: '圆角', value: 'rounded' },
  { label: '圆点', value: 'dot' },
  { label: '液态', value: 'liquid' },
]
const eyeOptions = [
  { label: '方形', value: 'square' },
  { label: '圆角', value: 'rounded' },
  { label: '圆形', value: 'circle' },
]
const sizeOptions = [
  { label: '200x200', value: 200 },
  { label: '300x300', value: 300 },
  { label: '400x400', value: 400 },
  { label: '500x500', value: 500 },
  { label: '800x800', value: 800 },
]
const errorOptions = [
  { label: 'L（低）', value: 'L' },
  { label: 'M（中）', value: 'M' },
  { label: 'Q（较高）', value: 'Q' },
  { label: 'H（高）', value: 'H' },
]
const gradientOptions = [
  { label: '水平', value: 'horizontal' },
  { label: '垂直', value: 'vertical' },
  { label: '对角', value: 'diagonal' },
]

onMounted(() => {
  initAndRender()
})

watch([pattern, eyeStyle, fgColor, fgColor2, bgColor, useGradient, gradientDirection, size, errorCorrectionLevel, logoUrl], () => {
  initAndRender()
}, { deep: true })

function loadExample() {
  text.value = 'https://tool.youxianmengguan.com'
  render()
}

function clear() {
  text.value = ''
  dataUrl.value = ''
  svgString = ''
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
}

function handleLogoUpload({ file }: UploadCustomRequestOptions) {
  logoFile = file.file as File
  const reader = new FileReader()
  reader.onload = (e) => {
    logoUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(logoFile)
}

function clearLogo() {
  logoUrl.value = ''
  logoFile = null
}

function isEyeArea(x: number, y: number, moduleCount: number): boolean {
  const size = 7
  return (
    (x < size && y < size) ||
    (x >= moduleCount - size && y < size) ||
    (x < size && y >= moduleCount - size)
  )
}

function getGradientColors(): string[] {
  return useGradient.value ? [fgColor.value, fgColor2.value] : [fgColor.value, fgColor.value]
}

async function initAndRender() {
  if (!qrcodeModule) {
    qrcodeModule = await import('qrcode')
  }
  await render()
}

async function render() {
  if (!text.value.trim()) {
    dataUrl.value = ''
    svgString = ''
    return
  }
  rendering.value = true
  await nextTick()
  try {
    await renderCanvas()
    svgString = await buildSvg()
  }
  catch (e) {
    // ignore
  }
  finally {
    rendering.value = false
  }
}

async function renderCanvas(): Promise<void> {
  const QRCode = await import('qrcode')
  const qr = QRCode.create(text.value.trim(), {
    errorCorrectionLevel: errorCorrectionLevel.value,
  })
  const modules = qr.modules
  const moduleCount = modules.size
  const canvasSize = size.value
  const moduleSize = canvasSize / moduleCount
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = canvasSize
  canvas.height = canvasSize
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  const [startColor, endColor] = getGradientColors()
  const gradient = createCanvasGradient(ctx, canvasSize, startColor, endColor)
  ctx.fillStyle = gradient

  const radiusRatio = pattern.value === 'dot' ? 0.5 : pattern.value === 'rounded' ? 0.35 : pattern.value === 'liquid' ? 0.45 : 0

  for (let y = 0; y < moduleCount; y++) {
    for (let x = 0; x < moduleCount; x++) {
      if (!modules.get(x, y)) continue
      const px = x * moduleSize
      const py = y * moduleSize
      const isEye = isEyeArea(x, y, moduleCount)

      if (isEye) {
        drawEye(ctx, px, py, moduleSize, eyeStyle.value)
      }
      else if (pattern.value === 'square') {
        ctx.fillRect(px, py, moduleSize, moduleSize)
      }
      else if (pattern.value === 'rounded') {
        roundRect(ctx, px + 1, py + 1, moduleSize - 2, moduleSize - 2, moduleSize * radiusRatio)
        ctx.fill()
      }
      else if (pattern.value === 'dot') {
        ctx.beginPath()
        ctx.arc(px + moduleSize / 2, py + moduleSize / 2, moduleSize * radiusRatio, 0, Math.PI * 2)
        ctx.fill()
      }
      else if (pattern.value === 'liquid') {
        drawLiquid(ctx, x, y, modules, moduleSize, moduleCount)
      }
    }
  }

  drawEyeFrames(ctx, moduleCount, moduleSize)

  if (logoUrl.value) {
    await drawLogo(ctx, canvasSize)
  }

  dataUrl.value = canvas.toDataURL('image/png')
}

function createCanvasGradient(ctx: CanvasRenderingContext2D, canvasSize: number, startColor: string, endColor: string): CanvasGradient {
  let gradient: CanvasGradient
  if (gradientDirection.value === 'horizontal') {
    gradient = ctx.createLinearGradient(0, 0, canvasSize, 0)
  }
  else if (gradientDirection.value === 'vertical') {
    gradient = ctx.createLinearGradient(0, 0, 0, canvasSize)
  }
  else {
    gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize)
  }
  gradient.addColorStop(0, startColor)
  gradient.addColorStop(1, endColor)
  return gradient
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function drawEye(ctx: CanvasRenderingContext2D, px: number, py: number, moduleSize: number, style: string) {
  const r = style === 'circle' ? moduleSize / 2 : style === 'rounded' ? moduleSize * 0.25 : 0
  if (style === 'circle') {
    ctx.beginPath()
    ctx.arc(px + moduleSize / 2, py + moduleSize / 2, moduleSize / 2 - 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
  else if (style === 'rounded') {
    roundRect(ctx, px + 0.5, py + 0.5, moduleSize - 1, moduleSize - 1, r)
    ctx.fill()
  }
  else {
    ctx.fillRect(px, py, moduleSize, moduleSize)
  }
}

function drawEyeFrames(ctx: CanvasRenderingContext2D, moduleCount: number, moduleSize: number) {
  const positions = [
    { x: 0, y: 0 },
    { x: moduleCount - 7, y: 0 },
    { x: 0, y: moduleCount - 7 },
  ]
  ctx.fillStyle = fgColor.value
  for (const pos of positions) {
    const px = pos.x * moduleSize
    const py = pos.y * moduleSize
    const outerSize = moduleSize * 7
    const innerOffset = moduleSize * 2
    const innerSize = moduleSize * 3
    ctx.strokeStyle = ctx.fillStyle
    ctx.lineWidth = moduleSize
    ctx.strokeRect(px + moduleSize / 2, py + moduleSize / 2, outerSize - moduleSize, outerSize - moduleSize)
    ctx.fillRect(px + innerOffset, py + innerOffset, innerSize, innerSize)
  }
}

function drawLiquid(ctx: CanvasRenderingContext2D, x: number, y: number, modules: any, moduleSize: number, moduleCount: number) {
  const px = x * moduleSize
  const py = y * moduleSize
  const r = moduleSize * 0.45
  ctx.beginPath()
  ctx.arc(px + moduleSize / 2, py + moduleSize / 2, r, 0, Math.PI * 2)
  ctx.fill()

  const neighbors = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
  ]
  for (const [dx, dy] of neighbors) {
    const nx = x + dx
    const ny = y + dy
    if (nx >= 0 && nx < moduleCount && ny >= 0 && ny < moduleCount && modules.get(nx, ny) && !isEyeArea(nx, ny, moduleCount)) {
      const cx = px + moduleSize / 2 + dx * moduleSize / 2
      const cy = py + moduleSize / 2 + dy * moduleSize / 2
      ctx.beginPath()
      ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

async function drawLogo(ctx: CanvasRenderingContext2D, canvasSize: number): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const logoSize = Math.round(canvasSize * 0.18)
      const x = (canvasSize - logoSize) / 2
      const y = (canvasSize - logoSize) / 2
      ctx.fillStyle = bgColor.value
      ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8)
      ctx.drawImage(img, x, y, logoSize, logoSize)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = logoUrl.value
  })
}

async function buildSvg(): Promise<string> {
  if (!qrcodeModule) {
    qrcodeModule = await import('qrcode')
  }
  const qrObj = (qrcodeModule as any).create(text.value.trim(), {
    errorCorrectionLevel: errorCorrectionLevel.value,
  })
  const modules = qrObj.modules
  const moduleCount = modules.size
  const canvasSize = size.value
  const moduleSize = canvasSize / moduleCount
  const [startColor, endColor] = getGradientColors()
  const gradientId = 'qrGradient'

  let defs = ''
  if (useGradient.value) {
    const x1 = gradientDirection.value === 'horizontal' ? '0%' : '0%'
    const y1 = '0%'
    const x2 = gradientDirection.value === 'horizontal' ? '100%' : gradientDirection.value === 'vertical' ? '0%' : '100%'
    const y2 = gradientDirection.value === 'vertical' ? '100%' : '100%'
    defs += `<linearGradient id="${gradientId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0%" stop-color="${startColor}"/><stop offset="100%" stop-color="${endColor}"/></linearGradient>`
  }

  const fillColor = useGradient.value ? `url(#${gradientId})` : fgColor.value
  let paths = ''

  for (let y = 0; y < moduleCount; y++) {
    for (let x = 0; x < moduleCount; x++) {
      if (!modules.get(x, y)) continue
      const px = x * moduleSize
      const py = y * moduleSize
      const isEye = isEyeArea(x, y, moduleCount)

      if (isEye) {
        paths += svgEye(px, py, moduleSize, eyeStyle.value)
      }
      else if (pattern.value === 'square') {
        paths += `<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" fill="${fillColor}"/>`
      }
      else if (pattern.value === 'rounded') {
        paths += `<rect x="${px + 1}" y="${py + 1}" width="${moduleSize - 2}" height="${moduleSize - 2}" rx="${moduleSize * 0.35}" fill="${fillColor}"/>`
      }
      else if (pattern.value === 'dot' || pattern.value === 'liquid') {
        paths += `<circle cx="${px + moduleSize / 2}" cy="${py + moduleSize / 2}" r="${moduleSize * 0.45}" fill="${fillColor}"/>`
      }
    }
  }

  paths += svgEyeFrames(moduleCount, moduleSize, fillColor)

  let logoSvg = ''
  if (logoUrl.value) {
    const logoSize = Math.round(canvasSize * 0.18)
    const x = (canvasSize - logoSize) / 2
    const y = (canvasSize - logoSize) / 2
    logoSvg += `<rect x="${x - 4}" y="${y - 4}" width="${logoSize + 8}" height="${logoSize + 8}" fill="${bgColor.value}"/><image href="${logoUrl.value}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}"><defs>${defs}</defs><rect width="100%" height="100%" fill="${bgColor.value}"/>${paths}${logoSvg}</svg>`
}

function svgEye(px: number, py: number, moduleSize: number, style: string): string {
  const cx = px + moduleSize / 2
  const cy = py + moduleSize / 2
  const fill = useGradient.value ? 'url(#qrGradient)' : fgColor.value
  if (style === 'circle') {
    return `<circle cx="${cx}" cy="${cy}" r="${moduleSize / 2 - 0.5}" fill="${fill}"/>`
  }
  if (style === 'rounded') {
    return `<rect x="${px + 0.5}" y="${py + 0.5}" width="${moduleSize - 1}" height="${moduleSize - 1}" rx="${moduleSize * 0.25}" fill="${fill}"/>`
  }
  return `<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" fill="${fill}"/>`
}

function svgEyeFrames(moduleCount: number, moduleSize: number, fillColor: string): string {
  const positions = [
    { x: 0, y: 0 },
    { x: moduleCount - 7, y: 0 },
    { x: 0, y: moduleCount - 7 },
  ]
  let s = ''
  for (const pos of positions) {
    const px = pos.x * moduleSize
    const py = pos.y * moduleSize
    const outer = moduleSize * 7
    const innerOffset = moduleSize * 2
    const innerSize = moduleSize * 3
    s += `<rect x="${px + moduleSize / 2}" y="${py + moduleSize / 2}" width="${outer - moduleSize}" height="${outer - moduleSize}" fill="none" stroke="${fillColor}" stroke-width="${moduleSize}"/>`
    s += `<rect x="${px + innerOffset}" y="${py + innerOffset}" width="${innerSize}" height="${innerSize}" fill="${fillColor}"/>`
  }
  return s
}

let qrcodeModule: any = null

function sanitizeFileName(name: string): string {
  return name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\-_]/g, '_').slice(0, 50) || 'qrcode'
}

function downloadPng() {
  if (!dataUrl.value) return
  const a = document.createElement('a')
  a.href = dataUrl.value
  a.download = `${sanitizeFileName(text.value)}.png`
  a.click()
}

function downloadSvg() {
  if (!svgString) return
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFileName(text.value)}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

async function copyImage() {
  if (!dataUrl.value) return
  try {
    const res = await fetch(dataUrl.value)
    const blob = await res.blob()
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
  }
  catch {
    // ignore
  }
}
</script>

<style scoped>
.qrcode-beautifier {
  max-width: 1200px;
  margin: 0 auto;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}

.left {
  display: flex;
  flex-direction: column;
}

.right {
  position: sticky;
  top: 16px;
  align-self: flex-start;
}

.card {
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.logo-preview {
  margin-top: 12px;
  max-width: 80px;
  max-height: 80px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 4px;
}

.preview-card {
  text-align: center;
}

.preview-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 240px;
  border: 1px dashed var(--n-border-color);
  border-radius: 8px;
  padding: 16px;
  position: relative;
}

.qrcode-canvas {
  max-width: 100%;
  border-radius: 8px;
}
</style>
