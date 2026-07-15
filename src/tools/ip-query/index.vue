<template>
  <div class="ip-query">
    <div class="query-section card">
      <div class="query-header">
        <h3 class="text-lg font-bold">我的 IP 信息</h3>
        <n-button @click="refreshIp" :loading="loading" size="small">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>刷新
        </n-button>
      </div>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
        <p class="mt-4 text-gray-500">正在查询 IP 信息...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <n-alert type="error" :bordered="false">{{ error }}</n-alert>
        <n-button @click="refreshIp" class="mt-4">重试</n-button>
      </div>

      <div v-else-if="ipInfo" class="ip-info">
        <div class="ip-display">
          <div class="ip-label">您的 IP 地址</div>
          <div class="ip-value">{{ ipInfo.query }}</div>
        </div>
        <n-divider />
        <div class="info-grid">
          <div class="info-item"><div class="info-label">国家</div><div class="info-value">{{ ipInfo.country }}</div></div>
          <div class="info-item"><div class="info-label">省份/地区</div><div class="info-value">{{ ipInfo.regionName }}</div></div>
          <div class="info-item"><div class="info-label">城市</div><div class="info-value">{{ ipInfo.city }}</div></div>
          <div class="info-item"><div class="info-label">运营商</div><div class="info-value">{{ ipInfo.isp }}</div></div>
          <div class="info-item"><div class="info-label">时区</div><div class="info-value">{{ ipInfo.timezone }}</div></div>
          <div class="info-item"><div class="info-label">经纬度</div><div class="info-value">{{ ipInfo.lat }}, {{ ipInfo.lon }}</div></div>
        </div>
        <n-divider />
        <div class="map-section">
          <div class="info-label mb-2">地理位置</div>
          <a :href="mapUrl" target="_blank" class="map-link">
            <span class=" mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg></span>在地图上查看
          </a>
        </div>
      </div>
    </div>

    <div class="query-section card mt-4">
      <h3 class="text-lg font-bold mb-4">查询其他 IP</h3>
      <div class="search-box">
        <n-input v-model:value="searchIp" placeholder="输入 IP 地址查询（留空查询本机）" @keyup.enter="searchOtherIp">
          <template #suffix>
            <n-button @click="searchOtherIp" :loading="searching" size="small">查询</n-button>
          </template>
        </n-input>
      </div>
      <div v-if="searchResult" class="search-result mt-4">
        <n-divider>查询结果</n-divider>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">IP 地址</div><div class="info-value">{{ searchResult.query }}</div></div>
          <div class="info-item"><div class="info-label">国家</div><div class="info-value">{{ searchResult.country }}</div></div>
          <div class="info-item"><div class="info-label">省份/地区</div><div class="info-value">{{ searchResult.regionName }}</div></div>
          <div class="info-item"><div class="info-label">城市</div><div class="info-value">{{ searchResult.city }}</div></div>
          <div class="info-item"><div class="info-label">运营商</div><div class="info-value">{{ searchResult.isp }}</div></div>
        </div>
      </div>
    </div>

    <n-alert type="info" class="mt-4" :bordered="false">
      <template #header>数据来源</template>
      IP 查询数据来自 <a href="https://ip-api.com" target="_blank">ip-api.com</a> 免费 API，每小时限制 45 次请求
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NButton, NInput, NAlert, NDivider, NSpin } from 'naive-ui'

interface IpInfo {
  query: string
  country: string
  regionName: string
  city: string
  isp: string
  timezone: string
  lat: number
  lon: number
}

const loading = ref(true)
const searching = ref(false)
const error = ref('')
const ipInfo = ref<IpInfo | null>(null)
const searchIp = ref('')
const searchResult = ref<IpInfo | null>(null)

const mapUrl = computed(() => {
  if (!ipInfo.value) return '#'
  const { lat, lon } = ipInfo.value
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`
})

async function fetchIpInfo(ip?: string): Promise<IpInfo> {
  const url = ip
    ? `https://ip-api.com/json/${ip}?lang=zh-CN`
    : 'https://ip-api.com/json/?lang=zh-CN'
  const response = await fetch(url)
  if (!response.ok) throw new Error('查询失败，请稍后重试')
  const data = await response.json()
  if (data.status === 'fail') throw new Error(data.message || '查询失败')
  return data
}

async function refreshIp() {
  loading.value = true
  error.value = ''
  ipInfo.value = null
  try {
    ipInfo.value = await fetchIpInfo()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

async function searchOtherIp() {
  if (!searchIp.value.trim()) { refreshIp(); return }
  searching.value = true
  searchResult.value = null
  try {
    searchResult.value = await fetchIpInfo(searchIp.value.trim())
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    searching.value = false
  }
}

onMounted(() => { refreshIp() })
</script>

<style scoped>
.ip-query { max-width: 800px; margin: 0 auto; }
.query-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.loading-state, .error-state { display: flex; flex-direction: column; align-items: center; padding: 32px 0; }
.ip-display { text-align: center; padding: 16px 0; }
.ip-label { font-size: 14px; color: #888; margin-bottom: 8px; }
.ip-value { font-size: 32px; font-weight: bold; color: #36ad6a; font-family: 'Fira Code', 'Consolas', monospace; }
.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.info-item { padding: 12px; background: #f9f9f9; border-radius: 8px; }
.dark .info-item { background: #1a1a2e; }
.info-label { font-size: 12px; color: #888; margin-bottom: 4px; }
.info-value { font-size: 14px; font-weight: 500; word-break: break-all; }
.map-section { text-align: center; }
.map-link { display: inline-flex; align-items: center; color: #36ad6a; text-decoration: none; font-size: 14px; }
.map-link:hover { text-decoration: underline; }
.search-box { max-width: 500px; }
</style>
