<template>
  <div class="tool-container color-picker-game">
    <div class="card mb-4">
      <div class="top-grid">
        <div class="preview-col">
          <canvas ref="canvasRef" :width="canvasW" :height="canvasH" class="preview-canvas"></canvas>
          <div class="hex-display">{{ hex }}</div>
        </div>
        <div class="formats-col">
          <div class="format-row" v-for="f in formats" :key="f.label">
            <span class="format-label">{{ f.label }}</span>
            <n-input :value="f.value" readonly size="small" style="flex: 1" />
            <n-button text size="small" @click="copy(f.value)">复制</n-button>
          </div>
          <div class="format-row">
            <span class="format-label">HEX 输入</span>
            <n-input v-model:value="hexInput" placeholder="#RRGGBB" size="small" style="flex: 1" @blur="onHexInput" @keyup.enter="onHexInput" />
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="section-title">颜色调整</h3>
      <div class="sliders">
        <div class="slider-row">
          <span class="slider-label">R 红</span>
          <n-slider v-model:value="rgb.r" :min="0" :max="255" :step="1" />
          <n-input-number v-model:value="rgb.r" :min="0" :max="255" size="small" style="width: 90px" />
        </div>
        <div class="slider-row">
          <span class="slider-label">G 绿</span>
          <n-slider v-model:value="rgb.g" :min="0" :max="255" :step="1" />
          <n-input-number v-model:value="rgb.g" :min="0" :max="255" size="small" style="width: 90px" />
        </div>
        <div class="slider-row">
          <span class="slider-label">B 蓝</span>
          <n-slider v-model:value="rgb.b" :min="0" :max="255" :step="1" />
          <n-input-number v-model:value="rgb.b" :min="0" :max="255" size="small" style="width: 90px" />
        </div>
        <div class="slider-row">
          <span class="slider-label">H 色相</span>
          <n-slider v-model:value="hsl.h" :min="0" :max="360" :step="1" />
          <n-input-number v-model:value="hsl.h" :min="0" :max="360" size="small" style="width: 90px" />
        </div>
        <div class="slider-row">
          <span class="slider-label">S 饱和度</span>
          <n-slider v-model:value="hsl.s" :min="0" :max="100" :step="1" />
          <n-input-number v-model:value="hsl.s" :min="0" :max="100" size="small" style="width: 90px" />
        </div>
        <div class="slider-row">
          <span class="slider-label">L 亮度</span>
          <n-slider v-model:value="hsl.l" :min="0" :max="100" :step="1" />
          <n-input-number v-model:value="hsl.l" :min="0" :max="100" size="small" style="width: 90px" />
        </div>
        <div class="slider-row">
          <span class="slider-label">V 明度</span>
          <n-slider v-model:value="hsv.v" :min="0" :max="100" :step="1" />
          <n-input-number v-model:value="hsv.v" :min="0" :max="100" size="small" style="width: 90px" />
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="header-row">
        <h3 class="section-title">调色板生成</h3>
        <div class="palette-types">
          <n-radio-group v-model:value="paletteType" size="small">
            <n-radio-button value="complementary">互补色</n-radio-button>
            <n-radio-button value="analogous">类似色</n-radio-button>
            <n-radio-button value="triadic">三元色</n-radio-button>
            <n-radio-button value="tetradic">四元色</n-radio-button>
            <n-radio-button value="shades">明暗阶</n-radio-button>
          </n-radio-group>
        </div>
      </div>
      <div class="palette">
        <div
          class="palette-swatch"
          v-for="(c, i) in palette"
          :key="i"
          :style="{ background: c.hex }"
          @click="selectColor(c.rgb)"
          :title="c.hex"
        >
          <span class="swatch-hex" :style="{ color: c.textColor }">{{ c.hex }}</span>
        </div>
      </div>
      <div class="palette-hint">点击任一色块应用为当前颜色</div>
    </div>

    <div class="card mb-4">
      <h3 class="section-title">WCAG 对比度检测</h3>
      <div class="contrast-grid">
        <div class="contrast-input">
          <label>前景色</label>
          <n-input v-model:value="fgHex" placeholder="#000000" size="small" @blur="onContrastInput" @keyup.enter="onContrastInput" />
          <div class="color-chip" :style="{ background: fgHex }"></div>
        </div>
        <div class="contrast-input">
          <label>背景色</label>
          <n-input v-model:value="bgHex" placeholder="#ffffff" size="small" @blur="onContrastInput" @keyup.enter="onContrastInput" />
          <div class="color-chip" :style="{ background: bgHex }"></div>
        </div>
        <div class="contrast-input">
          <n-button size="small" @click="useCurrentAsFg">用当前色为前景</n-button>
          <n-button size="small" @click="useCurrentAsBg">用当前色为背景</n-button>
        </div>
      </div>
      <div class="preview-box" :style="{ background: bgHex, color: fgHex }">
        示例文本 The quick brown fox jumps over the lazy dog. 1234567890
      </div>
      <div class="contrast-results">
        <div class="contrast-item">
          <span class="ci-label">对比度</span>
          <span class="ci-value">{{ contrastRatio.toFixed(2) }} : 1</span>
        </div>
        <div class="contrast-item">
          <span class="ci-label">AA 文本（≥4.5）</span>
          <n-tag :type="contrastRatio >= 4.5 ? 'success' : 'error'" size="small" round>
            {{ contrastRatio >= 4.5 ? '通过' : '不通过' }}
          </n-tag>
        </div>
        <div class="contrast-item">
          <span class="ci-label">AA 大字（≥3）</span>
          <n-tag :type="contrastRatio >= 3 ? 'success' : 'error'" size="small" round>
            {{ contrastRatio >= 3 ? '通过' : '不通过' }}
          </n-tag>
        </div>
        <div class="contrast-item">
          <span class="ci-label">AAA 文本（≥7）</span>
          <n-tag :type="contrastRatio >= 7 ? 'success' : 'error'" size="small" round>
            {{ contrastRatio >= 7 ? '通过' : '不通过' }}
          </n-tag>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="header-row">
        <h3 class="section-title">导出配置</h3>
        <n-radio-group v-model:value="exportFormat" size="small">
          <n-radio-button value="css">CSS</n-radio-button>
          <n-radio-button value="json">JSON</n-radio-button>
          <n-radio-button value="js">JS 对象</n-radio-button>
        </n-radio-group>
      </div>
      <n-input :value="exportText" type="textarea" readonly :rows="8" />
      <div class="export-actions">
        <n-button size="small" @click="copy(exportText)">复制配置</n-button>
        <n-button size="small" @click="copy(hex)">复制 HEX</n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { NInput, NButton, NSlider, NInputNumber, NRadioGroup, NRadioButton, NTag, useMessage } from 'naive-ui'

