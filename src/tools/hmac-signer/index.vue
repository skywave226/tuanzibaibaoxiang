<template>
  <div class="hmac-signer">
    <n-alert type="info" class="mb-4">
      使用浏览器原生 Web Crypto API 计算 HMAC 签名。SHA-256/384/512 由原生支持，MD5 为纯前端实现（仅用于兼容性展示，不推荐用于安全场景）。
    </n-alert>

    <!-- 输入区 -->
    <div class="card mb-4">
      <div class="input-grid">
        <div class="input-block">
          <div class="pane-label mb-2">消息（Message）</div>
          <n-input
            v-model:value="message"
            type="textarea"
            placeholder="输入要签名的消息内容"
            rows="5"
            :autosize="false"
            class="code-area"
            @input="compute"
          />
        </div>
        <div class="input-block">
          <div class="pane-label mb-2">密钥（Secret Key）</div>
          <n-input
            v-model:value="secret"
            type="textarea"
            placeholder="输入密钥"
            rows="5"
            :autosize="false"
            class="code-area"
            @input="compute"
          />
        </div>
      </div>

      <div class="options mt-4">
        <div class="option-item">
          <label>算法</label>
          <n-select
            v-model:value="algorithm"
            :options="algorithmOptions"
            style="width: 200px"
            @update:value="compute"
          />
        </div>
        <div class="option-item">
          <label>消息编码</label>
          <n-select
            v-model:value="inputEncoding"
            :options="inputEncodingOptions"
            style="width: 160px"
            @update:value="compute"
          />
        </div>
        <div class="option-item">
          <label>输出编码</label>
          <n-select
            v-model:value="outputEncoding"
            :options="outputEncodingOptions"
            style="width: 160px"
            @update:value="compute"
          />
        </div>
      </div>

      <div class="flex items-center gap-2 mt-4">
        <n-button type="primary" @click="compute">计算签名</n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <!-- 结果区 -->
    <div class="card" v-if="signature">
      <div class="pane-label mb-2">签名结果（{{ algorithmLabel }}）</div>
      <div class="result-row">
        <n-input
          :value="signature"
          readonly
          class="code-area result-input"
        />
        <n-button type="primary" @click="copyResult">复制</n-button>
      </div>
      <div class="result-meta mt-2">
        <n-tag :bordered="false" size="small">{{ algorithmLabel }}</n-tag>
        <n-tag :bordered="false" size="small" type="info">长度: {{ signature.length }} 字符</n-tag>
        <n-tag :bordered="false" size="small" type="info">字节数: {{ byteLength }}</n-tag>
      </div>
    </div>

    <div class="card mt-4" v-else>
      <n-empty description="输入消息与密钥后自动计算 HMAC 签名" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NSelect, NButton, NTag, NAlert, NEmpty, useMessage } from 'naive-ui'

const msg = useMessage()

const message = ref('Hello, World!')
const secret = ref('my-secret-key')
const algorithm = ref<'SHA-256' | 'SHA-384' | 'SHA-512' | 'MD5'>('SHA-256')
const inputEncoding = ref<'utf-8' | 'hex' | 'base64'>('utf-8')
const outputEncoding = ref<'hex' | 'base64'>('hex')
const signature = ref('')

const algorithmOptions = [
  { label: 'HMAC-SHA256', value: 'SHA-256' },
  { label: 'HMAC-SHA384', value: 'SHA-384' },
  { label: 'HMAC-SHA512', value: 'SHA-512' },
  { label: 'HMAC-MD5（兼容用）', value: 'MD5' },
]

const inputEncodingOptions = [
  { label: 'UTF-8 文本', value: 'utf-8' },
  { label: 'Hex 十六进制', value: 'hex' },
  { label: 'Base64', value: 'base64' },
]

const outputEncodingOptions = [
  { label: 'Hex 十六进制', value: 'hex' },
  { label: 'Base64', value: 'base64' },
]

const algorithmLabel = computed(() => {
  const opt = algorithmOptions.find(o => o.value === algorithm.value)
  return opt ? opt.label : algorithm.value
})

// 签名字节长度（输出字节数）
const byteLength = computed(() => {
  if (!signature.value) return 0
  if (outputEncoding.value === 'hex') return signature.value.length / 2
  // base64
  const len = signature.value.length
  const padding = signature.value.endsWith('==') ? 2 : signature.value.endsWith('=') ? 1 : 0
  return Math.floor(len * 3 / 4) - padding
})

