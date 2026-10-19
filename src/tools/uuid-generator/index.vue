<template>
  <div class="uuid-generator">
    <div class="card mb-4">
      <div class="flex items-center gap-4 flex-wrap mb-4">
        <div class="field">
          <span class="label">数量</span>
          <n-input-number v-model:value="count" :min="1" :max="1000" placeholder="生成数量" class="w-32" />
        </div>
        <div class="field">
          <span class="label">格式</span>
          <n-select v-model:value="format" :options="formatOptions" class="w-40" />
        </div>
        <div class="field">
          <span class="label">版本</span>
          <n-select v-model:value="version" :options="versionOptions" class="w-40" />
        </div>
        <n-button type="primary" @click="generate">生成</n-button>
        <n-button @click="copyAll">复制全部</n-button>
        <n-button @click="downloadTxt">下载 TXT</n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>

      <div class="quick-actions">
        <n-button size="tiny" quaternary @click="setNil">生成 NIL UUID</n-button>
        <n-button size="tiny" quaternary @click="count = 10; generate()">生成 10 个</n-button>
        <n-button size="tiny" quaternary @click="count = 100; generate()">生成 100 个</n-button>
      </div>
    </div>

    <div class="card">
      <div class="pane-label mb-2 flex justify-between">
        <span>生成结果（{{ uuids.length }} 个）</span>
        <span class="text-gray-400 text-xs">{{ formatPreview }}</span>
      </div>
      <n-empty v-if="uuids.length === 0" description="点击“生成”按钮生成 UUID" />
      <div v-else class="uuid-list">
        <div v-for="(item, index) in uuids" :key="index" class="uuid-item">
          <span class="uuid-index text-gray-400">{{ index + 1 }}.</span>
          <span class="uuid-value font-mono">{{ item }}</span>
          <n-button text size="tiny" @click="copyOne(item)">复制</n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NInputNumber, NSelect, NButton, NEmpty } from 'naive-ui'
import { useCopy } from '@/composables/useCopy'

const { copy: copyText } = useCopy()
const count = ref(5)
const format = ref('standard')
const version = ref('v4')
const uuids = ref<string[]>([])

const formatOptions = [
  { label: '标准格式', value: 'standard' },
  { label: '无横线', value: 'no-hyphen' },
  { label: '大写', value: 'upper' },
  { label: '大写无横线', value: 'upper-no-hyphen' },
  { label: '花括号包裹', value: 'braces' },
  { label: 'URN', value: 'urn' },
]

const versionOptions = [
  { label: 'UUID v4 (随机)', value: 'v4' },
  { label: 'UUID v1 (时间戳)', value: 'v1' },
]

const formatPreview = computed(() => {
  if (uuids.value.length === 0) return ''
  switch (format.value) {
    case 'standard': return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    case 'no-hyphen': return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'
    case 'upper': return 'XXXXXXXX-XXXX-4XXX-YXXX-XXXXXXXXXXXX'
    case 'upper-no-hyphen': return 'XXXXXXXXXXXX4XXXYYYYYYYYYYYYYYYY'
    case 'braces': return '{xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx}'
    case 'urn': return 'urn:uuid:xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    default: return ''
  }
})

function hexFromBytes(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateV4(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  array[6] = (array[6] & 0x0f) | 0x40
  array[8] = (array[8] & 0x3f) | 0x80
  return formatBytes(array)
}

let lastV1Timestamp = 0n
const v1ClockSeq = crypto.getRandomValues(new Uint16Array(1))[0] & 0x3fff
const v1Node = crypto.getRandomValues(new Uint8Array(6))
v1Node[0] |= 0x01 // Locally generated node identifier; do not imply a real MAC address.

function generateV1(): string {
  // UUID v1 stores 100 ns ticks since 1582-10-15. BigInt preserves all 60 bits.
  let timestamp = BigInt(Date.now() + 12219292800000) * 10000n
  // Multiple UUIDs generated within one millisecond must still be distinct.
  if (timestamp <= lastV1Timestamp) timestamp = lastV1Timestamp + 1n
  lastV1Timestamp = timestamp

  const array = new Uint8Array(16)
  array[0] = Number((timestamp >> 24n) & 0xffn)
  array[1] = Number((timestamp >> 16n) & 0xffn)
  array[2] = Number((timestamp >> 8n) & 0xffn)
  array[3] = Number(timestamp & 0xffn)
  array[4] = Number((timestamp >> 40n) & 0xffn)
  array[5] = Number((timestamp >> 32n) & 0xffn)
  array[6] = 0x10 | Number((timestamp >> 56n) & 0x0fn)
  array[7] = Number((timestamp >> 48n) & 0xffn)
  array[8] = 0x80 | ((v1ClockSeq >> 8) & 0x3f)
  array[9] = v1ClockSeq & 0xff
  array.set(v1Node, 10)
  return formatBytes(array)
}

function formatBytes(bytes: Uint8Array): string {
  const hex = hexFromBytes(bytes)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function applyFormat(uuid: string): string {
  switch (format.value) {
    case 'no-hyphen': return uuid.replace(/-/g, '').toLowerCase()
    case 'upper': return uuid.toUpperCase()
    case 'upper-no-hyphen': return uuid.replace(/-/g, '').toUpperCase()
    case 'braces': return `{${uuid.toLowerCase()}}`
    case 'urn': return `urn:uuid:${uuid.toLowerCase()}`
    default: return uuid.toLowerCase()
  }
}

function generateOne(): string {
  const raw = version.value === 'v1' ? generateV1() : generateV4()
  return applyFormat(raw)
}

function generate() {
  const c = Math.min(Math.max(count.value || 1, 1), 1000)
  const list: string[] = []
  for (let i = 0; i < c; i++) {
    list.push(generateOne())
  }
  uuids.value = list
}

function setNil() {
  uuids.value = [applyFormat('00000000-0000-0000-0000-000000000000')]
}

function copyOne(uuid: string) {
  copyText(uuid)
}

function copyAll() {
  copyText(uuids.value.join('\n'))
}

function downloadTxt() {
  const blob = new Blob([uuids.value.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `uuids-${uuids.value.length}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function clearAll() {
  uuids.value = []
}

onMounted(() => {
  generate()
})
</script>

<style scoped>
.uuid-generator { max-width: 900px; margin: 0 auto; }

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: #888;
}

.quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.uuid-list {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 8px;
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
  width: 40px;
  text-align: right;
  flex-shrink: 0;
  font-size: 12px;
}

.uuid-value {
  flex: 1;
  font-size: 14px;
  word-break: break-all;
}

.dark .uuid-list {
  border-color: #333;
}
</style>
