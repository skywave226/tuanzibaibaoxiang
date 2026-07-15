<template>
  <div class="base32-codec">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="encode">编码 →</n-button>
        <n-button type="primary" @click="decode">← 解码</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
      <n-space>
        <n-radio-group v-model:value="variant" size="small">
          <n-radio-button value="rfc4648">RFC 4648</n-radio-button>
          <n-radio-button value="hex">Hex（0-9A-V）</n-radio-button>
          <n-radio-button value="crockford">Crockford</n-radio-button>
        </n-radio-group>
      </n-space>
    </div>

    <div class="options mb-4">
      <n-space>
        <n-checkbox v-model:checked="padding">填充（=）</n-checkbox>
        <n-checkbox v-model:checked="upperCase">大写输出</n-checkbox>
      </n-space>
    </div>

    <div class="editor-area">
      <div class="editor-pane">
        <div class="pane-label">输入</div>
        <n-input
          v-model:value="input"
          type="textarea"
          placeholder="输入要编码或解码的文本"
          rows="10"
          :autosize="false"
        />
        <div class="text-info mt-2">
          <span>字符数：{{ input.length }}</span>
          <span>字节数：{{ byteCount }}</span>
        </div>
      </div>
      <div class="editor-pane">
        <div class="pane-label">Base32 结果</div>
        <n-input
          v-model:value="output"
          type="textarea"
          placeholder="编码/解码结果"
          rows="10"
          :autosize="false"
        />
        <div class="text-info mt-2">
          <span>字符数：{{ output.length }}</span>
        </div>
      </div>
    </div>

    <n-alert type="error" v-if="errorMsg" class="mt-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>

    <div class="card mt-4">
      <h3 class="text-sm font-bold mb-3">编码规范说明</h3>
      <n-space vertical size="small">
        <div v-for="v in variants" :key="v.name" class="variant-row">
          <span class="text-sm text-gray-500 w-32">{{ v.name }}</span>
          <span class="text-sm font-mono">{{ v.alphabet }}</span>
        </div>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NInput, NAlert, NRadioGroup, NRadioButton, NCheckbox } from 'naive-ui'

const input = ref('')
const output = ref('')
const errorMsg = ref('')
const variant = ref<'rfc4648' | 'hex' | 'crockford'>('rfc4648')
const padding = ref(true)
const upperCase = ref(true)

const variants = [
  { name: 'RFC 4648', alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' },
  { name: 'Hex (extended hex)', alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUV' },
  { name: 'Crockford', alphabet: '0123456789ABCDEFGHJKMNPQRSTVWXYZ' },
]

// 根据变体获取字母表
function getAlphabetByVariant(): string {
  if (variant.value === 'rfc4648') return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  if (variant.value === 'hex') return '0123456789ABCDEFGHIJKLMNOPQRSTUV'
  return '0123456789ABCDEFGHJKMNPQRSTVWXYZ' // crockford
}

// 字符串 → UTF-8 字节数组
function stringToBytes(str: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

// UTF-8 字节数组 → 字符串
function bytesToString(bytes: Uint8Array): string {
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(bytes)
}

const byteCount = computed(() => stringToBytes(input.value).length)

function encode() {
  errorMsg.value = ''
  try {
    const bytes = stringToBytes(input.value)
    if (bytes.length === 0) {
      output.value = ''
      return
    }

    const alphabet = getAlphabetByVariant()
    let result = ''
    let buffer = 0
    let bits = 0

    for (let i = 0; i < bytes.length; i++) {
      buffer = (buffer << 8) | bytes[i]
      bits += 8
      while (bits >= 5) {
        bits -= 5
        const index = (buffer >> bits) & 0x1F
        result += alphabet[index]
      }
    }

    // 处理剩余的位
    if (bits > 0) {
      const index = (buffer << (5 - bits)) & 0x1F
      result += alphabet[index]
    }

    // 添加填充
    if (padding.value) {
      while (result.length % 8 !== 0) {
        result += '='
      }
    }

    output.value = upperCase.value ? result.toUpperCase() : result.toLowerCase()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '编码失败：' + msg
  }
}

function decode() {
  errorMsg.value = ''
  try {
    let str = input.value.trim().toUpperCase()

    // Crockford 规范：处理易混淆字符
    if (variant.value === 'crockford') {
      str = str.replace(/O/g, '0').replace(/I|L/g, '1')
    }

    // 移除填充
    str = str.replace(/=+$/, '')

    const alphabet = getAlphabetByVariant()
    const bytes: number[] = []
    let buffer = 0
    let bits = 0

    for (const ch of str) {
      const index = alphabet.indexOf(ch)
      if (index === -1) {
        throw new Error(`无效字符：${ch}`)
      }
      buffer = (buffer << 5) | index
      bits += 5
      if (bits >= 8) {
        bits -= 8
        bytes.push((buffer >> bits) & 0xFF)
      }
    }

    output.value = bytesToString(new Uint8Array(bytes))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '解码失败：' + msg
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
  errorMsg.value = ''
}
</script>

<style scoped>
.base32-codec {
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.text-info {
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #888;
}

.variant-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
