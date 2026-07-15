<template>
  <div class="tax-calculator">
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">收入信息</h3>

      <div class="config-section">
        <div class="config-item">
          <label>税前月薪</label>
          <n-input-number v-model:value="salary" :min="0" :step="100">
            <template #prefix>¥</template>
          </n-input-number>
        </div>

        <div class="config-item">
          <label>起征点</label>
          <n-input-number v-model:value="threshold" :min="0" :step="500">
            <template #prefix>¥</template>
          </n-input-number>
        </div>

        <div class="config-item">
          <label>五险一金</label>
          <n-input-number v-model:value="insurance" :min="0" :step="100">
            <template #prefix>¥</template>
          </n-input-number>
        </div>

        <div class="config-item">
          <label>专项附加扣除</label>
          <n-input-number v-model:value="specialDeduction" :min="0" :step="100">
            <template #prefix>¥</template>
          </n-input-number>
        </div>
      </div>

      <div class="toolbar mt-4">
        <n-button type="primary" @click="calculate">计算</n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <div class="card mb-4" v-if="result">
      <h3 class="text-sm font-bold mb-3">计算结果</h3>

      <div class="result-grid">
        <div class="result-card">
          <div class="result-label">应纳税所得额</div>
          <div class="result-value">¥{{ formatNumber(result.taxableIncome) }}</div>
        </div>
        <div class="result-card">
          <div class="result-label">适用税率</div>
          <div class="result-value">{{ result.rate }}%</div>
        </div>
        <div class="result-card">
          <div class="result-label">速算扣除数</div>
          <div class="result-value">¥{{ formatNumber(result.quickDeduction) }}</div>
        </div>
        <div class="result-card highlight">
          <div class="result-label">应纳税额</div>
          <div class="result-value">¥{{ formatNumber(result.tax) }}</div>
        </div>
        <div class="result-card highlight">
          <div class="result-label">税后收入</div>
          <div class="result-value">¥{{ formatNumber(result.afterTax) }}</div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">2024 个人所得税税率表（综合所得）</h3>
      <n-data-table
        :columns="columns"
        :data="taxTable"
        :bordered="false"
        :single-line="false"
        size="small"
      />
    </div>

    <div class="card">
      <h3 class="text-sm font-bold mb-3">专项附加扣除标准（2024）</h3>
      <n-space vertical size="small">
        <div v-for="item in deductions" :key="item.name" class="deduction-row">
          <span class="text-sm text-gray-500 w-40">{{ item.name }}</span>
          <span class="text-sm">{{ item.amount }}</span>
        </div>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NInputNumber, NDataTable, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface TaxBracket {
  level: number
  range: string
  taxableFrom: number
  taxableTo: number
  rate: number
  quickDeduction: number
}

interface Result {
  taxableIncome: number
  rate: number
  quickDeduction: number
  tax: number
  afterTax: number
}

const salary = ref(20000)
const threshold = ref(5000)
const insurance = ref(2000)
const specialDeduction = ref(0)
const result = ref<Result | null>(null)

const taxTable: TaxBracket[] = [
  { level: 1, range: '不超过 36,000 元', taxableFrom: 0, taxableTo: 36000, rate: 3, quickDeduction: 0 },
  { level: 2, range: '36,000 - 144,000 元', taxableFrom: 36000, taxableTo: 144000, rate: 10, quickDeduction: 2520 },
  { level: 3, range: '144,000 - 300,000 元', taxableFrom: 144000, taxableTo: 300000, rate: 20, quickDeduction: 16920 },
  { level: 4, range: '300,000 - 420,000 元', taxableFrom: 300000, taxableTo: 420000, rate: 25, quickDeduction: 31920 },
  { level: 5, range: '420,000 - 660,000 元', taxableFrom: 420000, taxableTo: 660000, rate: 30, quickDeduction: 52920 },
  { level: 6, range: '660,000 - 960,000 元', taxableFrom: 660000, taxableTo: 960000, rate: 35, quickDeduction: 85920 },
  { level: 7, range: '超过 960,000 元', taxableFrom: 960000, taxableTo: Infinity, rate: 45, quickDeduction: 181920 },
]

const deductions = [
  { name: '子女教育', amount: '每个子女 2,000 元/月' },
  { name: '3 岁以下婴幼儿照护', amount: '每个婴幼儿 2,000 元/月' },
  { name: '继续教育', amount: '400 元/月（学历）或 3,600 元/年（职业资格）' },
  { name: '住房贷款利息', amount: '1,000 元/月' },
  { name: '住房租金', amount: '800-1,500 元/月（按城市）' },
  { name: '赡养老人', amount: '3,000 元/月（独生子女全额，非独生子女分摊）' },
]

const columns: DataTableColumns<TaxBracket> = [
  { title: '级数', key: 'level', width: 60 },
  { title: '全月应纳税所得额', key: 'range' },
  { title: '税率（%）', key: 'rate', width: 100 },
  { title: '速算扣除数', key: 'quickDeduction', width: 150, render: row => '¥' + formatNumber(row.quickDeduction) },
]

function formatNumber(n: number): string {
  if (!isFinite(n)) return '0.00'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calculate() {
  const monthlyTaxable = salary.value - threshold.value - insurance.value - specialDeduction.value
  const annualTaxable = Math.max(0, monthlyTaxable * 12)

  const bracket = taxTable.find(b => annualTaxable > b.taxableFrom && annualTaxable <= b.taxableTo)
    || taxTable[taxTable.length - 1]

  const annualTax = annualTaxable <= 0
    ? 0
    : annualTaxable * bracket.rate / 100 - bracket.quickDeduction

  const monthlyTax = Math.max(0, annualTax / 12)
  const afterTax = salary.value - insurance.value - monthlyTax

  result.value = {
    taxableIncome: annualTaxable,
    rate: bracket.rate,
    quickDeduction: bracket.quickDeduction,
    tax: monthlyTax,
    afterTax,
  }
}

function clear() {
  result.value = null
}
</script>

<style scoped>
.tax-calculator {
  max-width: 1000px;
  margin: 0 auto;
}

.config-section {
  display: flex;
  gap: 24px;
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

.toolbar {
  display: flex;
  gap: 12px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.result-card {
  padding: 16px;
  border-radius: 8px;
  background: #f5f5f5;
}

.dark .result-card {
  background: #1e2a4a;
}

.result-card.highlight {
  background: #e8f5e9;
}

.dark .result-card.highlight {
  background: #1a3a2a;
}

.result-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.result-value {
  font-size: 20px;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
  color: #333;
}

.dark .result-value {
  color: #e0e0e0;
}

.result-card.highlight .result-value {
  color: #36ad6a;
}

.dark .result-card.highlight .result-value {
  color: #63e2b7;
}

.deduction-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
