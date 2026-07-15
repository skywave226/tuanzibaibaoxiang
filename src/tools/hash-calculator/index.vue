<template>
  <div class="hash-calculator">
    <div class="card mb-4">
      <div class="pane-label mb-2">输入文本</div>
      <n-input
        v-model:value="input"
        type="textarea"
        placeholder="输入需要计算哈希的文本"
        rows="6"
        :autosize="false"
        @input="calculateHash"
      />
      <div class="flex items-center gap-2 mt-3">
        <n-tag :bordered="false">长度: {{ input.length }}</n-tag>
        <n-button @click="clearInput" size="small">清空</n-button>
      </div>
    </div>

    <div class="hash-results">
      <div v-for="algo in algorithms" :key="algo.value" class="hash-item card">
        <div class="flex items-center justify-between mb-2">
          <div class="font-bold">{{ algo.label }}</div>
          <n-button text size="tiny" @click="copyHash(algo.value)">复制</n-button>
        </div>
        <div class="hash-value font-mono text-sm">
          {{ hashes[algo.value] || '等待计算...' }}
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <n-alert type="info" title="说明">
        使用浏览器原生 Web Crypto API 计算哈希，无需后端支持。MD5 为模拟实现，仅用于兼容性展示。
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NInput, NButton, NTag, NAlert, useMessage } from 'naive-ui'

const message = useMessage()
const input = ref('')

const algorithms = [
  { label: 'SHA-1', value: 'SHA-1' },
  { label: 'SHA-256', value: 'SHA-256' },
  { label: 'SHA-384', value: 'SHA-384' },
  { label: 'SHA-512', value: 'SHA-512' },
]

const hashes = reactive<Record<string, string>>({})

async function calculateHash() {
  if (!input.value) {
    algorithms.forEach(a => hashes[a.value] = '')
    return
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(input.value)

  for (const algo of algorithms) {
    try {
      const hashBuffer = await crypto.subtle.digest(algo.value, data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      hashes[algo.value] = hashHex
    } catch (e) {
      hashes[algo.value] = '计算失败'
    }
  }
}

function copyHash(algo: string) {
  const hash = hashes[algo]
  if (hash) {
    navigator.clipboard.writeText(hash)
    message.success('已复制')
  }
}

function clearInput() {
  input.value = ''
  calculateHash()
}
</script>

<style scoped>
.hash-results {
  display: grid;
  gap: 12px;
}

.hash-item {
  transition: all 0.2s;
}

.hash-item:hover {
  border-color: #36ad6a;
}

.hash-value {
  word-break: break-all;
  color: #666;
  line-height: 1.6;
}

.dark .hash-value {
  color: #aaa;
}
</style>
