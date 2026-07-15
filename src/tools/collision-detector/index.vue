<template>
  <div class="tool-container collision-detector">
    <div class="card mb-4">
      <div class="config-row">
        <div class="config-item">
          <label>检测类型</label>
          <n-select v-model:value="testType" :options="testOptions" style="width: 240px" />
        </div>
        <div class="config-item">
          <label>状态</label>
          <div class="status" :class="colliding ? 'hit' : 'miss'">
            <span class="dot"></span>
            {{ colliding ? '碰撞' : '未碰撞' }}
          </div>
        </div>
        <div class="config-item action-bar">
          <n-button size="small" @click="reset">重置参数</n-button>
        </div>
      </div>
    </div>

    <div class="main-grid">
      <div class="card params-panel">
        <h3 class="section-title">参数设置</h3>

        <!-- AABB 矩形 -->
        <template v-if="testType === 'aabb'">
          <div class="shape-group">
            <div class="shape-label">矩形 A (左上角 + 宽高)</div>
            <div class="field"><span>X</span><n-input-number v-model:value="rectA.x" :step="5" /></div>
            <div class="field"><span>Y</span><n-input-number v-model:value="rectA.y" :step="5" /></div>
            <div class="field"><span>W</span><n-input-number v-model:value="rectA.w" :min="1" :step="5" /></div>
            <div class="field"><span>H</span><n-input-number v-model:value="rectA.h" :min="1" :step="5" /></div>
          </div>
          <div class="shape-group">
            <div class="shape-label">矩形 B (左上角 + 宽高)</div>
            <div class="field"><span>X</span><n-input-number v-model:value="rectB.x" :step="5" /></div>
            <div class="field"><span>Y</span><n-input-number v-model:value="rectB.y" :step="5" /></div>
            <div class="field"><span>W</span><n-input-number v-model:value="rectB.w" :min="1" :step="5" /></div>
            <div class="field"><span>H</span><n-input-number v-model:value="rectB.h" :min="1" :step="5" /></div>
          </div>
        </template>

        <!-- 圆形碰撞 -->
        <template v-else-if="testType === 'circle-circle'">
          <div class="shape-group">
            <div class="shape-label">圆形 A</div>
            <div class="field"><span>圆心 X</span><n-input-number v-model:value="circleA.x" :step="5" /></div>
            <div class="field"><span>圆心 Y</span><n-input-number v-model:value="circleA.y" :step="5" /></div>
            <div class="field"><span>半径</span><n-input-number v-model:value="circleA.r" :min="1" :step="5" /></div>
          </div>
          <div class="shape-group">
            <div class="shape-label">圆形 B</div>
            <div class="field"><span>圆心 X</span><n-input-number v-model:value="circleB.x" :step="5" /></div>
            <div class="field"><span>圆心 Y</span><n-input-number v-model:value="circleB.y" :step="5" /></div>
            <div class="field"><span>半径</span><n-input-number v-model:value="circleB.r" :min="1" :step="5" /></div>
          </div>
        </template>

        <!-- 矩形 vs 圆形 -->
        <template v-else-if="testType === 'rect-circle'">
          <div class="shape-group">
            <div class="shape-label">矩形 (左上角 + 宽高)</div>
            <div class="field"><span>X</span><n-input-number v-model:value="rectA.x" :step="5" /></div>
            <div class="field"><span>Y</span><n-input-number v-model:value="rectA.y" :step="5" /></div>
            <div class="field"><span>W</span><n-input-number v-model:value="rectA.w" :min="1" :step="5" /></div>
            <div class="field"><span>H</span><n-input-number v-model:value="rectA.h" :min="1" :step="5" /></div>
          </div>
          <div class="shape-group">
            <div class="shape-label">圆形</div>
            <div class="field"><span>圆心 X</span><n-input-number v-model:value="circleA.x" :step="5" /></div>
            <div class="field"><span>圆心 Y</span><n-input-number v-model:value="circleA.y" :step="5" /></div>
            <div class="field"><span>半径</span><n-input-number v-model:value="circleA.r" :min="1" :step="5" /></div>
          </div>
        </template>

        <!-- 点 vs 矩形 -->
        <template v-else-if="testType === 'point-rect'">
          <div class="shape-group">
            <div class="shape-label">点</div>
            <div class="field"><span>X</span><n-input-number v-model:value="point.x" :step="5" /></div>
            <div class="field"><span>Y</span><n-input-number v-model:value="point.y" :step="5" /></div>
          </div>
          <div class="shape-group">
            <div class="shape-label">矩形 (左上角 + 宽高)</div>
            <div class="field"><span>X</span><n-input-number v-model:value="rectA.x" :step="5" /></div>
            <div class="field"><span>Y</span><n-input-number v-model:value="rectA.y" :step="5" /></div>
            <div class="field"><span>W</span><n-input-number v-model:value="rectA.w" :min="1" :step="5" /></div>
            <div class="field"><span>H</span><n-input-number v-model:value="rectA.h" :min="1" :step="5" /></div>
          </div>
        </template>

        <!-- 点 vs 圆形 -->
        <template v-else-if="testType === 'point-circle'">
          <div class="shape-group">
            <div class="shape-label">点</div>
            <div class="field"><span>X</span><n-input-number v-model:value="point.x" :step="5" /></div>
            <div class="field"><span>Y</span><n-input-number v-model:value="point.y" :step="5" /></div>
          </div>
          <div class="shape-group">
            <div class="shape-label">圆形</div>
            <div class="field"><span>圆心 X</span><n-input-number v-model:value="circleA.x" :step="5" /></div>
            <div class="field"><span>圆心 Y</span><n-input-number v-model:value="circleA.y" :step="5" /></div>
            <div class="field"><span>半径</span><n-input-number v-model:value="circleA.r" :min="1" :step="5" /></div>
          </div>
        </template>

        <!-- 点 vs 线段 -->
        <template v-else-if="testType === 'point-segment'">
          <div class="shape-group">
            <div class="shape-label">点</div>
            <div class="field"><span>X</span><n-input-number v-model:value="point.x" :step="5" /></div>
            <div class="field"><span>Y</span><n-input-number v-model:value="point.y" :step="5" /></div>
            <div class="field"><span>阈值</span><n-input-number v-model:value="pointThresh" :min="1" :step="1" /></div>
          </div>
          <div class="shape-group">
            <div class="shape-label">线段</div>
            <div class="field"><span>X1</span><n-input-number v-model:value="segA.x1" :step="5" /></div>
            <div class="field"><span>Y1</span><n-input-number v-model:value="segA.y1" :step="5" /></div>
            <div class="field"><span>X2</span><n-input-number v-model:value="segA.x2" :step="5" /></div>
            <div class="field"><span>Y2</span><n-input-number v-model:value="segA.y2" :step="5" /></div>
          </div>
        </template>
      </div>

      <div class="card canvas-panel">
        <h3 class="section-title">可视化预览</h3>
        <canvas ref="canvasRef" :width="canvasW" :height="canvasH" class="canvas"></canvas>
        <div class="canvas-hint">拖拽图形可移动 · 拖拽右下角控制点可调整大小 · 红色高亮表示碰撞</div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="header-row">
        <h3 class="section-title">检测详情</h3>
        <n-tag :type="colliding ? 'error' : 'success'" size="small" round>
          {{ colliding ? '碰撞' : '未碰撞' }}
        </n-tag>
      </div>
      <n-input :value="detailText" type="textarea" readonly :rows="3" />
    </div>

    <div class="card mt-4">
      <h3 class="section-title">算法公式</h3>
      <div class="formula-grid">
        <div class="formula-item" v-for="f in currentFormulas" :key="f.title">
          <div class="formula-title">{{ f.title }}</div>
          <pre class="formula-code">{{ f.code }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { NSelect, NInputNumber, NButton, NInput, NTag } from 'naive-ui'

type TestType = 'aabb' | 'circle-circle' | 'rect-circle' | 'point-rect' | 'point-circle' | 'point-segment'

const testOptions = [
  { label: 'AABB 矩形 vs 矩形', value: 'aabb' },
  { label: '圆形 vs 圆形', value: 'circle-circle' },
  { label: '矩形 vs 圆形', value: 'rect-circle' },
  { label: '点 vs 矩形', value: 'point-rect' },
  { label: '点 vs 圆形', value: 'point-circle' },
  { label: '点 vs 线段', value: 'point-segment' },
]

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasW = 540
const canvasH = 420

const testType = ref<TestType>('aabb')

const rectA = reactive({ x: 80, y: 80, w: 130, h: 90 })
const rectB = reactive({ x: 210, y: 170, w: 150, h: 110 })
const circleA = reactive({ x: 160, y: 160, r: 65 })
const circleB = reactive({ x: 320, y: 230, r: 55 })
const point = reactive({ x: 200, y: 180 })
const segA = reactive({ x1: 60, y1: 60, x2: 380, y2: 360 })
const pointThresh = ref(8)

// ---------- 碰撞检测算法 ----------
function aabbHit(a: { x: number; y: number; w: number; h: number }, b: typeof a) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function circleHit(a: { x: number; y: number; r: number }, b: typeof a) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const r = a.r + b.r
  return dx * dx + dy * dy <= r * r
}

