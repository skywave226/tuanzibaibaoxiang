<template>
  <div class="text-summarizer">
    <!-- 文本输入 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">输入文本</div>
      <n-input
        v-model:value="inputText"
        type="textarea"
        placeholder="粘贴需要生成摘要的文本..."
        :rows="10"
      />
      <div class="text-info mt-2">
        <span>总字数：{{ charCount }}</span>
        <span>句子数：{{ sentenceCount }}</span>
      </div>
    </div>

    <!-- 设置 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">摘要设置</div>
      <div class="config-section">
        <div class="config-item">
          <label>摘要长度</label>
          <n-radio-group v-model:value="summaryMode" size="small">
            <n-radio-button value="ratio">按比例</n-radio-button>
            <n-radio-button value="count">按句数</n-radio-button>
          </n-radio-group>
        </div>
        <div class="config-item" v-if="summaryMode === 'ratio'">
          <label>压缩比例：{{ (summaryRatio * 100).toFixed(0) }}%</label>
          <n-slider v-model:value="summaryRatio" :min="0.1" :max="0.6" :step="0.05" style="width: 200px" />
        </div>
        <div class="config-item" v-else>
          <label>摘要句数</label>
          <n-input-number v-model:value="summaryCount" :min="1" :max="20" />
        </div>
        <div class="config-item">
          <label>语言模式</label>
          <n-radio-group v-model:value="langMode" size="small">
            <n-radio-button value="auto">自动</n-radio-button>
            <n-radio-button value="zh">中文</n-radio-button>
            <n-radio-button value="en">英文</n-radio-button>
          </n-radio-group>
        </div>
      </div>
      <div class="toolbar mt-3">
        <n-button type="primary" @click="summarize" :disabled="!inputText.trim()">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="14" r="2"/><path d="M12 18a4 4 0 0 0 4-4"/></svg></span>
          生成摘要
        </n-button>
        <n-button @click="loadExample">加载示例</n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>
    </div>

    <!-- 摘要结果 -->
    <div class="card mb-4" v-if="summaryResult">
      <div class="flex items-center justify-between mb-3">
        <div class="pane-label">摘要结果</div>
        <n-button size="small" @click="copySummary">复制摘要</n-button>
      </div>
      <div class="summary-text">{{ summaryResult }}</div>
      <div class="summary-meta mt-2">
        <span>摘要字数：{{ summaryResult.length }}</span>
        <span>压缩率：{{ compressionRate }}%</span>
      </div>
    </div>

    <!-- 句子权重排名 -->
    <div class="card" v-if="rankedSentences.length > 0">
      <div class="pane-label mb-3">句子权重排名</div>
      <div class="rank-list">
        <div
          v-for="(item, index) in rankedSentences"
          :key="index"
          class="rank-item"
          :class="{ selected: item.selected }"
        >
          <div class="rank-info">
            <span class="rank-num">{{ index + 1 }}</span>
            <span class="rank-score">{{ item.score.toFixed(4) }}</span>
          </div>
          <div class="rank-sentence">{{ item.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NRadioGroup, NRadioButton, NSlider, NInputNumber, useMessage } from 'naive-ui'

const message = useMessage()

const inputText = ref('')
const summaryMode = ref<'ratio' | 'count'>('ratio')
const summaryRatio = ref(0.3)
const summaryCount = ref(3)
const langMode = ref<'auto' | 'zh' | 'en'>('auto')
const summaryResult = ref('')
const rankedSentences = ref<{ text: string; score: number; selected: boolean }[]>([])

// 字符数
const charCount = computed(() => inputText.value.length)

// 句子数
const sentenceCount = computed(() => splitSentences(inputText.value).length)

// 压缩率
const compressionRate = computed(() => {
  if (!inputText.value || !summaryResult.value) return '0'
  return ((summaryResult.value.length / inputText.value.length) * 100).toFixed(1)
})

// 中文停用词
const zhStopwords = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '上', '也',
  '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
  '那', '它', '他', '她', '们', '把', '给', '让', '从', '向', '往', '以', '为', '与',
  '及', '或', '但', '而', '且', '则', '于', '对', '可以', '这个', '那个', '什么',
  '怎么', '这样', '一样', '只是', '只有', '还有', '因为', '所以', '如果', '虽然',
  '但是', '不过', '然而', '因此', '于是', '我们', '你们', '他们', '一个', '一些',
  '一种', '时候', '时间', '地方', '东西', '情况', '方面', '问题', '事情',
])

