<template>
  <div class="game-random-gen">
    <div class="section">
      <div class="section-header">
        <span class="section-title">随机数引擎配置</span>
      </div>
      <div class="config-row">
        <span class="config-label">算法</span>
        <n-select
          v-model:value="engine"
          :options="engineOptions"
          size="small"
          class="engine-select"
        />
        <span class="config-label">种子</span>
        <n-input v-model:value="seedInput" size="small" placeholder="留空随机" class="seed-input" />
        <n-button size="small" @click="randomSeed">随机种子</n-button>
        <n-button size="small" type="primary" ghost @click="resetEngine">重置引擎</n-button>
      </div>
    </div>

    <!-- 范围随机整数 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">范围随机整数</span>
      </div>
      <div class="config-row">
        <span class="config-label">最小值</span>
        <n-input-number v-model:value="rangeMin" size="small" />
        <span class="config-label">最大值</span>
        <n-input-number v-model:value="rangeMax" size="small" />
        <span class="config-label">数量</span>
        <n-input-number v-model:value="rangeCount" :min="1" :max="1000" size="small" />
        <n-button size="small" type="primary" @click="genRangeInts">生成</n-button>
        <n-button size="small" @click="copyResult(rangeResult)">复制</n-button>
      </div>
      <n-input
        v-model:value="rangeResult"
        type="textarea"
        :rows="3"
        readonly
        class="result-box"
      />
    </div>

    <!-- 加权随机抽取 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">加权随机抽取</span>
        <n-button size="small" @click="addWeightItem">添加项</n-button>
      </div>
      <div class="weight-list">
        <div v-for="(item, idx) in weightItems" :key="idx" class="weight-row">
          <n-input v-model:value="item.label" size="small" placeholder="名称" class="weight-label" />
          <n-input-number v-model:value="item.weight" :min="0" :step="0.1" size="small" class="weight-value" />
          <n-button size="small" quaternary type="error" @click="removeWeightItem(idx)">删除</n-button>
        </div>
      </div>
      <div class="config-row">
        <span class="config-label">抽取次数</span>
        <n-input-number v-model:value="pickCount" :min="1" :max="100" size="small" />
        <n-button size="small" type="primary" @click="pickWeighted">抽取</n-button>
        <n-button size="small" @click="copyResult(pickResult)">复制</n-button>
      </div>
      <n-input
        v-model:value="pickResult"
        type="textarea"
        :rows="3"
        readonly
        class="result-box"
      />
    </div>

    <!-- 正态分布随机数 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">正态分布随机数（Box-Muller）</span>
      </div>
      <div class="config-row">
        <span class="config-label">均值 μ</span>
        <n-input-number v-model:value="mean" size="small" />
        <span class="config-label">标准差 σ</span>
        <n-input-number v-model:value="stdDev" :min="0.1" :step="0.1" size="small" />
        <span class="config-label">数量</span>
        <n-input-number v-model:value="normalCount" :min="1" :max="1000" size="small" />
        <n-button size="small" type="primary" @click="genNormal">生成</n-button>
        <n-button size="small" @click="copyResult(normalResult)">复制</n-button>
      </div>
      <n-input
        v-model:value="normalResult"
        type="textarea"
        :rows="3"
        readonly
        class="result-box"
      />
    </div>

    <!-- 洗牌算法 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">洗牌算法（Fisher-Yates）</span>
      </div>
      <div class="config-row">
        <span class="config-label">元素列表</span>
        <n-input v-model:value="shuffleInput" size="small" placeholder="用逗号分隔，如：A,B,C,D" class="shuffle-input" />
        <n-button size="small" type="primary" @click="doShuffle">洗牌</n-button>
        <n-button size="small" @click="copyResult(shuffleResult)">复制</n-button>
      </div>
      <n-input
        v-model:value="shuffleResult"
        type="textarea"
        :rows="2"
        readonly
        class="result-box"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NInput, NInputNumber, NSelect, useMessage } from 'naive-ui'

const message = useMessage()

const engine = ref<'lcg' | 'mulberry32'>('mulberry32')
const engineOptions = [
  { label: 'LCG (线性同余)', value: 'lcg' },
  { label: 'Mulberry32', value: 'mulberry32' },
]

const seedInput = ref<string>('')
let state = 0

interface WeightItem { label: string; weight: number }
const weightItems = ref<WeightItem[]>([
  { label: '普通', weight: 60 },
  { label: '稀有', weight: 30 },
  { label: '史诗', weight: 8 },
  { label: '传说', weight: 2 },
])

const rangeMin = ref(1)
const rangeMax = ref(100)
const rangeCount = ref(10)
const rangeResult = ref('')

const pickCount = ref(10)
const pickResult = ref('')

const mean = ref(0)
const stdDev = ref(1)
const normalCount = ref(10)
const normalResult = ref('')

