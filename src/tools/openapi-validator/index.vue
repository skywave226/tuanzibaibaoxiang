<template>
  <div class="openapi-validator">
    <!-- 输入区 -->
    <n-card class="input-card" :bordered="false">
      <div class="card-title">
        <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
        <span>OpenAPI / Swagger 文档</span>
      </div>
      <n-input
        v-model:value="input"
        type="textarea"
        placeholder="粘贴 OpenAPI / Swagger JSON 文档..."
        :rows="10"
      />
      <div class="actions">
        <n-space>
          <n-button size="small" @click="loadSample">载入示例</n-button>
          <n-button size="small" @click="input = ''">清空</n-button>
          <n-button size="small" type="primary" @click="validate">校验</n-button>
        </n-space>
      </div>
    </n-card>

    <!-- 校验结果 -->
    <template v-if="result">
      <!-- 总体状态 -->
      <n-card class="mt-4" :bordered="false">
        <div class="summary">
          <n-tag :type="result.valid ? 'success' : 'error'" size="large" :bordered="false">
            {{ result.valid ? '校验通过' : '校验未通过' }}
          </n-tag>
          <span class="summary-text" v-if="result.doc">
            <strong>{{ result.specName }}</strong>
            <span class="version-tag">{{ result.docVersion }}</span>
          </span>
          <span class="summary-text" v-if="result.endpoints.length > 0">
            共 {{ result.endpoints.length }} 个端点
          </span>
        </div>
      </n-card>

      <!-- 错误项列表 -->
      <n-card v-if="result.errors.length > 0" class="mt-4" :bordered="false">
        <div class="card-title">
          <span class=" title-icon error-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
          <span>错误（{{ result.errors.length }}）</span>
        </div>
        <div class="check-list">
          <div class="check-item error" v-for="(err, i) in result.errors" :key="'e' + i">
            <span class=" check-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></span>
            <span class="check-msg">{{ err }}</span>
          </div>
        </div>
      </n-card>

      <!-- 警告项列表 -->
      <n-card v-if="result.warnings.length > 0" class="mt-4" :bordered="false">
        <div class="card-title">
          <span class=" title-icon warning-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
          <span>警告（{{ result.warnings.length }}）</span>
        </div>
        <div class="check-list">
          <div class="check-item warning" v-for="(warn, i) in result.warnings" :key="'w' + i">
            <span class=" check-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
            <span class="check-msg">{{ warn }}</span>
          </div>
        </div>
      </n-card>

      <!-- API 端点列表 -->
      <n-card v-if="result.endpoints.length > 0" class="mt-4" :bordered="false">
        <div class="card-title">
          <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
          <span>API 端点列表（{{ result.endpoints.length }}）</span>
        </div>

        <!-- 端点筛选 -->
        <div class="filter-bar">
          <n-input v-model:value="endpointFilter" placeholder="按路径或方法筛选..." clearable size="small">
            <template #prefix>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </template>
          </n-input>
        </div>

        <n-data-table
          :columns="endpointColumns"
          :data="filteredEndpoints"
          :bordered="false"
          :single-line="false"
          size="small"
        />
      </n-card>

      <!-- 文档元信息 -->
      <n-card v-if="result.doc" class="mt-4" :bordered="false">
        <div class="card-title">
          <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>
          <span>文档信息</span>
        </div>
        <n-descriptions :column="2" label-placement="left" bordered size="small">
          <n-descriptions-item label="标题">
            {{ result.doc.info?.title || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="版本">
            {{ result.doc.info?.version || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="描述" v-if="result.doc.info?.description">
            {{ result.doc.info.description }}
          </n-descriptions-item>
          <n-descriptions-item label="服务器" v-if="result.doc.servers?.length">
            {{ result.doc.servers.map((s: any) => s.url).join(', ') }}
          </n-descriptions-item>
          <n-descriptions-item label="联系人" v-if="result.doc.info?.contact?.email">
            {{ result.doc.info.contact.email }}
          </n-descriptions-item>
          <n-descriptions-item label="许可证" v-if="result.doc.info?.license?.name">
            {{ result.doc.info.license.name }}
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
    </template>

    <!-- 空状态 -->
    <n-empty v-else-if="!input" description="请输入 OpenAPI / Swagger JSON 文档进行校验" class="mt-8" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NInput, NButton, NCard, NTag, NEmpty, NSpace, NDataTable, NDescriptions, NDescriptionsItem,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface Endpoint {
  method: string
  path: string
  summary: string
  operationId: string
}

interface ValidationResult {
  valid: boolean
  doc: any | null
  docVersion: string
  specName: string
  errors: string[]
  warnings: string[]
  endpoints: Endpoint[]
}

const input = ref('')
const result = ref<ValidationResult | null>(null)
const endpointFilter = ref('')

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']

// 端点列表列定义
const endpointColumns: DataTableColumns<Endpoint> = [
  {
    title: '方法',
    key: 'method',
    width: 90,
    render(row) {
      return h('span',
        { style: `font-weight: 600; color: ${methodColor(row.method)}` },
        row.method
      )
    },
  },
  { title: '路径', key: 'path', ellipsis: { tooltip: true } },
  { title: '说明', key: 'summary', ellipsis: { tooltip: true } },
  { title: 'Operation ID', key: 'operationId', ellipsis: { tooltip: true } },
]

// 方法对应的颜色
function methodColor(method: string): string {
  const map: Record<string, string> = {
    GET: '#18a058',
    POST: '#2080f0',
    PUT: '#f0a020',
    DELETE: '#d03050',
    PATCH: '#8a2be2',
    OPTIONS: '#888',
    HEAD: '#888',
    TRACE: '#888',
  }
  return map[method] || '#333'
}

// 过滤后的端点列表
const filteredEndpoints = computed(() => {
  if (!result.value) return []
  const q = endpointFilter.value.trim().toLowerCase()
  if (!q) return result.value.endpoints
  return result.value.endpoints.filter(
    e => e.path.toLowerCase().includes(q) || e.method.toLowerCase().includes(q)
  )
})

// 校验入口
function validate() {
  if (!input.value.trim()) {
    result.value = null
    return
  }

  const errors: string[] = []
  const warnings: string[] = []
  let doc: any = null

  // 1. JSON 解析
  try {
    doc = JSON.parse(input.value)
  } catch (e) {
    result.value = {
      valid: false,
      doc: null,
      docVersion: '-',
      specName: '-',
      errors: ['JSON 解析失败：' + (e instanceof Error ? e.message : String(e))],
      warnings,
      endpoints: [],
    }
    return
  }

  // 2. 判断规范类型与版本
  let specName = '未知'
  let docVersion = '-'
  if (doc.openapi) {
    specName = 'OpenAPI'
    docVersion = String(doc.openapi)
  } else if (doc.swagger) {
    specName = 'Swagger'
    docVersion = String(doc.swagger)
    warnings.push('Swagger 2.0 已被 OpenAPI 3.0 取代，建议升级到 OpenAPI 3.x')
  } else {
    errors.push('缺少必需字段：未找到 "openapi" 或 "swagger" 版本字段')
  }

  // 3. 校验 info 段
  if (!doc.info) {
    errors.push('缺少必需字段："info" 对象')
  } else {
    if (!doc.info.title) errors.push('缺少必需字段："info.title"')
    if (!doc.info.version) errors.push('缺少必需字段："info.version"')
  }

  // 4. 校验 paths 段
  if (!doc.paths) {
    errors.push('缺少必需字段："paths" 对象')
  } else if (typeof doc.paths !== 'object') {
    errors.push('"paths" 必须是对象')
  } else {
    const pathKeys = Object.keys(doc.paths)
    if (pathKeys.length === 0) {
      warnings.push('"paths" 对象为空，未定义任何端点')
    }
    // 校验每个路径
    pathKeys.forEach(p => {
      if (!p.startsWith('/')) {
        warnings.push(`路径 "${p}" 应以 "/" 开头`)
      }
      const pathItem = doc.paths[p]
      if (typeof pathItem !== 'object' || pathItem === null) {
        warnings.push(`路径 "${p}" 的值不是对象`)
      }
    })
  }

  // 5. OpenAPI 3.x 额外建议
  if (doc.openapi && doc.openapi.startsWith('3.')) {
    if (doc.paths && !doc.components) {
      // components 非必需，但建议存在
    }
  }

  // 6. 收集所有端点
  const endpoints: Endpoint[] = []
  if (doc.paths && typeof doc.paths === 'object') {
    Object.keys(doc.paths).forEach(path => {
      const pathItem = doc.paths[path]
      if (typeof pathItem !== 'object' || pathItem === null) return
      Object.keys(pathItem).forEach(method => {
        if (HTTP_METHODS.includes(method.toLowerCase())) {
          const op = pathItem[method]
          if (typeof op === 'object' && op !== null) {
            endpoints.push({
              method: method.toUpperCase(),
              path,
              summary: op.summary || op.description || '',
              operationId: op.operationId || '',
            })
          }
        }
      })
    })
  }

  result.value = {
    valid: errors.length === 0,
    doc,
    docVersion,
    specName,
    errors,
    warnings,
    endpoints,
  }
}

// 载入示例
function loadSample() {
  input.value = JSON.stringify({
    openapi: '3.0.0',
    info: {
      title: '示例 API',
      version: '1.0.0',
      description: '一个示例的 OpenAPI 文档',
    },
    servers: [
      { url: 'https://api.example.com/v1' },
    ],
    paths: {
      '/users': {
        get: {
          summary: '获取用户列表',
          operationId: 'listUsers',
          responses: { '200': { description: '成功' } },
        },
        post: {
          summary: '创建用户',
          operationId: 'createUser',
          responses: { '201': { description: '创建成功' } },
        },
      },
      '/users/{id}': {
        get: {
          summary: '获取单个用户',
          operationId: 'getUser',
          responses: { '200': { description: '成功' } },
        },
        delete: {
          summary: '删除用户',
          operationId: 'deleteUser',
          responses: { '204': { description: '删除成功' } },
        },
      },
    },
  }, null, 2)
}
</script>

<style scoped>
.openapi-validator {
  max-width: 1000px;
  margin: 0 auto;
}

.mt-4 {
  margin-top: 16px;
}

.mt-8 {
  margin-top: 32px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.title-icon {
  font-size: 18px;
  color: #18a058;
}

.error-icon {
  color: #d03050;
}

.warning-icon {
  color: #f0a020;
}

.actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.summary {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.summary-text {
  font-size: 14px;
  color: #666;
}

.version-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: rgba(32, 128, 240, 0.1);
  color: #2080f0;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Fira Code', 'Consolas', monospace;
}

/* 校验项列表 */
.check-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
}

.check-item.error {
  background: rgba(208, 48, 80, 0.06);
  color: #d03050;
}

.check-item.warning {
  background: rgba(240, 160, 32, 0.06);
  color: #b07810;
}

.check-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.check-msg {
  flex: 1;
}

/* 端点筛选 */
.filter-bar {
  margin-bottom: 12px;
  max-width: 320px;
}
</style>
