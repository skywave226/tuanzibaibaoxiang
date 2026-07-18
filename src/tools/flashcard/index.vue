<template>
  <div class="flashcard">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <n-select
        v-model:value="activeDeckId"
        :options="deckOptions"
        placeholder="选择卡片组"
        style="width: 220px"
        @update:value="onDeckChange"
      />
      <n-button type="primary" @click="showDeckModal = true">新建卡片组</n-button>
      <n-button :disabled="!activeDeck" @click="openAddCard">添加卡片</n-button>
      <n-button :disabled="!canStudy" @click="startBrowse">浏览模式</n-button>
      <n-button :disabled="!canStudy" @click="startReview">复习模式</n-button>
      <n-button :disabled="!activeDeck" @click="resetProgress">重置进度</n-button>
      <n-upload :show-file-list="false" accept=".json" :before-upload="onImport">
        <n-button>导入 JSON</n-button>
      </n-upload>
      <n-button :disabled="!activeDeck" @click="exportJson">导出 JSON</n-button>
    </div>

    <!-- 统计 -->
    <div v-if="activeDeck" class="deck-info">
      <n-card size="small">
        <div class="deck-stats">
          <span class="stat">卡片总数：<b>{{ activeDeck.cards.length }}</b></span>
          <span class="stat">未掌握：<b style="color:#d03050">{{ masteryCount(0) }}</b></span>
          <span class="stat">学习中：<b style="color:#f0a020">{{ masteryCount(1) }}</b></span>
          <span class="stat">熟悉：<b style="color:#2080f0">{{ masteryCount(2) }}</b></span>
          <span class="stat">已掌握：<b style="color:#18a058">{{ masteryCount(3) }}</b></span>
          <span class="stat">进度：<b>{{ progressPercent }}%</b></span>
        </div>
        <n-progress type="line" :percentage="progressPercent" :show-indicator="false" :height="6" style="margin-top: 10px" />
      </n-card>
    </div>

    <!-- 空状态 -->
    <div v-if="!activeDeck" class="empty-tip">请先创建或选择一个卡片组</div>

    <!-- 列表模式 -->
    <template v-else-if="mode === 'list'">
      <div v-if="activeDeck.cards.length === 0" class="empty-tip">当前卡片组还没有卡片，点击"添加卡片"开始</div>
      <div v-else class="card-list">
        <div
          v-for="card in activeDeck.cards"
          :key="card.id"
          class="card-item"
          :class="{ flipped: flippedIds.has(card.id) }"
          @click="toggleFlip(card.id)"
        >
          <div class="flip-inner">
            <div class="flip-face flip-front">
              <div class="face-label">正面</div>
              <div class="face-text">{{ card.front }}</div>
              <div v-if="card.pos" class="face-pos">{{ card.pos }}</div>
              <div class="mastery-tag" :class="'m' + card.mastery" @click.stop="cycleMastery(card)">
                {{ masteryLabel(card.mastery) }}
              </div>
            </div>
            <div class="flip-face flip-back">
              <div class="face-label">背面</div>
              <div class="face-text">{{ card.back }}</div>
              <div v-if="card.example" class="face-example">{{ card.example }}</div>
            </div>
          </div>
          <div class="card-actions" @click.stop>
            <n-button size="tiny" quaternary @click="editCard(card)">编辑</n-button>
            <n-button size="tiny" quaternary type="error" @click="deleteCard(card.id)">删除</n-button>
          </div>
        </div>
      </div>
    </template>

    <!-- 浏览模式 -->
    <template v-else-if="mode === 'browse' && currentCard">
      <div class="browse-mode">
        <div class="browse-header">
          <span>浏览进度：{{ browseIndex + 1 }} / {{ browseQueue.length }}</span>
          <n-radio-group v-model:value="browseOrder" size="small" @update:value="onBrowseOrderChange">
            <n-radio-button value="order">顺序</n-radio-button>
            <n-radio-button value="random">随机</n-radio-button>
          </n-radio-group>
          <n-button size="small" @click="exitBrowse">退出浏览</n-button>
        </div>
        <div class="big-card" :class="{ flipped: browseFlipped }" @click="browseFlipped = !browseFlipped">
          <div class="flip-inner">
            <div class="flip-face flip-front">
              <div class="face-label">点击翻面查看背面</div>
              <div class="big-text">{{ currentCard.front }}</div>
              <div v-if="currentCard.pos" class="big-pos">{{ currentCard.pos }}</div>
            </div>
            <div class="flip-face flip-back">
              <div class="face-label">背面</div>
              <div class="big-text">{{ currentCard.back }}</div>
              <div v-if="currentCard.example" class="big-example">{{ currentCard.example }}</div>
            </div>
          </div>
        </div>
        <div class="browse-actions">
          <n-button @click="prevBrowse" :disabled="browseIndex === 0">上一个</n-button>
          <n-button type="error" ghost @click="markBrowse(0)">不认识</n-button>
          <n-button @click="browseFlipped = !browseFlipped">翻面</n-button>
          <n-button type="success" ghost @click="markBrowse(3)">认识</n-button>
          <n-button @click="nextBrowse" :disabled="browseIndex >= browseQueue.length - 1">下一个</n-button>
        </div>
      </div>
    </template>

    <!-- 复习模式 -->
    <template v-else-if="mode === 'review' && currentReview">
      <div class="review-mode">
        <div class="review-header">
          <span class="review-progress">复习进度：{{ reviewIndex + 1 }} / {{ reviewQueue.length }}</span>
          <n-button size="small" @click="exitReview">退出复习</n-button>
        </div>
        <div class="big-card review-card" :class="{ flipped: reviewFlipped }" @click="reviewFlipped = !reviewFlipped">
          <div class="flip-inner">
            <div class="flip-face flip-front">
              <div class="face-label">正面（点击翻转）</div>
              <div class="big-text">{{ currentReview.front }}</div>
              <div v-if="currentReview.pos" class="big-pos">{{ currentReview.pos }}</div>
            </div>
            <div class="flip-face flip-back">
              <div class="face-label">背面</div>
              <div class="big-text">{{ currentReview.back }}</div>
              <div v-if="currentReview.example" class="big-example">{{ currentReview.example }}</div>
            </div>
          </div>
        </div>
        <div class="review-actions">
          <n-button @click="setReviewMastery(0)" type="error" ghost>仍未掌握</n-button>
          <n-button @click="setReviewMastery(1)" type="warning" ghost>学习中</n-button>
          <n-button @click="setReviewMastery(2)" type="info" ghost>熟悉</n-button>
          <n-button @click="setReviewMastery(3)" type="success" ghost>已掌握</n-button>
        </div>
      </div>
    </template>

    <!-- 卡片组弹窗 -->
    <n-modal v-model:show="showDeckModal" preset="dialog" title="新建卡片组">
      <n-input v-model:value="newDeckName" placeholder="卡片组名称（如：英语四级）" />
      <template #action>
        <n-button @click="showDeckModal = false">取消</n-button>
        <n-button type="primary" @click="createDeck">创建</n-button>
      </template>
    </n-modal>

    <!-- 卡片弹窗 -->
    <n-modal v-model:show="showCardModal" preset="dialog" :title="editingCard ? '编辑卡片' : '添加卡片'">
      <div class="modal-form">
        <n-input v-model:value="cardForm.front" placeholder="正面内容（如单词）" />
        <n-input v-model:value="cardForm.pos" placeholder="词性（可选，如 n.）" />
        <n-input v-model:value="cardForm.back" type="textarea" :rows="3" placeholder="背面内容（如释义）" />
        <n-input v-model:value="cardForm.example" type="textarea" :rows="2" placeholder="例句（可选）" />
      </div>
      <template #action>
        <n-button @click="showCardModal = false">取消</n-button>
        <n-button type="primary" @click="saveCard">保存</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NButton, NCard, NInput, NSelect, NModal, NUpload, NProgress,
  NRadioGroup, NRadioButton, useMessage,
} from 'naive-ui'

