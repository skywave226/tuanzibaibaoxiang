<template>
  <div class="tool-container vector-calculator">
    <div class="card mb-4">
      <div class="config-row">
        <div class="config-item">
          <label>向量维度</label>
          <n-radio-group v-model:value="dim" size="small">
            <n-radio-button :value="2">2D</n-radio-button>
            <n-radio-button :value="3">3D</n-radio-button>
          </n-radio-group>
        </div>
        <div class="config-item">
          <label>显示精度</label>
          <n-input-number v-model:value="precision" :min="0" :max="6" size="small" style="width: 100px" />
        </div>
        <div class="config-item">
          <label>Lerp 插值 t</label>
          <n-slider v-model:value="lerpT" :min="0" :max="1" :step="0.01" style="width: 180px" />
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="section-title">输入向量</h3>
      <div class="vectors-grid">
        <div class="vector-box box-a">
          <div class="vector-name">向量 A</div>
          <div class="components">
            <n-input-number v-model:value="A.x" :step="0.5">
              <template #prefix>x</template>
            </n-input-number>
            <n-input-number v-model:value="A.y" :step="0.5">
              <template #prefix>y</template>
            </n-input-number>
            <n-input-number v-if="dim === 3" v-model:value="A.z" :step="0.5">
              <template #prefix>z</template>
            </n-input-number>
          </div>
          <div class="mag">|A| = {{ fmt(magA) }}</div>
        </div>

        <div class="vector-box box-b">
          <div class="vector-name">向量 B</div>
          <div class="components">
            <n-input-number v-model:value="B.x" :step="0.5">
              <template #prefix>x</template>
            </n-input-number>
            <n-input-number v-model:value="B.y" :step="0.5">
              <template #prefix>y</template>
            </n-input-number>
            <n-input-number v-if="dim === 3" v-model:value="B.z" :step="0.5">
              <template #prefix>z</template>
            </n-input-number>
          </div>
          <div class="mag">|B| = {{ fmt(magB) }}</div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="section-title">运算结果</h3>
      <div class="results">
        <div class="result-row">
          <span class="result-label">A + B</span>
          <span class="result-value">{{ vecStr(addAB) }}</span>
          <n-button text size="small" @click="copy(vecStr(addAB))">复制</n-button>
        </div>
        <div class="result-row">
          <span class="result-label">A − B</span>
          <span class="result-value">{{ vecStr(subAB) }}</span>
          <n-button text size="small" @click="copy(vecStr(subAB))">复制</n-button>
        </div>
        <div class="result-row">
          <span class="result-label">A · B （点乘）</span>
          <span class="result-value">{{ fmt(dot) }}</span>
        </div>
        <div class="result-row" v-if="dim === 3">
          <span class="result-label">A × B （叉乘）</span>
          <span class="result-value">{{ vecStr(cross) }}</span>
          <n-button text size="small" @click="copy(vecStr(cross))">复制</n-button>
        </div>
        <div class="result-row" v-else>
          <span class="result-label">A × B （叉乘标量, 2D）</span>
          <span class="result-value">{{ fmt(cross2d) }}</span>
        </div>
        <div class="result-row">
          <span class="result-label">距离 |A − B|</span>
          <span class="result-value">{{ fmt(distance) }}</span>
        </div>
        <div class="result-row">
          <span class="result-label">夹角 A↔B</span>
          <span class="result-value">{{ fmt(angleDeg) }}° ({{ fmt(angleRad) }} rad)</span>
        </div>
        <div class="result-row">
          <span class="result-label">归一化 A</span>
          <span class="result-value">{{ vecStr(normalA) }}</span>
          <n-button text size="small" @click="copy(vecStr(normalA))">复制</n-button>
        </div>
        <div class="result-row">
          <span class="result-label">归一化 B</span>
          <span class="result-value">{{ vecStr(normalB) }}</span>
          <n-button text size="small" @click="copy(vecStr(normalB))">复制</n-button>
        </div>
        <div class="result-row">
          <span class="result-label">投影 A onto B</span>
          <span class="result-value">{{ fmt(projection) }}</span>
        </div>
        <div class="result-row highlight-row">
          <span class="result-label">Lerp(A, B, {{ fmt(lerpT) }})</span>
          <span class="result-value highlight">{{ vecStr(lerpResult) }}</span>
          <n-button text size="small" @click="copy(vecStr(lerpResult))">复制</n-button>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="header-row">
        <h3 class="section-title">向量可视化（2D 投影）</h3>
        <n-button size="small" @click="resetView">重置示例</n-button>
      </div>
      <canvas ref="canvasRef" :width="canvasW" :height="canvasH" class="canvas"></canvas>
      <div class="legend">
        <span class="legend-item"><i class="dot a"></i>向量 A</span>
        <span class="legend-item"><i class="dot b"></i>向量 B</span>
        <span class="legend-item"><i class="dot add"></i>A + B</span>
        <span class="legend-item"><i class="dot sub"></i>A − B</span>
        <span class="legend-item"><i class="dot lerp"></i>Lerp(A,B,t)</span>
      </div>
    </div>

    <div class="card">
      <h3 class="section-title">多向量求和</h3>
      <div class="header-row">
        <span class="hint">添加更多向量参与累加运算</span>
        <n-button size="small" @click="addVector">添加向量</n-button>
      </div>
      <div v-if="extraVectors.length === 0" class="empty-hint">点击"添加向量"以加入更多向量参与累加。</div>
      <div v-for="(v, i) in extraVectors" :key="i" class="extra-row">
        <span class="extra-idx">V{{ i + 3 }}</span>
        <n-input-number v-model:value="v.x" :step="0.5" size="small">
          <template #prefix>x</template>
        </n-input-number>
        <n-input-number v-model:value="v.y" :step="0.5" size="small">
          <template #prefix>y</template>
        </n-input-number>
        <n-input-number v-if="dim === 3" v-model:value="v.z" :step="0.5" size="small">
          <template #prefix>z</template>
        </n-input-number>
        <n-button size="small" quaternary type="error" @click="removeVector(i)">删除</n-button>
      </div>
      <div class="result-row" v-if="extraVectors.length > 0">
        <span class="result-label">Σ(A + B + V3 + ...)</span>
        <span class="result-value highlight">{{ vecStr(sumAll) }}</span>
        <n-button text size="small" @click="copy(vecStr(sumAll))">复制</n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { NRadioGroup, NRadioButton, NInputNumber, NButton, NSlider, useMessage } from 'naive-ui'

