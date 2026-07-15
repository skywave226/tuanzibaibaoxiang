<template>
  <div class="text-diff">
    <div class="input-area mb-4">
      <div class="input-grid">
        <div class="input-pane">
          <div class="pane-label mb-2">原始文本</div>
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
      <div class="flex items-center gap-2 mt-3">
        <n-button type="primary" @click="compare">对比</n-button>
        <n-button @click="swap">交换</n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>
    </div>

    <n-alert v-if="lineWarning" type="warning" class="mb-3">
      两栏文本总行数超过 {{ MAX_LINES }} 行，对比可能会较慢
    </n-alert>

    <div class="card" v-if="diffResult.length > 0">
      <div class="flex items-center justify-between mb-3">
        <div class="pane-label">对比结果</div>
        <div class="flex items-center gap-3 text-sm">
          <span class="diff-stat added">+{{ addedCount }}</span>
          <span class="diff-stat removed">-{{ removedCount }}</span>
        </div>
      </div>
      <div class="diff-view">
        <div
          v-for="(line, index) in diffResult"
          :key="index"
          class="diff-line"
          :class="line.type"
        >
          <span class="line-number">{{ line.lineNum }}</span>
          <span class="line-prefix">{{ line.prefix }}</span>
          <span class="line-content">{{ line.content }}</span>
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
import { NInput, NButton, NEmpty, NAlert } from 'naive-ui'

const text1 = ref('')
const text2 = ref('')

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
}

const diffResult = ref<DiffLine[]>([])

const addedCount = computed(() => diffResult.value.filter(l => l.type === 'added').length)
const removedCount = computed(() => diffResult.value.filter(l => l.type === 'removed').length)

function compare() {
  if (compareTimer) return
  compareTimer = window.setTimeout(() => { compareTimer = null }, 300)

  const lines1 = text1.value.split('\n')
  const lines2 = text2.value.split('\n')

  const result: DiffLine[] = []

  const lcs = computeLCS(lines1, lines2)
  let i = 0, j = 0, k = 0

  while (i < lines1.length || j < lines2.length) {
    if (k < lcs.length && i < lines1.length && lines1[i] === lcs[k]) {
      if (j < lines2.length && lines2[j] === lcs[k]) {
        result.push({ type: 'same', lineNum: i + 1, prefix: ' ', content: lines1[i] })
        i++
        j++
        k++
      } else {
        result.push({ type: 'removed', lineNum: i + 1, prefix: '-', content: lines1[i] })
        i++
      }
    } else if (k < lcs.length && j < lines2.length && lines2[j] === lcs[k]) {
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

  diffResult.value = result
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
      i--
      j--
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

.diff-view {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: auto;
  max-height: 500px;
}

.dark .diff-view {
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

.diff-stat.added {
  color: #18a058;
  font-weight: bold;
}

.diff-stat.removed {
  color: #d03050;
  font-weight: bold;
}
</style>