function circleRectHit(
  c: { x: number; y: number; r: number },
  r: { x: number; y: number; w: number; h: number }
) {
  const cx = Math.max(r.x, Math.min(c.x, r.x + r.w))
  const cy = Math.max(r.y, Math.min(c.y, r.y + r.h))
  const dx = c.x - cx
  const dy = c.y - cy
  return dx * dx + dy * dy <= c.r * c.r
}

function pointInRect(p: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
}

function pointInCircle(p: { x: number; y: number }, c: { x: number; y: number; r: number }) {
  const dx = p.x - c.x
  const dy = p.y - c.y
  return dx * dx + dy * dy <= c.r * c.r
}

// 点到线段距离
function pointToSegmentDist(p: { x: number; y: number }, s: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = s.x2 - s.x1
  const dy = s.y2 - s.y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p.x - s.x1, p.y - s.y1)
  let t = ((p.x - s.x1) * dx + (p.y - s.y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const cx = s.x1 + t * dx
  const cy = s.y1 + t * dy
  return Math.hypot(p.x - cx, p.y - cy)
}

function pointSegmentHit(p: { x: number; y: number }, s: { x1: number; y1: number; x2: number; y2: number }, thresh: number) {
  return pointToSegmentDist(p, s) <= thresh
}

const colliding = computed(() => {
  switch (testType.value) {
    case 'aabb':
      return aabbHit(rectA, rectB)
    case 'circle-circle':
      return circleHit(circleA, circleB)
    case 'rect-circle':
      return circleRectHit(circleA, rectA)
    case 'point-rect':
      return pointInRect(point, rectA)
    case 'point-circle':
      return pointInCircle(point, circleA)
    case 'point-segment':
      return pointSegmentHit(point, segA, pointThresh.value)
  }
})

const detailText = computed(() => {
  const hit = colliding.value ? '✓ 碰撞' : '✗ 未碰撞'
  switch (testType.value) {
    case 'aabb': {
      const overlapX = Math.max(0, Math.min(rectA.x + rectA.w, rectB.x + rectB.w) - Math.max(rectA.x, rectB.x))
      const overlapY = Math.max(0, Math.min(rectA.y + rectA.h, rectB.y + rectB.h) - Math.max(rectA.y, rectB.y))
      return `${hit}\nX 方向重叠：${overlapX.toFixed(1)} px\nY 方向重叠：${overlapY.toFixed(1)} px`
    }
    case 'circle-circle': {
      const dx = circleA.x - circleB.x
      const dy = circleA.y - circleB.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      return `${hit}\n圆心距离：${dist.toFixed(2)}\n半径之和：${circleA.r + circleB.r}`
    }
    case 'rect-circle': {
      const cx = Math.max(rectA.x, Math.min(circleA.x, rectA.x + rectA.w))
      const cy = Math.max(rectA.y, Math.min(circleA.y, rectA.y + rectA.h))
      const dx = circleA.x - cx
      const dy = circleA.y - cy
      return `${hit}\n最近点到圆心距离：${Math.sqrt(dx * dx + dy * dy).toFixed(2)}\n半径：${circleA.r}`
    }
    case 'point-rect':
      return `${hit}\n点 (${point.x}, ${point.y}) 相对矩形 (${rectA.x},${rectA.y},${rectA.w}×${rectA.h})`
    case 'point-circle': {
      const dx = point.x - circleA.x
      const dy = point.y - circleA.y
      return `${hit}\n点到圆心距离：${Math.sqrt(dx * dx + dy * dy).toFixed(2)}\n半径：${circleA.r}`
    }
    case 'point-segment': {
      const d = pointToSegmentDist(point, segA)
      return `${hit}\n点到线段距离：${d.toFixed(2)}\n阈值：${pointThresh.value}`
    }
  }
})

const formulaMap: Record<TestType, { title: string; code: string }[]> = {
  aabb: [
    { title: 'AABB 碰撞判定', code: 'a.x < b.x + b.w &&\na.x + a.w > b.x &&\na.y < b.y + b.h &&\na.y + a.h > b.y' },
    { title: '重叠区域', code: 'overlapX = min(a.x+a.w, b.x+b.w) - max(a.x, b.x)\noverlapY = min(a.y+a.h, b.y+b.h) - max(a.y, b.y)\n碰撞 ⟺ overlapX > 0 && overlapY > 0' },
  ],
  'circle-circle': [
    { title: '圆与圆碰撞', code: 'dx = a.x - b.x\ndy = a.y - b.y\nreturn dx*dx + dy*dy <= (a.r + b.r)²' },
    { title: '距离比较', code: '圆心距离 d = √(dx² + dy²)\n碰撞 ⟺ d <= a.r + b.r' },
  ],
  'rect-circle': [
    { title: '矩形 vs 圆形', code: 'cx = clamp(circle.x, rect.x, rect.x + rect.w)\ncy = clamp(circle.y, rect.y, rect.y + rect.h)\ndx = circle.x - cx\ndy = circle.y - cy\nreturn dx*dx + dy*dy <= circle.r²' },
    { title: '最近点法', code: '找出矩形上离圆心最近的点 (cx, cy)\n若该点到圆心距离 ≤ 半径，则碰撞' },
  ],
  'point-rect': [
    { title: '点在矩形内', code: 'return p.x >= r.x && p.x <= r.x + r.w &&\n       p.y >= r.y && p.y <= r.y + r.h' },
  ],
  'point-circle': [
    { title: '点在圆内', code: 'dx = p.x - c.x\ndy = p.y - c.y\nreturn dx*dx + dy*dy <= c.r * c.r' },
  ],
  'point-segment': [
    { title: '点到线段距离', code: 'dx = s.x2 - s.x1, dy = s.y2 - s.y1\nt = ((p.x-s.x1)*dx + (p.y-s.y1)*dy) / (dx²+dy²)\nt = clamp(t, 0, 1)\n最近点 = (s.x1 + t*dx, s.y1 + t*dy)\nd = dist(p, 最近点)\n碰撞 ⟺ d <= 阈值' },
  ],
}

const currentFormulas = computed(() => formulaMap[testType.value])

// ---------- 绘制 ----------
function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvasW, canvasH)
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, canvasW, canvasH)
  drawGrid(ctx)

  const hit = colliding.value
  const colorA = hit ? '#e53935' : '#1976d2'
  const colorB = hit ? '#e53935' : '#43a047'

  ctx.lineWidth = 2

  // 绘制碰撞高亮区域
  if (hit) drawCollisionHighlight(ctx)

  if (testType.value === 'aabb') {
    drawRect(ctx, rectA, colorA, true)
    drawRect(ctx, rectB, colorB, true)
  } else if (testType.value === 'circle-circle') {
    drawCircle(ctx, circleA, colorA, true)
    drawCircle(ctx, circleB, colorB, true)
  } else if (testType.value === 'rect-circle') {
    drawRect(ctx, rectA, colorA, true)
    drawCircle(ctx, circleA, colorB, true)
  } else if (testType.value === 'point-rect') {
    drawRect(ctx, rectA, colorA, true)
    drawPoint(ctx, point, hit ? '#e53935' : '#ff9800')
  } else if (testType.value === 'point-circle') {
    drawCircle(ctx, circleA, colorA, true)
    drawPoint(ctx, point, hit ? '#e53935' : '#ff9800')
  } else if (testType.value === 'point-segment') {
    drawSegment(ctx, segA, colorA)
    // 绘制阈值带
    drawSegmentBand(ctx, segA, pointThresh.value)
    drawPoint(ctx, point, hit ? '#e53935' : '#ff9800')
  }
}

