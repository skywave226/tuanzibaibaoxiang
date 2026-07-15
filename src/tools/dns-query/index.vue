<template>
  <div class="dns-query">
    <div class="toolbar">
      <n-input
        v-model:value="domain"
        placeholder="输入域名，如 example.com"
        @keyup.enter="queryDns"
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
      <n-select
        v-model:value="recordType"
        :options="recordTypes"
        style="width: 120px"
      />
      <n-button type="primary" @click="queryDns" :loading="loading">查询</n-button>
    </div>

    <div v-if="error" class="error-message">
      <n-alert type="error" :bordered="false">{{ error }}</n-alert>
    </div>

    <div v-if="results.length > 0" class="results">
      <n-data-table
        :columns="columns"
        :data="results"
        :bordered="false"
        :single-line="false"
      />
    </div>

    <div v-else-if="!loading && !error && queried" class="empty">
      <n-empty description="未找到解析记录" />
    </div>

    <div class="tips">
      <n-collapse>
        <n-collapse-item title="支持的记录类型" name="types">
          <n-space vertical>
            <div><strong>A</strong> - IPv4 地址</div>
            <div><strong>AAAA</strong> - IPv6 地址</div>
            <div><strong>CNAME</strong> - 别名记录</div>
            <div><strong>MX</strong> - 邮件交换记录</div>
            <div><strong>TXT</strong> - 文本记录</div>
            <div><strong>NS</strong> - 域名服务器</div>
            <div><strong>SOA</strong> - 授权起始服务器</div>
            <div><strong>PTR</strong> - 反向解析</div>
          </n-space>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NSelect, NButton, NDataTable, NAlert, NEmpty, NCollapse, NCollapseItem, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface DnsRecord {
  name: string
  type: string
  TTL: number
  data: string
}

const domain = ref('')
const recordType = ref('A')
const loading = ref(false)
const error = ref('')
const results = ref<DnsRecord[]>([])
const queried = ref(false)

const recordTypes = [
  { label: 'A', value: 'A' },
  { label: 'AAAA', value: 'AAAA' },
  { label: 'CNAME', value: 'CNAME' },
  { label: 'MX', value: 'MX' },
  { label: 'TXT', value: 'TXT' },
  { label: 'NS', value: 'NS' },
  { label: 'SOA', value: 'SOA' },
  { label: 'PTR', value: 'PTR' },
]

const columns: DataTableColumns<DnsRecord> = [
  { title: '名称', key: 'name' },
  { title: '类型', key: 'type', width: 80 },
  { title: 'TTL', key: 'TTL', width: 100 },
  { title: '数据', key: 'data', ellipsis: { tooltip: true } },
]

async function queryDns() {
  if (!domain.value.trim()) {
    error.value = '请输入域名'
    return
  }

  loading.value = true
  error.value = ''
  results.value = []
  queried.value = true

  try {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(domain.value)}&type=${recordType.value}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('查询失败，请稍后重试')
    }

    const data = await response.json()
    
    if (data.Answer) {
      results.value = data.Answer.map((item: any) => ({
        name: item.name,
        type: getRecordTypeName(item.type),
        TTL: item.TTL,
        data: item.data,
      }))
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    error.value = msg || '查询失败'
  } finally {
    loading.value = false
  }
}

function getRecordTypeName(type: number): string {
  const typeMap: Record<number, string> = {
    1: 'A',
    2: 'NS',
    5: 'CNAME',
    6: 'SOA',
    12: 'PTR',
    15: 'MX',
    16: 'TXT',
    28: 'AAAA',
  }
  return typeMap[type] || String(type)
}
</script>

<style scoped>
.dns-query {
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.toolbar .n-input {
  flex: 1;
}

.error-message,
.results,
.empty {
  margin-top: 20px;
}

.tips {
  margin-top: 30px;
}
</style>
