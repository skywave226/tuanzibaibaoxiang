<template>
  <div class="unit-converter-edu">
    <n-tabs type="segment" animated v-model:value="activeTab">
      <n-tab-pane v-for="cat in categories" :key="cat.key" :name="cat.key" :tab="cat.label">
        <div class="converter">
          <div class="input-group">
          <n-input-number v-model:value="values[cat.key]" placeholder="输入数值" />
          <n-select v-model:value="fromUnits[cat.key]" :options="(cat.options as any)" />
          </div>
          <n-button circle quaternary class="swap-btn" @click="swap(cat.key)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 7 12 3 16 7"/><polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
          </n-button>
          <div class="input-group">
            <n-input :value="resultText(cat.key)" readonly placeholder="换算结果" />
            <n-select v-model:value="toUnits[cat.key]" :options="(cat.options as any)" />
          </div>
        </div>
        <div class="formula" v-if="formulaText(cat.key)">{{ formulaText(cat.key) }}</div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NTabs, NTabPane, NInputNumber, NSelect, NInput, NButton } from 'naive-ui'

type CategoryKey = 'length' | 'weight' | 'temperature' | 'time' | 'area' | 'volume' | 'speed' | 'data'

interface UnitOption {
  label: string
  value: string
}

interface Category {
  key: CategoryKey
  label: string
  options: UnitOption[]
  toBase: Record<string, number>
  fromBase?: (val: number, unit: string) => number
}

const activeTab = ref<CategoryKey>('length')

const values = reactive<Record<CategoryKey, number | null>>({
  length: 1,
  weight: 1,
  temperature: 0,
  time: 1,
  area: 1,
  volume: 1,
  speed: 1,
  data: 1,
})

const fromUnits = reactive<Record<CategoryKey, string>>({
  length: 'm',
  weight: 'kg',
  temperature: 'C',
  time: 'min',
  area: 'm2',
  volume: 'L',
  speed: 'kmh',
  data: 'MB',
})

const toUnits = reactive<Record<CategoryKey, string>>({
  length: 'cm',
  weight: 'g',
  temperature: 'F',
  time: 's',
  area: 'cm2',
  volume: 'mL',
  speed: 'ms',
  data: 'KB',
})

