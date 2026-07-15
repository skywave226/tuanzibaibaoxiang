<template>
  <div class="sentiment-analyzer">
    <!-- 文本输入 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">输入文本</div>
      <n-input
        v-model:value="inputText"
        type="textarea"
        placeholder="输入需要分析情感的文本..."
        :rows="8"
      />
      <div class="toolbar mt-3">
        <n-button type="primary" @click="analyze" :disabled="!inputText.trim()">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
          开始分析
        </n-button>
        <n-button @click="loadExample">加载示例</n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>
    </div>

    <!-- 整体情感结果 -->
    <div class="card mb-4" v-if="analyzed">
      <div class="pane-label mb-3">整体情感分析</div>

      <!-- 情感得分展示 -->
      <div class="overall-score">
        <div class="score-circle" :class="sentimentLevel">
          <div class="score-value">{{ overallScore.toFixed(2) }}</div>
          <div class="score-label">{{ sentimentLabel }}</div>
        </div>
        <div class="score-detail">
          <div class="score-bar-row">
            <span class="bar-label positive">正面词频</span>
            <div class="bar-track">
              <div class="bar positive" :style="{ width: positivePercent + '%' }"></div>
            </div>
            <span class="bar-value">{{ positiveCount }}</span>
          </div>
          <div class="score-bar-row">
            <span class="bar-label negative">负面词频</span>
            <div class="bar-track">
              <div class="bar negative" :style="{ width: negativePercent + '%' }"></div>
            </div>
            <span class="bar-value">{{ negativeCount }}</span>
          </div>
          <div class="score-bar-row">
            <span class="bar-label neutral">中性词频</span>
            <div class="bar-track">
              <div class="bar neutral" :style="{ width: neutralPercent + '%' }"></div>
            </div>
            <span class="bar-value">{{ neutralCount }}</span>
          </div>
        </div>
      </div>

      <!-- 情感倾向进度条 -->
      <div class="sentiment-meter mt-4">
        <div class="meter-labels">
          <span class="meter-label negative">负面</span>
          <span class="meter-label neutral">中性</span>
          <span class="meter-label positive">正面</span>
        </div>
        <div class="meter-track">
          <div class="meter-pointer" :style="{ left: meterPosition + '%' }"></div>
        </div>
        <div class="meter-scale">
          <span>-1.0</span>
          <span>0</span>
          <span>+1.0</span>
        </div>
      </div>

      <!-- 统计数据 -->
      <div class="stats-grid mt-4">
        <div class="stat-box">
          <div class="stat-value positive">{{ positiveCount }}</div>
          <div class="stat-label">正面词数</div>
        </div>
        <div class="stat-box">
          <div class="stat-value negative">{{ negativeCount }}</div>
          <div class="stat-label">负面词数</div>
        </div>
        <div class="stat-box">
          <div class="stat-value neutral">{{ neutralCount }}</div>
          <div class="stat-label">中性词数</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ sentenceResults.length }}</div>
          <div class="stat-label">句子数</div>
        </div>
      </div>
    </div>

    <!-- 句子级分析 -->
    <div class="card mb-4" v-if="analyzed && sentenceResults.length > 0">
      <div class="pane-label mb-3">句子级情感分析</div>
      <div class="sentence-list">
        <div
          v-for="(item, index) in sentenceResults"
          :key="index"
          class="sentence-item"
          :class="item.level"
        >
          <div class="sentence-header">
            <span class="sentence-num">句 {{ index + 1 }}</span>
            <n-tag :type="tagType(item.level)" size="small" :bordered="false" round>
              {{ levelLabel(item.level) }}
            </n-tag>
            <span class="sentence-score">{{ item.score.toFixed(2) }}</span>
          </div>
          <div class="sentence-text">{{ item.text }}</div>
          <div class="sentence-words" v-if="item.words.length > 0">
            <span
              v-for="word in item.words"
              :key="word.text"
              class="word-tag"
              :class="word.polarity"
            >
              {{ word.text }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 关键情感词 -->
    <div class="card" v-if="analyzed && (allPositiveWords.length > 0 || allNegativeWords.length > 0)">
      <div class="pane-label mb-3">关键情感词</div>
      <div class="word-cloud">
        <div class="word-group">
          <div class="word-group-label positive">正面词（{{ allPositiveWords.length }}）</div>
          <div class="word-tags">
            <span
              v-for="word in allPositiveWords.slice(0, 30)"
              :key="word.text"
              class="word-tag positive"
              :style="{ fontSize: wordFontSize(word.count) + 'px' }"
            >
              {{ word.text }} ({{ word.count }})
            </span>
          </div>
        </div>
        <div class="word-group mt-3">
          <div class="word-group-label negative">负面词（{{ allNegativeWords.length }}）</div>
          <div class="word-tags">
            <span
              v-for="word in allNegativeWords.slice(0, 30)"
              :key="word.text"
              class="word-tag negative"
              :style="{ fontSize: wordFontSize(word.count) + 'px' }"
            >
              {{ word.text }} ({{ word.count }})
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NTag, useMessage } from 'naive-ui'

