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
        <h3 class="text-sm font-bold mb-3">UA 解析结果</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">浏览器</div>
            <div class="info-value">{{ result.browser.name }} {{ result.browser.version }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">引擎</div>
            <div class="info-value">{{ result.engine.name }} {{ result.engine.version }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">操作系统</div>
            <div class="info-value">{{ result.os.name }} {{ result.os.version }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">设备类型</div>
            <div class="info-value">
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

      <div class="card mb-4">
        <h3 class="text-sm font-bold mb-3">浏览器环境信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">屏幕分辨率</div>
            <div class="info-value">{{ envInfo.screen }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">可用视口</div>
            <div class="info-value">{{ envInfo.viewport }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">设备像素比</div>
            <div class="info-value">{{ envInfo.dpr }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">色彩深度</div>
            <div class="info-value">{{ envInfo.colorDepth }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">语言</div>
            <div class="info-value">{{ envInfo.language }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">时区</div>
            <div class="info-value">{{ envInfo.timezone }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">在线状态</div>
            <div class="info-value">
              <n-tag :type="envInfo.online ? 'success' : 'warning'" size="small" :bordered="false">
                {{ envInfo.online ? '在线' : '离线' }}
              </n-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Cookies 启用</div>
            <div class="info-value">{{ envInfo.cookiesEnabled ? '是' : '否' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">触控支持</div>
            <div class="info-value">{{ envInfo.touch ? '是' : '否' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">WebGL 渲染器</div>
            <div class="info-value">{{ envInfo.webgl || '未知' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">内存 / 核心数</div>
            <div class="info-value">{{ envInfo.hardware }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">平台</div>
            <div class="info-value">{{ envInfo.platform }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-header mb-3">
          <h3 class="text-sm font-bold">详细分解</h3>
          <n-button size="tiny" quaternary @click="copyDetails">复制详情</n-button>
        </div>
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
import { ref, onMounted } from 'vue'
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

interface EnvInfo {
  screen: string
  viewport: string
  dpr: string
  colorDepth: string
  language: string
  timezone: string
  online: boolean
  cookiesEnabled: boolean
  touch: boolean
  webgl: string
  hardware: string
  platform: string
}

const ua = ref('')
const result = ref<ParseResult | null>(null)
const envInfo = ref<EnvInfo>({
  screen: '',
  viewport: '',
  dpr: '',
  colorDepth: '',
  language: '',
  timezone: '',
  online: true,
  cookiesEnabled: false,
  touch: false,
  webgl: '',
  hardware: '',
  platform: '',
})

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

const browserRules: Array<{ name: string; regex: RegExp; version: (m: RegExpMatchArray) => string }> = [
  { name: 'Edge', regex: /Edg\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Opera', regex: /OPR\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Chrome', regex: /Chrome\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Firefox', regex: /Firefox\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Safari', regex: /Version\/([\d.]+).*Safari/, version: (m) => m[1] },
  { name: 'IE', regex: /(?:MSIE |Trident\/.*rv:)([\d.]+)/, version: (m) => m[1] },
]

const engineRules: Array<{ name: string; regex: RegExp; version: (m: RegExpMatchArray) => string }> = [
  { name: 'Blink', regex: /Chrome\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Gecko', regex: /rv:([\d.]+).*Gecko/, version: (m) => m[1] },
  { name: 'WebKit', regex: /AppleWebKit\/([\d.]+)/, version: (m) => m[1] },
  { name: 'Trident', regex: /Trident\/([\d.]+)/, version: (m) => m[1] },
]

const osRules: Array<{ name: string; regex: RegExp; version: (m: RegExpMatchArray) => string }> = [
  { name: 'Windows', regex: /Windows NT ([\d.]+)/, version: (m) => mapWindowsVersion(m[1]) },
  { name: 'macOS', regex: /Mac OS X ([\d_]+)/, version: (m) => m[1].replace(/_/g, '.') },
  { name: 'iOS', regex: /(?:iPhone|iPad|iPod).*OS ([\d_]+)/, version: (m) => m[1].replace(/_/g, '.') },
  { name: 'Android', regex: /Android ([\d.]+)/, version: (m) => m[1] },
  { name: 'Linux', regex: /Linux/, version: () => '' },
  { name: 'Chrome OS', regex: /CrOS/, version: () => '' },
]

const deviceRules: Array<{ type: string; regex: RegExp; vendor?: string }> = [
  { type: 'iPhone', regex: /iPhone/, vendor: 'Apple' },
  { type: 'iPad', regex: /iPad/, vendor: 'Apple' },
  { type: 'iPod', regex: /iPod/, vendor: 'Apple' },
  { type: 'Android 手机', regex: /Android.*Mobile/, vendor: '' },
  { type: 'Android 平板', regex: /Android(?!.*Mobile)/, vendor: '' },
  { type: 'Windows Phone', regex: /Windows Phone/, vendor: 'Microsoft' },
]

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

onMounted(() => {
  collectEnvInfo()
})

function collectEnvInfo() {
  const nav = navigator as any
  envInfo.value = {
    screen: `${window.screen.width} × ${window.screen.height}`,
    viewport: `${window.innerWidth} × ${window.innerHeight}`,
    dpr: String(window.devicePixelRatio || 1),
    colorDepth: `${window.screen.colorDepth}-bit`,
    language: nav.language || '未知',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '未知',
    online: nav.onLine ?? true,
    cookiesEnabled: nav.cookieEnabled ?? false,
    touch: 'ontouchstart' in window || nav.maxTouchPoints > 0,
    webgl: getWebglRenderer(),
    hardware: `${nav.deviceMemory || '?'} GB / ${nav.hardwareConcurrency || '?'} 核`,
    platform: nav.platform || '未知',
  }
}

function getWebglRenderer(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return '不支持'
    const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
    if (!ext) return '无法获取'
    const renderer = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL)
    return renderer || '未知'
  } catch {
    return '未知'
  }
}

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

  for (const rule of browserRules) {
    const match = str.match(rule.regex)
    if (match) {
      parsed.browser = { name: rule.name, version: rule.version(match) }
      break
    }
  }

  for (const rule of engineRules) {
    const match = str.match(rule.regex)
    if (match) {
      parsed.engine = { name: rule.name, version: rule.version(match) }
      break
    }
  }

  for (const rule of osRules) {
    const match = str.match(rule.regex)
    if (match) {
      parsed.os = { name: rule.name, version: rule.version(match) }
      break
    }
  }

  for (const rule of deviceRules) {
    if (rule.regex.test(str)) {
      parsed.device = { type: rule.type, vendor: rule.vendor || '', model: '' }
      break
    }
  }

  if (/x64|Win64|x86_64|amd64/i.test(str)) {
    parsed.cpu.architecture = 'x64 (64位)'
  } else if (/arm64|aarch64/i.test(str)) {
    parsed.cpu.architecture = 'ARM64'
  } else if (/arm/i.test(str)) {
    parsed.cpu.architecture = 'ARM'
  } else if (/WOW64|x86/i.test(str)) {
    parsed.cpu.architecture = 'x86 (32位)'
  }

  for (const rule of botRules) {
    if (rule.regex.test(str)) {
      parsed.isBot = true
      parsed.botName = rule.name
      break
    }
  }

  result.value = parsed
  collectEnvInfo()

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
    { category: '环境', field: '屏幕', value: envInfo.value.screen },
    { category: '环境', field: '视口', value: envInfo.value.viewport },
    { category: '环境', field: '语言', value: envInfo.value.language },
    { category: '环境', field: '平台', value: envInfo.value.platform },
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

function copyDetails() {
  const text = details.value.map(d => `${d.category} / ${d.field}: ${d.value}`).join('\n')
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.ua-parser { max-width: 1000px; margin: 0 auto; }

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

.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ml-2 { margin-left: 8px; }
</style>
