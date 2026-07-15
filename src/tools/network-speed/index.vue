<template>
  <div class="network-speed">
    <div class="toolbar">
      <n-button type="primary" @click="testAll" :loading="testing">开始测试</n-button>
      <n-button @click="reset">重置</n-button>
    </div>

    <div v-if="results.length > 0" class="results">
      <n-data-table :columns="columns" :data="results" :bordered="false" :single-line="false" />
    </div>

    <div v-else class="empty">
      <n-empty description="点击「开始测试」按钮测试网络延迟" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NDataTable, NEmpty } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface SpeedResult {
  name: string
  url: string
  latency: number | null
  status: 'pending' | 'success' | 'error'
}

const testing = ref(false)
const results = ref<SpeedResult[]>([])

const sites = [
  { name: '百度', url: 'https://www.baidu.com' },
  { name: '腾讯', url: 'https://www.qq.com' },
  { name: '阿里巴巴', url: 'https://www.taobao.com' },
  { name: '京东', url: 'https://www.jd.com' },
  { name: '微博', url: 'https://www.weibo.com' },
  { name: '知乎', url: 'https://www.zhihu.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Google', url: 'https://www.google.com' },
]

const columns: DataTableColumns<SpeedResult> = [
  { title: '网站', key: 'name', width: 120 },
  { title: 'URL', key: 'url' },
  {
    title: '延迟',
    key: 'latency',
    width: 120,
    render: (row) => {
      if (row.status === 'pending') return '测试中...'
      if (row.status === 'error') return '超时'
      if (row.latency === null) return '-'
      return `${row.latency} ms`
    },
  },
]

async function testSite(site: typeof sites[0]): Promise<SpeedResult> {
  const result: SpeedResult = { ...site, latency: null, status: 'pending' }
  const start = performance.now()
  
  try {
    await fetch(site.url, { mode: 'no-cors', cache: 'no-store' })
    const end = performance.now()
    result.latency = Math.round(end - start)
    result.status = 'success'
  } catch {
    result.status = 'error'
  }
  
  return result
}

async function testAll() {
  testing.value = true
  results.value = sites.map(s => ({ ...s, latency: null, status: 'pending' as const }))
  
  const promises = sites.map(async (site, index) => {
    const result = await testSite(site)
    results.value[index] = result
  })
  
  await Promise.all(promises)
  testing.value = false
}

function reset() {
  results.value = []
}
</script>

<style scoped>
.network-speed {
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.results,
.empty {
  margin-top: 20px;
}
</style>
