<template>
  <div class="nginx-config-gen">
    <n-alert type="info" class="mb-4">
      可视化生成 Nginx 配置文件，支持静态站点、反向代理、HTTPS 等常用模板。所有数据仅在浏览器本地处理。
    </n-alert>

    <!-- 模板选择 -->
    <div class="card mb-4">
      <div class="pane-label mb-3">配置模板</div>
      <n-radio-group v-model:value="template" class="template-group">
        <n-radio-button value="static">静态站点</n-radio-button>
        <n-radio-button value="proxy">反向代理</n-radio-button>
        <n-radio-button value="https">HTTPS 站点</n-radio-button>
        <n-radio-button value="php">PHP 应用</n-radio-button>
      </n-radio-group>
    </div>

    <!-- 表单输入 -->
    <div class="card mb-4">
      <div class="pane-label mb-3">基础配置</div>
      <n-form label-placement="left" label-width="120px" require-mark-placement="right">
        <div class="form-grid">
          <n-form-item label="监听端口" path="port">
            <n-input-number v-model:value="form.port" :min="1" :max="65535" style="width: 100%" />
          </n-form-item>
          <n-form-item label="域名" path="serverName">
            <n-input v-model:value="form.serverName" placeholder="example.com" />
          </n-form-item>
          <n-form-item label="根目录" path="root" v-if="showRoot">
            <n-input v-model:value="form.root" placeholder="/var/www/html" />
          </n-form-item>
          <n-form-item label="索引文件" path="index" v-if="showRoot">
            <n-input v-model:value="form.index" placeholder="index.html index.htm" />
          </n-form-item>
          <n-form-item label="反向代理目标" path="proxyPass" v-if="showProxy">
            <n-input v-model:value="form.proxyPass" placeholder="http://127.0.0.1:8080" />
          </n-form-item>
          <n-form-item label="SSL 证书路径" path="sslCert" v-if="showSsl">
            <n-input v-model:value="form.sslCert" placeholder="/etc/letsencrypt/live/example.com/fullchain.pem" />
          </n-form-item>
          <n-form-item label="SSL 私钥路径" path="sslKey" v-if="showSsl">
            <n-input v-model:value="form.sslKey" placeholder="/etc/letsencrypt/live/example.com/privkey.pem" />
          </n-form-item>
          <n-form-item label="监听端口(SSL)" path="sslPort" v-if="showSsl">
            <n-input-number v-model:value="form.sslPort" :min="1" :max="65535" style="width: 100%" />
          </n-form-item>
          <n-form-item label="上传大小限制" path="clientMaxBodySize">
            <n-input v-model:value="form.clientMaxBodySize" placeholder="20m" />
          </n-form-item>
        </div>

        <!-- 高级选项 -->
        <n-divider title-placement="left">高级选项</n-divider>
        <div class="advanced-grid">
          <n-form-item label="Gzip 压缩">
            <n-switch v-model:value="form.gzip" />
          </n-form-item>
          <n-form-item label="HTTPS 跳转">
            <n-switch v-model:value="form.httpsRedirect" v-if="showSsl" />
          </n-form-item>
          <n-form-item label="日志记录">
            <n-switch v-model:value="form.accessLog" />
          </n-form-item>
        </div>

        <n-form-item label="自定义 location" v-if="form.advancedLocation">
          <n-input
            v-model:value="form.customLocation"
            type="textarea"
            :rows="4"
            placeholder="# 可在此添加自定义 location 块"
          />
        </n-form-item>
      </n-form>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar mb-3">
      <n-space>
        <n-button type="primary" @click="generate">生成配置</n-button>
        <n-button @click="copyConfig" :disabled="!config">复制配置</n-button>
        <n-button @click="downloadConfig" :disabled="!config">下载文件</n-button>
        <n-button @click="resetForm">重置</n-button>
      </n-space>
    </div>

    <!-- 预览结果 -->
    <div class="card" v-if="config">
      <div class="result-header mb-2">
        <span class="pane-label">nginx.conf 预览</span>
        <n-tag size="small" :bordered="false" type="info">{{ configLines }} 行</n-tag>
      </div>
      <n-input
        :value="config"
        type="textarea"
        readonly
        :rows="22"
        :autosize="false"
        class="config-preview"
      />
    </div>
    <div class="card" v-else>
      <n-empty description="选择模板并填写配置后，点击「生成配置」按钮" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NAlert, NForm, NFormItem, NInput, NInputNumber, NRadioGroup, NRadioButton,
  NButton, NSwitch, NTag, NEmpty, NDivider, NSpace, useMessage,
} from 'naive-ui'

const message = useMessage()

// 配置模板类型
type TemplateType = 'static' | 'proxy' | 'https' | 'php'

// 表单数据结构
interface NginxForm {
  port: number
  serverName: string
  root: string
  index: string
  proxyPass: string
  sslCert: string
  sslKey: string
  sslPort: number
  clientMaxBodySize: string
  gzip: boolean
  httpsRedirect: boolean
  accessLog: boolean
  advancedLocation: boolean
  customLocation: string
}

const template = ref<TemplateType>('static')

const form = ref<NginxForm>({
  port: 80,
  serverName: 'example.com',
  root: '/var/www/html',
  index: 'index.html index.htm',
  proxyPass: 'http://127.0.0.1:8080',
  sslCert: '/etc/letsencrypt/live/example.com/fullchain.pem',
  sslKey: '/etc/letsencrypt/live/example.com/privkey.pem',
  sslPort: 443,
  clientMaxBodySize: '20m',
  gzip: true,
  httpsRedirect: true,
  accessLog: true,
  advancedLocation: false,
  customLocation: '',
})