interface FlashCard {
  id: string
  front: string
  back: string
  pos: string
  example: string
  mastery: 0 | 1 | 2 | 3
}

interface Deck {
  id: string
  name: string
  cards: FlashCard[]
}

const STORAGE_KEY = 'flashcard_decks'
const LEGACY_KEY = 'flashcard_tool_decks'

const message = useMessage()

const decks = ref<Deck[]>([])
const activeDeckId = ref<string | null>(null)
const flippedIds = ref<Set<string>>(new Set())
const mode = ref<'list' | 'browse' | 'review'>('list')

// 弹窗状态
const showDeckModal = ref(false)
const newDeckName = ref('')
const showCardModal = ref(false)
const editingCard = ref<FlashCard | null>(null)
const cardForm = ref({ front: '', back: '', pos: '', example: '' })

// 浏览模式
const browseIndex = ref(0)
const browseFlipped = ref(false)
const browseOrder = ref<'order' | 'random'>('order')
const browseQueue = ref<FlashCard[]>([])

// 复习模式
const reviewQueue = ref<FlashCard[]>([])
const reviewIndex = ref(0)
const reviewFlipped = ref(false)

const deckOptions = computed(() =>
  decks.value.map(d => ({ label: `${d.name} (${d.cards.length})`, value: d.id }))
)

