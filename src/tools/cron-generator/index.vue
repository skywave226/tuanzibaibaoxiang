<template>
  <div class="cron-generator">
    <n-form>
      <n-form-item label="执行频率">
        <n-radio-group v-model:value="frequency">
          <n-radio value="second">每秒</n-radio>
          <n-radio value="minute">每分钟</n-radio>
          <n-radio value="hour">每小时</n-radio>
          <n-radio value="day">每天</n-radio>
          <n-radio value="week">每周</n-radio>
          <n-radio value="month">每月</n-radio>
          <n-radio value="year">每年</n-radio>
          <n-radio value="custom">自定义</n-radio>
        </n-radio-group>
      </n-form-item>
      <template v-if="frequency === 'custom'">
        <n-form-item label="秒">
          <n-input v-model:value="custom.second" placeholder="0-59" />
        </n-form-item>
        <n-form-item label="分">
          <n-input v-model:value="custom.minute" placeholder="0-59" />
        </n-form-item>
        <n-form-item label="时">
          <n-input v-model:value="custom.hour" placeholder="0-23" />
        </n-form-item>
        <n-form-item label="日">
          <n-input v-model:value="custom.day" placeholder="1-31" />
        </n-form-item>
        <n-form-item label="月">
          <n-input v-model:value="custom.month" placeholder="1-12" />
        </n-form-item>
        <n-form-item label="周">
          <n-input v-model:value="custom.week" placeholder="0-6 (0=周日)" />
        </n-form-item>
      </template>
    </n-form>
    <div class="result">
      <div class="label">Cron 表达式</div>
      <div class="expression">{{ cronExpression }}</div>
      <div class="description">{{ description }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { NForm, NFormItem, NRadioGroup, NRadio, NInput } from 'naive-ui'
const frequency = ref('day')
const custom = ref({ second: '0', minute: '0', hour: '0', day: '*', month: '*', week: '*' })
const cronExpression = computed(() => {
  if (frequency.value === 'second') return '* * * * * *'
  if (frequency.value === 'minute') return '0 * * * * *'
  if (frequency.value === 'hour') return '0 0 * * * *'
  if (frequency.value === 'day') return '0 0 0 * * *'
  if (frequency.value === 'week') return '0 0 0 * * 0'
  if (frequency.value === 'month') return '0 0 0 1 * *'
  if (frequency.value === 'year') return '0 0 0 1 1 *'
  return `${custom.value.second} ${custom.value.minute} ${custom.value.hour} ${custom.value.day} ${custom.value.month} ${custom.value.week}`
})
const description = computed(() => {
  if (frequency.value === 'second') return '每秒执行'
  if (frequency.value === 'minute') return '每分钟执行'
  if (frequency.value === 'hour') return '每小时执行'
  if (frequency.value === 'day') return '每天 00:00 执行'
  if (frequency.value === 'week') return '每周日 00:00 执行'
  if (frequency.value === 'month') return '每月 1 日 00:00 执行'
  if (frequency.value === 'year') return '每年 1 月 1 日 00:00 执行'
  return '自定义表达式'
})
</script>
<style scoped>
.cron-generator { max-width: 800px; margin: 0 auto; }
.result { margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px; }
.label { font-size: 14px; color: #666; margin-bottom: 8px; }
.expression { font-size: 24px; font-weight: bold; font-family: monospace; margin-bottom: 12px; }
.description { font-size: 16px; color: #333; }
</style>