const categories: Category[] = [
  {
    key: 'length',
    label: '长度',
    options: [
      { label: '毫米 (mm)', value: 'mm' },
      { label: '厘米 (cm)', value: 'cm' },
      { label: '分米 (dm)', value: 'dm' },
      { label: '米 (m)', value: 'm' },
      { label: '千米 (km)', value: 'km' },
      { label: '英寸 (in)', value: 'in' },
      { label: '英尺 (ft)', value: 'ft' },
      { label: '码 (yd)', value: 'yd' },
      { label: '英里 (mi)', value: 'mi' },
    ],
    toBase: { mm: 0.001, cm: 0.01, dm: 0.1, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
  },
  {
    key: 'weight',
    label: '质量',
    options: [
      { label: '毫克 (mg)', value: 'mg' },
      { label: '克 (g)', value: 'g' },
      { label: '千克 (kg)', value: 'kg' },
      { label: '吨 (t)', value: 't' },
      { label: '磅 (lb)', value: 'lb' },
      { label: '盎司 (oz)', value: 'oz' },
    ],
    toBase: { mg: 0.000001, g: 0.001, kg: 1, t: 1000, lb: 0.45359237, oz: 0.0283495 },
  },
  {
    key: 'temperature',
    label: '温度',
    options: [
      { label: '摄氏度 (°C)', value: 'C' },
      { label: '华氏度 (°F)', value: 'F' },
      { label: '开尔文 (K)', value: 'K' },
    ],
    toBase: { C: 1, F: 1, K: 1 },
    fromBase: (val: number, unit: string) => {
      if (unit === 'C') return val
      if (unit === 'F') return val * 9 / 5 + 32
      return val + 273.15
    },
  },
  {
    key: 'time',
    label: '时间',
    options: [
      { label: '毫秒 (ms)', value: 'ms' },
      { label: '秒 (s)', value: 's' },
      { label: '分钟 (min)', value: 'min' },
      { label: '小时 (h)', value: 'h' },
      { label: '天 (d)', value: 'd' },
      { label: '周 (wk)', value: 'wk' },
    ],
    toBase: { ms: 0.001, s: 1, min: 60, h: 3600, d: 86400, wk: 604800 },
  },
  {
    key: 'area',
    label: '面积',
    options: [
      { label: '平方毫米 (mm²)', value: 'mm2' },
      { label: '平方厘米 (cm²)', value: 'cm2' },
      { label: '平方米 (m²)', value: 'm2' },
      { label: '公顷 (ha)', value: 'ha' },
      { label: '平方千米 (km²)', value: 'km2' },
      { label: '亩', value: 'mu' },
    ],
    toBase: { mm2: 0.000001, cm2: 0.0001, m2: 1, ha: 10000, km2: 1000000, mu: 666.6667 },
  },
  {
    key: 'volume',
    label: '体积',
    options: [
      { label: '毫升 (mL)', value: 'mL' },
      { label: '升 (L)', value: 'L' },
      { label: '立方米 (m³)', value: 'm3' },
      { label: '立方厘米 (cm³)', value: 'cm3' },
      { label: '加仑 (US gal)', value: 'gal' },
    ],
    toBase: { mL: 0.001, L: 1, m3: 1000, cm3: 0.001, gal: 3.78541 },
  },
  {
    key: 'speed',
    label: '速度',
    options: [
      { label: '米/秒 (m/s)', value: 'ms' },
      { label: '千米/时 (km/h)', value: 'kmh' },
      { label: '英里/时 (mph)', value: 'mph' },
      { label: '节 (kn)', value: 'kn' },
    ],
    toBase: { ms: 1, kmh: 0.277778, mph: 0.44704, kn: 0.514444 },
  },
  {
    key: 'data',
    label: '数据',
    options: [
      { label: '位 (bit)', value: 'bit' },
      { label: '字节 (B)', value: 'B' },
      { label: '千字节 (KB)', value: 'KB' },
      { label: '兆字节 (MB)', value: 'MB' },
      { label: '吉字节 (GB)', value: 'GB' },
      { label: '太字节 (TB)', value: 'TB' },
    ],
    toBase: { bit: 0.125, B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
  },
]

function convert(catKey: CategoryKey, value: number | null): number | null {
  if (value === null || Number.isNaN(value)) return null
  const cat = categories.find(c => c.key === catKey)!
  const from = fromUnits[catKey]
  const to = toUnits[catKey]
  if (catKey === 'temperature') {
    let celsius = value
    if (from === 'F') celsius = (value - 32) * 5 / 9
    else if (from === 'K') celsius = value - 273.15
    if (cat.fromBase) return cat.fromBase(celsius, to)
    return celsius
  }
  const base = value * cat.toBase[from]
  return base / cat.toBase[to]
}

function resultText(catKey: CategoryKey): string {
  const v = convert(catKey, values[catKey])
  if (v === null) return ''
  return Number.isInteger(v) ? v.toString() : v.toFixed(6)
}

function formulaText(catKey: CategoryKey): string {
  const cat = categories.find(c => c.key === catKey)!
  const from = fromUnits[catKey]
  const to = toUnits[catKey]
  if (catKey === 'temperature') {
    if (from === to) return '相同单位，数值不变'
    if (from === 'C' && to === 'F') return '°F = °C × 9/5 + 32'
    if (from === 'F' && to === 'C') return '°C = (°F - 32) × 5/9'
    if (from === 'C' && to === 'K') return 'K = °C + 273.15'
    if (from === 'K' && to === 'C') return '°C = K - 273.15'
    return '通过摄氏度进行中间换算'
  }
  const rate = cat.toBase[from] / cat.toBase[to]
  return `1 ${from} = ${rate.toExponential(4)} ${to}`
}

function swap(catKey: CategoryKey): void {
  const tmp = fromUnits[catKey]
  fromUnits[catKey] = toUnits[catKey]
  toUnits[catKey] = tmp
}
</script>

<style scoped>
.unit-converter-edu {
  max-width: 800px;
  margin: 0 auto;
}

.converter {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 0;
}

.input-group {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 240px;
}

.swap-btn {
  flex-shrink: 0;
  font-size: 18px;
}

.formula {
  margin-top: 16px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
}

.dark .formula {
  background: rgba(255, 255, 255, 0.04);
  color: #aaa;
}
</style>
