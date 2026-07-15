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
      <n-button :disabled="!activeDeck" @click="showCardModal = true">添加卡片</n-button>
      <n-button :disabled="!activeDeck || activeDeck.cards.length === 0" @click="startReview">
        复习模式
      </n-button>
      <n-upload :show-file-list="false" accept=".json" :before-upload="onImport">
        <n-button>导入 JSON</n-button>
      </n-upload>
      <n-button :disabled="!activeDeck" @click="exportJson">导出 JSON</n-button>
    </div>

    <!-- 卡片组概览 -->
    <div v-if="activeDeck" class="deck-info">
      <n-card size="small">
        <div class="deck-stats">
          <span class="stat">卡片总数：<b>{{ activeDeck.cards.length }}</b></span>
          <span class="stat">未掌握：<b style="color:#d03050">{{ masteryCount(0) }}</b></span>
          <span class="stat">学习中：<b style="color:#f0a020">{{ masteryCount(1) }}</b></span>
          <span class="stat">熟悉：<b style="color:#2080f0">{{ masteryCount(2) }}</b></span>
          <span class="stat">已掌握：<b style="color:#18a058">{{ masteryCount(3) }}</b></span>
        </div>
      </n-card>
    </div>

    <!-- 空状态 -->
    <div v-if="!activeDeck" class="empty-tip">
      请先创建或选择一个卡片组
    </div>

    <!-- 卡片列表 -->
    <div v-else-if="!reviewing && activeDeck.cards.length > 0" class="card-list">
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
            <div class="mastery-tag" :class="'m' + card.mastery" @click.stop="cycleMastery(card)">
              {{ masteryLabel(card.mastery) }}
            </div>
          </div>
          <div class="flip-face flip-back">
            <div class="face-label">背面</div>
            <div class="face-text">{{ card.back }}</div>
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <n-button size="tiny" quaternary @click="editCard(card)">编辑</n-button>
          <n-button size="tiny" quaternary type="error" @click="deleteCard(card.id)">删除</n-button>
        </div>
      </div>
    </div>

    <!-- 复习模式 -->
    <div v-else-if="reviewing" class="review-mode">
      <div class="review-header">
        <span class="review-progress">
          复习进度：{{ reviewIndex + 1 }} / {{ reviewQueue.length }}
        </span>
        <n-button size="small" @click="exitReview">退出复习</n-button>
      </div>
      <div
        v-if="currentReview"
        class="card-item review-card"
        :class="{ flipped: reviewFlipped }"
        @click="reviewFlipped = !reviewFlipped"
      >
        <div class="flip-inner">
          <div class="flip-face flip-front">
            <div class="face-label">正面（点击翻转）</div>
            <div class="face-text">{{ currentReview.front }}</div>
          </div>
          <div class="flip-face flip-back">
            <div class="face-label">背面</div>
            <div class="face-text">{{ currentReview.back }}</div>
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

    <!-- 空卡片提示 -->
    <div v-else-if="activeDeck && activeDeck.cards.length === 0" class="empty-tip">
      当前卡片组还没有卡片，点击"添加卡片"开始
    </div>

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
        <n-input
          v-model:value="cardForm.front"
          type="textarea"
          :rows="2"
          placeholder="正面内容（如单词）"
        />
        <n-input
          v-model:value="cardForm.back"
          type="textarea"
          :rows="3"
          placeholder="背面内容（如释义、例句）"
        />
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
import { NButton, NCard, NInput, NSelect, NModal, NUpload, useMessage } from 'naive-ui'

interface FlashCard {
  id: string
  front: string
  back: string
  mastery: 0 | 1 | 2 | 3
}

interface Deck {
  id: string
  name: string
  cards: FlashCard[]
}

const STORAGE_KEY = 'flashcard_decks'

const message = useMessage()

const decks = ref<Deck[]>([])
const activeDeckId = ref<string | null>(null)
const flippedIds = ref<Set<string>>(new Set())

// 弹窗状态
const showDeckModal = ref(false)
const newDeckName = ref('')
const showCardModal = ref(false)
const editingCard = ref<FlashCard | null>(null)
const cardForm = ref({ front: '', back: '' })

// 复习模式
const reviewing = ref(false)
const reviewQueue = ref<FlashCard[]>([])
const reviewIndex = ref(0)
const reviewFlipped = ref(false)

const deckOptions = computed(() =>
  decks.value.map(d => ({ label: `${d.name} (${d.cards.length})`, value: d.id }))
)

const activeDeck = computed(() =>
  decks.value.find(d => d.id === activeDeckId.value) || null
)

const currentReview = computed(() =>
  reviewing.value && reviewIndex.value < reviewQueue.value.length
    ? reviewQueue.value[reviewIndex.value]
    : null
)

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
      if (Array.isArray(parsed)) decks.value = parsed
    }
  } catch {
    // ignore
  }
}

onMounted(() => {
  load()
  if (decks.value.length === 0) {
    decks.value = [
      {
        id: genId(),
        name: '示例：英语单词',
        cards: [
          { id: genId(), front: 'abandon', back: 'v. 放弃；遗弃', mastery: 0 },
          { id: genId(), front: 'benefit', back: 'n. 益处；好处', mastery: 1 },
          { id: genId(), front: 'category', back: 'n. 种类；类别', mastery: 2 },
        ],
      },
    ]
    persist()
  }
  activeDeckId.value = decks.value[0]?.id || null
})

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
function onDeckChange(): void {
  flippedIds.value = new Set()
}

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
  } else {
    activeDeck.value.cards.push({
      id: genId(),
      front,
      back,
      mastery: 0,
    })
  }
  cardForm.value = { front: '', back: '' }
  editingCard.value = null
  showCardModal.value = false
  persist()
  message.success('已保存')
}

function editCard(card: FlashCard): void {
  editingCard.value = card
  cardForm.value = { front: card.front, back: card.back }
  showCardModal.value = true
}

function deleteCard(id: string): void {
  if (!activeDeck.value) return
  activeDeck.value.cards = activeDeck.value.cards.filter(c => c.id !== id)
  persist()
  message.success('已删除')
}

// 复习模式：按掌握度升序，未掌握优先
function startReview(): void {
  if (!activeDeck.value || activeDeck.value.cards.length === 0) return
  reviewQueue.value = [...activeDeck.value.cards].sort((a, b) => a.mastery - b.mastery)
  reviewIndex.value = 0
  reviewFlipped.value = false
  reviewing.value = true
}

function exitReview(): void {
  reviewing.value = false
  reviewQueue.value = []
  reviewIndex.value = 0
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
  const blob = new Blob([JSON.stringify(activeDeck.value, null, 2)], {
    type: 'application/json',
  })
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
      const data = JSON.parse(reader.result as string) as Deck
      if (!data.name || !Array.isArray(data.cards)) {
        message.error('文件格式不正确')
        return
      }
      data.id = genId()
      data.cards.forEach(c => {
        c.id = genId()
        if (![0, 1, 2, 3].includes(c.mastery)) c.mastery = 0
      })
      decks.value.push(data)
      activeDeckId.value = data.id
      persist()
      message.success(`已导入卡片组「${data.name}」`)
    } catch {
      message.error('解析失败，请检查文件')
    }
  }
  reader.readAsText(file.file)
  return false
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

.card-item.flipped .flip-inner {
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

.review-mode {
  max-width: 600px;
  margin: 0 auto;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.review-progress {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.review-card {
  height: 240px;
  margin-bottom: 20px;
}

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

.dark .face-text {
  color: #e0e0e0;
}

.dark .face-label {
  color: #777;
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
