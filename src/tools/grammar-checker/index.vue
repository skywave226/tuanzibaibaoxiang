<template>
  <div class="grammar-checker">
    <!-- 英文文本输入 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">输入英文文本</div>
      <n-input
        v-model:value="text"
        type="textarea"
        placeholder="输入需要检查的英文文本，例如：i have a apple. he go to school everyday."
        :rows="8"
      />
      <div class="toolbar mt-3">
        <n-button type="primary" @click="check">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span>
          检查语法
        </n-button>
        <n-button @click="clear">清空</n-button>
        <n-button @click="loadSample" quaternary>加载示例</n-button>
      </div>
    </div>

    <!-- 检查结果 -->
    <div v-if="checked">
      <div class="card mb-4">
        <div class="result-header">
          <h3 class="text-sm font-bold">检查结果</h3>
          <n-tag :type="issues.length === 0 ? 'success' : 'warning'">
            {{ issues.length === 0 ? '未发现问题' : `发现 ${issues.length} 个问题` }}
          </n-tag>
        </div>

        <!-- 高亮显示文本 -->
        <div class="highlight-text mt-3" v-if="text.trim()">
          <template v-for="(seg, i) in segments" :key="i">
            <span v-if="seg.issue" class="issue-mark" :class="seg.issue.type" :title="seg.issue.message">
              {{ seg.text }}
            </span>
            <span v-else>{{ seg.text }}</span>
          </template>
        </div>
      </div>

      <!-- 问题列表 -->
      <div class="card" v-if="issues.length > 0">
        <h3 class="text-sm font-bold mb-3">问题详情</h3>
        <div class="issue-list">
          <div v-for="(issue, index) in issues" :key="index" class="issue-item">
            <div class="issue-left">
              <n-tag :type="issueType(issue.type)" size="small">
                {{ issueTypeLabel(issue.type) }}
              </n-tag>
            </div>
            <div class="issue-main">
              <div class="issue-original">
                <span class="label">原文：</span>
                <code>{{ issue.text }}</code>
              </div>
              <div class="issue-suggestion">
                <span class="label">建议：</span>
                <code class="suggestion">{{ issue.suggestion }}</code>
              </div>
              <div class="issue-message">{{ issue.message }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无问题提示 -->
      <div class="card" v-else-if="text.trim()">
        <n-empty description="未发现语法问题，文本看起来不错！" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NInput, NTag, NEmpty } from 'naive-ui'

// 问题类型
type IssueType =
  | 'capitalization'
  | 'repetition'
  | 'article'
  | 'spacing'
  | 'agreement'
  | 'tense'

interface GrammarIssue {
  start: number
  end: number
  text: string
  message: string
  suggestion: string
  type: IssueType
}

// 文本分段（用于高亮渲染）
interface Segment {
  text: string
  issue: GrammarIssue | null
}

const text = ref('')
const checked = ref(false)
const issues = ref<GrammarIssue[]>([])

// 元音字母集合
const vowels = new Set(['a', 'e', 'i', 'o', 'u'])

// 第三人称单数代词
const thirdSingular = new Set(['he', 'she', 'it'])

// 常见动词原形与第三人称单数形式
const verbBaseToThird: Record<string, string> = {
  go: 'goes', do: 'does', watch: 'watches', fix: 'fixes', miss: 'misses',
  pass: 'passes', buzz: 'buzzes', study: 'studies', cry: 'cries',
  fly: 'flies', try: 'tries', have: 'has', be: 'is', run: 'runs',
  walk: 'walks', eat: 'eats', make: 'makes', take: 'takes', get: 'gets',
  play: 'plays', say: 'says', see: 'sees', come: 'comes', want: 'wants',
  work: 'works', live: 'lives', know: 'knows', think: 'thinks', look: 'looks',
  feel: 'feels', find: 'finds', give: 'gives', tell: 'tells', ask: 'asks',
}

// 第三人称单数 -> 原形（反向查找）
const thirdToBase: Record<string, string> = {}
for (const [base, third] of Object.entries(verbBaseToThird)) {
  thirdToBase[third] = base
}

// 不规则动词过去式
const irregularPast: Record<string, string> = {
  go: 'went', come: 'came', eat: 'ate', see: 'saw', give: 'gave',
  take: 'took', make: 'made', do: 'did', have: 'had', say: 'said',
  get: 'got', run: 'ran', write: 'wrote', read: 'read',
  speak: 'spoke', break: 'broke', begin: 'began', drink: 'drank',
  sing: 'sang', ring: 'rang', swim: 'swam', sit: 'sat', stand: 'stood',
}

// 高亮文本分段
const segments = computed<Segment[]>(() => {
  if (!checked.value || issues.value.length === 0) {
    return [{ text: text.value, issue: null }]
  }
  // 按起始位置排序
  const sorted = [...issues.value].sort((a, b) => a.start - b.start)
  const segs: Segment[] = []
  let cursor = 0
  for (const issue of sorted) {
    if (issue.start > cursor) {
      segs.push({ text: text.value.slice(cursor, issue.start), issue: null })
    }
    segs.push({ text: text.value.slice(issue.start, issue.end), issue })
    cursor = issue.end
  }
  if (cursor < text.value.length) {
    segs.push({ text: text.value.slice(cursor), issue: null })
  }
  return segs
})

