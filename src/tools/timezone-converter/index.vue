<template>
  <div class="timezone-converter">
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">时间转换</h3>

      <div class="convert-section">
        <div class="convert-item">
          <label>源时区</label>
          <n-select v-model:value="fromTimezone" :options="timezoneOptions" style="width: 100%" />
        </div>
        <div class="convert-item">
          <label>时间</label>
          <n-date-picker v-model:value="inputTime" type="datetime" style="width: 100%" clearable />
        </div>
        <div class="convert-item">
          <label>目标时区</label>
          <n-select v-model:value="toTimezone" :options="timezoneOptions" style="width: 100%" />
        </div>
        <div class="convert-item">
          <label>转换结果</label>
          <div class="result-box">{{ convertedTime }}</div>
        </div>
      </div>

      <div class="toolbar mt-4">
        <n-button @click="useNow">使用当前时间</n-button>
        <n-button @click="swap">交换时区</n-button>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">世界主要城市当前时间</h3>
      <n-data-table
        :columns="columns"
        :data="worldTimes"
        :bordered="false"
        :single-line="false"
        size="small"
      />
    </div>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">时差计算器</h3>
      <div class="diff-section">
        <div class="diff-item">
          <label>城市 A</label>
          <n-select v-model:value="cityA" :options="cityOptions" style="width: 100%" />
        </div>
        <div class="diff-item">
          <label>城市 B</label>
          <n-select v-model:value="cityB" :options="cityOptions" style="width: 100%" />
        </div>
        <div class="diff-item">
          <label>时差</label>
          <div class="result-box">{{ timeDiff }}</div>
        </div>
      </div>
      <div class="text-sm text-gray-500 mt-3" v-if="diffInfo">{{ diffInfo }}</div>
    </div>

    <div class="card">
      <h3 class="text-sm font-bold mb-3">工作日换算</h3>
      <div class="workday-section">
        <div class="workday-item">
          <label>开始时间</label>
          <n-date-picker v-model:value="workStart" type="datetime" style="width: 100%" clearable />
        </div>
        <div class="workday-item">
          <label>增加天数</label>
          <n-input-number v-model:value="addDays" :min="0" :max="365" style="width: 100%" />
        </div>
        <div class="workday-item">
          <label>结束时间（仅工作日）</label>
          <div class="result-box">{{ workEndResult }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NButton, NSelect, NDatePicker, NInputNumber, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface CityInfo {
  name: string
  timezone: string
  offset: string
}

const cities: CityInfo[] = [
  { name: '北京/上海', timezone: 'Asia/Shanghai', offset: 'UTC+8' },
  { name: '东京', timezone: 'Asia/Tokyo', offset: 'UTC+9' },
  { name: '首尔', timezone: 'Asia/Seoul', offset: 'UTC+9' },
  { name: '香港', timezone: 'Asia/Hong_Kong', offset: 'UTC+8' },
  { name: '新加坡', timezone: 'Asia/Singapore', offset: 'UTC+8' },
  { name: '曼谷', timezone: 'Asia/Bangkok', offset: 'UTC+7' },
  { name: '孟买', timezone: 'Asia/Kolkata', offset: 'UTC+5:30' },
  { name: '迪拜', timezone: 'Asia/Dubai', offset: 'UTC+4' },
  { name: '莫斯科', timezone: 'Europe/Moscow', offset: 'UTC+3' },
  { name: '柏林', timezone: 'Europe/Berlin', offset: 'UTC+1' },
  { name: '伦敦', timezone: 'Europe/London', offset: 'UTC+0' },
  { name: '纽约', timezone: 'America/New_York', offset: 'UTC-5' },
  { name: '芝加哥', timezone: 'America/Chicago', offset: 'UTC-6' },
  { name: '洛杉矶', timezone: 'America/Los_Angeles', offset: 'UTC-8' },
  { name: '悉尼', timezone: 'Australia/Sydney', offset: 'UTC+11' },
  { name: '奥克兰', timezone: 'Pacific/Auckland', offset: 'UTC+13' },
]

const timezoneOptions = cities.map(c => ({
  label: `${c.name} (${c.offset})`,
  value: c.timezone,
}))

const cityOptions = cities.map(c => ({
  label: `${c.name} (${c.offset})`,
  value: c.name,
}))

const fromTimezone = ref('Asia/Shanghai')
const toTimezone = ref('America/New_York')
const inputTime = ref<number | null>(null)
const cityA = ref('北京/上海')
const cityB = ref('纽约')

const workStart = ref<number | null>(null)
const addDays = ref(5)

// 转换时间
const convertedTime = computed(() => {
  if (!inputTime.value) return '请选择时间'
  try {
    const date = new Date(inputTime.value)
    const result = new Intl.DateTimeFormat('zh-CN', {
      timeZone: toTimezone.value,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date)
    return result
  } catch {
    return '时区不支持'
  }
})

// 世界时间表
const worldTimes = ref<{ city: string; offset: string; time: string; date: string }[]>([])
let timer: number | null = null

const columns: DataTableColumns<{ city: string; offset: string; time: string; date: string }> = [
  { title: '城市', key: 'city', width: 120 },
  { title: '时区', key: 'offset', width: 100 },
  { title: '日期', key: 'date', width: 120 },
  { title: '时间', key: 'time' },
]

function updateWorldTimes() {
  const now = new Date()
  worldTimes.value = cities.map(city => {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: city.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: city.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return {
      city: city.name,
      offset: city.offset,
      time: formatter.format(now),
      date: dateFormatter.format(now),
    }
  })
}

// 时差计算
const timeDiff = computed(() => {
  const cityAInfo = cities.find(c => c.name === cityA.value)
  const cityBInfo = cities.find(c => c.name === cityB.value)
  if (!cityAInfo || !cityBInfo) return ''

  const offsetA = parseOffset(cityAInfo.offset)
  const offsetB = parseOffset(cityBInfo.offset)
  const diff = offsetB - offsetA

  const sign = diff >= 0 ? '+' : ''
  const hours = Math.floor(Math.abs(diff))
  const minutes = Math.round((Math.abs(diff) - hours) * 60)
  return `${sign}${diff.toFixed(1)} 小时${minutes > 0 ? ` ${minutes} 分` : ''}`
})

const diffInfo = computed(() => {
  const cityAInfo = cities.find(c => c.name === cityA.value)
  const cityBInfo = cities.find(c => c.name === cityB.value)
  if (!cityAInfo || !cityBInfo) return ''
  const offsetA = parseOffset(cityAInfo.offset)
  const offsetB = parseOffset(cityBInfo.offset)
  const diff = offsetB - offsetA
  if (diff === 0) return `${cityA.value} 与 ${cityB.value} 同时区`
  return `${cityB.value} 比 ${cityA.value} ${diff > 0 ? '早' : '晚'} ${Math.abs(diff)} 小时`
})

function parseOffset(offset: string): number {
  const match = offset.match(/UTC([+-])(\d+)(?::(\d+))?/)
  if (!match) return 0
  const sign = match[1] === '+' ? 1 : -1
  const hours = parseInt(match[2], 10)
  const minutes = match[3] ? parseInt(match[3], 10) : 0
  return sign * (hours + minutes / 60)
}

// 工作日换算
const workEndResult = computed(() => {
  if (!workStart.value) return '请选择开始时间'
  const start = new Date(workStart.value)
  let count = 0
  const current = new Date(start)

  while (count < addDays.value) {
    current.setDate(current.getDate() + 1)
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  }).format(current)
})

function useNow() {
  inputTime.value = Date.now()
}

function swap() {
  const temp = fromTimezone.value
  fromTimezone.value = toTimezone.value
  toTimezone.value = temp
}

onMounted(() => {
  inputTime.value = Date.now()
  workStart.value = Date.now()
  updateWorldTimes()
  timer = window.setInterval(updateWorldTimes, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.timezone-converter {
  max-width: 1000px;
  margin: 0 auto;
}

.convert-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.convert-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.convert-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .convert-item label {
  color: #aaa;
}

.result-box {
  padding: 8px 12px;
  background: #f0f9eb;
  border-radius: 6px;
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #36ad6a;
  min-height: 34px;
  display: flex;
  align-items: center;
}

.dark .result-box {
  background: #1a3a2a;
  color: #63e2b7;
}

.toolbar {
  display: flex;
  gap: 12px;
}

.diff-section,
.workday-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.diff-item,
.workday-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diff-item label,
.workday-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .diff-item label,
.dark .workday-item label {
  color: #aaa;
}

@media (max-width: 768px) {
  .convert-section,
  .diff-section,
  .workday-section {
    grid-template-columns: 1fr;
  }
}
</style>