interface Vec3 { x: number; y: number; z: number }

const message = useMessage()

const dim = ref<2 | 3>(2)
const precision = ref(3)
const lerpT = ref(0.5)

const A = reactive<Vec3>({ x: 3, y: 4, z: 0 })
const B = reactive<Vec3>({ x: 1, y: 2, z: 0 })
const extraVectors = ref<Vec3[]>([])

function fmt(n: number): string {
  if (!isFinite(n)) return '—'
  const p = Math.pow(10, precision.value)
  return (Math.round(n * p) / p).toString()
}

function vecStr(v: Vec3): string {
  if (dim.value === 2) return `(${fmt(v.x)}, ${fmt(v.y)})`
  return `(${fmt(v.x)}, ${fmt(v.y)}, ${fmt(v.z)})`
}

function mag(v: Vec3): number {
  if (dim.value === 2) return Math.hypot(v.x, v.y)
  return Math.hypot(v.x, v.y, v.z)
}

const magA = computed(() => mag(A))
const magB = computed(() => mag(B))

const addAB = computed<Vec3>(() => ({ x: A.x + B.x, y: A.y + B.y, z: A.z + B.z }))
const subAB = computed<Vec3>(() => ({ x: A.x - B.x, y: A.y - B.y, z: A.z - B.z }))

const dot = computed(() => {
  if (dim.value === 2) return A.x * B.x + A.y * B.y
  return A.x * B.x + A.y * B.y + A.z * B.z
})

const cross = computed<Vec3>(() => ({
  x: A.y * B.z - A.z * B.y,
  y: A.z * B.x - A.x * B.z,
  z: A.x * B.y - A.y * B.x,
}))

const cross2d = computed(() => A.x * B.y - A.y * B.x)

const distance = computed(() => mag(subAB.value))