// 将输入字符串按指定编码解码为字节数组
function decodeInput(text: string, encoding: string): Uint8Array {
  if (encoding === 'utf-8') {
    return new TextEncoder().encode(text)
  }
  if (encoding === 'hex') {
    const clean = text.replace(/\s+/g, '')
    const bytes = new Uint8Array(Math.floor(clean.length / 2))
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
    }
    return bytes
  }
  if (encoding === 'base64') {
    const binary = atob(text)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  return new TextEncoder().encode(text)
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

// ============== MD5 纯前端实现 ==============
// 标准MD5算法，用于HMAC-MD5兼容性计算

function md5(data: Uint8Array): Uint8Array {
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ]
  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
    0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
    0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
    0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
    0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
    0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ]

  // 左移
  function rotl(x: number, c: number): number {
    return (x << c) | (x >>> (32 - c))
  }
  function add32(a: number, b: number): number {
    return (a + b) & 0xffffffff
  }

  // 填充
  const origLen = data.length
  const bitLen = origLen * 8
  const padLen = (((origLen + 8) >> 6) + 1) * 16
  const bytes = new Uint8Array(padLen * 4)
  bytes.set(data)
  bytes[origLen] = 0x80
  // 写入长度（小端 64 位，这里只取低 32 位）
  const view = new DataView(bytes.buffer)
  view.setUint32(padLen * 4 - 8, bitLen >>> 0, true)
  view.setUint32(padLen * 4 - 4, Math.floor(bitLen / 0x100000000), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let i = 0; i < padLen; i++) {
    const M = new Uint32Array(bytes.buffer, i * 16, 16)
    let A = a0, B = b0, C = c0, D = d0
    for (let j = 0; j < 64; j++) {
      let F: number
      let g: number
      if (j < 16) {
        F = (B & C) | (~B & D)
        g = j
      } else if (j < 32) {
        F = (D & B) | (~D & C)
        g = (5 * j + 1) % 16
      } else if (j < 48) {
        F = B ^ C ^ D
        g = (3 * j + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * j) % 16
      }
      F = add32(add32(add32(F, A), K[j]), M[g])
      A = D
      D = C
      C = B
      B = add32(B, rotl(F, s[j]))
    }
    a0 = add32(a0, A)
    b0 = add32(b0, B)
    c0 = add32(c0, C)
    d0 = add32(d0, D)
  }

  // 输出（小端）
  const out = new Uint8Array(16)
  const outView = new DataView(out.buffer)
  outView.setUint32(0, a0 >>> 0, true)
  outView.setUint32(4, b0 >>> 0, true)
  outView.setUint32(8, c0 >>> 0, true)
  outView.setUint32(12, d0 >>> 0, true)
  return out
}

// HMAC-MD5 实现
function hmacMd5(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64
  let k = key
  // 密钥过长则先哈希
  if (k.length > blockSize) {
    k = md5(k)
  }
  // 补齐到 block size
  const paddedKey = new Uint8Array(blockSize)
  paddedKey.set(k)

  // ipad 和 opad
  const ipad = new Uint8Array(blockSize)
  const opad = new Uint8Array(blockSize)
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = paddedKey[i] ^ 0x36
    opad[i] = paddedKey[i] ^ 0x5c
  }

  // inner = md5(ipad + message)
  const inner = new Uint8Array(blockSize + message.length)
  inner.set(ipad)
  inner.set(message, blockSize)
  const innerHash = md5(inner)

  // outer = md5(opad + innerHash)
  const outer = new Uint8Array(blockSize + 16)
  outer.set(opad)
  outer.set(innerHash, blockSize)
  return md5(outer)
}

// 计算签名
async function compute() {
  if (!message.value && !secret.value) {
    signature.value = ''
    return
  }

  try {
    const keyBytes = decodeInput(secret.value, inputEncoding.value)
    const msgBytes = decodeInput(message.value, inputEncoding.value)

    let sigBytes: Uint8Array

    if (algorithm.value === 'MD5') {
      // 使用纯前端 MD5 实现
      sigBytes = hmacMd5(keyBytes, msgBytes)
    } else {
      // 使用 Web Crypto API
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: { name: algorithm.value } },
        false,
        ['sign']
      )
      const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgBytes)
      sigBytes = new Uint8Array(sigBuffer)
    }

    signature.value = outputEncoding.value === 'hex'
      ? toHex(sigBytes)
      : toBase64(sigBytes)
  } catch (e: unknown) {
    signature.value = ''
    msg.error('计算失败：' + (e instanceof Error ? e.message : String(e)))
  }
}

async function copyResult() {
  if (!signature.value) return
  try {
    await navigator.clipboard.writeText(signature.value)
    msg.success('已复制')
  } catch {
    msg.error('复制失败')
  }
}

function clear() {
  message.value = ''
  secret.value = ''
  signature.value = ''
}
</script>

<style scoped>
.hmac-signer {
  max-width: 1000px;
  margin: 0 auto;
}

.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .input-grid {
    grid-template-columns: 1fr;
  }
}

.input-block {
  display: flex;
  flex-direction: column;
}

.options {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .option-item label {
  color: #bbb;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.code-area :deep(textarea),
.code-area :deep(input) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.result-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.result-input {
  flex: 1;
}

.result-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
