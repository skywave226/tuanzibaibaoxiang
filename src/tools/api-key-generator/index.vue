<template>
  <div class="api-key-generator">
    <n-alert type="info" class="mb-4">
      使用浏览器 crypto.getRandomValues 生成加密级随机密钥，所有计算在本地完成，不上传任何数据。
    </n-alert>

    <!-- 配置区 -->
    <div class="card mb-4">
      <div class="config-grid">
        <div class="config-item">
          <label>密钥长度</label>
          <n-input-number v-model:value="length" :min="8" :max="256" class="w-40" />
        </div>
        <div class="config-item">
          <label>生成数量</label>
          <n-input-number v-model:value="count" :min="1" :max="100" class="w-40" />
        </div>
        <div class="config-item">
          <label>编码格式</label>
          <n-select v-model:value="encoding" :options="encodingOptions" class="w-40" />
        </div>
        <div class="config-item">
          <label>密钥前缀</label>
          <n-input v-model:value="prefix" placeholder="sk_ / ak_ / 留空" class="w-40" />
        </div>
      </div>

      <div class="options mt-4">
        <n-checkbox v-model:checked="addSeparator">添加分隔符（每 4 位加 -）</n-checkbox>
        <n-checkbox v-model:checked="uppercase" :disabled="encoding === 'base64'">大写输出</n-checkbox>
      </div>

      <div class="flex items-center gap-2 mt-4 flex-wrap">
        <n-button type="primary" @click="generate">生成密钥</n-button>
        <n-button @click="copyAll" :disabled="keys.length === 0">复制全部</n-button>
        <n-button @click="downloadKeys" :disabled="keys.length === 0">下载为文件</n-button>
        <n-button @click="clearAll" :disabled="keys.length === 0">清空</n-button>
      </div>
    </div>

    <!-- 生成结果 -->
    <div class="card" v-if="keys.length > 0">
      <div class="flex items-center justify-between mb-2">
        <div class="pane-label">生成结果（{{ keys.length }} 个）</div>
        <n-tag :bordered="false" size="small">熵 ≈ {{ entropy }} bits</n-tag>
      </div>
      <div class="key-list">
        <div v-for="(key, index) in keys" :key="index" class="key-item">
          <span class="key-index text-gray-400">{{ index + 1 }}.</span>
          <span class="key-value font-mono">{{ key }}</span>
          <n-button text size="tiny" @click="copyOne(key)">复制</n-button>
        </div>
      </div>
    </div>

    <div class="card mt-4" v-else>
      <n-empty description="配置参数后点击生成按钮" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInputNumber, NSelect, NInput, NCheckbox, NButton, NTag, NEmpty, NAlert, useMessage } from 'naive-ui'

const message = useMessage()

const length = ref(32)
const count = ref(5)
const encoding = ref<'hex' | 'base64' | 'base64url' | 'raw'>('hex')
const prefix = ref('sk_')
const addSeparator = ref(false)
const uppercase = ref(false)
const keys = ref<string[]>([])

const encodingOptions = [
  { label: 'Hex (十六进制)', value: 'hex' },
  { label: 'Base64', value: 'base64' },
  { label: 'Base64URL', value: 'base64url' },
  { label: 'Base62 (字母数字)', value: 'raw' },
]

// 估算密钥熵（安全性参考）
const entropy = computed(() => {
  let bits = length.value * 8
  if (encoding.value === 'hex') bits = length.value * 4
  if (encoding.value === 'raw') bits = Math.floor(length.value * Math.log2(62))
  return Math.min(bits, 512)
})

// 生成随机字节
function randomBytes(len: number): Uint8Array {
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  return arr
}

// 字节数组转 Hex
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// 字节数组转 Base64
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// 字节数组转 Base64URL
function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// 生成 Base62 字符串（字母 + 数字）
function randomBase62(len: number): string {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const result: string[] = []
  const max = Math.floor(0xFFFFFFFF / charset.length) * charset.length
  const buf = new Uint32Array(len)
  crypto.getRandomValues(buf)
  for (let i = 0; i < len; i++) {
    let val = buf[i]
    // 拒绝采样以避免模偏差
    while (val >= max) {
      const tmp = new Uint32Array(1)
      crypto.getRandomValues(tmp)
      val = tmp[0]
    }
    result.push(charset[val % charset.length])
  }
  return result.join('')
}

// 添加分隔符（每 4 位加 -）
function applySeparator(str: string): string {
  return str.replace(/(.{4})(?=.)/g, '$1-')
}

// 生成单个密钥
function generateKey(): string {
  let key: string
  const byteLen = Math.max(1, Math.floor(length.value / 2))

  switch (encoding.value) {
    case 'hex':
      key = toHex(randomBytes(byteLen))
      break
    case 'base64':
      key = toBase64(randomBytes(length.value))
      break
    case 'base64url':
      key = toBase64Url(randomBytes(length.value))
      break
    case 'raw':
      key = randomBase62(length.value)
      break
  }

  if (uppercase.value && encoding.value !== 'base64') {
    key = key.toUpperCase()
  }
  if (addSeparator.value) {
    key = applySeparator(key)
  }
  if (prefix.value.trim()) {
    key = prefix.value.trim() + key
  }
  return key
}

function generate() {
  const result: string[] = []
  for (let i = 0; i < count.value; i++) {
    result.push(generateKey())
  }
  keys.value = result
  message.success(`已生成 ${count.value} 个密钥`)
}

async function copyOne(key: string) {
  try {
    await navigator.clipboard.writeText(key)
    message.success('已复制')
  } catch {
    message.error('复制失败')
  }
}

async function copyAll() {
  try {
    await navigator.clipboard.writeText(keys.value.join('\n'))
    message.success('已复制全部')
  } catch {
    message.error('复制失败')
  }
}

function downloadKeys() {
  const text = keys.value.join('\n')
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'api-keys.txt'
  a.click()
  URL.revokeObjectURL(url)
  message.success('已下载')
}

function clearAll() {
  keys.value = []
}
</script>

<style scoped>
.api-key-generator {
  max-width: 1000px;
  margin: 0 auto;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label {
  color: #bbb;
}

.options {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.key-list {
  max-height: 460px;
  overflow-y: auto;
}

.key-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.key-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.dark .key-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.key-index {
  width: 32px;
  text-align: right;
  flex-shrink: 0;
  font-size: 12px;
}

.key-value {
  flex: 1;
  font-size: 14px;
  word-break: break-all;
}
</style>
