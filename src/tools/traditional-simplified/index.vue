<template>
  <div class="traditional-simplified">
    <div class="toolbar">
      <n-button @click="toSimplified">繁体 → 简体</n-button>
      <n-button @click="toTraditional">简体 → 繁体</n-button>
    </div>
    <n-input v-model:value="input" type="textarea" :rows="8" placeholder="请输入中文文本..." />
    <n-input :value="output" type="textarea" readonly :rows="8" placeholder="转换结果..." />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NInput, NButton } from 'naive-ui'

const input = ref('')
const output = ref('')

let t2sConverter: ((text: string) => string) | null = null
let s2tConverter: ((text: string) => string) | null = null

onMounted(async () => {
  const OpenCC = await import('opencc-js')
  t2sConverter = OpenCC.Converter('t2s' as any)
  s2tConverter = OpenCC.Converter('s2t' as any)
})

const toSimplified = () => {
  if (!t2sConverter) { output.value = '库尚未加载完成，请稍后再试'; return }
  try {
    output.value = t2sConverter(input.value)
  } catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); output.value = '转换失败: ' + msg }
}

const toTraditional = () => {
  if (!s2tConverter) { output.value = '库尚未加载完成，请稍后再试'; return }
  try {
    output.value = s2tConverter(input.value)
  } catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); output.value = '转换失败: ' + msg }
}
</script>
<style scoped>
.traditional-simplified { max-width: 1000px; margin: 0 auto; }
.toolbar { display: flex; gap: 8px; margin-bottom: 16px; }
</style>
