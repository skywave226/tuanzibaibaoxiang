<template>
  <div class="timestamp-converter">
    <div class="current-time card mb-4">
      <div class="pane-label mb-2">当前时间</div>
      <div class="flex items-center gap-4 flex-wrap">
        <span class="text-2xl font-mono font-bold">{{ currentTime }}</span>
        <n-tag size="small">{{ currentTimestamp }} ms</n-tag>
        <n-button size="small" @click="copyCurrentMs">复制毫秒</n-button>
        <n-button size="small" @click="copyCurrentS">复制秒</n-button>
      </div>
    </div>

    <n-tabs v-model:value="activeTab" type="line" animated class="mb-4">
      <n-tab-pane name="single" tab="单个转换">
        <div class="converter-grid">
          <div class="card">
            <h3 class="font-bold mb-3">时间戳 → 日期</h3>
            <n-input v-model:value="tsInput" placeholder="输入时间戳（秒或毫秒）" @input="tsToDate" />
            <div class="options mt-3">
              <n-radio-group v-model:value="tsUnit" size="small" @update:value="tsToDate">
                <n-radio-button value="auto">自动判断</n-radio-button>
                <n-radio-button value="seconds">秒</n-radio-button>
                <n-radio-button value="milliseconds">毫秒</n-radio-button>
              </n-radio-group>
            </div>
            <div class="result mt-3" v-if="tsResult">
              <div class="text-sm text-gray-500">转换结果</div>
              <div class="font-mono text-lg mt-1">{{ tsResult }}</div>
              <div class="text-sm text-gray-500 mt-2">时区: {{ timezoneLabel }}</div>
            </div>
          </div>

          <div class="card">
            <h3 class="font-bold mb-3">日期 → 时间戳</h3>
            <n-date-picker v-model:value="dateInput" type="datetime" class="w-full" @update:value="dateToTs" />
            <div class="result mt-3" v-if="dateResult">
              <div class="text-sm text-gray-500">秒级时间戳</div>
              <div class="font-mono text-lg mt-1">{{ dateResult.seconds }}</div>
              <div class="text-sm text-gray-500 mt-2">毫秒级时间戳</div>
              <div class="font-mono text-lg mt-1">{{ dateResult.milliseconds }}</div>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="batch" tab="批量转换">
        <div class="card mb-4">
          <n-input
            v-model:value="batchInput"
            type="textarea"
            :rows="8"
            placeholder="每行一个时间戳或日期，支持混合格式"
          />
          <div class="flex items-center gap-2 mt-3">
            <n-radio-group v-model:value="batchDirection" size="small">
              <n-radio-button value="ts2date">时间戳 → 日期</n-radio-button>
              <n-radio-button value="date2ts">日期 → 时间戳</n-radio-button>
              <n-radio-button value="auto">自动判断</n-radio-button>
            </n-radio-group>
            <n-button size="small" @click="batchConvert">批量转换</n-button>
          </div>
          <n-input v-if="batchOutput" :value="batchOutput" type="textarea" readonly :rows="8" class="mt-3" />
        </div>
      </n-tab-pane>
    </n-tabs>

    <div class="card mb-4">
      <div class="section-header mb-3">
        <h3 class="font-bold">格式化选项</h3>
        <n-select v-model:value="formatTemplate" :options="formatOptions" style="width: 240px" @update:value="refreshResults" />
      </div>
      <div class="timezone-section">
        <span class="text-sm text-gray-500">时区</span>
        <n-select v-model:value="timezone" :options="timezoneOptions" style="width: 280px" @update:value="refreshResults" />
      </div>
    </div>

    <div class="card">
      <h3 class="font-bold mb-3">常用时间戳</h3>
      <n-data-table :columns="columns" :data="commonTimestamps" :bordered="false" size="small" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { NInput, NButton, NDatePicker, NDataTable, NTabs, NTabPane, NRadioGroup, NRadioButton, NSelect, NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const message = useMessage()
const activeTab = ref('single')
const currentTime = ref('')
const currentTimestamp = ref(0)
let timer: number

const tsInput = ref('')
const tsUnit = ref<'auto' | 'seconds' | 'milliseconds'>('auto')
const tsResult = ref('')

const dateInput = ref<number | null>(null)
const dateResult = ref<{ seconds: string; milliseconds: string } | null>(null)

const batchInput = ref('')
const batchDirection = ref<'ts2date' | 'date2ts' | 'auto'>('auto')
const batchOutput = ref('')

const formatTemplate = ref('yyyy-MM-dd HH:mm:ss')
const timezone = ref('local')

const formatOptions = [
  { label: 'yyyy-MM-dd HH:mm:ss', value: 'yyyy-MM-dd HH:mm:ss' },
  { label: 'yyyy/MM/dd HH:mm:ss', value: 'yyyy/MM/dd HH:mm:ss' },
  { label: 'ISO 8601', value: 'ISO' },
  { label: 'RFC 2822', value: 'RFC' },
  { label: 'yyyy年MM月dd日 HH:mm:ss', value: 'yyyy年MM月dd日 HH:mm:ss' },
  { label: 'MM/dd/yyyy HH:mm:ss', value: 'MM/dd/yyyy HH:mm:ss' },
]

const timezoneOptions = [
  { label: '本地时间', value: 'local' },
  { label: 'UTC', value: 'UTC' },
  { label: '北京时间 (UTC+8)', value: 'Asia/Shanghai' },
  { label: '东京 (UTC+9)', value: 'Asia/Tokyo' },
  { label: '伦敦 (UTC+0)', value: 'Europe/London' },
  { label: '纽约 (UTC-5/UTC-4)', value: 'America/New_York' },
  { label: '洛杉矶 (UTC-8/UTC-7)', value: 'America/Los_Angeles' },
]

const timezoneLabel = computed(() => {
  return timezoneOptions.find(t => t.value === timezone.value)?.label || '本地时间'
})

function formatDate(d: Date, template: string): string {
  if (template === 'ISO') return d.toISOString()
  if (template === 'RFC') return d.toUTCString()

  const pad = (n: number) => String(n).padStart(2, '0')
  const map: Record<string, string> = {
    'yyyy': String(d.getFullYear()),
    'MM': pad(d.getMonth() + 1),
    'dd': pad(d.getDate()),
    'HH': pad(d.getHours()),
    'mm': pad(d.getMinutes()),
    'ss': pad(d.getSeconds()),
  }
  return template.replace(/yyyy|MM|dd|HH|mm|ss/g, match => map[match])
}

function applyTimezone(d: Date): Date {
  if (timezone.value === 'local') return d
  if (timezone.value === 'UTC') {
    const utc = new Date(d.getTime())
    return utc
  }
  const str = d.toLocaleString('zh-CN', { timeZone: timezone.value })
  return new Date(str.replace(/\//g, '-'))
}

function updateCurrentTime() {
  const now = new Date()
  currentTime.value = formatDate(now, formatTemplate.value)
  currentTimestamp.value = Date.now()
}

function copyCurrentMs() {
  navigator.clipboard.writeText(String(Date.now()))
  message.success('已复制毫秒时间戳')
}

function copyCurrentS() {
  navigator.clipboard.writeText(String(Math.floor(Date.now() / 1000)))
  message.success('已复制秒时间戳')
}

function tsToDate() {
  const val = tsInput.value.trim()
  if (!val) { tsResult.value = ''; return }
  let num = Number(val)
  if (isNaN(num)) { tsResult.value = '无效的时间戳'; return }

  if (tsUnit.value === 'seconds' || (tsUnit.value === 'auto' && num <= 1e10)) {
    num = num * 1000
  }

  const d = new Date(num)
  if (isNaN(d.getTime())) { tsResult.value = '无效的时间戳'; return }
  tsResult.value = formatDate(applyTimezone(d), formatTemplate.value)
}

function dateToTs(val: number | null) {
  if (val === null) { dateResult.value = null; return }
  dateResult.value = {
    seconds: String(Math.floor(val / 1000)),
    milliseconds: String(val),
  }
}

function refreshResults() {
  updateCurrentTime()
  tsToDate()
  if (dateInput.value) {
    dateToTs(dateInput.value)
  }
}

function batchConvert() {
  batchOutput.value = ''
  const lines = batchInput.value.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return

  const results = lines.map((line) => {
    const isTimestamp = /^\d+$/.test(line)
    let direction = batchDirection.value
    if (direction === 'auto') {
      direction = isTimestamp ? 'ts2date' : 'date2ts'
    }

    if (direction === 'ts2date') {
      let num = Number(line)
      if (num <= 1e10) num *= 1000
      const d = new Date(num)
      if (isNaN(d.getTime())) return `[错误] ${line}`
      return formatDate(applyTimezone(d), formatTemplate.value)
    }
    else {
      const d = new Date(line)
      if (isNaN(d.getTime())) return `[错误] ${line}`
      return String(Math.floor(d.getTime() / 1000))
    }
  })

  batchOutput.value = results.join('\n')
}

const columns: DataTableColumns<{ label: string; seconds: string; date: string }> = [
  { title: '说明', key: 'label' },
  { title: '秒级时间戳', key: 'seconds' },
  { title: '对应日期', key: 'date' },
]

const commonTimestamps = [
  { label: 'Unix 纪元', seconds: '0', date: '1970-01-01 00:00:00' },
  { label: '千禧年', seconds: '946684800', date: '2000-01-01 00:00:00' },
  { label: '2020 年', seconds: '1577836800', date: '2020-01-01 00:00:00' },
  { label: '2025 年', seconds: '1735689600', date: '2025-01-01 00:00:00' },
  { label: '2030 年', seconds: '1893456000', date: '2030-01-01 00:00:00' },
]

onMounted(() => {
  updateCurrentTime()
  timer = window.setInterval(updateCurrentTime, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.timestamp-converter {
  max-width: 900px;
  margin: 0 auto;
}

.card {
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 16px;
}

.converter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.timezone-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-4 {
  gap: 16px;
}

.gap-2 {
  gap: 8px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-1 {
  margin-top: 4px;
}

.mt-2 {
  margin-top: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

.text-2xl {
  font-size: 1.5rem;
}

.font-mono {
  font-family: 'Fira Code', 'Consolas', monospace;
}

.font-bold {
  font-weight: 600;
}

.text-sm {
  font-size: 14px;
}

.text-lg {
  font-size: 1.125rem;
}

.text-gray-500 {
  color: #888;
}

.w-full {
  width: 100%;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
  text-transform: uppercase;
}

@media (max-width: 768px) {
  .converter-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
