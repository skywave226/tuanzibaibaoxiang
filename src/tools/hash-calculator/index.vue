<template>
  <div class="hash-calculator">
    <n-tabs v-model:value="mode" type="line" animated class="mb-4">
      <n-tab-pane name="text" tab="文本哈希">
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
            <n-checkbox v-model:checked="outputBase64" @update:checked="calculateHash">Base64 输出</n-checkbox>
            <n-button @click="clearInput" size="small">清空</n-button>
          </div>
        </div>

        <div class="card mb-4">
          <div class="pane-label mb-2">HMAC 密钥（可选）</div>
          <n-input v-model:value="hmacKey" placeholder="输入密钥后自动计算 HMAC" @input="calculateHash" />
        </div>
      </n-tab-pane>

      <n-tab-pane name="file" tab="文件哈希">
        <div class="card mb-4">
          <n-alert type="info" class="mb-4">选择文件后将自动计算 MD5、SHA-1、SHA-256、SHA-512。</n-alert>
          <n-upload
            drag
            accept="*/*"
            :show-file-list="false"
            :custom-request="handleFileUpload"
            class="file-uploader"
          >
            <n-text>点击或拖拽文件到此处</n-text>
          </n-upload>
          <div v-if="fileName" class="file-info mt-3">
            <n-tag>{{ fileName }}</n-tag>
            <n-tag>大小: {{ formatSize(fileSize) }}</n-tag>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <div class="hash-results">
      <div v-for="algo in displayAlgorithms" :key="algo.value" class="hash-item card">
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
        使用浏览器原生 Web Crypto API 计算哈希，无需后端支持。MD5 为客户端模拟实现，仅用于兼容性展示。
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { NInput, NButton, NTag, NAlert, NTabs, NTabPane, NUpload, NText, NCheckbox, useMessage } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const message = useMessage()
const mode = ref('text')
const input = ref('')
const hmacKey = ref('')
const outputBase64 = ref(false)
const fileName = ref('')
const fileSize = ref(0)

const algorithms = [
  { label: 'MD5', value: 'MD5' },
  { label: 'SHA-1', value: 'SHA-1' },
  { label: 'SHA-256', value: 'SHA-256' },
  { label: 'SHA-384', value: 'SHA-384' },
  { label: 'SHA-512', value: 'SHA-512' },
]

const hashes = reactive<Record<string, string>>({})

const displayAlgorithms = computed(() => algorithms)

async function calculateHash() {
  if (!input.value) {
    algorithms.forEach(a => hashes[a.value] = '')
    return
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(input.value)
  const key = hmacKey.value ? encoder.encode(hmacKey.value) : null

  for (const algo of algorithms) {
    try {
      if (algo.value === 'MD5') {
        hashes[algo.value] = outputBase64.value ? md5Base64(input.value) : md5Hex(input.value)
      }
      else if (key) {
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          key,
          { name: 'HMAC', hash: algo.value },
          false,
          ['sign'],
        )
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
        hashes[algo.value] = outputBase64.value ? arrayBufferToBase64(signature) : arrayBufferToHex(signature)
      }
      else {
        const hashBuffer = await crypto.subtle.digest(algo.value, data)
        hashes[algo.value] = outputBase64.value ? arrayBufferToBase64(hashBuffer) : arrayBufferToHex(hashBuffer)
      }
    }
    catch (e) {
      hashes[algo.value] = '计算失败'
    }
  }
}

async function calculateFileHash(file: File) {
  fileName.value = file.name
  fileSize.value = file.size
  mode.value = 'file'
  algorithms.forEach(a => hashes[a.value] = '计算中...')

  const arrayBuffer = await file.arrayBuffer()

  for (const algo of algorithms) {
    try {
      if (algo.value === 'MD5') {
        hashes[algo.value] = outputBase64.value ? md5ArrayBufferBase64(arrayBuffer) : md5ArrayBufferHex(arrayBuffer)
      }
      else {
        const hashBuffer = await crypto.subtle.digest(algo.value, arrayBuffer)
        hashes[algo.value] = outputBase64.value ? arrayBufferToBase64(hashBuffer) : arrayBufferToHex(hashBuffer)
      }
    }
    catch (e) {
      hashes[algo.value] = '计算失败'
    }
  }
}

