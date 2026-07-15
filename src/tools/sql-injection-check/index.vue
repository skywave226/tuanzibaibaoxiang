<template>
  <div class="sql-injection-check">
    <!-- 输入区 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">输入 SQL 语句或用户输入</div>
      <n-input
        v-model:value="input"
        type="textarea"
        placeholder="例如：admin' OR '1'='1' --"
        :rows="6"
        :autosize="false"
      />
      <div class="toolbar mt-3">
        <n-button type="primary" @click="detect">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
          开始检测
        </n-button>
        <n-button @click="clear">清空</n-button>
        <n-button @click="loadExample">加载示例</n-button>
      </div>
    </div>

    <!-- 检测结果区 -->
    <div class="card" v-if="detected">
      <!-- 风险概要 -->
      <div class="risk-summary">
        <div class="risk-level">
          <span class="risk-label">风险等级：</span>
          <n-tag :type="riskTagType" size="large" round :bordered="false">
            {{ riskLevelText }}
          </n-tag>
        </div>
        <div class="risk-stats">
          共检测到 <strong>{{ risks.length }}</strong> 个风险点
        </div>
      </div>

      <!-- 详细风险点列表 -->
      <div class="risks-list mt-4" v-if="risks.length > 0">
        <div class="pane-label mb-2">详细风险点</div>
        <div
          v-for="(risk, index) in risks"
          :key="index"
          class="risk-item"
          :class="risk.level"
        >
          <div class="risk-item-header">
            <n-tag :type="levelTagType(risk.level)" size="small" :bordered="false">
              {{ levelText(risk.level) }}
            </n-tag>
            <span class="risk-title">{{ risk.title }}</span>
          </div>
          <div class="risk-detail">
            <div class="detail-row">
              <span class="detail-label">匹配内容：</span>
              <code class="match-content">{{ risk.match }}</code>
            </div>
            <div class="detail-row">
              <span class="detail-label">说明：</span>
              <span>{{ risk.description }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">修复建议：</span>
              <span class="suggestion">{{ risk.suggestion }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 安全提示 -->
      <div class="safe-tip mt-4" v-else>
        <n-empty description="未检测到明显的 SQL 注入风险特征" />
      </div>

      <!-- 通用防护建议 -->
      <div class="general-tips mt-4" v-if="risks.length > 0">
        <div class="pane-label mb-2">通用防护建议</div>
        <n-list :bordered="false">
          <n-list-item>使用参数化查询（预编译语句）而非字符串拼接 SQL。</n-list-item>
          <n-list-item>对所有用户输入进行严格的类型与长度校验，拒绝非法字符。</n-list-item>
          <n-list-item>数据库账号遵循最小权限原则，避免应用账号具备 DROP / EXEC 等高危权限。</n-list-item>
          <n-list-item>对输出进行转义，并启用 WAF 规则拦截常见注入特征。</n-list-item>
        </n-list>
      </div>
    </div>

    <!-- 规则说明 -->
    <div class="card mt-4">
      <div class="pane-label mb-2">检测规则说明</div>
      <n-list :bordered="false" size="small">
        <n-list-item>① 单引号未闭合：奇数个单引号可能用于提前闭合字符串。</n-list-item>
        <n-list-item>② SQL 注释符：-- / # / /* */ 常用于注释掉后续合法语句。</n-list-item>
        <n-list-item>③ UNION SELECT 等危险关键字：用于拼接恶意查询结果。</n-list-item>
        <n-list-item>④ OR 1=1 / AND 1=1 永真条件：绕过身份验证与查询逻辑。</n-list-item>
        <n-list-item>⑤ 堆叠注入：分号后跟新语句以执行多条 SQL。</n-list-item>
        <n-list-item>⑥ EXEC / xp_cmdshell 等危险函数：执行系统命令或动态 SQL。</n-list-item>
      </n-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NTag, NList, NListItem, NEmpty } from 'naive-ui'

// 风险等级类型
type RiskLevel = 'high' | 'medium' | 'low'

// 单个风险项
interface RiskItem {
  level: RiskLevel
  title: string
  match: string
  description: string
  suggestion: string
}

const input = ref('')
const detected = ref(false)
const risks = ref<RiskItem[]>([])

// 计算总体风险等级文字
const riskLevelText = computed(() => {
  if (risks.value.length === 0) return '安全'
  if (risks.value.some(r => r.level === 'high')) return '高风险'
  if (risks.value.some(r => r.level === 'medium')) return '中风险'
  return '低风险'
})

// 计算总体风险标签类型
const riskTagType = computed<'default' | 'success' | 'warning' | 'error'>(() => {
  if (risks.value.length === 0) return 'success'
  if (risks.value.some(r => r.level === 'high')) return 'error'
  if (risks.value.some(r => r.level === 'medium')) return 'warning'
  return 'default'
})

// 单条风险等级文字
function levelText(level: RiskLevel) {
  return level === 'high' ? '高风险' : level === 'medium' ? '中风险' : '低风险'
}

// 单条风险标签类型
function levelTagType(level: RiskLevel): 'error' | 'warning' | 'default' {
  return level === 'high' ? 'error' : level === 'medium' ? 'warning' : 'default'
}

// 添加风险项的辅助函数
function addRisk(level: RiskLevel, title: string, match: string, description: string, suggestion: string) {
  risks.value.push({ level, title, match, description, suggestion })
}

// 核心检测函数
function detect() {
  detected.value = true
  risks.value = []
  const text = input.value
  if (!text.trim()) return

  // 1. 单引号未闭合
  const singleQuotes = (text.match(/'/g) || []).length
  if (singleQuotes % 2 !== 0) {
    addRisk(
      'medium',
      '单引号未闭合',
      "'",
      '输入中包含奇数个单引号，可能用于提前闭合字符串并注入后续恶意代码。',
      '使用参数化查询，或对单引号进行转义（替换为两个单引号 \'\'）。',
    )
  }

  // 2. SQL 注释符
  if (/--/.test(text)) {
    addRisk(
      'medium',
      '包含行注释符 --',
      '--',
      '输入中包含 SQL 行注释符 --，常用于注释掉后续的合法 SQL 语句。',
      '使用参数化查询；对用户输入过滤注释符。',
    )
  }
  if (/#/.test(text)) {
    addRisk(
      'medium',
      '包含行注释符 #',
      '#',
      '输入中包含 MySQL 行注释符 #，常用于注释掉后续语句。',
      '使用参数化查询；对用户输入过滤注释符。',
    )
  }
  if (/\/\*/.test(text) && /\*\//.test(text)) {
    addRisk(
      'medium',
      '包含块注释符 /* */',
      '/* ... */',
      '输入中包含 SQL 块注释符，可用于绕过简单的关键字过滤。',
      '使用参数化查询；对用户输入过滤注释符。',
    )
  }

  // 3. UNION SELECT 等危险关键字
  const unionMatch = text.match(/union\s+(all\s+)?select/i)
  if (unionMatch) {
    addRisk(
      'high',
      'UNION SELECT 注入',
      unionMatch[0],
      'UNION SELECT 用于在原查询结果上拼接攻击者自定义的查询结果，是数据泄露的常用手段。',
      '使用参数化查询；限制数据库账号对敏感表 / 字段的访问权限。',
    )
  }

  // 其他危险关键字
  const dangerousKeywords: Array<{ kw: RegExp; name: string; desc: string }> = [
    { kw: /\bdrop\s+table\b/i, name: 'DROP TABLE', desc: '删除数据库表，可造成数据永久丢失。' },
    { kw: /\bdrop\s+database\b/i, name: 'DROP DATABASE', desc: '删除整个数据库，极具破坏性。' },
    { kw: /\btruncate\s+table\b/i, name: 'TRUNCATE TABLE', desc: '清空表数据，不可回滚。' },
    { kw: /\bdelete\s+from\b/i, name: 'DELETE FROM', desc: '删除表数据，可能导致数据丢失。' },
    { kw: /\binsert\s+into\b/i, name: 'INSERT INTO', desc: '向表中插入数据，可能用于添加恶意记录。' },
    { kw: /\bupdate\s+\w+\s+set\b/i, name: 'UPDATE SET', desc: '修改表数据，可能篡改关键数据。' },
  ]
  for (const item of dangerousKeywords) {
    const m = text.match(item.kw)
    if (m) {
      addRisk(
        'high',
        `危险关键字：${item.name}`,
        m[0],
        item.desc,
        '使用参数化查询；严格校验用户输入；数据库账号遵循最小权限原则。',
      )
    }
  }

  // 4. OR 1=1 / AND 1=1 永真条件
  const tautologyMatch = text.match(/\b(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i)
  if (tautologyMatch) {
    addRisk(
      'high',
      '永真条件注入',
      tautologyMatch[0],
      '通过 OR 1=1 / AND 1=1 等永真条件绕过身份验证或改变查询逻辑。',
      '使用参数化查询；对登录类查询使用白名单匹配而非动态拼接。',
    )
  }
  const strEqualMatch = text.match(/\b(or|and)\s+['"][^'"]+['"]\s*=\s*['"][^'"]+['"]/i)
  if (strEqualMatch) {
    addRisk(
      'medium',
      '字符串恒等条件',
      strEqualMatch[0],
      '通过 OR \'a\'=\'a\' 等恒等条件绕过验证。',
      '使用参数化查询；对字符串输入进行转义与校验。',
    )
  }

  // 5. 堆叠注入（分号后跟新语句）
  const stackedMatch = text.match(/;\s*(select|insert|update|delete|drop|truncate|exec|create|alter|grant)\b/i)
  if (stackedMatch) {
    addRisk(
      'high',
      '堆叠注入',
      stackedMatch[0],
      '分号后跟新的 SQL 语句，可能执行多条语句造成严重后果。',
      '使用参数化查询；数据库驱动禁用多语句执行；严格校验输入。',
    )
  }

  // 6. EXEC / xp_cmdshell 等危险函数
  const dangerousFunctions: Array<{ fn: RegExp; name: string; desc: string }> = [
    { fn: /xp_cmdshell/i, name: 'xp_cmdshell', desc: '可执行操作系统命令，危害极大。' },
    { fn: /\bexec(ute)?\s*\(/i, name: 'EXEC()', desc: '执行存储过程或动态 SQL。' },
    { fn: /sp_executesql/i, name: 'sp_executesql', desc: '执行动态 SQL 语句。' },
    { fn: /load_file\s*\(/i, name: 'LOAD_FILE()', desc: '读取服务器文件。' },
    { fn: /into\s+outfile/i, name: 'INTO OUTFILE', desc: '将查询结果写入文件，可能写入 Webshell。' },
    { fn: /benchmark\s*\(/i, name: 'BENCHMARK()', desc: '用于盲注延时与负载测试。' },
    { fn: /sleep\s*\(/i, name: 'SLEEP()', desc: '用于基于时间的盲注探测。' },
  ]
  for (const item of dangerousFunctions) {
    const m = text.match(item.fn)
    if (m) {
      addRisk(
        'high',
        `危险函数：${item.name}`,
        m[0],
        item.desc,
        '使用参数化查询；数据库账号禁用 / 限制此类函数与扩展存储过程的执行权限。',
      )
    }
  }
}

// 清空输入与结果
function clear() {
  input.value = ''
  detected.value = false
  risks.value = []
}

// 加载示例
function loadExample() {
  input.value = "admin' OR '1'='1' --"
  detect()
}
</script>

<style scoped>
.sql-injection-check {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.dark .pane-label {
  color: #aaa;
}

.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 风险概要 */
.risk-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.risk-level {
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-label {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.dark .risk-label {
  color: #e0e0e0;
}

.risk-stats {
  font-size: 14px;
  color: #666;
}

.dark .risk-stats {
  color: #aaa;
}

.risk-stats strong {
  color: #ff4d4f;
  font-size: 16px;
}

/* 风险项卡片 */
.risk-item {
  padding: 12px 14px;
  margin-bottom: 10px;
  border-radius: 8px;
  border-left: 4px solid #d9d9d9;
  background: #fafafa;
}

.dark .risk-item {
  background: #1e1e2e;
}

.risk-item.high {
  border-left-color: #ff4d4f;
  background: #fff1f0;
}

.dark .risk-item.high {
  background: #2a1a1a;
}

.risk-item.medium {
  border-left-color: #faad14;
  background: #fffbe6;
}

.dark .risk-item.medium {
  background: #2a2616;
}

.risk-item.low {
  border-left-color: #1890ff;
  background: #e6f7ff;
}

.dark .risk-item.low {
  background: #16243a;
}

.risk-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.risk-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.dark .risk-title {
  color: #e0e0e0;
}

.risk-detail {
  font-size: 13px;
  color: #555;
  line-height: 1.7;
}

.dark .risk-detail {
  color: #bbb;
}

.detail-row {
  margin-bottom: 4px;
}

.detail-label {
  font-weight: 500;
  color: #888;
}

.dark .detail-label {
  color: #999;
}

.match-content {
  display: inline-block;
  padding: 1px 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 12px;
  color: #c41d7f;
  word-break: break-all;
}

.dark .match-content {
  background: rgba(255, 255, 255, 0.1);
  color: #ff85c0;
}

.suggestion {
  color: #389e0d;
}

.dark .suggestion {
  color: #95de64;
}

.safe-tip {
  padding: 24px 0;
}
</style>
