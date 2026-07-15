<template>
  <div class="game-color-picker">
    <div class="picker-row">
      <!-- SV 选择区 + 色相滑块 -->
      <div class="picker-area">
        <canvas ref="svCanvasRef" :width="size" :height="size" class="sv-canvas"
          @mousedown="onSvDown" />
        <canvas ref="hueCanvasRef" :width="24" :height="size" class="hue-canvas"
          @mousedown="onHueDown" />
      </div>

      <!-- 当前颜色预览 + V 滑块 -->
      <div class="side-panel">
        <div class="preview" :style="{ background: hex }">
          <div class="preview-text" :style="{ color: contrastColor }">{{ hex }}</div>
        </div>
        <div class="v-slider-wrap">
          <label>明度 (Value)</label>
          <div class="v-slider-track" ref="vTrackRef" @mousedown="onVDown"
            :style="{ background: `linear-gradient(to right, #000, ${hueColor})` }">
            <div class="v-slider-handle" :style="{ left: (val * 100) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 格式输出 -->
    <div class="card mt-4">
      <h3 class="section-title">颜色格式</h3>
      <div class="format-list">
        <div class="format-row" v-for="f in formats" :key="f.label">
          <span class="format-label">{{ f.label }}</span>
          <n-input :value="f.value" readonly size="small" />
          <n-button size="small" quaternary @click="copy(f.value)">复制</n-button>
        </div>
      </div>
      <div class="hex-input-row">
        <span class="format-label">手动输入 HEX</span>
        <n-input v-model:value="hexInput" placeholder="#3366ff" size="small" style="width: 160px" @blur="applyHex" />
        <n-button size="small" type="primary" @click="applyHex">应用</n-button>
      </div>
    </div>

    <!-- 配色方案 -->
    <div class="card mt-4">
      <div class="header-row">
        <h3 class="section-title">配色方案</h3>
        <n-select v-model:value="scheme" :options="schemeOptions" size="small" style="width: 200px" />
      </div>
      <div class="scheme-row">
        <div v-for="(c, i) in schemeColors" :key="i" class="scheme-block"
          :style="{ background: c.hex }" @click="selectColor(c.hex)">
          <div class="scheme-info">
            <div class="scheme-hex">{{ c.hex }}</div>
            <div class="scheme-name">{{ c.name }}</div>
          </div>
        </div>
      </div>
      <div class="hint-text">点击色块应用为基准色</div>
    </div>

    <!-- 对比预览 -->
    <div class="card mt-4">
      <h3 class="section-title">对比预览</h3>
      <div class="contrast-row">
        <div class="contrast-box" :style="{ background: hex, color: contrastColor }">
          文字示例 ABCabc123
        </div>
        <div class="contrast-box" :style="{ background: contrastColor, color: hex }">
          文字示例 ABCabc123
        </div>
      </div>
      <div class="hint-text">对比度比：{{ contrastRatio.toFixed(2) }} : 1
        <span v-if="contrastRatio >= 4.5" class="badge pass">WCAG AA 通过</span>
        <span v-else class="badge fail">WCAG AA 不通过</span>
      </div>
    </div>

    <!-- 导出 -->
    <div class="card mt-4">
      <div class="header-row">
        <h3 class="section-title">导出调色板 JSON</h3>
        <n-button size="small" type="primary" @click="copy(exportJson)">复制 JSON</n-button>
      </div>
      <n-input :value="exportJson" type="textarea" readonly :rows="8" class="code-output" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { NInput, NButton, NSelect, useMessage } from 'naive-ui'

const message = useMessage()

const size = 240
const svCanvasRef = ref<HTMLCanvasElement | null>(null)
const hueCanvasRef = ref<HTMLCanvasElement | null>(null)
const vTrackRef = ref<HTMLElement | null>(null)

// 当前颜色 HSV
const hue = ref(210) // 0-360
const sat = ref(0.8) // 0-1
const val = ref(1)   // 0-1
const hexInput = ref('')

// ---------- 颜色转换 ----------
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = ((h % 360) + 360) % 360
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return [h, s, max]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break
      case g: h = ((b - r) / d + 2); break
      case b: h = ((r - g) / d + 4); break
    }
    h *= 60
  }
  return [h, s, l]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return null
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

// ---------- 计算属性 ----------
const rgb = computed(() => hsvToRgb(hue.value, sat.value, val.value))
const hex = computed(() => rgbToHex(...rgb.value))
const hsl = computed(() => rgbToHsl(...rgb.value))

