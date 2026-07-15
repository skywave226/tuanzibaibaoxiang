<template>
  <div class="regex-tester">
    <div class="card mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">/</span>
        <n-input
          v-model:value="pattern"
          placeholder="输入正则表达式"
          class="flex-1"
          @input="testRegex"
        />
        <span class="text-lg">/</span>
        <n-input
          v-model:value="flags"
          placeholder="flags"
          class="w-20"
          @input="testRegex"
        />
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <n-tag
          v-for="flag in commonFlags"
          :key="flag.value"
          :checked="flags.includes(flag.value)"
          checkable
          size="small"
          @click="toggleFlag(flag.value)"
        >
          {{ flag.label }}
        </n-tag>
        <n-button size="small" @click="clearAll">清空</n-button>
      </div>
      <n-tag v-if="errorMsg" type="error" class="mt-2">{{ errorMsg }}</n-tag>
    </div>

    <div class="card mb-4">
      <div class="pane-label mb-2">测试文本</div>
      <n-input
        v-model:value="testText"
        type="textarea"
        placeholder="输入需要测试的文本"
        rows="8"
        :autosize="false"
        @input="testRegex"
      />
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-2">
        <div class="pane-label">匹配结果（{{ matches.length }} 个匹配）</div>
      </div>
      <div v-if="matches.length === 0" class="text-gray-400 text-center py-4">
        无匹配结果
      </div>
      <div v-else class="matches-list">
        <div v-for="(match, index) in matches" :key="index" class="match-item">
          <span class="match-index text-gray-400">#{{ index + 1 }}</span>
          <span class="match-value font-mono">{{ match }}</span>
          <span class="match-info text-gray-500 text-sm">
            位置: {{ matchPositions[index] }}
          </span>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <h3 class="font-bold mb-2">常用正则表达式</h3>
      <div class="preset-list">
        <div
          v-for="preset in presets"
          :key="preset.name"
          class="preset-item"
          @click="applyPreset(preset)"
        >
          <div class="preset-name">{{ preset.name }}</div>
          <div class="preset-pattern font-mono text-xs">{{ preset.pattern }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NTag } from 'naive-ui'

const pattern = ref('')
const flags = ref('g')
const testText = ref('')
const errorMsg = ref('')
const matches = ref<string[]>([])
const matchPositions = ref<string[]>([])

const commonFlags = [
  { label: '全局匹配 (g)', value: 'g' },
  { label: '忽略大小写 (i)', value: 'i' },
  { label: '多行模式 (m)', value: 'm' },
]

const presets = [
  { name: '邮箱', pattern: '[\\w.-]+@[\\w.-]+\\.\\w+' },
  { name: '手机号', pattern: '1[3-9]\\d{9}' },
  { name: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w./-]*)*' },
  { name: 'IP 地址', pattern: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}' },
  { name: '日期 (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}' },
]

function toggleFlag(flag: string) {
  if (flags.value.includes(flag)) {
    flags.value = flags.value.replace(flag, '')
  } else {
    flags.value += flag
  }
  testRegex()
}

const MAX_TEXT_LENGTH = 10000

function validatePattern(pattern: string): string | null {
  const dangerous = [
    /\([^)]*[+*][^)]*\)[+*]/,   // (x+)+  (x*)+  (x+)* etc.
    /\([^)]*\{[^}]*\}[^)]*\)[+*{]/, // (x{n,m})+ etc.
    /(\+|\*)\1+/,                 // ++ ** etc.
  ]
  for (const p of dangerous) {
    if (p.test(pattern)) {
      return '正则表达式可能包含导致回溯爆炸的嵌套量词，请简化表达式'
    }
  }
  return null
}

function testRegex() {
  if (!pattern.value || !testText.value) {
    matches.value = []
    matchPositions.value = []
    errorMsg.value = ''
    return
  }

  if (testText.value.length > MAX_TEXT_LENGTH) {
    errorMsg.value = `测试文本过长（当前 ${testText.value.length} 字符，最大 ${MAX_TEXT_LENGTH} 字符），请缩短文本后重试`
    matches.value = []
    matchPositions.value = []
    return
  }

  const patternWarning = validatePattern(pattern.value)
  if (patternWarning) {
    errorMsg.value = patternWarning
    matches.value = []
    matchPositions.value = []
    return
  }

  try {
    const regex = new RegExp(pattern.value, flags.value)
    const results: string[] = []
    const positions: string[] = []

    if (flags.value.includes('g')) {
      let match
      while ((match = regex.exec(testText.value)) !== null) {
        results.push(match[0])
        positions.push(`${match.index}`)
        if (match[0].length === 0) regex.lastIndex++
      }
    } else {
      const match = regex.exec(testText.value)
      if (match) {
        results.push(match[0])
        positions.push(`${match.index}`)
      }
    }

    matches.value = results
    matchPositions.value = positions
    errorMsg.value = ''
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    matches.value = []
    matchPositions.value = []
  }
}

function applyPreset(preset: { name: string; pattern: string }) {
  pattern.value = preset.pattern
  testRegex()
}

function clearAll() {
  pattern.value = ''
  flags.value = 'g'
  testText.value = ''
  matches.value = []
  matchPositions.value = []
  errorMsg.value = ''
}
</script>

<style scoped>
.matches-list {
  max-height: 300px;
  overflow-y: auto;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.match-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.dark .match-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.match-index {
  width: 30px;
  flex-shrink: 0;
}

.match-value {
  flex: 1;
  word-break: break-all;
}

.preset-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.preset-item {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #e8e8e8;
  transition: all 0.2s;
}

.preset-item:hover {
  border-color: #36ad6a;
  background: #f0f9eb;
}

.dark .preset-item {
  border-color: #2a2a4a;
}

.dark .preset-item:hover {
  border-color: #63e2b7;
  background: #1a3a2a;
}

.preset-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.preset-pattern {
  color: #888;
}
</style>