const activeDeck = computed(() =>
  decks.value.find(d => d.id === activeDeckId.value) || null
)

const canStudy = computed(() => !!activeDeck.value && activeDeck.value.cards.length > 0)

const currentCard = computed(() => {
  if (!browseQueue.value.length) return null
  return browseQueue.value[browseIndex.value] || null
})

const currentReview = computed(() => {
  if (!reviewQueue.value.length) return null
  return reviewQueue.value[reviewIndex.value] || null
})

const progressPercent = computed(() => {
  if (!activeDeck.value || activeDeck.value.cards.length === 0) return 0
  return Math.round((activeDeck.value.cards.filter(c => c.mastery === 3).length / activeDeck.value.cards.length) * 100)
})

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function masteryLabel(m: number): string {
  return ['未掌握', '学习中', '熟悉', '已掌握'][m] || '未掌握'
}

function masteryCount(m: number): number {
  if (!activeDeck.value) return 0
  return activeDeck.value.cards.filter(c => c.mastery === m).length
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
      if (Array.isArray(parsed)) {
        decks.value = parsed
        migrateLegacyData()
        return
      }
    }
  } catch {
    // ignore
  }
  migrateLegacyData()
  if (!decks.value.length) {
    decks.value = [{ id: genId(), name: '常用英语单词', cards: defaultWords() }]
    persist()
  }
}

// 迁移旧版 flashcard-tool 数据
function migrateLegacyData(): void {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Array<{
      id: string
      name: string
      words: Array<{
        id: string
        word: string
        pos?: string
        translation: string
        example?: string
        status: 'new' | 'known' | 'unknown'
      }>
    }>
    if (!Array.isArray(parsed)) return
    const migrated: Deck[] = parsed.map(d => ({
      id: genId(),
      name: d.name,
      cards: d.words.map(w => ({
        id: genId(),
        front: w.word,
        back: w.translation,
        pos: w.pos || '',
        example: w.example || '',
        mastery: (w.status === 'known' ? 3 : w.status === 'unknown' ? 0 : 1) as FlashCard['mastery'],
      })),
    }))
    if (migrated.length) {
      decks.value = [...decks.value, ...migrated]
      persist()
      message.success(`已迁移 ${migrated.length} 个旧单词本`)
    }
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // ignore
  }
}

onMounted(() => {
  load()
  activeDeckId.value = decks.value[0]?.id || null
})

function onDeckChange(): void {
  flippedIds.value = new Set()
  mode.value = 'list'
  exitBrowse()
  exitReview()
}

function openAddCard(): void {
  editingCard.value = null
  cardForm.value = { front: '', back: '', pos: '', example: '' }
  showCardModal.value = true
}

