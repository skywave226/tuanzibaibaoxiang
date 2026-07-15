<template>
  <div class="uuid-generator">
    <div class="card mb-4">
      <div class="flex items-center gap-4 flex-wrap mb-4">
        <n-input-number v-model:value="count" :min="1" :max="100" placeholder="生成数量" class="w-40" />
        <n-select v-model:value="format" :options="formatOptions" class="w-40" />
        <n-button type="primary" @click="generate">生成</n-button>
        <n-button @click="copyAll">复制全部</n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>
    </div>

    <div class="card">
      <div class="pane-label mb-2">生成结果（{{ uuids.length }} 个）</div>
      <div v-if="uuids.length === 0" class="text-gray-400 text-center py-8">
        点击"生成"按钮生成 UUID
      </div>
      <div v-else class="uuid-list">
        <div v-for="(uuid, index) in uuids" :key="index" class="uuid-item">
          <span class="uuid-index text-gray-400">{{ index + 1 }}.</span>
          <span class="uuid-value font-mono">{{ uuid }}</span>
          <n-button text size="tiny" @click="copyOne(uuid)">复制</n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NInputNumber, NSelect, NButton, useMessage } from 'naive-ui'

const message = useMessage()
const count = ref(5)
const format = ref('standard')
const uuids = ref<string[]>([])

const formatOptions = [
  { label: '标准格式', value: 'standard' },
  { label: '无横线', value: 'no-hyphen' },
  { label: '大写', value: 'upper' },
]

function generateUUID(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function generate() {
  const list: string[] = []
  for (let i = 0; i < (count.value || 1); i++) {
    let uuid = generateUUID()
    if (format.value === 'no-hyphen') uuid = uuid.replace(/-/g, '')
    if (format.value === 'upper') uuid = uuid.toUpperCase()
    list.push(uuid)
  }
  uuids.value = list
}

function copyOne(uuid: string) {
  navigator.clipboard.writeText(uuid)
  message.success('已复制')
}

function copyAll() {
  navigator.clipboard.writeText(uuids.value.join('\n'))
  message.success('已复制全部')
}

function clearAll() {
  uuids.value = []
}
</script>

<style scoped>
.uuid-list {
  max-height: 500px;
  overflow-y: auto;
}

.uuid-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.uuid-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.dark .uuid-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.uuid-index {
  width: 30px;
  text-align: right;
  flex-shrink: 0;
  font-size: 12px;
}

.uuid-value {
  flex: 1;
  font-size: 14px;
  word-break: break-all;
}
</style>
