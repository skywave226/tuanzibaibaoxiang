<template>
  <div class="unit-converter">
    <n-tabs type="segment" animated>
      <n-tab-pane name="length" tab="长度">
        <div class="converter">
          <n-input-number v-model:value="lengthValue" placeholder="输入数值" />
          <n-select v-model:value="lengthFrom" :options="lengthUnits" style="width: 120px" />
          <span class="arrow">→</span>
          <n-select v-model:value="lengthTo" :options="lengthUnits" style="width: 120px" />
          <div class="result">{{ lengthResult }}</div>
        </div>
      </n-tab-pane>
      
      <n-tab-pane name="weight" tab="重量">
        <div class="converter">
          <n-input-number v-model:value="weightValue" placeholder="输入数值" />
          <n-select v-model:value="weightFrom" :options="weightUnits" style="width: 120px" />
          <span class="arrow">→</span>
          <n-select v-model:value="weightTo" :options="weightUnits" style="width: 120px" />
          <div class="result">{{ weightResult }}</div>
        </div>
      </n-tab-pane>
      
      <n-tab-pane name="temperature" tab="温度">
        <div class="converter">
          <n-input-number v-model:value="tempValue" placeholder="输入数值" />
          <n-select v-model:value="tempFrom" :options="tempUnits" style="width: 120px" />
          <span class="arrow">→</span>
          <n-select v-model:value="tempTo" :options="tempUnits" style="width: 120px" />
          <div class="result">{{ tempResult }}</div>
        </div>
      </n-tab-pane>
      
      <n-tab-pane name="area" tab="面积">
        <div class="converter">
          <n-input-number v-model:value="areaValue" placeholder="输入数值" />
          <n-select v-model:value="areaFrom" :options="areaUnits" style="width: 120px" />
          <span class="arrow">→</span>
          <n-select v-model:value="areaTo" :options="areaUnits" style="width: 120px" />
          <div class="result">{{ areaResult }}</div>
        </div>
      </n-tab-pane>
      
      <n-tab-pane name="volume" tab="体积">
        <div class="converter">
          <n-input-number v-model:value="volumeValue" placeholder="输入数值" />
          <n-select v-model:value="volumeFrom" :options="volumeUnits" style="width: 120px" />
          <span class="arrow">→</span>
          <n-select v-model:value="volumeTo" :options="volumeUnits" style="width: 120px" />
          <div class="result">{{ volumeResult }}</div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NTabs, NTabPane, NInputNumber, NSelect } from 'naive-ui'

const lengthValue = ref(1)
const lengthFrom = ref('m')
const lengthTo = ref('cm')

const weightValue = ref(1)
const weightFrom = ref('kg')
const weightTo = ref('g')

const tempValue = ref(0)
const tempFrom = ref('C')
const tempTo = ref('F')

const areaValue = ref(1)
const areaFrom = ref('m2')
const areaTo = ref('cm2')

const volumeValue = ref(1)
const volumeFrom = ref('L')
const volumeTo = ref('mL')

const lengthUnits = [
  { label: '毫米 (mm)', value: 'mm' },
  { label: '厘米 (cm)', value: 'cm' },
  { label: '米 (m)', value: 'm' },
  { label: '千米 (km)', value: 'km' },
  { label: '英寸 (in)', value: 'in' },
  { label: '英尺 (ft)', value: 'ft' },
]

const weightUnits = [
  { label: '毫克 (mg)', value: 'mg' },
  { label: '克 (g)', value: 'g' },
  { label: '千克 (kg)', value: 'kg' },
  { label: '吨 (t)', value: 't' },
]

const tempUnits = [
  { label: '摄氏度 (°C)', value: 'C' },
  { label: '华氏度 (°F)', value: 'F' },
  { label: '开尔文 (K)', value: 'K' },
]

const areaUnits = [
  { label: '平方毫米 (mm²)', value: 'mm2' },
  { label: '平方厘米 (cm²)', value: 'cm2' },
  { label: '平方米 (m²)', value: 'm2' },
  { label: '公顷 (ha)', value: 'ha' },
  { label: '平方千米 (km²)', value: 'km2' },
]

const volumeUnits = [
  { label: '毫升 (mL)', value: 'mL' },
  { label: '升 (L)', value: 'L' },
  { label: '立方米 (m³)', value: 'm3' },
]

const lengthResult = computed(() => {
  if (!lengthValue.value) return ''
  const toMm: Record<string, number> = { mm: 1, cm: 10, m: 1000, km: 1000000, in: 25.4, ft: 304.8 }
  const mm = lengthValue.value * toMm[lengthFrom.value]
  return (mm / toMm[lengthTo.value]).toFixed(4)
})

const weightResult = computed(() => {
  if (!weightValue.value) return ''
  const toMg: Record<string, number> = { mg: 1, g: 1000, kg: 1000000, t: 1000000000 }
  const mg = weightValue.value * toMg[weightFrom.value]
  return (mg / toMg[weightTo.value]).toFixed(4)
})

const tempResult = computed(() => {
  if (tempValue.value === null) return ''
  let celsius = 0
  if (tempFrom.value === 'C') celsius = tempValue.value
  else if (tempFrom.value === 'F') celsius = (tempValue.value - 32) * 5 / 9
  else celsius = tempValue.value - 273.15
  
  if (tempTo.value === 'C') return celsius.toFixed(2)
  if (tempTo.value === 'F') return (celsius * 9 / 5 + 32).toFixed(2)
  return (celsius + 273.15).toFixed(2)
})

const areaResult = computed(() => {
  if (!areaValue.value) return ''
  const toMm2: Record<string, number> = { mm2: 1, cm2: 100, m2: 1000000, ha: 10000000000, km2: 1000000000000 }
  const mm2 = areaValue.value * toMm2[areaFrom.value]
  return (mm2 / toMm2[areaTo.value]).toFixed(4)
})

const volumeResult = computed(() => {
  if (!volumeValue.value) return ''
  const toMl: Record<string, number> = { mL: 1, L: 1000, m3: 1000000 }
  const ml = volumeValue.value * toMl[volumeFrom.value]
  return (ml / toMl[volumeTo.value]).toFixed(4)
})
</script>

<style scoped>
.unit-converter { max-width: 800px; margin: 0 auto; }
.converter { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.arrow { font-size: 20px; color: #999; }
.result { margin-top: 16px; font-size: 18px; font-weight: 500; color: #1890ff; }
</style>