function handleFileUpload({ file }: UploadCustomRequestOptions) {
  const f = file.file as File
  if (!f) return
  calculateFileHash(f)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function copyHash(algo: string) {
  const hash = hashes[algo]
  if (hash && hash !== '等待计算...' && hash !== '计算中...' && hash !== '计算失败') {
    navigator.clipboard.writeText(hash)
    message.success('已复制')
  }
}

function clearInput() {
  input.value = ''
  hmacKey.value = ''
  calculateHash()
}

// MD5 implementation
function md5Hex(str: string): string {
  return md5ArrayBufferHex(new TextEncoder().encode(str).buffer)
}

function md5Base64(str: string): string {
  return md5ArrayBufferBase64(new TextEncoder().encode(str).buffer)
}

function md5ArrayBufferHex(buffer: ArrayBuffer): string {
  const hash = md5(new Uint8Array(buffer))
  return hash.map(b => b.toString(16).padStart(2, '0')).join('')
}

function md5ArrayBufferBase64(buffer: ArrayBuffer): string {
  const hash = md5(new Uint8Array(buffer))
  let binary = ''
  for (const b of hash) {
    binary += String.fromCharCode(b)
  }
  return btoa(binary)
}

function md5(input: Uint8Array): number[] {
  const s: number[] = []
  for (let i = 0; i < 64; i++) {
    s[i] = Math.floor(4294967296 * Math.abs(Math.sin(i + 1)))
  }

  const len = input.length
  const totalBits = len * 8
  const paddedLen = Math.ceil((len + 9) / 64) * 64
  const padded = new Uint8Array(paddedLen)
  padded.set(input)
  padded[len] = 0x80

  const view = new DataView(padded.buffer)
  view.setUint32(paddedLen - 8, totalBits & 0xFFFFFFFF, true)
  view.setUint32(paddedLen - 4, Math.floor(totalBits / 0x100000000), true)

  let a = 0x67452301
  let b = 0xEFCDAB89
  let c = 0x98BADCFE
  let d = 0x10325476

  function F(x: number, y: number, z: number) { return (x & y) | (~x & z) }
  function G(x: number, y: number, z: number) { return (x & z) | (y & ~z) }
  function H(x: number, y: number, z: number) { return x ^ y ^ z }
  function I(x: number, y: number, z: number) { return y ^ (x | ~z) }
  function rotateLeft(x: number, n: number) { return (x << n) | (x >>> (32 - n)) }

  for (let i = 0; i < paddedLen; i += 64) {
    const chunk = new DataView(padded.buffer, i, 64)
    const m: number[] = []
    for (let j = 0; j < 16; j++) {
      m[j] = chunk.getUint32(j * 4, true)
    }

    let aa = a, bb = b, cc = c, dd = d

    for (let j = 0; j < 64; j++) {
      let f, g
      if (j < 16) {
        f = F(bb, cc, dd)
        g = j
      }
      else if (j < 32) {
        f = G(bb, cc, dd)
        g = (5 * j + 1) % 16
      }
      else if (j < 48) {
        f = H(bb, cc, dd)
        g = (3 * j + 5) % 16
      }
      else {
        f = I(bb, cc, dd)
        g = (7 * j) % 16
      }
      const temp = dd
      dd = cc
      cc = bb
      bb = (bb + rotateLeft((aa + f + s[j] + m[g]) & 0xFFFFFFFF, [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][Math.floor(j / 16) * 4 + j % 4])) & 0xFFFFFFFF
      aa = temp
    }

    a = (a + aa) & 0xFFFFFFFF
    b = (b + bb) & 0xFFFFFFFF
    c = (c + cc) & 0xFFFFFFFF
    d = (d + dd) & 0xFFFFFFFF
  }

  return [a, b, c, d].flatMap((n) => {
    return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]
  })
}
</script>

<style scoped>
.hash-calculator {
  max-width: 900px;
  margin: 0 auto;
}

.card {
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 8px;
}

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

.file-uploader {
  width: 100%;
}

.file-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
  text-transform: uppercase;
}
</style>
