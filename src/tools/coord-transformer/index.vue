<template>
  <div class="tool-container coord-transformer">
    <div class="card mb-4">
      <h3 class="section-title">坐标系转换</h3>
      <p class="hint">选择源坐标系与目标坐标系，输入对应数值后实时显示转换结果。</p>
    </div>

    <div class="card mb-4">
      <div class="config-row">
        <div class="config-item">
          <label>源坐标系</label>
          <n-select v-model:value="fromSystem" :options="systemOptions" style="width: 220px" />
        </div>
        <div class="swap-btn">
          <n-button circle size="small" @click="swapSystems" title="交换源与目标">
            <span class="swap-icon">⇄</span>
          </n-button>
        </div>
        <div class="config-item">
          <label>目标坐标系</label>
          <n-select v-model:value="toSystem" :options="systemOptions" style="width: 220px" />
        </div>
      </div>

      <div class="params-row" v-if="needsCamera">
        <div class="param-title">摄像机参数（屏幕 ↔ 世界）</div>
        <div class="params-grid">
          <div class="field"><span>偏移 X</span><n-input-number v-model:value="camera.x" :step="10" /></div>
          <div class="field"><span>偏移 Y</span><n-input-number v-model:value="camera.y" :step="10" /></div>
          <div class="field"><span>缩放</span><n-input-number v-model:value="camera.scale" :min="0.01" :step="0.1" /></div>
        </div>
      </div>

      <div class="params-row" v-if="needsTile">
        <div class="param-title">瓦片参数（瓦片 ↔ 像素）</div>
        <div class="params-grid">
          <div class="field"><span>瓦片宽</span><n-input-number v-model:value="tile.w" :min="1" :step="1" /></div>
          <div class="field"><span>瓦片高</span><n-input-number v-model:value="tile.h" :min="1" :step="1" /></div>
        </div>
      </div>

      <div class="params-row" v-if="needsIso">
        <div class="param-title">等距参数（等距 ↔ 屏幕）</div>
        <div class="params-grid">
          <div class="field"><span>瓦片宽</span><n-input-number v-model:value="tile.w" :min="1" :step="1" /></div>
          <div class="field"><span>瓦片高</span><n-input-number v-model:value="tile.h" :min="1" :step="1" /></div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="io-grid">
        <div class="io-box input-box">
          <div class="io-header">
            <span class="io-title">输入 · {{ systemLabel(fromSystem) }}</span>
            <n-button text size="small" @click="clearInput">清空</n-button>
          </div>
          <div class="fields">
            <div class="field" v-for="key in fromFields" :key="key">
              <span>{{ key }}</span>
              <n-input-number
                v-model:value="inputValues[key]"
                :step="0.5"
                placeholder="0"
                style="width: 100%"
              />
            </div>
          </div>
          <div class="readout">{{ fromReadout }}</div>
        </div>

        <div class="io-box output-box">
          <div class="io-header">
            <span class="io-title">输出 · {{ systemLabel(toSystem) }}</span>
            <n-button text size="small" @click="copyOutput">复制</n-button>
          </div>
          <div class="fields">
            <div class="field" v-for="key in toFields" :key="key">
              <span>{{ key }}</span>
              <div class="output-value">{{ fmt(outputValues[key] ?? 0) }}</div>
            </div>
          </div>
          <div class="readout output-readout">{{ toReadout }}</div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="section-title">双向转换结果</h3>
      <div class="result-grid">
        <div class="result-row" v-for="r in allResults" :key="r.system">
          <span class="result-label">{{ r.label }}</span>
          <span class="result-value">{{ r.text }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="section-title">转换公式说明</h3>
      <div class="formula-block">
        <div class="formula-item" v-for="f in formulas" :key="f.title">
          <div class="formula-title">{{ f.title }}</div>
          <pre class="formula-code">{{ f.code }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { NSelect, NInputNumber, NButton, useMessage } from 'naive-ui'

type SystemKey = 'screen' | 'world' | 'cartesian' | 'polar' | 'isometric' | 'tile'

const systemOptions = [
  { label: '屏幕坐标 (Screen)', value: 'screen' },
  { label: '世界坐标 (World)', value: 'world' },
  { label: '笛卡尔坐标 (Cartesian)', value: 'cartesian' },
  { label: '极坐标 (Polar)', value: 'polar' },
  { label: '等距坐标 (Isometric)', value: 'isometric' },
  { label: '瓦片坐标 (Tile)', value: 'tile' },
]

const systemLabels: Record<SystemKey, string> = {
  screen: '屏幕坐标 (Screen)',
  world: '世界坐标 (World)',
  cartesian: '笛卡尔坐标 (Cartesian)',
  polar: '极坐标 (Polar)',
  isometric: '等距坐标 (Isometric)',
  tile: '瓦片坐标 (Tile)',
}

function systemLabel(s: SystemKey) {
  return systemLabels[s]
}

const fromSystem = ref<SystemKey>('screen')
const toSystem = ref<SystemKey>('world')

const camera = reactive({ x: 0, y: 0, scale: 1 })
const tile = reactive({ w: 64, h: 64 })

const inputValues = reactive<Record<string, number>>({ x: 320, y: 240, r: 100, theta: 45, col: 5, row: 3 })

const fieldMap: Record<SystemKey, string[]> = {
  screen: ['x', 'y'],
  world: ['x', 'y'],
  cartesian: ['x', 'y'],
  polar: ['r', 'theta'],
  isometric: ['col', 'row'],
  tile: ['col', 'row'],
}

const fromFields = computed(() => fieldMap[fromSystem.value])
const toFields = computed(() => fieldMap[toSystem.value])

const needsCamera = computed(() =>
  (fromSystem.value === 'screen' && toSystem.value === 'world') ||
  (fromSystem.value === 'world' && toSystem.value === 'screen')
)
const needsTile = computed(() =>
  (fromSystem.value === 'tile' && toSystem.value === 'screen') ||
  (fromSystem.value === 'screen' && toSystem.value === 'tile')
)
const needsIso = computed(() =>
  (fromSystem.value === 'isometric' && toSystem.value === 'screen') ||
  (fromSystem.value === 'screen' && toSystem.value === 'isometric')
)

const message = useMessage()

function fmt(n: number): string {
  if (!isFinite(n)) return '—'
  return (Math.round(n * 1000) / 1000).toString()
}

// 笛卡尔 <-> 极
function cartesianToPolar(x: number, y: number) {
  return { r: Math.hypot(x, y), theta: (Math.atan2(y, x) * 180) / Math.PI }
}
function polarToCartesian(r: number, thetaDeg: number) {
  const rad = (thetaDeg * Math.PI) / 180
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) }
}

