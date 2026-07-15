<template>
  <div class="percentage-calculator">
    <n-tabs type="line" animated>
      <n-tab-pane name="basic" tab="基础计算">
        <div class="card">
          <h3 class="text-sm font-bold mb-3">求数值的百分比</h3>
          <div class="calc-row">
            <n-input-number v-model:value="basic.value" :step="0.01" placeholder="数值" />
            <span class="op-label">的</span>
            <n-input-number v-model:value="basic.percent" :step="0.01" :min="0" placeholder="百分比">
              <template #suffix>%</template>
            </n-input-number>
            <span class="op-label">=</span>
            <div class="result-box">{{ formatNumber(basicResult) }}</div>
          </div>
          <div class="formula text-sm text-gray-500 mt-2">
            公式：{{ basic.value }} × {{ basic.percent }}% = {{ formatNumber(basicResult) }}
          </div>
        </div>

        <div class="card mt-4">
          <h3 class="text-sm font-bold mb-3">求百分比对应的数值</h3>
          <div class="calc-row">
            <span class="op-label">已知</span>
            <n-input-number v-model:value="reverse.value" :step="0.01" placeholder="数值" />
            <span class="op-label">是某数的</span>
            <n-input-number v-model:value="reverse.percent" :step="0.01" placeholder="百分比">
              <template #suffix>%</template>
            </n-input-number>
            <span class="op-label">=</span>
            <div class="result-box">{{ formatNumber(reverseResult) }}</div>
          </div>
          <div class="formula text-sm text-gray-500 mt-2">
            公式：{{ reverse.value }} ÷ {{ reverse.percent }}% = {{ formatNumber(reverseResult) }}
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="change" tab="增减比例">
        <div class="card">
          <h3 class="text-sm font-bold mb-3">计算增减百分比</h3>
          <div class="calc-row">
            <span class="op-label">从</span>
            <n-input-number v-model:value="change.original" :step="0.01" placeholder="原值" />
            <span class="op-label">变为</span>
            <n-input-number v-model:value="change.current" :step="0.01" placeholder="现值" />
          </div>
          <div class="result-card mt-4">
            <div class="result-item">
              <span class="result-label">增减百分比</span>
              <span class="result-value" :class="changeClass">
                {{ changePercent > 0 ? '+' : '' }}{{ changePercent.toFixed(2) }}%
              </span>
            </div>
            <div class="result-item">
              <span class="result-label">增减数值</span>
              <span class="result-value" :class="changeClass">
                {{ changeValue > 0 ? '+' : '' }}{{ formatNumber(changeValue) }}
              </span>
            </div>
          </div>
          <div class="formula text-sm text-gray-500 mt-3">
            公式：(现值 - 原值) ÷ 原值 × 100% = {{ changePercent.toFixed(2) }}%
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="ratio" tab="比例换算">
        <div class="card">
          <h3 class="text-sm font-bold mb-3">A 是 B 的百分之几</h3>
          <div class="calc-row">
            <n-input-number v-model:value="ratio.a" :step="0.01" placeholder="A 值" />
            <span class="op-label">是</span>
            <n-input-number v-model:value="ratio.b" :step="0.01" placeholder="B 值" />
            <span class="op-label">的</span>
            <div class="result-box">{{ ratioResult.toFixed(2) }}%</div>
          </div>
          <div class="formula text-sm text-gray-500 mt-2">
            公式：{{ ratio.a }} ÷ {{ ratio.b }} × 100% = {{ ratioResult.toFixed(2) }}%
          </div>
        </div>

        <div class="card mt-4">
          <h3 class="text-sm font-bold mb-3">小数/分数 ↔ 百分比</h3>
          <div class="calc-row">
            <n-input-number v-model:value="decimal.value" :step="0.0001" placeholder="小数" />
            <span class="op-label">=</span>
            <div class="result-box">{{ decimalToPercent.toFixed(4) }}%</div>
            <span class="op-label ml-4">|</span>
            <n-input-number v-model:value="percentToDec.value" :step="0.01" placeholder="百分比">
              <template #suffix>%</template>
            </n-input-number>
            <span class="op-label">=</span>
            <div class="result-box">{{ percentToDecimal.toFixed(6) }}</div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NTabs, NTabPane, NInputNumber } from 'naive-ui'

// 基础计算：X 的 Y%
const basic = ref({ value: 100, percent: 15 })
const basicResult = computed(() => (basic.value.value || 0) * (basic.value.percent || 0) / 100)

// 反向计算：已知 X 是 Y% 的结果，求原数
const reverse = ref({ value: 30, percent: 15 })
const reverseResult = computed(() => {
  if (!reverse.value.percent) return 0
  return (reverse.value.value || 0) / (reverse.value.percent / 100)
})

// 增减比例
const change = ref({ original: 100, current: 120 })
const changeValue = computed(() => (change.value.current || 0) - (change.value.original || 0))
const changePercent = computed(() => {
  if (!change.value.original) return 0
  return changeValue.value / change.value.original * 100
})
const changeClass = computed(() => ({
  'positive': changeValue.value > 0,
  'negative': changeValue.value < 0,
}))

// 比例换算：A 是 B 的百分之几
const ratio = ref({ a: 30, b: 200 })
const ratioResult = computed(() => {
  if (!ratio.value.b) return 0
  return (ratio.value.a || 0) / (ratio.value.b || 0) * 100
})

// 小数 ↔ 百分比
const decimal = ref({ value: 0.25 })
const decimalToPercent = computed(() => (decimal.value.value || 0) * 100)

const percentToDec = ref({ value: 25 })
const percentToDecimal = computed(() => (percentToDec.value.value || 0) / 100)

function formatNumber(n: number): string {
  if (!isFinite(n)) return '∞'
  return Math.round(n * 1e6) / 1e6 + ''
}
</script>

<style scoped>
.percentage-calculator {
  max-width: 800px;
  margin: 0 auto;
}

.calc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.op-label {
  font-size: 14px;
  color: #555;
  white-space: nowrap;
}

.dark .op-label {
  color: #aaa;
}

.result-box {
  padding: 6px 16px;
  background: #f0f9eb;
  border-radius: 6px;
  font-family: 'Fira Code', monospace;
  font-size: 16px;
  font-weight: 600;
  color: #36ad6a;
  min-width: 100px;
  text-align: center;
}

.dark .result-box {
  background: #1a3a2a;
  color: #63e2b7;
}

.formula {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

.result-card {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-label {
  font-size: 12px;
  color: #888;
}

.result-value {
  font-size: 20px;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
}

.result-value.positive {
  color: #36ad6a;
}

.result-value.negative {
  color: #f56c6c;
}

.dark .result-value.positive {
  color: #63e2b7;
}

.dark .result-value.negative {
  color: #ff7875;
}

.ml-4 {
  margin-left: 16px;
}
</style>
