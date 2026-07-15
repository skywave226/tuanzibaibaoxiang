<template>
  <div class="redis-ref">
    <!-- 顶部搜索框 -->
    <div class="search-section">
      <n-input
        v-model:value="searchQuery"
        placeholder="按命令名或描述搜索，如 SET、设置过期..."
        clearable
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
    </div>

    <div class="layout">
      <!-- 侧边分类导航 -->
      <aside class="sidebar">
        <div class="sidebar-title">命令分类</div>
        <nav class="nav-list">
          <button
            v-for="cat in categories"
            :key="cat.key"
            class="nav-item"
            :class="{ active: selectedCategory === cat.key }"
            @click="selectCategory(cat.key)"
          >
            <span class="nav-label">{{ cat.label }}</span>
            <span class="nav-count">{{ countOfCategory(cat.key) }}</span>
          </button>
        </nav>
      </aside>

      <!-- 主区域：命令卡片 -->
      <main class="main">
        <div class="main-header">
          <span class="result-title">{{ currentCategoryLabel }}</span>
          <n-tag size="small" :bordered="false">{{ filteredCommands.length }} 条</n-tag>
        </div>

        <n-empty
          v-if="filteredCommands.length === 0"
          description="未找到匹配的命令"
        />

        <div class="cards">
          <article
            v-for="cmd in filteredCommands"
            :key="cmd.name"
            class="command-card"
          >
            <div class="card-header">
              <span class="cmd-name">{{ cmd.name }}</span>
              <n-tag size="small" :type="categoryTagType(cmd.category)">
                {{ categoryShortLabel(cmd.category) }}
              </n-tag>
            </div>

            <div class="card-section">
              <div class="section-label">语法</div>
              <pre class="code-block">{{ cmd.syntax }}</pre>
            </div>

            <div class="card-section">
              <div class="section-label">描述</div>
              <div class="section-text">{{ cmd.description }}</div>
            </div>

            <div class="card-section">
              <div class="section-label">示例</div>
              <div class="example-row">
                <pre class="code-block">{{ cmd.example }}</pre>
                <n-button text size="tiny" @click="copyExample(cmd.example)">复制</n-button>
              </div>
            </div>

            <div class="card-section">
              <div class="section-label">返回值</div>
              <div class="section-text">{{ cmd.returns }}</div>
            </div>
          </article>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NTag, NEmpty, NButton, useMessage } from 'naive-ui'

// 消息提示
const message = useMessage()

// 命令结构定义
interface RedisCommand {
  name: string
  category: string
  syntax: string
  description: string
  example: string
  returns: string
}

// 分类定义
const categories = [
  { key: 'all', label: '全部' },
  { key: 'string', label: 'String 字符串' },
  { key: 'hash', label: 'Hash 哈希' },
  { key: 'list', label: 'List 列表' },
  { key: 'set', label: 'Set 集合' },
  { key: 'zset', label: 'Sorted Set 有序集合' },
  { key: 'key', label: 'Key 键' },
  { key: 'server', label: 'Server 服务器' },
  { key: 'connection', label: 'Connection 连接' },
]

// 分类短标签
const shortLabels: Record<string, string> = {
  string: 'String',
  hash: 'Hash',
  list: 'List',
  set: 'Set',
  zset: 'Sorted Set',
  key: 'Key',
  server: 'Server',
  connection: 'Connection',
}

