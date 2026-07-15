<template>
  <div class="xml-formatter">
    <div class="toolbar">
      <n-button @click="format">格式化</n-button>
      <n-button @click="compress">压缩</n-button>
      <n-button @click="validate">验证</n-button>
    </div>
    <n-input v-model:value="input" type="textarea" placeholder="请输入 XML..." :rows="10" />
    <div class="result" v-if="output">
      <div class="label">结果</div>
      <n-input :value="output" type="textarea" readonly :rows="10" />
    </div>
    <n-alert v-if="error" type="error" class="mt-4">{{ error }}</n-alert>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NAlert } from 'naive-ui'
const input = ref('')
const output = ref('')
const error = ref('')
const format = () => {
  if (!input.value.trim()) { output.value = ''; error.value = ''; return }
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input.value, 'text/xml')
    if (doc.querySelector('parsererror')) throw new Error('XML 格式错误')
    const serializer = new XMLSerializer()
    output.value = formatXml(serializer.serializeToString(doc))
    error.value = ''
  } catch (e: unknown) { error.value = e instanceof Error ? e.message : String(e) }
}
const compress = () => {
  if (!input.value.trim()) { output.value = ''; error.value = ''; return }
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input.value, 'text/xml')
    if (doc.querySelector('parsererror')) throw new Error('XML 格式错误')
    output.value = new XMLSerializer().serializeToString(doc).replace(/>\s+</g, '><')
    error.value = ''
  } catch (e: unknown) { error.value = e instanceof Error ? e.message : String(e) }
}
const validate = () => {
  if (!input.value.trim()) { output.value = ''; error.value = ''; return }
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input.value, 'text/xml')
    if (doc.querySelector('parsererror')) throw new Error('XML 格式错误')
    output.value = '✓ XML 格式正确'
    error.value = ''
  } catch (e: unknown) { error.value = e instanceof Error ? e.message : String(e) }
}
const formatXml = (xml: string) => {
  let formatted = ''
  let indent = 0
  xml.split(/>\s*</).forEach(node => {
    if (node.match(/^\/\w/)) indent--
    formatted += '  '.repeat(indent) + '<' + node + '>\n'
    if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?') && !node.startsWith('!')) indent++
  })
  return formatted.substring(1, formatted.length - 2)
}
</script>
<style scoped>
.xml-formatter { max-width: 1000px; margin: 0 auto; }
.toolbar { display: flex; gap: 8px; margin-bottom: 16px; }
.result { margin-top: 20px; }
.label { margin-bottom: 8px; font-weight: 500; }
</style>