// 屏幕 <-> 世界（摄像机）
function screenToWorld(sx: number, sy: number) {
  return { x: (sx - camera.x) / camera.scale, y: (sy - camera.y) / camera.scale }
}
function worldToScreen(wx: number, wy: number) {
  return { x: wx * camera.scale + camera.x, y: wy * camera.scale + camera.y }
}

// 屏幕 <-> 等距（等距瓦片，2:1 投影）
function screenToIso(sx: number, sy: number) {
  const col = (sx / (tile.w / 2) + sy / (tile.h / 2)) / 2
  const row = (sy / (tile.h / 2) - sx / (tile.w / 2)) / 2
  return { col, row }
}
function isoToScreen(col: number, row: number) {
  const x = (col - row) * (tile.w / 2)
  const y = (col + row) * (tile.h / 2)
  return { x, y }
}

// 瓦片 <-> 屏幕/像素
function tileToPixel(col: number, row: number) {
  return { x: col * tile.w, y: row * tile.h }
}
function pixelToTile(px: number, py: number) {
  return { col: px / tile.w, row: py / tile.h }
}

// 统一中间表示：笛卡尔 (x, y)
function toCartesian(sys: SystemKey, v: Record<string, number>): { x: number; y: number } {
  switch (sys) {
    case 'screen':
      return { x: v.x, y: v.y }
    case 'world':
      return { x: v.x, y: v.y }
    case 'cartesian':
      return { x: v.x, y: v.y }
    case 'polar':
      return polarToCartesian(v.r, v.theta)
    case 'isometric':
      return isoToScreen(v.col, v.row)
    case 'tile':
      return tileToPixel(v.col, v.row)
  }
}

