<template>
  <div class="tool-container flashcard-tool">
    <!-- 顶部控制栏 -->
    <div class="action-bar">
      <n-select
        v-model:value="activeDeckId"
        :options="deckOptions"
        placeholder="选择单词本"
        style="width: 220px"
        @update:value="onDeckChange"
      />
      <n-button type="primary" @click="showDeckModal = true">新建单词本</n-button>
      <n-button :disabled="!activeDeck" @click="showWordModal = true">添加单词</n-button>
      <n-button :disabled="!activeDeck || activeDeck.words.length === 0" @click="resetProgress">
        重置进度
      </n-button>
      <n-radio-group v-model:value="mode" size="small">
        <n-radio-button value="order">顺序</n-radio-button>
        <n-radio-button value="random">随机</n-radio-button>
      </n-radio-group>
    </div>

    <!-- 进度统计 -->
    <div v-if="activeDeck" class="stats-bar">
      <n-card size="small">
        <div class="stats">
          <span class="stat">单词总数：<b>{{ activeDeck.words.length }}</b></span>
          <span class="stat">已学：<b style="color:#2080f0">{{ learnedCount }}</b></span>
          <span class="stat">认识：<b style="color:#18a058">{{ knownCount }}</b></span>
          <span class="stat">不认识：<b style="color:#d03050">{{ unknownCount }}</b></span>
          <span class="stat">进度：<b>{{ progressPercent }}%</b></span>
        </div>
        <n-progress
          type="line"
          :percentage="progressPercent"
          :show-indicator="false"
          :height="6"
          style="margin-top: 10px"
        />
      </n-card>
    </div>

    <!-- 空状态 -->
    <div v-if="!activeDeck" class="empty-tip">请先创建或选择一个单词本</div>
    <div v-else-if="activeDeck.words.length === 0" class="empty-tip">
      当前单词本还没有单词，点击"添加单词"开始
    </div>

    <!-- 卡片浏览 -->
    <div v-else-if="currentWord" class="card-stage">
      <div class="card-counter">{{ currentIndex + 1 }} / {{ activeDeck.words.length }}</div>
      <div
        class="word-card"
        :class="{ flipped: flipped }"
        @click="flipped = !flipped"
      >
        <div class="flip-inner">
          <!-- 正面：单词 -->
          <div class="flip-face flip-front">
            <div class="face-label">点击翻面查看释义</div>
            <div class="word-text">{{ currentWord.word }}</div>
            <div class="word-pos">{{ currentWord.pos }}</div>
          </div>
          <!-- 背面：释义 -->
          <div class="flip-face flip-back">
            <div class="face-label">释义</div>
            <div class="word-text">{{ currentWord.translation }}</div>
            <div class="word-example">{{ currentWord.example }}</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="card-actions">
        <n-button @click="prev" :disabled="currentIndex === 0">上一个</n-button>
        <n-button type="error" ghost @click="mark(false)">不认识</n-button>
        <n-button type="primary" @click="flipped = !flipped">翻面</n-button>
        <n-button type="success" ghost @click="mark(true)">认识</n-button>
        <n-button @click="next" :disabled="currentIndex >= activeDeck.words.length - 1">下一个</n-button>
      </div>
    </div>

    <!-- 单词本弹窗 -->
    <n-modal v-model:show="showDeckModal" preset="dialog" title="新建单词本">
      <n-input v-model:value="newDeckName" placeholder="单词本名称（如：四级核心词）" />
      <template #action>
        <n-button @click="showDeckModal = false">取消</n-button>
        <n-button type="primary" @click="createDeck">创建</n-button>
      </template>
    </n-modal>

    <!-- 添加单词弹窗 -->
    <n-modal v-model:show="showWordModal" preset="dialog" :title="editingWord ? '编辑单词' : '添加单词'">
      <div class="modal-form">
        <n-input v-model:value="wordForm.word" placeholder="单词（如：abandon）" />
        <n-select
          v-model:value="wordForm.pos"
          :options="posOptions"
          placeholder="词性"
        />
        <n-input v-model:value="wordForm.translation" placeholder="释义（如：放弃）" />
        <n-input
          v-model:value="wordForm.example"
          type="textarea"
          :rows="2"
          placeholder="例句（如：He abandoned his car.）"
        />
      </div>
      <template #action>
        <n-button @click="showWordModal = false">取消</n-button>
        <n-button type="primary" @click="saveWord">保存</n-button>
      </template>
    </n-modal>

    <!-- 单词列表 -->
    <div v-if="activeDeck && activeDeck.words.length > 0" class="word-list">
      <div class="list-title">单词列表</div>
      <div class="list-items">
        <div
          v-for="(w, idx) in activeDeck.words"
          :key="w.id"
          class="word-row"
          :class="{
            active: idx === currentIndex,
            known: w.status === 'known',
            unknown: w.status === 'unknown',
          }"
          @click="jumpTo(idx)"
        >
          <span class="row-word">{{ w.word }}</span>
          <span class="row-pos">{{ w.pos }}</span>
          <span class="row-trans">{{ w.translation }}</span>
          <span class="row-status" :class="w.status">{{ statusLabel(w.status) }}</span>
          <span class="row-ops" @click.stop>
            <n-button size="tiny" quaternary @click="editWord(w)">编辑</n-button>
            <n-button size="tiny" quaternary type="error" @click="deleteWord(w.id)">删除</n-button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NButton, NCard, NInput, NSelect, NModal, NRadioGroup, NRadioButton, NProgress, useMessage } from 'naive-ui'

