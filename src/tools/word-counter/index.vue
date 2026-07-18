<template>
  <div class="word-counter">
    <div class="toolbar mb-3 flex gap-3 flex-wrap">
      <n-button size="small" @click="copyText" :disabled="!text">复制文本</n-button>
      <n-button size="small" @click="clearText">清空</n-button>
      <n-button size="small" @click="pasteText">粘贴</n-button>
      <n-radio-group v-model:value="countMode" size="small">
        <n-radio-button value="all">全部字符</n-radio-button>
        <n-radio-button value="visible">不含空白</n-radio-button>
      </n-radio-group>
    </div>

    <n-input v-model:value="text" type="textarea" placeholder="请输入文本..." :rows="12" />

    <div class="stats">
      <n-statistic label="字符数" :value="charCount" />
      <n-statistic label="字符数（不含空格）" :value="charCountNoSpace" />
      <n-statistic label="中文字符" :value="chineseCount" />
      <n-statistic label="单词数" :value="wordCount" />
      <n-statistic label="行数" :value="lineCount" />
      <n-statistic label="段落数" :value="paragraphCount" />
      <n-statistic label="预计阅读时间" :value="readingTime" />
      <n-statistic label="预计朗读时间" :value="speakingTime" />
    </div>

    <n-card title="词频统计" class="mt-6" v-if="topWords.length > 0">
      <div class="word-freq">
        <div v-for="item in topWords" :key="item.word" class="freq-item">
          <span class="freq-word">{{ item.word }}</span>
          <div class="freq-bar-wrapper">
            <div class="freq-bar" :style="{ width: `${(item.count / maxFreq) * 100}%` }"></div>
          </div>
          <span class="freq-count">{{ item.count }}</span>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NInput, NStatistic, NButton, NCard, NRadioGroup, NRadioButton, useMessage } from 'naive-ui'

const message = useMessage()
const text = ref('')
const countMode = ref<'all' | 'visible'>('all')

const stats = ref({
  chars: 0,
  charsNoSpace: 0,
  chinese: 0,
  words: 0,
  lines: 0,
  paragraphs: 0,
})

let timer: number | null = null

function calcStats() {
  const t = text.value
  stats.value = {
    chars: t.length,
    charsNoSpace: t.replace(/\s/g, '').length,
    chinese: (t.match(/[\u4e00-\u9fa5]/g) || []).length,
    words: t.trim() ? t.trim().split(/\s+/).length : 0,
    lines: t ? t.split('\n').length : 0,
    paragraphs: t.trim() ? t.split(/\n\s*\n/).filter(p => p.trim()).length : 0,
  }
}

watch(text, () => {
  if (timer) clearTimeout(timer)
  timer = window.setTimeout(calcStats, 200)
}, { immediate: true })

const charCount = computed(() => countMode.value === 'all' ? stats.value.chars : stats.value.charsNoSpace)
const charCountNoSpace = computed(() => stats.value.charsNoSpace)
const chineseCount = computed(() => stats.value.chinese)
const wordCount = computed(() => stats.value.words)
const lineCount = computed(() => stats.value.lines)
const paragraphCount = computed(() => stats.value.paragraphs)

const readingTime = computed(() => {
  const words = stats.value.words
  const chinese = stats.value.chinese
  const minutes = (words + chinese) / 400
  if (minutes < 1) return '< 1 分钟'
  return `${Math.ceil(minutes)} 分钟`
})

const speakingTime = computed(() => {
  const words = stats.value.words
  const chinese = stats.value.chinese
  const minutes = (words + chinese) / 200
  if (minutes < 1) return '< 1 分钟'
  return `${Math.ceil(minutes)} 分钟`
})

const wordFreq = computed(() => {
  const t = text.value.toLowerCase()
  const words = t.match(/[a-z0-9\u4e00-\u9fa5]+/g) || []
  const map = new Map<string, number>()
  words.forEach(w => {
    if (w.length > 1) {
      map.set(w, (map.get(w) || 0) + 1)
    }
  })
  return Array.from(map.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
})

const topWords = computed(() => wordFreq.value.slice(0, 20))
const maxFreq = computed(() => topWords.value.length ? topWords.value[0].count : 1)

function copyText() {
  navigator.clipboard.writeText(text.value)
  message.success('已复制')
}

function clearText() {
  text.value = ''
}

async function pasteText() {
  try {
    const t = await navigator.clipboard.readText()
    text.value = t
    message.success('已粘贴')
  } catch {
    message.error('无法读取剪贴板')
  }
}
</script>

<style scoped>
.word-counter { max-width: 800px; margin: 0 auto; }

.toolbar {
  display: flex;
  align-items: center;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.word-freq {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.freq-item {
  display: grid;
  grid-template-columns: 120px 1fr 40px;
  align-items: center;
  gap: 12px;
}

.freq-word {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.freq-bar-wrapper {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.freq-bar {
  height: 100%;
  background: #36ad6a;
  border-radius: 4px;
  transition: width 0.3s;
}

.freq-count {
  text-align: right;
  font-size: 13px;
  color: #666;
}

.dark .freq-bar-wrapper {
  background: #2a2a4a;
}

.dark .freq-count {
  color: #aaa;
}

@media (max-width: 480px) {
  .freq-item {
    grid-template-columns: 80px 1fr 36px;
  }
}
</style>
