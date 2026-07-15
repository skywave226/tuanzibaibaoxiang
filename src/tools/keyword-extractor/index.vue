<template>
  <div class="keyword-extractor">
    <!-- 文本输入区 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">输入文本</div>
      <n-input
        v-model:value="text"
        type="textarea"
        placeholder="粘贴需要提取关键词的文章内容，支持中英文混合..."
        :rows="10"
      />
      <div class="text-info mt-2">
        <span>字符数：{{ text.length }}</span>
        <span>句子数：{{ sentenceCount }}</span>
        <span>词数：{{ totalTokens }}</span>
      </div>
    </div>

    <!-- 参数设置区 -->
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">提取设置</h3>
      <div class="config-section">
        <div class="config-item">
          <label>提取算法</label>
          <n-radio-group v-model:value="algorithm" size="small">
            <n-radio-button value="textrank">TextRank</n-radio-button>
            <n-radio-button value="tfidf">TF-IDF</n-radio-button>
          </n-radio-group>
        </div>
        <div class="config-item">
          <label>提取数量（TOP N）</label>
          <n-input-number v-model:value="topN" :min="1" :max="50" />
        </div>
        <div class="config-item" v-if="algorithm === 'textrank'">
          <label>共现窗口大小</label>
          <n-input-number v-model:value="windowSize" :min="2" :max="10" />
        </div>
        <div class="config-item">
          <label>中文词长（N-gram）</label>
          <n-input-number v-model:value="zhGramLength" :min="1" :max="4" />
        </div>
        <div class="config-item">
          <label>英文最短词长</label>
          <n-input-number v-model:value="minWordLength" :min="1" :max="10" />
        </div>
      </div>

      <div class="config-section mt-3">
        <n-checkbox v-model:checked="filterStopwords">过滤停用词</n-checkbox>
      </div>

      <div class="toolbar mt-3">
        <n-button type="primary" @click="extract">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
          提取关键词
        </n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <!-- 结果可视化区 -->
    <div v-if="keywords.length > 0">
      <div class="card">
        <div class="result-header">
          <h3 class="text-sm font-bold">关键词排名（TOP {{ keywords.length }}）</h3>
          <n-tag size="small" :type="algorithm === 'textrank' ? 'success' : 'info'">
            {{ algorithm === 'textrank' ? 'TextRank' : 'TF-IDF' }}
          </n-tag>
        </div>
        <div class="keyword-bars mt-3">
          <div v-for="(item, index) in keywords" :key="item.word" class="keyword-bar">
            <div class="rank">{{ index + 1 }}</div>
            <div class="word" :title="item.word">{{ item.word }}</div>
            <div class="bar-container">
              <div class="bar" :style="{ width: item.percent + '%' }"></div>
            </div>
            <div class="weight">{{ item.score.toFixed(4) }}</div>
            <div class="percent">{{ item.percent.toFixed(1) }}%</div>
          </div>
        </div>
      </div>

      <!-- 详细数据表 -->
      <div class="card mt-4">
        <h3 class="text-sm font-bold mb-3">详细数据</h3>
        <n-data-table
          :columns="columns"
          :data="tableData"
          :bordered="false"
          :single-line="false"
          size="small"
          :pagination="{ pageSize: 20 }"
        />
      </div>
    </div>

    <div class="card mt-4" v-else-if="analyzed">
      <n-empty description="未提取到符合条件的关键词" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NButton,
  NInput,
  NInputNumber,
  NRadioGroup,
  NRadioButton,
  NCheckbox,
  NEmpty,
  NDataTable,
  NTag,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface KeywordItem {
  word: string
  score: number
  count: number
  percent: number
}

const text = ref('')
const algorithm = ref<'textrank' | 'tfidf'>('textrank')
const topN = ref(10)
const windowSize = ref(5)
const zhGramLength = ref(2)
const minWordLength = ref(2)
const filterStopwords = ref(true)
const analyzed = ref(false)

const keywords = ref<KeywordItem[]>([])