// Redis 命令数据
const commands: RedisCommand[] = [
  // ===== String 字符串 =====
  { name: 'SET', category: 'string', syntax: 'SET key value [EX seconds|PX milliseconds|KEEPTTL] [NX|XX]', description: '设置指定键的字符串值，可设置过期时间或存在性条件。', example: 'SET mykey "Hello"', returns: '成功返回 OK；未满足条件返回 nil。' },
  { name: 'GET', category: 'string', syntax: 'GET key', description: '获取指定键存储的字符串值。', example: 'GET mykey', returns: '返回值；键不存在返回 nil。' },
  { name: 'GETSET', category: 'string', syntax: 'GETSET key value', description: '设置新值并返回旧值。', example: 'GETSET mykey "World"', returns: '返回旧值；键不存在返回 nil。' },
  { name: 'STRLEN', category: 'string', syntax: 'STRLEN key', description: '返回字符串值的字节长度。', example: 'STRLEN mykey', returns: '返回长度；键不存在返回 0。' },
  { name: 'APPEND', category: 'string', syntax: 'APPEND key value', description: '将 value 追加到原值的末尾，键不存在时等同 SET。', example: 'APPEND mykey " World"', returns: '返回追加后的字符串总长度。' },
  { name: 'INCR', category: 'string', syntax: 'INCR key', description: '将存储的数字值递增 1。', example: 'INCR counter', returns: '返回递增后的值。' },
  { name: 'DECR', category: 'string', syntax: 'DECR key', description: '将存储的数字值递减 1。', example: 'DECR counter', returns: '返回递减后的值。' },
  { name: 'INCRBY', category: 'string', syntax: 'INCRBY key increment', description: '将存储的数字值增加指定整数。', example: 'INCRBY counter 10', returns: '返回增加后的值。' },
  { name: 'MSET', category: 'string', syntax: 'MSET key value [key value ...]', description: '批量设置多个键值对，原子操作。', example: 'MSET k1 v1 k2 v2', returns: '始终返回 OK。' },
  { name: 'MGET', category: 'string', syntax: 'MGET key [key ...]', description: '批量获取多个键的值。', example: 'MGET k1 k2', returns: '返回值列表，不存在的键返回 nil。' },
  { name: 'SETEX', category: 'string', syntax: 'SETEX key seconds value', description: '设置键值并指定过期时间（秒）。', example: 'SETEX tempkey 60 "data"', returns: '成功返回 OK。' },
  { name: 'SETNX', category: 'string', syntax: 'SETNX key value', description: '仅当键不存在时设置值。', example: 'SETNX newkey "value"', returns: '设置成功返回 1，键已存在返回 0。' },
  { name: 'GETRANGE', category: 'string', syntax: 'GETRANGE key start end', description: '返回字符串中指定范围的子串（闭区间）。', example: 'GETRANGE mykey 0 4', returns: '返回子字符串。' },

  // ===== Hash 哈希 =====
  { name: 'HSET', category: 'hash', syntax: 'HSET key field value [field value ...]', description: '设置哈希表中一个或多个字段的值。', example: 'HSET user name "Alice"', returns: '返回新增字段的数量。' },
  { name: 'HGET', category: 'hash', syntax: 'HGET key field', description: '获取哈希表中指定字段的值。', example: 'HGET user name', returns: '返回字段值；不存在返回 nil。' },
  { name: 'HGETALL', category: 'hash', syntax: 'HGETALL key', description: '获取哈希表中所有字段和值。', example: 'HGETALL user', returns: '返回字段与值交替的列表。' },
  { name: 'HDEL', category: 'hash', syntax: 'HDEL key field [field ...]', description: '删除哈希表中一个或多个字段。', example: 'HDEL user name', returns: '返回成功删除的字段数量。' },
  { name: 'HKEYS', category: 'hash', syntax: 'HKEYS key', description: '获取哈希表中所有字段名。', example: 'HKEYS user', returns: '返回字段名列表。' },
  { name: 'HVALS', category: 'hash', syntax: 'HVALS key', description: '获取哈希表中所有字段值。', example: 'HVALS user', returns: '返回值列表。' },
  { name: 'HLEN', category: 'hash', syntax: 'HLEN key', description: '获取哈希表中的字段数量。', example: 'HLEN user', returns: '返回字段数量；键不存在返回 0。' },
  { name: 'HMSET', category: 'hash', syntax: 'HMSET key field value [field value ...]', description: '批量设置哈希表字段值（已由 HSET 取代，仍可用）。', example: 'HMSET user name "Bob" age 25', returns: '成功返回 OK。' },
  { name: 'HINCRBY', category: 'hash', syntax: 'HINCRBY key field increment', description: '将哈希表中某字段的数值增加指定整数。', example: 'HINCRBY user age 1', returns: '返回增加后的字段值。' },
  { name: 'HEXISTS', category: 'hash', syntax: 'HEXISTS key field', description: '判断哈希表中是否存在指定字段。', example: 'HEXISTS user name', returns: '存在返回 1，不存在返回 0。' },

  // ===== List 列表 =====
  { name: 'LPUSH', category: 'list', syntax: 'LPUSH key value [value ...]', description: '将一个或多个值推入列表头部（左侧）。', example: 'LPUSH mylist "a" "b"', returns: '返回推入后的列表长度。' },
  { name: 'RPUSH', category: 'list', syntax: 'RPUSH key value [value ...]', description: '将一个或多个值推入列表尾部（右侧）。', example: 'RPUSH mylist "c" "d"', returns: '返回推入后的列表长度。' },
  { name: 'LPOP', category: 'list', syntax: 'LPOP key [count]', description: '从列表头部弹出并返回元素。', example: 'LPOP mylist', returns: '返回弹出元素；列表为空返回 nil。' },
  { name: 'RPOP', category: 'list', syntax: 'RPOP key [count]', description: '从列表尾部弹出并返回元素。', example: 'RPOP mylist', returns: '返回弹出元素；列表为空返回 nil。' },
  { name: 'LRANGE', category: 'list', syntax: 'LRANGE key start stop', description: '获取列表指定区间内的元素（闭区间，-1 表示末尾）。', example: 'LRANGE mylist 0 -1', returns: '返回元素列表。' },
  { name: 'LLEN', category: 'list', syntax: 'LLEN key', description: '获取列表长度。', example: 'LLEN mylist', returns: '返回列表长度；键不存在返回 0。' },
  { name: 'LINDEX', category: 'list', syntax: 'LINDEX key index', description: '按索引获取列表中的元素，0 为头部。', example: 'LINDEX mylist 0', returns: '返回元素；超出范围返回 nil。' },
  { name: 'LSET', category: 'list', syntax: 'LSET key index value', description: '按索引设置列表中元素的值。', example: 'LSET mylist 0 "new"', returns: '成功返回 OK；索引越界返回错误。' },
  { name: 'LREM', category: 'list', syntax: 'LREM key count value', description: '移除列表中等于 value 的元素，count 指方向与数量。', example: 'LREM mylist 1 "a"', returns: '返回实际移除的元素数量。' },

  // ===== Set 集合 =====
  { name: 'SADD', category: 'set', syntax: 'SADD key member [member ...]', description: '向集合添加一个或多个成员。', example: 'SADD myset "a" "b"', returns: '返回新增成员的数量。' },
  { name: 'SREM', category: 'set', syntax: 'SREM key member [member ...]', description: '移除集合中的一个或多个成员。', example: 'SREM myset "a"', returns: '返回成功移除的成员数量。' },
  { name: 'SMEMBERS', category: 'set', syntax: 'SMEMBERS key', description: '返回集合中的所有成员。', example: 'SMEMBERS myset', returns: '返回成员列表。' },
  { name: 'SISMEMBER', category: 'set', syntax: 'SISMEMBER key member', description: '判断 member 是否是集合的成员。', example: 'SISMEMBER myset "a"', returns: '是成员返回 1，否则返回 0。' },
  { name: 'SCARD', category: 'set', syntax: 'SCARD key', description: '获取集合中的成员数量。', example: 'SCARD myset', returns: '返回成员数量；键不存在返回 0。' },
  { name: 'SINTER', category: 'set', syntax: 'SINTER key [key ...]', description: '返回多个集合的交集。', example: 'SINTER set1 set2', returns: '返回交集成员列表。' },
  { name: 'SUNION', category: 'set', syntax: 'SUNION key [key ...]', description: '返回多个集合的并集。', example: 'SUNION set1 set2', returns: '返回并集成员列表。' },
  { name: 'SDIFF', category: 'set', syntax: 'SDIFF key [key ...]', description: '返回第一个集合与其他集合的差集。', example: 'SDIFF set1 set2', returns: '返回差集成员列表。' },

  // ===== Sorted Set 有序集合 =====
  { name: 'ZADD', category: 'zset', syntax: 'ZADD key [NX|XX] [GT|LT] [CH] [INCR] score member [score member ...]', description: '向有序集合添加带分数的成员。', example: 'ZADD ranking 100 "Alice"', returns: '返回新增成员数量。' },
  { name: 'ZRANGE', category: 'zset', syntax: 'ZRANGE key start stop [WITHSCORES]', description: '按索引范围返回成员（升序）。', example: 'ZRANGE ranking 0 -1 WITHSCORES', returns: '返回成员列表，带 WITHSCORES 时含分数。' },
  { name: 'ZRANGEBYSCORE', category: 'zset', syntax: 'ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]', description: '按分数范围返回成员。', example: 'ZRANGEBYSCORE ranking 80 100', returns: '返回分数区间内的成员列表。' },
  { name: 'ZSCORE', category: 'zset', syntax: 'ZSCORE key member', description: '获取有序集合中某成员的分数。', example: 'ZSCORE ranking "Alice"', returns: '返回分数字符串；不存在返回 nil。' },
  { name: 'ZRANK', category: 'zset', syntax: 'ZRANK key member', description: '返回成员在有序集合中的排名（升序，从 0 开始）。', example: 'ZRANK ranking "Alice"', returns: '返回排名；成员不存在返回 nil。' },
  { name: 'ZREM', category: 'zset', syntax: 'ZREM key member [member ...]', description: '移除有序集合中的一个或多个成员。', example: 'ZREM ranking "Alice"', returns: '返回成功移除的成员数量。' },
  { name: 'ZCARD', category: 'zset', syntax: 'ZCARD key', description: '获取有序集合的成员数量。', example: 'ZCARD ranking', returns: '返回成员数量；键不存在返回 0。' },
  { name: 'ZINCRBY', category: 'zset', syntax: 'ZINCRBY key increment member', description: '增加有序集合中某成员的分数。', example: 'ZINCRBY ranking 5 "Alice"', returns: '返回成员的新分数。' },

  // ===== Key 键 =====
  { name: 'KEYS', category: 'key', syntax: 'KEYS pattern', description: '查找匹配模式的所有键（生产环境慎用）。', example: 'KEYS user:*', returns: '返回匹配的键名列表。' },
  { name: 'EXISTS', category: 'key', syntax: 'EXISTS key [key ...]', description: '检查一个或多个键是否存在。', example: 'EXISTS mykey', returns: '返回存在的键数量。' },
  { name: 'TYPE', category: 'key', syntax: 'TYPE key', description: '返回键所存储的值的类型。', example: 'TYPE mykey', returns: '返回类型字符串（string/list/hash 等）；键不存在返回 none。' },
  { name: 'EXPIRE', category: 'key', syntax: 'EXPIRE key seconds', description: '为键设置过期时间（秒）。', example: 'EXPIRE tempkey 60', returns: '设置成功返回 1，键不存在返回 0。' },
  { name: 'TTL', category: 'key', syntax: 'TTL key', description: '查看键的剩余生存时间（秒）。', example: 'TTL tempkey', returns: '返回剩余秒数；无过期返回 -1；键不存在返回 -2。' },
  { name: 'PERSIST', category: 'key', syntax: 'PERSIST key', description: '移除键的过期时间，使其持久化。', example: 'PERSIST tempkey', returns: '移除成功返回 1，否则返回 0。' },
  { name: 'RENAME', category: 'key', syntax: 'RENAME key newkey', description: '将键重命名为 newkey。', example: 'RENAME oldkey newkey', returns: '成功返回 OK；原键不存在返回错误。' },
  { name: 'DEL', category: 'key', syntax: 'DEL key [key ...]', description: '删除一个或多个键。', example: 'DEL mykey', returns: '返回实际删除的键数量。' },

  // ===== Server 服务器 =====
  { name: 'INFO', category: 'server', syntax: 'INFO [section]', description: '获取服务器相关信息。', example: 'INFO server', returns: '返回文本格式的服务器信息。' },
  { name: 'DBSIZE', category: 'server', syntax: 'DBSIZE', description: '返回当前数据库的键数量。', example: 'DBSIZE', returns: '返回键数量。' },
  { name: 'FLUSHDB', category: 'server', syntax: 'FLUSHDB [ASYNC|SYNC]', description: '清空当前数据库中的所有键。', example: 'FLUSHDB', returns: '返回 OK。' },
  { name: 'FLUSHALL', category: 'server', syntax: 'FLUSHALL [ASYNC|SYNC]', description: '清空所有数据库中的所有键（危险操作）。', example: 'FLUSHALL', returns: '返回 OK。' },
  { name: 'CONFIG GET', category: 'server', syntax: 'CONFIG GET parameter', description: '获取指定配置参数的值，支持通配符。', example: 'CONFIG GET maxmemory', returns: '返回配置参数与值。' },
  { name: 'CONFIG SET', category: 'server', syntax: 'CONFIG SET parameter value', description: '修改服务器配置参数。', example: 'CONFIG SET maxmemory 100mb', returns: '成功返回 OK；参数无效返回错误。' },
  { name: 'CLIENT LIST', category: 'server', syntax: 'CLIENT LIST', description: '返回连接到服务器的客户端列表。', example: 'CLIENT LIST', returns: '返回客户端信息文本。' },
  { name: 'TIME', category: 'server', syntax: 'TIME', description: '返回当前服务器时间。', example: 'TIME', returns: '返回秒与微秒两个值。' },

  // ===== Connection 连接 =====
  { name: 'AUTH', category: 'connection', syntax: 'AUTH [username] password', description: '进行身份认证。', example: 'AUTH mypassword', returns: '认证成功返回 OK；失败返回错误。' },
  { name: 'PING', category: 'connection', syntax: 'PING [message]', description: '测试服务器连接是否存活。', example: 'PING', returns: '默认返回 PONG；带消息则返回消息内容。' },
  { name: 'SELECT', category: 'connection', syntax: 'SELECT index', description: '切换到指定数据库。', example: 'SELECT 0', returns: '成功返回 OK。' },
  { name: 'ECHO', category: 'connection', syntax: 'ECHO message', description: '回显给定的字符串，用于测试连接。', example: 'ECHO "Hello"', returns: '返回传入的消息内容。' },
  { name: 'QUIT', category: 'connection', syntax: 'QUIT', description: '关闭当前连接。', example: 'QUIT', returns: '返回 OK。' },
]

