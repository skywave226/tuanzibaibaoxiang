<template>
  <div class="palette-generator">
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">基准色</h3>
      <div class="base-color-section">
        <div class="color-picker-area">
          <input type="color" v-model="baseHex" class="color-input" />
          <n-input v-model:value="baseHex" placeholder="#3366ff" style="width: 140px" />
        </div>
        <div class="scheme-select">
          <label class="text-sm">配色方案</label>
          <n-select v-model:value="scheme" :options="schemeOptions" style="width: 200px" />
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">调色板预览</h3>
      <div class="palette">
        <div
          v-for="color in palette"
          :key="color.hex"
          class="color-block"
          :style="{ background: color.hex }"
          @click="copyColor(color.hex)"
        >
          <div class="color-info">
            <div class="color-hex">{{ color.hex }}</div>
            <div class="color-name">{{ color.name }}</div>
          </div>
        </div>
      </div>
      <div class="copy-hint text-sm text-gray-500 mt-2">点击色块复制 HEX 值</div>
    </div>

    <div class="card mb-4">
      <div class="export-header">
        <h3 class="text-sm font-bold">导出代码</h3>
        <n-radio-group v-model:value="exportFormat" size="small">
          <n-radio-button value="css">CSS 变量</n-radio-button>
          <n-radio-button value="scss">SCSS 变量</n-radio-button>
          <n-radio-button value="tailwind">Tailwind</n-radio-button>
          <n-radio-button value="json">JSON</n-radio-button>
        </n-radio-group>
      </div>
      <n-input
        :value="exportCode"
        type="textarea"
        readonly
        rows="12"
        class="code-output mt-3"
      />
      <n-button type="primary" size="small" @click="copyCode" class="mt-2">复制代码</n-button>
    </div>

    <div class="card">
      <h3 class="text-sm font-bold mb-3">配色方案说明</h3>
      <n-space vertical size="small">
        <div v-for="s in schemeDescriptions" :key="s.name" class="scheme-desc">
          <span class="text-sm text-gray-500 w-32 inline-block">{{ s.name }}</span>
          <span class="text-sm">{{ s.desc }}</span>
        </div>
      </n-space>
    </div>

    <n-alert type="success" v-if="copiedMsg" class="mt-4" closable @close="copiedMsg = ''">
      {{ copiedMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NSelect, NRadioGroup, NRadioButton, NButton, NSpace, NAlert } from 'naive-ui'

interface Color {
  hex: string
  name: string
}

const baseHex = ref('#3366ff')
const scheme = ref('complementary')
const exportFormat = ref<'css' | 'scss' | 'tailwind' | 'json'>('css')
const copiedMsg = ref('')

const schemeOptions = [
  { label: '互补色 (Complementary)', value: 'complementary' },
  { label: '类似色 (Analogous)', value: 'analogous' },
  { label: '三角配色 (Triadic)', value: 'triadic' },
  { label: '分裂互补 (Split Complementary)', value: 'split' },
  { label: '矩形配色 (Tetradic)', value: 'tetradic' },
  { label: '单色调 (Monochromatic)', value: 'monochromatic' },
]

const schemeDescriptions = [
  { name: '互补色', desc: '色环上正对面（180°）的颜色，对比最强烈' },
  { name: '类似色', desc: '色环上相邻 ±30° 的颜色，和谐统一' },
  { name: '三角配色', desc: '色环上等距 120° 的三种颜色，平衡鲜明' },
  { name: '分裂互补', desc: '互补色两侧 ±30°，既有对比又较柔和' },
  { name: '矩形配色', desc: '色环上两组互补色（90°+180°），丰富多样' },
  { name: '单色调', desc: '同一色相不同明度，简洁协调' },
]

// HEX → HSL
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

// HSL → HEX
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360 / 360
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100

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

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}