type WordStatus = 'new' | 'known' | 'unknown'

interface Word {
  id: string
  word: string
  pos: string
  translation: string
  example: string
  status: WordStatus
}

interface Deck {
  id: string
  name: string
  words: Word[]
}

const STORAGE_KEY = 'flashcard_tool_decks'
const message = useMessage()

const decks = ref<Deck[]>([])
const activeDeckId = ref<string | null>(null)
const flipped = ref(false)
const currentIndex = ref(0)
const mode = ref<'order' | 'random'>('order')

// 弹窗状态
const showDeckModal = ref(false)
const newDeckName = ref('')
const showWordModal = ref(false)
const editingWord = ref<Word | null>(null)
const wordForm = ref({ word: '', pos: 'n.', translation: '', example: '' })

const posOptions = [
  { label: 'n. 名词', value: 'n.' },
  { label: 'v. 动词', value: 'v.' },
  { label: 'adj. 形容词', value: 'adj.' },
  { label: 'adv. 副词', value: 'adv.' },
  { label: 'prep. 介词', value: 'prep.' },
  { label: 'conj. 连词', value: 'conj.' },
  { label: 'pron. 代词', value: 'pron.' },
  { label: 'phr. 短语', value: 'phr.' },
]

const deckOptions = computed(() =>
  decks.value.map(d => ({ label: `${d.name} (${d.words.length})`, value: d.id }))
)

const activeDeck = computed(() =>
  decks.value.find(d => d.id === activeDeckId.value) || null
)

const currentWord = computed(() => {
  if (!activeDeck.value || activeDeck.value.words.length === 0) return null
  return activeDeck.value.words[currentIndex.value] || null
})

const learnedCount = computed(() =>
  activeDeck.value ? activeDeck.value.words.filter(w => w.status !== 'new').length : 0
)
const knownCount = computed(() =>
  activeDeck.value ? activeDeck.value.words.filter(w => w.status === 'known').length : 0
)
const unknownCount = computed(() =>
  activeDeck.value ? activeDeck.value.words.filter(w => w.status === 'unknown').length : 0
)
const progressPercent = computed(() => {
  if (!activeDeck.value || activeDeck.value.words.length === 0) return 0
  return Math.round((learnedCount.value / activeDeck.value.words.length) * 100)
})

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function statusLabel(s: WordStatus): string {
  return s === 'known' ? '认识' : s === 'unknown' ? '不认识' : '未学'
}

// 持久化
function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks.value))
}

function load(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Deck[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        decks.value = parsed
        return
      }
    }
  } catch {
    // ignore
  }
  // 初始化默认单词本
  decks.value = [{ id: genId(), name: '常用英语单词', words: defaultWords() }]
  persist()
}

onMounted(() => {
  load()
  activeDeckId.value = decks.value[0]?.id || null
})

watch(activeDeckId, () => {
  currentIndex.value = 0
  flipped.value = false
})

function onDeckChange(): void {
  flipped.value = false
  currentIndex.value = 0
}

// 导航
function next(): void {
  if (!activeDeck.value) return
  if (mode.value === 'random') {
    currentIndex.value = Math.floor(Math.random() * activeDeck.value.words.length)
  } else {
    if (currentIndex.value < activeDeck.value.words.length - 1) {
      currentIndex.value++
    }
  }
  flipped.value = false
}

function prev(): void {
  if (currentIndex.value > 0) {
    currentIndex.value--
    flipped.value = false
  }
}

function jumpTo(idx: number): void {
  currentIndex.value = idx
  flipped.value = false
}

function mark(known: boolean): void {
  if (!currentWord.value) return
  currentWord.value.status = known ? 'known' : 'unknown'
  persist()
  message.success(known ? '已标记为认识' : '已标记为不认识')
  // 自动下一个
  if (activeDeck.value && currentIndex.value < activeDeck.value.words.length - 1) {
    next()
  }
}

