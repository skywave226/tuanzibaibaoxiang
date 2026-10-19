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
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const birthday = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate())
  if (birthday > today) return null

  let nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
  const birthdayPassed = nextBirthday <= today
  const years = now.getFullYear() - birth.getFullYear() - (birthdayPassed ? 0 : 1)
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12
    + now.getMonth() - birth.getMonth() - (now.getDate() < birth.getDate() ? 1 : 0)
  const dayNumber = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
  const totalDays = dayNumber(today) - dayNumber(birthday)
  const totalHours = Math.floor((now.getTime() - birthday.getTime()) / 3600000)
  if (nextBirthday < today) nextBirthday = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate())
  const daysToNextBirthday = dayNumber(nextBirthday) - dayNumber(today)
  return { years, totalMonths, totalDays, totalHours, nextBirthday: nextBirthday.toLocaleDateString(), daysToNextBirthday }
})
</script>
<style scoped>
.age-calculator { max-width: 800px; margin: 0 auto; }
.input-section { margin-bottom: 20px; }
.input-section label { display: block; margin-bottom: 8px; font-weight: 500; }
.result { margin-top: 20px; }
</style>
