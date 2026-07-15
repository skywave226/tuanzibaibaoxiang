<template>
  <div class="translation-compare">
    <!-- 源文本输入 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">输入源文本</div>
      <n-input
        v-model:value="text"
        type="textarea"
        placeholder="输入需要翻译的文本，将生成各翻译引擎的对比链接..."
        :rows="6"
      />
      <div class="text-meta mt-2">
        <span>字符数：{{ text.length }}</span>
      </div>
    </div>

    <!-- 语言选择 -->
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">语言设置</h3>
      <div class="lang-row">
        <div class="lang-item">
          <label>源语言</label>
          <n-select v-model:value="sourceLang" :options="(sourceLangOptions as any)" />
        </div>
        <div class="lang-swap">
          <n-button circle quaternary @click="swapLang" title="交换语言">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </n-button>
        </div>
        <div class="lang-item">
          <label>目标语言</label>
          <n-select v-model:value="targetLang" :options="(targetLangOptions as any)" />
        </div>
      </div>

      <div class="toolbar mt-3">
        <n-button type="primary" @click="generate" :disabled="!text.trim()">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 3 3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 20l-3-8-3 8"/><path d="M17 18h6"/></svg></span>
          生成链接
        </n-button>
        <n-button @click="openAll" :disabled="links.length === 0">
          全部打开
        </n-button>
        <n-button @click="savePair" :disabled="!text.trim()" quaternary>
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></span>
          保存语言对
        </n-button>
      </div>
    </div>

    <!-- 翻译引擎链接 -->
    <div v-if="links.length > 0">
      <div class="card">
        <h3 class="text-sm font-bold mb-3">翻译引擎链接</h3>
        <div class="engine-list">
          <div v-for="link in links" :key="link.name" class="engine-card">
            <div class="engine-head">
              <div class="engine-info">
                <span class="engine-icon" :style="{ background: link.color }">
                  {{ link.name[0] }}
                </span>
                <div>
                  <div class="engine-name">{{ link.name }}</div>
                  <div class="engine-desc">{{ link.desc }}</div>
                </div>
              </div>
              <n-tag size="small" :type="link.supported ? 'success' : 'default'">
                {{ link.supported ? '已生成' : '不支持' }}
              </n-tag>
            </div>
            <div class="engine-url" v-if="link.supported">
              <input :value="link.url" readonly class="url-input" />
            </div>
            <div class="engine-actions" v-if="link.supported">
              <n-button size="small" type="primary" @click="openLink(link.url)">
                <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>
                打开
              </n-button>
              <n-button size="small" @click="copyUrl(link.url)">
                <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
                复制
              </n-button>
            </div>
            <div class="engine-unsupported" v-else>
              当前语言组合不被支持
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 已保存的语言对 -->
    <div class="card mt-4" v-if="savedPairs.length > 0">
      <div class="saved-header">
        <h3 class="text-sm font-bold">常用语言对</h3>
        <n-button size="small" quaternary type="error" @click="clearSaved">
          清空全部
        </n-button>
      </div>
      <div class="saved-list mt-3">
        <div v-for="(pair, index) in savedPairs" :key="index" class="saved-item">
          <span class="pair-text">
            {{ langName(pair.source) }} → {{ langName(pair.target) }}
          </span>
          <span class="pair-time">{{ pair.time }}</span>
          <n-button size="tiny" quaternary @click="usePair(pair)">使用</n-button>
          <n-button size="tiny" quaternary type="error" @click="removePair(index)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NInput, NSelect, NTag, useMessage } from 'naive-ui'

const message = useMessage()

// 语言定义
interface LangOption {
  label: string
  value: string
}

// 支持的语言（自动检测 + 常用语言）
const langList: LangOption[] = [
  { label: '自动检测', value: 'auto' },
  { label: '中文', value: 'zh' },
  { label: '英文', value: 'en' },
  { label: '日文', value: 'ja' },
  { label: '韩文', value: 'ko' },
  { label: '法文', value: 'fr' },
  { label: '德文', value: 'de' },
  { label: '西班牙文', value: 'es' },
  { label: '俄文', value: 'ru' },
  { label: '意大利文', value: 'it' },
  { label: '葡萄牙文', value: 'pt' },
  { label: '阿拉伯文', value: 'ar' },
  { label: '越南文', value: 'vi' },
  { label: '泰文', value: 'th' },
]

// 源语言选项（包含自动检测）
const sourceLangOptions = langList

// 目标语言选项（不包含自动检测）
const targetLangOptions = langList.filter(l => l.value !== 'auto')

const text = ref('')
const sourceLang = ref('auto')
const targetLang = ref('en')

// 翻译引擎链接
interface EngineLink {
  name: string
  desc: string
  color: string
  url: string
  supported: boolean
}

// 已保存的语言对
interface SavedPair {
  source: string
  target: string
  text: string
  time: string
}

const savedPairs = ref<SavedPair[]>([])
const STORAGE_KEY = 'translation-compare-pairs'

// 语言名称查找
function langName(code: string): string {
  const lang = langList.find(l => l.value === code)
  return lang ? lang.label : code
}

// 各引擎的语言代码映射
// DeepL 不支持 auto，使用源语言；部分引擎语言代码不同
function deeplLang(code: string): string {
  const map: Record<string, string> = {
    auto: '', // DeepL 留空则自动检测
    zh: 'ZH',
    en: 'EN',
    ja: 'JA',
    ko: 'KO',
    fr: 'FR',
    de: 'DE',
    es: 'ES',
    ru: 'RU',
    it: 'IT',
    pt: 'PT',
    ar: 'AR',
  }
  return map[code] || code.toUpperCase()
}