// 翻转
function toggleFlip(id: string): void {
  const next = new Set(flippedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  flippedIds.value = next
}

// 掌握度循环
function cycleMastery(card: FlashCard): void {
  card.mastery = ((card.mastery + 1) % 4) as FlashCard['mastery']
  persist()
}

// 卡片组操作
function createDeck(): void {
  const name = newDeckName.value.trim()
  if (!name) {
    message.warning('请输入卡片组名称')
    return
  }
  const deck: Deck = { id: genId(), name, cards: [] }
  decks.value.push(deck)
  activeDeckId.value = deck.id
  newDeckName.value = ''
  showDeckModal.value = false
  persist()
  message.success('卡片组已创建')
}

// 卡片操作
function saveCard(): void {
  if (!activeDeck.value) return
  const front = cardForm.value.front.trim()
  const back = cardForm.value.back.trim()
  if (!front || !back) {
    message.warning('正反面内容均不能为空')
    return
  }
  if (editingCard.value) {
    editingCard.value.front = front
    editingCard.value.back = back
    editingCard.value.pos = cardForm.value.pos.trim()
    editingCard.value.example = cardForm.value.example.trim()
  } else {
    activeDeck.value.cards.push({
      id: genId(),
      front,
      back,
      pos: cardForm.value.pos.trim(),
      example: cardForm.value.example.trim(),
      mastery: 0,
    })
  }
  cardForm.value = { front: '', back: '', pos: '', example: '' }
  editingCard.value = null
  showCardModal.value = false
  persist()
  message.success('已保存')
}

function editCard(card: FlashCard): void {
  editingCard.value = card
  cardForm.value = { front: card.front, back: card.back, pos: card.pos, example: card.example }
  showCardModal.value = true
}

function deleteCard(id: string): void {
  if (!activeDeck.value) return
  activeDeck.value.cards = activeDeck.value.cards.filter(c => c.id !== id)
  persist()
  message.success('已删除')
}

function resetProgress(): void {
  if (!activeDeck.value) return
  activeDeck.value.cards.forEach(c => (c.mastery = 0))
  persist()
  message.success('进度已重置')
}

// 浏览模式
function startBrowse(): void {
  if (!activeDeck.value || activeDeck.value.cards.length === 0) return
  buildBrowseQueue()
  browseIndex.value = 0
  browseFlipped.value = false
  mode.value = 'browse'
}

function buildBrowseQueue(): void {
  if (!activeDeck.value) return
  const cards = [...activeDeck.value.cards]
  if (browseOrder.value === 'random') {
    browseQueue.value = cards.sort(() => Math.random() - 0.5)
  } else {
    browseQueue.value = cards
  }
}

function onBrowseOrderChange(): void {
  buildBrowseQueue()
  browseIndex.value = 0
  browseFlipped.value = false
}

function exitBrowse(): void {
  browseQueue.value = []
  browseIndex.value = 0
  browseFlipped.value = false
  if (mode.value === 'browse') mode.value = 'list'
}

function nextBrowse(): void {
  if (browseIndex.value < browseQueue.value.length - 1) {
    browseIndex.value++
    browseFlipped.value = false
  }
}

function prevBrowse(): void {
  if (browseIndex.value > 0) {
    browseIndex.value--
    browseFlipped.value = false
  }
}

function markBrowse(mastery: 0 | 3): void {
  if (!currentCard.value) return
  currentCard.value.mastery = mastery
  persist()
  message.success(mastery === 3 ? '已标记为认识' : '已标记为不认识')
  if (browseIndex.value < browseQueue.value.length - 1) {
    nextBrowse()
  }
}

// 复习模式：按掌握度升序，未掌握优先
function startReview(): void {
  if (!activeDeck.value || activeDeck.value.cards.length === 0) return
  reviewQueue.value = [...activeDeck.value.cards].sort((a, b) => a.mastery - b.mastery)
  reviewIndex.value = 0
  reviewFlipped.value = false
  mode.value = 'review'
}

function exitReview(): void {
  reviewQueue.value = []
  reviewIndex.value = 0
  reviewFlipped.value = false
  if (mode.value === 'review') mode.value = 'list'
}

function setReviewMastery(m: 0 | 1 | 2 | 3): void {
  if (!currentReview.value) return
  currentReview.value.mastery = m
  persist()
  if (reviewIndex.value < reviewQueue.value.length - 1) {
    reviewIndex.value++
    reviewFlipped.value = false
  } else {
    message.success('复习完成！')
    exitReview()
  }
}

// 导入导出
function exportJson(): void {
  if (!activeDeck.value) return
  const blob = new Blob([JSON.stringify(activeDeck.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${activeDeck.value.name}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('已导出')
}

function onImport(file: { file: File }): boolean {
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string) as Deck | Deck[]
      const items = Array.isArray(data) ? data : [data]
      let count = 0
      for (const item of items) {
        if (!item.name || !Array.isArray(item.cards)) {
          message.error('文件格式不正确')
          return
        }
        const migrated: Deck = {
          id: genId(),
          name: item.name,
          cards: item.cards.map((c: any) => ({
            id: genId(),
            front: String(c.front || c.word || ''),
            back: String(c.back || c.translation || ''),
            pos: String(c.pos || ''),
            example: String(c.example || ''),
            mastery: ([0, 1, 2, 3].includes(Number(c.mastery)) ? Number(c.mastery) : 0) as FlashCard['mastery'],
          })),
        }
        decks.value.push(migrated)
        count++
      }
      persist()
      message.success(`已导入 ${count} 个卡片组`)
    } catch {
      message.error('解析失败，请检查文件')
    }
  }
  reader.readAsText(file.file)
  return false
}

// 默认单词库
function defaultWords(): FlashCard[] {
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
  return raw.map(([front, pos, back, example]) => ({
    id: genId(),
    front,
    pos,
    back,
    example,
    mastery: 0,
  }))
}
</script>

<style scoped>
.flashcard {
  max-width: 1000px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.deck-info {
  margin-bottom: 16px;
}

.deck-stats {
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

.card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.card-item {
  perspective: 1000px;
  cursor: pointer;
  height: 180px;
  position: relative;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card-item.flipped .flip-inner,
.big-card.flipped .flip-inner {
  transform: rotateY(180deg);
}

.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.flip-back {
  transform: rotateY(180deg);
  background: #f0f7ff;
}

.face-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.face-text {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  overflow: auto;
  word-break: break-word;
}

.face-pos,
.big-pos {
  margin-top: 6px;
  font-size: 13px;
  color: #2080f0;
  font-style: italic;
}

.face-example,
.big-example {
  margin-top: 10px;
  font-size: 13px;
  color: #666;
  font-style: italic;
  overflow: auto;
}

.mastery-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  align-self: flex-start;
  color: #fff;
}

.mastery-tag.m0 { background: #d03050; }
.mastery-tag.m1 { background: #f0a020; }
.mastery-tag.m2 { background: #2080f0; }
.mastery-tag.m3 { background: #18a058; }

.card-actions {
  position: absolute;
  bottom: -32px;
  right: 0;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.card-item:hover .card-actions {
  opacity: 1;
}

.browse-mode,
.review-mode {
  max-width: 600px;
  margin: 0 auto;
}

.browse-header,
.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.review-progress {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.big-card {
  perspective: 1200px;
  cursor: pointer;
  height: 260px;
  position: relative;
  margin-bottom: 20px;
}

.big-card .flip-face {
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.big-text {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  text-align: center;
  word-break: break-word;
}

.browse-actions,
.review-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 深色模式 */
.dark .flip-face {
  background: #181828;
  border-color: #2a2a4a;
}

.dark .flip-back {
  background: #1c2333;
}

.dark .face-text,
.dark .big-text {
  color: #e0e0e0;
}

.dark .face-label {
  color: #777;
}

.dark .face-pos,
.dark .big-pos {
  color: #5b9bf5;
}

.dark .face-example,
.dark .big-example {
  color: #aaa;
}

.dark .deck-stats {
  color: #aaa;
}

.dark .review-progress {
  color: #e0e0e0;
}

.dark .empty-tip {
  color: #777;
  border-color: #2a2a4a;
}
</style>
