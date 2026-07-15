<template>
  <div class="memory-unit-converter">
    <!-- 输入区 -->
    <div class="input-section">
      <div class="input-row">
        <n-form-item label="输入数值" class="value-input">
          <n-input-number
            v-model:value="inputValue"
            :min="0"
            :step="1"
            placeholder="请输入数值"
            style="width: 100%"
            clearable
          />
        </n-form-item>
        <n-form-item label="源单位" class="unit-input">
          <n-select v-model:value="inputUnit" :options="unitOptions" style="width: 100%" />
        </n-form-item>
      </div>
      <n-space>
        <n-button v-for="preset in presets" :key="preset.label" quaternary size="small" @click="applyPreset(preset)">
          {{ preset.label }}
        </n-button>
      </n-space>
    </div>

    <!-- 结果表格 -->
    <div class="result-section">
      <n-data-table
        :columns="columns"
        :data="conversionResults"
        :bordered="false"
        :single-line="false"
        size="medium"
      />
    </div>

    <!-- 单位说明 -->
    <div class="info-section">
      <n-divider>单位说明</n-divider>
      <n-alert type="info" :bordered="false">
        <b>十进制（SI）</b>：KB=1000B, MB=1000KB, GB=1000MB... 常用于硬盘厂商、网络传输速率。<br />
        <b>二进制（IEC）</b>：KiB=1024B, MiB=1024KiB, GiB=1024MiB... 常用于内存、操作系统显示。<br />
        <b>1 字节(Byte) = 8 位(Bit)</b>。注意 Bit 与 Byte 的区别，网络带宽常用 bit/s，存储容量常用 Byte。
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInputNumber, NSelect, NFormItem, NSpace, NButton, NDataTable, NDivider, NAlert } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

// 单位定义：名称、符号、每单位对应的 bit 数（使用 BigInt 保证大数精度）
interface UnitDef {
  label: string
  symbol: string
  bitsPerUnit: bigint
  type: 'decimal' | 'binary' | 'base'
}

// 各单位对应的 bit 数
const unitDefs: UnitDef[] = [
  { label: 'Bit (位)', symbol: 'bit', bitsPerUnit: 1n, type: 'base' },
  { label: 'Byte (字节)', symbol: 'B', bitsPerUnit: 8n, type: 'base' },
  { label: 'KB (千字节)', symbol: 'KB', bitsPerUnit: 8_000n, type: 'decimal' },
  { label: 'MB (兆字节)', symbol: 'MB', bitsPerUnit: 8_000_000n, type: 'decimal' },
  { label: 'GB (吉字节)', symbol: 'GB', bitsPerUnit: 8_000_000_000n, type: 'decimal' },
  { label: 'TB (太字节)', symbol: 'TB', bitsPerUnit: 8_000_000_000_000n, type: 'decimal' },
  { label: 'PB (拍字节)', symbol: 'PB', bitsPerUnit: 8_000_000_000_000_000n, type: 'decimal' },
  { label: 'KiB (千二进制字节)', symbol: 'KiB', bitsPerUnit: 8_192n, type: 'binary' },
  { label: 'MiB (兆二进制字节)', symbol: 'MiB', bitsPerUnit: 8_388_608n, type: 'binary' },
  { label: 'GiB (吉二进制字节)', symbol: 'GiB', bitsPerUnit: 8_589_934_592n, type: 'binary' },
  { label: 'TiB (太二进制字节)', symbol: 'TiB', bitsPerUnit: 8_796_093_022_208n, type: 'binary' },
  { label: 'PiB (拍二进制字节)', symbol: 'PiB', bitsPerUnit: 9_007_199_254_740_992n, type: 'binary' },
]

const unitOptions = unitDefs.map((u, _i) => ({
  label: `${u.symbol} - ${u.label}`,
  value: u.symbol,
}))

const inputValue = ref<number | null>(1)
const inputUnit = ref<string>('GB')

