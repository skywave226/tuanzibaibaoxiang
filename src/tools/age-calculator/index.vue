<template>
  <div class="age-calculator">
    <div class="input-section">
      <label>出生日期</label>
      <n-date-picker v-model:value="birthDate" type="date" />
    </div>
    <div class="result" v-if="age">
      <n-descriptions bordered :column="2">
        <n-descriptions-item label="年龄">{{ age.years }} 岁</n-descriptions-item>
        <n-descriptions-item label="月龄">{{ age.totalMonths }} 个月</n-descriptions-item>
        <n-descriptions-item label="总天数">{{ age.totalDays }} 天</n-descriptions-item>
        <n-descriptions-item label="总小时数">{{ age.totalHours }} 小时</n-descriptions-item>
        <n-descriptions-item label="下次生日">{{ age.nextBirthday }}</n-descriptions-item>
        <n-descriptions-item label="距离下次生日">{{ age.daysToNextBirthday }} 天</n-descriptions-item>
      </n-descriptions>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { NDatePicker, NDescriptions, NDescriptionsItem } from 'naive-ui'
const birthDate = ref(Date.now())
const age = computed(() => {
  if (!birthDate.value) return null
  const birth = new Date(birthDate.value)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  const totalDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
  const totalMonths = years * 12 + months
  const totalHours = totalDays * 24
  const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
  if (nextBirthday < now) nextBirthday.setFullYear(now.getFullYear() + 1)
  const daysToNextBirthday = Math.floor((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return { years, totalMonths, totalDays, totalHours, nextBirthday: nextBirthday.toLocaleDateString(), daysToNextBirthday }
})
</script>
<style scoped>
.age-calculator { max-width: 800px; margin: 0 auto; }
.input-section { margin-bottom: 20px; }
.input-section label { display: block; margin-bottom: 8px; font-weight: 500; }
.result { margin-top: 20px; }
</style>
