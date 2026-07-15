<template>
  <div class="process-lookup">
    <!-- 搜索区 -->
    <div class="search-section">
      <n-input
        v-model:value="searchQuery"
        placeholder="输入进程名称或用途搜索，如 svchost、ssh、数据库..."
        clearable
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
    </div>

    <!-- 过滤区 -->
    <div class="filter-section">
      <n-space>
        <n-radio-group v-model:value="filterOS" name="os">
          <n-radio-button value="all">全部系统</n-radio-button>
          <n-radio-button value="windows">Windows</n-radio-button>
          <n-radio-button value="linux">Linux</n-radio-button>
        </n-radio-group>
        <n-radio-group v-model:value="filterType" name="type">
          <n-radio-button value="all">全部类型</n-radio-button>
          <n-radio-button value="system">系统进程</n-radio-button>
          <n-radio-button value="user">应用进程</n-radio-button>
        </n-radio-group>
      </n-space>
    </div>

    <!-- 结果表格 -->
    <div class="process-list">
      <n-data-table
        :columns="columns"
        :data="filteredProcesses"
        :bordered="false"
        :single-line="false"
        :pagination="{ pageSize: 25 }"
      />
      <n-empty v-if="filteredProcesses.length === 0" description="未找到匹配的进程" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NInput, NRadioGroup, NRadioButton, NDataTable, NEmpty, NSpace, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

// 进程信息结构
interface ProcessInfo {
  name: string
  os: 'windows' | 'linux'
  type: 'system' | 'user'
  description: string
  safe: boolean
}

const searchQuery = ref('')
const filterOS = ref<'all' | 'windows' | 'linux'>('all')
const filterType = ref<'all' | 'system' | 'user'>('all')

