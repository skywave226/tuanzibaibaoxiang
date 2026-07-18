<template>
  <div class="unit-converter">
    <n-tabs v-model:value="activeCategory" type="segment" animated>
      <n-tab-pane v-for="cat in categories" :key="cat.key" :name="cat.key" :tab="cat.label">
        <div class="card">
          <div class="converter-row">
            <div class="input-group">
              <n-input-number v-model:value="values[cat.key]" placeholder="输入数值" :precision="6" />
              <n-select v-model:value="fromUnits[cat.key]" :options="unitOptions(cat.key)" />
            </div>

            <n-button quaternary circle class="swap-btn" @click="swap(cat.key)">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10h14l-4-4"/><path d="M17 14H3l4 4"/></svg>
            </n-button>

            <div class="input-group">
              <n-input :value="result(cat.key)" readonly placeholder="转换结果" />
              <n-select v-model:value="toUnits[cat.key]" :options="unitOptions(cat.key)" />
            </div>
          </div>

          <div class="actions mt-4">
            <n-button size="small" @click="copyResult(cat.key)">复制结果</n-button>
            <n-button size="small" @click="reset(cat.key)">重置</n-button>
          </div>

          <div class="formula mt-4 text-gray-500 text-sm" v-if="formula(cat.key)">
            换算关系：{{ formula(cat.key) }}
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NTabs, NTabPane, NInputNumber, NSelect, NInput, NButton, useMessage } from 'naive-ui'

const message = useMessage()

interface UnitDef {
  label: string
  factor: number
  offset?: number
}

interface CategoryDef {
  label: string
  base: string
  units: Record<string, UnitDef>
}

const categories: { key: string; label: string }[] = [
  { key: 'length', label: '长度' },
  { key: 'weight', label: '重量' },
  { key: 'temperature', label: '温度' },
  { key: 'area', label: '面积' },
  { key: 'volume', label: '体积' },
  { key: 'speed', label: '速度' },
  { key: 'time', label: '时间' },
  { key: 'data', label: '数据' },
  { key: 'pressure', label: '压强' },
  { key: 'energy', label: '能量' },
]

const defs: Record<string, CategoryDef> = {
  length: {
    label: '长度',
    base: 'm',
    units: {
      mm: { label: '毫米 (mm)', factor: 0.001 },
      cm: { label: '厘米 (cm)', factor: 0.01 },
      m: { label: '米 (m)', factor: 1 },
      km: { label: '千米 (km)', factor: 1000 },
      in: { label: '英寸 (in)', factor: 0.0254 },
      ft: { label: '英尺 (ft)', factor: 0.3048 },
      yd: { label: '码 (yd)', factor: 0.9144 },
      mi: { label: '英里 (mi)', factor: 1609.344 },
      nmi: { label: '海里 (nmi)', factor: 1852 },
      zhang: { label: '市丈', factor: 3.333333 },
      chi: { label: '市尺', factor: 0.333333 },
      cun: { label: '市寸', factor: 0.033333 },
    },
  },
  weight: {
    label: '重量',
    base: 'kg',
    units: {
      mg: { label: '毫克 (mg)', factor: 0.000001 },
      g: { label: '克 (g)', factor: 0.001 },
      kg: { label: '千克 (kg)', factor: 1 },
      t: { label: '吨 (t)', factor: 1000 },
      lb: { label: '磅 (lb)', factor: 0.453592 },
      oz: { label: '盎司 (oz)', factor: 0.02835 },
      jin: { label: '市斤', factor: 0.5 },
      liang: { label: '市两', factor: 0.05 },
    },
  },
  temperature: {
    label: '温度',
    base: 'C',
    units: {
      C: { label: '摄氏度 (°C)', factor: 1 },
      F: { label: '华氏度 (°F)', factor: 1, offset: 0 },
      K: { label: '开尔文 (K)', factor: 1, offset: 0 },
    },
  },
  area: {
    label: '面积',
    base: 'm2',
    units: {
      mm2: { label: '平方毫米 (mm²)', factor: 0.000001 },
      cm2: { label: '平方厘米 (cm²)', factor: 0.0001 },
      m2: { label: '平方米 (m²)', factor: 1 },
      ha: { label: '公顷 (ha)', factor: 10000 },
      km2: { label: '平方千米 (km²)', factor: 1000000 },
      ac: { label: '英亩 (ac)', factor: 4046.856 },
      sqft: { label: '平方英尺 (sq ft)', factor: 0.092903 },
      mu: { label: '亩', factor: 666.6667 },
    },
  },
  volume: {
    label: '体积',
    base: 'L',
    units: {
      mL: { label: '毫升 (mL)', factor: 0.001 },
      L: { label: '升 (L)', factor: 1 },
      m3: { label: '立方米 (m³)', factor: 1000 },
      gal: { label: '美制加仑 (gal)', factor: 3.78541 },
      qt: { label: '夸脱 (qt)', factor: 0.946353 },
      pt: { label: '品脱 (pt)', factor: 0.473176 },
      cup: { label: '杯 (cup)', factor: 0.236588 },
      floz: { label: '液盎司 (fl oz)', factor: 0.029574 },
    },
  },
  speed: {
    label: '速度',
    base: 'ms',
    units: {
      ms: { label: '米/秒 (m/s)', factor: 1 },
      kh: { label: '千米/时 (km/h)', factor: 0.277778 },
      mph: { label: '英里/时 (mph)', factor: 0.44704 },
      knot: { label: '节 (knot)', factor: 0.514444 },
      mach: { label: '马赫 (Mach)', factor: 340.3 },
    },
  },
  time: {
    label: '时间',
    base: 's',
    units: {
      ms: { label: '毫秒 (ms)', factor: 0.001 },
      s: { label: '秒 (s)', factor: 1 },
      min: { label: '分 (min)', factor: 60 },
      h: { label: '小时 (h)', factor: 3600 },
      d: { label: '天 (d)', factor: 86400 },
      w: { label: '周 (w)', factor: 604800 },
      mo: { label: '月 (30天)', factor: 2592000 },
      y: { label: '年 (365天)', factor: 31536000 },
    },
  },
  data: {
    label: '数据',
    base: 'B',
    units: {
      b: { label: '比特 (b)', factor: 0.125 },
      B: { label: '字节 (B)', factor: 1 },
      KB: { label: 'KB', factor: 1024 },
      MB: { label: 'MB', factor: 1048576 },
      GB: { label: 'GB', factor: 1073741824 },
      TB: { label: 'TB', factor: 1099511627776 },
      PB: { label: 'PB', factor: 1125899906842624 },
    },
  },
  pressure: {
    label: '压强',
    base: 'Pa',
    units: {
      Pa: { label: '帕斯卡 (Pa)', factor: 1 },
      kPa: { label: '千帕 (kPa)', factor: 1000 },
      MPa: { label: '兆帕 (MPa)', factor: 1000000 },
      bar: { label: '巴 (bar)', factor: 100000 },
      mbar: { label: '毫巴 (mbar)', factor: 100 },
      atm: { label: '标准大气压 (atm)', factor: 101325 },
      mmHg: { label: '毫米汞柱 (mmHg)', factor: 133.322 },
      psi: { label: '磅力/平方英寸 (psi)', factor: 6894.757 },
    },
  },
  energy: {
    label: '能量',
    base: 'J',
    units: {
      J: { label: '焦耳 (J)', factor: 1 },
      kJ: { label: '千焦 (kJ)', factor: 1000 },
      cal: { label: '卡路里 (cal)', factor: 4.184 },
      kcal: { label: '千卡 (kcal)', factor: 4184 },
      Wh: { label: '瓦时 (Wh)', factor: 3600 },
      kWh: { label: '千瓦时 (kWh)', factor: 3600000 },
      eV: { label: '电子伏特 (eV)', factor: 1.602177e-19 },
    },
  },
}

