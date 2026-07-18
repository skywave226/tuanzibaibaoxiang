<template>
  <div class="coord-converter">
    <n-tabs v-model:value="activeTab" type="line">
      <n-tab-pane name="systems" tab="坐标系互转">
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
              <n-button circle size="small" @click="swapSystems" title="交换源与目标">⇄</n-button>
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

          <div class="params-row" v-if="needsTile || needsIso">
            <div class="param-title">瓦片参数</div>
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
                  <n-input-number v-model:value="inputValues[key]" :step="0.5" placeholder="0" style="width: 100%" />
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
          <h3 class="section-title">全部坐标系对照</h3>
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
      </n-tab-pane>

      <n-tab-pane name="matrix" tab="变换矩阵">
        <div class="card mb-4">
          <h3 class="section-title">带旋转/缩放/偏移的坐标变换</h3>
          <p class="hint-text">
            公式：结果 = 原点偏移 + 旋转(角度) × 缩放 × 输入。
            正向：Local/World → Screen/Parent；逆向：Screen/Parent → Local/World。
          </p>
        </div>

        <div class="card mb-4">
          <div class="config-row">
            <div class="config-item">
              <label>维度</label>
              <n-radio-group v-model:value="dim" size="small">
                <n-radio-button :value="2">2D</n-radio-button>
                <n-radio-button :value="3">3D</n-radio-button>
              </n-radio-group>
            </div>
            <div class="config-item">
              <label>转换方向</label>
              <n-select v-model:value="direction" :options="directionOptions" style="width: 220px" />
            </div>
          </div>

          <div class="config-section">
            <div class="config-item">
              <label>原点偏移 (Origin)</label>
              <div class="vector-inputs">
                <n-input-number v-model:value="origin.x" :step="1"><template #prefix>X</template></n-input-number>
                <n-input-number v-model:value="origin.y" :step="1"><template #prefix>Y</template></n-input-number>
                <n-input-number v-if="dim === 3" v-model:value="origin.z" :step="1"><template #prefix>Z</template></n-input-number>
              </div>
            </div>
            <div class="config-item">
              <label>缩放比例 (Scale)</label>
              <div class="vector-inputs">
                <n-input-number v-model:value="scale.x" :step="0.1"><template #prefix>SX</template></n-input-number>
                <n-input-number v-model:value="scale.y" :step="0.1"><template #prefix>SY</template></n-input-number>
                <n-input-number v-if="dim === 3" v-model:value="scale.z" :step="0.1"><template #prefix>SZ</template></n-input-number>
              </div>
            </div>
            <div class="config-item">
              <label>旋转角度 (Rotation, °)</label>
              <div class="vector-inputs">
                <n-input-number v-if="dim === 2" v-model:value="rotation.z" :step="1"><template #prefix>θ</template></n-input-number>
                <template v-else>
                  <n-input-number v-model:value="rotation.x" :step="1"><template #prefix>RX</template></n-input-number>
                  <n-input-number v-model:value="rotation.y" :step="1"><template #prefix>RY</template></n-input-number>
                  <n-input-number v-model:value="rotation.z" :step="1"><template #prefix>RZ</template></n-input-number>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="io-grid">
            <div class="io-box">
              <div class="io-header">
                <span class="io-title">输入坐标 ({{ inputLabel }})</span>
                <n-button size="tiny" quaternary @click="swapDirection">⇄ 反向</n-button>
              </div>
              <div class="vector-inputs">
                <n-input-number v-model:value="matrixInput.x" :step="1"><template #prefix>X</template></n-input-number>
                <n-input-number v-model:value="matrixInput.y" :step="1"><template #prefix>Y</template></n-input-number>
                <n-input-number v-if="dim === 3" v-model:value="matrixInput.z" :step="1"><template #prefix>Z</template></n-input-number>
              </div>
            </div>

            <div class="io-box output-box">
              <div class="io-title">输出坐标 ({{ outputLabel }})</div>
              <div class="vector-inputs">
                <n-input :value="formatNum(matrixOutput.x)" readonly><template #prefix>X</template></n-input>
                <n-input :value="formatNum(matrixOutput.y)" readonly><template #prefix>Y</template></n-input>
                <n-input v-if="dim === 3" :value="formatNum(matrixOutput.z)" readonly><template #prefix>Z</template></n-input>
              </div>
              <n-button size="small" quaternary @click="copyMatrixOutput" class="copy-btn">复制结果</n-button>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="section-title">说明</h3>
          <ul class="help-list">
            <li>正向变换：输出 = Origin + R(θ) · Scale · 输入</li>
            <li>逆向变换：输入 = Scale⁻¹ · R(-θ) · (输出 - Origin)</li>
            <li>3D 旋转顺序为 Rz · Ry · Rx（先绕 X 轴）</li>
            <li>典型用途：相机/父节点变换、UI 锚点对齐、瓦片地图坐标换算</li>
          </ul>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  NTabs,
  NTabPane,
  NSelect,
  NInputNumber,
  NInput,
  NButton,
  NRadioGroup,
  NRadioButton,
  useMessage,
} from 'naive-ui'

