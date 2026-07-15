<template>
  <div class="json-formatter">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="format">格式化</n-button>
        <n-button @click="compress">压缩</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
      <n-tag v-if="errorMsg" type="error" class="mt-2">{{ errorMsg }}</n-tag>
      <n-tag v-else-if="input && isValid" type="success">✓ JSON 合法</n-tag>
    </div>
    <div class="editor-area">
      <div class="editor-pane">
        <div class="pane-label">输入</div>
        <n-input
          v-model:value="input"
          type="textarea"
          placeholder='粘贴 JSON，例如：{"key":"value"}'
          class="code-input"
          :autosize="false"
          rows="16"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label">输出</div>
        <n-input
          :value="output"
          type="textarea"
          readonly
          class="code-input"
          :autosize="false"
          rows="16"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NInput, NTag } from 'naive-ui'

const input = ref('')
const errorMsg = ref('')

const isValid = computed(() => {
  if (!input.value.trim()) return false
  try { JSON.parse(input.value); return true } catch { return false }
})

const output = ref('')

function format() {
  try {
    const obj = JSON.parse(input.value)
    output.value = JSON.stringify(obj, null, 2)
    errorMsg.value = ''
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    output.value = ''
  }
}

function compress() {
  try {
    const obj = JSON.parse(input.value)
    output.value = JSON.stringify(obj)
    errorMsg.value = ''
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    output.value = ''
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
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

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
