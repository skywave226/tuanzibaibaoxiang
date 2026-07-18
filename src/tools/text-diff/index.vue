<template>
  <div class="text-diff">
    <div class="input-area mb-4">
      <div class="input-grid">
        <div class="input-pane">
          <div class="pane-label mb-2 flex justify-between">
            <span>原始文本</span>
            <n-button size="tiny" quaternary @click="loadExample">示例</n-button>
          </div>
          <n-input
            v-model:value="text1"
            type="textarea"
            placeholder="输入原始文本"
            rows="10"
            :autosize="false"
          />
        </div>
        <div class="input-pane">
          <div class="pane-label mb-2">修改后文本</div>
          <n-input
            v-model:value="text2"
            type="textarea"
            placeholder="输入修改后的文本"
            rows="10"
            :autosize="false"
          />
        </div>
      </div>
      <div class="flex items-center gap-2 mt-3 flex-wrap">
        <n-button type="primary" @click="compare">对比</n-button>
        <n-button @click="swap">交换</n-button>
        <n-button @click="clearAll">清空</n-button>
        <n-radio-group v-model:value="viewMode" size="small">
          <n-radio-button value="split">并列</n-radio-button>
          <n-radio-button value="unified">统一</n-radio-button>
        </n-radio-group>
        <n-checkbox v-model:checked="ignoreWhitespace">忽略空白差异</n-checkbox>
      </div>
    </div>

    <n-alert v-if="lineWarning" type="warning" class="mb-3">
      两栏文本总行数超过 {{ MAX_LINES }} 行，对比可能会较慢
    </n-alert>

    <div class="card" v-if="diffResult.length > 0">
      <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div class="pane-label">对比结果</div>
        <div class="flex items-center gap-3 text-sm">
          <span class="diff-stat added">+{{ addedCount }}</span>
          <span class="diff-stat removed">-{{ removedCount }}</span>
          <n-button size="tiny" @click="exportPatch">导出 Patch</n-button>
          <n-button size="tiny" @click="copyResult">复制结果</n-button>
        </div>
      </div>

      <!-- 统一视图 -->
      <div v-if="viewMode === 'unified'" class="diff-view">
        <div
          v-for="(line, index) in diffResult"
          :key="index"
          class="diff-line"
          :class="line.type"
        >
          <span class="line-number">{{ line.lineNum }}</span>
          <span class="line-prefix">{{ line.prefix }}</span>
          <span class="line-content" v-html="highlightInline(line)"></span>
        </div>
      </div>

      <!-- 并列视图 -->
      <div v-else class="split-diff-view">
        <div class="split-pane">
          <div class="split-header">原始</div>
          <div
            v-for="(line, index) in leftLines"
            :key="'l' + index"
            class="diff-line"
            :class="line.type"
          >
            <span class="line-number">{{ line.lineNum }}</span>
            <span class="line-content">{{ line.content }}</span>
          </div>
        </div>
        <div class="split-pane">
          <div class="split-header">修改后</div>
          <div
            v-for="(line, index) in rightLines"
            :key="'r' + index"
            class="diff-line"
            :class="line.type"
          >
            <span class="line-number">{{ line.lineNum }}</span>
            <span class="line-content" v-html="line.highlighted || line.content"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-4" v-else>
      <n-empty description="输入文本后点击对比按钮查看差异" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NEmpty, NAlert, NRadioGroup, NRadioButton, NCheckbox, useMessage } from 'naive-ui'

const message = useMessage()
const text1 = ref('')
const text2 = ref('')
const viewMode = ref<'split' | 'unified'>('unified')
const ignoreWhitespace = ref(false)

const MAX_LINES = 500
const lineWarning = computed(() => {
  const lines1 = text1.value.split('\n').length
  const lines2 = text2.value.split('\n').length
  return lines1 + lines2 > MAX_LINES
})

let compareTimer: number | null = null

interface DiffLine {
  type: 'same' | 'added' | 'removed'
  lineNum: number
  prefix: string
  content: string
  highlighted?: string
  pairIndex?: number
}

const diffResult = ref<DiffLine[]>([])

const addedCount = computed(() => diffResult.value.filter(l => l.type === 'added').length)
const removedCount = computed(() => diffResult.value.filter(l => l.type === 'removed').length)

const leftLines = computed(() => diffResult.value.filter(l => l.type !== 'added'))
const rightLines = computed(() => diffResult.value.filter(l => l.type !== 'removed'))

function normalizeLine(line: string): string {
  return ignoreWhitespace.value ? line.replace(/\s+/g, ' ').trim() : line
}

function compare() {
  if (compareTimer) return
  compareTimer = window.setTimeout(() => { compareTimer = null }, 300)

  const lines1 = text1.value.split('\n')
  const lines2 = text2.value.split('\n')

  const result: DiffLine[] = []

  const normalized1 = lines1.map(normalizeLine)
  const normalized2 = lines2.map(normalizeLine)

  const lcs = computeLCS(normalized1, normalized2)
  let i = 0, j = 0, k = 0

  while (i < lines1.length || j < lines2.length) {
    if (k < lcs.length && i < lines1.length && normalized1[i] === lcs[k]) {
      if (j < lines2.length && normalized2[j] === lcs[k]) {
        result.push({ type: 'same', lineNum: i + 1, prefix: ' ', content: lines1[i] })
        i++
        j++
        k++
      } else {
        result.push({ type: 'removed', lineNum: i + 1, prefix: '-', content: lines1[i] })
        i++
      }
    } else if (k < lcs.length && j < lines2.length && normalized2[j] === lcs[k]) {
      result.push({ type: 'added', lineNum: j + 1, prefix: '+', content: lines2[j] })
      j++
    } else {
      if (i < lines1.length) {
        result.push({ type: 'removed', lineNum: i + 1, prefix: '-', content: lines1[i] })
        i++
      }
      if (j < lines2.length) {
        result.push({ type: 'added', lineNum: j + 1, prefix: '+', content: lines2[j] })
        j++
      }
    }
  }

  // 为并列视图生成行内高亮
  computeInlineHighlights(result)
  diffResult.value = result
}

