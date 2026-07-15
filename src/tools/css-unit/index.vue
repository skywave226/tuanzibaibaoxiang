<template>
  <div class="css-unit">
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">基准设置</h3>
      <div class="config-section">
        <div class="config-item">
          <label>根字号（html font-size）</label>
          <n-input-number v-model:value="rootFontSize" :min="1" :max="100" :step="1">
            <template #suffix>px</template>
          </n-input-number>
        </div>
        <div class="config-item">
          <label>视口宽度</label>
          <n-input-number v-model:value="viewportWidth" :min="1" :step="10">
            <template #suffix>px</template>
          </n-input-number>
        </div>
        <div class="config-item">
          <label>视口高度</label>
          <n-input-number v-model:value="viewportHeight" :min="1" :step="10">
            <template #suffix>px</template>
          </n-input-number>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">单位转换</h3>
      <div class="convert-area">
        <div class="convert-input">
          <n-input-number
            v-model:value="inputValue"
            :step="0.1"
            placeholder="数值"
            style="width: 100%"
          />
          <n-select
            v-model:value="fromUnit"
            :options="unitOptions"
            style="width: 120px"
          />
        </div>
      </div>

      <div class="results mt-4">
        <div v-for="unit in units" :key="unit.key" class="result-item">
          <div class="result-label">{{ unit.label }}</div>
          <div class="result-value" @click="copy(unit.key, convert(inputValue, fromUnit, unit.key))">
            {{ formatNumber(convert(inputValue, fromUnit, unit.key)) }}{{ unit.key }}
            <span class="copy-hint">点击复制</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">转换公式</h3>
      <n-space vertical size="small">
        <div v-for="formula in formulas" :key="formula.name" class="formula-row">
          <span class="text-sm text-gray-500 w-16">{{ formula.name }}</span>
          <span class="text-sm font-mono">{{ formula.desc }}</span>
        </div>
      </n-space>
    </div>

    <div class="card">
      <h3 class="text-sm font-bold mb-3">常用换算参考</h3>
      <n-data-table
        :columns="tableColumns"
        :data="tableData"
        :bordered="false"
        :single-line="false"
        size="small"
      />
    </div>

    <n-alert type="info" class="mt-4" v-if="copiedValue">
      已复制：{{ copiedValue }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInputNumber, NSelect, NSpace, NDataTable, NAlert } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const rootFontSize = ref(16)
const viewportWidth = ref(1920)
const viewportHeight = ref(1080)
const inputValue = ref(16)
const fromUnit = ref('px')
const copiedValue = ref('')

const units = [
  { key: 'px', label: '像素 (px)' },
  { key: 'rem', label: '根字号 (rem)' },
  { key: 'em', label: '相对字号 (em)' },
  { key: 'vw', label: '视口宽度 (vw)' },
  { key: 'vh', label: '视口高度 (vh)' },
  { key: 'vmin', label: '视口最小值 (vmin)' },
  { key: 'vmax', label: '视口最大值 (vmax)' },
  { key: 'pt', label: '磅 (pt)' },
  { key: 'mm', label: '毫米 (mm)' },
  { key: 'cm', label: '厘米 (cm)' },
  { key: 'in', label: '英寸 (in)' },
  { key: '%', label: '百分比 (%)' },
]

const unitOptions = units.map(u => ({ label: u.label, value: u.key }))

const formulas = [
  { name: 'rem', desc: 'px ÷ 根字号 = rem' },
  { name: 'em', desc: 'px ÷ 当前字号 = em（默认按根字号计算）' },
  { name: 'vw', desc: 'px ÷ 视口宽度 × 100 = vw' },
  { name: 'vh', desc: 'px ÷ 视口高度 × 100 = vh' },
  { name: 'vmin', desc: 'px ÷ min(视口宽,高) × 100 = vmin' },
  { name: 'vmax', desc: 'px ÷ max(视口宽,高) × 100 = vmax' },
  { name: 'pt', desc: 'px × 72/96 = pt（1pt = 1/72 in）' },
  { name: 'mm', desc: 'px × 25.4/96 = mm' },
  { name: 'cm', desc: 'px × 2.54/96 = cm' },
  { name: 'in', desc: 'px ÷ 96 = in（1in = 96px）' },
  { name: '%', desc: 'px ÷ 父元素宽度 × 100 = %（按视口宽度计算）' },
]