// 内置常见进程数据库
const processes: ProcessInfo[] = [
  // ===== Windows 系统进程 =====
  { name: 'System', os: 'windows', type: 'system', description: 'Windows 内核系统进程，包含大部分内核模式线程', safe: true },
  { name: 'System Idle Process', os: 'windows', type: 'system', description: '系统空闲进程，表示 CPU 空闲率', safe: true },
  { name: 'smss.exe', os: 'windows', type: 'system', description: '会话管理器子系统，负责创建用户会话', safe: true },
  { name: 'csrss.exe', os: 'windows', type: 'system', description: '客户端/服务器运行时子系统，Win32 子系统用户模式部分', safe: true },
  { name: 'wininit.exe', os: 'windows', type: 'system', description: 'Windows 启动应用，初始化系统服务', safe: true },
  { name: 'services.exe', os: 'windows', type: 'system', description: '服务控制管理器，管理 Windows 服务', safe: true },
  { name: 'lsass.exe', os: 'windows', type: 'system', description: '本地安全机构子系统，处理安全认证与 Active Directory', safe: true },
  { name: 'svchost.exe', os: 'windows', type: 'system', description: '服务宿主进程，承载多个 Windows 服务，通常有多个实例', safe: true },
  { name: 'winlogon.exe', os: 'windows', type: 'system', description: 'Windows 登录程序，处理用户登录注销与 SAS（Ctrl+Alt+Del）', safe: true },
  { name: 'explorer.exe', os: 'windows', type: 'system', description: 'Windows 资源管理器，桌面与任务栏界面', safe: true },
  { name: 'dwm.exe', os: 'windows', type: 'system', description: '桌面窗口管理器，负责窗口合成与桌面效果', safe: true },
  { name: 'spoolsv.exe', os: 'windows', type: 'system', description: '打印后台处理服务', safe: true },
  { name: 'taskhostw.exe', os: 'windows', type: 'system', description: '通用任务宿主进程，承载计划任务', safe: true },
  { name: 'runtimebroker.exe', os: 'windows', type: 'system', description: '运行时代理，管理 UWP 应用权限', safe: true },
  { name: 'SearchIndexer.exe', os: 'windows', type: 'system', description: 'Windows 搜索索引服务', safe: true },
  { name: 'SystemSettings.exe', os: 'windows', type: 'system', description: 'Windows 设置应用', safe: true },
  { name: 'fontdrvhost.exe', os: 'windows', type: 'system', description: '字体驱动宿主进程', safe: true },
  { name: 'Registry.exe', os: 'windows', type: 'system', description: '注册表进程，管理配置存储', safe: true },
  { name: 'Memory Compression', os: 'windows', type: 'system', description: '内存压缩进程，压缩不活跃内存页', safe: true },
  { name: 'WmiPrvSE.exe', os: 'windows', type: 'system', description: 'WMI 提供者宿主，承载 WMI 查询', safe: true },

  // ===== Windows 应用进程 =====
  { name: 'chrome.exe', os: 'windows', type: 'user', description: 'Google Chrome 浏览器，每个标签页与扩展为独立进程', safe: true },
  { name: 'msedge.exe', os: 'windows', type: 'user', description: 'Microsoft Edge 浏览器', safe: true },
  { name: 'firefox.exe', os: 'windows', type: 'user', description: 'Mozilla Firefox 浏览器', safe: true },
  { name: 'Code.exe', os: 'windows', type: 'user', description: 'Visual Studio Code 编辑器', safe: true },
  { name: 'devenv.exe', os: 'windows', type: 'user', description: 'Visual Studio IDE', safe: true },
  { name: 'idea64.exe', os: 'windows', type: 'user', description: 'IntelliJ IDEA IDE', safe: true },
  { name: 'node.exe', os: 'windows', type: 'user', description: 'Node.js 运行时，常见于前端开发服务', safe: true },
  { name: 'python.exe', os: 'windows', type: 'user', description: 'Python 解释器', safe: true },
  { name: 'java.exe', os: 'windows', type: 'user', description: 'Java 运行时，承载 JVM 应用', safe: true },
  { name: 'docker.exe', os: 'windows', type: 'user', description: 'Docker Desktop 客户端', safe: true },
  { name: 'mysqld.exe', os: 'windows', type: 'user', description: 'MySQL 数据库服务端', safe: true },
  { name: 'postgres.exe', os: 'windows', type: 'user', description: 'PostgreSQL 数据库服务端', safe: true },
  { name: 'redis-server.exe', os: 'windows', type: 'user', description: 'Redis 内存数据库服务端', safe: true },
  { name: 'nginx.exe', os: 'windows', type: 'user', description: 'Nginx Web 服务器/反向代理', safe: true },
  { name: 'httpd.exe', os: 'windows', type: 'user', description: 'Apache HTTP 服务器', safe: true },
  { name: 'Steam.exe', os: 'windows', type: 'user', description: 'Steam 游戏平台客户端', safe: true },
  { name: 'Discord.exe', os: 'windows', type: 'user', description: 'Discord 通讯客户端', safe: true },
  { name: 'WeChat.exe', os: 'windows', type: 'user', description: '微信客户端', safe: true },
  { name: 'QQ.exe', os: 'windows', type: 'user', description: 'QQ 客户端', safe: true },

  // ===== Linux 系统进程 =====
  { name: 'init', os: 'linux', type: 'system', description: '系统初始化进程（PID 1），传统 SysV init', safe: true },
  { name: 'systemd', os: 'linux', type: 'system', description: '系统与服务管理器（PID 1），现代 Linux 主流 init', safe: true },
  { name: 'kthreadd', os: 'linux', type: 'system', description: '内核线程守护进程，管理所有内核线程', safe: true },
  { name: 'ksoftirqd', os: 'linux', type: 'system', description: '内核软中断处理线程', safe: true },
  { name: 'kworker', os: 'linux', type: 'system', description: '内核工作线程，处理延迟工作', safe: true },
  { name: 'migration', os: 'linux', type: 'system', description: '内核迁移线程，负责进程间 CPU 迁移', safe: true },
  { name: 'rcu_sched', os: 'linux', type: 'system', description: 'RCU（读复制更新）调度线程', safe: true },
  { name: 'watchdog', os: 'linux', type: 'system', description: '内核看门狗，检测系统死锁', safe: true },
  { name: 'jbd2', os: 'linux', type: 'system', description: 'ext4 文件系统日志线程', safe: true },
  { name: 'sshd', os: 'linux', type: 'system', description: 'SSH 守护进程，提供远程登录服务', safe: true },
  { name: 'cron', os: 'linux', type: 'system', description: '定时任务守护进程，执行计划任务', safe: true },
  { name: 'crond', os: 'linux', type: 'system', description: 'Cron 守护进程（RHEL/CentOS 风格）', safe: true },
  { name: 'rsyslogd', os: 'linux', type: 'system', description: '系统日志守护进程', safe: true },
  { name: 'syslogd', os: 'linux', type: 'system', description: '传统系统日志守护进程', safe: true },
  { name: 'systemd-journald', os: 'linux', type: 'system', description: 'systemd 日志守护进程', safe: true },
  { name: 'systemd-logind', os: 'linux', type: 'system', description: 'systemd 登录管理', safe: true },
  { name: 'systemd-udevd', os: 'linux', type: 'system', description: 'udev 设备管理守护进程', safe: true },
  { name: 'systemd-resolved', os: 'linux', type: 'system', description: 'systemd DNS 解析服务', safe: true },
  { name: 'systemd-networkd', os: 'linux', type: 'system', description: 'systemd 网络配置服务', safe: true },
  { name: 'dbus-daemon', os: 'linux', type: 'system', description: 'D-Bus 系统总线守护进程', safe: true },
  { name: 'getty', os: 'linux', type: 'system', description: '终端登录管理进程', safe: true },
  { name: 'agetty', os: 'linux', type: 'system', description: '替代 getty 的终端登录进程', safe: true },
  { name: 'irqbalance', os: 'linux', type: 'system', description: '中断平衡守护进程，分配硬件中断到 CPU', safe: true },
  { name: 'polkitd', os: 'linux', type: 'system', description: 'PolicyKit 权限管理守护进程', safe: true },
  { name: 'accounts-daemon', os: 'linux', type: 'system', description: '账户信息服务守护进程', safe: true },
  { name: 'NetworkManager', os: 'linux', type: 'system', description: '网络管理服务，管理网络连接', safe: true },
  { name: 'firewalld', os: 'linux', type: 'system', description: '防火墙管理守护进程', safe: true },
  { name: 'auditd', os: 'linux', type: 'system', description: '审计守护进程，记录系统审计事件', safe: true },

  // ===== Linux 应用进程 =====
  { name: 'nginx', os: 'linux', type: 'user', description: 'Nginx Web 服务器/反向代理', safe: true },
  { name: 'apache2', os: 'linux', type: 'user', description: 'Apache HTTP 服务器（Debian/Ubuntu）', safe: true },
  { name: 'httpd', os: 'linux', type: 'user', description: 'Apache HTTP 服务器（RHEL/CentOS）', safe: true },
  { name: 'mysqld', os: 'linux', type: 'user', description: 'MySQL/MariaDB 数据库服务端', safe: true },
  { name: 'mariadbd', os: 'linux', type: 'user', description: 'MariaDB 数据库服务端', safe: true },
  { name: 'postgres', os: 'linux', type: 'user', description: 'PostgreSQL 数据库服务端', safe: true },
  { name: 'redis-server', os: 'linux', type: 'user', description: 'Redis 内存数据库服务端', safe: true },
  { name: 'mongod', os: 'linux', type: 'user', description: 'MongoDB 数据库服务端', safe: true },
  { name: 'node', os: 'linux', type: 'user', description: 'Node.js 运行时', safe: true },
  { name: 'python', os: 'linux', type: 'user', description: 'Python 解释器', safe: true },
  { name: 'python3', os: 'linux', type: 'user', description: 'Python 3 解释器', safe: true },
  { name: 'java', os: 'linux', type: 'user', description: 'Java 运行时（JVM）', safe: true },
  { name: 'php-fpm', os: 'linux', type: 'user', description: 'PHP FastCGI 进程管理器', safe: true },
  { name: 'gunicorn', os: 'linux', type: 'user', description: 'Python WSGI HTTP 服务器', safe: true },
  { name: 'uwsgi', os: 'linux', type: 'user', description: 'uWSGI 应用服务器', safe: true },
  { name: 'dockerd', os: 'linux', type: 'user', description: 'Docker 守护进程', safe: true },
  { name: 'containerd', os: 'linux', type: 'user', description: '容器运行时守护进程', safe: true },
  { name: 'kubelet', os: 'linux', type: 'user', description: 'Kubernetes 节点代理', safe: true },
  { name: 'kube-apiserver', os: 'linux', type: 'user', description: 'Kubernetes API 服务端', safe: true },
  { name: 'etcd', os: 'linux', type: 'user', description: 'etcd 分布式键值存储', safe: true },
  { name: 'grafana', os: 'linux', type: 'user', description: 'Grafana 可视化监控平台', safe: true },
  { name: 'prometheus', os: 'linux', type: 'user', description: 'Prometheus 监控系统', safe: true },
  { name: 'telegraf', os: 'linux', type: 'user', description: 'Telegraf 指标采集代理', safe: true },
  { name: 'influxd', os: 'linux', type: 'user', description: 'InfluxDB 时序数据库', safe: true },
  { name: 'elasticsearch', os: 'linux', type: 'user', description: 'Elasticsearch 搜索引擎', safe: true },
  { name: 'kibana', os: 'linux', type: 'user', description: 'Kibana 可视化平台', safe: true },
  { name: 'rabbitmq-server', os: 'linux', type: 'user', description: 'RabbitMQ 消息队列服务端', safe: true },
  { name: 'memcached', os: 'linux', type: 'user', description: 'Memcached 内存缓存服务', safe: true },
  { name: 'zabbix_agentd', os: 'linux', type: 'user', description: 'Zabbix 监控代理', safe: true },
  { name: 'tmux', os: 'linux', type: 'user', description: '终端复用器', safe: true },
  { name: 'screen', os: 'linux', type: 'user', description: '终端多路复用器', safe: true },
]

