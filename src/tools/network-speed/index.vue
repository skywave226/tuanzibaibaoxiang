<template>
  <div class="network-speed">
    <!-- 浏览器限制说明 -->
    <n-alert type="warning" :bordered="false" class="limit-alert">
      <template #header>{{ t('networkSpeed.alert_title') }}</template>
      {{ t('networkSpeed.alert_body') }}
    </n-alert>

    <!-- 配置区 -->
    <div class="config-section">
      <div class="config-row">
        <n-form-item :label="t('networkSpeed.timeout_label')">
          <n-input-number v-model:value="timeout" :min="1000" :max="15000" :step="1000" style="width: 100%" />
        </n-form-item>
        <n-form-item :label="t('networkSpeed.samples_label')">
          <n-input-number v-model:value="samples" :min="1" :max="5" style="width: 100%" />
        </n-form-item>
        <n-form-item :label="t('networkSpeed.add_site_label')">
          <n-input v-model:value="newSiteUrl" :placeholder="t('networkSpeed.add_site_placeholder')" @keyup.enter="addSite" style="width: 100%" />
        </n-form-item>
        <n-space>
          <n-button @click="addSite" quaternary>{{ t('networkSpeed.add') }}</n-button>
        </n-space>
      </div>
    </div>

    <!-- 校验提示 -->
    <n-alert v-if="warningMsg" type="error" :bordered="false" class="limit-alert">
      {{ warningMsg }}
    </n-alert>

    <!-- 工具栏 -->
    <div class="toolbar">
      <n-button type="primary" @click="testAll" :loading="testing">{{ t('networkSpeed.start') }}</n-button>
      <n-button @click="stopTest" :disabled="!testing">{{ t('networkSpeed.stop') }}</n-button>
      <n-button @click="reset" :disabled="testing">{{ t('networkSpeed.reset') }}</n-button>
    </div>

    <!-- 进度 -->
    <div v-if="testing || progress.done > 0" class="progress-section">
      <n-progress type="line" :percentage="progress.percentage" :status="testing ? 'default' : 'success'" />
      <span class="progress-text">{{ progress.done }} / {{ progress.total }}</span>
    </div>

    <!-- 统计汇总 -->
    <div v-if="stats" class="stats">
      <n-statistic :label="t('networkSpeed.tested')" :value="`${stats.count}/${stats.total}`" />
      <n-statistic :label="t('networkSpeed.min')" :value="`${stats.min} ms`" />
      <n-statistic :label="t('networkSpeed.avg')" :value="`${stats.avg} ms`" />
      <n-statistic :label="t('networkSpeed.max')" :value="`${stats.max} ms`" />
    </div>

    <!-- 结果表格 -->
    <div v-if="results.length > 0" class="results">
      <n-data-table :columns="columns" :data="displayResults" :bordered="false" :single-line="false" />
    </div>

    <div v-else class="empty">
      <n-empty :description="t('networkSpeed.empty')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, h } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton, NDataTable, NEmpty, NAlert, NInputNumber, NInput,
  NFormItem, NSpace, NProgress, NTag, NStatistic,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const { t, locale } = useI18n()

interface Site {
  key?: string
  name: string
  url: string
}

interface LatencyResult {
  key?: string
  name: string
  url: string
  latency: number | null
  status: 'pending' | 'success' | 'error' | 'stopped'
  errorCode?: 'timeout' | 'network'
  samples?: number[]
}

const defaultSites: Site[] = [
  { key: 'baidu', name: '百度', url: 'https://www.baidu.com' },
  { key: 'tencent', name: '腾讯', url: 'https://www.qq.com' },
  { key: 'alibaba', name: '阿里巴巴', url: 'https://www.taobao.com' },
  { key: 'jd', name: '京东', url: 'https://www.jd.com' },
  { key: 'weibo', name: '微博', url: 'https://www.weibo.com' },
  { key: 'zhihu', name: '知乎', url: 'https://www.zhihu.com' },
  { key: 'github', name: 'GitHub', url: 'https://github.com' },
  { key: 'google', name: 'Google', url: 'https://www.google.com' },
]

