<template>
  <div class="pixel-art-tool">
    <div class="top-bar">
      <n-button-group>
        <n-button size="small" @click="undo" :disabled="!canUndo">撤销</n-button>
        <n-button size="small" @click="redo" :disabled="!canRedo">重做</n-button>
        <n-button size="small" @click="clearCanvas">清空</n-button>
      </n-button-group>
      <n-button size="small" type="primary" @click="exportPng">导出 PNG</n-button>
    </div>

    <div class="workspace">
      <div class="canvas-area">
        <div class="canvas-size">
          <span class="label">画布尺寸</span>
          <n-select v-model:value="gridSize" :options="sizeOptions" size="small" style="width: 120px" @update:value="resizeGrid" />
          <n-switch v-model:value="showGrid" size="small" />
          <span class="label">网格</span>
        </div>
        <div class="canvas-box" :style="boxStyle">
          <canvas
            ref="canvasRef"
            :width="canvasPx"
            :height="canvasPx"
            @mousedown="startDraw"
            @mousemove="onDraw"
            @mouseup="endDraw"
            @mouseleave="endDraw"
            @contextmenu.prevent
          ></canvas>
        </div>
        <div class="hint">快捷键：B 画笔 / E 橡皮 / F 填充 / I 吸管</div>
      </div>

      <div class="tool-panel">
        <div class="panel-section">
          <div class="section-title">工具</div>
          <div class="tool-list">
            <n-button
              v-for="t in toolList"
              :key="t.value"
              :type="tool === t.value ? 'primary' : 'default'"
              size="small"
              @click="tool = t.value"
            >
              {{ t.label }}
            </n-button>
          </div>
        </div>

        <div class="panel-section">
          <div class="section-title">颜色</div>
          <div class="current-color">
            <div class="color-preview" :style="{ background: color }"></div>
            <span class="color-value">{{ color.toUpperCase() }}</span>
          </div>
          <n-color-picker v-model:value="color" size="small" :show-alpha="false" />
        </div>

        <div class="panel-section">
          <div class="section-title">调色板</div>
          <n-select v-model:value="paletteName" :options="paletteOptions" size="small" />
          <div class="palette-grid">
            <button
              v-for="(c, idx) in activePalette"
              :key="idx"
              class="palette-btn"
              :class="{ active: color.toLowerCase() === c.toLowerCase() }"
              :style="{ background: c }"
              @click="color = c"
              :title="c"
            ></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { NButton, NButtonGroup, NSelect, NSwitch, NColorPicker, useMessage } from 'naive-ui'

type Tool = 'brush' | 'eraser' | 'fill' | 'picker'

const message = useMessage()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const gridSize = ref(16)
const showGrid = ref(true)
const tool = ref<Tool>('brush')
const color = ref('#000000')
const paletteName = ref('pico8')

const canvasPx = computed(() => Math.min(512, gridSize.value * 32))
const cellPx = computed(() => canvasPx.value / gridSize.value)

const sizeOptions = [
  { label: '8 × 8', value: 8 },
  { label: '16 × 16', value: 16 },
  { label: '24 × 24', value: 24 },
  { label: '32 × 32', value: 32 },
]

const toolList = [
  { label: '画笔 (B)', value: 'brush' as Tool },
  { label: '橡皮 (E)', value: 'eraser' as Tool },
  { label: '填充 (F)', value: 'fill' as Tool },
  { label: '吸管 (I)', value: 'picker' as Tool },
]

const palettes: Record<string, string[]> = {
  default: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'],
  pico8: ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'],
  gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  nes: ['#000000', '#fcfcfc', '#f8f8f8', '#bcbcbc', '#7c7c7c', '#a4e4fc', '#3cbcfc', '#0078f8', '#0000fc', '#b8b8f8', '#6888fc', '#0058ec', '#f8d8f8', '#f878f8', '#d800cc', '#940084'],
}

const paletteOptions = [
  { label: '默认', value: 'default' },
  { label: 'PICO-8', value: 'pico8' },
  { label: 'GameBoy', value: 'gameboy' },
  { label: 'NES', value: 'nes' },
]

const activePalette = computed(() => palettes[paletteName.value])

const boxStyle = computed(() => ({
  width: canvasPx.value + 'px',
  height: canvasPx.value + 'px',
}))

let pixels: string[][] = []
const history: string[][][] = []
let historyIndex = -1
let drawing = false

const canUndo = computed(() => historyIndex > 0)
const canRedo = computed(() => historyIndex < history.length - 1)

function initPixels(): void {
  pixels = Array.from({ length: gridSize.value }, () => Array(gridSize.value).fill(''))
}

function pushHistory(): void {
  if (historyIndex < history.length - 1) history.splice(historyIndex + 1)
  history.push(pixels.map(r => [...r]))
  historyIndex = history.length - 1
  if (history.length > 50) {
    history.shift()
    historyIndex--
  }
}

function undo(): void {
  if (!canUndo.value) return
  historyIndex--
  pixels = history[historyIndex].map(r => [...r])
  draw()
}

function redo(): void {
  if (!canRedo.value) return
  historyIndex++
  pixels = history[historyIndex].map(r => [...r])
  draw()
}

