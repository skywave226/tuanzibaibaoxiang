<template>
  <div class="pixel-art-editor">
    <div class="action-bar">
      <n-button size="small" @click="newCanvas">新建</n-button>
      <n-button size="small" @click="undo" :disabled="!canUndo">撤销</n-button>
      <n-button size="small" @click="redo" :disabled="!canRedo">重做</n-button>
      <n-button size="small" @click="clearCanvas">清空</n-button>
      <n-button size="small" type="primary" @click="exportPng">导出 PNG</n-button>
    </div>

    <div class="main-layout">
      <!-- 左侧：画布 -->
      <div class="canvas-panel">
        <div class="section-title">画布</div>
        <div class="canvas-controls">
          <span class="ctrl-label">尺寸</span>
          <n-select
            v-model:value="canvasSize"
            :options="sizeOptions"
            size="small"
            class="size-select"
            @update:value="changeSize"
          />
          <n-button size="small" quaternary @click="toggleGrid">
            {{ showGrid ? '隐藏网格' : '显示网格' }}
          </n-button>
        </div>
        <div class="canvas-wrap" :style="canvasWrapStyle">
          <canvas
            ref="canvasRef"
            :width="displaySize"
            :height="displaySize"
            @mousedown="startDraw"
            @mousemove="onDraw"
            @mouseup="endDraw"
            @mouseleave="endDraw"
            @contextmenu.prevent
          ></canvas>
        </div>
        <div class="coord-info" v-if="hoverX >= 0">
          坐标: ({{ hoverX }}, {{ hoverY }})
        </div>
      </div>

      <!-- 右侧：工具与调色板 -->
      <div class="side-panel">
        <div class="section-title">工具</div>
        <div class="tool-buttons">
          <n-button
            v-for="t in tools"
            :key="t.value"
            :type="currentTool === t.value ? 'primary' : 'default'"
            size="small"
            @click="currentTool = t.value"
            class="tool-btn"
          >
            {{ t.label }}
          </n-button>
        </div>

        <div class="section-title" style="margin-top:16px;">当前颜色</div>
        <div class="current-color-row">
          <div class="current-color-box" :style="{ background: currentColor }"></div>
          <span class="color-hex">{{ currentColor.toUpperCase() }}</span>
          <n-color-picker v-model:value="currentColor" size="small" :show-alpha="false" class="color-picker-comp" />
        </div>

        <div class="section-title" style="margin-top:16px;">调色板</div>
        <div class="palette-list">
          <n-select
            v-model:value="paletteKey"
            :options="paletteOptions"
            size="small"
            class="palette-select"
          />
        </div>
        <div class="palette-grid">
          <button
            v-for="(color, idx) in currentPalette"
            :key="idx"
            class="palette-swatch"
            :class="{ active: currentColor.toLowerCase() === color.toLowerCase() }"
            :style="{ background: color }"
            @click="currentColor = color"
            :title="color"
          ></button>
        </div>

        <div class="section-title" style="margin-top:16px;">导出设置</div>
        <div class="config-row">
          <span class="ctrl-label">放大倍数</span>
          <n-input-number v-model:value="exportScale" :min="1" :max="32" size="small" />
        </div>
        <div class="config-row">
          <span class="ctrl-label">透明背景</span>
          <n-switch v-model:value="transparentBg" size="small" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { NButton, NInputNumber, NSelect, NSwitch, NColorPicker, useMessage } from 'naive-ui'

const message = useMessage()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasSize = ref(16)
const displaySize = computed(() => Math.min(480, canvasSize.value * 28))
const pixelSize = computed(() => displaySize.value / canvasSize.value)

const sizeOptions = [
  { label: '8 × 8', value: 8 },
  { label: '16 × 16', value: 16 },
  { label: '24 × 24', value: 24 },
  { label: '32 × 32', value: 32 },
  { label: '48 × 48', value: 48 },
  { label: '64 × 64', value: 64 },
]

const tools = [
  { label: '画笔', value: 'brush' as const },
  { label: '橡皮', value: 'eraser' as const },
  { label: '填充', value: 'fill' as const },
  { label: '吸管', value: 'picker' as const },
]
const currentTool = ref<'brush' | 'eraser' | 'fill' | 'picker'>('brush')

const showGrid = ref(true)
const currentColor = ref('#000000')

const exportScale = ref(8)
const transparentBg = ref(false)

const hoverX = ref(-1)
const hoverY = ref(-1)

