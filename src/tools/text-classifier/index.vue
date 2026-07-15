<template>
  <div class="text-classifier">
    <!-- 文本输入区 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">输入文本</div>
      <n-input
        v-model:value="text"
        type="textarea"
        placeholder="粘贴需要分类的文本内容，将基于关键词规则进行分类..."
        :rows="8"
      />
      <div class="toolbar mt-3">
        <n-button type="primary" @click="classify">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span>
          开始分类
        </n-button>
        <n-button @click="clear">清空</n-button>
        <n-button @click="loadSample" quaternary>加载示例</n-button>
      </div>
    </div>

    <!-- 分类结果区 -->
    <div v-if="result">
      <div class="card">
        <h3 class="text-sm font-bold mb-3">分类结果</h3>
        <div class="top-category">
          <div class="category-label">
            <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span>
            最佳匹配：
          </div>
          <n-tag :type="categoryColor(result.topCategory)" size="large" round>
            {{ result.topCategory }}
          </n-tag>
          <div class="confidence">置信度 {{ (result.topConfidence * 100).toFixed(1) }}%</div>
        </div>

        <!-- 置信度条形图 -->
        <div class="confidence-bars mt-4">
          <div
            v-for="item in result.scores"
            :key="item.category"
            class="confidence-bar"
          >
            <div class="cat-name" :class="{ active: item.category === result.topCategory }">
              {{ item.category }}
            </div>
            <div class="bar-container">
              <div
                class="bar"
                :style="{ width: (item.confidence * 100) + '%', background: confidenceColor(item.confidence) }"
              ></div>
            </div>
            <div class="score-text">{{ (item.confidence * 100).toFixed(1) }}%</div>
            <div class="match-count">{{ item.count }} 词</div>
          </div>
        </div>
      </div>

      <!-- 匹配的关键词 -->
      <div class="card mt-4">
        <h3 class="text-sm font-bold mb-3">匹配的关键词</h3>
        <div v-if="result.matchedKeywords.length > 0" class="matched-section">
          <div v-for="item in result.matchedKeywords" :key="item.category" class="matched-group">
            <div class="matched-cat">
              <n-tag :type="categoryColor(item.category)" size="small">{{ item.category }}</n-tag>
              <span class="match-summary">匹配 {{ item.words.length }} 个</span>
            </div>
            <div class="matched-words">
              <n-tag
                v-for="word in item.words"
                :key="word"
                size="small"
                :bordered="false"
                class="word-tag"
              >
                {{ word }}
              </n-tag>
            </div>
          </div>
        </div>
        <n-empty v-else description="未匹配到任何关键词" />
      </div>
    </div>

    <!-- 自定义规则区 -->
    <div class="card mt-4">
      <div class="rules-header">
        <h3 class="text-sm font-bold">自定义分类规则</h3>
        <n-button size="small" @click="addCategory">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
          添加分类
        </n-button>
      </div>
      <p class="rules-tip">每行一个关键词，匹配时不区分大小写</p>

      <div class="rules-list mt-3">
        <div v-for="(cat, index) in categories" :key="cat.name" class="rule-item">
          <div class="rule-head">
            <n-input v-model:value="cat.name" size="small" placeholder="分类名称" class="cat-input" />
            <n-color-picker
              v-model:value="cat.color"
              size="small"
              :modes="['hex']"
              :show-alpha="false"
              class="color-picker"
            />
            <n-button size="small" quaternary type="error" @click="removeCategory(index)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </n-button>
          </div>
          <n-input
            v-model:value="cat.keywords"
            type="textarea"
            :rows="3"
            size="small"
            placeholder="每行一个关键词"
          />
        </div>
      </div>

      <div class="rules-actions mt-3">
        <n-button size="small" @click="resetRules">恢复默认规则</n-button>
        <n-button size="small" @click="applyRules" type="primary">应用规则</n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import {
  NButton,
  NInput,
  NTag,
  NEmpty,
  NColorPicker,
} from 'naive-ui'