function clearCanvas(): void {
  initPixels()
  pushHistory()
  draw()
}

function resizeGrid(): void {
  initPixels()
  history.length = 0
  historyIndex = -1
  pushHistory()
  nextTick(draw)
}

function getPos(e: MouseEvent): { x: number; y: number } {
  const canvas = canvasRef.value
  if (!canvas) return { x: -1, y: -1 }
  const rect = canvas.getBoundingClientRect()
  const x = Math.floor(((e.clientX - rect.left) * canvas.width) / rect.width / cellPx.value)
  const y = Math.floor(((e.clientY - rect.top) * canvas.height) / rect.height / cellPx.value)
  return { x, y }
}

function startDraw(e: MouseEvent): void {
  const { x, y } = getPos(e)
  if (x < 0 || y < 0 || x >= gridSize.value || y >= gridSize.value) return
  drawing = true
  applyTool(x, y)
  draw()
}

function onDraw(e: MouseEvent): void {
  if (!drawing) return
  const { x, y } = getPos(e)
  if (x < 0 || y < 0 || x >= gridSize.value || y >= gridSize.value) return
  if (tool.value === 'fill' || tool.value === 'picker') return
  applyTool(x, y)
  draw()
}

function endDraw(): void {
  if (drawing) {
    drawing = false
    pushHistory()
  }
}

function applyTool(x: number, y: number): void {
  if (tool.value === 'brush') {
    pixels[y][x] = color.value
  } else if (tool.value === 'eraser') {
    pixels[y][x] = ''
  } else if (tool.value === 'fill') {
    floodFill(x, y, pixels[y][x], color.value)
  } else if (tool.value === 'picker') {
    if (pixels[y][x]) color.value = pixels[y][x]
  }
}

function floodFill(x: number, y: number, target: string, replacement: string): void {
  if (target === replacement) return
  const stack: Array<[number, number]> = [[x, y]]
  while (stack.length) {
    const [cx, cy] = stack.pop()!
    if (cx < 0 || cy < 0 || cx >= gridSize.value || cy >= gridSize.value) continue
    if (pixels[cy][cx] !== target) continue
    pixels[cy][cx] = replacement
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
  }
}

function draw(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = canvasPx.value
  ctx.clearRect(0, 0, size, size)
  // transparent checkerboard
  const cs = cellPx.value
  for (let y = 0; y < gridSize.value; y++) {
    for (let x = 0; x < gridSize.value; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#f0f0f0' : '#ffffff'
      ctx.fillRect(x * cs, y * cs, cs, cs)
    }
  }
  for (let y = 0; y < gridSize.value; y++) {
    for (let x = 0; x < gridSize.value; x++) {
      if (pixels[y][x]) {
        ctx.fillStyle = pixels[y][x]
        ctx.fillRect(x * cs, y * cs, cs, cs)
      }
    }
  }
  if (showGrid.value) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.lineWidth = 1
    for (let i = 0; i <= gridSize.value; i++) {
      const p = i * cs
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke()
    }
  }
}

function exportPng(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const off = document.createElement('canvas')
  const scale = 10
  off.width = gridSize.value * scale
  off.height = gridSize.value * scale
  const ctx = off.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  for (let y = 0; y < gridSize.value; y++) {
    for (let x = 0; x < gridSize.value; x++) {
      if (pixels[y][x]) {
        ctx.fillStyle = pixels[y][x]
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }
  const url = off.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `pixel-art-${gridSize.value}x${gridSize.value}-${Date.now()}.png`
  a.click()
  message.success('PNG 已导出')
}

window.addEventListener('keydown', (e: KeyboardEvent) => {
  const key = e.key.toLowerCase()
  if (key === 'b') tool.value = 'brush'
  else if (key === 'e') tool.value = 'eraser'
  else if (key === 'f') tool.value = 'fill'
  else if (key === 'i') tool.value = 'picker'
  else if ((e.ctrlKey || e.metaKey) && key === 'z') {
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
  }
})

onMounted(() => {
  initPixels()
  pushHistory()
  nextTick(draw)
})
</script>

<style scoped>
.pixel-art-tool {
  max-width: 1000px;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.workspace {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.canvas-area {
  flex: 1;
  min-width: 280px;
}

.canvas-size {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.label {
  font-size: 13px;
  color: #666;
}

.canvas-box {
  border: 1px solid #e0e0e6;
  border-radius: 8px;
  overflow: hidden;
  display: inline-block;
  background: #fff;
}

.canvas-box canvas {
  display: block;
  cursor: crosshair;
  image-rendering: pixelated;
  max-width: 100%;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.tool-panel {
  width: 260px;
  min-width: 220px;
}

.panel-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.tool-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.current-color {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.color-preview {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.color-value {
  font-size: 12px;
  color: #666;
  font-family: 'Fira Code', monospace;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  margin-top: 10px;
}

.palette-btn {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

.palette-btn.active {
  border-color: #18a058;
  box-shadow: 0 0 0 1px #fff inset;
}

.dark .section-title { color: #e0e0e0; }
.dark .label { color: #aaa; }
.dark .color-value { color: #aaa; }
.dark .canvas-box { border-color: #2a2a4a; }
.dark .color-preview { border-color: #444; }
</style>
