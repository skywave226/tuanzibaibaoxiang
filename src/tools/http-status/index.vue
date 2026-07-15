<template>
  <div class="http-status">
    <div class="search-section">
      <n-input
        v-model:value="searchQuery"
        placeholder="输入状态码或关键词搜索，如 404、重定向..."
        clearable
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
    </div>

    <div class="filter-section">
      <n-radio-group v-model:value="selectedCategory" name="category">
        <n-radio-button value="all">全部</n-radio-button>
        <n-radio-button value="1xx">1xx 信息</n-radio-button>
        <n-radio-button value="2xx">2xx 成功</n-radio-button>
        <n-radio-button value="3xx">3xx 重定向</n-radio-button>
        <n-radio-button value="4xx">4xx 客户端错误</n-radio-button>
        <n-radio-button value="5xx">5xx 服务器错误</n-radio-button>
      </n-radio-group>
    </div>

    <div class="status-list">
      <n-collapse>
        <n-collapse-item
          v-for="status in filteredStatuses"
          :key="status.code"
          :title="`${status.code} ${status.name}`"
          :name="status.code"
        >
          <template #header-extra>
            <n-tag :type="getCategoryType(status.code)" size="small">
              {{ getCategoryLabel(status.code) }}
            </n-tag>
          </template>
          <div class="status-detail">
            <div class="detail-section">
              <div class="detail-label">描述</div>
              <div class="detail-content">{{ status.description }}</div>
            </div>
            <div class="detail-section" v-if="status.commonCauses">
              <div class="detail-label">常见原因</div>
              <div class="detail-content">{{ status.commonCauses }}</div>
            </div>
            <div class="detail-section" v-if="status.solutions">
              <div class="detail-label">解决方法</div>
              <div class="detail-content">{{ status.solutions }}</div>
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>

      <n-empty v-if="filteredStatuses.length === 0" description="未找到匹配的状态码" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NRadioGroup, NRadioButton, NCollapse, NCollapseItem, NTag, NEmpty } from 'naive-ui'

interface HttpStatus {
  code: number
  name: string
  description: string
  commonCauses?: string
  solutions?: string
}

const searchQuery = ref('')
const selectedCategory = ref('all')

