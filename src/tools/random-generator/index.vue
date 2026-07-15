<template>
  <div class="random-generator">
    <n-card size="small" class="config-card">
      <div class="config-row">
        <div class="config-item">
          <label>分布类型</label>
          <n-radio-group v-model:value="dist" name="dist">
            <n-radio-button value="uniform">均匀分布</n-radio-button>
            <n-radio-button value="normal">正态分布</n-radio-button>
            <n-radio-button value="exponential">指数分布</n-radio-button>
          </n-radio-group>
        </div>

        <template v-if="dist === 'uniform'">
          <div class="config-item">
            <label>最小值</label>
            <n-input-number v-model:value="uniformMin" :step="1" />
          </div>
          <div class="config-item">
            <label>最大值</label>
            <n-input-number v-model:value="uniformMax" :step="1" />
          </div>
        </template>

        <template v-if="dist === 'normal'">
          <div class="config-item">
            <label>均值 (μ)</label>
            <n-input-number v-model:value="normalMean" :step="1" />
          </div>
          <div class="config-item">
            <label>标准差 (σ)</label>
            <n-input-number v-model:value="normalStd" :min="0.1" :step="0.5" />
          </div>
        </template>

        <template v-if="dist === 'exponential'">
          <div class="config-item">
            <label>速率参数 (λ)</label>
            <n-input-number v-model:value="expRate" :min="0.01" :step="0.1" />
          </div>
        </template>

        <div class="config-item">
          <label>生成数量</label>
          <n-input-number v-model:value="count" :min="100" :max="100000" :step="100" />
        </div>

        <div class="config-item action-item">
          <n-button type="primary" @click="generate">生成</n-button>
          <n-button @click="copyResults" :disabled="results.length === 0">复制结果</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-if="results.length > 0" size="small" title="统计摘要" class="stats-card">
      <div class="stats-grid">
        <div class="stat-item"><div class="stat-label">样本数</div><div class="stat-value">{{ results.length }}</div></div>
        <div class="stat-item"><div class="stat-label">最小值</div><div class="stat-value">{{ stats.min.toFixed(4) }}</div></div>
        <div class="stat-item"><div class="stat-label">最大值</div><div class="stat-value">{{ stats.max.toFixed(4) }}</div></div>
        <div class="stat-item"><div class="stat-label">平均值</div><div class="stat-value">{{ stats.mean.toFixed(4) }}</div></div>
        <div class="stat-item"><div class="stat-label">标准差</div><div class="stat-value">{{ stats.std.toFixed(4) }}</div></div>
        <div class="stat-item"><div class="stat-label">中位数</div><div class="stat-value">{{ stats.median.toFixed(4) }}</div></div>
      </div>
    </n-card>

    <n-card v-if="results.length > 0" size="small" title="分布直方图" class="chart-card">
      <canvas ref="chartRef" width="720" height="280"></canvas>
    </n-card>

    <n-card v-if="results.length > 0" size="small" title="样本数据" class="data-card">
      <n-input :value="previewText" type="textarea" readonly :rows="4" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { NCard, NRadioGroup, NRadioButton, NInputNumber, NButton, NInput, useMessage } from 'naive-ui'

type Dist = 'uniform' | 'normal' | 'exponential'

const message = useMessage()
const dist = ref<Dist>('uniform')
const uniformMin = ref(0)
const uniformMax = ref(100)
const normalMean = ref(0)
const normalStd = ref(1)
const expRate = ref(1)
const count = ref(1000)
const results = ref<number[]>([])
const chartRef = ref<HTMLCanvasElement | null>(null)

const stats = computed(() => {
  const arr = [...results.value].sort((a, b) => a - b)
  const n = arr.length
  const min = arr[0]
  const max = arr[n - 1]
  const mean = arr.reduce((a, b) => a + b, 0) / n
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n
  const std = Math.sqrt(variance)
  const median = n % 2 === 0 ? (arr[n / 2 - 1] + arr[n / 2]) / 2 : arr[Math.floor(n / 2)]
  return { min, max, mean, std, median }
})

const previewText = computed(() => results.value.slice(0, 200).map(v => Number.isInteger(v) ? v : v.toFixed(4)).join(', '))

function randomUniform(): number {
  return Math.random() * (uniformMax.value - uniformMin.value) + uniformMin.value
}

function randomNormal(): number {
  // Box-Muller
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return z * normalStd.value + normalMean.value
}

function randomExponential(): number {
  let u = 0
  while (u === 0) u = Math.random()
  return -Math.log(u) / expRate.value
}

function generate(): void {
  if (dist.value === 'uniform' && uniformMin.value >= uniformMax.value) {
    message.error('均匀分布的最小值必须小于最大值')
    return
  }
  const list: number[] = []
  for (let i = 0; i < count.value; i++) {
    if (dist.value === 'uniform') list.push(randomUniform())
    else if (dist.value === 'normal') list.push(randomNormal())
    else list.push(randomExponential())
  }
  results.value = list
  nextTick(drawHistogram)
}

function drawHistogram(): void {
  const canvas = chartRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  const arr = results.value
  const min = Math.min(...arr)
  const max = Math.max(...arr)
  const bins = 40
  const binWidth = (max - min) / bins || 1
  const counts = new Array(bins).fill(0)
  for (const v of arr) {
    const idx = Math.min(bins - 1, Math.floor((v - min) / binWidth))
    counts[idx]++
  }
  const maxCount = Math.max(...counts)

  const padding = 40
  const chartW = w - padding * 2
  const chartH = h - padding * 2
  const barW = chartW / bins

  // axes
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, h - padding)
  ctx.lineTo(w - padding, h - padding)
  ctx.stroke()

  // bars
  for (let i = 0; i < bins; i++) {
    const barH = maxCount > 0 ? (counts[i] / maxCount) * chartH : 0
    const x = padding + i * barW
    const y = h - padding - barH
    ctx.fillStyle = '#2080f0'
    ctx.fillRect(x + 1, y, barW - 2, barH)
  }

  // labels
  ctx.fillStyle = '#666'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(min.toFixed(2), padding, h - padding + 16)
  ctx.fillText(max.toFixed(2), w - padding, h - padding + 16)
  ctx.fillText('数值范围', w / 2, h - 6)

  ctx.save()
  ctx.translate(14, h / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText('频数', 0, 0)
  ctx.restore()
}

function copyResults(): void {
  const text = results.value.map(v => Number.isInteger(v) ? v : v.toFixed(4)).join('\n')
  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制到剪贴板')
  }).catch(() => message.error('复制失败'))
}
</script>

<style scoped>
.random-generator {
  max-width: 900px;
  margin: 0 auto;
}

.config-card, .stats-card, .chart-card, .data-card {
  margin-bottom: 16px;
}

.config-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 120px;
}

.config-item label {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

.action-item {
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #2080f0;
  font-family: 'Fira Code', monospace;
}

canvas {
  width: 100%;
  max-width: 720px;
  height: auto;
  display: block;
}

.dark .config-item label { color: #bbb; }
.dark .stat-item { background: rgba(255, 255, 255, 0.04); }
.dark .stat-value { color: #66d4ff; }
</style>
