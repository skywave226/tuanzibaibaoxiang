<template>
  <div class="map-generator tool-container">
    <div class="action-bar">
      <n-button type="primary" @click="generate">生成地图</n-button>
      <n-button @click="exportArray">导出二维数组</n-button>
      <n-button @click="exportPng">导出 PNG</n-button>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">生成算法</span>
      </div>
      <div class="config-row">
        <span class="config-label">算法类型</span>
        <n-select
          v-model:value="algo"
          :options="algoOptions"
          size="small"
          class="algo-select"
        />
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">参数配置</span>
      </div>
      <div class="config-row">
        <span class="config-label">宽度</span>
        <n-input-number v-model:value="width" :min="16" :max="96" size="small" />
        <span class="config-label">高度</span>
        <n-input-number v-model:value="height" :min="16" :max="96" size="small" />
      </div>
      <div class="config-row">
        <span class="config-label">种子</span>
        <n-input v-model:value="seedInput" size="small" placeholder="留空随机" class="seed-input" />
        <n-button size="small" @click="randomSeed">随机种子</n-button>
      </div>
      <div class="config-row" v-if="algo === 'cave'">
        <span class="config-label">初始密度</span>
        <n-input-number v-model:value="density" :min="30" :max="70" size="small" />
        <span class="config-label">迭代次数</span>
        <n-input-number v-model:value="iterations" :min="1" :max="10" size="small" />
      </div>
      <div class="config-row" v-if="algo === 'bsp'">
        <span class="config-label">分割深度</span>
        <n-input-number v-model:value="bspDepth" :min="2" :max="6" size="small" />
        <span class="config-label">最小房间</span>
        <n-input-number v-model:value="minRoom" :min="3" :max="10" size="small" />
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">地图预览</span>
      </div>
      <div class="canvas-wrap">
        <canvas ref="canvasRef" :width="canvasW" :height="canvasH"></canvas>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">图例</span>
      </div>
      <div class="legend">
        <div class="legend-item">
          <span class="legend-color wall"></span>
          <span>墙壁</span>
        </div>
        <div class="legend-item">
          <span class="legend-color floor"></span>
          <span>地面</span>
        </div>
        <div class="legend-item">
          <span class="legend-color corridor"></span>
          <span>走廊</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { NButton, NInput, NInputNumber, NSelect, useMessage } from 'naive-ui'

const message = useMessage()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasW = 600
const canvasH = 600

const algo = ref<'cave' | 'maze' | 'bsp'>('bsp')
const algoOptions = [
  { label: '洞穴（Cellular Automata）', value: 'cave' },
  { label: '迷宫（递归回溯）', value: 'maze' },
  { label: '房间（BSP 二叉空间分割）', value: 'bsp' },
]

const width = ref(48)
const height = ref(48)
const seedInput = ref<string>('')
const density = ref(45)
const iterations = ref(5)
const bspDepth = ref(4)
const minRoom = ref(4)

let mapData: number[][] = []

// 种子随机数生成器 (Mulberry32)
function createRng(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

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

// 洞穴生成 - Cellular Automata
function generateCave(rng: () => number): number[][] {
  const w = width.value
  const h = height.value
  const grid: number[][] = []
  for (let y = 0; y < h; y++) {
    const row: number[] = []
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        row.push(1)
      } else {
        row.push(rng() * 100 < density.value ? 1 : 0)
      }
    }
    grid.push(row)
  }
  for (let it = 0; it < iterations.value; it++) {
    const next: number[][] = grid.map(r => [...r])
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let walls = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            if (grid[y + dy][x + dx] === 1) walls++
          }
        }
        next[y][x] = walls >= 5 ? 1 : 0
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        grid[y][x] = next[y][x]
      }
    }
  }
  return grid
}

