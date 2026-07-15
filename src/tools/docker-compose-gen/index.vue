<template>
  <div class="docker-compose-gen">
    <n-alert type="info" class="mb-4">
      可视化生成 docker-compose.yml 文件，支持多服务编排。所有数据仅在浏览器本地处理，零外部依赖。
    </n-alert>

    <!-- 全局配置 -->
    <div class="card mb-4">
      <div class="pane-label mb-3">项目配置</div>
      <div class="form-grid">
        <div class="form-item">
          <label>项目名称（compose project name）</label>
          <n-input v-model:value="projectName" placeholder="myapp" />
        </div>
        <div class="form-item">
          <label>Compose 版本</label>
          <n-select v-model:value="composeVersion" :options="versionOptions" />
        </div>
        <div class="form-item">
          <label>默认网络驱动</label>
          <n-select v-model:value="networkDriver" :options="driverOptions" />
        </div>
        <div class="form-item">
          <label>重启策略</label>
          <n-select v-model:value="restartPolicy" :options="restartOptions" />
        </div>
      </div>
    </div>

    <!-- 服务列表 -->
    <div class="card mb-4">
      <div class="section-header mb-3">
        <span class="pane-label">服务列表</span>
        <n-button type="primary" size="small" @click="addService">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>添加服务
        </n-button>
      </div>

      <n-empty v-if="services.length === 0" description="点击「添加服务」开始创建" class="my-4" />

      <!-- 服务卡片 -->
      <div v-for="(service, idx) in services" :key="idx" class="service-card">
        <div class="service-header">
          <span class="service-title">服务 {{ idx + 1 }}</span>
          <n-button quaternary size="small" type="error" @click="removeService(idx)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </n-button>
        </div>

        <div class="service-form">
          <div class="form-grid">
            <div class="form-item">
              <label>服务名称</label>
              <n-input v-model:value="service.name" placeholder="web" @input="generate" />
            </div>
            <div class="form-item">
              <label>镜像</label>
              <n-input v-model:value="service.image" placeholder="nginx:latest" @input="generate" />
            </div>
            <div class="form-item">
              <label>重启策略</label>
              <n-select v-model:value="service.restart" :options="restartOptions" @update:value="generate" />
            </div>
            <div class="form-item">
              <label>主机名</label>
              <n-input v-model:value="service.hostname" placeholder="可选" @input="generate" />
            </div>
          </div>

          <!-- 端口映射 -->
          <div class="sub-section">
            <div class="sub-header">
              <span class="sub-label">端口映射</span>
              <n-button size="tiny" quaternary @click="addPort(service)">添加</n-button>
            </div>
            <div v-for="(port, pIdx) in service.ports" :key="pIdx" class="port-row">
              <n-input-number v-model:value="port.host" placeholder="宿主端口" :min="1" :max="65535" style="width: 130px" @update:value="generate" />
              <span class="arrow">:</span>
              <n-input-number v-model:value="port.container" placeholder="容器端口" :min="1" :max="65535" style="width: 130px" @update:value="generate" />
              <n-input v-model:value="port.protocol" placeholder="tcp" style="width: 90px" @input="generate" />
              <n-button size="tiny" quaternary type="error" @click="service.ports.splice(pIdx, 1); generate()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </n-button>
            </div>
          </div>

          <!-- 环境变量 -->
          <div class="sub-section">
            <div class="sub-header">
              <span class="sub-label">环境变量</span>
              <n-button size="tiny" quaternary @click="addEnv(service)">添加</n-button>
            </div>
            <div v-for="(env, eIdx) in service.envs" :key="eIdx" class="kv-row">
              <n-input v-model:value="env.key" placeholder="KEY" style="width: 180px" @input="generate" />
              <span class="eq">=</span>
              <n-input v-model:value="env.value" placeholder="value" class="flex-1" @input="generate" />
              <n-button size="tiny" quaternary type="error" @click="service.envs.splice(eIdx, 1); generate()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </n-button>
            </div>
          </div>

          <!-- 卷挂载 -->
          <div class="sub-section">
            <div class="sub-header">
              <span class="sub-label">卷挂载</span>
              <n-button size="tiny" quaternary @click="addVolume(service)">添加</n-button>
            </div>
            <div v-for="(vol, vIdx) in service.volumes" :key="vIdx" class="kv-row">
              <n-input v-model:value="vol.host" placeholder="宿主路径或卷名" style="width: 200px" @input="generate" />
              <span class="arrow">:</span>
              <n-input v-model:value="vol.container" placeholder="容器路径" class="flex-1" @input="generate" />
              <n-input v-model:value="vol.mode" placeholder="rw" style="width: 80px" @input="generate" />
              <n-button size="tiny" quaternary type="error" @click="service.volumes.splice(vIdx, 1); generate()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </n-button>
            </div>
          </div>

          <!-- 依赖关系 -->
          <div class="sub-section">
            <div class="sub-header">
              <span class="sub-label">依赖服务（depends_on）</span>
            </div>
            <n-select
              v-model:value="service.dependsOn"
              multiple
              filterable
              tag
              placeholder="选择依赖的其他服务"
              :options="otherServiceOptions(idx)"
              @update:value="generate"
            />
          </div>

          <!-- 命令 -->
          <div class="form-item full-width">
            <label>启动命令（command）</label>
            <n-input v-model:value="service.command" placeholder="可选，如 npm start" @input="generate" />
          </div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar mb-3">
      <n-space>
        <n-button type="primary" @click="generate">生成 YAML</n-button>
        <n-button @click="copyYaml" :disabled="!yaml">复制</n-button>
        <n-button @click="downloadYaml" :disabled="!yaml">下载文件</n-button>
        <n-button @click="loadExample">加载示例</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
    </div>

    <!-- 预览结果 -->
    <div class="card" v-if="yaml">
      <div class="result-header mb-2">
        <span class="pane-label">docker-compose.yml 预览</span>
        <n-tag size="small" :bordered="false" type="info">{{ services.length }} 个服务</n-tag>
      </div>
      <n-input
        :value="yaml"
        type="textarea"
        readonly
        :rows="24"
        :autosize="false"
        class="yaml-preview"
      />
    </div>
    <div class="card" v-else>
      <n-empty description="添加服务后点击「生成 YAML」按钮" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  NAlert, NInput, NInputNumber, NSelect, NButton, NTag, NEmpty, NSpace, useMessage,
} from 'naive-ui'