function fromCartesian(sys: SystemKey, c: { x: number; y: number }): Record<string, number> {
  switch (sys) {
    case 'screen':
    case 'world':
    case 'cartesian':
      return { x: c.x, y: c.y }
    case 'polar': {
      const p = cartesianToPolar(c.x, c.y)
      return { r: p.r, theta: p.theta }
    }
    case 'isometric': {
      const i = screenToIso(c.x, c.y)
      return { col: i.col, row: i.row }
    }
    case 'tile': {
      const t = pixelToTile(c.x, c.y)
      return { col: t.col, row: t.row }
    }
  }
}

// 应用屏幕 <-> 世界变换
function applyCrossTransform(c: { x: number; y: number }, from: SystemKey, to: SystemKey) {
  let { x, y } = c
  // 若源是屏幕，目标是世界，先转世界
  if (from === 'screen' && to === 'world') {
    const w = screenToWorld(x, y)
    return { x: w.x, y: w.y }
  }
  if (from === 'world' && to === 'screen') {
    const s = worldToScreen(x, y)
    return { x: s.x, y: s.y }
  }
  return { x, y }
}

const outputValues = computed<Record<string, number>>(() => {
  // 取出输入
  const inputCartesian = toCartesian(fromSystem.value, inputValues)
  // 处理屏幕/世界互转
  const transformed = applyCrossTransform(inputCartesian, fromSystem.value, toSystem.value)
  const out = fromCartesian(toSystem.value, transformed)
  return out
})

const fromReadout = computed(() => {
  const fields = fromFields.value
  return fields.map((k) => `${k} = ${fmt(inputValues[k] ?? 0)}`).join('  ')
})

const toReadout = computed(() => {
  const fields = toFields.value
  return fields.map((k) => `${k} = ${fmt(outputValues.value[k] ?? 0)}`).join('  ')
})

// 所有坐标系的统一表示（以输入为基准转出）
const allResults = computed(() => {
  const inputCartesian = toCartesian(fromSystem.value, inputValues)
  // 转为世界坐标基准（用于显示屏幕/世界差异）
  const world = fromSystem.value === 'screen' ? screenToWorld(inputCartesian.x, inputCartesian.y) : inputCartesian
  const screen = fromSystem.value === 'world' ? worldToScreen(inputCartesian.x, inputCartesian.y) : inputCartesian

  const polar = cartesianToPolar(world.x, world.y)
  const iso = screenToIso(screen.x, screen.y)
  const tileCoord = pixelToTile(screen.x, screen.y)

  return [
    { system: 'screen', label: '屏幕坐标', text: `x = ${fmt(screen.x)}, y = ${fmt(screen.y)}` },
    { system: 'world', label: '世界坐标', text: `x = ${fmt(world.x)}, y = ${fmt(world.y)}` },
    { system: 'cartesian', label: '笛卡尔坐标', text: `x = ${fmt(world.x)}, y = ${fmt(world.y)}` },
    { system: 'polar', label: '极坐标', text: `r = ${fmt(polar.r)}, θ = ${fmt(polar.theta)}°` },
    { system: 'isometric', label: '等距坐标', text: `col = ${fmt(iso.col)}, row = ${fmt(iso.row)}` },
    { system: 'tile', label: '瓦片坐标', text: `col = ${fmt(tileCoord.col)}, row = ${fmt(tileCoord.row)}` },
  ]
})

