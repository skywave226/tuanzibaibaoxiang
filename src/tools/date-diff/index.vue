<template>
  <div class="date-diff">
    <n-tabs v-model:value="activeTab" type="line" class="mb-4">
      <n-tab-pane name="diff" tab="日期间隔">
        <div class="card">
          <div class="date-inputs">
            <div>
              <label>开始日期</label>
              <n-date-picker v-model:value="startDate" type="date" />
            </div>
            <div>
              <label>结束日期</label>
              <n-date-picker v-model:value="endDate" type="date" />
            </div>
          </div>
          <div class="result" v-if="diffResult">
            <n-descriptions bordered :column="2">
              <n-descriptions-item label="相差天数">{{ diffResult.days }} 天</n-descriptions-item>
              <n-descriptions-item label="相差周数">{{ diffResult.weeks }} 周</n-descriptions-item>
              <n-descriptions-item label="相差月数">{{ diffResult.months }} 个月</n-descriptions-item>
              <n-descriptions-item label="相差年数">{{ diffResult.years }} 年</n-descriptions-item>
              <n-descriptions-item label="详细">{{ diffResult.detail }}</n-descriptions-item>
            </n-descriptions>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="add" tab="日期加减">
        <div class="card">
          <div class="date-inputs">
            <div>
              <label>基准日期</label>
              <n-date-picker v-model:value="baseDate" type="date" />
            </div>
            <div>
              <label>加减数量</label>
              <n-input-number v-model:value="addAmount" :step="1" />
            </div>
          </div>
          <div class="unit-row">
            <n-radio-group v-model:value="addUnit" size="small">
              <n-radio-button value="days">天</n-radio-button>
              <n-radio-button value="weeks">周</n-radio-button>
              <n-radio-button value="months">月</n-radio-button>
              <n-radio-button value="years">年</n-radio-button>
              <n-radio-button value="workdays">工作日</n-radio-button>
            </n-radio-group>
          </div>
          <div class="result" v-if="addResult">
            <n-descriptions bordered :column="1">
              <n-descriptions-item label="计算结果">{{ addResult.formatted }}</n-descriptions-item>
              <n-descriptions-item label="星期">{{ addResult.weekday }}</n-descriptions-item>
            </n-descriptions>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="workdays" tab="工作日计算">
        <div class="card">
          <div class="date-inputs">
            <div>
              <label>开始日期</label>
              <n-date-picker v-model:value="workStartDate" type="date" />
            </div>
            <div>
              <label>结束日期</label>
              <n-date-picker v-model:value="workEndDate" type="date" />
            </div>
          </div>
          <div class="result" v-if="workdaysResult">
            <n-descriptions bordered :column="2">
              <n-descriptions-item label="工作日天数">{{ workdaysResult.workdays }} 天</n-descriptions-item>
              <n-descriptions-item label="周末天数">{{ workdaysResult.weekends }} 天</n-descriptions-item>
              <n-descriptions-item label="总天数">{{ workdaysResult.total }} 天</n-descriptions-item>
            </n-descriptions>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NDatePicker, NDescriptions, NDescriptionsItem, NTabs, NTabPane, NInputNumber, NRadioGroup, NRadioButton } from 'naive-ui'

const activeTab = ref('diff')

// 日期间隔
const startDate = ref(Date.now())
const endDate = ref(Date.now())

const diffResult = computed(() => {
  if (!startDate.value || !endDate.value) return null
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const diffMs = Math.abs(end.getTime() - start.getTime())
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30.44)
  const years = Math.floor(days / 365.25)
  const remainMonths = months - years * 12
  const remainDays = days - months * 30
  const detail = `${years} 年 ${remainMonths} 个月 ${remainDays} 天`
  return { days, weeks, months, years, detail }
})

// 日期加减
const baseDate = ref(Date.now())
const addAmount = ref(7)
const addUnit = ref<'days' | 'weeks' | 'months' | 'years' | 'workdays'>('days')

const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

function addWorkdays(date: Date, days: number): Date {
  const result = new Date(date)
  let remaining = Math.abs(days)
  const direction = days >= 0 ? 1 : -1
  while (remaining > 0) {
    result.setDate(result.getDate() + direction)
    const day = result.getDay()
    if (day !== 0 && day !== 6) {
      remaining--
    }
  }
  return result
}

const addResult = computed(() => {
  if (!baseDate.value) return null
  const date = new Date(baseDate.value)
  const amount = addAmount.value || 0
  let result: Date
  switch (addUnit.value) {
    case 'days':
      result = new Date(date)
      result.setDate(date.getDate() + amount)
      break
    case 'weeks':
      result = new Date(date)
      result.setDate(date.getDate() + amount * 7)
      break
    case 'months':
      result = addMonths(date, amount)
      break
    case 'years':
      result = addYears(date, amount)
      break
    case 'workdays':
      result = addWorkdays(date, amount)
      break
    default:
      result = date
  }
  return {
    formatted: result.toLocaleDateString('zh-CN'),
    weekday: weekdays[result.getDay()],
  }
})

// 工作日计算
const workStartDate = ref(Date.now())
const workEndDate = ref(Date.now())

const workdaysResult = computed(() => {
  if (!workStartDate.value || !workEndDate.value) return null
  const start = new Date(workStartDate.value)
  const end = new Date(workEndDate.value)
  const diffMs = Math.abs(end.getTime() - start.getTime())
  const total = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
  let workdays = 0
  let weekends = 0
  const current = new Date(Math.min(start.getTime(), end.getTime()))
  const last = new Date(Math.max(start.getTime(), end.getTime()))
  while (current <= last) {
    const day = current.getDay()
    if (day === 0 || day === 6) {
      weekends++
    } else {
      workdays++
    }
    current.setDate(current.getDate() + 1)
  }
  return { workdays, weekends, total }
})
</script>

<style scoped>
.date-diff { max-width: 800px; margin: 0 auto; }
.date-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.date-inputs label { display: block; margin-bottom: 8px; font-weight: 500; }
.unit-row { margin-bottom: 16px; }
.result { margin-top: 20px; }

@media (max-width: 640px) {
  .date-inputs { grid-template-columns: 1fr; }
}
</style>
