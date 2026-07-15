<template>
  <div class="url-codec">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="encode">编码 →</n-button>
        <n-button type="primary" @click="decode">← 解码</n-button>
        <n-button @click="encodeAll">全部编码</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
    </div>

    <div class="mode-switch mb-4">
      <n-radio-group v-model:value="mode" size="small">
        <n-radio-button value="component">encodeURI (保留特殊字符)</n-radio-button>
        <n-radio-button value="full">encodeURIComponent (全部编码)</n-radio-button>
      </n-radio-group>
    </div>

    <div class="editor-area">
      <div class="editor-pane">
        <div class="pane-label">原文</div>
        <n-input
          v-model:value="text"
          type="textarea"
          placeholder="输入需要编码或解码的文本"
          rows="12"
          :autosize="false"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label">URL 编码结果</div>
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
      <h3 class="text-sm font-bold mb-3">常用示例</h3>
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
import { NButton, NSpace, NInput, NAlert, NRadioGroup, NRadioButton } from 'naive-ui'

const text = ref('')
const result = ref('')
const errorMsg = ref('')
const mode = ref<'component' | 'full'>('component')

const examples = [
  { label: '中文', text: '你好世界' },
  { label: 'URL', text: 'https://example.com/search?q=测试&page=1' },
  { label: '特殊字符', text: 'a=1&b=2&c=hello world' },
  { label: '路径', text: '/api/v1/users?name=张三&id=123' },
]

function doEncode(input: string): string {
  return mode.value === 'component' ? encodeURI(input) : encodeURIComponent(input)
}

function doDecode(input: string): string {
  return mode.value === 'component' ? decodeURI(input) : decodeURIComponent(input)
}

function encode() {
  errorMsg.value = ''
  try {
    result.value = doEncode(text.value)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '编码失败：' + msg
  }
}

function decode() {
  errorMsg.value = ''
  try {
    result.value = doDecode(text.value)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '解码失败：' + msg
  }
}

function encodeAll() {
  errorMsg.value = ''
  try {
    result.value = encodeURIComponent(text.value)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '编码失败：' + msg
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