function drawCollisionHighlight(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.fillStyle = 'rgba(229, 57, 53, 0.18)'
  ctx.strokeStyle = 'rgba(229, 57, 53, 0.6)'
  ctx.setLineDash([5, 4])
  ctx.lineWidth = 1.5
  if (testType.value === 'aabb') {
    const ox = Math.max(0, Math.min(rectA.x + rectA.w, rectB.x + rectB.w) - Math.max(rectA.x, rectB.x))
    const oy = Math.max(0, Math.min(rectA.y + rectA.h, rectB.y + rectB.h) - Math.max(rectA.y, rectB.y))
    if (ox > 0 && oy > 0) {
      const x = Math.max(rectA.x, rectB.x)
      const y = Math.max(rectA.y, rectB.y)
      ctx.fillRect(x, y, ox, oy)
      ctx.strokeRect(x, y, ox, oy)
    }
  } else if (testType.value === 'circle-circle') {
    ctx.beginPath()
    ctx.arc(circleA.x, circleA.y, circleA.r, 0, Math.PI * 2)
    ctx.arc(circleB.x, circleB.y, circleB.r, 0, Math.PI * 2)
    ctx.fill('evenodd')
  } else if (testType.value === 'rect-circle') {
    ctx.beginPath()
    ctx.rect(rectA.x, rectA.y, rectA.w, rectA.h)
    ctx.arc(circleA.x, circleA.y, circleA.r, 0, Math.PI * 2)
    ctx.fill('evenodd')
  } else if (testType.value === 'point-rect') {
    ctx.fillRect(point.x - 2, point.y - 2, 4, 4)
  } else if (testType.value === 'point-circle') {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#ececec'
  ctx.lineWidth = 1
  for (let x = 0; x <= canvasW; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvasH)
    ctx.stroke()
  }
  for (let y = 0; y <= canvasH; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvasW, y)
    ctx.stroke()
  }
}