// 像素数据: 每个 cell 存储 hex 颜色或空字符串
let pixels: string[][] = []
// 历史记录
const history: string[][][] = []
let historyIndex = -1
const canUndo = computed(() => historyIndex > 0)
const canRedo = computed(() => historyIndex < history.length - 1)

const palettes: Record<string, string[]> = {
  default: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'],
  pico8: [
    '#000000', '#1d2b53', '#7e2553', '#008751',
    '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8',
    '#ff004d', '#ffa300', '#ffec27', '#00e436',
    '#29adff', '#83769c', '#ff77a8', '#ffccaa',
  ],
  gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  pastel: [
    '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf',
    '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff',
    '#fffffc', '#000000', '#808080', '#c0c0c0',
  ],
  earth: [
    '#000000', '#3d2817', '#5e3a1f', '#7a4a2b',
    '#9b6a3c', '#b8895a', '#d4a878', '#e8c89a',
    '#5a7d3a', '#7ba84a', '#a4c869', '#c9e08a',
    '#3a5a8a', '#5a8ab8', '#8ab8d4', '#c0d8e8',
  ],
}

const paletteOptions = [
  { label: '默认 8 色', value: 'default' },
  { label: 'PICO-8 (16 色)', value: 'pico8' },
  { label: 'GameBoy (4 色)', value: 'gameboy' },
  { label: '马卡龙 (12 色)', value: 'pastel' },
  { label: '大地色 (16 色)', value: 'earth' },
]
const paletteKey = ref('pico8')
const currentPalette = computed(() => palettes[paletteKey.value])

const canvasWrapStyle = computed(() => ({
  width: displaySize.value + 'px',
  height: displaySize.value + 'px',
}))

function initPixels(): void {
  pixels = []
  for (let y = 0; y < canvasSize.value; y++) {
    const row: string[] = []
    for (let x = 0; x < canvasSize.value; x++) row.push('')
    pixels.push(row)
  }
}

function clonePixels(): string[][] {
  return pixels.map(r => [...r])
}

function pushHistory(): void {
  // 截断未来历史
  if (historyIndex < history.length - 1) {
    history.splice(historyIndex + 1)
  }
  history.push(clonePixels())
  historyIndex = history.length - 1
  // 限制历史长度
  if (history.length > 50) {
    history.shift()
    historyIndex--
  }
}

function undo(): void {
  if (historyIndex <= 0) return
  historyIndex--
  pixels = history[historyIndex].map(r => [...r])
  drawCanvas()
}

function redo(): void {
  if (historyIndex >= history.length - 1) return
  historyIndex++
  pixels = history[historyIndex].map(r => [...r])
  drawCanvas()
}

function newCanvas(): void {
  initPixels()
  pushHistory()
  drawCanvas()
  message.success('已新建画布')
}

function clearCanvas(): void {
  initPixels()
  pushHistory()
  drawCanvas()
}

function changeSize(): void {
  initPixels()
  history.length = 0
  historyIndex = -1
  pushHistory()
  nextTick(drawCanvas)
}

function toggleGrid(): void {
  showGrid.value = !showGrid.value
  drawCanvas()
}

function getMousePos(e: MouseEvent): { x: number; y: number } {
  const canvas = canvasRef.value
  if (!canvas) return { x: -1, y: -1 }
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const cx = (e.clientX - rect.left) * scaleX
  const cy = (e.clientY - rect.top) * scaleY
  const x = Math.floor(cx / pixelSize.value)
  const y = Math.floor(cy / pixelSize.value)
  return { x, y }
}

let isDrawing = false

function startDraw(e: MouseEvent): void {
  const { x, y } = getMousePos(e)
  if (x < 0 || y < 0 || x >= canvasSize.value || y >= canvasSize.value) return
  isDrawing = true
  applyTool(x, y)
  drawCanvas()
}

function onDraw(e: MouseEvent): void {
  const { x, y } = getMousePos(e)
  if (x >= 0 && y >= 0 && x < canvasSize.value && y < canvasSize.value) {
    hoverX.value = x
    hoverY.value = y
  } else {
    hoverX.value = -1
    hoverY.value = -1
  }
  if (!isDrawing) return
  if (x < 0 || y < 0 || x >= canvasSize.value || y >= canvasSize.value) return
  // 填充和吸管不连续操作
  if (currentTool.value === 'fill' || currentTool.value === 'picker') return
  applyTool(x, y)
  drawCanvas()
}