// 分类规则项
interface CategoryRule {
  name: string
  color: string
  keywords: string // 文本域内容，每行一个关键词
}

// 默认分类规则
const defaultCategories: CategoryRule[] = [
  {
    name: '科技',
    color: '#2080f0',
    keywords: '科技\n技术\n互联网\n人工智能\nAI\n大数据\n云计算\n算法\n软件\n硬件\n芯片\n编程\n代码\n计算机\n手机\n智能\n数据\n系统\n网络\n数字',
  },
  {
    name: '体育',
    color: '#18a058',
    keywords: '体育\n足球\n篮球\n比赛\n冠军\n联赛\n运动员\n球队\n教练\n赛季\n奥运\n跑步\n游泳\n健身\n世界杯\nNBA\n进球\n比分\n赛季\n训练',
  },
  {
    name: '财经',
    color: '#f0a020',
    keywords: '财经\n股票\n基金\n投资\n经济\n金融\n市场\n股市\n涨跌\n收益\n利率\n通胀\n债券\n汇率\n银行\n收入\n消费\nGDP\n企业\n利润',
  },
  {
    name: '娱乐',
    color: '#d03050',
    keywords: '娱乐\n电影\n明星\n音乐\n综艺\n演员\n歌手\n演唱会\n电视剧\n娱乐圈\n粉丝\n偶像\n演出\n唱片\n导演\n票房\n首映\n影视\n娱乐\n八卦',
  },
  {
    name: '教育',
    color: '#7c3aed',
    keywords: '教育\n学习\n学校\n学生\n教师\n课程\n考试\n大学\n培训\n知识\n教学\n成绩\n课堂\n教材\n学术\n研究\n论文\n毕业\n招生\n师资',
  },
  {
    name: '健康',
    color: '#0fbf80',
    keywords: '健康\n医疗\n医生\n医院\n疾病\n治疗\n药物\n养生\n保健\n运动\n饮食\n营养\n心理\n睡眠\n体检\n康复\n症状\n预防\n护理\n病毒',
  },
]

// 分类数据结构
interface CategoryScore {
  category: string
  count: number
  matched: string[]
  rawScore: number
  confidence: number
}

interface MatchedGroup {
  category: string
  words: string[]
}

interface ClassifyResult {
  topCategory: string
  topConfidence: number
  scores: CategoryScore[]
  matchedKeywords: MatchedGroup[]
}

const text = ref('')
const result = ref<ClassifyResult | null>(null)
const categories = reactive<CategoryRule[]>(JSON.parse(JSON.stringify(defaultCategories)))

// 颜色映射：分类名 -> Naive UI tag type
const colorMap = ref<Record<string, string>>({})

function buildColorMap() {
  const map: Record<string, string> = {}
  for (const cat of categories) {
    map[cat.name] = cat.color
  }
  colorMap.value = map
}

// 将 hex 颜色转为 Naive UI 的 tag type
function categoryColor(name: string): 'default' | 'success' | 'info' | 'warning' | 'error' {
  const color = (colorMap.value[name] || '').toLowerCase()
  if (color.includes('f0') || color.includes('orange')) return 'warning'
  if (color.includes('d0') || color.includes('red')) return 'error'
  if (color.includes('18') || color.includes('green')) return 'success'
  if (color.includes('20') || color.includes('blue')) return 'info'
  return 'default'
}

// 置信度颜色
function confidenceColor(confidence: number): string {
  if (confidence >= 0.5) return 'linear-gradient(90deg, #18a058, #36ad6a)'
  if (confidence >= 0.25) return 'linear-gradient(90deg, #2080f0, #70c0e8)'
  if (confidence > 0) return 'linear-gradient(90deg, #f0a020, #fcb045)'
  return '#d0d0d0'
}

// 解析规则为关键词数组
function parseKeywords(kwText: string): string[] {
  return kwText
    .split('\n')
    .map(k => k.trim())
    .filter(k => k.length > 0)
}