// 判断引擎是否支持当前语言组合
function isSupported(engine: string, target: string): boolean {
  if (engine === 'deepl') {
    // DeepL 不支持某些语言
    const unsupported = ['vi', 'th']
    if (unsupported.includes(target)) return false
    // DeepL 源语言不能是 auto 的同时目标也是 auto（目标本身不会是 auto）
    return true
  }
  return true
}

const links = ref<EngineLink[]>([])

// 生成各引擎链接
function generate() {
  if (!text.value.trim()) return
  const raw = text.value
  const encoded = encodeURIComponent(raw)
  const sl = sourceLang.value
  const tl = targetLang.value

  const engines: EngineLink[] = [
    {
      name: 'Google',
      desc: 'Google 翻译',
      color: '#4285f4',
      url: `https://translate.google.com/?sl=${sl}&tl=${tl}&text=${encoded}&op=translate`,
      supported: isSupported('google', tl),
    },
    {
      name: 'DeepL',
      desc: 'DeepL 翻译',
      color: '#0f2b46',
      url: `https://www.deepl.com/translator#${deeplLang(sl)}/${deeplLang(tl)}/${encoded}`,
      supported: isSupported('deepl', tl),
    },
    {
      name: 'Bing',
      desc: '微软必应翻译',
      color: '#0078d4',
      url: `https://www.bing.com/translator/?from=${sl}&to=${tl}&text=${encoded}`,
      supported: isSupported('bing', tl),
    },
    {
      name: 'Yandex',
      desc: 'Yandex 翻译',
      color: '#fc3f1d',
      url: `https://translate.yandex.com/?source_lang=${sl}&target_lang=${tl}&text=${encoded}`,
      supported: isSupported('yandex', tl),
    },
    {
      name: 'Baidu',
      desc: '百度翻译',
      color: '#2932e1',
      url: `https://fanyi.baidu.com/#${sl}/${tl}/${encoded}`,
      supported: isSupported('baidu', tl),
    },
    {
      name: 'Youdao',
      desc: '有道翻译',
      color: '#e8312f',
      // 有道不支持显式语言代码，直接传文本
      url: `https://fanyi.youdao.com/?keyfrom=dict.fanyi&text=${encoded}`,
      supported: isSupported('youdao', tl),
    },
  ]

  links.value = engines
}

// 交换源语言与目标语言
function swapLang() {
  if (sourceLang.value === 'auto') {
    // 源语言为自动时，无法交换，提示
    message.warning('源语言为"自动检测"时无法交换，请先选择具体源语言')
    return
  }
  const tmp = sourceLang.value
  sourceLang.value = targetLang.value
  targetLang.value = tmp
  if (links.value.length > 0) generate()
}

// 打开链接
function openLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// 全部打开
function openAll() {
  const supported = links.value.filter(l => l.supported)
  supported.forEach((link, i) => {
    // 略微错开避免浏览器拦截
    setTimeout(() => window.open(link.url, '_blank', 'noopener,noreferrer'), i * 200)
  })
}

// 复制链接
async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    message.success('链接已复制')
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = url
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      message.success('链接已复制')
    } catch {
      message.error('复制失败，请手动复制')
    }
    document.body.removeChild(textarea)
  }
}

// 格式化时间
function formatTime(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 保存当前语言对
function savePair() {
  const pair: SavedPair = {
    source: sourceLang.value,
    target: targetLang.value,
    text: text.value,
    time: formatTime(),
  }
  savedPairs.value.unshift(pair)
  // 最多保存 10 条
  if (savedPairs.value.length > 10) savedPairs.value.pop()
  persist()
  message.success('语言对已保存')
}

// 使用已保存的语言对
function usePair(pair: SavedPair) {
  sourceLang.value = pair.source
  targetLang.value = pair.target
  text.value = pair.text
  generate()
}

// 移除已保存的语言对
function removePair(index: number) {
  savedPairs.value.splice(index, 1)
  persist()
}

// 清空全部
function clearSaved() {
  savedPairs.value = []
  persist()
  message.success('已清空')
}

// 持久化到 localStorage
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPairs.value))
  } catch {
    // 忽略存储错误
  }
}

// 从 localStorage 加载
function loadSaved() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) savedPairs.value = JSON.parse(data)
  } catch {
    savedPairs.value = []
  }
}

loadSaved()
</script>

<style scoped>
.translation-compare {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.text-meta {
  font-size: 12px;
  color: #888;
}

.lang-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.lang-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lang-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .lang-item label {
  color: #aaa;
}

.lang-swap {
  padding-bottom: 4px;
}

.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.engine-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.engine-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dark .engine-card {
  border-color: #333;
}

.engine-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.engine-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.engine-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.engine-name {
  font-weight: 600;
  font-size: 14px;
}

.engine-desc {
  font-size: 12px;
  color: #888;
}

.engine-url {
  width: 100%;
}

.url-input {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 12px;
  font-family: 'Fira Code', monospace;
  color: #555;
  background: #fafafa;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  outline: none;
}

.dark .url-input {
  border-color: #333;
  background: #1e1e1e;
  color: #aaa;
}

.engine-actions {
  display: flex;
  gap: 8px;
}

.engine-unsupported {
  font-size: 12px;
  color: #999;
  padding: 8px 0;
}

.saved-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.saved-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.saved-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.dark .saved-item {
  border-color: #333;
}

.pair-text {
  flex: 1;
  font-weight: 500;
  font-size: 13px;
}

.pair-time {
  font-size: 12px;
  color: #888;
  font-family: 'Fira Code', monospace;
}
</style>