// 迷宫生成 - 递归回溯
function generateMaze(rng: () => number): number[][] {
  const w = width.value
  const h = height.value
  const grid: number[][] = []
  for (let y = 0; y < h; y++) {
    const row: number[] = []
    for (let x = 0; x < w; x++) row.push(1)
    grid.push(row)
  }
  const mw = w % 2 === 0 ? w - 1 : w
  const mh = h % 2 === 0 ? h - 1 : h

  const stack: Array<[number, number]> = []
  const sx = 1
  const sy = 1
  grid[sy][sx] = 0
  stack.push([sx, sy])

  const dirs: Array<[number, number]> = [[0, -2], [2, 0], [0, 2], [-2, 0]]

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1]
    const shuffled = dirs.slice()
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    let carved = false
    for (const [dx, dy] of shuffled) {
      const nx = cx + dx
      const ny = cy + dy
      if (nx > 0 && ny > 0 && nx < mw - 1 && ny < mh - 1 && grid[ny][nx] === 1) {
        grid[cy + dy / 2][cx + dx / 2] = 0
        grid[ny][nx] = 0
        stack.push([nx, ny])
        carved = true
        break
      }
    }
    if (!carved) stack.pop()
  }
  return grid
}

// BSP 节点
interface Rect { x: number; y: number; w: number; h: number }
interface BspNode {
  x: number; y: number; w: number; h: number
  left: BspNode | null
  right: BspNode | null
  room: Rect | null
}

// 房间生成 - BSP 二叉空间分割
function generateBsp(rng: () => number): number[][] {
  const w = width.value
  const h = height.value
  const grid: number[][] = []
  for (let y = 0; y < h; y++) {
    const row: number[] = []
    for (let x = 0; x < w; x++) row.push(1)
    grid.push(row)
  }

  // 递归分割
  function split(node: BspNode, depth: number, horizontal: boolean): void {
    if (depth <= 0) {
      // 在叶子节点生成房间
      const pad = 1
      const minR = minRoom.value
      const maxRw = Math.max(minR, node.w - pad * 2)
      const maxRh = Math.max(minR, node.h - pad * 2)
      const rw = Math.min(maxRw, Math.floor(rng() * (maxRw - minR + 1)) + minR)
      const rh = Math.min(maxRh, Math.floor(rng() * (maxRh - minR + 1)) + minR)
      const rx = node.x + pad + Math.floor(rng() * Math.max(1, node.w - rw - pad * 2 + 1))
      const ry = node.y + pad + Math.floor(rng() * Math.max(1, node.h - rh - pad * 2 + 1))
      node.room = { x: rx, y: ry, w: rw, h: rh }
      return
    }
    // 决定切分方向：若区域过扁则强制垂直/水平
    let splitH = horizontal
    if (node.w > node.h * 1.25) splitH = false
    else if (node.h > node.w * 1.25) splitH = true

    const minSize = minRoom.value + 2
    if (splitH) {
      if (node.h < minSize * 2) {
        node.room = { x: node.x + 1, y: node.y + 1, w: node.w - 2, h: node.h - 2 }
        return
      }
      const sp = Math.floor(rng() * (node.h - minSize * 2 + 1)) + minSize
      node.left = { x: node.x, y: node.y, w: node.w, h: sp, left: null, right: null, room: null }
      node.right = { x: node.x, y: node.y + sp, w: node.w, h: node.h - sp, left: null, right: null, room: null }
    } else {
      if (node.w < minSize * 2) {
        node.room = { x: node.x + 1, y: node.y + 1, w: node.w - 2, h: node.h - 2 }
        return
      }
      const sp = Math.floor(rng() * (node.w - minSize * 2 + 1)) + minSize
      node.left = { x: node.x, y: node.y, w: sp, h: node.h, left: null, right: null, room: null }
      node.right = { x: node.x + sp, y: node.y, w: node.w - sp, h: node.h, left: null, right: null, room: null }
    }
    split(node.left!, depth - 1, !splitH)
    split(node.right!, depth - 1, !splitH)
  }

  const root: BspNode = { x: 0, y: 0, w, h, left: null, right: null, room: null }
  split(root, bspDepth.value, rng() < 0.5)

  // 挖空房间
  const leaves: BspNode[] = []
  function collect(n: BspNode): void {
    if (n.left || n.right) {
      if (n.left) collect(n.left)
      if (n.right) collect(n.right)
    } else {
      leaves.push(n)
    }
  }
  collect(root)

  for (const leaf of leaves) {
    if (!leaf.room) continue
    const r = leaf.room
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        if (y >= 0 && y < h && x >= 0 && x < w) grid[y][x] = 0
      }
    }
  }

  // 连接兄弟节点的房间中心
  function connect(n: BspNode): Rect | null {
    if (n.room) return n.room
    if (!n.left || !n.right) return null
    const a = connect(n.left)
    const b = connect(n.right)
    if (a && b) {
      carveCorridor(grid, center(a), center(b), w, h)
    }
    // 返回任一中心供上层连接
    return a || b
  }
  connect(root)

  return grid
}

