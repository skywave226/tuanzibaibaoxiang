<template>
  <div class="loan-calculator">
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">贷款参数</h3>

      <div class="config-section">
        <div class="config-item">
          <label>贷款金额</label>
          <n-input-number v-model:value="principal" :min="0" :step="10000">
            <template #prefix>¥</template>
          </n-input-number>
        </div>

        <div class="config-item">
          <label>贷款期限</label>
          <n-input-number v-model:value="years" :min="1" :max="30" :step="1">
            <template #suffix>年</template>
          </n-input-number>
        </div>

        <div class="config-item">
          <label>年利率</label>
          <n-input-number v-model:value="annualRate" :min="0" :step="0.01">
            <template #suffix>%</template>
          </n-input-number>
        </div>

        <div class="config-item">
          <label>还款方式</label>
          <n-radio-group v-model:value="method" size="small">
            <n-radio-button value="equal-payment">等额本息</n-radio-button>
            <n-radio-button value="equal-principal">等额本金</n-radio-button>
          </n-radio-group>
        </div>
      </div>

      <div class="toolbar mt-4">
        <n-button type="primary" @click="calculate">计算</n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <div class="summary-cards mb-4" v-if="result">
      <div class="summary-card">
        <div class="summary-label">贷款总额</div>
        <div class="summary-value">¥{{ formatNumber(principal) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">还款总额</div>
        <div class="summary-value">¥{{ formatNumber(result.totalPayment) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">利息总额</div>
        <div class="summary-value interest">¥{{ formatNumber(result.totalInterest) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">{{ method === 'equal-payment' ? '月供' : '首月月供' }}</div>
        <div class="summary-value monthly">¥{{ formatNumber(result.firstPayment) }}</div>
      </div>
    </div>

    <div class="card" v-if="result">
      <h3 class="text-sm font-bold mb-3">还款明细</h3>
      <n-data-table
        :columns="columns"
        :data="schedule"
        :bordered="false"
        :single-line="false"
        size="small"
        :pagination="{ pageSize: 12 }"
        :max-height="500"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NInputNumber, NRadioGroup, NRadioButton, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface ScheduleRow {
  period: number
  monthlyPayment: number
  principal: number
  interest: number
  remainingPrincipal: number
}

interface Result {
  totalPayment: number
  totalInterest: number
  firstPayment: number
}

const principal = ref(1000000)
const years = ref(30)
const annualRate = ref(4.2)
const method = ref<'equal-payment' | 'equal-principal'>('equal-payment')
const result = ref<Result | null>(null)
const schedule = ref<ScheduleRow[]>([])

const columns: DataTableColumns<ScheduleRow> = [
  { title: '期数', key: 'period', width: 80 },
  { title: '月供（元）', key: 'monthlyPayment', width: 120, render: row => formatNumber(row.monthlyPayment) },
  { title: '本金（元）', key: 'principal', width: 120, render: row => formatNumber(row.principal) },
  { title: '利息（元）', key: 'interest', width: 120, render: row => formatNumber(row.interest) },
  { title: '剩余本金（元）', key: 'remainingPrincipal', render: row => formatNumber(row.remainingPrincipal) },
]

function formatNumber(n: number): string {
  if (!isFinite(n)) return '0.00'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calculate() {
  if (!principal.value || principal.value <= 0) return

  const months = years.value * 12
  const monthlyRate = annualRate.value / 100 / 12
  const rows: ScheduleRow[] = []

  let remaining = principal.value
  let totalInterest = 0

  if (method.value === 'equal-payment') {
    // 等额本息
    const monthlyPayment = monthlyRate === 0
      ? principal.value / months
      : principal.value * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)

    for (let i = 1; i <= months; i++) {
      const interest = remaining * monthlyRate
      const principalPart = monthlyPayment - interest
      remaining -= principalPart
      totalInterest += interest

      rows.push({
        period: i,
        monthlyPayment,
        principal: principalPart,
        interest,
        remainingPrincipal: Math.max(0, remaining),
      })
    }

    result.value = {
      totalPayment: monthlyPayment * months,
      totalInterest,
      firstPayment: monthlyPayment,
    }
  } else {
    // 等额本金
    const monthlyPrincipal = principal.value / months
    const firstPayment = monthlyPrincipal + principal.value * monthlyRate

    for (let i = 1; i <= months; i++) {
      const interest = remaining * monthlyRate
      const monthlyPayment = monthlyPrincipal + interest
      remaining -= monthlyPrincipal
      totalInterest += interest

      rows.push({
        period: i,
        monthlyPayment,
        principal: monthlyPrincipal,
        interest,
        remainingPrincipal: Math.max(0, remaining),
      })
    }

    result.value = {
      totalPayment: principal.value + totalInterest,
      totalInterest,
      firstPayment,
    }
  }

  schedule.value = rows
}

function clear() {
  result.value = null
  schedule.value = []
}
</script>

<style scoped>
.loan-calculator {
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

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 16px;
  border-radius: 8px;
  background: #f5f5f5;
}

.dark .summary-card {
  background: #1e2a4a;
}

.summary-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
  color: #333;
}

.dark .summary-value {
  color: #e0e0e0;
}

.summary-value.interest {
  color: #f56c6c;
}

.summary-value.monthly {
  color: #36ad6a;
}

.dark .summary-value.interest {
  color: #ff7875;
}

.dark .summary-value.monthly {
  color: #63e2b7;
}
</style>