// 问题类型对应的标签
function issueType(type: IssueType): 'default' | 'success' | 'info' | 'warning' | 'error' {
  const map: Record<IssueType, 'default' | 'success' | 'info' | 'warning' | 'error'> = {
    capitalization: 'info',
    repetition: 'warning',
    article: 'warning',
    spacing: 'default',
    agreement: 'error',
    tense: 'error',
  }
  return map[type]
}

function issueTypeLabel(type: IssueType): string {
  const map: Record<IssueType, string> = {
    capitalization: '大小写',
    repetition: '重复词',
    article: '冠词',
    spacing: '空格',
    agreement: '主谓一致',
    tense: '时态',
  }
  return map[type]
}

// 添加问题（去重）
function addIssue(issue: GrammarIssue) {
  // 避免重复添加同一区间
  const exists = issues.value.some(
    i => i.start === issue.start && i.end === issue.end && i.type === issue.type
  )
  if (!exists) issues.value.push(issue)
}

// 检查主谓一致：第三人称单数 + 动词原形
function checkAgreement(words: { text: string; start: number; end: number }[]) {
  for (let i = 0; i < words.length - 1; i++) {
    const w = words[i].text.toLowerCase()
    const next = words[i + 1].text.toLowerCase()
    // he/she/it + 动词原形 -> 应加 -s
    if (thirdSingular.has(w) && verbBaseToThird[next]) {
      const correct = verbBaseToThird[next]
      addIssue({
        start: words[i + 1].start,
        end: words[i + 1].end,
        text: words[i + 1].text,
        message: `第三人称单数 "${w}" 后的动词应使用第三人称单数形式`,
        suggestion: correct,
        type: 'agreement',
      })
    }
  }
}

// 检查时态：did + 过去式 -> 应使用动词原形
function checkTense(words: { text: string; start: number; end: number }[]) {
  for (let i = 0; i < words.length - 1; i++) {
    const w = words[i].text.toLowerCase()
    const next = words[i + 1].text.toLowerCase()
    if (w === 'did' || w === "didn't" || w === 'doesnt') {
      // 检查下一个词是否为不规则过去式
      if (irregularPast[next]) {
        const base = irregularPast[next]
        addIssue({
          start: words[i + 1].start,
          end: words[i + 1].end,
          text: words[i + 1].text,
          message: `"${w}" 后应使用动词原形，不使用过去式`,
          suggestion: base,
          type: 'tense',
        })
      }
      // 检查规则过去式（以 -ed 结尾）
      if (next.endsWith('ed') && next.length > 3) {
        const base = next.replace(/d$/, '').replace(/e$/, '')
        addIssue({
          start: words[i + 1].start,
          end: words[i + 1].end,
          text: words[i + 1].text,
          message: `"${w}" 后应使用动词原形，不使用过去式`,
          suggestion: base,
          type: 'tense',
        })
      }
    }
  }
}

// 检查冠词 a/an
function checkArticles(words: { text: string; start: number; end: number }[]) {
  for (let i = 0; i < words.length - 1; i++) {
    const w = words[i].text.toLowerCase()
    const next = words[i + 1].text
    if (w === 'a' && next.length > 0) {
      const first = next[0].toLowerCase()
      if (vowels.has(first)) {
        addIssue({
          start: words[i].start,
          end: words[i].end,
          text: words[i].text,
          message: `"a" 后接以元音开头的单词应使用 "an"`,
          suggestion: 'an',
          type: 'article',
        })
      }
    }
    if (w === 'an' && next.length > 0) {
      const first = next[0].toLowerCase()
      if (!vowels.has(first)) {
        addIssue({
          start: words[i].start,
          end: words[i].end,
          text: words[i].text,
          message: `"an" 后接以辅音开头的单词应使用 "a"`,
          suggestion: 'a',
          type: 'article',
        })
      }
    }
  }
}

// 检查重复词
function checkRepetition(words: { text: string; start: number; end: number }[]) {
  for (let i = 0; i < words.length - 1; i++) {
    const cur = words[i].text.toLowerCase()
    const next = words[i + 1].text.toLowerCase()
    if (cur === next && cur.length > 0) {
      addIssue({
        start: words[i + 1].start,
        end: words[i + 1].end,
        text: words[i + 1].text,
        message: `检测到重复词 "${words[i + 1].text}"，可能是笔误`,
        suggestion: words[i + 1].text + '（请确认是否需要保留）',
        type: 'repetition',
      })
    }
  }
}

