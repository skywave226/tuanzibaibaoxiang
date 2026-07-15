<template>
  <div class="noise-generator tool-container">
    <div class="action-bar">
      <n-button type="primary" @click="generate">生成噪声</n-button>
      <n-button @click="exportPng">导出 PNG</n-button>
      <n-button @click="exportData">导出数据</n-button>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">算法与维度</span>
      </div>
      <div class="config-row">
        <span class="config-label">噪声算法</span>
        <n-select
          v-model:value="noiseType"
          :options="noiseOptions"
          size="small"
          class="noise-select"
        />
        <span class="config-label">维度</span>
        <n-select
          v-model:value="dim"
          :options="dimOptions"
          size="small"
          class="dim-select"
        />
      </div>
      <div class="config-row">
        <span class="config-label">分辨率</span>
        <n-slider v-model:value="resolution" :min="64" :max="512" :step="32" style="width: 240px" />
        <span class="value-tag">{{ resolution }}px</span>
        <span class="config-label">种子</span>
        <n-input v-model:value="seedInput" size="small" placeholder="留空随机" class="seed-input" />
        <n-button size="small" @click="randomSeed">随机</n-button>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">参数配置</span>
      </div>
      <div class="param-row">
        <span class="config-label">频率</span>
        <n-slider v-model:value="frequency" :min="0.5" :max="20" :step="0.5" style="width: 240px" />
        <span class="value-tag">{{ frequency.toFixed(1) }}</span>
      </div>
      <div class="param-row">
        <span class="config-label">振幅</span>
        <n-slider v-model:value="amplitude" :min="0.1" :max="3" :step="0.1" style="width: 240px" />
        <span class="value-tag">{{ amplitude.toFixed(1) }}</span>
      </div>
      <div class="param-row">
        <span class="config-label">八度</span>
        <n-slider v-model:value="octaves" :min="1" :max="8" :step="1" style="width: 240px" />
        <span class="value-tag">{{ octaves }}</span>
      </div>
      <div class="param-row">
        <span class="config-label">持续度</span>
        <n-slider v-model:value="persistence" :min="0.1" :max="1" :step="0.05" style="width: 240px" />
        <span class="value-tag">{{ persistence.toFixed(2) }}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">渲染模式</span>
      </div>
      <div class="config-row">
        <span class="config-label">显示模式</span>
        <n-select
          v-model:value="renderMode"
          :options="renderOptions"
          size="small"
          class="render-select"
        />
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">噪声预览</span>
      </div>
      <div class="canvas-wrap">
        <canvas v-if="dim === '2d'" ref="canvas2d" :width="resolution" :height="resolution"></canvas>
        <canvas v-else ref="canvas1d" :width="canvasW1d" :height="canvasH1d"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { NButton, NInput, NSlider, NSelect, useMessage } from 'naive-ui'

const message = useMessage()

const canvas2d = ref<HTMLCanvasElement | null>(null)
const canvas1d = ref<HTMLCanvasElement | null>(null)
const canvasW1d = 512
const canvasH1d = 256

const noiseType = ref<'perlin' | 'simplex'>('perlin')
const noiseOptions = [
  { label: 'Perlin 噪声', value: 'perlin' },
  { label: 'Simplex 噪声', value: 'simplex' },
]

const dim = ref<'1d' | '2d'>('2d')
const dimOptions = [
  { label: '一维', value: '1d' },
  { label: '二维', value: '2d' },
]

const resolution = ref(256)
const seedInput = ref<string>('')
const frequency = ref(4)
const amplitude = ref(1)
const octaves = ref(4)
const persistence = ref(0.5)

const renderMode = ref<'gray' | 'gradient' | 'terrain'>('gray')
const renderOptions = [
  { label: '灰度图', value: 'gray' },
  { label: '彩色渐变', value: 'gradient' },
  { label: '地形色阶', value: 'terrain' },
]

let field2d: number[] = []
let field1d: number[] = []

function getSeed(): number {
  const s = seedInput.value.trim()
  if (!s) return (Math.random() * 4294967296) >>> 0
  const n = Number(s)
  if (!isNaN(n)) return n >>> 0
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0
  }
  return h
}

function randomSeed(): void {
  seedInput.value = String((Math.random() * 99999) >>> 0)
}

// 噪声生成器（Perlin + Simplex）
class NoiseGenerator {
  private perm: Uint8Array
  private permMod12: Uint8Array

