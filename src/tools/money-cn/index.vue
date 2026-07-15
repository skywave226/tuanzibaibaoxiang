<template>
  <div class="money-cn">
    <n-input v-model:value="input" placeholder="请输入数字金额（如：12345.67）" />
    <div class="result" v-if="result">
      <div class="label">中文大写</div>
      <div class="value">{{ result }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput } from 'naive-ui'
const input = ref('')
const result = computed(() => {
  if (!input.value) return ''
  const num = parseFloat(input.value)
  if (isNaN(num)) return '请输入有效的数字'
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const units = ['', '拾', '佰', '仟']
  const bigUnits = ['', '万', '亿', '兆']
  const n = Math.abs(num)
  const integerPart = Math.floor(n)
  const decimalPart = Math.round((n - integerPart) * 100)
  let result = ''
  if (integerPart === 0) { result = '零' }
  else {
    const intStr = integerPart.toString()
    const len = intStr.length
    let zeroFlag = false
    for (let i = 0; i < len; i++) {
      const digit = parseInt(intStr[i])
      const pos = len - 1 - i
      const unitIdx = pos % 4
      const bigUnitIdx = Math.floor(pos / 4)
      if (digit === 0) { zeroFlag = true }
      else {
        if (zeroFlag) { result += '零'; zeroFlag = false }
        result += digits[digit] + units[unitIdx]
      }
      if (unitIdx === 0 && bigUnitIdx > 0) { result += bigUnits[bigUnitIdx]; zeroFlag = false }
    }
  }
  result += '元'
  if (decimalPart === 0) { result += '整' }
  else {
    const jiao = Math.floor(decimalPart / 10)
    const fen = decimalPart % 10
    if (jiao > 0) result += digits[jiao] + '角'
    else if (integerPart > 0) result += '零'
    if (fen > 0) result += digits[fen] + '分'
  }
  if (num < 0) result = '负' + result
  return result
})
</script>
<style scoped>
.money-cn { max-width: 600px; margin: 0 auto; }
.result { margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px; }
.label { font-size: 14px; color: #666; margin-bottom: 8px; }
.value { font-size: 24px; font-weight: bold; color: #d03050; font-family: 'STKaiti', 'KaiTi', serif; }
</style>