// 当前选中分类
const selectedCategory = ref('all')
const searchQuery = ref('')

// 选中分类
function selectCategory(key: string) {
  selectedCategory.value = key
}

// 每个分类的命令数量
function countOfCategory(key: string): number {
  if (key === 'all') return commands.length
  return commands.filter(c => c.category === key).length
}

// 当前分类标签
const currentCategoryLabel = computed(() => {
  if (searchQuery.value.trim()) return '搜索结果'
  const cat = categories.find(c => c.key === selectedCategory.value)
  return cat ? cat.label : '全部'
})

// 过滤后的命令列表
const filteredCommands = computed(() => {
  // 有搜索词时跨分类搜索
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    return commands.filter(
      c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    )
  }
  if (selectedCategory.value === 'all') return commands
  return commands.filter(c => c.category === selectedCategory.value)
})

// 分类短标签
function categoryShortLabel(key: string): string {
  return shortLabels[key] || key
}

// 分类对应的标签颜色
function categoryTagType(key: string): 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' {
  const map: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'> = {
    string: 'success',
    hash: 'info',
    list: 'warning',
    set: 'primary',
    zset: 'error',
    key: 'default',
    server: 'info',
    connection: 'success',
  }
  return map[key] || 'default'
}

// 复制示例
async function copyExample(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制示例')
  } catch {
    message.error('复制失败，请手动复制')
  }
}
</script>

