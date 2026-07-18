<template>
  <div class="case-converter">
    <n-input v-model:value="input" type="textarea" placeholder="请输入英文文本..." :rows="8" />

    <div class="buttons">
      <n-button v-for="item in cases" :key="item.key" size="small" @click="apply(item.key)">
        {{ item.label }}
      </n-button>
      <n-button size="small" @click="reverseCase">反转大小写</n-button>
      <n-button size="small" @click="alternatingCase">交替大小写</n-button>
      <n-button size="small" type="error" ghost @click="clearAll">清空</n-button>
    </div>

    <n-input :value="output" type="textarea" readonly :rows="8" placeholder="转换结果..." />

    <div class="actions mt-3 flex gap-3 flex-wrap">
      <n-button size="small" @click="copyOutput" :disabled="!output">复制结果</n-button>
      <n-button size="small" @click="input = output" :disabled="!output">结果作为输入</n-button>
    </div>

    <div class="stats mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
      <n-statistic label="字符数" :value="input.length" />
      <n-statistic label="单词数" :value="wordCount" />
      <n-statistic label="行数" :value="lineCount" />
      <n-statistic label="大写字母" :value="upperCount" />
      <n-statistic label="小写字母" :value="lowerCount" />
      <n-statistic label="数字" :value="digitCount" />
      <n-statistic label="空格" :value="spaceCount" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NStatistic, useMessage } from 'naive-ui'

const message = useMessage()
const input = ref('')
const output = ref('')

const cases = [
  { key: 'upper', label: '转大写' },
  { key: 'lower', label: '转小写' },
  { key: 'sentence', label: '句首大写' },
  { key: 'title', label: '标题大写' },
  { key: 'camel', label: '驼峰命名' },
  { key: 'pascal', label: '帕斯卡命名' },
  { key: 'snake', label: '下划线命名' },
  { key: 'kebab', label: '短横线命名' },
  { key: 'constant', label: '常量命名' },
  { key: 'path', label: '路径命名' },
  { key: 'dot', label: '点分隔命名' },
  { key: 'slug', label: 'URL Slug' },
]

const wordCount = computed(() => input.value.trim() ? input.value.trim().split(/\s+/).length : 0)
const lineCount = computed(() => input.value ? input.value.split('\n').length : 0)
const upperCount = computed(() => (input.value.match(/[A-Z]/g) || []).length)
const lowerCount = computed(() => (input.value.match(/[a-z]/g) || []).length)
const digitCount = computed(() => (input.value.match(/\d/g) || []).length)
const spaceCount = computed(() => (input.value.match(/\s/g) || []).length)

function apply(type: string) {
  if (!input.value) {
    output.value = ''
    return
  }

  const text = input.value
  switch (type) {
    case 'upper':
      output.value = text.toUpperCase()
      break
    case 'lower':
      output.value = text.toLowerCase()
      break
    case 'sentence':
      output.value = text.toLowerCase().replace(/(?!\s)(^|[.!?]\s+)([a-z])/g, (_, prefix, char) => prefix + char.toUpperCase())
      break
    case 'title':
      output.value = text.toLowerCase().replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1))
      break
    case 'camel':
      output.value = toCamel(text)
      break
    case 'pascal':
      output.value = toPascal(text)
      break
    case 'snake':
      output.value = toSeparator(text, '_')
      break
    case 'kebab':
      output.value = toSeparator(text, '-')
      break
    case 'constant':
      output.value = toSeparator(text, '_').toUpperCase()
      break
    case 'path':
      output.value = toSeparator(text, '/')
      break
    case 'dot':
      output.value = toSeparator(text, '.')
      break
    case 'slug':
      output.value = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      break
  }
}

function toCamel(text: string): string {
  const words = splitWords(text)
  if (words.length === 0) return ''
  return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
}

function toPascal(text: string): string {
  return splitWords(text).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
}

function toSeparator(text: string, sep: string): string {
  return splitWords(text).map(w => w.toLowerCase()).join(sep)
}

function splitWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-\/\.\s]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function reverseCase() {
  if (!input.value) return
  output.value = input.value.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')
}

function alternatingCase() {
  if (!input.value) return
  output.value = input.value.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('')
}

function copyOutput() {
  navigator.clipboard.writeText(output.value)
  message.success('已复制')
}

function clearAll() {
  input.value = ''
  output.value = ''
}
</script>

<style scoped>
.case-converter { max-width: 800px; margin: 0 auto; }
.buttons { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
</style>
