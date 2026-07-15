<template>
  <div class="coord-converter">
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
          <n-select
            v-model:value="direction"
            :options="directionOptions"
            style="width: 220px"
          />
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="section-title">变换参数</h3>
      <p class="hint-text">
        公式：结果 = 原点偏移 + 旋转(角度) × 缩放 × 输入。
        "屏幕↔世界" 与 "局部↔世界" 使用同一变换矩阵，仅方向相反。
      </p>

      <div class="config-section">
        <div class="config-item">
          <label>原点偏移 (Origin)</label>
          <div class="vector-inputs">
            <n-input-number v-model:value="origin.x" :step="1" placeholder="X">
              <template #prefix>X</template>
            </n-input-number>
            <n-input-number v-model:value="origin.y" :step="1" placeholder="Y">
              <template #prefix>Y</template>
            </n-input-number>
            <n-input-number v-if="dim === 3" v-model:value="origin.z" :step="1" placeholder="Z">
              <template #prefix>Z</template>
            </n-input-number>
          </div>
        </div>

        <div class="config-item">
          <label>缩放比例 (Scale)</label>
          <div class="vector-inputs">
            <n-input-number v-model:value="scale.x" :step="0.1" placeholder="SX">
              <template #prefix>SX</template>
            </n-input-number>
            <n-input-number v-model:value="scale.y" :step="0.1" placeholder="SY">
              <template #prefix>SY</template>
            </n-input-number>
            <n-input-number v-if="dim === 3" v-model:value="scale.z" :step="0.1" placeholder="SZ">
              <template #prefix>SZ</template>
            </n-input-number>
          </div>
        </div>

        <div class="config-item">
          <label>旋转角度 (Rotation, °)</label>
          <div class="vector-inputs">
            <template v-if="dim === 2">
              <n-input-number v-model:value="rotation.z" :step="1" placeholder="θ">
                <template #prefix>θ</template>
              </n-input-number>
            </template>
            <template v-else>
              <n-input-number v-model:value="rotation.x" :step="1" placeholder="RX">
                <template #prefix>RX</template>
              </n-input-number>
              <n-input-number v-model:value="rotation.y" :step="1" placeholder="RY">
                <template #prefix>RY</template>
              </n-input-number>
              <n-input-number v-model:value="rotation.z" :step="1" placeholder="RZ">
                <template #prefix>RZ</template>
              </n-input-number>
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
            <n-button size="tiny" quaternary @click="swap">⇄ 反向</n-button>
          </div>
          <div class="vector-inputs">
            <n-input-number v-model:value="input.x" :step="1" placeholder="X">
              <template #prefix>X</template>
            </n-input-number>
            <n-input-number v-model:value="input.y" :step="1" placeholder="Y">
              <template #prefix>Y</template>
            </n-input-number>
            <n-input-number v-if="dim === 3" v-model:value="input.z" :step="1" placeholder="Z">
              <template #prefix>Z</template>
            </n-input-number>
          </div>
        </div>

        <div class="io-arrow">→</div>

        <div class="io-box">
          <div class="io-title">输出坐标 ({{ outputLabel }})</div>
          <div class="vector-inputs">
            <n-input :value="formatNum(output.x)" readonly>
              <template #prefix>X</template>
            </n-input>
            <n-input :value="formatNum(output.y)" readonly>
              <template #prefix>Y</template>
            </n-input>
            <n-input v-if="dim === 3" :value="formatNum(output.z)" readonly>
              <template #prefix>Z</template>
            </n-input>
          </div>
          <n-button size="small" quaternary @click="copyOutput" class="copy-btn">复制结果</n-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { NRadioGroup, NRadioButton, NSelect, NInputNumber, NInput, NButton, useMessage } from 'naive-ui'

type Dir = 'screen-to-world' | 'world-to-screen' | 'local-to-world' | 'world-to-local'

const message = useMessage()

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
const input = reactive({ x: 50, y: 50, z: 0 })