const message = useMessage()

// 端口映射结构
interface PortMapping {
  host: number | null
  container: number | null
  protocol: string
}
// 键值对结构（环境变量）
interface KeyValue {
  key: string
  value: string
}
// 卷挂载结构
interface VolumeMount {
  host: string
  container: string
  mode: string
}
// 服务结构
interface Service {
  name: string
  image: string
  restart: string
  hostname: string
  command: string
  ports: PortMapping[]
  envs: KeyValue[]
  volumes: VolumeMount[]
  dependsOn: string[]
}

const projectName = ref('myapp')
const composeVersion = ref('3.8')
const networkDriver = ref('bridge')
const restartPolicy = ref('always')

const versionOptions = [
  { label: '3.8', value: '3.8' },
  { label: '3.7', value: '3.7' },
  { label: '3.6', value: '3.6' },
  { label: '2.4', value: '2.4' },
]

const driverOptions = [
  { label: 'bridge', value: 'bridge' },
  { label: 'host', value: 'host' },
  { label: 'overlay', value: 'overlay' },
  { label: 'none', value: 'none' },
]

const restartOptions = [
  { label: 'always（总是重启）', value: 'always' },
  { label: 'unless-stopped（除非手动停止）', value: 'unless-stopped' },
  { label: 'on-failure（失败时重启）', value: 'on-failure' },
  { label: 'no（不重启）', value: 'no' },
]

const services = ref<Service[]>([])
const yaml = ref('')

// 其他可选项（排除自己）
function otherServiceOptions(currentIdx: number) {
  return services.value
    .map((s, _i) => ({ label: s.name, value: s.name }))
    .filter((_, i) => i !== currentIdx)
}

function addService(): void {
  services.value.push({
    name: '',
    image: '',
    restart: restartPolicy.value,
    hostname: '',
    command: '',
    ports: [],
    envs: [],
    volumes: [],
    dependsOn: [],
  })
}

function removeService(idx: number): void {
  services.value.splice(idx, 1)
  generate()
}

function addPort(service: Service): void {
  service.ports.push({ host: null, container: null, protocol: 'tcp' })
}

function addEnv(service: Service): void {
  service.envs.push({ key: '', value: '' })
}

function addVolume(service: Service): void {
  service.volumes.push({ host: '', container: '', mode: 'rw' })
}

