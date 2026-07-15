<template>
  <div class="unicode-converter">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="encode">编码 →</n-button>
        <n-button type="primary" @click="decode">← 解码</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
    </div>

    <div class="mode-switch mb-4">
      <n-radio-group v-model:value="mode" size="small">
        <n-radio-button value="slash">\\uXXXX 转义</n-radio-button>
        <n-radio-button value="html">HTML 实体（&#xXXXX;）</n-radio-button>
        <n-radio-button value="css">CSS（\\XXXX）</n-radio-button>
      </n-radio-group>
    </div>

    <div class="config mb-4" v-if="mode === 'slash'">
      <n-space align="center">
        <n-checkbox v-model:checked="encodeAscii">同时编码 ASCII 字符</n-checkbox>
        <n-checkbox v-model:checked="upperCase">使用大写（\\uABCD）</n-checkbox>
      </n-space>
    </div>

    <div class="editor-area">
      <div class="editor-pane">
        <div class="pane-label">原文</div>
        <n-input
          v-model:value="text"
          type="textarea"
          placeholder="输入文本，如：你好，世界！Hello"
          rows="12"
          :autosize="false"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label">Unicode 编码结果</div>
        <n-input
          v-model:value="result"
          type="textarea"
          placeholder="编码/解码结果"
          rows="12"
          :autosize="false"
        />
      </div>
    </div>

    <n-alert type="error" v-if="errorMsg" class="mt-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>

    <div class="examples card mt-4">
      <h3 class="text-sm font-bold mb-3">转换示例</h3>
      <n-space vertical size="small">
        <div v-for="ex in examples" :key="ex.label" class="example-row">
          <span class="text-sm text-gray-500 w-24">{{ ex.label }}</span>
          <n-button text size="small" @click="text = ex.text" class="example-btn">
            {{ ex.text }}
          </n-button>
        </div>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace, NInput, NAlert, NRadioGroup, NRadioButton, NCheckbox } from 'naive-ui'

const text = ref('')
const result = ref('')
const errorMsg = ref('')
const mode = ref<'slash' | 'html' | 'css'>('slash')
const encodeAscii = ref(false)
const upperCase = ref(false)

const examples = [
  { label: '中文', text: '你好，世界！' },
  { label: 'Emoji', text: 'Hello 😀🎉🚀' },
  { label: '日文', text: 'こんにちは' },
  { label: '韩文', text: '안녕하세요' },
  { label: '特殊符号', text: '©®™°±÷×' },
]

function toHex(code: number, pad: number): string {
  const hex = code.toString(16).toUpperCase()
  return hex.padStart(pad, '0')
}

function encodeChar(ch: string): string {
  const code = ch.charCodeAt(0)
  const hex = upperCase.value ? toHex(code, 4) : toHex(code, 4).toLowerCase()

  if (mode.value === 'slash') {
    return `\\u${hex}`
  }
  if (mode.value === 'html') {
    return `&#x${hex};`
  }
  // CSS 模式
  return `\\${hex}`
}

function encode() {
  errorMsg.value = ''
  try {
    result.value = Array.from(text.value).map((ch) => {
      const code = ch.codePointAt(0)!
      // 处理代理对（如 Emoji）
      if (code > 0xFFFF) {
        // 转为两个 \uXXXX（surrogate pair）
        const high = 0xD800 + ((code - 0x10000) >> 10)
        const low = 0xDC00 + ((code - 0x10000) & 0x3FF)
        if (mode.value === 'slash') {
          const h = upperCase.value ? toHex(high, 4) : toHex(high, 4).toLowerCase()
          const l = upperCase.value ? toHex(low, 4) : toHex(low, 4).toLowerCase()
          return `\\u${h}\\u${l}`
        }
        if (mode.value === 'html') {
          return `&#x${toHex(code, 5).toLowerCase()};`
        }
        return `\\${toHex(high, 6).toLowerCase()}\\${toHex(low, 6).toLowerCase()}`
      }

      // ASCII 字符处理
      if (code < 128) {
        if (encodeAscii.value && mode.value === 'slash') {
          return encodeChar(ch)
        }
        return ch
      }

      return encodeChar(ch)
    }).join('')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '编码失败：' + msg
  }
}

function decode() {
  errorMsg.value = ''
  try {
    let decoded = text.value

    // 1. 解码 \uXXXX（含代理对）
    decoded = decoded.replace(/\\u([0-9a-fA-F]{4})\\u([0-9a-fA-F]{4})/g, (_, high, low) => {
      const h = parseInt(high, 16)
      const l = parseInt(low, 16)
      if (h >= 0xD800 && h <= 0xDBFF && l >= 0xDC00 && l <= 0xDFFF) {
        const code = 0x10000 + ((h - 0xD800) << 10) + (l - 0xDC00)
        return String.fromCodePoint(code)
      }
      return String.fromCharCode(h) + String.fromCharCode(l)
    })
    decoded = decoded.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })

    // 2. 解码 HTML 实体 &#xXXXX; 或 &#XXXX;
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      return String.fromCodePoint(parseInt(hex, 16))
    })
    decoded = decoded.replace(/&#(\d+);/g, (_, dec) => {
      return String.fromCodePoint(parseInt(dec, 10))
    })

    // 3. 解码 CSS \XXXX
    decoded = decoded.replace(/\\([0-9a-fA-F]{4,6})\s?/g, (_, hex) => {
      return String.fromCodePoint(parseInt(hex, 16))
    })

    result.value = decoded
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '解码失败：' + msg
  }
}

function clearAll() {
  text.value = ''
  result.value = ''
  errorMsg.value = ''
}
</script>

<style scoped>
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

.example-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.example-btn {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