const message = useMessage()

const inputText = ref('')
const analyzed = ref(false)

// 正面情感词典
const positiveWords = new Set([
  // 中文正面词
  '好', '优秀', '喜欢', '爱', '开心', '快乐', '满意', '成功', '美好', '棒',
  '赞', '不错', '幸福', '希望', '感谢', '支持', '欣赏', '精彩', '出色', '完美',
  '温暖', '甜蜜', '愉快', '兴奋', '乐观', '积极', '优势', '胜利', '收获', '进步',
  '改善', '提升', '突破', '创新', '杰出', '卓越', '值得', '推荐', '信赖', '安心',
  '放心', '舒适', '便捷', '高效', '优质', '精美', '漂亮', '美丽', '可爱', '厉害',
  '强大', '智能', '先进', '专业', '贴心', '周到', '热情', '友好', '亲切', '真诚',
  '诚实', '善良', '慷慨', '勇敢', '坚强', '聪明', '智慧', '勤奋', '努力', '认真',
  '负责', '可靠', '稳定', '安全', '健康', '长寿', '繁荣', '兴旺', '发达', '富裕',
  '富足', '充足', '丰富', '多彩', '辉煌', '灿烂', '光明', '明媚', '顺利', '顺畅',
  '流畅', '方便', '简单', '容易', '轻松', '便捷', '快速', '迅速', '及时', '准时',
  '准确', '精确', '完美', '完善', '完整', '全面', '彻底', '到位', '满分', '一流',
  '顶级', '极品', '绝佳', '极好', '很好', '更好', '最好', '高兴', '喜悦', '欢喜',
  '兴奋', '激动', '感动', '感激', '感恩', '珍惜', '享受', '满足', '充实', '丰盛',
  '旺盛', '蓬勃', '活力', '生机', '希望', '期望', '期待', '憧憬', '向往', '梦想',
  // 英文正面词
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
  'love', 'like', 'happy', 'glad', 'pleased', 'satisfied', 'perfect', 'best',
  'better', 'beautiful', 'nice', 'brilliant', 'superb', 'outstanding', 'remarkable',
  'success', 'successful', 'win', 'victory', 'benefit', 'helpful', 'useful',
  'positive', 'optimistic', 'hope', 'hopeful', 'enjoy', 'enjoyable', 'recommend',
  'support', 'appreciate', 'thank', 'thanks', 'grateful', 'smart', 'clever',
  'efficient', 'effective', 'easy', 'simple', 'fast', 'quick', 'reliable',
  'safe', 'healthy', 'strong', 'powerful', 'innovative', 'creative', 'professional',
  'friendly', 'kind', 'warm', 'generous', 'honest', 'trustworthy', 'quality',
  'improve', 'improvement', 'progress', 'advance', 'breakthrough', 'gain', 'benefit',
])