const filteredProcesses = computed(() => {
  let result = processes

  // 按系统过滤
  if (filterOS.value !== 'all') {
    result = result.filter(p => p.os === filterOS.value)
  }

  // 按类型过滤
  if (filterType.value !== 'all') {
    result = result.filter(p => p.type === filterType.value)
  }

  // 按搜索词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    )
  }

  return result
})

const columns: DataTableColumns<ProcessInfo> = [
  { title: '进程名', key: 'name', width: 180 },
  {
    title: '系统',
    key: 'os',
    width: 100,
    render(row) {
      return h(NTag, {
        type: row.os === 'windows' ? 'info' : 'success',
        size: 'small',
        bordered: false,
      }, { default: () => row.os === 'windows' ? 'Windows' : 'Linux' })
    },
  },
  {
    title: '类型',
    key: 'type',
    width: 100,
    render(row) {
      return h(NTag, {
        type: row.type === 'system' ? 'warning' : 'default',
        size: 'small',
        bordered: false,
      }, { default: () => row.type === 'system' ? '系统进程' : '应用进程' })
    },
  },
  { title: '说明', key: 'description' },
]
</script>

<style scoped>
.process-lookup {
  max-width: 1000px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 16px;
}

.filter-section {
  margin-bottom: 20px;
}

.process-list {
  margin-top: 16px;
}

.dark :deep(.n-data-table) {
  background: transparent;
}
</style>