const message = useMessage()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasW = 240
const canvasH = 120

const rgb = reactive({ r: 64, g: 169, b: 255 })
const hsl = reactive({ h: 207, s: 100, l: 63 })
const hsv = reactive({ h: 207, s: 75, v: 100 })

const hexInput = ref('')
const fgHex = ref('#000000')
const bgHex = ref('#ffffff')

const paletteType = ref<'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'shades'>('complementary')
const exportFormat = ref<'css' | 'json' | 'js'>('css')

// ---------- 颜色转换工具 ----------
function clamp255(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)))
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((x) => clamp255(x).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number) {
  s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return { r: clamp255((r + m) * 255), g: clamp255((g + m) * 255), b: clamp255((b + m) * 255) }
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
    if (h < 0) h += 360
  }
  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) }
}

function hsvToRgb(h: number, s: number, v: number) {
  s /= 100; v /= 100
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return { r: clamp255((r + m) * 255), g: clamp255((g + m) * 255), b: clamp255((b + m) * 255) }
}

// 相对亮度（WCAG）
function relativeLuminance(r: number, g: number, b: number) {
  const channel = (c: number) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

// ---------- 同步逻辑（避免循环更新） ----------
let syncing = false

function syncFromRgb() {
  if (syncing) return
  syncing = true
  const h = rgbToHsl(rgb.r, rgb.g, rgb.b)
  hsl.h = h.h; hsl.s = h.s; hsl.l = h.l
  const sv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  hsv.h = sv.h; hsv.s = sv.s; hsv.v = sv.v
  syncing = false
}

function syncFromHsl() {
  if (syncing) return
  syncing = true
  const r = hslToRgb(hsl.h, hsl.s, hsl.l)
  rgb.r = r.r; rgb.g = r.g; rgb.b = r.b
  const sv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  hsv.h = sv.h; hsv.s = sv.s; hsv.v = sv.v
  syncing = false
}

function syncFromHsv() {
  if (syncing) return
  syncing = true
  const r = hsvToRgb(hsv.h, hsv.s, hsv.v)
  rgb.r = r.r; rgb.g = r.g; rgb.b = r.b
  const h = rgbToHsl(rgb.r, rgb.g, rgb.b)
  hsl.h = h.h; hsl.s = h.s; hsl.l = h.l
  syncing = false
}

const hex = computed(() => rgbToHex(rgb.r, rgb.g, rgb.b))

const formats = computed(() => {
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
  const hsvStr = `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  const rgbIntStr = `0x${[rgb.r, rgb.g, rgb.b].map((x) => clamp255(x).toString(16).padStart(2, '0')).join('')}`
  return [
    { label: 'HEX', value: hex.value },
    { label: 'RGB', value: rgbStr },
    { label: 'HSL', value: hslStr },
    { label: 'HSV', value: hsvStr },
    { label: 'INT', value: rgbIntStr },
  ]
})

// ---------- 调色板生成 ----------
function textColorFor(r: number, g: number, b: number) {
  return relativeLuminance(r, g, b) > 0.4 ? '#000000' : '#ffffff'
}

function buildPaletteSwatch(r: number, g: number, b: number) {
  return {
    rgb: { r, g, b },
    hex: rgbToHex(r, g, b),
    textColor: textColorFor(r, g, b),
  }
}

const palette = computed(() => {
  const h = hsl.h
  const s = hsl.s
  const l = hsl.l
  const out: { rgb: { r: number; g: number; b: number }; hex: string; textColor: string }[] = []
  if (paletteType.value === 'complementary') {
    const angles = [0, 180]
    for (const a of angles) {
      const rgbC = hslToRgb((h + a) % 360, s, l)
      out.push(buildPaletteSwatch(rgbC.r, rgbC.g, rgbC.b))
    }
  } else if (paletteType.value === 'analogous') {
    for (let i = -2; i <= 2; i++) {
      const rgbC = hslToRgb((h + i * 30 + 360) % 360, s, l)
      out.push(buildPaletteSwatch(rgbC.r, rgbC.g, rgbC.b))
    }
  } else if (paletteType.value === 'triadic') {
    for (const a of [0, 120, 240]) {
      const rgbC = hslToRgb((h + a) % 360, s, l)
      out.push(buildPaletteSwatch(rgbC.r, rgbC.g, rgbC.b))
    }
  } else if (paletteType.value === 'tetradic') {
    for (const a of [0, 90, 180, 270]) {
      const rgbC = hslToRgb((h + a) % 360, s, l)
      out.push(buildPaletteSwatch(rgbC.r, rgbC.g, rgbC.b))
    }
  } else if (paletteType.value === 'shades') {
    for (let i = 0; i < 7; i++) {
      const nl = Math.round((i * 100) / 6)
      const rgbC = hslToRgb(h, s, nl)
      out.push(buildPaletteSwatch(rgbC.r, rgbC.g, rgbC.b))
    }
  }
  return out
})

// ---------- WCAG 对比度 ----------
const contrastRatio = computed(() => {
  const fg = hexToRgb(fgHex.value)
  const bg = hexToRgb(bgHex.value)
  if (!fg || !bg) return 0
  const l1 = relativeLuminance(fg.r, fg.g, fg.b)
  const l2 = relativeLuminance(bg.r, bg.g, bg.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
})

// ---------- 导出 ----------
const exportText = computed(() => {
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  if (exportFormat.value === 'css') {
    return [
      ':root {',
      `  --color-primary: ${hex.value};`,
      `  --color-primary-rgb: ${rgbStr};`,
      `  --color-primary-hsl: ${hslStr};`,
      `  --color-primary-int: ${'0x' + hex.value.slice(1)};`,
      `  --color-primary-r: ${rgb.r};`,
      `  --color-primary-g: ${rgb.g};`,
      `  --color-primary-b: ${rgb.b};`,
      '}',
    ].join('\n')
  } else if (exportFormat.value === 'json') {
    return JSON.stringify({
      hex: hex.value,
      rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
      hsl: { h: hsl.h, s: hsl.s, l: hsl.l },
      hsv: { h: hsv.h, s: hsv.s, v: hsv.v },
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
      int: parseInt(hex.value.slice(1), 16),
    }, null, 2)
  } else {
    return [
      'export const primaryColor = {',
      `  hex: "${hex.value}",`,
      `  rgb: { r: ${rgb.r}, g: ${rgb.g}, b: ${rgb.b} },`,
      `  hsl: { h: ${hsl.h}, s: ${hsl.s}, l: ${hsl.l} },`,
      `  hsv: { h: ${hsv.h}, s: ${hsv.s}, v: ${hsv.v} },`,
      `  int: ${parseInt(hex.value.slice(1), 16)},`,
      '}',
    ].join('\n')
  }
})

// ---------- 绘制 ----------
function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvasW, canvasH)
  ctx.fillStyle = hex.value
  ctx.fillRect(0, 0, canvasW, canvasH)
  // 颜色信息叠加
  ctx.fillStyle = textColorFor(rgb.r, rgb.g, rgb.b)
  ctx.font = 'bold 14px monospace'
  ctx.fillText(hex.value, 12, 28)
  ctx.font = '12px sans-serif'
  ctx.fillText(`RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`, 12, 50)
  ctx.fillText(`HSL(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 12, 68)
  ctx.fillText(`HSV(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`, 12, 86)
}

// ---------- 事件处理 ----------
function onHexInput() {
  const r = hexToRgb(hexInput.value)
  if (r) {
    rgb.r = r.r; rgb.g = r.g; rgb.b = r.b
    syncFromRgb()
  } else {
    message.error('HEX 格式无效，需为 #RRGGBB')
  }
}

function onContrastInput() {
  // 触发响应式
  fgHex.value = fgHex.value.trim()
  bgHex.value = bgHex.value.trim()
}

function useCurrentAsFg() {
  fgHex.value = hex.value
}

function useCurrentAsBg() {
  bgHex.value = hex.value
}

function selectColor(c: { r: number; g: number; b: number }) {
  rgb.r = c.r; rgb.g = c.g; rgb.b = c.b
  syncFromRgb()
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
  message.success('已复制：' + text)
}

// 监听变化同步与重绘
watch(rgb, () => { syncFromRgb(); draw() }, { deep: true })
watch(hsl, () => { syncFromHsl(); draw() }, { deep: true })
watch(hsv, () => { syncFromHsv(); draw() }, { deep: true })
watch(paletteType, draw)

onMounted(() => {
  hexInput.value = hex.value
  draw()
})
</script>

<style scoped>
.tool-container.color-picker-game {
  max-width: 1000px;
  margin: 0 auto;
}

.card {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 10px;
  padding: 18px 20px;
}

.dark .card {
  background: #1f1f2e;
  border-color: #2e2e3e;
}

.mb-4 {
  margin-bottom: 16px;
}

.top-grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 20px;
  align-items: start;
}

.preview-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-canvas {
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.dark .preview-canvas {
  border-color: #333;
}

.hex-display {
  text-align: center;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 16px;
  font-weight: 700;
  color: #1976d2;
}

.dark .hex-display {
  color: #64b5f6;
}

.formats-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.format-label {
  width: 70px;
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.dark .format-label {
  color: #bbb;
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

.sliders {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-label {
  width: 70px;
  font-size: 13px;
  color: #555;
}

.dark .slider-label {
  color: #aaa;
}

.slider-row .n-slider {
  flex: 1;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.palette-swatch {
  flex: 1 1 100px;
  min-width: 100px;
  height: 70px;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: transform 0.15s;
}

.palette-swatch:hover {
  transform: translateY(-2px);
}

.swatch-hex {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.6);
  padding: 1px 6px;
  border-radius: 4px;
}

.palette-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}

.contrast-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
  align-items: end;
}

.contrast-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contrast-input label {
  font-size: 12px;
  color: #666;
}

.dark .contrast-input label {
  color: #aaa;
}

.color-chip {
  width: 40px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.preview-box {
  padding: 14px;
  border-radius: 8px;
  font-size: 15px;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
}

.contrast-results {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.contrast-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f7f7f7;
  border-radius: 6px;
  font-size: 13px;
}

.dark .contrast-item {
  background: #2a2a3a;
}

.ci-label {
  color: #666;
}

.dark .ci-label {
  color: #aaa;
}

.ci-value {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-weight: 700;
  color: #1976d2;
}

.dark .ci-value {
  color: #64b5f6;
}

.export-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

@media (max-width: 760px) {
  .top-grid {
    grid-template-columns: 1fr;
  }
  .contrast-grid {
    grid-template-columns: 1fr;
  }
}
</style>
