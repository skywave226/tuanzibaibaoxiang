<template>
  <div class="color-converter">
    <div class="card mb-4">
      <div class="color-input-section">
        <div class="input-group">
          <label>颜色选择器</label>
          <n-color-picker v-model:value="hexColor" :modes="['hex']" @update:value="fromHex" />
        </div>
        <div class="input-group">
          <label>HEX</label>
          <n-input v-model:value="hexInput" placeholder="#000000" @input="fromHexInput" />
        </div>
        <div class="input-group">
          <label>RGB</label>
          <n-input v-model:value="rgbInput" placeholder="rgb(0, 0, 0)" @input="fromRgbInput" />
        </div>
        <div class="input-group">
          <label>HSL</label>
          <n-input v-model:value="hslInput" placeholder="hsl(0, 0%, 0%)" @input="fromHslInput" />
        </div>
      </div>
      <n-tag v-if="errorMsg" type="error" class="mt-2">{{ errorMsg }}</n-tag>
    </div>

    <div class="preview-section card mb-4">
      <div class="color-preview" :style="{ backgroundColor: hexColor }"></div>
      <div class="color-info">
        <div class="info-item">
          <span class="info-label">HEX</span>
          <span class="info-value font-mono">{{ hexColor }}</span>
          <n-button text size="tiny" @click="copy(hexColor)">复制</n-button>
        </div>
        <div class="info-item">
          <span class="info-label">RGB</span>
          <span class="info-value font-mono">{{ rgbDisplay }}</span>
          <n-button text size="tiny" @click="copy(rgbDisplay)">复制</n-button>
        </div>
        <div class="info-item">
          <span class="info-label">HSL</span>
          <span class="info-value font-mono">{{ hslDisplay }}</span>
          <n-button text size="tiny" @click="copy(hslDisplay)">复制</n-button>
        </div>
        <div class="info-item">
          <span class="info-label">CMYK</span>
          <span class="info-value font-mono">{{ cmykDisplay }}</span>
          <n-button text size="tiny" @click="copy(cmykDisplay)">复制</n-button>
        </div>
        <div class="info-item" v-if="cssName">
          <span class="info-label">CSS 名</span>
          <span class="info-value font-mono">{{ cssName }}</span>
        </div>
        <div class="info-item">
          <n-button size="tiny" @click="randomColor">随机颜色</n-button>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="font-bold mb-3">对比度检查（WCAG）</h3>
      <div class="contrast-checker">
        <div class="contrast-color">
          <label>前景色</label>
          <n-color-picker v-model:value="foregroundColor" :modes="['hex']" @update:value="updateContrast" />
        </div>
        <div class="contrast-result">
          <div class="contrast-ratio">{{ contrastRatio }}:1</div>
          <div class="contrast-levels">
            <n-tag :type="aaNormal ? 'success' : 'error'" size="small">AA 普通文本</n-tag>
            <n-tag :type="aaaNormal ? 'success' : 'error'" size="small">AAA 普通文本</n-tag>
            <n-tag :type="aaLarge ? 'success' : 'error'" size="small">AA 大文本</n-tag>
            <n-tag :type="aaaLarge ? 'success' : 'error'" size="small">AAA 大文本</n-tag>
          </div>
        </div>
      </div>
      <div class="contrast-preview" :style="{ backgroundColor: hexColor, color: foregroundColor }">
        示例文字：The quick brown fox jumps over the lazy dog.
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="font-bold mb-3">配色方案</h3>
      <div class="color-schemes">
        <div class="scheme-item" v-for="scheme in schemes" :key="scheme.name">
          <div class="scheme-name">{{ scheme.name }}</div>
          <div class="scheme-colors">
            <div
              v-for="color in scheme.colors"
              :key="color"
              class="scheme-color"
              :style="{ backgroundColor: color }"
              :title="color"
              @click="applyPreset(color)"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="font-bold mb-2">常用颜色</h3>
      <div class="preset-colors">
        <div
          v-for="color in presetColors"
          :key="color.name"
          class="preset-item"
          @click="applyPreset(color.hex)"
        >
          <div class="preset-preview" :style="{ backgroundColor: color.hex }"></div>
          <div class="preset-info">
            <div class="preset-name">{{ color.name }}</div>
            <div class="preset-hex font-mono text-xs">{{ color.hex }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NColorPicker, NInput, NTag, NButton, useMessage } from 'naive-ui'

