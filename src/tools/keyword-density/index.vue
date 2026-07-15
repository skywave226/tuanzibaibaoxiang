<template>
  <div class="keyword-density">
    <div class="card mb-4">
      <div class="pane-label mb-2">输入文本</div>
      <n-input
        v-model:value="text"
        type="textarea"
        placeholder="粘贴需要分析的文章内容..."
        rows="10"
        :autosize="false"
      />
      <div class="text-info mt-2">
        <span>总字数：{{ totalWords }}</span>
        <span>总词数：{{ totalTokens }}</span>
        <span>不重复词数：{{ uniqueWords }}</span>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">分析设置</h3>
      <div class="config-section">
        <div class="config-item">
          <label>语言模式</label>
          <n-radio-group v-model:value="langMode" size="small">
            <n-radio-button value="mixed">中英文混合</n-radio-button>
            <n-radio-button value="en">仅英文</n-radio-button>
            <n-radio-button value="zh">仅中文</n-radio-button>
          </n-radio-group>
        </div>
        <div class="config-item">
          <label>最少词长（英文）</label>
          <n-input-number v-model:value="minWordLength" :min="1" :max="20" />
        </div>
        <div class="config-item">
          <label>中文分词长度</label>
          <n-input-number v-model:value="zhGramLength" :min="1" :max="4" />
        </div>
        <div class="config-item">
          <label>显示 TOP N</label>
          <n-input-number v-model:value="topN" :min="5" :max="100" :step="5" />
        </div>
      </div>

      <div class="config-section mt-3">
        <n-checkbox v-model:checked="filterStopwords">过滤停用词</n-checkbox>
        <n-checkbox v-model:checked="caseSensitive">区分大小写</n-checkbox>
      </div>

      <div class="toolbar mt-3">
        <n-button type="primary" @click="analyze">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
          分析
        </n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <div class="results" v-if="keywords.length > 0">
      <div class="card">
        <h3 class="text-sm font-bold mb-3">关键词排名（TOP {{ topN }}）</h3>
        <div class="keyword-bars">
          <div v-for="(item, index) in keywords" :key="item.word" class="keyword-bar">
            <div class="rank">{{ index + 1 }}</div>
            <div class="word">{{ item.word }}</div>
            <div class="bar-container">
              <div class="bar" :style="{ width: item.percent + '%' }"></div>
            </div>
            <div class="count">{{ item.count }}</div>
            <div class="percent">{{ item.percent.toFixed(2) }}%</div>
          </div>
        </div>
      </div>

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
      <n-empty description="未找到符合条件的关键词" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NInput, NInputNumber, NRadioGroup, NRadioButton, NCheckbox, NEmpty, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface KeywordItem {
  word: string
  count: number
  percent: number
}

const text = ref('')
const langMode = ref<'mixed' | 'en' | 'zh'>('mixed')
const minWordLength = ref(2)
const zhGramLength = ref(2)
const topN = ref(20)
const filterStopwords = ref(true)
const caseSensitive = ref(false)
const analyzed = ref(false)

const keywords = ref<KeywordItem[]>([])

// 英文停用词
const englishStopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because',
  'as', 'until', 'while', 'if', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'am', 's', 't', 'd', 'll', 'm', 'o', 're',
  've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven',
  'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren',
  'won', 'wouldn', 'also', 'get', 'got', 'one', 'two', 'make', 'made', 'go',
])

// 中文停用词
const chineseStopwords = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '它', '他', '她', '们', '把', '给', '让', '从', '向', '往',
  '以', '为', '与', '及', '或', '但', '而', '且', '则', '于', '对', '关于', '通过',
  '可以', '这个', '那个', '什么', '怎么', '为什么', '哪里', '怎样', '这样', '那样',
  '一些', '一种', '一样', '一直', '一定', '只是', '只有', '只要', '还有', '或者',
  '因为', '所以', '如果', '虽然', '但是', '不过', '然而', '因此', '由此', '于是',
  '我们', '你们', '他们', '她们', '它们', '咱们', '人们', '大家', '自己', '别人',
  '时候', '时间', '地方', '东西', '样子', '情况', '方面', '问题', '事情', '办法',
])

const totalWords = computed(() => {
  if (!text.value.trim()) return 0
  return text.value.trim().length
})

const totalTokens = computed(() => {
  if (!text.value.trim()) return 0
  return keywords.value.reduce((sum, item) => sum + item.count, 0)
})

const uniqueWords = computed(() => keywords.value.length)

interface TableRow {
  rank: number
  word: string
  count: number
  percent: string
}

const columns: DataTableColumns<TableRow> = [
  { title: '排名', key: 'rank', width: 80 },
  { title: '关键词', key: 'word' },
  { title: '出现次数', key: 'count', width: 100 },
  { title: '占比', key: 'percent', width: 100 },
]

const tableData = computed<TableRow[]>(() => {
  return keywords.value.map((item, index) => ({
    rank: index + 1,
    word: item.word,
    count: item.count,
    percent: item.percent.toFixed(2) + '%',
  }))
})

// 英文分词
function tokenizeEnglish(text: string): string[] {
  const tokens = text.match(/[a-zA-Z]+/g) || []
  return tokens.filter(t => t.length >= minWordLength.value)
}

// 中文 n-gram 分词
function tokenizeChinese(text: string, n: number): string[] {
  const tokens: string[] = []
  // 提取所有连续的中文字符片段
  const segments = text.match(/[\u4e00-\u9fa5]+/g) || []
  for (const segment of segments) {
    if (segment.length < n) {
      tokens.push(segment)
    } else {
      // 滑动窗口提取 n-gram
      for (let i = 0; i <= segment.length - n; i++) {
        tokens.push(segment.slice(i, i + n))
      }
    }
  }
  return tokens
}

function isStopword(word: string): boolean {
  return englishStopwords.has(word.toLowerCase()) || chineseStopwords.has(word)
}

function analyze() {
  if (!text.value.trim()) return

  analyzed.value = false
  const counts = new Map<string, number>()
  const content = caseSensitive.value ? text.value : text.value.toLowerCase()

  // 根据语言模式分词
  if (langMode.value === 'en' || langMode.value === 'mixed') {
    const enTokens = tokenizeEnglish(content)
    for (const token of enTokens) {
      const word = caseSensitive.value ? token : token.toLowerCase()
      if (filterStopwords.value && isStopword(word)) continue
      counts.set(word, (counts.get(word) || 0) + 1)
    }
  }

  if (langMode.value === 'zh' || langMode.value === 'mixed') {
    const zhTokens = tokenizeChinese(content, zhGramLength.value)
    for (const token of zhTokens) {
      if (filterStopwords.value && isStopword(token)) continue
      counts.set(token, (counts.get(token) || 0) + 1)
    }
  }

  // 计算总数
  const total = Array.from(counts.values()).reduce((sum, c) => sum + c, 0)

  // 转换为排序数组
  const items: KeywordItem[] = Array.from(counts.entries())
    .map(([word, count]) => ({
      word,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
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
.keyword-density {
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
  background: linear-gradient(90deg, #36ad6a, #63e2b7);
  transition: width 0.3s ease;
}

.count {
  width: 50px;
  text-align: right;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  color: #555;
}

.dark .count {
  color: #aaa;
}

.percent {
  width: 70px;
  text-align: right;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  color: #36ad6a;
  font-weight: 600;
}

.dark .percent {
  color: #63e2b7;
}
</style>
