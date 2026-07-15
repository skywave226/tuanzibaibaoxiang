<template>
  <div class="ua-parser">
    <div class="card mb-4">
      <div class="pane-label mb-2">User-Agent 字符串</div>
      <n-input
        v-model:value="ua"
        type="textarea"
        :rows="3"
        :autosize="false"
        placeholder="粘贴 User-Agent 字符串"
      />
      <div class="toolbar mt-3">
        <n-space>
          <n-button type="primary" @click="parse">解析</n-button>
          <n-button @click="useCurrent">使用当前浏览器</n-button>
          <n-button @click="loadExample">示例</n-button>
          <n-button @click="clear">清空</n-button>
        </n-space>
      </div>
    </div>

    <div v-if="result" class="results">
      <div class="card mb-4">
        <h3 class="text-sm font-bold mb-3">解析结果</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">浏览器</div>
            <div class="info-value">
              <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg></span>
              {{ result.browser.name }} {{ result.browser.version }}
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">引擎</div>
            <div class="info-value">
              <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
              {{ result.engine.name }} {{ result.engine.version }}
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">操作系统</div>
            <div class="info-value">
              <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></span>
              {{ result.os.name }} {{ result.os.version }}
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">设备类型</div>
            <div class="info-value">
              <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></span>
              {{ result.device.type || '桌面端' }}
              <span v-if="result.device.vendor"> · {{ result.device.vendor }}</span>
              <span v-if="result.device.model"> · {{ result.device.model }}</span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">CPU 架构</div>
            <div class="info-value">{{ result.cpu.architecture || '未知' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">是否爬虫</div>
            <div class="info-value">
              <n-tag :type="result.isBot ? 'warning' : 'success'" size="small" :bordered="false">
                {{ result.isBot ? '是' : '否' }}
              </n-tag>
              <span v-if="result.isBot" class="ml-2 text-sm text-gray-500">{{ result.botName }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-sm font-bold mb-3">详细分解</h3>
        <n-data-table
          :columns="columns"
          :data="details"
          :bordered="false"
          :single-line="false"
          size="small"
        />
      </div>
    </div>

    <div class="card mt-4" v-else>
      <n-empty description="粘贴 User-Agent 字符串后点击解析" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace, NInput, NEmpty, NTag, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface ParseResult {
  browser: { name: string; version: string }
  engine: { name: string; version: string }
  os: { name: string; version: string }
  device: { type: string; vendor: string; model: string }
  cpu: { architecture: string }
  isBot: boolean
  botName: string
}

interface DetailRow {
  category: string
  field: string
  value: string
}

const ua = ref('')
const result = ref<ParseResult | null>(null)

const columns: DataTableColumns<DetailRow> = [
  { title: '分类', key: 'category', width: 120 },
  { title: '字段', key: 'field', width: 150 },
  { title: '值', key: 'value' },
]

const details = ref<DetailRow[]>([])

const examples = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
]

// 浏览器识别规则
const browserRules: Array<{ name: string; regex: RegExp; version: (m: RegExpMatchArray) => string }> = [
  { name: 'Edge', regex: /Edge?\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Opera', regex: /OPR\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Chrome', regex: /Chrome\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Firefox', regex: /Firefox\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Safari', regex: /Version\/([\d.]+).*Safari/, version: (m) => m[1] },
  { name: 'IE', regex: /(?:MSIE |Trident\/.*rv:)([\d.]+)/, version: (m) => m[1] },
]

// 引擎识别规则
const engineRules: Array<{ name: string; regex: RegExp; version: (m: RegExpMatchArray) => string }> = [
  { name: 'Blink', regex: /Chrome\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Gecko', regex: /rv:([\d.]+).*Gecko/, version: (m) => m[1] },
  { name: 'WebKit', regex: /AppleWebKit\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Trident', regex: /Trident\/([\d.]+)/, version: (m) => m[1] },
]

// 操作系统识别规则
const osRules: Array<{ name: string; regex: RegExp; version: (m: RegExpMatchArray) => string }> = [
  { name: 'Windows', regex: /Windows NT ([\d.]+)/, version: (m) => mapWindowsVersion(m[1]) },
  { name: 'macOS', regex: /Mac OS X ([\d_]+)/, version: (m) => m[1].replace(/_/g, '.') },
  { name: 'iOS', regex: /(?:iPhone|iPad|iPod).*OS ([\d_]+)/, version: (m) => m[1].replace(/_/g, '.') },
  { name: 'Android', regex: /Android ([\d.]+)/, version: (m) => m[1] },
  { name: 'Linux', regex: /Linux/, version: () => '' },
  { name: 'Chrome OS', regex: /CrOS/, version: () => '' },
]

// 设备识别规则
const deviceRules: Array<{ type: string; regex: RegExp; vendor?: string; model?: (m: RegExpMatchArray) => string }> = [
  { type: 'iPhone', regex: /iPhone/, vendor: 'Apple' },
  { type: 'iPad', regex: /iPad/, vendor: 'Apple' },
  { type: 'iPod', regex: /iPod/, vendor: 'Apple' },
  { type: 'Android 手机', regex: /Android.*Mobile/, vendor: '' },
  { type: 'Android 平板', regex: /Android(?!.*Mobile)/, vendor: '' },
  { type: 'Windows Phone', regex: /Windows Phone/, vendor: 'Microsoft' },
]

// 爬虫识别
const botRules: Array<{ name: string; regex: RegExp }> = [
  { name: 'Googlebot', regex: /Googlebot/i },
  { name: 'Bingbot', regex: /bingbot/i },
  { name: 'Baiduspider', regex: /Baiduspider/i },
  { name: 'YandexBot', regex: /YandexBot/i },
  { name: 'Twitterbot', regex: /Twitterbot/i },
  { name: 'Facebookbot', regex: /facebookexternalhit/i },
  { name: 'LinkedInBot', regex: /LinkedInBot/i },
  { name: 'Slackbot', regex: /Slackbot/i },
  { name: 'Applebot', regex: /Applebot/i },
  { name: 'AhrefsBot', regex: /AhrefsBot/i },
  { name: 'SemrushBot', regex: /SemrushBot/i },
  { name: '通用爬虫', regex: /(bot|crawler|spider|scraper)/i },
]

function mapWindowsVersion(version: string): string {
  const map: Record<string, string> = {
    '10.0': '10/11',
    '6.3': '8.1',
    '6.2': '8',
    '6.1': '7',
    '6.0': 'Vista',
    '5.1': 'XP',
  }
  return map[version] || version
}

function parse() {
  if (!ua.value.trim()) return

  const str = ua.value.trim()
  const parsed: ParseResult = {
    browser: { name: '未知', version: '' },
    engine: { name: '未知', version: '' },
    os: { name: '未知', version: '' },
    device: { type: '', vendor: '', model: '' },
    cpu: { architecture: '' },
    isBot: false,
    botName: '',
  }

  // 解析浏览器
  for (const rule of browserRules) {
    const match = str.match(rule.regex)
    if (match) {
      parsed.browser = { name: rule.name, version: rule.version(match) }
      break
    }
  }

  // 解析引擎
  for (const rule of engineRules) {
    const match = str.match(rule.regex)
    if (match) {
      parsed.engine = { name: rule.name, version: rule.version(match) }
      break
    }
  }

  // 解析操作系统
  for (const rule of osRules) {
    const match = str.match(rule.regex)
    if (match) {
      parsed.os = { name: rule.name, version: rule.version(match) }
      break
    }
  }

  // 解析设备
  for (const rule of deviceRules) {
    if (rule.regex.test(str)) {
      parsed.device = {
        type: rule.type,
        vendor: rule.vendor || '',
        model: '',
      }
      break
    }
  }

  // 解析 CPU 架构
  if (/x64|Win64|x86_64/.test(str)) {
    parsed.cpu.architecture = 'amd64 (64位)'
  } else if (/arm|aarch64/i.test(str)) {
    parsed.cpu.architecture = 'ARM'
  } else if (/WOW64|x86/.test(str)) {
    parsed.cpu.architecture = 'x86 (32位)'
  }

  // 识别爬虫
  for (const rule of botRules) {
    if (rule.regex.test(str)) {
      parsed.isBot = true
      parsed.botName = rule.name
      break
    }
  }

  result.value = parsed

  // 构建详细分解
  details.value = [
    { category: '浏览器', field: '名称', value: parsed.browser.name },
    { category: '浏览器', field: '版本', value: parsed.browser.version },
    { category: '渲染引擎', field: '名称', value: parsed.engine.name },
    { category: '渲染引擎', field: '版本', value: parsed.engine.version },
    { category: '操作系统', field: '名称', value: parsed.os.name },
    { category: '操作系统', field: '版本', value: parsed.os.version },
    { category: '设备', field: '类型', value: parsed.device.type || '桌面端' },
    { category: '设备', field: '厂商', value: parsed.device.vendor || '未知' },
    { category: 'CPU', field: '架构', value: parsed.cpu.architecture || '未知' },
    { category: '爬虫', field: '是否爬虫', value: parsed.isBot ? '是' : '否' },
    { category: '爬虫', field: '名称', value: parsed.botName || '无' },
  ]
}

function useCurrent() {
  ua.value = navigator.userAgent
  parse()
}

function loadExample() {
  ua.value = examples[Math.floor(Math.random() * examples.length)]
  parse()
}

function clear() {
  ua.value = ''
  result.value = null
  details.value = []
}
</script>

<style scoped>
.ua-parser {
  max-width: 900px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.toolbar {
  display: flex;
  gap: 12px;
}
</style>