function endDraw(): void {
  if (isDrawing) {
    isDrawing = false
    pushHistory()
  }
}

function applyTool(x: number, y: number): void {
  if (currentTool.value === 'brush') {
    pixels[y][x] = currentColor.value
  } else if (currentTool.value === 'eraser') {
    pixels[y][x] = ''
  } else if (currentTool.value === 'fill') {
    floodFill(x, y, pixels[y][x], currentColor.value)
  } else if (currentTool.value === 'picker') {
    if (pixels[y][x]) {
      currentColor.value = pixels[y][x]
    }
  }
}

function floodFill(x: number, y: number, target: string, replacement: string): void {
  if (target === replacement) return
  const stack: Array<[number, number]> = [[x, y]]
  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!
    if (cx < 0 || cy < 0 || cx >= canvasSize.value || cy >= canvasSize.value) continue
    if (pixels[cy][cx] !== target) continue
    pixels[cy][cx] = replacement
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
  }
}

function drawCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = displaySize.value
  ctx.clearRect(0, 0, size, size)
  // 背景（棋盘格表示透明）
  if (!transparentBg.value) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
  } else {
    // 棋盘格
    const cell = pixelSize.value
    for (let y = 0; y < canvasSize.value; y++) {
      for (let x = 0; x < canvasSize.value; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#e8e8e8' : '#f5f5f5'
        ctx.fillRect(x * cell, y * cell, cell, cell)
      }
    }
  }
  // 绘制像素
  for (let y = 0; y < canvasSize.value; y++) {
    for (let x = 0; x < canvasSize.value; x++) {
      if (pixels[y][x]) {
        ctx.fillStyle = pixels[y][x]
        ctx.fillRect(x * pixelSize.value, y * pixelSize.value, pixelSize.value, pixelSize.value)
      }
    }
  }
  // 网格
  if (showGrid.value) {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    for (let i = 0; i <= canvasSize.value; i++) {
      const p = i * pixelSize.value
      ctx.beginPath()
      ctx.moveTo(p, 0)
      ctx.lineTo(p, size)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, p)
      ctx.lineTo(size, p)
      ctx.stroke()
    }
  }
}

function exportPng(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  // 创建离屏 canvas 以指定放大倍数
  const off = document.createElement('canvas')
  const sz = canvasSize.value * exportScale.value
  off.width = sz
  off.height = sz
  const ctx = off.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  if (!transparentBg.value) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, sz, sz)
  }
  for (let y = 0; y < canvasSize.value; y++) {
    for (let x = 0; x < canvasSize.value; x++) {
      if (pixels[y][x]) {
        ctx.fillStyle = pixels[y][x]
        ctx.fillRect(x * exportScale.value, y * exportScale.value, exportScale.value, exportScale.value)
      }
    }
  }
  const url = off.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `pixel-art-${canvasSize.value}x${canvasSize.value}-${Date.now()}.png`
  a.click()
  message.success(`PNG 已导出 (${sz}×${sz})`)
}

onMounted(() => {
  initPixels()
  pushHistory()
  nextTick(drawCanvas)
})
</script>

<style scoped>
.pixel-art-editor {
  max-width: 1000px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.main-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.canvas-panel {
  flex: 0 0 auto;
}

.side-panel {
  flex: 1;
  min-width: 240px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.canvas-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.ctrl-label {
  color: #666;
  font-size: 13px;
}

.size-select {
  width: 120px;
}

.canvas-wrap {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  display: inline-block;
}

.canvas-wrap canvas {
  display: block;
  cursor: crosshair;
  image-rendering: pixelated;
  max-width: 100%;
}

.coord-info {
  margin-top: 6px;
  font-size: 12px;
  color: #999;
}

.tool-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tool-btn {
  min-width: 60px;
}

.current-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.current-color-box {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.color-hex {
  font-size: 12px;
  color: #666;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.color-picker-comp {
  flex: 1;
  min-width: 100px;
}

.palette-select {
  width: 100%;
  margin-bottom: 8px;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.palette-swatch {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s;
}

.palette-swatch:hover {
  transform: scale(1.1);
}

.palette-swatch.active {
  border-color: #18a058;
  box-shadow: 0 0 0 1px #fff inset;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.dark .section-title {
  color: #e0e0e0;
}

.dark .ctrl-label {
  color: #aaa;
}

.dark .color-hex {
  color: #aaa;
}

.dark .canvas-wrap {
  border-color: #2a2a4a;
}

.dark .current-color-box {
  border-color: #444;
}
</style>
