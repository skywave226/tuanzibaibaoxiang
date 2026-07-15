<template>
  <div class="bmi-calculator">
    <div class="input-section">
      <div>
        <label>身高 (cm)</label>
        <n-input-number v-model:value="height" :min="50" :max="250" />
      </div>
      <div>
        <label>体重 (kg)</label>
        <n-input-number v-model:value="weight" :min="10" :max="300" />
      </div>
    </div>
    <div class="result" v-if="bmi">
      <div class="bmi-value">{{ bmi.value }}</div>
      <div class="bmi-category" :style="{ color: bmi.color }">{{ bmi.category }}</div>
      <div class="bmi-scale">
        <div class="scale-bar">
          <div class="indicator" :style="{ left: bmi.position + '%' }"></div>
        </div>
        <div class="scale-labels">
          <span>偏瘦</span><span>正常</span><span>偏胖</span><span>肥胖</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInputNumber } from 'naive-ui'
const height = ref(170)
const weight = ref(65)
const bmi = computed(() => {
  if (!height.value || !weight.value) return null
  const heightM = height.value / 100
  const value = (weight.value / (heightM * heightM)).toFixed(1)
  const bmiNum = parseFloat(value)
  let category = '', color = '', position = 0
  if (bmiNum < 18.5) { category = '偏瘦'; color = '#18a058'; position = (bmiNum / 18.5) * 25 }
  else if (bmiNum < 24) { category = '正常'; color = '#2080f0'; position = 25 + ((bmiNum - 18.5) / 5.5) * 25 }
  else if (bmiNum < 28) { category = '偏胖'; color = '#f0a020'; position = 50 + ((bmiNum - 24) / 4) * 25 }
  else { category = '肥胖'; color = '#d03050'; position = 75 + Math.min((bmiNum - 28) / 4, 1) * 25 }
  return { value, category, color, position }
})
</script>
<style scoped>
.bmi-calculator { max-width: 600px; margin: 0 auto; }
.input-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.input-section label { display: block; margin-bottom: 8px; font-weight: 500; }
.result { text-align: center; margin-top: 30px; }
.bmi-value { font-size: 48px; font-weight: bold; margin-bottom: 10px; }
.bmi-category { font-size: 24px; margin-bottom: 30px; }
.bmi-scale { margin-top: 30px; }
.scale-bar { position: relative; height: 20px; background: linear-gradient(to right, #18a058 0%, #18a058 25%, #2080f0 25%, #2080f0 50%, #f0a020 50%, #f0a020 75%, #d03050 75%, #d03050 100%); border-radius: 10px; }
.indicator { position: absolute; top: -5px; width: 4px; height: 30px; background: #333; border-radius: 2px; transform: translateX(-50%); }
.scale-labels { display: flex; justify-content: space-between; margin-top: 10px; font-size: 14px; color: #666; }
</style>