function center(r: Rect): [number, number] {
  return [Math.floor(r.x + r.w / 2), Math.floor(r.y + r.h / 2)]
}

function carveCorridor(grid: number[][], a: [number, number], b: [number, number], w: number, h: number): void {
  let [x1, y1] = a
  const [x2, y2] = b
  // 先水平后垂直
  while (x1 !== x2) {
    if (x1 >= 0 && x1 < w && y1 >= 0 && y1 < h && grid[y1][x1] === 1) grid[y1][x1] = 2
    x1 += x1 < x2 ? 1 : -1
  }
  while (y1 !== y2) {
    if (x1 >= 0 && x1 < w && y1 >= 0 && y1 < h && grid[y1][x1] === 1) grid[y1][x1] = 2
    y1 += y1 < y2 ? 1 : -1
  }
}

function generate(): void {
  const seed = getSeed()
  if (!seedInput.value.trim()) seedInput.value = String(seed)
  const rng = createRng(seed)
  if (algo.value === 'cave') {
    mapData = generateCave(rng)
  } else if (algo.value === 'maze') {
    mapData = generateMaze(rng)
  } else {
    mapData = generateBsp(rng)
  }
  nextTick(drawMap)
}

function drawMap(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvasW, canvasH)
  if (mapData.length === 0) return
  const rows = mapData.length
  const cols = mapData[0].length
  const cellW = canvasW / cols
  const cellH = canvasH / rows
  const cell = Math.min(cellW, cellH)
  const offsetX = (canvasW - cell * cols) / 2
  const offsetY = (canvasH - cell * rows) / 2
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const v = mapData[y][x]
      if (v === 1) ctx.fillStyle = '#2c3e50'
      else if (v === 2) ctx.fillStyle = '#9b6a3c'
      else ctx.fillStyle = '#ecf0f1'
      ctx.fillRect(offsetX + x * cell, offsetY + y * cell, cell, cell)
    }
  }
}

function exportArray(): void {
  if (mapData.length === 0) {
    message.warning('请先生成地图')
    return
  }
  // 走廊(2)并入地面(0)以便外部使用
  const out = mapData.map(row => row.map(v => v === 2 ? 0 : v))
  const text = '[\n' + out.map(row => '  [' + row.join(',') + ']').join(',\n') + '\n]'
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `map-${algo.value}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('二维数组已导出')
}

function exportPng(): void {
  const canvas = canvasRef.value
  if (!canvas || mapData.length === 0) {
    message.warning('请先生成地图')
    return
  }
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `map-${algo.value}-${Date.now()}.png`
  a.click()
  message.success('PNG 已导出')
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

.config-label {
  color: #666;
  font-size: 13px;
  min-width: 70px;
  flex-shrink: 0;
}

.algo-select {
  width: 260px;
}

.seed-input {
  width: 200px;
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

.legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.legend-color {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid #ddd;
}

.legend-color.wall { background: #2c3e50; }
.legend-color.floor { background: #ecf0f1; }
.legend-color.corridor { background: #9b6a3c; }

.dark .section-title { color: #e0e0e0; }
.dark .config-label { color: #aaa; }
.dark .legend-item { color: #aaa; }
.dark .canvas-wrap { background: #181828; border-color: #2a2a4a; }
.dark .legend-color { border-color: #444; }
</style>