// 负面情感词典
const negativeWords = new Set([
  // 中文负面词
  '差', '坏', '糟糕', '讨厌', '恨', '伤心', '难过', '悲伤', '失败', '痛苦',
  '烦躁', '愤怒', '生气', '恐惧', '害怕', '担忧', '焦虑', '失望', '绝望', '沮丧',
  '抑郁', '孤独', '寂寞', '冷漠', '无聊', '疲惫', '劳累', '疲倦', '虚弱', '生病',
  '疾病', '贫穷', '贫困', '落后', '衰退', '下降', '减少', '损失', '破坏', '损坏',
  '错误', '缺点', '缺陷', '问题', '麻烦', '困难', '艰难', '危险', '风险', '威胁',
  '危害', '有害', '恶劣', '恶性', '邪恶', '罪恶', '腐败', '贪婪', '自私', '傲慢',
  '偏见', '歧视', '欺骗', '谎言', '虚伪', '懒惰', '怠慢', '粗暴', '粗鲁', '无礼',
  '冷酷', '残忍', '暴力', '战争', '冲突', '争斗', '矛盾', '分歧', '对立', '敌对',
  '仇恨', '抱怨', '投诉', '批评', '指责', '推卸', '逃避', '拖延', '浪费', '低效',
  '缓慢', '迟钝', '呆板', '死板', '混乱', '无序', '脏乱', '污染', '噪音', '拥挤',
  '堵塞', '故障', '崩溃', '病毒', '黑客', '诈骗', '盗窃', '抢劫', '勒索', '犯罪',
  '违法', '违规', '违纪', '差错', '失误', '缺点', '不足', '欠缺', '匮乏', '短缺',
  '缺乏', '缺少', '不足', '遗憾', '可惜', '可悲', '可怜', '凄惨', '悲惨', '惨痛',
  '痛心', '心痛', '心碎', '崩溃', '崩溃', '烦人', '恼人', '可恶', '可恨', '憎恨',
  '厌恶', '反感', '排斥', '拒绝', '否定', '反对', '抗议', '抵制', '罢工', '暴动',
  // 英文负面词
  'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'unhappy',
  'angry', 'mad', 'furious', 'afraid', 'fear', 'scared', 'worried', 'anxious',
  'disappointed', 'frustrated', 'depressed', 'lonely', 'bored', 'tired', 'exhausted',
  'sick', 'ill', 'poor', 'fail', 'failure', 'lose', 'loss', 'damage', 'broken',
  'error', 'wrong', 'mistake', 'problem', 'difficult', 'hard', 'dangerous',
  'risk', 'threat', 'harmful', 'evil', 'corrupt', 'greedy', 'selfish', 'arrogant',
  'lie', 'fake', 'lazy', 'rude', 'cruel', 'violent', 'conflict', 'fight', 'hate',
  'complain', 'criticize', 'blame', 'avoid', 'delay', 'waste', 'slow', 'inefficient',
  'confused', 'messy', 'dirty', 'pollution', 'noisy', 'crowded', 'crash', 'bug',
  'virus', 'hack', 'scam', 'fraud', 'steal', 'rob', 'crime', 'illegal', 'painful',
  'hurt', 'suffer', 'suffering', 'miserable', 'tragic', 'awful', 'dreadful', 'nasty',
])

interface WordHit {
  text: string
  count: number
  polarity: 'positive' | 'negative'
}

interface SentenceResult {
  text: string
  score: number
  level: 'positive' | 'negative' | 'neutral'
  words: { text: string; polarity: 'positive' | 'negative' }[]
}

const sentenceResults = ref<SentenceResult[]>([])
const allPositiveWords = ref<WordHit[]>([])
const allNegativeWords = ref<WordHit[]>([])

// 整体正面词数
const positiveCount = computed(() => allPositiveWords.value.reduce((s, w) => s + w.count, 0))
// 整体负面词数
const negativeCount = computed(() => allNegativeWords.value.reduce((s, w) => s + w.count, 0))
// 中性词数（估算）
const neutralCount = computed(() => {
  if (!inputText.value) return 0
  // 总词数 - 情感词数
  const totalWords = (inputText.value.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g) || []).length
  return Math.max(0, totalWords - positiveCount.value - negativeCount.value)
})

// 百分比
const totalSentimentWords = computed(() => positiveCount.value + negativeCount.value + neutralCount.value)
const positivePercent = computed(() => totalSentimentWords.value > 0 ? (positiveCount.value / totalSentimentWords.value) * 100 : 0)
const negativePercent = computed(() => totalSentimentWords.value > 0 ? (negativeCount.value / totalSentimentWords.value) * 100 : 0)
const neutralPercent = computed(() => totalSentimentWords.value > 0 ? (neutralCount.value / totalSentimentWords.value) * 100 : 0)

// 情感得分：-1 到 1
const overallScore = computed(() => {
  const total = positiveCount.value + negativeCount.value
  if (total === 0) return 0
  return (positiveCount.value - negativeCount.value) / total
})

// 情感等级
const sentimentLevel = computed<'positive' | 'negative' | 'neutral'>(() => {
  const score = overallScore.value
  if (score > 0.1) return 'positive'
  if (score < -0.1) return 'negative'
  return 'neutral'
})

// 情感标签
const sentimentLabel = computed(() => {
  const score = overallScore.value
  if (score > 0.5) return '非常正面'
  if (score > 0.1) return '正面'
  if (score < -0.5) return '非常负面'
  if (score < -0.1) return '负面'
  return '中性'
})

