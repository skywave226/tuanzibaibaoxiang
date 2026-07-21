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

      <div class="quick-rates mt-4">
        <span class="text-sm text-gray-500 mr-2">LPR 基准利率参考：</span>
        <n-button size="tiny" quaternary @click="setRate(3.1)">公积金 3.1%</n-button>
        <n-button size="tiny" quaternary @click="setRate(3.45)">商贷首套 3.45%</n-button>
        <n-button size="tiny" quaternary @click="setRate(4.2)">商贷二套 4.2%</n-button>
      </div>

      <div class="toolbar mt-4">
        <n-space>
          <n-button type="primary" @click="calculate">计算</n-button>
          <n-button @click="clear">清空</n-button>
        </n-space>
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

    <div class="two-col" v-if="result">
      <div class="card chart-card">
        <h3 class="text-sm font-bold mb-3">本金 vs 利息</h3>
        <div class="donut-legend">
          <div class="legend-item">
            <span class="dot principal"></span>
            <span>本金 ¥{{ formatNumber(principal) }}</span>
          </div>
          <div class="legend-item">
            <span class="dot interest"></span>
            <span>利息 ¥{{ formatNumber(result.totalInterest) }}</span>
          </div>
        </div>
        <div class="mini-bar">
          <div class="mini-bar-principal" :style="{ width: principalRatio + '%' }"></div>
          <div class="mini-bar-interest" :style="{ width: interestRatio + '%' }"></div>
        </div>
        <div class="ratio-text">本金占比 {{ principalRatio }}% / 利息占比 {{ interestRatio }}%</div>
      </div>

      <div class="card chart-card">
        <h3 class="text-sm font-bold mb-3">月供趋势</h3>
        <div class="trend-chart">
          <div
            v-for="(item, index) in trendData"
            :key="index"
            class="trend-point"
            :style="{ height: item.height + '%', left: item.left + '%' }"
            :title="item.label"
          ></div>
        </div>
        <div class="trend-labels">
          <span>第1期</span>
          <span>中间期</span>
          <span>最后期</span>
        </div>
      </div>
    </div>

    <div class="card mt-4" v-if="result">
      <div class="flex justify-between items-center mb-3 flex-wrap gap-2">
        <h3 class="text-sm font-bold">还款明细</h3>
        <n-space>
          <n-button size="small" @click="exportCsv">导出 CSV</n-button>
          <n-button size="small" @click="exportExcel">导出 Excel</n-button>
        </n-space>
      </div>
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
import { ref, computed } from 'vue'
import { NButton, NSpace, NInputNumber, NRadioGroup, NRadioButton, NDataTable } from 'naive-ui'
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
const annualRate = ref(3.45)
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

function setRate(rate: number) {
  annualRate.value = rate
}

function calculate() {
  if (!principal.value || principal.value <= 0) return

  const months = years.value * 12
  const monthlyRate = annualRate.value / 100 / 12
  const rows: ScheduleRow[] = []

  let remaining = principal.value
  let totalInterest = 0

  if (method.value === 'equal-payment') {
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

const principalRatio = computed(() => {
  if (!result.value || result.value.totalPayment === 0) return 0
  return Math.round((principal.value / result.value.totalPayment) * 100)
})

const interestRatio = computed(() => {
  if (!result.value || result.value.totalPayment === 0) return 0
  return Math.round((result.value.totalInterest / result.value.totalPayment) * 100)
})

const trendData = computed(() => {
  if (schedule.value.length === 0) return []
  const indices = [0, Math.floor(schedule.value.length / 2), schedule.value.length - 1]
  const max = Math.max(...indices.map(i => schedule.value[i].monthlyPayment))
  return indices.map((i, idx) => ({
    height: max === 0 ? 0 : (schedule.value[i].monthlyPayment / max) * 100,
    left: idx * 50,
    label: `第 ${i + 1} 期：¥${formatNumber(schedule.value[i].monthlyPayment)}`,
  }))
})

function exportCsv() {
  const lines: string[] = []
  lines.push(['期数', '月供', '本金', '利息', '剩余本金'].join(','))
  schedule.value.forEach(row => {
    lines.push([row.period, row.monthlyPayment, row.principal, row.interest, row.remainingPrincipal].join(','))
  })
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, 'loan-schedule.csv')
}

async function exportExcel() {
  const XLSX = await import('xlsx')
  const data = schedule.value.map(row => ({
    期数: row.period,
    月供: row.monthlyPayment,
    本金: row.principal,
    利息: row.interest,
    剩余本金: row.remainingPrincipal,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '还款明细')
  XLSX.writeFile(wb, 'loan-schedule.xlsx')
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function clear() {
  result.value = null
  schedule.value = []
}
</script>

<style scoped>
.loan-calculator { max-width: 1000px; margin: 0 auto; }

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

.dark .config-item label { color: #aaa; }

.toolbar { display: flex; gap: 12px; }

.quick-rates {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
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

.dark .summary-card { background: #1e2a4a; }

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

.dark .summary-value { color: #e0e0e0; }

.summary-value.interest { color: #f56c6c; }
.summary-value.monthly { color: #36ad6a; }
.dark .summary-value.interest { color: #ff7875; }
.dark .summary-value.monthly { color: #63e2b7; }

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .two-col { grid-template-columns: 1fr; }
}

.chart-card { text-align: center; }

.donut-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 16px 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.principal { background: #36ad6a; }
.dot.interest { background: #f56c6c; }

.mini-bar {
  height: 24px;
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  margin: 12px 0;
}

.mini-bar-principal { background: #36ad6a; }
.mini-bar-interest { background: #f56c6c; }

.ratio-text {
  font-size: 13px;
  color: #666;
}

.dark .ratio-text { color: #aaa; }

.trend-chart {
  position: relative;
  height: 120px;
  margin: 20px 0 8px;
  border-bottom: 1px solid #e8e8e8;
}

.dark .trend-chart { border-color: #2a2a4a; }

.trend-point {
  position: absolute;
  bottom: 0;
  width: 20px;
  margin-left: -10px;
  background: #36ad6a;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
}

.trend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
}
</style>