function drawRect(ctx: CanvasRenderingContext2D, r: { x: number; y: number; w: number; h: number }, color: string, withHandle: boolean) {
  ctx.fillStyle = color + '22'
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.fillRect(r.x, r.y, r.w, r.h)
  ctx.strokeRect(r.x, r.y, r.w, r.h)
  if (withHandle) drawResizeHandle(ctx, r.x + r.w, r.y + r.h, color)
}

function drawCircle(ctx: CanvasRenderingContext2D, c: { x: number; y: number; r: number }, color: string, withHandle: boolean) {
  ctx.beginPath()
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
  ctx.fillStyle = color + '22'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(c.x, c.y, 2, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  if (withHandle) drawResizeHandle(ctx, c.x + c.r * Math.SQRT1_2, c.y + c.r * Math.SQRT1_2, color)
}

function drawPoint(ctx: CanvasRenderingContext2D, p: { x: number; y: number }, color: string) {
  ctx.beginPath()
  ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawSegment(ctx: CanvasRenderingContext2D, s: { x1: number; y1: number; x2: number; y2: number }, color: string) {
  ctx.beginPath()
  ctx.moveTo(s.x1, s.y1)
  ctx.lineTo(s.x2, s.y2)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(s.x1, s.y1, 5, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.arc(s.x2, s.y2, 5, 0, Math.PI * 2)
  ctx.fill()
}

function drawSegmentBand(ctx: CanvasRenderingContext2D, s: { x1: number; y1: number; x2: number; y2: number }, thresh: number) {
  const dx = s.x2 - s.x1
  const dy = s.y2 - s.y1
  const len = Math.hypot(dx, dy)
  if (len === 0) return
  const nx = -dy / len
  const ny = dx / len
  ctx.beginPath()
  ctx.moveTo(s.x1 + nx * thresh, s.y1 + ny * thresh)
  ctx.lineTo(s.x2 + nx * thresh, s.y2 + ny * thresh)
  ctx.lineTo(s.x2 - nx * thresh, s.y2 - ny * thresh)
  ctx.lineTo(s.x1 - nx * thresh, s.y1 - ny * thresh)
  ctx.closePath()
  ctx.fillStyle = 'rgba(229, 57, 53, 0.08)'
  ctx.fill()
}

function drawResizeHandle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()
}

// ---------- 拖拽交互 ----------
type DragTarget =
  | { kind: 'move'; key: 'rectA' | 'rectB' | 'circleA' | 'circleB' | 'point' }
  | { kind: 'resize-rect'; key: 'rectA' | 'rectB' }
  | { kind: 'resize-circle'; key: 'circleA' | 'circleB' }
  | { kind: 'seg-end'; key: 'segA'; end: 'p1' | 'p2' }

let dragging: DragTarget | null = null
let dragOffset = { x: 0, y: 0 }

function getCanvasPos(e: MouseEvent) {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) * canvas.width) / rect.width,
    y: ((e.clientY - rect.top) * canvas.height) / rect.height,
  }
}

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x1 - x2, y1 - y2)
}

