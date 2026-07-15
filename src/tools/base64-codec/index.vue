<template>
  <div class="base64-codec">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="encode">编码 →</n-button>
        <n-button type="primary" @click="decode">← 解码</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
      <n-tag v-if="errorMsg" type="error">{{ errorMsg }}</n-tag>
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
        <div class="pane-label">Base64</div>
        <n-input
          v-model:value="base64"
          type="textarea"
          placeholder="Base64 结果"
          rows="12"
          :autosize="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace, NInput, NTag } from 'naive-ui'

const text = ref('')
const base64 = ref('')
const errorMsg = ref('')

function encode() {
  try {
    base64.value = btoa(unescape(encodeURIComponent(text.value)))
    errorMsg.value = ''
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
  }
}

function decode() {
  try {
    text.value = decodeURIComponent(escape(atob(base64.value)))
    errorMsg.value = ''
  } catch (e: unknown) {
    errorMsg.value = '解码失败，请检查 Base64 格式'
  }
}

function clearAll() {
  text.value = ''
  base64.value = ''
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

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