const message = useMessage()
const hexColor = ref('#3b82f6')
const hexInput = ref('#3b82f6')
const rgbInput = ref('rgb(59, 130, 246)')
const hslInput = ref('hsl(217, 91%, 60%)')
const errorMsg = ref('')
const foregroundColor = ref('#ffffff')
const contrastRatio = ref('1')
const aaNormal = ref(false)
const aaaNormal = ref(false)
const aaLarge = ref(false)
const aaaLarge = ref(false)

const rgbDisplay = computed(() => {
  const rgb = hexToRgb(hexColor.value)
  return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : ''
})

const hslDisplay = computed(() => {
  const rgb = hexToRgb(hexColor.value)
  if (!rgb) return ''
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
})

const cmykDisplay = computed(() => {
  const rgb = hexToRgb(hexColor.value)
  if (!rgb) return ''
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
  return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`
})

const cssName = computed(() => {
  return findClosestColorName(hexColor.value)
})

const schemes = computed(() => {
  const rgb = hexToRgb(hexColor.value) || { r: 0, g: 0, b: 0 }
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  return [
    { name: '互补色', colors: [hexColor.value, hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l)] },
    { name: '类似色', colors: [
      hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
      hexColor.value,
      hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
    ]},
    { name: '三角色', colors: [
      hexColor.value,
      hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
    ]},
    { name: '分裂互补', colors: [
      hexColor.value,
      hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 210) % 360, hsl.s, hsl.l),
    ]},
  ]
})

function updateContrast() {
  const bg = hexToRgb(hexColor.value)
  const fg = hexToRgb(foregroundColor.value)
  if (!bg || !fg) return
  const ratio = calculateContrastRatio(bg, fg)
  contrastRatio.value = ratio.toFixed(2)
  aaNormal.value = ratio >= 4.5
  aaaNormal.value = ratio >= 7
  aaLarge.value = ratio >= 3
  aaaLarge.value = ratio >= 4.5
}

function calculateContrastRatio(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number {
  const l1 = relativeLuminance(rgb1)
  const l2 = relativeLuminance(rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const rs = rgb.r / 255
  const gs = rgb.g / 255
  const bs = rgb.b / 255
  const r = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4)
  const g = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4)
  const b = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function randomColor() {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  applyPreset(rgbToHex(r, g, b))
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const r_ = r / 255
  const g_ = g / 255
  const b_ = b / 255
  const k = 1 - Math.max(r_, g_, b_)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  const c = (1 - r_ - k) / (1 - k)
  const m = (1 - g_ - k) / (1 - k)
  const y = (1 - b_ - k) / (1 - k)
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

function fromHex(val: string) {
  hexInput.value = val
  const rgb = hexToRgb(val)
  if (rgb) {
    rgbInput.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    hslInput.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    errorMsg.value = ''
    updateContrast()
  }
}

function fromHexInput() {
  const val = hexInput.value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    hexColor.value = val
    fromHex(val)
  } else if (/^[0-9a-fA-F]{6}$/.test(val)) {
    hexColor.value = '#' + val
    fromHex('#' + val)
  } else {
    errorMsg.value = '无效的 HEX 格式'
  }
}

function fromRgbInput() {
  const val = rgbInput.value.trim()
  const match = val.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (match) {
    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      hexColor.value = rgbToHex(r, g, b)
      hexInput.value = rgbToHex(r, g, b)
      const hsl = rgbToHsl(r, g, b)
      hslInput.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
      errorMsg.value = ''
      updateContrast()
    } else {
      errorMsg.value = 'RGB 值必须在 0-255 之间'
    }
  } else {
    errorMsg.value = '无效的 RGB 格式'
  }
}

function fromHslInput() {
  const val = hslInput.value.trim()
  const match = val.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/)
  if (match) {
    const h = parseInt(match[1])
    const s = parseInt(match[2])
    const l = parseInt(match[3])
    if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      const rgb = hslToRgb(h, s, l)
      hexColor.value = rgbToHex(rgb.r, rgb.g, rgb.b)
      hexInput.value = rgbToHex(rgb.r, rgb.g, rgb.b)
      rgbInput.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
      errorMsg.value = ''
      updateContrast()
    } else {
      errorMsg.value = 'HSL 值超出范围'
    }
  } else {
    errorMsg.value = '无效的 HSL 格式'
  }
}

function applyPreset(hex: string) {
  hexColor.value = hex
  fromHex(hex)
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
  message.success('已复制')
}

function findClosestColorName(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return ''
  let closest = ''
  let minDist = Infinity
  for (const [name, value] of Object.entries(CSS_COLOR_NAMES)) {
    const target = hexToRgb(value)
    if (!target) continue
    const dist = Math.pow(rgb.r - target.r, 2) + Math.pow(rgb.g - target.g, 2) + Math.pow(rgb.b - target.b, 2)
    if (dist < minDist) {
      minDist = dist
      closest = name
    }
  }
  return minDist < 500 ? closest : ''
}

const CSS_COLOR_NAMES: Record<string, string> = {
  '黑色': '#000000',
  '白色': '#ffffff',
  '红色': '#ff0000',
  '绿色': '#00ff00',
  '蓝色': '#0000ff',
  '黄色': '#ffff00',
  '青色': '#00ffff',
  '品红': '#ff00ff',
  '灰色': '#808080',
  '橙色': '#ffa500',
  '紫色': '#800080',
  '棕色': '#a52a2a',
  '粉色': '#ffc0cb',
  '天蓝': '#87ceeb',
  '森林绿': '#228b22',
  '海军蓝': '#000080',
  '橄榄绿': '#808000',
  '番茄红': '#ff6347',
  '薰衣草': '#e6e6fa',
  '薄荷绿': '#98ff98',
}

const presetColors = [
  { name: '红色', hex: '#FF0000' },
  { name: '绿色', hex: '#00FF00' },
  { name: '蓝色', hex: '#0000FF' },
  { name: '黄色', hex: '#FFFF00' },
  { name: '青色', hex: '#00FFFF' },
  { name: '品红', hex: '#FF00FF' },
  { name: '白色', hex: '#FFFFFF' },
  { name: '黑色', hex: '#000000' },
  { name: '灰色', hex: '#808080' },
  { name: '橙色', hex: '#FFA500' },
  { name: '紫色', hex: '#800080' },
  { name: '棕色', hex: '#A52A2A' },
]

updateContrast()
</script>

<style scoped>
.color-input-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.preview-section {
  display: flex;
  gap: 24px;
  align-items: center;
}

.color-preview {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  border: 2px solid #e8e8e8;
  flex-shrink: 0;
}

.dark .color-preview {
  border-color: #2a2a4a;
}

.color-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-label {
  width: 60px;
  font-size: 13px;
  font-weight: 500;
  color: #888;
}

.info-value {
  flex: 1;
  font-size: 14px;
}

.contrast-checker {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.contrast-color {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contrast-result {
  flex: 1;
  min-width: 200px;
}

.contrast-ratio {
  font-size: 2rem;
  font-weight: 700;
  color: #36ad6a;
  margin-bottom: 8px;
}

.contrast-levels {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.contrast-preview {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
}

.color-schemes {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scheme-item {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.scheme-name {
  width: 80px;
  font-size: 14px;
  font-weight: 500;
}

.scheme-colors {
  display: flex;
  gap: 8px;
}

.scheme-color {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  cursor: pointer;
  transition: transform 0.2s;
}

.scheme-color:hover {
  transform: scale(1.1);
}

.preset-colors {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #e8e8e8;
  transition: all 0.2s;
}

.preset-item:hover {
  border-color: #36ad6a;
  background: #f0f9eb;
}

.dark .preset-item {
  border-color: #2a2a4a;
}

.dark .preset-item:hover {
  border-color: #63e2b7;
  background: #1a3a2a;
}

.preset-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.preset-info {
  flex: 1;
  min-width: 0;
}

.preset-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
}

.preset-hex {
  color: #888;
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

.mb-3 {
  margin-bottom: 12px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mt-2 {
  margin-top: 8px;
}

.font-mono {
  font-family: 'Fira Code', 'Consolas', monospace;
}

.font-bold {
  font-weight: 600;
}

.text-xs {
  font-size: 12px;
}

@media (max-width: 768px) {
  .preview-section {
    flex-direction: column;
  }

  .color-preview {
    width: 100%;
    height: 150px;
  }
}
</style>