const formats = computed(() => {
  const [r, g, b] = rgb.value
  const [hh, ss, ll] = hsl.value
  return [
    { label: 'HEX', value: hex.value.toUpperCase() },
    { label: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
    { label: 'HSL', value: `hsl(${Math.round(hh)}, ${Math.round(ss * 100)}%, ${Math.round(ll * 100)}%)` },
    { label: 'HSV', value: `hsv(${Math.round(hue.value)}, ${Math.round(sat.value * 100)}%, ${Math.round(val.value * 100)}%)` },
    { label: 'RGB (0-1)', value: `${(r / 255).toFixed(3)}, ${(g / 255).toFixed(3)}, ${(b / 255).toFixed(3)}` },
  ]
})

const hueColor = computed(() => {
  const [r, g, b] = hsvToRgb(hue.value, 1, 1)
  return `rgb(${r}, ${g}, ${b})`
})

// 亮度计算（用于对比文字颜色）
function luminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}

const contrastColor = computed(() => {
  const [r, g, b] = rgb.value
  return luminance(r, g, b) > 0.5 ? '#000000' : '#ffffff'
})

const contrastRatio = computed(() => {
  const [r, g, b] = rgb.value
  const L1 = luminance(r, g, b)
  const L2 = luminance(...(contrastColor.value === '#000000' ? [0, 0, 0] : [255, 255, 255]) as [number, number, number])
  const light = Math.max(L1, L2)
  const dark = Math.min(L1, L2)
  return (light + 0.05) / (dark + 0.05)
})

// ---------- 配色方案 ----------
const scheme = ref<'complementary' | 'analogous' | 'triadic' | 'split' | 'tetradic'>('triadic')

const schemeOptions = [
  { label: '互补色 (Complementary)', value: 'complementary' },
  { label: '类比色 (Analogous)', value: 'analogous' },
  { label: '三元色 (Triadic)', value: 'triadic' },
  { label: '分裂互补 (Split)', value: 'split' },
  { label: '四元色 (Tetradic)', value: 'tetradic' },
]

const schemeColors = computed(() => {
  const h = hue.value
  const s = sat.value
  const v = val.value
  const make = (dh: number, name: string) => {
    const [r, g, b] = hsvToRgb(h + dh, s, v)
    return { hex: rgbToHex(r, g, b).toUpperCase(), name }
  }
  switch (scheme.value) {
    case 'complementary':
      return [make(0, '基准色'), make(180, '互补色')]
    case 'analogous':
      return [make(-30, '类比 -30°'), make(0, '基准色'), make(30, '类比 +30°')]
    case 'triadic':
      return [make(0, '基准色'), make(120, '三元 +120°'), make(240, '三元 +240°')]
    case 'split':
      return [make(0, '基准色'), make(150, '分裂 -30°'), make(210, '分裂 +30°')]
    case 'tetradic':
      return [make(0, '基准色'), make(90, '四元 +90°'), make(180, '互补色'), make(270, '四元 +270°')]
  }
})

const exportJson = computed(() => {
  const palette: Record<string, string> = {}
  schemeColors.value.forEach((c, i) => {
    palette[`color_${i + 1}`] = c.hex
  })
  palette['base'] = hex.value.toUpperCase()
  palette['rgb'] = `rgb(${rgb.value.join(', ')})`
  palette['hsv'] = `hsv(${Math.round(hue.value)}, ${Math.round(sat.value * 100)}%, ${Math.round(val.value * 100)}%)`
  return JSON.stringify(palette, null, 2)
})