const statusCodes: HttpStatus[] = [
  // 1xx 信息
  { code: 100, name: 'Continue', description: '客户端应当继续发送请求。这个临时响应是用来通知客户端它的部分请求已经被服务器接收，且它应当继续发送请求的其余部分。' },
  { code: 101, name: 'Switching Protocols', description: '服务器已经理解了客户端的请求，并将通过 Upgrade 消息头通知客户端采用不同的协议来完成这个请求。' },

  // 2xx 成功
  { code: 200, name: 'OK', description: '请求成功。请求所希望的响应头或数据体将随此响应返回。' },
  { code: 201, name: 'Created', description: '请求已经被实现，而且有一个新的资源已经依据请求的需要而建立，且其 URI 已经随 Location 头信息返回。' },
  { code: 202, name: 'Accepted', description: '服务器已接受请求，但尚未处理。正如它可能被拒绝一样，也可能当处理发生时才被允许。' },
  { code: 204, name: 'No Content', description: '服务器成功处理了请求，但不需要返回任何实体内容。' },

  // 3xx 重定向
  { code: 301, name: 'Moved Permanently', description: '被请求的资源已永久移动到新位置，并且将来任何对此资源的引用都应该使用本响应返回的若干个 URI 之一。', commonCauses: '域名更换、URL 结构变更', solutions: '更新所有指向旧 URL 的链接' },
  { code: 302, name: 'Found', description: '请求的资源现在临时从不同的 URI 响应请求。由于这样的重定向是临时的，客户端应当继续向原有地址发送以后的请求。', commonCauses: '临时跳转、登录后重定向', solutions: '检查 Location 头中的目标地址' },
  { code: 304, name: 'Not Modified', description: '如果客户端发送了一个带条件的 GET 请求且该请求已被允许，而文档的内容（自上次访问以来或者根据请求的条件）并没有改变，则服务器应当返回这个状态码。', commonCauses: '浏览器缓存命中', solutions: '正常现象，无需处理' },

  // 4xx 客户端错误
  { code: 400, name: 'Bad Request', description: '由于明显的客户端错误（例如，请求语法有误，无效的请求消息帧，或具有欺骗性的路由），服务器不能或不会处理该请求。', commonCauses: '请求参数错误、JSON 格式错误、必填字段缺失', solutions: '检查请求格式、验证参数、查看 API 文档' },
  { code: 401, name: 'Unauthorized', description: '未授权。请求要求用户的身份认证。', commonCauses: '未登录、Token 过期、认证信息错误', solutions: '检查认证信息、重新登录、刷新 Token' },
  { code: 403, name: 'Forbidden', description: '服务器理解请求，但拒绝授权。与 401 不同的是，重新认证不会有任何帮助。', commonCauses: '权限不足、IP 被禁止、资源受保护', solutions: '联系管理员获取权限、检查访问控制策略' },
  { code: 404, name: 'Not Found', description: '服务器找不到请求的资源。', commonCauses: 'URL 错误、资源已删除、路径拼写错误', solutions: '检查 URL 是否正确、确认资源是否存在' },
  { code: 405, name: 'Method Not Allowed', description: '请求行中指定的请求方法不能被用于请求相应的资源。', commonCauses: '使用了错误的 HTTP 方法（如用 GET 请求 POST 接口）', solutions: '检查 API 文档，使用正确的 HTTP 方法' },
  { code: 408, name: 'Request Timeout', description: '请求超时。客户端未在服务器预备等待的时间内产生一个请求。', commonCauses: '网络慢、请求数据过大、服务器负载高', solutions: '检查网络连接、减小请求数据量、重试' },
  { code: 429, name: 'Too Many Requests', description: '用户在给定的时间内发送了太多请求（"限制请求速率"）。', commonCauses: '请求过于频繁、触发 API 限流', solutions: '等待一段时间后重试、实现请求队列、降低请求频率' },

  // 5xx 服务器错误
  { code: 500, name: 'Internal Server Error', description: '服务器遇到了一个未曾预料的状况，导致了它无法完成对请求的处理。', commonCauses: '代码异常、数据库连接失败、配置错误', solutions: '查看服务器日志、联系管理员、稍后重试' },
  { code: 502, name: 'Bad Gateway', description: '作为网关或代理工作的服务器从上游服务器接收到无效的响应。', commonCauses: '上游服务器宕机、网络问题、配置错误', solutions: '检查上游服务、重启服务、联系运维' },
  { code: 503, name: 'Service Unavailable', description: '服务器目前无法处理请求。这种情况通常是暂时的，由于服务器维护或过载。', commonCauses: '服务器维护、服务过载、部署中', solutions: '等待几分钟后重试、查看服务状态页' },
  { code: 504, name: 'Gateway Timeout', description: '作为网关或代理的服务器未及时从上游服务器接收请求。', commonCauses: '上游服务响应慢、网络延迟、超时设置过短', solutions: '优化上游服务性能、增加超时时间、联系运维' },
]

const filteredStatuses = computed(() => {
  let result = statusCodes

  // 按分类过滤
  if (selectedCategory.value !== 'all') {
    const category = selectedCategory.value
    result = result.filter(s => {
      const codeStr = s.code.toString()
      return codeStr.startsWith(category.charAt(0))
    })
  }

  // 按搜索词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s =>
      s.code.toString().includes(query) ||
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query)
    )
  }

  return result
})

function getCategoryType(code: number): 'default' | 'info' | 'success' | 'warning' | 'error' {
  if (code < 200) return 'info'
  if (code < 300) return 'success'
  if (code < 400) return 'warning'
  if (code < 500) return 'error'
  return 'error'
}

function getCategoryLabel(code: number): string {
  if (code < 200) return '信息'
  if (code < 300) return '成功'
  if (code < 400) return '重定向'
  if (code < 500) return '客户端错误'
  return '服务器错误'
}
</script>

<style scoped>
.http-status {
  max-width: 1000px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.status-list {
  margin-top: 20px;
}

.status-detail {
  padding: 12px 0;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #666;
}

.detail-content {
  line-height: 1.6;
  color: #333;
}

:deep(.n-collapse-item__header-main) {
  font-weight: 600;
}
</style>