// 英文停用词
const enStopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'on', 'at', 'by',
  'for', 'with', 'about', 'from', 'as', 'into', 'through', 'during', 'before',
  'after', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
  'their', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'i', 'me', 'my', 'if', 'then', 'so', 'no', 'not', 'only', 'own', 'same',
])

// 检测文本语言
function detectLanguage(text: string): 'zh' | 'en' {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length
  return chineseChars > englishChars ? 'zh' : 'en'
}

// 分句：按中英文标点切分
function splitSentences(text: string): string[] {
  if (!text.trim()) return []
  // 按句号、问号、感叹号、分号切分，保留分隔符
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/([。！？.!?;；])/g)
  const result: string[] = []
  for (let i = 0; i < sentences.length; i += 2) {
    let s = sentences[i] || ''
    const punct = sentences[i + 1] || ''
    s = s.trim()
    if (s) {
      result.push(s + punct)
    }
  }
  return result.filter(s => s.trim().length > 0)
}

// 分词：提取关键词
function tokenize(text: string, lang: 'zh' | 'en'): string[] {
  const tokens: string[] = []
  if (lang === 'zh') {
    // 中文：使用 2-gram 分词
    const segments = text.match(/[\u4e00-\u9fa5]+/g) || []
    for (const seg of segments) {
      for (let i = 0; i <= seg.length - 2; i++) {
        const word = seg.slice(i, i + 2)
        if (!zhStopwords.has(word)) tokens.push(word)
      }
      // 单字也加入
      for (const ch of seg) {
        if (!zhStopwords.has(ch)) tokens.push(ch)
      }
    }
    // 英文单词也提取
    const enWords = text.match(/[a-zA-Z]+/g) || []
    for (const w of enWords) {
      if (w.length >= 2 && !enStopwords.has(w.toLowerCase())) tokens.push(w.toLowerCase())
    }
  } else {
    // 英文：按空格和标点分词
    const words = text.match(/[a-zA-Z]+/g) || []
    for (const w of words) {
      if (w.length >= 2 && !enStopwords.has(w.toLowerCase())) tokens.push(w.toLowerCase())
    }
  }
  return tokens
}

// 计算两个句子之间的相似度（基于词频的余弦相似度）
function sentenceSimilarity(tokens1: string[], tokens2: string[]): number {
  if (tokens1.length === 0 || tokens2.length === 0) return 0
  // 构建词频向量
  const freq1 = new Map<string, number>()
  const freq2 = new Map<string, number>()
  for (const t of tokens1) freq1.set(t, (freq1.get(t) || 0) + 1)
  for (const t of tokens2) freq2.set(t, (freq2.get(t) || 0) + 1)
  // 计算点积
  let dotProduct = 0
  for (const [word, count] of freq1) {
    if (freq2.has(word)) {
      dotProduct += count * freq2.get(word)!
    }
  }
  // 计算模长
  let norm1 = 0
  for (const count of freq1.values()) norm1 += count * count
  let norm2 = 0
  for (const count of freq2.values()) norm2 += count * count
  norm1 = Math.sqrt(norm1)
  norm2 = Math.sqrt(norm2)
  if (norm1 === 0 || norm2 === 0) return 0
  return dotProduct / (norm1 * norm2)
}

// TextRank 算法核心实现
function textRank(sentences: string[], lang: 'zh' | 'en'): { text: string; score: number; index: number }[] {
  const n = sentences.length
  if (n === 0) return []
  if (n === 1) return [{ text: sentences[0], score: 1, index: 0 }]

  // 分词
  const tokenList = sentences.map(s => tokenize(s, lang))

  // 构建相似度矩阵
  const simMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = sentenceSimilarity(tokenList[i], tokenList[j])
      simMatrix[i][j] = sim
      simMatrix[j][i] = sim
    }
  }

  // PageRank 迭代
  const d = 0.85 // 阻尼系数
  const maxIter = 100
  const tolerance = 1e-6
  let scores = new Array(n).fill(1) // 初始分数

  for (let iter = 0; iter < maxIter; iter++) {
    const newScores = new Array(n).fill(0)
    let maxDiff = 0
    for (let i = 0; i < n; i++) {
      let sum = 0
      for (let j = 0; j < n; j++) {
        if (i === j) continue
        if (simMatrix[j][i] > 0) {
          // 计算节点 j 的出度权重和
          let outSum = 0
          for (let k = 0; k < n; k++) {
            if (k !== j) outSum += simMatrix[j][k]
          }
          if (outSum > 0) {
            sum += simMatrix[j][i] / outSum * scores[j]
          }
        }
      }
      newScores[i] = (1 - d) + d * sum
      maxDiff = Math.max(maxDiff, Math.abs(newScores[i] - scores[i]))
    }
    scores = newScores
    if (maxDiff < tolerance) break
  }

  return sentences.map((text, index) => ({ text, score: scores[index], index }))
}