// 分类主流程
function classify() {
  if (!text.value.trim()) return

  buildColorMap()
  const content = text.value.toLowerCase()
  const scores: CategoryScore[] = []
  let totalMatches = 0

  for (const cat of categories) {
    const keywords = parseKeywords(cat.keywords)
    const matched: string[] = []
    let count = 0
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase()
      // 使用 indexOf 判断是否包含
      if (content.includes(kwLower)) {
        matched.push(kw)
        count++
      }
    }
    totalMatches += count
    scores.push({
      category: cat.name,
      count,
      matched,
      rawScore: count,
      confidence: 0,
    })
  }

  // 计算置信度：基于匹配数占比，若总匹配为 0 则均分
  if (totalMatches > 0) {
    for (const s of scores) {
      s.confidence = s.count / totalMatches
    }
  } else {
    for (const s of scores) {
      s.confidence = 0
    }
  }

  // 按匹配数降序
  scores.sort((a, b) => b.count - a.count)

  const top = scores[0]
  const topCategory = top && top.count > 0 ? top.category : '未知'
  const topConfidence = top ? top.confidence : 0

  // 匹配关键词分组（仅显示有匹配的分类）
  const matchedKeywords: MatchedGroup[] = scores
    .filter(s => s.matched.length > 0)
    .map(s => ({ category: s.category, words: s.matched }))

  result.value = {
    topCategory,
    topConfidence,
    scores,
    matchedKeywords,
  }
}

function clear() {
  text.value = ''
  result.value = null
}

// 加载示例文本
function loadSample() {
  text.value = '随着人工智能技术的快速发展，大数据和云计算成为科技行业的核心驱动力。各大科技公司纷纷加大算法研究和芯片研发的投入，推动智能手机和数字系统的迭代升级。人工智能正在改变人们的生活方式，从计算机视觉到自然语言处理，技术的进步令人瞩目。'
  result.value = null
}

// 添加自定义分类
function addCategory() {
  categories.push({
    name: '新分类',
    color: '#70c0e8',
    keywords: '',
  })
  buildColorMap()
}

// 移除分类
function removeCategory(index: number) {
  categories.splice(index, 1)
  buildColorMap()
}

// 恢复默认规则
function resetRules() {
  categories.splice(0, categories.length, ...JSON.parse(JSON.stringify(defaultCategories)))
  buildColorMap()
}

// 应用规则
function applyRules() {
  buildColorMap()
  if (text.value.trim()) {
    classify()
  }
}

// 初始化颜色映射
buildColorMap()
</script>

<style scoped>
.text-classifier {
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

.top-category {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
}

.category-label {
  font-weight: 500;
  display: flex;
  align-items: center;
}

.confidence {
  font-size: 16px;
  font-weight: 700;
  color: #18a058;
  font-family: 'Fira Code', monospace;
}

.dark .confidence {
  color: #36ad6a;
}

.confidence-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confidence-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.cat-name {
  width: 70px;
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.cat-name.active {
  color: #2080f0;
  font-weight: 700;
}

.dark .cat-name {
  color: #aaa;
}

.dark .cat-name.active {
  color: #70c0e8;
}

.bar-container {
  flex: 1;
  height: 18px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.dark .bar-container {
  background: #2a2a4a;
}

.bar {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.score-text {
  width: 60px;
  text-align: right;
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  color: #888;
}

.match-count {
  width: 50px;
  text-align: right;
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  color: #888;
}

.matched-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.matched-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.matched-cat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-summary {
  font-size: 12px;
  color: #888;
}

.matched-words {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.word-tag {
  background: rgba(32, 128, 240, 0.1);
  color: #2080f0;
}

.dark .word-tag {
  background: rgba(112, 192, 232, 0.15);
  color: #70c0e8;
}

.rules-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rules-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 10px;
}

.dark .rule-item {
  border-color: #333;
}

.rule-head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.cat-input {
  width: 160px;
}

.color-picker {
  width: 120px;
}

.rules-actions {
  display: flex;
  gap: 12px;
}
</style>
