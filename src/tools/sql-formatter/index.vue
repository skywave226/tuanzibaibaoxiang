<template>
  <div class="sql-formatter">
    <div class="toolbar">
      <n-button @click="format">格式化</n-button>
      <n-button @click="compress">压缩</n-button>
    </div>
    <n-input v-model:value="input" type="textarea" placeholder="请输入 SQL..." :rows="10" />
    <div class="result" v-if="output">
      <div class="label">结果</div>
      <n-input :value="output" type="textarea" readonly :rows="10" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NInput, NButton } from 'naive-ui'

const input = ref('')
const output = ref('')

let sqlFormatter: typeof import('sql-formatter') | null = null

onMounted(async () => {
  sqlFormatter = await import('sql-formatter')
})

const format = async () => {
  if (!sqlFormatter) { output.value = '库尚未加载完成，请稍后再试'; return }
  try {
    output.value = sqlFormatter.format(input.value)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    output.value = '格式化失败: ' + msg
  }
}

const compress = () => {
  output.value = input.value.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim()
}
</script>
<style scoped>
.sql-formatter { max-width: 1000px; margin: 0 auto; }
.toolbar { display: flex; gap: 8px; margin-bottom: 16px; }
.result { margin-top: 20px; }
.label { margin-bottom: 8px; font-weight: 500; }
</style>