  constructor(seed: number) {
    let s = seed >>> 0
    const rng = () => {
      s = (s + 0x6D2B79F5) >>> 0
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const p = new Uint8Array(256)
    for (let i = 0; i < 256; i++) p[i] = i
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    this.perm = new Uint8Array(512)
    this.permMod12 = new Uint8Array(512)
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255]
      this.permMod12[i] = this.perm[i] % 12
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a)
  }
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7
    const u = h < 4 ? x : y
    const v = h < 4 ? y : x
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v)
  }
  perlin2(x: number, y: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = this.fade(x)
    const v = this.fade(y)
    const aa = this.perm[this.perm[X] + Y]
    const ab = this.perm[this.perm[X] + Y + 1]
    const ba = this.perm[this.perm[X + 1] + Y]
    const bb = this.perm[this.perm[X + 1] + Y + 1]
    const x1 = this.lerp(this.grad(aa, x, y), this.grad(ba, x - 1, y), u)
    const x2 = this.lerp(this.grad(ab, x, y - 1), this.grad(bb, x - 1, y - 1), u)
    return this.lerp(x1, x2, v)
  }
  private grad3: Array<[number, number]> = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [1, 0], [-1, 0],
    [0, 1], [0, -1], [0, 1], [0, -1],
  ]
  simplex2(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1)
    const G2 = (3 - Math.sqrt(3)) / 6
    const s = (xin + yin) * F2
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)
    const t = (i + j) * G2
    const x0 = xin - (i - t)
    const y0 = yin - (j - t)
    let i1: number, j1: number
    if (x0 > y0) { i1 = 1; j1 = 0 } else { i1 = 0; j1 = 1 }
    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2 * G2
    const y2 = y0 - 1 + 2 * G2
    const ii = i & 255
    const jj = j & 255
    const gi0 = this.permMod12[ii + this.perm[jj]]
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]]
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]]
    let n0 = 0, n1 = 0, n2 = 0
    let t0 = 0.5 - x0 * x0 - y0 * y0
    if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * (this.grad3[gi0][0] * x0 + this.grad3[gi0][1] * y0) }
    let t1 = 0.5 - x1 * x1 - y1 * y1
    if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * (this.grad3[gi1][0] * x1 + this.grad3[gi1][1] * y1) }
    let t2 = 0.5 - x2 * x2 - y2 * y2
    if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * (this.grad3[gi2][0] * x2 + this.grad3[gi2][1] * y2) }
    return 70 * (n0 + n1 + n2)
  }
  // 一维：基于二维 perlin/simplex，y 固定为 0
  noise1(x: number): number {
    return noiseType.value === 'perlin' ? this.perlin2(x, 0) : this.simplex2(x, 0)
  }
  noise2(x: number, y: number): number {
    return noiseType.value === 'perlin' ? this.perlin2(x, y) : this.simplex2(x, y)
  }
  // 分形布朗运动
  fbm1(x: number, freq: number, oct: number, pers: number): number {
    let total = 0, amplitude = 1, frequency = freq, maxValue = 0
    for (let i = 0; i < oct; i++) {
      total += this.noise1(x * frequency) * amplitude
      maxValue += amplitude
      amplitude *= pers
      frequency *= 2
    }
    return total / maxValue
  }
  fbm2(x: number, y: number, freq: number, oct: number, pers: number): number {
    let total = 0, amplitude = 1, frequency = freq, maxValue = 0
    for (let i = 0; i < oct; i++) {
      total += this.noise2(x * frequency, y * frequency) * amplitude
      maxValue += amplitude
      amplitude *= pers
      frequency *= 2
    }
    return total / maxValue
  }
}

let noiseGen: NoiseGenerator

function generate(): void {
  const seed = getSeed()
  if (!seedInput.value.trim()) seedInput.value = String(seed)
  noiseGen = new NoiseGenerator(seed)
  const amp = amplitude.value
  if (dim.value === '2d') {
    const size = resolution.value
    field2d = new Array(size * size)
    let min = Infinity, max = -Infinity
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const v = noiseGen.fbm2(x / size, y / size, frequency.value, octaves.value, persistence.value) * amp
        field2d[y * size + x] = v
        if (v < min) min = v
        if (v > max) max = v
      }
    }
    const range = max - min || 1
    for (let i = 0; i < field2d.length; i++) field2d[i] = (field2d[i] - min) / range
    nextTick(draw2d)
  } else {
    const len = canvasW1d
    field1d = new Array(len)
    let min = Infinity, max = -Infinity
    for (let x = 0; x < len; x++) {
      const v = noiseGen.fbm1(x / len, frequency.value, octaves.value, persistence.value) * amp
      field1d[x] = v
      if (v < min) min = v
      if (v > max) max = v
    }
    const range = max - min || 1
    for (let i = 0; i < field1d.length; i++) field1d[i] = (field1d[i] - min) / range
    nextTick(draw1d)
  }
}