function resetProgress(): void {
  if (!activeDeck.value) return
  activeDeck.value.words.forEach(w => (w.status = 'new'))
  currentIndex.value = 0
  flipped.value = false
  persist()
  message.success('进度已重置')
}

// 单词本操作
function createDeck(): void {
  const name = newDeckName.value.trim()
  if (!name) {
    message.warning('请输入单词本名称')
    return
  }
  const deck: Deck = { id: genId(), name, words: [] }
  decks.value.push(deck)
  activeDeckId.value = deck.id
  newDeckName.value = ''
  showDeckModal.value = false
  persist()
  message.success('单词本已创建')
}

// 单词操作
function saveWord(): void {
  if (!activeDeck.value) return
  const word = wordForm.value.word.trim()
  const translation = wordForm.value.translation.trim()
  if (!word || !translation) {
    message.warning('单词和释义均不能为空')
    return
  }
  if (editingWord.value) {
    editingWord.value.word = word
    editingWord.value.pos = wordForm.value.pos
    editingWord.value.translation = translation
    editingWord.value.example = wordForm.value.example.trim()
  } else {
    activeDeck.value.words.push({
      id: genId(),
      word,
      pos: wordForm.value.pos,
      translation,
      example: wordForm.value.example.trim(),
      status: 'new',
    })
  }
  wordForm.value = { word: '', pos: 'n.', translation: '', example: '' }
  editingWord.value = null
  showWordModal.value = false
  persist()
  message.success('已保存')
}

function editWord(w: Word): void {
  editingWord.value = w
  wordForm.value = { word: w.word, pos: w.pos, translation: w.translation, example: w.example }
  showWordModal.value = true
}

function deleteWord(id: string): void {
  if (!activeDeck.value) return
  const idx = activeDeck.value.words.findIndex(w => w.id === id)
  if (idx === -1) return
  activeDeck.value.words.splice(idx, 1)
  if (currentIndex.value >= activeDeck.value.words.length) {
    currentIndex.value = Math.max(0, activeDeck.value.words.length - 1)
  }
  persist()
  message.success('已删除')
}

// 默认单词库（50 个常用英语单词）
function defaultWords(): Word[] {
  const raw: Array<[string, string, string, string]> = [
    ['abandon', 'v.', '放弃；遗弃', 'He abandoned his old car.'],
    ['benefit', 'n.', '益处；好处', 'Exercise has many benefits.'],
    ['category', 'n.', '种类；类别', 'Books are divided into categories.'],
    ['determine', 'v.', '决定；决心', 'She determined to win.'],
    ['essential', 'adj.', '必要的；本质的', 'Water is essential to life.'],
    ['feature', 'n.', '特征；特色', 'The phone has many new features.'],
    ['generate', 'v.', '产生；生成', 'The plant generates electricity.'],
    ['honest', 'adj.', '诚实的', 'Be honest with yourself.'],
    ['identify', 'v.', '识别；辨认', 'Can you identify the suspect?'],
    ['journey', 'n.', '旅程；旅行', 'It was a long journey home.'],
    ['knowledge', 'n.', '知识；学识', 'Knowledge is power.'],
    ['limit', 'n.', '限制；界限', 'There is a limit to my patience.'],
    ['maintain', 'v.', '维持；保养', 'Maintain a healthy diet.'],
    ['necessary', 'adj.', '必要的', 'Sleep is necessary for health.'],
    ['obtain', 'v.', '获得；得到', 'He obtained a degree in math.'],
    ['particular', 'adj.', '特定的；特别的', 'Is there any particular color?'],
    ['quality', 'n.', '质量；品质', 'We focus on product quality.'],
    ['recognize', 'v.', '认出；承认', 'I recognized her at once.'],
    ['sufficient', 'adj.', '足够的', 'We have sufficient food.'],
    ['theory', 'n.', '理论；学说', 'In theory, it should work.'],
    ['unique', 'adj.', '独特的；唯一的', 'Each person is unique.'],
    ['vary', 'v.', '变化；不同', 'Prices vary by store.'],
    ['wisdom', 'n.', '智慧', 'Age brings wisdom.'],
    ['absolute', 'adj.', '绝对的', 'I have absolute confidence.'],
    ['complex', 'adj.', '复杂的', 'This is a complex problem.'],
    ['deliver', 'v.', '递送；交付', 'We deliver fresh food daily.'],
    ['evidence', 'n.', '证据', 'There is no evidence to support it.'],
    ['frequent', 'adj.', '频繁的', 'He is a frequent visitor.'],
    ['guarantee', 'v.', '保证', 'I guarantee you will love it.'],
    ['horizon', 'n.', '地平线；视野', 'The sun set below the horizon.'],
    ['indicate', 'v.', '表明；指示', 'The arrow indicates north.'],
    ['justify', 'v.', '证明…正当', 'Nothing can justify his actions.'],
    ['launch', 'v.', '发射；发起', 'They launched a new rocket.'],
    ['maximum', 'n.', '最大量', 'The maximum speed is 120 km/h.'],
    ['negative', 'adj.', '消极的；负的', 'He gave a negative answer.'],
    ['objective', 'n.', '目标', 'Our objective is to win.'],
    ['positive', 'adj.', '积极的；正的', 'Try to think positive.'],
    ['quantity', 'n.', '数量', 'A large quantity of food was wasted.'],
    ['relevant', 'adj.', '相关的', 'These facts are relevant.'],
    ['sustain', 'v.', '维持；支撑', 'He could not sustain his interest.'],
    ['transfer', 'v.', '转移；传递', 'Please transfer the file to me.'],
    ['update', 'v.', '更新', 'Please update your software.'],
    ['volume', 'n.', '体积；音量', 'Turn down the volume, please.'],
    ['wander', 'v.', '漫游；徘徊', 'She wandered through the streets.'],
    ['adapt', 'v.', '适应；改编', 'We must adapt to changes.'],
    ['behave', 'v.', '表现；举止', 'He behaved well at the party.'],
    ['concept', 'n.', '概念；观念', 'I understand the basic concept.'],
    ['demand', 'n.', '需求；要求', 'There is a high demand for oil.'],
    ['economy', 'n.', '经济', 'The economy is growing slowly.'],
  ]
  return raw.map(([word, pos, translation, example]) => ({
    id: genId(),
    word,
    pos,
    translation,
    example,
    status: 'new' as WordStatus,
  }))
}
</script>

