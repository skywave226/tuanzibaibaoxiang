<template>
  <div class="doc-word-count">
    <n-alert type="info" class="mb-4">
      实时统计文档字数、行数、段落数等多项指标。可直接粘贴文本或上传 .txt / .md 文件，所有计算在浏览器本地完成。
    </n-alert>

    <div class="card mb-4">
      <div class="input-header">
        <div class="pane-label">文本内容</div>
        <n-upload
          accept=".txt,.md,text/plain,text/markdown"
          :show-file-list="false"
          :max="1"
          @change="handleUpload"
        >
          <n-button size="small">
            <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="12 18 12 12 9 15"/><line x1="15" y1="15" x2="12" y2="12"/></svg></span>
            导入文件
          </n-button>
        </n-upload>
      </div>
      <n-input
        v-model:value="text"
        type="textarea"
        placeholder="请输入或粘贴文本内容，或点击右上角导入 .txt / .md 文件..."
        rows="12"
        :autosize="false"
      />
      <div class="text-info mt-2">
        <span>字符数：{{ stats.totalChars }}</span>
        <span v-if="fileName">已导入：{{ fileName }}</span>
      </div>
    </div>

    <div class="card">
      <h3 class="text-sm font-bold mb-3">统计结果</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalChars }}</div>
          <div class="stat-label">总字符数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.charsNoSpace }}</div>
          <div class="stat-label">不含空格字符数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.wordCount }}</div>
          <div class="stat-label">英文单词数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.chineseCount }}</div>
          <div class="stat-label">汉字数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.lineCount }}</div>
          <div class="stat-label">行数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.paragraphCount }}</div>
          <div class="stat-label">段落数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.sentenceCount }}</div>
          <div class="stat-label">句号数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ readingTime }}</div>
          <div class="stat-label">预计阅读时间</div>
        </div>
      </div>

      <div class="summary mt-4" v-if="text.trim()">
        <n-alert type="success" :show-icon="false">
          本文档共 {{ stats.totalChars }} 字符，其中汉字 {{ stats.chineseCount }} 个，英文单词
          {{ stats.wordCount }} 个，约 {{ readingTime }} 阅读完。
        </n-alert>
      </div>
    </div>

    <n-alert :type="statusType" v-if="statusMsg" class="mt-4" closable @close="statusMsg = ''">
      {{ statusMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NButton, NUpload, NInput, NAlert } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

interface Stats {
  totalChars: number
  charsNoSpace: number
  wordCount: number
  chineseCount: number
  lineCount: number
  paragraphCount: number
  sentenceCount: number
}

const text = ref('')
const fileName = ref('')
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const stats = ref<Stats>({
  totalChars: 0,
  charsNoSpace: 0,
  wordCount: 0,
  chineseCount: 0,
  lineCount: 0,
  paragraphCount: 0,
  sentenceCount: 0,
})

let timer: number | null = null

// 计算统计结果
function calcStats() {
  const t = text.value
  stats.value = {
    // 总字符数（包含所有字符）
    totalChars: t.length,
    // 不含空格的字符数
    charsNoSpace: t.replace(/\s/g, '').length,
    // 英文单词数
    wordCount: (t.match(/[a-zA-Z]+/g) || []).length,
    // 汉字数
    chineseCount: (t.match(/[\u4e00-\u9fa5]/g) || []).length,
    // 行数
    lineCount: t ? t.split('\n').length : 0,
    // 段落数（以空行分隔）
    paragraphCount: t.trim() ? t.split(/\n\s*\n/).filter(p => p.trim()).length : 0,
    // 句号数（包含中英文句号）
    sentenceCount: (t.match(/[。.！!？?]/g) || []).length,
  }
}

// 防抖监听
watch(text, () => {
  if (timer) clearTimeout(timer)
  timer = window.setTimeout(calcStats, 300)
}, { immediate: true })

// 预计阅读时间
const readingTime = computed(() => {
  // 中文按每分钟 300 字，英文按每分钟 200 词
  const chineseMinutes = stats.value.chineseCount / 300
  const englishMinutes = stats.value.wordCount / 200
  const totalMinutes = chineseMinutes + englishMinutes
  if (totalMinutes < 1) {
    const seconds = Math.round(totalMinutes * 60)
    return seconds + ' 秒'
  }
  if (totalMinutes < 60) {
    return Math.round(totalMinutes) + ' 分钟'
  }
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)
  return hours + ' 小时 ' + minutes + ' 分钟'
})

// 处理文件上传
async function handleUpload(data: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; event?: Event }) {
  const rawFile = data.file?.file
  if (!rawFile) return
  try {
    const buffer = await rawFile.arrayBuffer()
    // 优先 UTF-8，失败则用 GBK
    let content = ''
    try {
      const decoder = new TextDecoder('utf-8')
      content = decoder.decode(buffer)
      const replacementCount = (content.match(/\uFFFD/g) || []).length
      if (replacementCount > content.length * 0.01) throw new Error('可能非 UTF-8')
    } catch {
      const decoder = new TextDecoder('gbk')
      content = decoder.decode(buffer)
    }
    text.value = content
    fileName.value = rawFile.name
    statusMsg.value = `已导入文件：${rawFile.name}`
    statusType.value = 'success'
  } catch (e: any) {
    statusMsg.value = '导入失败：' + (e.message || e)
    statusType.value = 'error'
  }
}
</script>

<style scoped>
.doc-word-count {
  max-width: 1000px;
  margin: 0 auto;
}

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
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

.dark .text-info {
  color: #aaa;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  background: #fafafa;
  transition: all 0.2s;
}

.stat-card:hover {
  border-color: #36ad6a;
  transform: translateY(-2px);
}

.dark .stat-card {
  border-color: #333;
  background: #1e1e2e;
}

.dark .stat-card:hover {
  border-color: #63e2b7;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #36ad6a;
  font-family: 'Fira Code', monospace;
  line-height: 1.2;
}

.dark .stat-value {
  color: #63e2b7;
}

.stat-label {
  font-size: 13px;
  color: #555;
  margin-top: 6px;
}

.dark .stat-label {
  color: #aaa;
}
</style>