function insideRect(mx: number, my: number, r: { x: number; y: number; w: number; h: number }) {
  return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h
}
function insideCircle(mx: number, my: number, c: { x: number; y: number; r: number }) {
  return dist(mx, my, c.x, c.y) <= c.r
}

function getObj(key: string): any {
  if (key === 'rectA') return rectA
  if (key === 'rectB') return rectB
  if (key === 'circleA') return circleA
  if (key === 'circleB') return circleB
  if (key === 'point') return point
  if (key === 'segA') return segA
  return null
}

function hitTest(mx: number, my: number): DragTarget | null {
  const t = testType.value
  // 优先检测尺寸控制点
  if (t === 'aabb') {
    if (dist(mx, my, rectA.x + rectA.w, rectA.y + rectA.h) < 9) return { kind: 'resize-rect', key: 'rectA' }
    if (dist(mx, my, rectB.x + rectB.w, rectB.y + rectB.h) < 9) return { kind: 'resize-rect', key: 'rectB' }
    if (insideRect(mx, my, rectA)) return { kind: 'move', key: 'rectA' }
    if (insideRect(mx, my, rectB)) return { kind: 'move', key: 'rectB' }
  } else if (t === 'circle-circle') {
    const ha = { x: circleA.x + circleA.r * Math.SQRT1_2, y: circleA.y + circleA.r * Math.SQRT1_2 }
    const hb = { x: circleB.x + circleB.r * Math.SQRT1_2, y: circleB.y + circleB.r * Math.SQRT1_2 }
    if (dist(mx, my, ha.x, ha.y) < 9) return { kind: 'resize-circle', key: 'circleA' }
    if (dist(mx, my, hb.x, hb.y) < 9) return { kind: 'resize-circle', key: 'circleB' }
    if (insideCircle(mx, my, circleA)) return { kind: 'move', key: 'circleA' }
    if (insideCircle(mx, my, circleB)) return { kind: 'move', key: 'circleB' }
  } else if (t === 'rect-circle') {
    if (dist(mx, my, rectA.x + rectA.w, rectA.y + rectA.h) < 9) return { kind: 'resize-rect', key: 'rectA' }
    const ha = { x: circleA.x + circleA.r * Math.SQRT1_2, y: circleA.y + circleA.r * Math.SQRT1_2 }
    if (dist(mx, my, ha.x, ha.y) < 9) return { kind: 'resize-circle', key: 'circleA' }
    if (insideRect(mx, my, rectA)) return { kind: 'move', key: 'rectA' }
    if (insideCircle(mx, my, circleA)) return { kind: 'move', key: 'circleA' }
  } else if (t === 'point-rect') {
    if (dist(mx, my, rectA.x + rectA.w, rectA.y + rectA.h) < 9) return { kind: 'resize-rect', key: 'rectA' }
    if (dist(mx, my, point.x, point.y) < 12) return { kind: 'move', key: 'point' }
    if (insideRect(mx, my, rectA)) return { kind: 'move', key: 'rectA' }
  } else if (t === 'point-circle') {
    const ha = { x: circleA.x + circleA.r * Math.SQRT1_2, y: circleA.y + circleA.r * Math.SQRT1_2 }
    if (dist(mx, my, ha.x, ha.y) < 9) return { kind: 'resize-circle', key: 'circleA' }
    if (dist(mx, my, point.x, point.y) < 12) return { kind: 'move', key: 'point' }
    if (insideCircle(mx, my, circleA)) return { kind: 'move', key: 'circleA' }
  } else if (t === 'point-segment') {
    if (dist(mx, my, segA.x1, segA.y1) < 10) return { kind: 'seg-end', key: 'segA', end: 'p1' }
    if (dist(mx, my, segA.x2, segA.y2) < 10) return { kind: 'seg-end', key: 'segA', end: 'p2' }
  }
  return null
}

