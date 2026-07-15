<template>
  <div class="number-base-converter">
    <div class="card mb-4">
      <div class="input-group">
        <div class="input-label">输入数值</div>
        <n-input v-model:value="input" placeholder="输入数字" @input="convert" />
      </div>
      <div class="input-group mt-3">
        <div class="input-label">输入进制</div>
        <n-radio-group v-model:value="fromBase" @update:value="convert">
          <n-radio-button :value="2">二进制</n-radio-button>
          <n-radio-button :value="8">八进制</n-radio-button>
          <n-radio-button :value="10">十进制</n-radio-button>
          <n-radio-button :value="16">十六进制</n-radio-button>
        </n-radio-group>
      </div>
      <n-tag v-if="errorMsg" type="error" class="mt-2">{{ errorMsg }}</n-tag>
    </div>

    <div class="results-grid">
      <div class="result-card card">
        <div class="result-label">二进制 (2)</div>
        <div class="result-value font-mono">{{ results.binary }}</div>
        <n-button text size="tiny" @click="copy(results.binary)">复制</n-button>
      </div>
      <div class="result-card card">
        <div class="result-label">八进制 (8)</div>
        <div class="result-value font-mono">{{ results.octal }}</div>
        <n-button text size="tiny" @click="copy(results.octal)">复制</n-button>
      </div>
      <div class="result-card card">
        <div class="result-label">十进制 (10)</div>
        <div class="result-value font-mono">{{ results.decimal }}</div>
        <n-button text size="tiny" @click="copy(results.decimal)">复制</n-button>
      </div>
      <div class="result-card card">
        <div class="result-label">十六进制 (16)</div>
        <div class="result-value font-mono">{{ results.hex }}</div>
        <n-button text size="tiny" @click="copy(results.hex)">复制</n-button>
      </div>
    </div>

    <div class="card mt-4">
      <h3 class="font-bold mb-2">常用进制对照</h3>
      <n-data-table :columns="columns" :data="commonNumbers" :bordered="false" size="small" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NInput, NRadioGroup, NRadioButton, NTag, NButton, NDataTable, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const message = useMessage()
const input = ref('')
const fromBase = ref(10)
const errorMsg = ref('')

const results = reactive({
  binary: '',
  octal: '',
  decimal: '',
  hex: '',
})

function convert() {
  const val = input.value.trim()
  if (!val) {
    results.binary = ''
    results.octal = ''
    results.decimal = ''
    results.hex = ''
    errorMsg.value = ''
    return
  }

  try {
    const num = parseInt(val, fromBase.value)
    if (isNaN(num)) {
      errorMsg.value = '无效的数字'
      return
    }

    results.binary = num.toString(2)
    results.octal = num.toString(8)
    results.decimal = num.toString(10)
    results.hex = num.toString(16).toUpperCase()
    errorMsg.value = ''
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
  }
}

function copy(text: string) {
  if (text) {
    navigator.clipboard.writeText(text)
    message.success('已复制')
  }
}

const columns: DataTableColumns = [
  { title: '十进制', key: 'decimal' },
  { title: '二进制', key: 'binary' },
  { title: '八进制', key: 'octal' },
  { title: '十六进制', key: 'hex' },
]

const commonNumbers = [
  { decimal: '0', binary: '0', octal: '0', hex: '0' },
  { decimal: '10', binary: '1010', octal: '12', hex: 'A' },
  { decimal: '16', binary: '10000', octal: '20', hex: '10' },
  { decimal: '100', binary: '1100100', octal: '144', hex: '64' },
  { decimal: '255', binary: '11111111', octal: '377', hex: 'FF' },
  { decimal: '256', binary: '100000000', octal: '400', hex: '100' },
]
</script>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.result-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
}

.result-value {
  font-size: 16px;
  word-break: break-all;
  min-height: 24px;
}

@media (max-width: 768px) {
  .results-grid {
    grid-template-columns: 1fr;
  }
}
</style>
