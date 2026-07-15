<template>
  <div class="html-entity-codec">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="encode">编码 →</n-button>
        <n-button type="primary" @click="decode">← 解码</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
    </div>

    <div class="mode-switch mb-4">
      <n-radio-group v-model:value="mode" size="small">
        <n-radio-button value="named">命名实体（&amp; &lt; &gt;）</n-radio-button>
        <n-radio-button value="decimal">十进制（&amp;#60;）</n-radio-button>
        <n-radio-button value="hex">十六进制（&amp;#x3c;）</n-radio-button>
      </n-radio-group>
    </div>

    <div class="editor-area">
      <div class="editor-pane">
        <div class="pane-label">原文</div>
        <n-input
          v-model:value="text"
          type="textarea"
          placeholder="输入需要编码或解码的文本，如：<div>Hello & World</div>"
          rows="12"
          :autosize="false"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label">HTML 实体结果</div>
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
      <h3 class="text-sm font-bold mb-3">常用实体对照</h3>
      <n-space vertical size="small">
        <div v-for="ex in entities" :key="ex.name" class="example-row">
          <span class="text-sm text-gray-500 w-32">{{ ex.name }}</span>
          <span class="text-sm font-mono w-16">{{ ex.char }}</span>
          <n-button text size="small" @click="text = ex.char" class="example-btn">
            {{ ex.named }}
          </n-button>
        </div>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace, NInput, NAlert, NRadioGroup, NRadioButton } from 'naive-ui'

const text = ref('')
const result = ref('')
const errorMsg = ref('')
const mode = ref<'named' | 'decimal' | 'hex'>('named')

// 常用命名实体映射表
const namedEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
  ' ': '&nbsp;',
  '©': '&copy;',
  '®': '&reg;',
  '™': '&trade;',
  '¥': '&yen;',
  '€': '&euro;',
  '£': '&pound;',
  '¢': '&cent;',
  '§': '&sect;',
  '¶': '&para;',
  '·': '&middot;',
  '«': '&laquo;',
  '»': '&raquo;',
  '—': '&mdash;',
  '–': '&ndash;',
  '…': '&hellip;',
  '°': '&deg;',
  '±': '&plusmn;',
  '×': '&times;',
  '÷': '&divide;',
  'µ': '&micro;',
}

// 反向映射（命名实体 → 字符）
const reverseNamedEntities: Record<string, string> = {}
Object.entries(namedEntities).forEach(([char, entity]) => {
  reverseNamedEntities[entity] = char
})

const entities = [
  { name: '< 小于号', char: '<', named: '&lt;' },
  { name: '> 大于号', char: '>', named: '&gt;' },
  { name: '& 与号', char: '&', named: '&amp;' },
  { name: '" 引号', char: '"', named: '&quot;' },
  { name: "撇号 '", char: "'", named: '&apos;' },
  { name: '© 版权', char: '©', named: '&copy;' },
  { name: '® 注册', char: '®', named: '&reg;' },
  { name: '¥ 人民币', char: '¥', named: '&yen;' },
  { name: '€ 欧元', char: '€', named: '&euro;' },
  { name: '— 破折号', char: '—', named: '&mdash;' },
]

function encodeChar(ch: string): string {
  if (mode.value === 'named') {
    return namedEntities[ch] ?? ch
  }
  const code = ch.charCodeAt(0)
  if (mode.value === 'decimal') {
    return `&#${code};`
  }
  return `&#x${code.toString(16).toLowerCase()};`
}

function encode() {
  errorMsg.value = ''
  try {
    if (mode.value === 'named') {
      // 命名实体模式：仅转换映射表中的字符
      result.value = text.value.replace(/[<>&"' ©®™¥€£¢§¶·«»—–…°±×÷µ]/g, (ch) => encodeChar(ch))
    } else {
      // 数字实体模式：转换所有非 ASCII 字符 + 特殊字符
      result.value = text.value.replace(/[^\x20-\x7E]/g, (ch) => encodeChar(ch))
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '编码失败：' + msg
  }
}

function decode() {
  errorMsg.value = ''
  try {
    let decoded = text.value

    // 1. 先解码命名实体
    decoded = decoded.replace(/&[a-zA-Z]+;/g, (entity) => {
      return reverseNamedEntities[entity] ?? entity
    })

    // 2. 再解码数字实体（十进制 &#60; 和十六进制 &#x3c;）
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })
    decoded = decoded.replace(/&#(\d+);/g, (_, dec) => {
      return String.fromCharCode(parseInt(dec, 10))
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
