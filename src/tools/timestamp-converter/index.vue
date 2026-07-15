<template>
  <div class="timestamp-converter">
    <div class="current-time card mb-4">
      <div class="text-sm text-gray-500 mb-1">当前时间</div>
      <div class="flex items-center gap-4 flex-wrap">
        <span class="text-2xl font-mono font-bold">{{ currentTime }}</span>
        <n-button size="small" @click="copyCurrent">复制</n-button>
      </div>
    </div>

    <div class="converter-grid">
      <div class="card">
        <h3 class="font-bold mb-3">时间戳 → 日期</h3>
        <n-input v-model:value="tsInput" placeholder="输入时间戳（秒或毫秒）" @input="tsToDate" />
        <div class="result mt-3" v-if="tsResult">
          <div class="text-sm text-gray-500">转换结果</div>
          <div class="font-mono text-lg mt-1">{{ tsResult }}</div>
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

    <div class="card mt-4">
      <h3 class="font-bold mb-3">常用时间戳</h3>
      <n-data-table :columns="columns" :data="commonTimestamps" :bordered="false" size="small" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NInput, NButton, NDatePicker, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const currentTime = ref('')
let timer: number

function updateCurrentTime() {
  const now = new Date()
  currentTime.value = formatDate(now)
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const tsInput = ref('')
const tsResult = ref('')

function tsToDate() {
  const val = tsInput.value.trim()
  if (!val) { tsResult.value = ''; return }
  let num = Number(val)
  if (isNaN(num)) { tsResult.value = '无效的时间戳'; return }
  if (num > 1e12) num = num
  else num = num * 1000
  const d = new Date(num)
  if (isNaN(d.getTime())) { tsResult.value = '无效的时间戳'; return }
  tsResult.value = formatDate(d)
}

const dateInput = ref<number | null>(null)
const dateResult = ref<{ seconds: string; milliseconds: string } | null>(null)

function dateToTs(val: number | null) {
  if (val === null) { dateResult.value = null; return }
  dateResult.value = {
    seconds: String(Math.floor(val / 1000)),
    milliseconds: String(val),
  }
}

function copyCurrent() {
  const ts = String(Math.floor(Date.now() / 1000))
  navigator.clipboard.writeText(ts)
}

const columns: DataTableColumns = [
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
.converter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .converter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