function computeInlineHighlights(result: DiffLine[]) {
  let removedBuffer: DiffLine[] = []
  let addedBuffer: DiffLine[] = []

  function flushBuffers() {
    if (removedBuffer.length === 1 && addedBuffer.length === 1) {
      const removed = removedBuffer[0]
      const added = addedBuffer[0]
      const { removedHtml, addedHtml } = highlightWordDiff(removed.content, added.content)
      removed.highlighted = removedHtml
      added.highlighted = addedHtml
    }
    removedBuffer = []
    addedBuffer = []
  }

  for (const line of result) {
    if (line.type === 'removed') {
      removedBuffer.push(line)
    } else if (line.type === 'added') {
      addedBuffer.push(line)
    } else {
      flushBuffers()
    }
  }
  flushBuffers()
}

function highlightWordDiff(oldText: string, newText: string): { removedHtml: string; addedHtml: string } {
  const oldWords = oldText.split(/(\s+)/)
  const newWords = newText.split(/(\s+)/)
  const lcs = computeLCS(oldWords, newWords)

  let i = 0, j = 0, k = 0
  const removedParts: string[] = []
  const addedParts: string[] = []

  while (i < oldWords.length || j < newWords.length) {
    if (k < lcs.length && i < oldWords.length && oldWords[i] === lcs[k]) {
      if (j < newWords.length && newWords[j] === lcs[k]) {
        removedParts.push(escapeHtml(oldWords[i]))
        addedParts.push(escapeHtml(newWords[j]))
        i++; j++; k++
      } else {
        removedParts.push(`<span class="inline-removed">${escapeHtml(oldWords[i])}</span>`)
        i++
      }
    } else if (k < lcs.length && j < newWords.length && newWords[j] === lcs[k]) {
      addedParts.push(`<span class="inline-added">${escapeHtml(newWords[j])}</span>`)
      j++
    } else {
      if (i < oldWords.length) {
        removedParts.push(`<span class="inline-removed">${escapeHtml(oldWords[i])}</span>`)
        i++
      }
      if (j < newWords.length) {
        addedParts.push(`<span class="inline-added">${escapeHtml(newWords[j])}</span>`)
        j++
      }
    }
  }

  return { removedHtml: removedParts.join(''), addedHtml: addedParts.join('') }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightInline(line: DiffLine): string {
  if (line.type === 'same' || !line.highlighted) return escapeHtml(line.content)
  return line.highlighted
}

function computeLCS(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length, n = arr2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const lcs: string[] = []
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1])
      i--; j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return lcs
}

function swap() {
  const temp = text1.value
  text1.value = text2.value
  text2.value = temp
  compare()
}

function clearAll() {
  text1.value = ''
  text2.value = ''
  diffResult.value = []
}

function exportPatch() {
  const patch = diffResult.value.map(l => `${l.prefix}${l.content}`).join('\n')
  const blob = new Blob([patch], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'diff.patch'
  a.click()
  URL.revokeObjectURL(url)
}

function copyResult() {
  const text = diffResult.value.map(l => `${l.prefix}${l.content}`).join('\n')
  navigator.clipboard.writeText(text)
  message.success('已复制')
}

function loadExample() {
  text1.value = `Line 1: Hello world
Line 2: This is a sample
Line 3: Old content here
Line 4: Common line`
  text2.value = `Line 1: Hello world
Line 2: This is a sample
Line 3: New content here
Line 4: Common line
Line 5: Added line`
  compare()
}
</script>

<style scoped>
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

.diff-view, .split-diff-view {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: auto;
  max-height: 500px;
}

.split-diff-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.split-header {
  padding: 8px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
}

.dark .split-header {
  background: #1e1e1e;
  border-color: #2a2a4a;
}

.dark .diff-view, .dark .split-diff-view {
  border-color: #2a2a4a;
}

.diff-line {
  display: flex;
  padding: 2px 8px;
  white-space: pre-wrap;
  word-break: break-all;
}

.diff-line.added {
  background: #f0f9eb;
}

.diff-line.removed {
  background: #fef0f0;
}

.dark .diff-line.added {
  background: rgba(99, 226, 183, 0.1);
}

.dark .diff-line.removed {
  background: rgba(255, 107, 107, 0.1);
}

.line-number {
  width: 40px;
  text-align: right;
  color: #999;
  padding-right: 8px;
  flex-shrink: 0;
  user-select: none;
}

.line-prefix {
  width: 20px;
  flex-shrink: 0;
  font-weight: bold;
}

.diff-line.added .line-prefix {
  color: #18a058;
}

.diff-line.removed .line-prefix {
  color: #d03050;
}

.line-content {
  flex: 1;
}

:deep(.inline-added) {
  background: #a7f3d0;
  border-radius: 2px;
  padding: 0 2px;
}

:deep(.inline-removed) {
  background: #fecaca;
  border-radius: 2px;
  padding: 0 2px;
  text-decoration: line-through;
}

.dark :deep(.inline-added) {
  background: rgba(99, 226, 183, 0.3);
}

.dark :deep(.inline-removed) {
  background: rgba(255, 107, 107, 0.3);
}

.diff-stat.added {
  color: #18a058;
  font-weight: bold;
}

.diff-stat.removed {
  color: #d03050;
  font-weight: bold;
}
</style>