const message = useMessage()
const activeTab = ref('systems')

// ===== 坐标系互转 =====
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

function fmt(n: number): string {
  if (!isFinite(n)) return '—'
  return (Math.round(n * 1000) / 1000).toString()
}

function cartesianToPolar(x: number, y: number) {
  return { r: Math.hypot(x, y), theta: (Math.atan2(y, x) * 180) / Math.PI }
}
function polarToCartesian(r: number, thetaDeg: number) {
  const rad = (thetaDeg * Math.PI) / 180
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) }
}
function screenToWorld(sx: number, sy: number) {
  return { x: (sx - camera.x) / camera.scale, y: (sy - camera.y) / camera.scale }
}
function worldToScreen(wx: number, wy: number) {
  return { x: wx * camera.scale + camera.x, y: wy * camera.scale + camera.y }
}
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
function tileToPixel(col: number, row: number) {
  return { x: col * tile.w, y: row * tile.h }
}
function pixelToTile(px: number, py: number) {
  return { col: px / tile.w, row: py / tile.h }
}

function toCartesian(sys: SystemKey, v: Record<string, number>): { x: number; y: number } {
  switch (sys) {
    case 'screen':
    case 'world':
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

function applyCrossTransform(c: { x: number; y: number }, from: SystemKey, to: SystemKey) {
  let { x, y } = c
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
  const inputCartesian = toCartesian(fromSystem.value, inputValues)
  const transformed = applyCrossTransform(inputCartesian, fromSystem.value, toSystem.value)
  return fromCartesian(toSystem.value, transformed)
})

const fromReadout = computed(() => {
  return fromFields.value.map((k) => `${k} = ${fmt(inputValues[k] ?? 0)}`).join('  ')
})

const toReadout = computed(() => {
  return toFields.value.map((k) => `${k} = ${fmt(outputValues.value[k] ?? 0)}`).join('  ')
})

const allResults = computed(() => {
  const inputCartesian = toCartesian(fromSystem.value, inputValues)
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

watch([fromSystem], () => {
  for (const k of fromFields.value) {
    if (inputValues[k] === undefined) inputValues[k] = 0
  }
})

// ===== 变换矩阵 =====
type Dir = 'screen-to-world' | 'world-to-screen' | 'local-to-world' | 'world-to-local'

const dim = ref<2 | 3>(2)
const direction = ref<Dir>('world-to-screen')
const directionOptions = [
  { label: '世界 → 屏幕 (World → Screen)', value: 'world-to-screen' },
  { label: '屏幕 → 世界 (Screen → World)', value: 'screen-to-world' },
  { label: '局部 → 世界 (Local → World)', value: 'local-to-world' },
  { label: '世界 → 局部 (World → Local)', value: 'world-to-local' },
]

const origin = reactive({ x: 100, y: 100, z: 0 })
const scale = reactive({ x: 1, y: 1, z: 1 })
const rotation = reactive({ x: 0, y: 0, z: 0 })
const matrixInput = reactive({ x: 50, y: 50, z: 0 })

function forward2D(p: { x: number; y: number }) {
  const theta = (rotation.z * Math.PI) / 180
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const sx = p.x * scale.x
  const sy = p.y * scale.y
  return { x: origin.x + sx * cosT - sy * sinT, y: origin.y + sx * sinT + sy * cosT }
}

function inverse2D(p: { x: number; y: number }) {
  const theta = (rotation.z * Math.PI) / 180
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const dx = p.x - origin.x
  const dy = p.y - origin.y
  return {
    x: (dx * cosT + dy * sinT) / (scale.x || 1e-9),
    y: (-dx * sinT + dy * cosT) / (scale.y || 1e-9),
  }
}

function rotate3D(v: { x: number; y: number; z: number }) {
  const ax = (rotation.x * Math.PI) / 180
  const ay = (rotation.y * Math.PI) / 180
  const az = (rotation.z * Math.PI) / 180
  const cx = Math.cos(ax), sx = Math.sin(ax)
  const cy = Math.cos(ay), sy = Math.sin(ay)
  const cz = Math.cos(az), sz = Math.sin(az)
  let y1 = v.y * cx - v.z * sx
  let z1 = v.y * sx + v.z * cx
  let x1 = v.x
  let x2 = x1 * cy + z1 * sy
  let z2 = -x1 * sy + z1 * cy
  let y2 = y1
  let x3 = x2 * cz - y2 * sz
  let y3 = x2 * sz + y2 * cz
  let z3 = z2
  return { x: x3, y: y3, z: z3 }
}

function rotateInverse3D(v: { x: number; y: number; z: number }) {
  const ax = (rotation.x * Math.PI) / 180
  const ay = (rotation.y * Math.PI) / 180
  const az = (rotation.z * Math.PI) / 180
  const cx = Math.cos(ax), sx = Math.sin(ax)
  const cy = Math.cos(ay), sy = Math.sin(ay)
  const cz = Math.cos(az), sz = Math.sin(az)
  let x1 = v.x * cz + v.y * sz
  let y1 = -v.x * sz + v.y * cz
  let z1 = v.z
  let x2 = x1 * cy - z1 * sy
  let z2 = x1 * sy + z1 * cy
  let y2 = y1
  let y3 = y2 * cx + z2 * sx
  let z3 = -y2 * sx + z2 * cx
  let x3 = x2
  return { x: x3, y: y3, z: z3 }
}

function forward3D(p: { x: number; y: number; z: number }) {
  const scaled = { x: p.x * scale.x, y: p.y * scale.y, z: p.z * scale.z }
  const r = rotate3D(scaled)
  return { x: origin.x + r.x, y: origin.y + r.y, z: origin.z + r.z }
}

function inverse3D(p: { x: number; y: number; z: number }) {
  const d = { x: p.x - origin.x, y: p.y - origin.y, z: p.z - origin.z }
  const r = rotateInverse3D(d)
  return {
    x: r.x / (scale.x || 1e-9),
    y: r.y / (scale.y || 1e-9),
    z: r.z / (scale.z || 1e-9),
  }
}

const isForward = computed(() => direction.value === 'world-to-screen' || direction.value === 'local-to-world')

const inputLabel = computed(() => {
  return direction.value === 'screen-to-world'
    ? 'Screen'
    : direction.value === 'world-to-screen'
    ? 'World'
    : direction.value === 'local-to-world'
    ? 'Local'
    : 'World'
})

const outputLabel = computed(() => {
  return direction.value === 'screen-to-world'
    ? 'World'
    : direction.value === 'world-to-screen'
    ? 'Screen'
    : direction.value === 'local-to-world'
    ? 'World'
    : 'Local'
})

const matrixOutput = computed(() => {
  const p = { x: matrixInput.x, y: matrixInput.y, z: matrixInput.z }
  if (dim.value === 2) {
    const r = isForward.value ? forward2D({ x: p.x, y: p.y }) : inverse2D({ x: p.x, y: p.y })
    return { x: r.x, y: r.y, z: 0 }
  }
  return isForward.value ? forward3D(p) : inverse3D(p)
})

function formatNum(n: number): string {
  if (!isFinite(n)) return '—'
  return Math.round(n * 1000) / 1000 + ''
}

function swapDirection() {
  const opposite: Record<Dir, Dir> = {
    'world-to-screen': 'screen-to-world',
    'screen-to-world': 'world-to-screen',
    'local-to-world': 'world-to-local',
    'world-to-local': 'local-to-world',
  }
  direction.value = opposite[direction.value]
}

function copyMatrixOutput() {
  const text = dim.value === 2
    ? `(${formatNum(matrixOutput.value.x)}, ${formatNum(matrixOutput.value.y)})`
    : `(${formatNum(matrixOutput.value.x)}, ${formatNum(matrixOutput.value.y)}, ${formatNum(matrixOutput.value.z)})`
  navigator.clipboard.writeText(text)
  message.success('已复制：' + text)
}
</script>

<style scoped>
.coord-converter {
  max-width: 1000px;
  margin: 0 auto;
}
.card {
  background: var(--n-card-color);
  border: 1px solid var(--n-border-color);
  border-radius: 10px;
  padding: 18px 20px;
  margin-bottom: 16px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
}
.hint, .hint-text {
  font-size: 13px;
  color: #888;
  line-height: 1.6;
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
}
.config-section {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.swap-btn {
  margin-bottom: 4px;
}
.params-row {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed var(--n-border-color);
}
.param-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
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
  flex-shrink: 0;
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
.input-box {
  border-left: 4px solid #43a047;
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
}
.vector-inputs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.vector-inputs .n-input-number,
.vector-inputs .n-input {
  width: 130px;
}
.output-value {
  flex: 1;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-weight: 600;
  color: #1976d2;
  font-size: 15px;
}
.readout {
  margin-top: 12px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  color: #888;
  word-break: break-all;
}
.output-readout {
  color: #1976d2;
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
  font-size: 12px;
}
.result-value {
  flex: 1;
  font-family: 'Fira Code', 'Consolas', monospace;
  word-break: break-all;
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
  margin-bottom: 8px;
}
.formula-code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  line-height: 1.6;
}
.help-list {
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.8;
}
.copy-btn {
  align-self: flex-start;
  margin-top: 8px;
}
@media (max-width: 760px) {
  .io-grid,
  .result-grid,
  .formula-block {
    grid-template-columns: 1fr;
  }
}
</style>
