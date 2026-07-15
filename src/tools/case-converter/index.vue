<template>
  <div class="case-converter">
    <n-input v-model:value="input" type="textarea" placeholder="请输入英文文本..." :rows="8" />
    <div class="buttons">
      <n-button @click="toUpperCase">转大写</n-button>
      <n-button @click="toLowerCase">转小写</n-button>
      <n-button @click="toSentenceCase">句首大写</n-button>
      <n-button @click="toTitleCase">标题大写</n-button>
      <n-button @click="toCamelCase">驼峰命名</n-button>
      <n-button @click="toPascalCase">帕斯卡命名</n-button>
      <n-button @click="toSnakeCase">下划线命名</n-button>
      <n-button @click="toKebabCase">短横线命名</n-button>
    </div>
    <n-input :value="output" type="textarea" readonly :rows="8" placeholder="转换结果..." />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton } from 'naive-ui'
const input = ref('')
const output = ref('')
const checkEmpty = () => {
  if (!input.value.trim()) {
    output.value = ''
    return true
  }
  return false
}
const toUpperCase = () => { if (checkEmpty()) return; output.value = input.value.toUpperCase() }
const toLowerCase = () => { if (checkEmpty()) return; output.value = input.value.toLowerCase() }
const toSentenceCase = () => { if (checkEmpty()) return; output.value = input.value.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, c => c.toUpperCase()) }
const toTitleCase = () => { if (checkEmpty()) return; output.value = input.value.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) }
const toCamelCase = () => { if (checkEmpty()) return; output.value = input.value.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()) }
const toPascalCase = () => { if (checkEmpty()) return; output.value = input.value.toLowerCase().replace(/(^|[^a-zA-Z0-9]+)(.)/g, (_, __, c) => c.toUpperCase()) }
const toSnakeCase = () => { if (checkEmpty()) return; output.value = input.value.replace(/\s+/g, '_').toLowerCase() }
const toKebabCase = () => { if (checkEmpty()) return; output.value = input.value.replace(/\s+/g, '-').toLowerCase() }
</script>
<style scoped>
.case-converter { max-width: 800px; margin: 0 auto; }
.buttons { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
</style>
