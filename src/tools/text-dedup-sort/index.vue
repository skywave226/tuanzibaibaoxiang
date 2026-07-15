<template>
  <div class="text-dedup-sort">
    <n-input v-model:value="input" type="textarea" placeholder="请输入多行文本..." :rows="8" />
    <div class="options">
      <n-checkbox v-model:checked="removeDuplicates">去除重复行</n-checkbox>
      <n-checkbox v-model:checked="removeEmpty">去除空行</n-checkbox>
      <n-select v-model:value="sortMethod" :options="sortOptions" placeholder="排序方式" style="width: 200px" />
      <n-button type="primary" @click="process">处理</n-button>
    </div>
    <n-input :value="output" type="textarea" readonly :rows="8" placeholder="处理结果..." />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NCheckbox, NSelect } from 'naive-ui'
const input = ref('')
const output = ref('')
const removeDuplicates = ref(true)
const removeEmpty = ref(true)
const sortMethod = ref('none')
const sortOptions = [
  { label: '不排序', value: 'none' },
  { label: '字母升序', value: 'asc' },
  { label: '字母降序', value: 'desc' },
  { label: '数字升序', value: 'numAsc' },
  { label: '数字降序', value: 'numDesc' },
]
const process = () => {
  if (!input.value.trim()) {
    output.value = ''
    return
  }
  let lines = input.value.split('\n')
  if (removeEmpty.value) lines = lines.filter(l => l.trim())
  if (removeDuplicates.value) lines = [...new Set(lines)]
  if (sortMethod.value === 'asc') lines.sort()
  else if (sortMethod.value === 'desc') lines.sort().reverse()
  else if (sortMethod.value === 'numAsc') lines.sort((a, b) => parseFloat(a) - parseFloat(b))
  else if (sortMethod.value === 'numDesc') lines.sort((a, b) => parseFloat(b) - parseFloat(a))
  output.value = lines.join('\n')
}
</script>
<style scoped>
.text-dedup-sort { max-width: 800px; margin: 0 auto; }
.options { display: flex; align-items: center; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
</style>