function onMouseDown(e: MouseEvent) {
  const { x, y } = getCanvasPos(e)
  const hit = hitTest(x, y)
  if (!hit) return
  dragging = hit
  if (hit.kind === 'move') {
    const obj = getObj(hit.key) as { x: number; y: number }
    dragOffset = { x: x - obj.x, y: y - obj.y }
  } else if (hit.kind === 'resize-rect') {
    dragOffset = { x: 0, y: 0 }
  } else if (hit.kind === 'resize-circle') {
    dragOffset = { x: 0, y: 0 }
  }
}

function onMouseMove(e: MouseEvent) {
  if (!dragging) return
  const { x, y } = getCanvasPos(e)
  if (dragging.kind === 'move') {
    const obj = getObj(dragging.key) as { x: number; y: number }
    obj.x = Math.round(x - dragOffset.x)
    obj.y = Math.round(y - dragOffset.y)
  } else if (dragging.kind === 'resize-rect') {
    const r = getObj(dragging.key) as { x: number; y: number; w: number; h: number }
    r.w = Math.max(5, Math.round(x - r.x))
    r.h = Math.max(5, Math.round(y - r.y))
  } else if (dragging.kind === 'resize-circle') {
    const c = getObj(dragging.key) as { x: number; y: number; r: number }
    c.r = Math.max(5, Math.round(dist(x, y, c.x, c.y)))
  } else if (dragging.kind === 'seg-end') {
    const s = getObj(dragging.key) as { x1: number; y1: number; x2: number; y2: number }
    if (dragging.end === 'p1') { s.x1 = Math.round(x); s.y1 = Math.round(y) }
    else { s.x2 = Math.round(x); s.y2 = Math.round(y) }
  }
}

