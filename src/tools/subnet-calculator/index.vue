<template>
  <div class="subnet-calculator">
    <div class="input-section">
      <n-input
        v-model:value="ipInput"
        placeholder="输入 IP 地址和 CIDR，如 192.168.1.0/24"
        @keyup.enter="calculate"
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
        </template>
      </n-input>
      <n-button type="primary" @click="calculate" :loading="calculating">计算</n-button>
    </div>

    <div v-if="error" class="error-message">
      <n-alert type="error" :bordered="false">{{ error }}</n-alert>
    </div>

    <div v-if="result" class="result-section">
      <n-descriptions bordered :column="2">
        <n-descriptions-item label="网络地址">{{ result.networkAddress }}</n-descriptions-item>
        <n-descriptions-item label="广播地址">{{ result.broadcastAddress }}</n-descriptions-item>
        <n-descriptions-item label="子网掩码">{{ result.subnetMask }}</n-descriptions-item>
        <n-descriptions-item label="通配符掩码">{{ result.wildcardMask }}</n-descriptions-item>
        <n-descriptions-item label="CIDR">{{ result.cidr }}</n-descriptions-item>
        <n-descriptions-item label="IP 类型">{{ result.ipType }}</n-descriptions-item>
        <n-descriptions-item label="可用主机数">{{ result.hosts }}</n-descriptions-item>
        <n-descriptions-item label="第一个可用 IP">{{ result.firstHost }}</n-descriptions-item>
        <n-descriptions-item label="最后一个可用 IP">{{ result.lastHost }}</n-descriptions-item>
        <n-descriptions-item label="IP 范围">{{ result.range }}</n-descriptions-item>
      </n-descriptions>
    </div>

    <div class="examples">
      <n-divider>示例</n-divider>
      <n-space>
        <n-button size="small" @click="setExample('192.168.1.0/24')">192.168.1.0/24</n-button>
        <n-button size="small" @click="setExample('10.0.0.0/8')">10.0.0.0/8</n-button>
        <n-button size="small" @click="setExample('172.16.0.0/16')">172.16.0.0/16</n-button>
        <n-button size="small" @click="setExample('192.168.1.100/32')">192.168.1.100/32</n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NAlert, NDescriptions, NDescriptionsItem, NDivider, NSpace } from 'naive-ui'

interface SubnetResult {
  networkAddress: string
  broadcastAddress: string
  subnetMask: string
  wildcardMask: string
  cidr: number
  ipType: string
  hosts: number
  firstHost: string
  lastHost: string
  range: string
}

const ipInput = ref('')
const calculating = ref(false)
const error = ref('')
const result = ref<SubnetResult | null>(null)

function setExample(example: string) {
  ipInput.value = example
  calculate()
}

function calculate() {
  error.value = ''
  result.value = null
  calculating.value = true

  try {
    const match = ipInput.value.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/)
    if (!match) {
      throw new Error('格式错误，请输入如 192.168.1.0/24 的格式')
    }

    const ip = match[1]
    const cidr = parseInt(match[2])

    if (cidr < 0 || cidr > 32) {
      throw new Error('CIDR 必须在 0-32 之间')
    }

    const ipParts = ip.split('.').map(Number)
    if (ipParts.some(p => p < 0 || p > 255)) {
      throw new Error('IP 地址无效')
    }

    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]
    const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) & 0xFFFFFFFF
    const networkNum = ipNum & maskNum
    const broadcastNum = networkNum | (~maskNum & 0xFFFFFFFF)

    const toIp = (num: number) => {
      return `${(num >>> 24) & 0xFF}.${(num >>> 16) & 0xFF}.${(num >>> 8) & 0xFF}.${num & 0xFF}`
    }

    const hosts = cidr >= 31 ? (cidr === 32 ? 1 : 2) : Math.pow(2, 32 - cidr) - 2

    result.value = {
      networkAddress: toIp(networkNum),
      broadcastAddress: toIp(broadcastNum),
      subnetMask: toIp(maskNum),
      wildcardMask: toIp(~maskNum & 0xFFFFFFFF),
      cidr,
      ipType: ipParts[0] === 10 ? 'A 类私有' :
              ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31 ? 'B 类私有' :
              ipParts[0] === 192 && ipParts[1] === 168 ? 'C 类私有' : '公有',
      hosts,
      firstHost: cidr >= 31 ? toIp(networkNum) : toIp(networkNum + 1),
      lastHost: cidr >= 31 ? toIp(broadcastNum) : toIp(broadcastNum - 1),
      range: `${toIp(networkNum)} - ${toIp(broadcastNum)}`,
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    calculating.value = false
  }
}
</script>

<style scoped>
.subnet-calculator {
  max-width: 800px;
  margin: 0 auto;
}

.input-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.input-section .n-input {
  flex: 1;
}

.error-message {
  margin-bottom: 20px;
}

.result-section {
  margin-bottom: 20px;
}

.examples {
  margin-top: 30px;
}
</style>