<style scoped>
.redis-ref {
  max-width: 1000px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 20px;
}

.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
  align-items: start;
}

/* 侧边导航 */
.sidebar {
  position: sticky;
  top: 16px;
  background: var(--n-color, #fff);
  border: 1px solid var(--n-border-color, #e0e0e6);
  border-radius: 8px;
  padding: 12px;
}

.sidebar-title {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 8px;
  padding: 0 8px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  text-align: left;
  transition: background 0.2s, color 0.2s;
  font-family: inherit;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.nav-item.active {
  background: var(--n-color-target, #18a058);
  color: #fff;
}

.nav-count {
  font-size: 12px;
  opacity: 0.7;
}

/* 主区域 */
.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.command-card {
  border: 1px solid var(--n-border-color, #e0e0e6);
  border-radius: 8px;
  padding: 16px;
  background: var(--n-color, #fff);
  transition: box-shadow 0.2s, transform 0.2s;
}

.command-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.cmd-name {
  font-size: 16px;
  font-weight: 700;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
}

.card-section {
  margin-bottom: 12px;
}

.card-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 4px;
}

.section-text {
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}

.example-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.code-block {
  margin: 0;
  flex: 1;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.5;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  color: #d63384;
}

/* 深色模式适配 */
.dark .sidebar {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}

.dark .nav-item {
  color: rgba(255, 255, 255, 0.82);
}

.dark .nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.dark .nav-item.active {
  background: #36ad6a;
  color: #fff;
}

.dark .sidebar-title,
.dark .section-label {
  color: rgba(255, 255, 255, 0.45);
}

.dark .section-text,
.dark .result-title {
  color: rgba(255, 255, 255, 0.85);
}

.dark .command-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}

.dark .code-block {
  background: rgba(0, 0, 0, 0.3);
  color: #ff9eb1;
}

.dark .command-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* 响应式：移动端侧边栏变为顶部横向滚动 */
@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .nav-list {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .nav-item {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