// 任意单位 → px
function toPx(value: number, unit: string): number {
  switch (unit) {
    case 'px': return value
    case 'rem': return value * rootFontSize.value
    case 'em': return value * rootFontSize.value
    case 'vw': return value * viewportWidth.value / 100
    case 'vh': return value * viewportHeight.value / 100
    case 'vmin': return value * Math.min(viewportWidth.value, viewportHeight.value) / 100
    case 'vmax': return value * Math.max(viewportWidth.value, viewportHeight.value) / 100
    case 'pt': return value * 96 / 72
    case 'mm': return value * 96 / 25.4
    case 'cm': return value * 96 / 2.54
    case 'in': return value * 96
    case '%': return value * viewportWidth.value / 100
    default: return value
  }
}

// px → 任意单位
function fromPx(px: number, unit: string): number {
  switch (unit) {
    case 'px': return px
    case 'rem': return px / rootFontSize.value
    case 'em': return px / rootFontSize.value
    case 'vw': return px * 100 / viewportWidth.value
    case 'vh': return px * 100 / viewportHeight.value
    case 'vmin': return px * 100 / Math.min(viewportWidth.value, viewportHeight.value)
    case 'vmax': return px * 100 / Math.max(viewportWidth.value, viewportHeight.value)
    case 'pt': return px * 72 / 96
    case 'mm': return px * 25.4 / 96
    case 'cm': return px * 2.54 / 96
    case 'in': return px / 96
    case '%': return px * 100 / viewportWidth.value
    default: return px
  }
}

function convert(value: number, from: string, to: string): number {
  if (!value) return 0
  const px = toPx(value, from)
  return fromPx(px, to)
}

function formatNumber(n: number): string {
  if (n === 0) return '0'
  if (Math.abs(n) < 0.01) return n.toExponential(2)
  if (Math.abs(n) >= 1000) return n.toFixed(0)
  if (Math.abs(n) >= 1) return n.toFixed(2)
  return n.toFixed(4)
}

function copy(unit: string, value: number) {
  const text = `${formatNumber(value)}${unit}`
  navigator.clipboard.writeText(text)
  copiedValue.value = text
  setTimeout(() => { copiedValue.value = '' }, 2000)
}

interface TableData {
  px: number
  rem: string
  vw: string
  pt: string
  mm: string
}

const tableColumns: DataTableColumns<TableData> = [
  { title: 'px', key: 'px', width: 80 },
  { title: 'rem', key: 'rem', width: 100 },
  { title: `vw (${viewportWidth.value}px)`, key: 'vw', width: 120 },
  { title: 'pt', key: 'pt', width: 100 },
  { title: 'mm', key: 'mm' },
]

const tableData = computed<TableData[]>(() => {
  const baseValues = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64]
  return baseValues.map(px => ({
    px,
    rem: formatNumber(fromPx(px, 'rem')) + 'rem',
    vw: formatNumber(fromPx(px, 'vw')) + 'vw',
    pt: formatNumber(fromPx(px, 'pt')) + 'pt',
    mm: formatNumber(fromPx(px, 'mm')) + 'mm',
  }))
})
</script>

<style scoped>
.css-unit {
  max-width: 900px;
  margin: 0 auto;
}

.config-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label {
  color: #aaa;
}

.convert-input {
  display: flex;
  gap: 12px;
  align-items: center;
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.result-item {
  padding: 12px;
  border-radius: 8px;
  background: #f5f5f5;
  transition: all 0.2s;
  cursor: pointer;
}

.result-item:hover {
  background: #e8f5e9;
  transform: translateY(-1px);
}

.dark .result-item {
  background: #1e2a4a;
}

.dark .result-item:hover {
  background: #1a3a2a;
}

.result-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.result-value {
  font-size: 16px;
  font-weight: 600;
  font-family: 'Fira Code', 'Consolas', monospace;
  color: #36ad6a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dark .result-value {
  color: #63e2b7;
}

.copy-hint {
  font-size: 10px;
  color: #aaa;
  font-weight: 400;
  font-family: -apple-system, sans-serif;
}

.formula-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