// 英文停用词
const englishStopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in',
  'on', 'at', 'by', 'for', 'with', 'about', 'between', 'into', 'through', 'during',
  'before', 'after', 'from', 'up', 'down', 'out', 'over', 'under', 'again', 'then',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'as', 'until', 'while',
  'if', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
  'them', 'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these',
  'those', 'am', 'also', 'get', 'got', 'one', 'two', 'make', 'made', 'go',
])

// 中文停用词
const chineseStopwords = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '上',
  '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '它', '他', '她', '们', '把', '给', '让', '从', '向',
  '以', '为', '与', '及', '或', '但', '而', '且', '则', '于', '对', '可以',
  '这个', '那个', '什么', '怎么', '我们', '你们', '他们', '它们', '一个',
  '一些', '一种', '一样', '一直', '只是', '只有', '还有', '或者', '因为',
  '所以', '如果', '虽然', '但是', '不过', '然而', '因此', '于是', '时候',
])

// 句子数
const sentenceCount = computed(() => {
  if (!text.value.trim()) return 0
  // 按中英文标点切分句子
  const sentences = text.value.split(/[。！？!?.\n]+/).filter(s => s.trim())
  return sentences.length
})

// 总词数
const totalTokens = computed(() => {
  if (!analyzed.value) return 0
  return keywords.value.reduce((sum, item) => sum + item.count, 0)
})

// 表格列定义
const columns: DataTableColumns<TableRow> = [
  { title: '排名', key: 'rank', width: 80 },
  { title: '关键词', key: 'word' },
  { title: '出现次数', key: 'count', width: 100 },
  { title: '权重', key: 'score', width: 120 },
  { title: '占比', key: 'percent', width: 100 },
]

interface TableRow {
  rank: number
  word: string
  count: number
  score: string
  percent: string
}

const tableData = computed<TableRow[]>(() => {
  return keywords.value.map((item, index) => ({
    rank: index + 1,
    word: item.word,
    count: item.count,
    score: item.score.toFixed(6),
    percent: item.percent.toFixed(2) + '%',
  }))
})

// 判断是否为停用词
function isStopword(word: string): boolean {
  return englishStopwords.has(word.toLowerCase()) || chineseStopwords.has(word)
}

// 英文分词
function tokenizeEnglish(content: string): string[] {
  const tokens = content.match(/[a-zA-Z]+/g) || []
  return tokens
    .map(t => t.toLowerCase())
    .filter(t => t.length >= minWordLength.value)
}

// 中文 N-gram 分词
function tokenizeChinese(content: string, n: number): string[] {
  const tokens: string[] = []
  const segments = content.match(/[\u4e00-\u9fa5]+/g) || []
  for (const segment of segments) {
    if (segment.length < n) {
      tokens.push(segment)
    } else {
      for (let i = 0; i <= segment.length - n; i++) {
        tokens.push(segment.slice(i, i + n))
      }
    }
  }
  return tokens
}

// 混合分词：返回所有词
function tokenize(content: string): string[] {
  const tokens: string[] = []
  tokens.push(...tokenizeEnglish(content))
  tokens.push(...tokenizeChinese(content, zhGramLength.value))
  if (filterStopwords.value) {
    return tokens.filter(t => !isStopword(t))
  }
  return tokens
}

// 按句子分词：返回每个句子的词列表
function tokenizeBySentence(content: string): string[][] {
  const sentences = content.split(/[。！？!?.\n]+/).filter(s => s.trim())
  return sentences.map(s => tokenize(s)).filter(s => s.length > 0)
}

