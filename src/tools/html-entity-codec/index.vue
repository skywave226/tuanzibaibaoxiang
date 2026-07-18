<template>
  <div class="html-entity-codec">
    <div class="toolbar mb-4 flex items-center justify-between flex-wrap gap-3">
      <n-space>
        <n-button type="primary" @click="encode">编码 →</n-button>
        <n-button type="primary" @click="decode">← 解码</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
      <n-radio-group v-model:value="mode" size="small">
        <n-radio-button value="named">命名实体</n-radio-button>
        <n-radio-button value="decimal">十进制</n-radio-button>
        <n-radio-button value="hex">十六进制</n-radio-button>
        <n-radio-button value="all">全部编码</n-radio-button>
      </n-radio-group>
    </div>

    <div class="editor-area">
      <div class="editor-pane">
        <div class="pane-label flex justify-between">
          <span>原文</span>
          <n-button size="tiny" quaternary @click="copyText(text)">复制</n-button>
        </div>
        <n-input
          v-model:value="text"
          type="textarea"
          placeholder="输入需要编码或解码的文本，如：<div>Hello & World</div>"
          rows="12"
          :autosize="false"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label flex justify-between">
          <span>HTML 实体结果</span>
          <n-button size="tiny" quaternary @click="copyText(result)">复制</n-button>
        </div>
        <n-input
          v-model:value="result"
          type="textarea"
          placeholder="编码/解码结果"
          rows="12"
          :autosize="false"
        />
      </div>
    </div>

    <div class="actions mt-4 flex gap-3 flex-wrap">
      <n-button size="small" @click="downloadResult" :disabled="!result">下载结果</n-button>
      <n-button size="small" @click="text = result" :disabled="!result">结果作为输入</n-button>
    </div>

    <n-alert type="error" v-if="errorMsg" class="mt-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>

    <n-card title="常用实体对照" class="mt-6">
      <div class="entity-grid">
        <div v-for="ex in entities" :key="ex.name" class="entity-row">
          <span class="entity-name">{{ ex.name }}</span>
          <span class="entity-char">{{ ex.char }}</span>
          <span class="entity-code">{{ ex.named }}</span>
          <n-button text size="small" @click="insertEntity(ex.char)">插入</n-button>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace, NInput, NAlert, NCard, NRadioGroup, NRadioButton, useMessage } from 'naive-ui'

const message = useMessage()
const text = ref('')
const result = ref('')
const errorMsg = ref('')
const mode = ref<'named' | 'decimal' | 'hex' | 'all'>('named')

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

const reverseNamedEntities: Record<string, string> = {}
Object.entries(namedEntities).forEach(([char, entity]) => {
  reverseNamedEntities[entity] = char
})

const entities = [
  { name: '小于号', char: '<', named: '&lt;' },
  { name: '大于号', char: '>', named: '&gt;' },
  { name: '与号', char: '&', named: '&amp;' },
  { name: '双引号', char: '"', named: '&quot;' },
  { name: '撇号', char: "'", named: '&apos;' },
  { name: '空格', char: ' ', named: '&nbsp;' },
  { name: '版权', char: '©', named: '&copy;' },
  { name: '注册', char: '®', named: '&reg;' },
  { name: '人民币', char: '¥', named: '&yen;' },
  { name: '欧元', char: '€', named: '&euro;' },
  { name: '破折号', char: '—', named: '&mdash;' },
  { name: '乘号', char: '×', named: '&times;' },
  { name: '除号', char: '÷', named: '&divide;' },
  { name: '省略号', char: '…', named: '&hellip;' },
  { name: '度', char: '°', named: '&deg;' },
]

function encodeChar(ch: string): string {
  if (mode.value === 'named') {
    return namedEntities[ch] ?? ch
  }
  const code = ch.charCodeAt(0)
  if (mode.value === 'decimal') {
    return `&#${code};`
  }
  if (mode.value === 'hex') {
    return `&#x${code.toString(16).toLowerCase()};`
  }
  // all
  if (code < 128 && !Object.prototype.hasOwnProperty.call(namedEntities, ch)) {
    return ch
  }
  return namedEntities[ch] ?? `&#${code};`
}

function encode() {
  errorMsg.value = ''
  try {
    if (mode.value === 'named') {
      result.value = text.value.replace(/[<>&"' ©®™¥€£¢§¶·«»—–…°±×÷µ]/g, ch => encodeChar(ch))
    } else if (mode.value === 'all') {
      result.value = text.value.split('').map(ch => encodeChar(ch)).join('')
    } else {
      result.value = text.value.replace(/[^\x20-\x7E]/g, ch => encodeChar(ch))
        .replace(/[<>&"']/g, ch => namedEntities[ch] ?? ch)
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

    // 先解码命名实体
    decoded = decoded.replace(/&[a-zA-Z]+;/g, (entity) => {
      return reverseNamedEntities[entity] ?? entity
    })

    // 再解码数字实体（十进制 &#60; 和十六进制 &#x3c;）
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

function copyText(value: string) {
  navigator.clipboard.writeText(value)
  message.success('已复制')
}

function insertEntity(char: string) {
  text.value += char
}

function downloadResult() {
  const blob = new Blob([result.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'html-entity-result.txt'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.html-entity-codec { max-width: 900px; margin: 0 auto; }

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

.entity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}

.entity-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  background: #f9f9f9;
}

.dark .entity-row {
  background: #1e1e1e;
}

.entity-name {
  flex: 1;
  font-size: 13px;
  color: #666;
}

.dark .entity-name {
  color: #aaa;
}

.entity-char {
  width: 24px;
  text-align: center;
  font-weight: 600;
}

.entity-code {
  width: 70px;
  font-family: monospace;
  font-size: 12px;
  color: #888;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