// YAML 字符串转义（含特殊字符时加引号）
function yamlValue(val: string): string {
  if (val === '') return '""'
  // 包含特殊字符需要加引号
  if (/[:#{}\[],&*?|<>=!%@`"'\n]/.test(val) || val.startsWith(' ') || val.endsWith(' ')) {
    return `"${val.replace(/"/g, '\\"')}"`
  }
  return val
}

// 缩进工具
function indent(level: number): string {
  return '  '.repeat(level)
}

// 生成单个服务的 YAML 片段
function genService(service: Service): string {
  const lines: string[] = []
  const i2 = indent(3)
  const i3 = indent(4)

  if (service.image) {
    lines.push(`${i2}image: ${service.image}`)
  }
  if (service.restart) {
    lines.push(`${i2}restart: ${service.restart}`)
  }
  if (service.hostname) {
    lines.push(`${i2}hostname: ${service.hostname}`)
  }
  if (service.command) {
    lines.push(`${i2}command: ${yamlValue(service.command)}`)
  }

  // 端口映射
  if (service.ports.length > 0) {
    lines.push(`${i2}ports:`)
    service.ports.forEach(p => {
      if (p.host && p.container) {
        const proto = p.protocol ? `:${p.protocol}` : ''
        lines.push(`${i3}- "${p.host}:${p.container}${proto}"`)
      } else if (p.container) {
        lines.push(`${i3}- "${p.container}"`)
      }
    })
  }

  // 环境变量
  if (service.envs.length > 0) {
    const validEnvs = service.envs.filter(e => e.key)
    if (validEnvs.length > 0) {
      lines.push(`${i2}environment:`)
      validEnvs.forEach(e => {
        lines.push(`${i3}- ${e.key}=${yamlValue(e.value)}`)
      })
    }
  }

  // 卷挂载
  if (service.volumes.length > 0) {
    const validVols = service.volumes.filter(v => v.container)
    if (validVols.length > 0) {
      lines.push(`${i2}volumes:`)
      validVols.forEach(v => {
        const mode = v.mode ? `:${v.mode}` : ''
        if (v.host) {
          lines.push(`${i3}- ${v.host}:${v.container}${mode}`)
        } else {
          lines.push(`${i3}- ${v.container}`)
        }
      })
    }
  }

  // 依赖关系
  if (service.dependsOn.length > 0) {
    lines.push(`${i2}depends_on:`)
    service.dependsOn.forEach(d => {
      lines.push(`${i3}- ${d}`)
    })
  }

  return lines.join('\n')
}

// 生成完整 YAML
function generate(): void {
  const validServices = services.value.filter(s => s.name && s.image)
  if (validServices.length === 0) {
    yaml.value = ''
    return
  }

  const lines: string[] = []
  lines.push(`# docker-compose.yml`)
  lines.push(`# 由 Docker Compose 生成工具生成`)
  lines.push(`version: "${composeVersion.value}"`)
  lines.push('')
  lines.push('services:')
  validServices.forEach((service, idx) => {
    if (idx > 0) lines.push('')
    lines.push(`${indent(2)}${service.name}:`)
    const serviceYaml = genService(service)
    if (serviceYaml) lines.push(serviceYaml)
  })

  // 网络
  lines.push('')
  lines.push('networks:')
  lines.push(`${indent(2)}default:`)
  lines.push(`${indent(3)}driver: ${networkDriver.value}`)

  // 注释项目名
  lines.splice(2, 0, `# project name: ${projectName.value}`)

  yaml.value = lines.join('\n')
  message.success('YAML 已生成')
}

// 复制
async function copyYaml(): Promise<void> {
  if (!yaml.value) return
  try {
    await navigator.clipboard.writeText(yaml.value)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败')
  }
}

// 下载
function downloadYaml(): void {
  if (!yaml.value) return
  const blob = new Blob([yaml.value], { type: 'text/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'docker-compose.yml'
  a.click()
  URL.revokeObjectURL(url)
  message.success('已开始下载')
}

// 加载示例：web + db
function loadExample(): void {
  projectName.value = 'webapp'
  composeVersion.value = '3.8'
  services.value = [
    {
      name: 'web',
      image: 'nginx:alpine',
      restart: 'always',
      hostname: '',
      command: '',
      ports: [{ host: 8080, container: 80, protocol: 'tcp' }],
      envs: [
        { key: 'NGINX_HOST', value: 'localhost' },
        { key: 'NGINX_PORT', value: '80' },
      ],
      volumes: [
        { host: './html', container: '/usr/share/nginx/html', mode: 'rw' },
        { host: './conf/nginx.conf', container: '/etc/nginx/nginx.conf', mode: 'ro' },
      ],
      dependsOn: ['db'],
    },
    {
      name: 'db',
      image: 'mysql:8.0',
      restart: 'unless-stopped',
      hostname: 'db',
      command: '',
      ports: [{ host: 3306, container: 3306, protocol: 'tcp' }],
      envs: [
        { key: 'MYSQL_ROOT_PASSWORD', value: 'rootpass' },
        { key: 'MYSQL_DATABASE', value: 'appdb' },
        { key: 'MYSQL_USER', value: 'app' },
        { key: 'MYSQL_PASSWORD', value: 'apppass' },
      ],
      volumes: [
        { host: 'dbdata', container: '/var/lib/mysql', mode: 'rw' },
      ],
      dependsOn: [],
    },
  ]
  generate()
}

function clearAll(): void {
  services.value = []
  yaml.value = ''
  message.info('已清空')
}
</script>

<style scoped>
.docker-compose-gen {
  max-width: 1000px;
  margin: 0 auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item.full-width {
  grid-column: 1 / -1;
}

.form-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .form-item label {
  color: #bbb;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fafafa;
}

.dark .service-card {
  border-color: #374151;
  background: #1f2937;
}

.service-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.service-title {
  font-weight: 600;
  color: #2563eb;
}

.dark .service-title {
  color: #60a5fa;
}

.service-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sub-section {
  border-left: 2px solid #e5e7eb;
  padding-left: 12px;
}

.dark .sub-section {
  border-left-color: #374151;
}

.sub-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sub-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.dark .sub-label {
  color: #aaa;
}

.port-row,
.kv-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.arrow,
.eq {
  color: #888;
  font-weight: bold;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.yaml-preview :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}
</style>
