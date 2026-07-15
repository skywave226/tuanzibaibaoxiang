<template>
  <div class="token-counter">
    <!-- 文本输入区 -->
    <div class="card mb-4">
      <div class="flex items-center justify-between mb-2">
        <div class="pane-label">文本输入</div>
        <n-button size="small" @click="addCompareItem" :disabled="compareItems.length >= 4">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
          添加对比文本
        </n-button>
      </div>
      <n-input
        v-model:value="mainText"
        type="textarea"
        placeholder="输入或粘贴文本以估算 Token 数量..."
        :rows="10"
      />
      <div class="quick-stats mt-2" v-if="mainText">
        <span>字符数：{{ mainCharCount }}</span>
        <span>单词数：{{ mainWordCount }}</span>
        <span>中文数：{{ mainChineseCount }}</span>
        <span>估算 Token：{{ mainTokenCount }}</span>
      </div>
    </div>

    <!-- 模型选择与成本计算 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">成本估算</div>
      <div class="config-section">
        <div class="config-item">
          <label>选择模型</label>
          <n-select
            v-model:value="selectedModel"
            :options="modelOptions"
            style="width: 240px"
          />
        </div>
        <div class="config-item">
          <label>输出 Token 数</label>
          <n-input-number v-model:value="outputTokens" :min="0" :step="100" style="width: 160px" />
        </div>
      </div>

      <div class="cost-result mt-3" v-if="selectedModel">
        <div class="cost-item">
          <span class="cost-label">输入成本</span>
          <span class="cost-value">${{ inputCost.toFixed(6) }}</span>
          <span class="cost-detail">{{ mainTokenCount }} tokens × ${{ currentModel.inputPrice }}/1K</span>
        </div>
        <div class="cost-item">
          <span class="cost-label">输出成本</span>
          <span class="cost-value">${{ outputCost.toFixed(6) }}</span>
          <span class="cost-detail">{{ outputTokens }} tokens × ${{ currentModel.outputPrice }}/1K</span>
        </div>
        <div class="cost-item total">
          <span class="cost-label">总成本</span>
          <span class="cost-value">${{ totalCost.toFixed(6) }}</span>
        </div>
      </div>
    </div>

    <!-- 详细统计 -->
    <div class="card mb-4" v-if="mainText">
      <div class="pane-label mb-3">详细统计</div>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-value">{{ mainTokenCount.toLocaleString() }}</div>
          <div class="stat-label">估算 Token</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ mainCharCount.toLocaleString() }}</div>
          <div class="stat-label">字符总数</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ mainCharCountNoSpace.toLocaleString() }}</div>
          <div class="stat-label">字符（不含空格）</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ mainWordCount.toLocaleString() }}</div>
          <div class="stat-label">单词数</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ mainChineseCount.toLocaleString() }}</div>
          <div class="stat-label">中文字符</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ mainLineCount.toLocaleString() }}</div>
          <div class="stat-label">行数</div>
        </div>
      </div>
    </div>

    <!-- 多文本对比 -->
    <div class="card" v-if="compareItems.length > 0">
      <div class="flex items-center justify-between mb-3">
        <div class="pane-label">多文本对比</div>
        <n-button size="small" @click="clearCompare">清空对比</n-button>
      </div>
      <div class="compare-list">
        <div v-for="(item, index) in compareItems" :key="index" class="compare-item">
          <div class="compare-header">
            <span class="compare-label">文本 {{ index + 2 }}</span>
            <n-button text size="small" type="error" @click="removeCompareItem(index)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </n-button>
          </div>
          <n-input
            v-model:value="item.text"
            type="textarea"
            placeholder="输入对比文本..."
            :rows="4"
          />
          <div class="compare-stats">
            <span>Token：{{ estimateTokens(item.text) }}</span>
            <span>字符：{{ item.text.length }}</span>
            <span>成本：${{ calcCost(estimateTokens(item.text)).toFixed(6) }}</span>
          </div>
        </div>
      </div>

      <!-- 对比图表 -->
      <div class="compare-chart mt-3">
        <div class="compare-bar-row">
          <div class="compare-bar-label">主文本</div>
          <div class="compare-bar-track">
            <div class="compare-bar main" :style="{ width: barWidth(mainTokenCount) + '%' }"></div>
          </div>
          <div class="compare-bar-value">{{ mainTokenCount }}</div>
        </div>
        <div v-for="(item, index) in compareItems" :key="index" class="compare-bar-row">
          <div class="compare-bar-label">文本 {{ index + 2 }}</div>
          <div class="compare-bar-track">
            <div class="compare-bar" :style="{ width: barWidth(estimateTokens(item.text)) + '%' }"></div>
          </div>
          <div class="compare-bar-value">{{ estimateTokens(item.text) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NSelect, NInputNumber } from 'naive-ui'

// 模型定义
interface ModelInfo {
  label: string
  inputPrice: number
  outputPrice: number
}

const modelOptions = [
  { label: 'GPT-3.5 Turbo', value: 'gpt35' },
  { label: 'GPT-4', value: 'gpt4' },
  { label: 'GPT-4 Turbo', value: 'gpt4turbo' },
  { label: 'GPT-4o', value: 'gpt4o' },
  { label: 'Claude 3 Opus', value: 'claude3opus' },
  { label: 'Claude 3.5 Sonnet', value: 'claude35sonnet' },
  { label: 'Claude 3 Haiku', value: 'claude3haiku' },
]

// 各模型价格（美元 / 1K tokens）
const modelMap: Record<string, ModelInfo> = {
  gpt35: { label: 'GPT-3.5 Turbo', inputPrice: 0.0015, outputPrice: 0.002 },
  gpt4: { label: 'GPT-4', inputPrice: 0.03, outputPrice: 0.06 },
  gpt4turbo: { label: 'GPT-4 Turbo', inputPrice: 0.01, outputPrice: 0.03 },
  gpt4o: { label: 'GPT-4o', inputPrice: 0.005, outputPrice: 0.015 },
  claude3opus: { label: 'Claude 3 Opus', inputPrice: 0.015, outputPrice: 0.075 },
  claude35sonnet: { label: 'Claude 3.5 Sonnet', inputPrice: 0.003, outputPrice: 0.015 },
  claude3haiku: { label: 'Claude 3 Haiku', inputPrice: 0.00025, outputPrice: 0.00125 },
}

const mainText = ref('')
const selectedModel = ref('gpt35')
const outputTokens = ref(500)

// 对比文本列表
const compareItems = ref<{ text: string }[]>([])

// 当前选中模型信息
const currentModel = computed(() => modelMap[selectedModel.value])

// 统计中文字符数
function countChinese(text: string): number {
  const matches = text.match(/[\u4e00-\u9fa5]/g)
  return matches ? matches.length : 0
}

// 估算 Token 数：英文按 4 字符/token，中文按 1.5 字符/token
function estimateTokens(text: string): number {
  if (!text) return 0
  const chineseCount = countChinese(text)
  const nonChinese = text.replace(/[\u4e00-\u9fa5]/g, '')
  // 中文部分：1.5 字符 / token
  const chineseTokens = chineseCount / 1.5
  // 非中文部分：4 字符 / token
  const englishTokens = nonChinese.length / 4
  return Math.ceil(chineseTokens + englishTokens)
}

// 计算成本
function calcCost(tokens: number): number {
  return (tokens / 1000) * currentModel.value.inputPrice
}

// 主文本统计
const mainTokenCount = computed(() => estimateTokens(mainText.value))
const mainCharCount = computed(() => mainText.value.length)
const mainCharCountNoSpace = computed(() => mainText.value.replace(/\s/g, '').length)
const mainWordCount = computed(() => {
  const t = mainText.value.trim()
  if (!t) return 0
  // 英文单词 + 中文字符
  const enWords = (t.match(/[a-zA-Z]+/g) || []).length
  const zhChars = countChinese(t)
  return enWords + zhChars
})
const mainChineseCount = computed(() => countChinese(mainText.value))
const mainLineCount = computed(() => mainText.value ? mainText.value.split('\n').length : 0)

// 成本计算
const inputCost = computed(() => (mainTokenCount.value / 1000) * currentModel.value.inputPrice)
const outputCost = computed(() => (outputTokens.value / 1000) * currentModel.value.outputPrice)
const totalCost = computed(() => inputCost.value + outputCost.value)

// 对比条最大宽度计算
function barWidth(tokens: number): number {
  const maxTokens = Math.max(mainTokenCount.value, ...compareItems.value.map(i => estimateTokens(i.text)), 1)
  return (tokens / maxTokens) * 100
}

// 添加对比文本
function addCompareItem() {
  if (compareItems.value.length < 4) {
    compareItems.value.push({ text: '' })
  }
}

// 移除对比文本
function removeCompareItem(index: number) {
  compareItems.value.splice(index, 1)
}

// 清空对比
function clearCompare() {
  compareItems.value = []
}
</script>

<style scoped>
.token-counter {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.quick-stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
}

.dark .quick-stats {
  color: #aaa;
}

.config-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label {
  color: #aaa;
}

/* 成本结果 */
.cost-result {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.dark .cost-result {
  background: #1e1e2e;
}

.cost-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cost-item.total {
  border-left: 2px solid #36ad6a;
  padding-left: 16px;
}

.cost-label {
  font-size: 12px;
  color: #888;
}

.cost-value {
  font-size: 18px;
  font-weight: 700;
  color: #36ad6a;
  font-family: 'Fira Code', monospace;
}

.dark .cost-value {
  color: #63e2b7;
}

.cost-detail {
  font-size: 11px;
  color: #aaa;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
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
  color: #36ad6a;
  font-family: 'Fira Code', monospace;
}

.dark .stat-value {
  color: #63e2b7;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

/* 对比列表 */
.compare-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compare-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
}

.dark .compare-item {
  border-color: #2a2a3a;
}

.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.compare-label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.dark .compare-label {
  color: #bbb;
}

.compare-stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #888;
}

/* 对比图表 */
.compare-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compare-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compare-bar-label {
  width: 60px;
  font-size: 13px;
  color: #555;
  text-align: right;
}

.dark .compare-bar-label {
  color: #bbb;
}

.compare-bar-track {
  flex: 1;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.dark .compare-bar-track {
  background: #2a2a3a;
}

.compare-bar {
  height: 100%;
  background: linear-gradient(90deg, #36ad6a, #63e2b7);
  transition: width 0.3s ease;
}

.compare-bar.main {
  background: linear-gradient(90deg, #2080f0, #7090f0);
}

.compare-bar-value {
  width: 60px;
  font-size: 13px;
  font-family: 'Fira Code', monospace;
  color: #555;
  text-align: right;
}

.dark .compare-bar-value {
  color: #bbb;
}
</style>