// 生成摘要
function summarize() {
  if (!inputText.value.trim()) {
    message.warning('请输入文本')
    return
  }

  const sentences = splitSentences(inputText.value)
  if (sentences.length === 0) {
    message.warning('未检测到有效句子')
    return
  }
  if (sentences.length === 1) {
    summaryResult.value = sentences[0]
    rankedSentences.value = [{ text: sentences[0], score: 1, selected: true }]
    message.success('文本只有一句，直接输出')
    return
  }

  // 检测语言
  const lang = langMode.value === 'auto' ? detectLanguage(inputText.value) : langMode.value

  // 运行 TextRank
  const ranked = textRank(sentences, lang)
  // 按分数排序
  const sorted = [...ranked].sort((a, b) => b.score - a.score)

  // 确定摘要句数
  let count: number
  if (summaryMode.value === 'ratio') {
    count = Math.max(1, Math.round(sentences.length * summaryRatio.value))
  } else {
    count = Math.min(summaryCount.value, sentences.length)
  }

  // 选取前 count 个句子，再按原始顺序排列
  const selectedIndices = new Set(sorted.slice(0, count).map(s => s.index))
  const selectedSentences = sentences
    .map((text, index) => ({ text, index }))
    .filter(s => selectedIndices.has(s.index))

  summaryResult.value = selectedSentences.map(s => s.text).join('')

  // 保存排名结果
  rankedSentences.value = ranked
    .sort((a, b) => b.score - a.score)
    .map(item => ({
      text: item.text,
      score: item.score,
      selected: selectedIndices.has(item.index),
    }))

  message.success(`摘要生成完成，共 ${count} 句`)
}

// 加载示例
function loadExample() {
  inputText.value = `自然语言处理是人工智能领域的一个重要分支。它研究如何让计算机理解和处理人类语言。随着深度学习技术的发展，自然语言处理取得了巨大的进步。Transformer 架构的提出是其中的一个重要里程碑。BERT、GPT 等预训练模型的出现彻底改变了自然语言处理的范式。这些模型通过在海量文本上预训练，学习到了丰富的语言知识。大语言模型在文本生成、机器翻译、问答系统等任务上表现出色。然而，大模型也面临着计算成本高、可解释性差等挑战。未来的研究方向包括提高模型的效率和可解释性。此外，如何让模型更好地理解人类意图也是重要的研究课题。总之，自然语言处理技术正在快速发展，将在更多领域发挥重要作用。`
  summaryResult.value = ''
  rankedSentences.value = []
}

// 清空
function clearAll() {
  inputText.value = ''
  summaryResult.value = ''
  rankedSentences.value = []
}

// 复制摘要
async function copySummary() {
  try {
    await navigator.clipboard.writeText(summaryResult.value)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败')
  }
}
</script>

<style scoped>
.text-summarizer {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.text-info {
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #888;
}

.config-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label {
  color: #aaa;
}

.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 摘要结果 */
.summary-text {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 3px solid #36ad6a;
  font-size: 15px;
  line-height: 1.8;
  color: #333;
}

.dark .summary-text {
  background: #1e1e2e;
  color: #ddd;
  border-left-color: #63e2b7;
}

.summary-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #888;
}

/* 排名列表 */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 500px;
  overflow-y: auto;
}

.rank-item {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  transition: all 0.2s;
}

.dark .rank-item {
  border-color: #2a2a3a;
}

.rank-item.selected {
  border-color: #36ad6a;
  background: #f0faf3;
}

.dark .rank-item.selected {
  border-color: #63e2b7;
  background: #1a2e23;
}

.rank-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.rank-num {
  font-weight: 700;
  font-size: 16px;
  color: #36ad6a;
}

.dark .rank-num {
  color: #63e2b7;
}

.rank-score {
  font-size: 11px;
  color: #aaa;
  font-family: 'Fira Code', monospace;
  margin-top: 2px;
}

.rank-sentence {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
}

.dark .rank-sentence {
  color: #bbb;
}
</style>