const angleRad = computed(() => {
  const denom = magA.value * magB.value
  if (denom === 0) return NaN
  const cos = Math.max(-1, Math.min(1, dot.value / denom))
  return Math.acos(cos)
})

const angleDeg = computed(() => (angleRad.value * 180) / Math.PI)

const normalA = computed<Vec3>(() => {
  const m = magA.value
  if (m === 0) return { x: 0, y: 0, z: 0 }
  return { x: A.x / m, y: A.y / m, z: A.z / m }
})

const normalB = computed<Vec3>(() => {
  const m = magB.value
  if (m === 0) return { x: 0, y: 0, z: 0 }
  return { x: B.x / m, y: B.y / m, z: B.z / m }
})

const projection = computed(() => {
  const mb = magB.value
  if (mb === 0) return 0
  return dot.value / mb
})

// 线性插值 Lerp(A, B, t) = A + (B - A) * t
const lerpResult = computed<Vec3>(() => ({
  x: A.x + (B.x - A.x) * lerpT.value,
  y: A.y + (B.y - A.y) * lerpT.value,
  z: A.z + (B.z - A.z) * lerpT.value,
}))

const sumAll = computed<Vec3>(() => {
  const sum = { x: A.x + B.x, y: A.y + B.y, z: A.z + B.z }
  for (const v of extraVectors.value) {
    sum.x += v.x
    sum.y += v.y
    sum.z += v.z
  }
  return sum
})

function addVector() {
  extraVectors.value.push({ x: 0, y: 0, z: 0 })
}

function removeVector(idx: number) {
  extraVectors.value.splice(idx, 1)
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
  message.success('已复制：' + text)
}

// ---------- Canvas 可视化 ----------
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasW = 560
const canvasH = 380

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvasW, canvasH)
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, canvasW, canvasH)

  const cx = canvasW / 2
  const cy = canvasH / 2
  const scale = 30 // 1 单位 = 30 像素

  drawGrid(ctx, cx, cy, scale)
  drawAxes(ctx, cx, cy, scale)

  // 向量（用 2D 分量投影）
  const a2 = { x: A.x, y: A.y }
  const b2 = { x: B.x, y: B.y }
  const add2 = { x: addAB.value.x, y: addAB.value.y }
  const sub2 = { x: subAB.value.x, y: subAB.value.y }
  const lerp2 = { x: lerpResult.value.x, y: lerpResult.value.y }

  // 注意：Canvas Y 向下，数学 Y 向上，所以绘制时 Y 取反
  const toScreen = (v: { x: number; y: number }) => ({ x: cx + v.x * scale, y: cy - v.y * scale })

  // 先画虚线辅助
  // 平行四边形辅助（A+B）
  ctx.save()
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = '#bbb'
  ctx.lineWidth = 1
  line(ctx, toScreen(a2), toScreen(add2))
  line(ctx, toScreen(b2), toScreen(add2))
  // Lerp 路径
  ctx.strokeStyle = '#9c27b0'
  line(ctx, toScreen(a2), toScreen(b2))
  ctx.restore()

  // 向量箭头
  drawArrow(ctx, { x: cx, y: cy }, toScreen(a2), '#1976d2', 'A')
  drawArrow(ctx, { x: cx, y: cy }, toScreen(b2), '#43a047', 'B')
  drawArrow(ctx, { x: cx, y: cy }, toScreen(add2), '#fb8c00', 'A+B')
  drawArrow(ctx, toScreen(a2), toScreen(sub2), '#00897b', 'A-B')
  // Lerp 点
  const lp = toScreen(lerp2)
  ctx.beginPath()
  ctx.arc(lp.x, lp.y, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#9c27b0'
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#9c27b0'
  ctx.font = '12px sans-serif'
  ctx.fillText(`Lerp(t=${fmt(lerpT.value)})`, lp.x + 8, lp.y - 8)
}

function line(ctx: CanvasRenderingContext2D, p1: { x: number; y: number }, p2: { x: number; y: number }) {
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)
  ctx.stroke()
}

function drawArrow(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, color: string, label: string) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  if (len < 1) return
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  // 箭头头部
  const angle = Math.atan2(dy, dx)
  const head = 10
  ctx.beginPath()
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()

  ctx.font = '12px sans-serif'
  ctx.fillText(label, to.x + 6, to.y - 6)
}

