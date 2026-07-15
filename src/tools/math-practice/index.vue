<template>
  <div class="math-practice">
    <!-- 配置区 -->
    <n-card title="练习设置" size="small" class="config-card">
      <div class="config-grid">
        <div class="config-item">
          <label>运算类型</label>
          <n-select v-model:value="config.operation" :options="operationOptions" />
        </div>
        <div class="config-item">
          <label>难度等级</label>
          <n-select v-model:value="config.difficulty" :options="difficultyOptions" />
        </div>
        <div class="config-item">
          <label>题目数量</label>
          <n-input-number v-model:value="config.count" :min="5" :max="50" :step="5" />
        </div>
        <div class="config-item config-action">
          <n-button type="primary" @click="startPractice" :disabled="phase === 'practice'">
            {{ phase === 'idle' ? '开始练习' : '重新开始' }}
          </n-button>
          <n-button v-if="phase === 'practice'" @click="submitAnswers" type="warning">
            提前交卷
          </n-button>
        </div>
      </div>
    </n-card>

    <!-- 练习区 -->
    <template v-if="phase === 'practice'">
      <div class="practice-header">
        <div class="timer">
          <span class=" timer-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          <span class="timer-text" :class="{ overtime: elapsedSec > 0 }">用时：{{ formattedTime }}</span>
        </div>
        <div class="progress">
          已答 {{ answeredCount }} / {{ questions.length }}
        </div>
      </div>

      <div class="questions-grid">
        <div
          v-for="(q, idx) in questions"
          :key="q.id"
          class="question-card"
          :class="{
            answered: answers[idx] !== '' && answers[idx] !== null,
            current: idx === currentIndex,
          }"
          @click="currentIndex = idx"
        >
          <div class="q-index">{{ idx + 1 }}</div>
          <div class="q-content">{{ q.a }} {{ q.op }} {{ q.b }} =</div>
          <input
            ref="inputRefs"
            v-model="answers[idx]"
            type="text"
            inputmode="numeric"
            class="q-input"
            :placeholder="'?'"
            @keyup.enter="nextQuestion(idx)"
          />
        </div>
      </div>

      <div class="practice-footer">
        <n-button type="primary" size="large" @click="submitAnswers">交卷判分</n-button>
      </div>
    </template>

    <!-- 结果区 -->
    <template v-if="phase === 'result'">
      <n-card title="练习结果" size="small" class="result-card">
        <div class="result-summary">
          <div class="summary-item">
            <div class="summary-label">总题数</div>
            <div class="summary-value">{{ questions.length }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">正确</div>
            <div class="summary-value correct">{{ stats.correct }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">错误</div>
            <div class="summary-value wrong">{{ stats.wrong }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">未答</div>
            <div class="summary-value skip">{{ stats.skipped }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">正确率</div>
            <div class="summary-value rate" :class="rateClass">{{ stats.rate }}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">用时</div>
            <div class="summary-value">{{ formattedTime }}</div>
          </div>
        </div>

        <n-divider>错题回顾</n-divider>
        <div v-if="wrongQuestions.length === 0" class="no-wrong">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> 全部正确，太棒了！
        </div>
        <div v-else class="wrong-list">
          <div v-for="w in wrongQuestions" :key="w.idx" class="wrong-item">
            <span class="w-q">{{ w.q.a }} {{ w.q.op }} {{ w.q.b }} =</span>
            <span class="w-correct">{{ w.q.answer }}</span>
            <span class="w-your" v-if="w.your !== '' && w.your !== null">你的答案：{{ w.your }}</span>
            <span class="w-your skip" v-else>未作答</span>
          </div>
        </div>

        <div class="result-actions">
          <n-button @click="startPractice">再来一组</n-button>
          <n-button @click="resetAll">返回设置</n-button>
        </div>
      </n-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { NCard, NSelect, NInputNumber, NButton, NDivider } from 'naive-ui'

type Phase = 'idle' | 'practice' | 'result'
type Operation = 'add' | 'sub' | 'mul' | 'div' | 'mixed'
type Difficulty = 'easy' | 'medium' | 'hard'

interface Question {
  id: number
  a: number
  b: number
  op: string
  answer: number
}

const config = ref({
  operation: 'add' as Operation,
  difficulty: 'easy' as Difficulty,
  count: 10,
})

const operationOptions = [
  { label: '加法 (+)', value: 'add' },
  { label: '减法 (-)', value: 'sub' },
  { label: '乘法 (×)', value: 'mul' },
  { label: '除法 (÷)', value: 'div' },
  { label: '混合运算', value: 'mixed' },
]

const difficultyOptions = [
  { label: '简单（1-10）', value: 'easy' },
  { label: '中等（1-50）', value: 'medium' },
  { label: '困难（1-100）', value: 'hard' },
]

const phase = ref<Phase>('idle')
const questions = ref<Question[]>([])
const answers = ref<(string | null)[]>([])
const currentIndex = ref(0)
const inputRefs = ref<HTMLInputElement[]>([])

// 计时
const startTime = ref(0)
const endTime = ref(0)
const nowTick = ref(0)
let timerId: number | null = null

const elapsedSec = computed(() => {
  if (phase.value !== 'practice' && phase.value !== 'result') return 0
  const end = phase.value === 'result' ? endTime.value : nowTick.value
  return Math.floor((end - startTime.value) / 1000)
})

const formattedTime = computed(() => {
  const sec = elapsedSec.value
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const answeredCount = computed(() => {
  return answers.value.filter(a => a !== '' && a !== null).length
})

function startTimer() {
  startTime.value = Date.now()
  if (timerId) clearInterval(timerId)
  timerId = window.setInterval(() => {
    nowTick.value = Date.now()
  }, 1000)
}

function stopTimer() {
  endTime.value = Date.now()
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

// 难度范围
function getRange(diff: Difficulty): [number, number] {
  if (diff === 'easy') return [1, 10]
  if (diff === 'medium') return [1, 50]
  return [1, 100]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickOp(): string {
  if (config.value.operation !== 'mixed') {
    return { add: '+', sub: '-', mul: '×', div: '÷' }[config.value.operation] as string
  }
  const ops = ['+', '-', '×', '÷']
  return ops[randInt(0, 3)]
}

function generateQuestion(id: number): Question {
  const [min, max] = getRange(config.value.difficulty)
  const op = pickOp()
  let a = 0, b = 0, answer = 0

  if (op === '+') {
    a = randInt(min, max)
    b = randInt(min, max)
    answer = a + b
  } else if (op === '-') {
    a = randInt(min, max)
    b = randInt(min, a) // 避免负数
    answer = a - b
  } else if (op === '×') {
    // 乘法适当缩小范围，避免结果过大
    const mulMax = config.value.difficulty === 'easy' ? 9 : config.value.difficulty === 'medium' ? 12 : 20
    a = randInt(2, mulMax)
    b = randInt(2, mulMax)
    answer = a * b
  } else {
    // 除法：先生成 b 和 answer，再算 a，确保整除
    const divMax = config.value.difficulty === 'easy' ? 9 : config.value.difficulty === 'medium' ? 12 : 20
    b = randInt(2, divMax)
    answer = randInt(2, divMax)
    a = b * answer
  }

  return { id, a, b, op, answer }
}

function startPractice() {
  const list: Question[] = []
  for (let i = 0; i < config.value.count; i++) {
    list.push(generateQuestion(i))
  }
  questions.value = list
  answers.value = new Array(list.length).fill('')
  currentIndex.value = 0
  phase.value = 'practice'
  startTimer()
  nextTick(() => {
    inputRefs.value[0]?.focus()
  })
}

function nextQuestion(idx: number) {
  if (idx < questions.value.length - 1) {
    currentIndex.value = idx + 1
    inputRefs.value[idx + 1]?.focus()
  }
}

interface Stats {
  correct: number
  wrong: number
  skipped: number
  rate: number
}
const stats = ref<Stats>({ correct: 0, wrong: 0, skipped: 0, rate: 0 })

interface WrongItem {
  idx: number
  q: Question
  your: string | null
}
const wrongQuestions = ref<WrongItem[]>([])

function submitAnswers() {
  stopTimer()
  let correct = 0, wrong = 0, skipped = 0
  const wrongs: WrongItem[] = []
  questions.value.forEach((q, idx) => {
    const your = answers.value[idx]
    if (your === '' || your === null) {
      skipped++
      wrongs.push({ idx, q, your })
    } else {
      const num = parseFloat(your)
      if (num === q.answer) {
        correct++
      } else {
        wrong++
        wrongs.push({ idx, q, your })
      }
    }
  })
  const total = questions.value.length
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0
  stats.value = { correct, wrong, skipped, rate }
  wrongQuestions.value = wrongs
  phase.value = 'result'
}

const rateClass = computed(() => {
  const r = stats.value.rate
  if (r >= 90) return 'excellent'
  if (r >= 70) return 'good'
  if (r >= 60) return 'pass'
  return 'fail'
})

function resetAll() {
  phase.value = 'idle'
  questions.value = []
  answers.value = []
  wrongQuestions.value = []
  stopTimer()
}

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})
</script>

<style scoped>
.math-practice {
  max-width: 1000px;
  margin: 0 auto;
}

.config-card {
  margin-bottom: 20px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: end;
}

.config-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label {
  color: #bbb;
}

.config-action {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

/* 练习头 */
.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.dark .practice-header {
  background: rgba(255, 255, 255, 0.05);
}

.timer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
}

.timer-icon {
  font-size: 18px;
  color: #2080f0;
}

.timer-text.overtime {
  color: #333;
}

.dark .timer-text.overtime {
  color: #e0e0e0;
}

.progress {
  font-size: 14px;
  color: #888;
}

/* 题目网格 */
.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.question-card {
  border: 1px solid #e0e0e6;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.question-card:hover {
  border-color: #2080f0;
  box-shadow: 0 2px 8px rgba(32, 128, 240, 0.12);
}

.question-card.answered {
  border-color: #36ad6a;
  background: #f6ffed;
}

.question-card.current {
  border-color: #2080f0;
  border-width: 2px;
}

.dark .question-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}

.dark .question-card:hover {
  border-color: #2080f0;
}

.dark .question-card.answered {
  background: rgba(54, 173, 106, 0.1);
  border-color: #36ad6a;
}

.q-index {
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}

.q-content {
  font-size: 18px;
  font-weight: 600;
  font-family: 'Fira Code', 'Consolas', monospace;
  margin-bottom: 8px;
  color: #333;
}

.dark .q-content {
  color: #e0e0e0;
}

.q-input {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 16px;
  font-family: 'Fira Code', 'Consolas', monospace;
  outline: none;
  background: #fff;
  color: #333;
  box-sizing: border-box;
}

.q-input:focus {
  border-color: #2080f0;
}

.dark .q-input {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.15);
  color: #e0e0e0;
}

.practice-footer {
  text-align: center;
  padding: 10px 0;
}

/* 结果区 */
.result-card {
  margin-bottom: 20px;
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.summary-item {
  text-align: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.dark .summary-item {
  background: rgba(255, 255, 255, 0.04);
}

.summary-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  font-family: 'Fira Code', monospace;
}

.dark .summary-value {
  color: #e0e0e0;
}

.summary-value.correct {
  color: #36ad6a;
}

.summary-value.wrong {
  color: #f56c6c;
}

.summary-value.skip {
  color: #909399;
}

.summary-value.rate.excellent {
  color: #36ad6a;
}

.summary-value.rate.good {
  color: #2080f0;
}

.summary-value.rate.pass {
  color: #f0a020;
}

.summary-value.rate.fail {
  color: #f56c6c;
}

.no-wrong {
  text-align: center;
  padding: 24px;
  color: #36ad6a;
  font-size: 16px;
  font-weight: 600;
}

.no-wrong svg {
  color: #36ad6a;
  margin-right: 6px;
}

.wrong-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.wrong-item {
  padding: 10px 12px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dark .wrong-item {
  background: rgba(245, 108, 108, 0.08);
  border-color: rgba(245, 108, 108, 0.3);
}

.w-q {
  font-family: 'Fira Code', monospace;
  font-weight: 600;
  color: #333;
}

.dark .w-q {
  color: #e0e0e0;
}

.w-correct {
  color: #36ad6a;
  font-weight: 600;
}

.w-your {
  color: #f56c6c;
  font-size: 12px;
}

.w-your.skip {
  color: #909399;
}

.result-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 600px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
  .questions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
