<template>
  <div class="word-counter">
    <n-input v-model:value="text" type="textarea" placeholder="请输入文本..." :rows="12" />
    <div class="stats">
      <n-statistic label="字符数" :value="charCount" />
      <n-statistic label="字符数（不含空格）" :value="charCountNoSpace" />
      <n-statistic label="单词数" :value="wordCount" />
      <n-statistic label="行数" :value="lineCount" />
      <n-statistic label="段落数" :value="paragraphCount" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { NInput, NStatistic } from 'naive-ui'
const text = ref('')
const stats = ref({ chars: 0, charsNoSpace: 0, words: 0, lines: 0, paragraphs: 0 })
let timer: number | null = null
function calcStats() {
  const t = text.value
  stats.value = {
    chars: t.length,
    charsNoSpace: t.replace(/\s/g, '').length,
    words: t.trim() ? t.trim().split(/\s+/).length : 0,
    lines: t ? t.split('\n').length : 0,
    paragraphs: t.trim() ? t.split(/\n\s*\n/).filter(p => p.trim()).length : 0,
  }
}
watch(text, () => {
  if (timer) clearTimeout(timer)
  timer = window.setTimeout(calcStats, 300)
}, { immediate: true })
const charCount = ref(0)
const charCountNoSpace = ref(0)
const wordCount = ref(0)
const lineCount = ref(0)
const paragraphCount = ref(0)
watch(stats, (s) => {
  charCount.value = s.chars
  charCountNoSpace.value = s.charsNoSpace
  wordCount.value = s.words
  lineCount.value = s.lines
  paragraphCount.value = s.paragraphs
})
</script>
<style scoped>
.word-counter { max-width: 800px; margin: 0 auto; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-top: 20px; }
</style>