function drawGrid(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  ctx.strokeStyle = '#eee'
  ctx.lineWidth = 1
  for (let x = cx % scale; x < canvasW; x += scale) {
    line(ctx, { x, y: 0 }, { x, y: canvasH })
  }
  for (let y = cy % scale; y < canvasH; y += scale) {
    line(ctx, { x: 0, y }, { x: canvasW, y })
  }
}

function drawAxes(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  ctx.strokeStyle = '#bbb'
  ctx.lineWidth = 1.5
  line(ctx, { x: 0, y: cy }, { x: canvasW, y: cy })
  line(ctx, { x: cx, y: 0 }, { x: cx, y: canvasH })
  ctx.fillStyle = '#888'
  ctx.font = '11px sans-serif'
  ctx.fillText('0', cx + 4, cy + 12)
  ctx.fillText('x', canvasW - 12, cy - 6)
  ctx.fillText('y', cx + 6, 12)
  // 刻度
  ctx.fillStyle = '#aaa'
  for (let i = -8; i <= 8; i++) {
    if (i === 0) continue
    ctx.fillText(String(i), cx + i * scale - 4, cy + 14)
    ctx.fillText(String(i), cx + 6, cy - i * scale + 4)
  }
}

onMounted(() => draw())
onUnmounted(() => {})

watch([dim, precision, lerpT, A, B, extraVectors], draw, { deep: true })

function resetView() {
  A.x = 3; A.y = 4; A.z = 0
  B.x = 1; B.y = 2; B.z = 0
  lerpT.value = 0.5
  extraVectors.value = []
}
</script>

<style scoped>
.tool-container.vector-calculator {
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

.config-row {
  display: flex;
  gap: 32px;
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

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.dark .section-title {
  color: #eee;
}

.vectors-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.vector-box {
  padding: 16px;
  background: #f7f7f7;
  border-radius: 10px;
  border-left: 4px solid #1976d2;
}

.dark .vector-box {
  background: #2a2a3a;
  border-left-color: #64b5f6;
}

.vector-box.box-b {
  border-left-color: #43a047;
}

.dark .vector-box.box-b {
  border-left-color: #81c784;
}

.vector-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.dark .vector-name {
  color: #eee;
}

.components {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.components .n-input-number {
  width: 130px;
}

.mag {
  font-size: 13px;
  color: #666;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.dark .mag {
  color: #aaa;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
  font-size: 14px;
}

.dark .result-row {
  background: #252535;
}

.highlight-row {
  background: #fff3e0 !important;
}

.dark .highlight-row {
  background: #3a2a1a !important;
}

.result-label {
  flex: 0 0 200px;
  color: #666;
  font-size: 13px;
}

.dark .result-label {
  color: #aaa;
}

.result-value {
  flex: 1;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-weight: 600;
  color: #1976d2;
}

.dark .result-value {
  color: #64b5f6;
}

.result-value.highlight {
  color: #e53935;
}

.dark .result-value.highlight {
  color: #ef5350;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.hint {
  font-size: 13px;
  color: #888;
}

.dark .hint {
  color: #999;
}

.canvas {
  width: 100%;
  height: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.dark .canvas {
  background: #1a1a2e;
  border-color: #333;
}

.legend {
  display: flex;
  gap: 18px;
  margin-top: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #666;
}

.dark .legend {
  color: #aaa;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-item .dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.legend-item .dot.a { background: #1976d2; }
.legend-item .dot.b { background: #43a047; }
.legend-item .dot.add { background: #fb8c00; }
.legend-item .dot.sub { background: #00897b; }
.legend-item .dot.lerp { background: #9c27b0; }

.extra-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.extra-row .n-input-number {
  width: 120px;
}

.extra-idx {
  width: 36px;
  font-weight: 600;
  color: #666;
  font-size: 13px;
}

.dark .extra-idx {
  color: #aaa;
}

.empty-hint {
  font-size: 13px;
  color: #999;
  padding: 12px;
}

@media (max-width: 700px) {
  .vectors-grid {
    grid-template-columns: 1fr;
  }
  .result-label {
    flex: 0 0 140px;
  }
}
</style>
