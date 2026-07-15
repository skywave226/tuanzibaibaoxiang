<template>
  <div class="port-lookup">
    <div class="search-section">
      <n-input
        v-model:value="searchQuery"
        placeholder="输入端口号或服务名称搜索，如 80、HTTP..."
        clearable
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
    </div>

    <div class="filter-section">
      <n-radio-group v-model:value="selectedProtocol" name="protocol">
        <n-radio-button value="all">全部</n-radio-button>
        <n-radio-button value="TCP">TCP</n-radio-button>
        <n-radio-button value="UDP">UDP</n-radio-button>
      </n-radio-group>
    </div>

    <div class="port-list">
      <n-data-table
        :columns="columns"
        :data="filteredPorts"
        :bordered="false"
        :single-line="false"
        :pagination="{ pageSize: 20 }"
      />

      <n-empty v-if="filteredPorts.length === 0" description="未找到匹配的端口" />
    </div>

    <div class="common-ports">
      <n-divider>常用端口速查</n-divider>
      <n-space>
        <n-tag v-for="port in commonPorts" :key="port.port" :bordered="false" size="medium">
          {{ port.port }} - {{ port.service }}
        </n-tag>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NRadioGroup, NRadioButton, NDataTable, NEmpty, NDivider, NSpace, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface PortInfo {
  port: number
  service: string
  protocol: string
  description: string
}

const searchQuery = ref('')
const selectedProtocol = ref('all')

const ports: PortInfo[] = [
  { port: 20, service: 'FTP-DATA', protocol: 'TCP', description: 'FTP 数据传输' },
  { port: 21, service: 'FTP', protocol: 'TCP', description: 'FTP 文件传输协议' },
  { port: 22, service: 'SSH', protocol: 'TCP', description: '安全外壳协议，用于远程登录' },
  { port: 23, service: 'Telnet', protocol: 'TCP', description: '远程登录协议（不安全）' },
  { port: 25, service: 'SMTP', protocol: 'TCP', description: '简单邮件传输协议' },
  { port: 53, service: 'DNS', protocol: 'TCP/UDP', description: '域名系统' },
  { port: 67, service: 'DHCP', protocol: 'UDP', description: '动态主机配置协议（服务器）' },
  { port: 68, service: 'DHCP', protocol: 'UDP', description: '动态主机配置协议（客户端）' },
  { port: 69, service: 'TFTP', protocol: 'UDP', description: '简单文件传输协议' },
  { port: 80, service: 'HTTP', protocol: 'TCP', description: '超文本传输协议' },
  { port: 110, service: 'POP3', protocol: 'TCP', description: '邮局协议版本3' },
  { port: 119, service: 'NNTP', protocol: 'TCP', description: '网络新闻传输协议' },
  { port: 123, service: 'NTP', protocol: 'UDP', description: '网络时间协议' },
  { port: 135, service: 'RPC', protocol: 'TCP', description: '远程过程调用' },
  { port: 137, service: 'NetBIOS', protocol: 'UDP', description: 'NetBIOS 名称服务' },
  { port: 138, service: 'NetBIOS', protocol: 'UDP', description: 'NetBIOS 数据报服务' },
  { port: 139, service: 'NetBIOS', protocol: 'TCP', description: 'NetBIOS 会话服务' },
  { port: 143, service: 'IMAP', protocol: 'TCP', description: '互联网消息访问协议' },
  { port: 161, service: 'SNMP', protocol: 'UDP', description: '简单网络管理协议' },
  { port: 162, service: 'SNMP', protocol: 'UDP', description: 'SNMP 陷阱' },
  { port: 179, service: 'BGP', protocol: 'TCP', description: '边界网关协议' },
  { port: 389, service: 'LDAP', protocol: 'TCP', description: '轻量级目录访问协议' },
  { port: 443, service: 'HTTPS', protocol: 'TCP', description: '安全的超文本传输协议' },
  { port: 445, service: 'SMB', protocol: 'TCP', description: '服务器消息块' },
  { port: 465, service: 'SMTPS', protocol: 'TCP', description: '安全的 SMTP' },
  { port: 514, service: 'Syslog', protocol: 'UDP', description: '系统日志' },
  { port: 515, service: 'LPD', protocol: 'TCP', description: '行式打印机守护进程' },
  { port: 587, service: 'SMTP', protocol: 'TCP', description: '邮件提交端口' },
  { port: 636, service: 'LDAPS', protocol: 'TCP', description: '安全的 LDAP' },
  { port: 993, service: 'IMAPS', protocol: 'TCP', description: '安全的 IMAP' },
  { port: 995, service: 'POP3S', protocol: 'TCP', description: '安全的 POP3' },
  { port: 1433, service: 'MSSQL', protocol: 'TCP', description: 'Microsoft SQL Server' },
  { port: 1434, service: 'MSSQL', protocol: 'UDP', description: 'SQL Server 浏览器服务' },
  { port: 1521, service: 'Oracle', protocol: 'TCP', description: 'Oracle 数据库' },
  { port: 1723, service: 'PPTP', protocol: 'TCP', description: '点对点隧道协议' },
  { port: 2049, service: 'NFS', protocol: 'TCP/UDP', description: '网络文件系统' },
  { port: 3306, service: 'MySQL', protocol: 'TCP', description: 'MySQL 数据库' },
  { port: 3389, service: 'RDP', protocol: 'TCP', description: '远程桌面协议' },
  { port: 5432, service: 'PostgreSQL', protocol: 'TCP', description: 'PostgreSQL 数据库' },
  { port: 5900, service: 'VNC', protocol: 'TCP', description: '虚拟网络计算' },
  { port: 6379, service: 'Redis', protocol: 'TCP', description: 'Redis 数据库' },
  { port: 8080, service: 'HTTP-Alt', protocol: 'TCP', description: 'HTTP 备用端口' },
  { port: 8443, service: 'HTTPS-Alt', protocol: 'TCP', description: 'HTTPS 备用端口' },
  { port: 8888, service: 'HTTP-Alt', protocol: 'TCP', description: 'HTTP 备用端口（Jupyter 等）' },
  { port: 27017, service: 'MongoDB', protocol: 'TCP', description: 'MongoDB 数据库' },
]

const commonPorts = computed(() => {
  return ports.filter(p => [22, 53, 80, 443, 3306, 8080].includes(p.port))
})

const filteredPorts = computed(() => {
  let result = ports

  // 按协议过滤
  if (selectedProtocol.value !== 'all') {
    result = result.filter(p => p.protocol.includes(selectedProtocol.value))
  }

  // 按搜索词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.port.toString().includes(query) ||
      p.service.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    )
  }

  return result
})

const columns: DataTableColumns<PortInfo> = [
  { title: '端口', key: 'port', width: 100 },
  { title: '服务', key: 'service', width: 150 },
  { title: '协议', key: 'protocol', width: 100 },
  { title: '描述', key: 'description' },
]
</script>

<style scoped>
.port-lookup {
  max-width: 1000px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.port-list {
  margin-top: 20px;
}

.common-ports {
  margin-top: 30px;
}
</style>