const formulas = [
  {
    title: '屏幕 ↔ 世界（含摄像机偏移与缩放）',
    code: '世界 = (屏幕 - 摄像机偏移) / 缩放\n屏幕 = 世界 × 缩放 + 摄像机偏移',
  },
  {
    title: '笛卡尔 ↔ 极坐标',
    code: 'r = √(x² + y²)\nθ = atan2(y, x)   (弧度，转角度 × 180/π)\nx = r·cos(θ),  y = r·sin(θ)',
  },
  {
    title: '等距坐标 ↔ 屏幕（2:1 等距投影）',
    code: 'screenX = (col - row) × (tileW / 2)\nscreenY = (col + row) × (tileH / 2)\ncol = (screenX/(tileW/2) + screenY/(tileH/2)) / 2\nrow = (screenY/(tileH/2) - screenX/(tileW/2)) / 2',
  },
  {
    title: '瓦片坐标 ↔ 像素坐标',
    code: 'pixelX = col × tileW\npixelY = row × tileH\ncol = pixelX / tileW\nrow = pixelY / tileH',
  },
]

function swapSystems() {
  const tmp = fromSystem.value
  fromSystem.value = toSystem.value
  toSystem.value = tmp
  // 同步输入值到目标系输出
  const out = { ...outputValues.value }
  for (const k of Object.keys(out)) {
    inputValues[k] = out[k]
  }
}

function clearInput() {
  for (const k of fromFields.value) {
    inputValues[k] = 0
  }
}

function copyOutput() {
  const text = toReadout.value
  navigator.clipboard.writeText(text)
  message.success('已复制：' + text)
}

// 切换坐标系时确保输入字段存在
watch([fromSystem], () => {
  for (const k of fromFields.value) {
    if (inputValues[k] === undefined) inputValues[k] = 0
  }
})
</script>

<style scoped>
.tool-container.coord-transformer {
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

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.dark .section-title {
  color: #eee;
}

.hint {
  font-size: 13px;
  color: #888;
  line-height: 1.6;
}

.dark .hint {
  color: #999;
}

.config-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
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

.swap-btn {
  margin-bottom: 4px;
}

.swap-icon {
  font-size: 16px;
  font-weight: 700;
  color: #1976d2;
}

.params-row {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed #e0e0e0;
}

.dark .params-row {
  border-top-color: #333;
}

.param-title {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin-bottom: 10px;
}

.dark .param-title {
  color: #bbb;
}

.params-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field span {
  width: 60px;
  font-size: 12px;
  color: #777;
  flex-shrink: 0;
}

.dark .field span {
  color: #999;
}

.field .n-input-number {
  width: 140px;
}

.io-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.io-box {
  padding: 14px;
  border-radius: 8px;
  background: #f7f7f7;
  border: 1px solid #eee;
}

.dark .io-box {
  background: #2a2a3a;
  border-color: #333;
}

.output-box {
  border-left: 4px solid #1976d2;
}

.dark .output-box {
  border-left-color: #64b5f6;
}

.input-box {
  border-left: 4px solid #43a047;
}

.dark .input-box {
  border-left-color: #81c784;
}

.io-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.io-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.dark .io-title {
  color: #eee;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fields .field span {
  width: 70px;
}

.output-value {
  flex: 1;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-weight: 600;
  color: #1976d2;
  font-size: 15px;
}

.dark .output-value {
  color: #64b5f6;
}

.readout {
  margin-top: 12px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  color: #888;
  word-break: break-all;
}

.dark .readout {
  color: #999;
}

.output-readout {
  color: #1976d2;
}

.dark .output-readout {
  color: #64b5f6;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
  font-size: 13px;
}

.dark .result-row {
  background: #252535;
}

.result-label {
  flex: 0 0 90px;
  color: #666;
  font-size: 12px;
}

.dark .result-label {
  color: #aaa;
}

.result-value {
  flex: 1;
  font-family: 'Fira Code', 'Consolas', monospace;
  color: #333;
  word-break: break-all;
}

.dark .result-value {
  color: #e0e0e0;
}

.formula-block {
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

@media (max-width: 760px) {
  .io-grid,
  .result-grid,
  .formula-block {
    grid-template-columns: 1fr;
  }
}
</style>