// 根据模板决定显示哪些字段
const showRoot = computed(() => template.value === 'static' || template.value === 'https' || template.value === 'php')
const showProxy = computed(() => template.value === 'proxy')
const showSsl = computed(() => template.value === 'https')

const config = ref('')

// 行数统计
const configLines = computed(() => config.value.split('\n').length)

// 生成 Gzip 配置块
function genGzip(): string {
  if (!form.value.gzip) return ''
  return `    # 开启 Gzip 压缩
    gzip on;
    gzip_min_length 1k;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/javascript application/javascript application/json application/xml;
    gzip_vary on;
    gzip_proxied any;`
}

// 生成反向代理 location 块
function genProxyLocation(): string {
  const pass = form.value.proxyPass || 'http://127.0.0.1:8080'
  return `    location / {
        proxy_pass ${pass};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }`
}

// 生成静态站点 location 块
function genStaticLocation(): string {
  return `    location / {
        root ${form.value.root};
        index ${form.value.index};
        try_files $uri $uri/ =404;
    }

    # 静态资源缓存
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root ${form.value.root};
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # 禁止访问隐藏文件
    location ~ /\\. {
        deny all;
    }`
}

// 生成 PHP 应用 location 块
function genPhpLocation(): string {
  return `    root ${form.value.root};
    index ${form.value.index};

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }`
}

// 生成配置文件
function generate(): void {
  const f = form.value
  const lines: string[] = []

  lines.push('# Nginx 配置文件')
  lines.push('# 由 Nginx 配置生成工具生成')
  lines.push('server {')

  // HTTPS 跳转
  if (showSsl.value && f.httpsRedirect) {
    lines.push(`    listen ${f.port};`)
    lines.push(`    server_name ${f.serverName};`)
    lines.push('    return 301 https://$host:' + f.sslPort + '$request_uri;')
    lines.push('}')
    lines.push('')
    lines.push('server {')
  }

  // 监听端口
  if (showSsl.value) {
    lines.push(`    listen ${f.sslPort} ssl;`)
    lines.push('    http2 on;')
  } else {
    lines.push(`    listen ${f.port};`)
  }

  lines.push(`    server_name ${f.serverName};`)

  // 日志
  if (f.accessLog) {
    lines.push(`    access_log /var/log/nginx/${f.serverName}.access.log;`)
    lines.push(`    error_log /var/log/nginx/${f.serverName}.error.log;`)
  }

  // 客户端大小限制
  if (f.clientMaxBodySize) {
    lines.push(`    client_max_body_size ${f.clientMaxBodySize};`)
  }

  // SSL 配置
  if (showSsl.value) {
    lines.push('')
    lines.push('    # SSL 配置')
    lines.push(`    ssl_certificate ${f.sslCert};`)
    lines.push(`    ssl_certificate_key ${f.sslKey};`)
    lines.push('    ssl_protocols TLSv1.2 TLSv1.3;')
    lines.push('    ssl_ciphers HIGH:!aNULL:!MD5;')
    lines.push('    ssl_prefer_server_ciphers on;')
    lines.push('    ssl_session_cache shared:SSL:10m;')
    lines.push('    ssl_session_timeout 10m;')
  }

  // Gzip
  const gzipBlock = genGzip()
  if (gzipBlock) {
    lines.push('')
    lines.push(gzipBlock)
  }

  // location 块
  lines.push('')
  if (showProxy.value) {
    lines.push(genProxyLocation())
  } else if (template.value === 'php') {
    lines.push(genPhpLocation())
  } else {
    lines.push(genStaticLocation())
  }

  // 自定义 location
  if (f.advancedLocation && f.customLocation.trim()) {
    lines.push('')
    lines.push('    # 自定义配置')
    lines.push(f.customLocation.trim().split('\n').map(l => '    ' + l).join('\n'))
  }

  lines.push('}')
  lines.push('')

  config.value = lines.join('\n')
  message.success('配置已生成')
}

// 复制配置
async function copyConfig(): Promise<void> {
  if (!config.value) return
  try {
    await navigator.clipboard.writeText(config.value)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败，请手动复制')
  }
}

// 下载配置文件
function downloadConfig(): void {
  if (!config.value) return
  const blob = new Blob([config.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nginx.conf'
  a.click()
  URL.revokeObjectURL(url)
  message.success('已开始下载')
}

// 重置表单
function resetForm(): void {
  form.value = {
    port: 80,
    serverName: 'example.com',
    root: '/var/www/html',
    index: 'index.html index.htm',
    proxyPass: 'http://127.0.0.1:8080',
    sslCert: '/etc/letsencrypt/live/example.com/fullchain.pem',
    sslKey: '/etc/letsencrypt/live/example.com/privkey.pem',
    sslPort: 443,
    clientMaxBodySize: '20m',
    gzip: true,
    httpsRedirect: true,
    accessLog: true,
    advancedLocation: false,
    customLocation: '',
  }
  config.value = ''
  message.info('已重置')
}
</script>

<style scoped>
.nginx-config-gen {
  max-width: 1000px;
  margin: 0 auto;
}

.template-group {
  display: flex;
  flex-wrap: wrap;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 24px;
}

.advanced-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0 24px;
}

@media (max-width: 768px) {
  .form-grid,
  .advanced-grid {
    grid-template-columns: 1fr;
  }
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-preview :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}
</style>