<style scoped>
.flashcard-tool {
  padding: 16px 0;
}

.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.stats-bar {
  margin-bottom: 20px;
}

.stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #666;
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: #999;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
}

.card-stage {
  max-width: 560px;
  margin: 0 auto 24px;
}

.card-counter {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.word-card {
  perspective: 1200px;
  cursor: pointer;
  height: 260px;
  position: relative;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.word-card.flipped .flip-inner {
  transform: rotateY(180deg);
}

.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.flip-back {
  transform: rotateY(180deg);
  background: #f0f7ff;
}

.face-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 14px;
}

.word-text {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  text-align: center;
  word-break: break-word;
}

.word-pos {
  margin-top: 8px;
  font-size: 14px;
  color: #2080f0;
  font-style: italic;
}

.word-example {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
  text-align: center;
  font-style: italic;
  max-width: 100%;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.word-list {
  margin-top: 28px;
}

.list-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.word-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}

.word-row:hover {
  background: #f5f7fa;
}

.word-row.active {
  background: #e8f4ff;
}

.row-word {
  font-weight: 600;
  color: #333;
  min-width: 120px;
}

.row-pos {
  color: #2080f0;
  font-style: italic;
  min-width: 50px;
}

.row-trans {
  flex: 1;
  color: #555;
}

.row-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f5f5f5;
  color: #999;
}

.row-status.known {
  background: #e6ffed;
  color: #18a058;
}

.row-status.unknown {
  background: #ffe6e6;
  color: #d03050;
}

.row-ops {
  display: flex;
  gap: 4px;
}

/* 深色模式 */
.dark .flip-face {
  background: #181828;
  border-color: #2a2a4a;
}

.dark .flip-back {
  background: #1c2333;
}

.dark .word-text {
  color: #e0e0e0;
}

.dark .face-label {
  color: #777;
}

.dark .word-pos {
  color: #5b9bf5;
}

.dark .word-example {
  color: #aaa;
}

.dark .stats {
  color: #aaa;
}

.dark .empty-tip {
  color: #777;
  border-color: #2a2a4a;
}

.dark .card-counter {
  color: #777;
}

.dark .word-row:hover {
  background: #1f1f33;
}

.dark .word-row.active {
  background: #1c2a4a;
}

.dark .row-word {
  color: #e0e0e0;
}

.dark .row-trans {
  color: #bbb;
}

.dark .row-status {
  background: #2a2a3e;
  color: #aaa;
}

.dark .row-status.known {
  background: #143a25;
  color: #36c98a;
}

.dark .row-status.unknown {
  background: #3a1c1c;
  color: #ff7a8a;
}

.dark .list-title {
  color: #e0e0e0;
  border-color: #2a2a4a;
}
</style>