// 仪表盘指针位置（-1 到 1 映射到 0% 到 100%）
const meterPosition = computed(() => {
  return ((overallScore.value + 1) / 2) * 100
})

// 分词：提取所有词
function extractWords(text: string): string[] {
  const words: string[] = []
  // 提取中文单字和英文单词
  const matches = text.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g) || []
  for (const m of matches) {
    if (m.length === 1 && /[\u4e00-\u9fa5]/.test(m)) {
      words.push(m)
    } else if (m.length >= 2) {
      words.push(m.toLowerCase())
    }
  }
  return words
}

// 分句
function splitSentences(text: string): string[] {
  if (!text.trim()) return []
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/([。！？.!?;；])/g)
  const result: string[] = []
  for (let i = 0; i < sentences.length; i += 2) {
    let s = (sentences[i] || '').trim()
    const punct = sentences[i + 1] || ''
    if (s) result.push(s + punct)
  }
  return result.filter(s => s.trim().length > 0)
}

// 分析单句
function analyzeSentence(text: string): SentenceResult {
  const words = extractWords(text)
  const hits: { text: string; polarity: 'positive' | 'negative' }[] = []
  let pos = 0
  let neg = 0

  for (const w of words) {
    if (positiveWords.has(w)) {
      pos++
      hits.push({ text: w, polarity: 'positive' })
    } else if (negativeWords.has(w)) {
      neg++
      hits.push({ text: w, polarity: 'negative' })
    }
  }

  const total = pos + neg
  const score = total === 0 ? 0 : (pos - neg) / total
  let level: 'positive' | 'negative' | 'neutral'
  if (score > 0.1) level = 'positive'
  else if (score < -0.1) level = 'negative'
  else level = 'neutral'

  return { text, score, level, words: hits }
}

// 主分析函数
function analyze() {
  if (!inputText.value.trim()) {
    message.warning('请输入文本')
    return
  }

  // 分析整体词频
  const allWords = extractWords(inputText.value)
  const posMap = new Map<string, number>()
  const negMap = new Map<string, number>()

  for (const w of allWords) {
    if (positiveWords.has(w)) {
      posMap.set(w, (posMap.get(w) || 0) + 1)
    } else if (negativeWords.has(w)) {
      negMap.set(w, (negMap.get(w) || 0) + 1)
    }
  }

  allPositiveWords.value = Array.from(posMap.entries())
    .map(([text, count]) => ({ text, count, polarity: 'positive' as const }))
    .sort((a, b) => b.count - a.count)

  allNegativeWords.value = Array.from(negMap.entries())
    .map(([text, count]) => ({ text, count, polarity: 'negative' as const }))
    .sort((a, b) => b.count - a.count)

  // 句子级分析
  const sentences = splitSentences(inputText.value)
  sentenceResults.value = sentences.map(s => analyzeSentence(s))

  analyzed.value = true
  message.success('分析完成')
}

// 标签类型
function tagType(level: string): 'success' | 'error' | 'default' {
  if (level === 'positive') return 'success'
  if (level === 'negative') return 'error'
  return 'default'
}

// 等级文字
function levelLabel(level: string): string {
  if (level === 'positive') return '正面'
  if (level === 'negative') return '负面'
  return '中性'
}

// 词云字体大小
function wordFontSize(count: number): number {
  return Math.min(20, 12 + count * 2)
}

// 加载示例
function loadExample() {
  inputText.value = `今天天气真好，阳光明媚，让人心情愉快。不过下午突然下起了大雨，让人有点失望。但是雨后空气清新，彩虹出现，真是太美好了！虽然路上有些拥挤，但整体来说还是很满意的一天。唯一遗憾的是忘记带伞，被淋湿了，有点难受。不过回家的路上买到了喜欢的水果，还是很开心的。`
  analyzed.value = false
  sentenceResults.value = []
  allPositiveWords.value = []
  allNegativeWords.value = []
}

// 清空
function clearAll() {
  inputText.value = ''
  analyzed.value = false
  sentenceResults.value = []
  allPositiveWords.value = []
  allNegativeWords.value = []
}
</script>

<style scoped>
.sentiment-analyzer {
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
  flex-wrap: wrap;
}

/* 整体得分展示 */
.overall-score {
  display: flex;
  gap: 32px;
  align-items: center;
  flex-wrap: wrap;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 4px solid #ccc;
  background: #f5f5f5;
}

.score-circle.positive {
  border-color: #36ad6a;
  background: #e8f5e9;
}