function onMouseUp() {
  dragging = null
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  draw()
})

onUnmounted(() => {
  const canvas = canvasRef.value
  if (canvas) canvas.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

watch([testType, rectA, rectB, circleA, circleB, point, segA, pointThresh], draw, { deep: true })

function reset() {
  rectA.x = 80; rectA.y = 80; rectA.w = 130; rectA.h = 90
  rectB.x = 210; rectB.y = 170; rectB.w = 150; rectB.h = 110
  circleA.x = 160; circleA.y = 160; circleA.r = 65
  circleB.x = 320; circleB.y = 230; circleB.r = 55
  point.x = 200; point.y = 180
  segA.x1 = 60; segA.y1 = 60; segA.x2 = 380; segA.y2 = 360
  pointThresh.value = 8
}
</script>

<style scoped>
.tool-container.collision-detector {
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

.mt-4 {
  margin-top: 16px;
}

.config-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: flex-end;
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

.action-bar {
  margin-left: auto;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.status .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status.hit {
  background: #ffebee;
  color: #c62828;
}
.status.hit .dot {
  background: #e53935;
  box-shadow: 0 0 8px #e53935;
}

.status.miss {
  background: #e8f5e9;
  color: #2e7d32;
}
.status.miss .dot {
  background: #43a047;
}

.main-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  align-items: start;
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

.shape-group {
  margin-bottom: 16px;
  padding: 12px;
  background: #f7f7f7;
  border-radius: 8px;
}

.dark .shape-group {
  background: #2a2a3a;
}

.shape-label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
}

.dark .shape-label {
  color: #bbb;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.field span {
  width: 60px;
  font-size: 12px;
  color: #777;
}

.dark .field span {
  color: #999;
}

.field .n-input-number {
  width: 160px;
}

.canvas-panel {
  display: flex;
  flex-direction: column;
}

.canvas {
  width: 100%;
  height: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.dark .canvas {
  background: #1a1a2e;
  border-color: #333;
}

.canvas-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  text-align: center;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.formula-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.formula-item {
  padding: 12px;
  background: #f7f7f7;
  border-radius: 8px;
}

.dark .formula-item {
  background: #2a2a3a;
}

.formula-title {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
}

.dark .formula-title {
  color: #bbb;
}

.formula-code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  color: #1976d2;
  white-space: pre-wrap;
  line-height: 1.6;
}

.dark .formula-code {
  color: #64b5f6;
}

@media (max-width: 860px) {
  .main-grid,
  .formula-grid {
    grid-template-columns: 1fr;
  }
  .action-bar {
    margin-left: 0;
  }
}
</style>