// 预设
const presets = [
  { label: '1 GB', value: 1, unit: 'GB' },
  { label: '500 MB', value: 500, unit: 'MB' },
  { label: '1 TiB', value: 1, unit: 'TiB' },
  { label: '8 GB (内存)', value: 8, unit: 'GB' },
  { label: '1024 MiB', value: 1024, unit: 'MiB' },
]

function applyPreset(preset: { value: number; unit: string; label: string }) {
  inputValue.value = preset.value
  inputUnit.value = preset.unit
}

// 将输入值转换为 bits（使用 BigInt）
const totalBits = computed<bigint>(() => {
  if (inputValue.value === null || isNaN(inputValue.value as number)) return 0n
  // 处理小数：将整数部分与小数部分分开计算
  const intPart = Math.floor(inputValue.value)
  const fracPart = inputValue.value - intPart
  const unit = unitDefs.find(u => u.symbol === inputUnit.value)
  if (!unit) return 0n
  // 整数部分直接 BigInt
  const intBits = unit.bitsPerUnit * BigInt(intPart)
  // 小数部分：转为更高精度的整数计算（乘以 1e9 后再除）
  const fracBitsScaled = unit.bitsPerUnit * BigInt(Math.round(fracPart * 1e9)) / 1_000_000_000n
  return intBits + fracBitsScaled
})

// 格式化大数字显示（带千分位，保留有效小数）
function formatBigNumber(value: number): string {
  if (!isFinite(value)) return '—'
  if (value === 0) return '0'
  // 大于 0.001 用千分位格式
  if (Math.abs(value) >= 0.001) {
    // 根据大小决定小数位
    const abs = Math.abs(value)
    let str: string
    if (abs >= 1e12) str = value.toExponential(6)
    else if (abs >= 1) str = value.toLocaleString('en-US', { maximumFractionDigits: 6 })
    else str = value.toLocaleString('en-US', { maximumFractionDigits: 9 })
    return str
  }
  // 极小值用科学计数法
  return value.toExponential(4)
}

// 转换结果
interface ConversionRow {
  unit: string
  name: string
  type: string
  value: string
  isSource: boolean
}

const conversionResults = computed<ConversionRow[]>(() => {
  const bits = totalBits.value
  const sourceSymbol = inputUnit.value
  return unitDefs.map(u => {
    // bits / bitsPerUnit = 数值（带小数）
    // 使用 BigInt 除法得到整数部分，再单独算小数部分提高精度
    const intVal = bits / u.bitsPerUnit
    const remainder = bits % u.bitsPerUnit
    // 小数部分：remainder / bitsPerUnit，放大 1e9 计算
    const fracVal = Number(remainder * 1_000_000_000n / u.bitsPerUnit) / 1e9
    const value = Number(intVal) + fracVal
    const typeLabel = u.type === 'decimal' ? '十进制 SI' : u.type === 'binary' ? '二进制 IEC' : '基础'
    return {
      unit: u.symbol,
      name: u.label,
      type: typeLabel,
      value: formatBigNumber(value),
      isSource: u.symbol === sourceSymbol,
    }
  })
})

const columns: DataTableColumns<ConversionRow> = [
  {
    title: '单位',
    key: 'unit',
    width: 100,
    render(row) {
      return row.isSource ? `${row.unit} (源)` : row.unit
    },
  },
  { title: '名称', key: 'name', width: 180 },
  {
    title: '类型',
    key: 'type',
    width: 120,
  },
  {
    title: '转换值',
    key: 'value',
    render(row) {
      return row.value
    },
  },
]
</script>

<style scoped>
.memory-unit-converter {
  max-width: 1000px;
  margin: 0 auto;
}

.input-section {
  margin-bottom: 24px;
}

.input-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.value-input {
  flex: 2;
  min-width: 200px;
}

.unit-input {
  flex: 1;
  min-width: 200px;
}

.result-section {
  margin-bottom: 24px;
}

.info-section {
  margin-top: 16px;
}

.dark :deep(.n-data-table .n-data-table-th) {
  background: rgba(255, 255, 255, 0.03);
}
</style>