// ---------- 绘制 ----------
function drawSv() {
  const canvas = svCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const s = x / (size - 1)
      const v = 1 - y / (size - 1)
      const [r, g, b] = hsvToRgb(hue.value, s, v)
      const idx = (y * size + x) * 4
      img.data[idx] = r
      img.data[idx + 1] = g
      img.data[idx + 2] = b
      img.data[idx + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  // SV 标记
  const px = sat.value * (size - 1)
  const py = (1 - val.value) * (size - 1)
  ctx.beginPath()
  ctx.arc(px, py, 7, 0, Math.PI * 2)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(px, py, 7, 0, Math.PI * 2)
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawHue() {
  const canvas = hueCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const grad = ctx.createLinearGradient(0, 0, 0, size)
  const stops = [
    [0, 0], [60, 1 / 6], [120, 2 / 6], [180, 3 / 6], [240, 4 / 6], [300, 5 / 6], [360, 1],
  ]
  for (const [h, pos] of stops) {
    const [r, g, b] = hsvToRgb(h, 1, 1)
    grad.addColorStop(pos, `rgb(${r}, ${g}, ${b})`)
  }
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 24, size)
  // hue 标记
  const py = (hue.value / 360) * (size - 1)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.strokeRect(0, py - 2, 24, 4)
  ctx.strokeStyle = '#000'
  ctx.strokeRect(0, py - 2, 24, 4)
}

// ---------- 交互 ----------
let dragging: 'sv' | 'hue' | 'v' | null = null

function onSvDown(e: MouseEvent) {
  dragging = 'sv'
  onSvMove(e)
}
function onHueDown(e: MouseEvent) {
  dragging = 'hue'
  onHueMove(e)
}
function onVDown(e: MouseEvent) {
  dragging = 'v'
  onVMove(e)
}

function onSvMove(e: MouseEvent) {
  if (dragging !== 'sv') return
  const canvas = svCanvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const x = ((e.clientX - rect.left) * size) / rect.width
  const y = ((e.clientY - rect.top) * size) / rect.height
  sat.value = Math.max(0, Math.min(1, x / (size - 1)))
  val.value = Math.max(0, Math.min(1, 1 - y / (size - 1)))
  drawSv()
}

function onHueMove(e: MouseEvent) {
  if (dragging !== 'hue') return
  const canvas = hueCanvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const y = ((e.clientY - rect.top) * size) / rect.height
  hue.value = Math.max(0, Math.min(360, (y / (size - 1)) * 360))
  drawHue()
  drawSv()
}

function onVMove(e: MouseEvent) {
  if (dragging !== 'v') return
  const track = vTrackRef.value!
  const rect = track.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  val.value = Math.max(0, Math.min(1, x))
  drawSv()
}

function onMouseMove(e: MouseEvent) {
  if (dragging === 'sv') onSvMove(e)
  else if (dragging === 'hue') onHueMove(e)
  else if (dragging === 'v') onVMove(e)
}

function onMouseUp() {
  dragging = null
}

onMounted(() => {
  drawSv()
  drawHue()
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

watch(hue, () => { drawHue(); drawSv() })

function selectColor(hexStr: string) {
  const rgb = hexToRgb(hexStr)
  if (!rgb) return
  const [h, s, v] = rgbToHsv(...rgb)
  hue.value = h
  sat.value = s
  val.value = v
  drawSv()
  drawHue()
}

function applyHex() {
  const rgb = hexToRgb(hexInput.value)
  if (!rgb) {
    message.error('无效的 HEX 颜色，请输入 #RRGGBB 格式')
    return
  }
  selectColor(hexInput.value)
  message.success('已应用颜色')
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
  message.success('已复制：' + text)
}
</script>

<style scoped>
.game-color-picker {
  max-width: 1000px;
  margin: 0 auto;
}

.picker-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.picker-area {
  display: flex;
  gap: 8px;
}

.sv-canvas {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: crosshair;
  background: #fff;
}

.dark .sv-canvas {
  border-color: #333;
}

.hue-canvas {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
}

.dark .hue-canvas {
  border-color: #333;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-width: 200px;
}

.preview {
  height: 80px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark .preview {
  border-color: #333;
}

.preview-text {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 16px;
  font-weight: 700;
}

.v-slider-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.v-slider-wrap label {
  font-size: 13px;
  color: #555;
}

.dark .v-slider-wrap label {
  color: #aaa;
}

.v-slider-track {
  position: relative;
  height: 24px;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid #e0e0e0;
}

.dark .v-slider-track {
  border-color: #333;
}

.v-slider-handle {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #000;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.dark .section-title {
  color: #eee;
}

.format-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.format-row .n-input {
  flex: 1;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.format-label {
  flex: 0 0 100px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.dark .format-label {
  color: #aaa;
}

.hex-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.scheme-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.scheme-block {
  flex: 1;
  min-width: 120px;
  height: 100px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  padding: 8px;
  transition: transform 0.15s;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.scheme-block:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.scheme-info {
  background: rgba(255, 255, 255, 0.92);
  padding: 4px 8px;
  border-radius: 6px;
  width: 100%;
  backdrop-filter: blur(4px);
}

.dark .scheme-info {
  background: rgba(0, 0, 0, 0.6);
}

.scheme-hex {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  font-weight: 700;
  color: #333;
}

.dark .scheme-hex {
  color: #fff;
}

.scheme-name {
  font-size: 10px;
  color: #666;
}

.dark .scheme-name {
  color: #ccc;
}

.hint-text {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.contrast-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.contrast-box {
  padding: 24px;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 16px;
}

.badge {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.badge.pass {
  background: #c8e6c9;
  color: #2e7d32;
}

.badge.fail {
  background: #ffcdd2;
  color: #c62828;
}

.code-output :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

@media (max-width: 600px) {
  .picker-row {
    flex-direction: column;
  }
  .side-panel {
    width: 100%;
  }
}
</style>
