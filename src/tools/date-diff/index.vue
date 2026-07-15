<template>
  <div class="date-diff">
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
    <div class="result" v-if="result">
      <n-descriptions bordered :column="2">
        <n-descriptions-item label="相差天数">{{ result.days }} 天</n-descriptions-item>
        <n-descriptions-item label="相差周数">{{ result.weeks }} 周</n-descriptions-item>
        <n-descriptions-item label="相差月数">{{ result.months }} 个月</n-descriptions-item>
        <n-descriptions-item label="相差年数">{{ result.years }} 年</n-descriptions-item>
        <n-descriptions-item label="详细">{{ result.detail }}</n-descriptions-item>
      </n-descriptions>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { NDatePicker, NDescriptions, NDescriptionsItem } from 'naive-ui'
const startDate = ref(Date.now())
const endDate = ref(Date.now())
const result = computed(() => {
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
</script>
<style scoped>
.date-diff { max-width: 800px; margin: 0 auto; }
.date-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.date-inputs label { display: block; margin-bottom: 8px; font-weight: 500; }
.result { margin-top: 20px; }
</style>