const activeCategory = ref('length')

const values = ref<Record<string, number | null>>({
  length: 1,
  weight: 1,
  temperature: 0,
  area: 1,
  volume: 1,
  speed: 1,
  time: 1,
  data: 1,
  pressure: 1,
  energy: 1,
})

const fromUnits = ref<Record<string, string>>({
  length: 'm',
  weight: 'kg',
  temperature: 'C',
  area: 'm2',
  volume: 'L',
  speed: 'ms',
  time: 's',
  data: 'B',
  pressure: 'Pa',
  energy: 'J',
})

const toUnits = ref<Record<string, string>>({
  length: 'cm',
  weight: 'g',
  temperature: 'F',
  area: 'cm2',
  volume: 'mL',
  speed: 'kh',
  time: 'min',
  data: 'KB',
  pressure: 'kPa',
  energy: 'kcal',
})

function unitOptions(key: string) {
  const cat = defs[key]
  return Object.entries(cat.units).map(([value, def]) => ({ label: def.label, value }))
}

function convertTemperature(value: number, from: string, to: string): number {
  let celsius = value
  if (from === 'F') celsius = (value - 32) * 5 / 9
  else if (from === 'K') celsius = value - 273.15

  if (to === 'C') return celsius
  if (to === 'F') return celsius * 9 / 5 + 32
  return celsius + 273.15
}

function result(key: string): string {
  const value = values.value[key]
  if (value === null || value === undefined || Number.isNaN(value)) return ''

  const from = fromUnits.value[key]
  const to = toUnits.value[key]
  if (from === to) return value.toString()

  if (key === 'temperature') {
    return convertTemperature(value, from, to).toFixed(4).replace(/\.?0+$/, '')
  }

  const cat = defs[key]
  const fromFactor = cat.units[from].factor
  const toFactor = cat.units[to].factor
  const baseValue = value * fromFactor
  const res = baseValue / toFactor

  if (res === 0) return '0'
  if (Math.abs(res) >= 1e9 || (Math.abs(res) < 1e-6 && Math.abs(res) > 0)) {
    return res.toExponential(6)
  }
  return Number(res.toFixed(6)).toString()
}

function swap(key: string) {
  const temp = fromUnits.value[key]
  fromUnits.value[key] = toUnits.value[key]
  toUnits.value[key] = temp
}

function reset(key: string) {
  values.value[key] = 1
  fromUnits.value[key] = defs[key].base
  toUnits.value[key] = Object.keys(defs[key].units).find(k => k !== defs[key].base) || defs[key].base
}

function copyResult(key: string) {
  navigator.clipboard.writeText(`${values.value[key]} ${defs[key].units[fromUnits.value[key]].label} = ${result(key)} ${defs[key].units[toUnits.value[key]].label}`)
  message.success('已复制')
}

function formula(key: string): string {
  if (key === 'temperature') return '温度使用线性换算'
  const from = fromUnits.value[key]
  const to = toUnits.value[key]
  if (from === to) return ''
  const cat = defs[key]
  const rate = cat.units[from].factor / cat.units[to].factor
  return `1 ${cat.units[from].label.split(' ')[0]} ≈ ${Number(rate.toPrecision(6))} ${cat.units[to].label.split(' ')[0]}`
}
</script>

<style scoped>
.unit-converter { max-width: 900px; margin: 0 auto; }

.converter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.input-group {
  flex: 1;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.swap-btn {
  flex-shrink: 0;
}

.actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 640px) {
  .converter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .swap-btn {
    align-self: center;
    transform: rotate(90deg);
  }
}
</style>