const sites = ref<Site[]>([...defaultSites])
const results = ref<LatencyResult[]>([])
const testing = ref(false)
const stopFlag = ref(false)
const timeout = ref(5000)
const samples = ref(3)
const newSiteUrl = ref('')
const warningMsg = ref('')

let abortController: AbortController | null = null

const progress = reactive({
  done: 0,
  total: 0,
  get percentage() {
    return this.total === 0 ? 0 : Math.round((this.done / this.total) * 100)
  },
})

// 站点显示名：默认站点按当前语言解析，自定义站点用其名称
const siteName = (s: { key?: string; name: string }) =>
  s.key ? t(`networkSpeed.sites.${s.key}`) : s.name

// 统计汇总
const stats = computed(() => {
  const ok = results.value.filter(r => r.status === 'success' && r.latency !== null)
  if (ok.length === 0) return null
  const lats = ok.map(r => r.latency as number)
  return {
    count: ok.length,
    total: results.value.length,
    min: Math.min(...lats),
    max: Math.max(...lats),
    avg: Math.round(lats.reduce((a, b) => a + b, 0) / lats.length),
  }
})

// 展示排序：成功的按延迟升序，测试中次之，异常/已停止置后
const displayResults = computed(() => {
  const rank = (r: LatencyResult): number => {
    if (r.status === 'success') return r.latency ?? 1e9
    if (r.status === 'pending') return 1e9 + 1
    return 1e9 + 2
  }
  return [...results.value].sort((a, b) => rank(a) - rank(b))
})

// 列定义：依赖 locale，语言切换时重建以刷新文案
const columns = computed<DataTableColumns<LatencyResult>>(() => {
  void locale.value
  const statusKey: Record<LatencyResult['status'], string> = {
    pending: 'status_pending',
    success: 'status_success',
    error: 'status_error',
    stopped: 'status_stopped',
  }
  return [
    {
      title: t('networkSpeed.col_site'),
      key: 'name',
      width: 140,
      render: (row) => siteName(row),
    },
    { title: 'URL', key: 'url', ellipsis: { tooltip: true } },
    {
      title: t('networkSpeed.col_latency'),
      key: 'latency',
      width: 120,
      render(row) {
        if (row.status === 'pending') return h('span', { style: 'opacity: 0.6' }, t('networkSpeed.status_pending_long'))
        if (row.status === 'stopped') return h('span', { style: 'opacity: 0.6' }, t('networkSpeed.status_stopped'))
        if (row.status === 'error') {
          const text = row.errorCode === 'timeout' ? t('networkSpeed.timeout_err') : t('networkSpeed.network_err')
          return h(NTag, { type: 'error', size: 'small', bordered: false }, { default: () => text })
        }
        if (row.latency === null) return '-'
        let type: 'success' | 'warning' | 'error' = 'success'
        if (row.latency > 300) type = 'error'
        else if (row.latency > 150) type = 'warning'
        return h(NTag, { type, size: 'small', bordered: false }, { default: () => `${row.latency} ms` })
      },
    },
    {
      title: t('networkSpeed.col_status'),
      key: 'status',
      width: 100,
      render(row) {
        const typeMap: Record<LatencyResult['status'], 'default' | 'success' | 'error' | 'warning'> = {
          pending: 'default',
          success: 'success',
          error: 'error',
          stopped: 'warning',
        }
        return h(NTag, { type: typeMap[row.status], size: 'small', bordered: false }, { default: () => t(`networkSpeed.${statusKey[row.status]}`) })
      },
    },
    {
      title: t('networkSpeed.col_action'),
      key: 'actions',
      width: 80,
      render(row) {
        return h(NButton, { size: 'tiny', quaternary: true, disabled: testing.value, onClick: () => removeSite(row) }, { default: () => t('networkSpeed.delete') })
      },
    },
  ]
})

