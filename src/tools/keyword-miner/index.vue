<template>
  <div class="keyword-miner">
    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="generator" tab="长尾词生成">
        <div class="card mb-4">
          <div class="pane-label mb-2">种子关键词</div>
          <n-input v-model:value="seed" placeholder="例如：PDF 转换" />

          <div class="pane-label mt-4 mb-2">修饰词（每行一个）</div>
          <n-input v-model:value="modifiers" type="textarea" :rows="8" placeholder="在线&#10;免费&#10;批量&#10;不限次数&#10;网页版&#10;无需安装" />

          <div class="options mt-4">
            <n-checkbox v-model:checked="includeQuestions">包含疑问词（是什么、怎么用、推荐）</n-checkbox>
            <n-checkbox v-model:checked="includeLocations">包含地域/场景词</n-checkbox>
          </div>

          <n-button type="primary" class="mt-4" @click="generateKeywords" :disabled="!seed.trim()">生成关键词</n-button>
        </div>

        <div class="card" v-if="generated.length">
          <div class="result-header mb-3 flex justify-between items-center flex-wrap gap-2">
            <h3 class="text-sm font-bold">生成结果（{{ generated.length }} 个）</h3>
            <n-space>
              <n-button size="small" @click="copyAll">全部复制</n-button>
              <n-button size="small" @click="downloadTxt">下载 TXT</n-button>
            </n-space>
          </div>
          <div class="keyword-tags">
            <n-tag v-for="(kw, index) in generated" :key="index" closable @close="generated.splice(index, 1)">
              {{ kw }}
            </n-tag>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="density" tab="关键词密度">
        <div class="card mb-4">
          <div class="pane-label mb-2">粘贴文章内容</div>
          <n-input v-model:value="article" type="textarea" :rows="14" placeholder="粘贴需要分析的文章..." />
          <n-button type="primary" class="mt-4" @click="analyzeDensity" :disabled="!article.trim()">分析</n-button>
        </div>

        <div class="card" v-if="densityResult.length">
          <h3 class="text-sm font-bold mb-3">关键词密度排行</h3>
          <n-data-table
            :columns="densityColumns"
            :data="densityResult"
            :bordered="false"
            :single-line="false"
            size="small"
            :pagination="{ pageSize: 15 }"
          />
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NTabs, NTabPane, NInput, NButton, NCheckbox, NTag, NSpace, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const activeTab = ref('generator')
const seed = ref('')
const modifiers = ref('在线\n免费\n批量\n不限次数\n网页版\n无需安装')
const includeQuestions = ref(true)
const includeLocations = ref(false)
const generated = ref<string[]>([])

const article = ref('')
const densityResult = ref<{ word: string; count: number; density: string }[]>([])

const densityColumns: DataTableColumns<{ word: string; count: number; density: string }> = [
  { title: '关键词', key: 'word' },
  { title: '出现次数', key: 'count', width: 100 },
  { title: '密度', key: 'density', width: 100 },
]

const questionWords = ['是什么', '怎么用', '如何使用', '推荐', '哪个好', '教程', '方法', '步骤', '工具', '软件', '免费版']
const locationWords = ['北京', '上海', '深圳', '广州', '杭州', '国内', '国外', '2025', '2026']

function generateKeywords() {
  const base = seed.value.trim()
  const mods = modifiers.value.split('\n').map(s => s.trim()).filter(Boolean)
  const result: string[] = []

  result.push(base)

  mods.forEach(mod => {
    result.push(`${mod}${base}`)
    result.push(`${base}${mod}`)
    result.push(`${mod}的${base}`)
  })

  if (includeQuestions.value) {
    questionWords.forEach(q => {
      result.push(`${base}${q}`)
      result.push(`${q}${base}`)
    })
  }

  if (includeLocations.value) {
    locationWords.forEach(loc => {
      result.push(`${loc}${base}`)
      result.push(`${base}${loc}`)
    })
  }

  generated.value = Array.from(new Set(result))
}

function copyAll() {
  navigator.clipboard.writeText(generated.value.join('\n'))
}

function downloadTxt() {
  const blob = new Blob(['\uFEFF' + generated.value.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'keywords.txt'
  a.click()
  URL.revokeObjectURL(url)
}

function analyzeDensity() {
  const text = article.value
  const totalChars = text.replace(/\s/g, '').length
  if (totalChars === 0) return

  // 提取 2-6 字词组
  const counts: Record<string, number> = {}
  const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
  const words = cleaned.split(/\s+/).filter(Boolean)

  // 单个词
  words.forEach(w => {
    if (w.length >= 2 && w.length <= 6) {
      counts[w] = (counts[w] || 0) + 1
    }
  })

  // 中文相邻组合
  const chineseChars = text.replace(/[^\u4e00-\u9fa5]/g, '')
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= chineseChars.length - len; i++) {
      const phrase = chineseChars.slice(i, i + len)
      counts[phrase] = (counts[phrase] || 0) + 1
    }
  }

  densityResult.value = Object.entries(counts)
    .map(([word, count]) => ({
      word,
      count,
      density: ((count * word.length) / totalChars * 100).toFixed(2) + '%',
    }))
    .filter(item => item.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 100)
}
</script>

<style scoped>
.keyword-miner { max-width: 900px; margin: 0 auto; }

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