// 正向变换：local/world → screen/parent
function forward2D(p: { x: number; y: number }) {
  const theta = (rotation.z * Math.PI) / 180
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const sx = p.x * scale.x
  const sy = p.y * scale.y
  return {
    x: origin.x + sx * cosT - sy * sinT,
    y: origin.y + sx * sinT + sy * cosT,
  }
}

// 逆向变换：screen/parent → local/world
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

// 3D 旋转矩阵 R = Rz * Ry * Rx，应用到向量 v
function rotate3D(v: { x: number; y: number; z: number }) {
  const ax = (rotation.x * Math.PI) / 180
  const ay = (rotation.y * Math.PI) / 180
  const az = (rotation.z * Math.PI) / 180
  const cx = Math.cos(ax), sx = Math.sin(ax)
  const cy = Math.cos(ay), sy = Math.sin(ay)
  const cz = Math.cos(az), sz = Math.sin(az)

  // Rx
  let y1 = v.y * cx - v.z * sx
  let z1 = v.y * sx + v.z * cx
  let x1 = v.x
  // Ry
  let x2 = x1 * cy + z1 * sy
  let z2 = -x1 * sy + z1 * cy
  let y2 = y1
  // Rz
  let x3 = x2 * cz - y2 * sz
  let y3 = x2 * sz + y2 * cz
  let z3 = z2
  return { x: x3, y: y3, z: z3 }
}

// 3D 逆向旋转 = R^T 应用（旋转矩阵正交）
function rotateInverse3D(v: { x: number; y: number; z: number }) {
  const ax = (rotation.x * Math.PI) / 180
  const ay = (rotation.y * Math.PI) / 180
  const az = (rotation.z * Math.PI) / 180
  const cx = Math.cos(ax), sx = Math.sin(ax)
  const cy = Math.cos(ay), sy = Math.sin(ay)
  const cz = Math.cos(az), sz = Math.sin(az)

  // R^T = Rx^T * Ry^T * Rz^T
  // Rz^T
  let x1 = v.x * cz + v.y * sz
  let y1 = -v.x * sz + v.y * cz
  let z1 = v.z
  // Ry^T
  let x2 = x1 * cy - z1 * sy
  let z2 = x1 * sy + z1 * cy
  let y2 = y1
  // Rx^T
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

const isForward = computed(() => {
  return direction.value === 'world-to-screen' || direction.value === 'local-to-world'
})

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

const output = computed(() => {
  const p = { x: input.x, y: input.y, z: input.z }
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

function swap() {
  const opposite: Record<Dir, Dir> = {
    'world-to-screen': 'screen-to-world',
    'screen-to-world': 'world-to-screen',
    'local-to-world': 'world-to-local',
    'world-to-local': 'local-to-world',
  }
  direction.value = opposite[direction.value]
}

function copyOutput() {
  const text =
    dim.value === 2
      ? `(${formatNum(output.value.x)}, ${formatNum(output.value.y)})`
      : `(${formatNum(output.value.x)}, ${formatNum(output.value.y)}, ${formatNum(output.value.z)})`
  navigator.clipboard.writeText(text)
  message.success('已复制：' + text)
}
</script>

<style scoped>
.coord-converter {
  max-width: 1000px;
  margin: 0 auto;
}

.config-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.config-section {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  margin-top: 12px;
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

.vector-inputs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.vector-inputs .n-input-number,
.vector-inputs .n-input {
  width: 130px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.dark .section-title {
  color: #eee;
}

.hint-text {
  font-size: 13px;
  color: #888;
  margin-bottom: 12px;
}

.dark .hint-text {
  color: #999;
}

.io-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
}

.io-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.io-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.io-title {
  font-size: 13px;
  font-weight: 600;
  color: #444;
}

.dark .io-title {
  color: #ccc;
}

.io-arrow {
  font-size: 24px;
  color: #999;
  text-align: center;
}

.copy-btn {
  align-self: flex-start;
}

.help-list {
  padding-left: 20px;
  color: #666;
  font-size: 13px;
  line-height: 1.8;
}

.dark .help-list {
  color: #aaa;
}

@media (max-width: 700px) {
  .io-grid {
    grid-template-columns: 1fr;
  }
  .io-arrow {
    transform: rotate(90deg);
  }
}
</style>