// 单次探测：带超时与外部停止信号
async function measureOnce(url: string, ms: number, externalSignal: AbortSignal): Promise<{ latency: number } | { error: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  const onExternalAbort = () => controller.abort()
  if (externalSignal.aborted) controller.abort()
  else externalSignal.addEventListener('abort', onExternalAbort, { once: true })

  const start = performance.now()
  try {
    // HEAD 请求减少响应体传输对延迟测量的干扰；no-cors 跨域仍可感知连通性
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', redirect: 'follow', signal: controller.signal })
    return { latency: Math.round(performance.now() - start) }
  } catch (e: any) {
    if (stopFlag.value) return { error: 'stopped' }
    if (e?.name === 'AbortError') return { error: 'timeout' }
    return { error: 'network' }
  } finally {
    clearTimeout(timer)
    externalSignal.removeEventListener('abort', onExternalAbort)
  }
}

// 对单站点多次采样，取最小值以降低抖动影响
async function testSite(site: Site, sampleCount: number, ms: number, signal: AbortSignal): Promise<LatencyResult> {
  const lats: number[] = []
  let lastError = 'network'
  for (let i = 0; i < sampleCount; i++) {
    if (stopFlag.value) return { ...site, latency: null, status: 'stopped' }
    const r = await measureOnce(site.url, ms, signal)
    if ('error' in r) {
      lastError = r.error
      if (r.error === 'stopped') return { ...site, latency: null, status: 'stopped' }
      continue
    }
    lats.push(r.latency)
  }
  if (lats.length === 0) {
    return { ...site, latency: null, status: 'error', errorCode: lastError === 'timeout' ? 'timeout' : 'network' }
  }
  return { ...site, latency: Math.min(...lats), status: 'success', samples: lats }
}

async function testAll() {
  if (sites.value.length === 0) {
    warningMsg.value = t('networkSpeed.warn_no_sites')
    return
  }
  warningMsg.value = ''
  testing.value = true
  stopFlag.value = false
  const controller = new AbortController()
  abortController = controller

  results.value = sites.value.map(s => ({ ...s, latency: null, status: 'pending' as const }))
  progress.done = 0
  progress.total = sites.value.length

  await Promise.all(sites.value.map(async (site) => {
    const result = await testSite(site, samples.value, timeout.value, controller.signal)
    const target = results.value.find(r => r.url === site.url)
    if (target) Object.assign(target, result)
    progress.done++
  }))

  testing.value = false
  abortController = null
}

function stopTest() {
  stopFlag.value = true
  abortController?.abort()
}

function reset() {
  results.value = []
  progress.done = 0
  progress.total = 0
}

function addSite() {
  warningMsg.value = ''
  const raw = newSiteUrl.value.trim()
  if (!raw) return
  let url = raw
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  try {
    const u = new URL(url)
    const name = u.hostname.replace(/^www\./, '')
    if (sites.value.some(s => s.url === url)) {
      warningMsg.value = t('networkSpeed.warn_exists')
      return
    }
    sites.value.push({ name, url })
    newSiteUrl.value = ''
  } catch {
    warningMsg.value = t('networkSpeed.warn_invalid')
  }
}

function removeSite(site: LatencyResult) {
  if (testing.value) return
  sites.value = sites.value.filter(s => s.url !== site.url)
  results.value = results.value.filter(r => r.url !== site.url)
}
</script>

<style scoped>
.network-speed {
  max-width: 1000px;
  margin: 0 auto;
}

.limit-alert {
  margin-bottom: 20px;
}

.config-section {
  margin-bottom: 20px;
}

.config-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.config-row .n-form-item {
  flex: 1;
  min-width: 180px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-text {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.7;
}

.stats {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
  background: var(--n-color, rgba(128, 128, 128, 0.08));
}

.results,
.empty {
  margin-top: 20px;
}

:deep(.n-data-table) {
  font-size: 14px;
}

.dark .limit-alert {
  opacity: 0.95;
}
</style>