// TextRank 算法实现
function textRank(sentences: string[][]): Map<string, number> {
  // 构建共现图
  const graph = new Map<string, Map<string, number>>()
  const wordCount = new Map<string, number>()

  for (const sentence of sentences) {
    const window = windowSize.value
    for (let i = 0; i < sentence.length; i++) {
      const word = sentence[i]
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
      if (!graph.has(word)) graph.set(word, new Map())
      // 在窗口范围内建立共现关系
      for (let j = i + 1; j < Math.min(i + window, sentence.length); j++) {
        const neighbor = sentence[j]
        if (word === neighbor) continue
        const edges = graph.get(word)!
        edges.set(neighbor, (edges.get(neighbor) || 0) + 1)
        if (!graph.has(neighbor)) graph.set(neighbor, new Map())
        const neighborEdges = graph.get(neighbor)!
        neighborEdges.set(word, (neighborEdges.get(word) || 0) + 1)
      }
    }
  }

  // PageRank 迭代
  const d = 0.85 // 阻尼系数
  const maxIter = 100
  const tolerance = 1e-6
  let scores = new Map<string, number>()
  const words = Array.from(graph.keys())
  const n = words.length
  // 初始化分数
  for (const word of words) {
    scores.set(word, 1 / n)
  }

  for (let iter = 0; iter < maxIter; iter++) {
    const newScores = new Map<string, number>()
    let maxDiff = 0
    for (const word of words) {
      let sum = 0
      const edges = graph.get(word)!
      for (const [neighbor, weight] of edges) {
        const neighborOut = graph.get(neighbor)!
        let outWeight = 0
        for (const w of neighborOut.values()) outWeight += w
        if (outWeight > 0) {
          sum += (scores.get(neighbor) || 0) * weight / outWeight
        }
      }
      const newScore = (1 - d) / n + d * sum
      newScores.set(word, newScore)
      maxDiff = Math.max(maxDiff, Math.abs(newScore - (scores.get(word) || 0)))
    }
    scores = newScores
    if (maxDiff < tolerance) break
  }

  return scores
}

// TF-IDF 算法实现（句子级文档频率）
function tfidf(sentences: string[][]): Map<string, number> {
  const tf = new Map<string, number>() // 词频
  const df = new Map<string, number>() // 文档频率（出现该词的句子数）
  const totalDocs = sentences.length

  for (const sentence of sentences) {
    const seen = new Set<string>()
    for (const word of sentence) {
      tf.set(word, (tf.get(word) || 0) + 1)
      if (!seen.has(word)) {
        df.set(word, (df.get(word) || 0) + 1)
        seen.add(word)
      }
    }
  }

  const scores = new Map<string, number>()
  for (const [word, freq] of tf) {
    // IDF = log(N / (df + 1))，加 1 平滑
    const idf = Math.log((totalDocs + 1) / ((df.get(word) || 0) + 1)) + 1
    scores.set(word, freq * idf)
  }
  return scores
}

// 提取关键词主流程
function extract() {
  if (!text.value.trim()) return
  analyzed.value = false

  const content = text.value
  const sentences = tokenizeBySentence(content)

  if (sentences.length === 0) {
    keywords.value = []
    analyzed.value = true
    return
  }

  // 统计词频（用于显示次数）
  const countMap = new Map<string, number>()
  for (const sentence of sentences) {
    for (const word of sentence) {
      countMap.set(word, (countMap.get(word) || 0) + 1)
    }
  }

  // 调用对应算法计算权重
  let scoreMap: Map<string, number>
  if (algorithm.value === 'textrank') {
    scoreMap = textRank(sentences)
  } else {
    scoreMap = tfidf(sentences)
  }

  // 归一化分数并排序
  const maxScore = Math.max(...Array.from(scoreMap.values()), 1e-9)
  const items: KeywordItem[] = Array.from(scoreMap.entries())
    .map(([word, score]) => ({
      word,
      score,
      count: countMap.get(word) || 0,
      percent: (score / maxScore) * 100,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN.value)

  keywords.value = items
  analyzed.value = true
}

function clear() {
  text.value = ''
  keywords.value = []
  analyzed.value = false
}
</script>

<style scoped>
.keyword-extractor {
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
  align-items: center;
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
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.keyword-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.keyword-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}

.rank {
  width: 28px;
  text-align: center;
  font-weight: 700;
  color: #888;
  font-size: 13px;
}

.word {
  width: 120px;
  font-weight: 500;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-container {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.dark .bar-container {
  background: #2a2a4a;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #2080f0, #70c0e8);
  transition: width 0.3s ease;
}

.weight {
  width: 80px;
  text-align: right;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  color: #2080f0;
  font-weight: 600;
}

.dark .weight {
  color: #70c0e8;
}

.percent {
  width: 70px;
  text-align: right;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  color: #888;
}
</style>