.score-circle.negative {
  border-color: #d03050;
  background: #fce8ec;
}

.score-circle.neutral {
  border-color: #909399;
  background: #f4f4f5;
}

.dark .score-circle {
  background: #1e1e2e;
}

.dark .score-circle.positive {
  background: #1a3a2a;
}

.dark .score-circle.negative {
  background: #3a1a2a;
}

.dark .score-circle.neutral {
  background: #2a2a3a;
}

.score-value {
  font-size: 32px;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
  color: #333;
}

.score-circle.positive .score-value {
  color: #36ad6a;
}

.score-circle.negative .score-value {
  color: #d03050;
}

.score-circle.neutral .score-value {
  color: #909399;
}

.dark .score-value {
  color: #ddd;
}

.score-label {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}

.score-detail {
  flex: 1;
  min-width: 250px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 90px;
  font-size: 13px;
  font-weight: 500;
  text-align: right;
}

.bar-label.positive {
  color: #36ad6a;
}

.bar-label.negative {
  color: #d03050;
}

.bar-label.neutral {
  color: #909399;
}

.bar-track {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.dark .bar-track {
  background: #2a2a3a;
}

.bar {
  height: 100%;
  transition: width 0.4s ease;
}

.bar.positive {
  background: linear-gradient(90deg, #36ad6a, #63e2b7);
}

.bar.negative {
  background: linear-gradient(90deg, #d03050, #f09a9a);
}

.bar.neutral {
  background: linear-gradient(90deg, #909399, #c0c4cc);
}

.bar-value {
  width: 40px;
  text-align: right;
  font-size: 13px;
  font-family: 'Fira Code', monospace;
  color: #555;
}

.dark .bar-value {
  color: #bbb;
}

/* 情感仪表盘 */
.sentiment-meter {
  padding: 12px 0;
}

.meter-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.meter-label {
  font-size: 12px;
  font-weight: 600;
}

.meter-label.positive {
  color: #36ad6a;
}

.meter-label.negative {
  color: #d03050;
}

.meter-label.neutral {
  color: #909399;
}

.meter-track {
  height: 12px;
  background: linear-gradient(90deg, #d03050 0%, #909399 50%, #36ad6a 100%);
  border-radius: 6px;
  position: relative;
}

.meter-pointer {
  position: absolute;
  top: -4px;
  width: 4px;
  height: 20px;
  background: #333;
  border-radius: 2px;
  transform: translateX(-50%);
  transition: left 0.4s ease;
}

.dark .meter-pointer {
  background: #fff;
}

.meter-scale {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: #aaa;
  font-family: 'Fira Code', monospace;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat-box {
  text-align: center;
  padding: 16px 8px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fafafa;
}

.dark .stat-box {
  border-color: #2a2a3a;
  background: #1a1a2a;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
  color: #333;
}

.stat-value.positive {
  color: #36ad6a;
}

.stat-value.negative {
  color: #d03050;
}

.stat-value.neutral {
  color: #909399;
}

.dark .stat-value {
  color: #ddd;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

/* 句子列表 */
.sentence-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sentence-item {
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  border-left: 4px solid #909399;
}

.sentence-item.positive {
  border-left-color: #36ad6a;
  background: #f0faf3;
}

.sentence-item.negative {
  border-left-color: #d03050;
  background: #fce8ec;
}

.sentence-item.neutral {
  border-left-color: #909399;
}

.dark .sentence-item {
  border-color: #2a2a3a;
}

.dark .sentence-item.positive {
  background: #1a2e23;
}

.dark .sentence-item.negative {
  background: #2e1a23;
}

.sentence-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.sentence-num {
  font-size: 12px;
  font-weight: 600;
  color: #888;
}

.sentence-score {
  font-size: 13px;
  font-family: 'Fira Code', monospace;
  color: #555;
  margin-left: auto;
}

.dark .sentence-score {
  color: #aaa;
}

.sentence-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.dark .sentence-text {
  color: #ddd;
}

.sentence-words {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

/* 关键词标签 */
.word-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.word-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.word-tag.positive {
  background: #e8f5e9;
  color: #36ad6a;
}

.word-tag.negative {
  background: #fce8ec;
  color: #d03050;
}

.dark .word-tag.positive {
  background: #1a3a2a;
}

.dark .word-tag.negative {
  background: #3a1a2a;
}

/* 词云 */
.word-cloud {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.word-group-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.word-group-label.positive {
  color: #36ad6a;
}

.word-group-label.negative {
  color: #d03050;
}
</style>