const shuffleInput = ref('剑,弓,杖,盾,药水,钥匙,宝石,卷轴')
const shuffleResult = ref('')

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

function resetEngine(): void {
  const seed = getSeed()
  if (!seedInput.value.trim()) seedInput.value = String(seed)
  state = seed >>> 0
  message.success(`引擎已重置，种子: ${seedInput.value}`)
}

// LCG 实现
function lcgNext(): number {
  // Numerical Recipes 常量
  state = (Math.imul(1664525, state) + 1013904223) >>> 0
  return state / 4294967296
}

// Mulberry32 实现
function mulberry32Next(): number {
  state = (state + 0x6D2B79F5) >>> 0
  let t = state
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function next(): number {
  return engine.value === 'lcg' ? lcgNext() : mulberry32Next()
}

function nextInt(min: number, max: number): number {
  return Math.floor(next() * (max - min + 1)) + min
}

// 范围随机整数
function genRangeInts(): void {
  if (!seedInput.value.trim()) seedInput.value = String(getSeed())
  resetEngine()
  if (rangeMin.value > rangeMax.value) {
    message.warning('最小值不能大于最大值')
    return
  }
  const arr: number[] = []
  for (let i = 0; i < rangeCount.value; i++) {
    arr.push(nextInt(rangeMin.value, rangeMax.value))
  }
  rangeResult.value = arr.join(', ')
  message.success(`生成 ${arr.length} 个随机整数`)
}

// 加权随机抽取
function addWeightItem(): void {
  weightItems.value.push({ label: `项${weightItems.value.length + 1}`, weight: 10 })
}

function removeWeightItem(idx: number): void {
  weightItems.value.splice(idx, 1)
}

function pickWeighted(): void {
  if (!seedInput.value.trim()) seedInput.value = String(getSeed())
  resetEngine()
  const validItems = weightItems.value.filter(i => i.weight > 0)
  if (validItems.length === 0) {
    message.warning('请添加至少一个有效项（权重 > 0）')
    return
  }
  const totalWeight = validItems.reduce((s, i) => s + i.weight, 0)
  const results: string[] = []
  for (let n = 0; n < pickCount.value; n++) {
    let r = next() * totalWeight
    for (const item of validItems) {
      r -= item.weight
      if (r <= 0) {
        results.push(item.label)
        break
      }
    }
  }
  // 统计
  const stats: Record<string, number> = {}
  results.forEach(r => { stats[r] = (stats[r] || 0) + 1 })
  const statStr = Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}×${v}(${((v / results.length) * 100).toFixed(1)}%)`)
    .join('  ')
  pickResult.value = `结果: ${results.join(', ')}\n统计: ${statStr}`
  message.success('抽取完成')
}

// 正态分布随机数 (Box-Muller)
function genNormal(): void {
  if (!seedInput.value.trim()) seedInput.value = String(getSeed())
  resetEngine()
  if (stdDev.value <= 0) {
    message.warning('标准差必须大于 0')
    return
  }
  const arr: number[] = []
  let hasSpare = false
  let spare = 0
  for (let i = 0; i < normalCount.value; i++) {
    if (hasSpare) {
      arr.push(spare * stdDev.value + mean.value)
      hasSpare = false
    } else {
      let u = 0, v = 0, s = 0
      do {
        u = next() * 2 - 1
        v = next() * 2 - 1
        s = u * u + v * v
      } while (s >= 1 || s === 0)
      const mul = Math.sqrt(-2 * Math.log(s) / s)
      spare = u * mul
      hasSpare = true
      arr.push(v * mul * stdDev.value + mean.value)
    }
  }
  normalResult.value = arr.map(n => Math.round(n * 1000) / 1000).join(', ')
  message.success(`生成 ${arr.length} 个正态分布随机数`)
}

// Fisher-Yates 洗牌
function doShuffle(): void {
  if (!seedInput.value.trim()) seedInput.value = String(getSeed())
  resetEngine()
  const list = shuffleInput.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
  if (list.length === 0) {
    message.warning('请输入元素列表')
    return
  }
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  shuffleResult.value = list.join(', ')
  message.success('洗牌完成')
}

function copyResult(text: string): void {
  if (!text) {
    message.warning('暂无内容可复制')
    return
  }
  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败')
  })
}
</script>

<style scoped>
.game-random-gen {
  max-width: 1000px;
  margin: 0 auto;
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

.engine-select {
  width: 200px;
}

.seed-input {
  width: 160px;
}

.shuffle-input {
  width: 400px;
  max-width: 100%;
}

.result-box {
  margin-top: 8px;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
}

.weight-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.weight-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weight-label {
  flex: 1;
  max-width: 300px;
}

.weight-value {
  width: 120px;
}

.dark .section-title {
  color: #e0e0e0;
}

.dark .config-label {
  color: #aaa;
}
</style>