const palette = computed<Color[]>(() => {
  if (!isValidHex(baseHex.value)) return []
  const [h, s, l] = hexToHsl(baseHex.value)
  const colors: Color[] = []

  switch (scheme.value) {
    case 'complementary':
      colors.push({ hex: baseHex.value, name: '基准色' })
      colors.push({ hex: hslToHex(h + 180, s, l), name: '互补色' })
      colors.push({ hex: hslToHex(h, s * 0.7, l * 0.7), name: '基准色暗' })
      colors.push({ hex: hslToHex(h + 180, s * 0.7, l * 0.7), name: '互补色暗' })
      colors.push({ hex: hslToHex(h, s * 0.5, l * 1.2), name: '基准色浅' })
      colors.push({ hex: hslToHex(h + 180, s * 0.5, l * 1.2), name: '互补色浅' })
      break

    case 'analogous':
      colors.push({ hex: hslToHex(h - 60, s, l), name: '类似色 -60°' })
      colors.push({ hex: hslToHex(h - 30, s, l), name: '类似色 -30°' })
      colors.push({ hex: baseHex.value, name: '基准色' })
      colors.push({ hex: hslToHex(h + 30, s, l), name: '类似色 +30°' })
      colors.push({ hex: hslToHex(h + 60, s, l), name: '类似色 +60°' })
      colors.push({ hex: hslToHex(h + 90, s, l), name: '类似色 +90°' })
      break

    case 'triadic':
      colors.push({ hex: baseHex.value, name: '基准色' })
      colors.push({ hex: hslToHex(h + 120, s, l), name: '三角 +120°' })
      colors.push({ hex: hslToHex(h + 240, s, l), name: '三角 +240°' })
      colors.push({ hex: hslToHex(h, s * 0.6, l * 0.8), name: '基准暗' })
      colors.push({ hex: hslToHex(h + 120, s * 0.6, l * 0.8), name: '三角暗' })
      colors.push({ hex: hslToHex(h + 240, s * 0.6, l * 0.8), name: '三角暗' })
      break

    case 'split':
      colors.push({ hex: baseHex.value, name: '基准色' })
      colors.push({ hex: hslToHex(h + 150, s, l), name: '分裂 -30°' })
      colors.push({ hex: hslToHex(h + 210, s, l), name: '分裂 +30°' })
      colors.push({ hex: hslToHex(h, s * 0.5, l * 1.15), name: '基准浅' })
      colors.push({ hex: hslToHex(h + 150, s * 0.5, l * 1.15), name: '分裂浅' })
      colors.push({ hex: hslToHex(h + 210, s * 0.5, l * 1.15), name: '分裂浅' })
      break

    case 'tetradic':
      colors.push({ hex: baseHex.value, name: '基准色' })
      colors.push({ hex: hslToHex(h + 90, s, l), name: '矩形 90°' })
      colors.push({ hex: hslToHex(h + 180, s, l), name: '互补色' })
      colors.push({ hex: hslToHex(h + 270, s, l), name: '矩形 270°' })
      colors.push({ hex: hslToHex(h, s * 0.4, l * 0.9), name: '基准暗' })
      colors.push({ hex: hslToHex(h + 180, s * 0.4, l * 0.9), name: '互补暗' })
      break

    case 'monochromatic':
      for (let i = 0; i < 6; i++) {
        const newL = 20 + i * 15
        colors.push({
          hex: hslToHex(h, s, newL),
          name: `明度 ${newL}%`,
        })
      }
      break
  }

  return colors
})

const exportCode = computed(() => {
  if (palette.value.length === 0) return ''

  if (exportFormat.value === 'css') {
    const lines = palette.value.map((c, i) => `  --color-${i + 1}: ${c.hex};`)
    return `:root {\n${lines.join('\n')}\n}`
  }

  if (exportFormat.value === 'scss') {
    return palette.value.map((c, i) => `$color-${i + 1}: ${c.hex};`).join('\n')
  }

  if (exportFormat.value === 'tailwind') {
    const lines = palette.value.map((c, i) => `  'color-${i + 1}': '${c.hex}',`)
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${lines.join('\n')}\n      }\n    }\n  }\n}`
  }

  if (exportFormat.value === 'json') {
    const obj: Record<string, string> = {}
    palette.value.forEach((c, i) => {
      obj[`color-${i + 1}`] = c.hex
    })
    return JSON.stringify(obj, null, 2)
  }

  return ''
})

function copyColor(hex: string) {
  navigator.clipboard.writeText(hex)
  copiedMsg.value = `已复制：${hex}`
  setTimeout(() => { copiedMsg.value = '' }, 2000)
}

function copyCode() {
  navigator.clipboard.writeText(exportCode.value)
  copiedMsg.value = '代码已复制到剪贴板'
  setTimeout(() => { copiedMsg.value = '' }, 2000)
}
</script>

<style scoped>
.palette-generator {
  max-width: 900px;
  margin: 0 auto;
}

.base-color-section {
  display: flex;
  gap: 32px;
  align-items: center;
  flex-wrap: wrap;
}

.color-picker-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-input {
  width: 60px;
  height: 60px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  padding: 4px;
  background: none;
}

.scheme-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scheme-select label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .scheme-select label {
  color: #aaa;
}

.palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.color-block {
  height: 140px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  align-items: flex-end;
  padding: 12px;
  position: relative;
  overflow: hidden;
}

.color-block:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.color-info {
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 10px;
  border-radius: 6px;
  width: 100%;
  backdrop-filter: blur(4px);
}

.dark .color-info {
  background: rgba(0, 0, 0, 0.6);
}

.color-hex {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  font-weight: 700;
  color: #333;
}

.dark .color-hex {
  color: #fff;
}

.color-name {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.dark .color-name {
  color: #ccc;
}

.export-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.code-output :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.scheme-desc {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.copy-hint {
  font-size: 12px;
}
</style>