// 检查大小写
function checkCapitalization(raw: string) {
  // 独立的 "i" 应为 "I"
  const iRegex = /\bi\b/g
  let match: RegExpExecArray | null
  while ((match = iRegex.exec(raw)) !== null) {
    addIssue({
      start: match.index,
      end: match.index + 1,
      text: 'i',
      message: '代词 "I" 应始终大写',
      suggestion: 'I',
      type: 'capitalization',
    })
  }

  // 句首字母应大写
  const sentenceRegex = /(^|[.!?]\s+)([a-z])/g
  while ((match = sentenceRegex.exec(raw)) !== null) {
    const letterIndex = match.index + match[1].length
    addIssue({
      start: letterIndex,
      end: letterIndex + 1,
      text: match[2],
      message: '句首字母应大写',
      suggestion: match[2].toUpperCase(),
      type: 'capitalization',
    })
  }
}

// 检查空格问题
function checkSpacing(raw: string) {
  // 标点前有空格："word ," -> "word,"
  const spaceBeforePunct = /\s+([,.;:!?])/g
  let match: RegExpExecArray | null
  while ((match = spaceBeforePunct.exec(raw)) !== null) {
    const punctStart = match.index + match[0].length - 1
    addIssue({
      start: match.index,
      end: punctStart,
      text: match[0],
      message: '标点符号前不应有空格',
      suggestion: match[1],
      type: 'spacing',
    })
  }

  // 连续多个空格
  const multiSpace = / {2,}/g
  while ((match = multiSpace.exec(raw)) !== null) {
    addIssue({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      message: '存在多余空格，建议使用单个空格',
      suggestion: ' ',
      type: 'spacing',
    })
  }

  // 标点后缺少空格：句号/逗号后直接跟字母
  const noSpaceAfterPunct = /([,;:])([a-zA-Z])/g
  while ((match = noSpaceAfterPunct.exec(raw)) !== null) {
    addIssue({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      message: '标点符号后应添加空格',
      suggestion: match[1] + ' ' + match[2],
      type: 'spacing',
    })
  }

  // 句号/感叹号/问号后缺少空格
  const noSpaceAfterSentence = /([.!?])([a-zA-Z])/g
  while ((match = noSpaceAfterSentence.exec(raw)) !== null) {
    addIssue({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      message: '句子结束标点后应添加空格',
      suggestion: match[1] + ' ' + match[2],
      type: 'spacing',
    })
  }
}

// 分词（带位置信息）
function tokenizeWithPos(raw: string): { text: string; start: number; end: number }[] {
  const words: { text: string; start: number; end: number }[] = []
  const regex = /[a-zA-Z]+(?:'[a-zA-Z]+)?/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(raw)) !== null) {
    words.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  return words
}

// 检查主流程
function check() {
  if (!text.value.trim()) return
  issues.value = []
  const raw = text.value

  // 各项规则检查
  checkCapitalization(raw)
  checkSpacing(raw)

  const words = tokenizeWithPos(raw)
  checkRepetition(words)
  checkArticles(words)
  checkAgreement(words)
  checkTense(words)

  // 按位置排序
  issues.value.sort((a, b) => a.start - b.start)
  checked.value = true
}

function clear() {
  text.value = ''
  issues.value = []
  checked.value = false
}

// 加载示例
function loadSample() {
  text.value = "i have a apple. he go to school everyday  she likes it. yesterday i didn't went there,he was happy."
  issues.value = []
  checked.value = false
}
</script>

<style scoped>
.grammar-checker {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.toolbar {
  display: flex;
  gap: 12px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.highlight-text {
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #eee;
}

.dark .highlight-text {
  background: #1e1e1e;
  border-color: #333;
}

.issue-mark {
  background: rgba(240, 160, 32, 0.2);
  border-bottom: 2px solid #f0a020;
  border-radius: 2px;
  padding: 0 2px;
  cursor: help;
}

.issue-mark.agreement,
.issue-mark.tense {
  background: rgba(208, 48, 80, 0.15);
  border-bottom-color: #d03050;
}

.issue-mark.capitalization {
  background: rgba(32, 128, 240, 0.15);
  border-bottom-color: #2080f0;
}

.issue-mark.repetition {
  background: rgba(240, 160, 32, 0.2);
  border-bottom-color: #f0a020;
}

.issue-mark.article {
  background: rgba(240, 160, 32, 0.2);
  border-bottom-color: #f0a020;
}

.issue-mark.spacing {
  background: rgba(120, 120, 120, 0.2);
  border-bottom-color: #888;
}

.issue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.issue-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.dark .issue-item {
  border-color: #333;
}

.issue-left {
  flex-shrink: 0;
}

.issue-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.issue-original,
.issue-suggestion {
  font-size: 13px;
}

.issue-original .label,
.issue-suggestion .label {
  color: #888;
  margin-right: 4px;
}

.issue-original code,
.issue-suggestion code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Fira Code', monospace;
  font-size: 12px;
}

.dark .issue-original code,
.dark .issue-suggestion code {
  background: #2a2a2a;
}

.issue-suggestion .suggestion {
  color: #18a058;
  font-weight: 600;
}

.dark .issue-suggestion .suggestion {
  color: #36ad6a;
}

.issue-message {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}
</style>