function valueToColor(v: number): [number, number, number] {
  if (renderMode.value === 'gray') {
    const g = Math.floor(v * 255)
    return [g, g, g]
  }
  if (renderMode.value === 'gradient') {
    // 彩色渐变：蓝→青→绿→黄→红
    if (v < 0.25) return [0, 0, Math.floor(v * 4 * 255)]
    if (v < 0.5) return [0, Math.floor((v - 0.25) * 4 * 255), 255]
    if (v < 0.75) return [Math.floor((v - 0.5) * 4 * 255), 255, Math.floor(255 - (v - 0.5) * 4 * 255)]
    return [255, Math.floor(255 - (v - 0.75) * 4 * 255), 0]
  }
  // 地形色阶
  if (v < 0.3) return [10, 40, 90]
  if (v < 0.45) return [40, 100, 160]
  if (v < 0.5) return [220, 200, 140]
  if (v < 0.7) return [60, 140, 60]
  if (v < 0.85) return [120, 100, 70]
  return [240, 240, 240]
}

function draw2d(): void {
  const canvas = canvas2d.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = resolution.value
  const imageData = ctx.createImageData(size, size)
  const data = imageData.data
  for (let i = 0; i < field2d.length; i++) {
    const [r, g, b] = valueToColor(field2d[i])
    data[i * 4] = r
    data[i * 4 + 1] = g
    data[i * 4 + 2] = b
    data[i * 4 + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
}

function draw1d(): void {
  const canvas = canvas1d.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvasW1d
  const h = canvasH1d
  ctx.clearRect(0, 0, w, h)
  // 背景网格
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = (h / 4) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  // 填充区域
  const [cr, cg, cb] = valueToColor(0.5)
  ctx.beginPath()
  ctx.moveTo(0, h)
  for (let x = 0; x < field1d.length; x++) {
    const y = h - field1d[x] * h
    ctx.lineTo(x, y)
  }
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fillStyle = `rgba(${cr},${cg},${cb},0.35)`
  ctx.fill()
  // 曲线
  ctx.beginPath()
  for (let x = 0; x < field1d.length; x++) {
    const y = h - field1d[x] * h
    if (x === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.strokeStyle = '#18a058'
  ctx.lineWidth = 2
  ctx.stroke()
}

function exportPng(): void {
  const canvas = dim.value === '2d' ? canvas2d.value : canvas1d.value
  if (!canvas) {
    message.warning('请先生成噪声')
    return
  }
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `noise-${noiseType.value}-${dim.value}-${Date.now()}.png`
  a.click()
  message.success('PNG 已导出')
}

function exportData(): void {
  if (dim.value === '2d') {
    if (field2d.length === 0) { message.warning('请先生成噪声'); return }
    const size = resolution.value
    const rows: string[] = []
    for (let y = 0; y < size; y++) {
      const row: number[] = []
      for (let x = 0; x < size; x++) row.push(Math.round(field2d[y * size + x] * 1000) / 1000)
      rows.push('[' + row.join(',') + ']')
    }
    const text = '[\n' + rows.join(',\n') + '\n]'
    downloadFile(text, `noise-2d-${Date.now()}.json`)
  } else {
    if (field1d.length === 0) { message.warning('请先生成噪声'); return }
    const text = '[' + field1d.map(v => Math.round(v * 1000) / 1000).join(',') + ']'
    downloadFile(text, `noise-1d-${Date.now()}.json`)
  }
  message.success('数据已导出')
}

function downloadFile(text: string, name: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  generate()
})
</script>

<style scoped>
.tool-container {
  max-width: 1000px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.param-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.config-label {
  color: #666;
  font-size: 13px;
  min-width: 70px;
  flex-shrink: 0;
}

.value-tag {
  font-size: 12px;
  color: #888;
  font-family: 'Fira Code', 'Consolas', monospace;
  min-width: 38px;
}

.noise-select,
.dim-select,
.render-select {
  width: 160px;
}

.seed-input {
  width: 140px;
}

.canvas-wrap {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
  text-align: center;
}

.canvas-wrap canvas {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  image-rendering: pixelated;
}

.dark .section-title { color: #e0e0e0; }
.dark .config-label { color: #aaa; }
.dark .value-tag { color: #999; }
.dark .canvas-wrap { background: #181828; border-color: #2a2a4a; }
</style>
