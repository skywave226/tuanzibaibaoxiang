<template>
  <div class="regex-tester">
    <div class="card mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">/</span>
        <n-input
          v-model:value="pattern"
          placeholder="输入正则表达式"
          class="flex-1"
        />
        <span class="text-lg">/</span>
        <n-input
          v-model:value="flags"
          placeholder="flags"
          class="w-20"
        />
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <n-tag
          v-for="flag in commonFlags"
          :key="flag.value"
          :checked="flags.includes(flag.value)"
          checkable
          size="small"
          @click="toggleFlag(flag.value)"
        >
          {{ flag.label }}
        </n-tag>
        <n-button size="small" @click="clearAll">清空</n-button>
      </div>
      <n-tag v-if="errorMsg" type="error" class="mt-2">{{ errorMsg }}</n-tag>
    </div>

    <n-tabs v-model:value="activeTab" type="line" class="mb-4">
      <n-tab-pane name="match" tab="匹配测试">
        <div class="card mb-4">
          <div class="pane-label mb-2">测试文本</div>
          <n-input
            v-model:value="testText"
            type="textarea"
            placeholder="输入需要测试的文本"
            rows="8"
            :autosize="false"
            @input="testRegex"
          />
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-2">
            <div class="pane-label">匹配结果（{{ matches.length }} 个匹配）</div>
          </div>
          <div v-if="matches.length === 0" class="text-gray-400 text-center py-4">
            无匹配结果
          </div>
          <div v-else class="matches-list">
            <div v-for="(match, index) in matches" :key="index" class="match-item">
              <span class="match-index text-gray-400">#{{ index + 1 }}</span>
              <span class="match-value font-mono">{{ match.text }}</span>
              <span class="match-info text-gray-500 text-sm">
                位置: {{ match.index }}{{ match.groups.length ? ' | 分组: ' + match.groups.join(', ') : '' }}
              </span>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="replace" tab="替换测试">
        <div class="card mb-4">
          <div class="pane-label mb-2">替换为</div>
          <n-input
            v-model:value="replacement"
            placeholder="替换文本，可用 $1 $2 引用捕获组"
            @input="testReplace"
          />
          <div class="text-xs text-gray-500 mt-2">
            提示：$&amp; 表示整个匹配，$1 $2 表示捕获组，$` 表示匹配前文本，$' 表示匹配后文本
          </div>
        </div>
        <div class="card">
          <div class="pane-label mb-2">替换结果</div>
          <n-input
            :value="replacedText"
            type="textarea"
            readonly
            rows="8"
            :autosize="false"
          />
        </div>
      </n-tab-pane>

      <n-tab-pane name="explain" tab="正则解释">
        <div class="card">
          <div class="pane-label mb-2">表达式解析</div>
          <div v-if="!pattern" class="text-gray-400 text-center py-4">输入正则表达式后查看解释</div>
          <div v-else-if="explanation.length === 0" class="text-gray-400 text-center py-4">暂无可解释的部分</div>
          <div v-else class="explain-list">
            <div v-for="(item, index) in explanation" :key="index" class="explain-item">
              <code class="explain-token">{{ item.token }}</code>
              <span class="explain-desc">{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <div class="card">
      <h3 class="font-bold mb-2">常用正则表达式</h3>
      <div class="preset-list">
        <div
          v-for="preset in presets"
          :key="preset.name"
          class="preset-item"
          @click="applyPreset(preset)"
        >
          <div class="preset-name">{{ preset.name }}</div>
          <div class="preset-pattern font-mono text-xs">{{ preset.pattern }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NInput, NButton, NTag, NTabs, NTabPane } from 'naive-ui'

interface MatchResult {
  text: string
  index: number
  groups: string[]
}

interface ExplainItem {
  token: string
  desc: string
}

const pattern = ref('')
const flags = ref('g')
const testText = ref('')
const replacement = ref('')
const errorMsg = ref('')
const matches = ref<MatchResult[]>([])
const activeTab = ref('match')
const replacedText = ref('')
const explanation = ref<ExplainItem[]>([])

const commonFlags = [
  { label: '全局匹配 (g)', value: 'g' },
  { label: '忽略大小写 (i)', value: 'i' },
  { label: '多行模式 (m)', value: 'm' },
  { label: '单行模式 (s)', value: 's' },
  { label: 'Unicode (u)', value: 'u' },
]

const presets = [
  { name: '邮箱', pattern: '[\\w.-]+@[\\w.-]+\\.\\w+', flags: 'g' },
  { name: '手机号', pattern: '1[3-9]\\d{9}', flags: 'g' },
  { name: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w./-]*)*', flags: 'g' },
  { name: 'IPv4 地址', pattern: '\\b(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)){3}\\b', flags: 'g' },
  { name: '日期 (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
  { name: '身份证号', pattern: '\\d{6}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]', flags: 'g' },
  { name: '中文字符', pattern: '[\\u4e00-\\u9fa5]+', flags: 'g' },
  { name: 'HTML 标签', pattern: '<([a-zA-Z][\\w-]*)[^>]*>.*?<\\/\\1>', flags: 'g' },
  { name: '十六进制颜色', pattern: '#(?:[\\da-fA-F]{3}){1,2}', flags: 'g' },
  { name: 'UUID', pattern: '[\\da-fA-F]{8}-[\\da-fA-F]{4}-[\\da-fA-F]{4}-[\\da-fA-F]{4}-[\\da-fA-F]{12}', flags: 'g' },
]

function toggleFlag(flag: string) {
  if (flags.value.includes(flag)) {
    flags.value = flags.value.replace(flag, '')
  } else {
    flags.value += flag
  }
  testRegex()
  testReplace()
}

const MAX_TEXT_LENGTH = 10000

function validatePattern(pattern: string): string | null {
  const dangerous = [
    /\([^)]*[+*][^)]*\)[+*]/,
    /\([^)]*\{[^}]*\}[^)]*\)[+*{]/,
    /(\+|\*)\1+/,
  ]
  for (const p of dangerous) {
    if (p.test(pattern)) {
      return '正则表达式可能包含导致回溯爆炸的嵌套量词，请简化表达式'
    }
  }
  return null
}

function testRegex() {
  explanation.value = explainRegex(pattern.value)
  if (!pattern.value || !testText.value) {
    matches.value = []
    errorMsg.value = ''
    return
  }

  if (testText.value.length > MAX_TEXT_LENGTH) {
    errorMsg.value = `测试文本过长（当前 ${testText.value.length} 字符，最大 ${MAX_TEXT_LENGTH} 字符），请缩短文本后重试`
    matches.value = []
    return
  }

  const patternWarning = validatePattern(pattern.value)
  if (patternWarning) {
    errorMsg.value = patternWarning
    matches.value = []
    return
  }

  try {
    const regex = new RegExp(pattern.value, flags.value)
    const results: MatchResult[] = []

    if (flags.value.includes('g')) {
      let match
      while ((match = regex.exec(testText.value)) !== null) {
        results.push({ text: match[0], index: match.index, groups: match.slice(1).map(String) })
        if (match[0].length === 0) regex.lastIndex++
      }
    } else {
      const match = regex.exec(testText.value)
      if (match) {
        results.push({ text: match[0], index: match.index, groups: match.slice(1).map(String) })
      }
    }

    matches.value = results
    errorMsg.value = ''
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    matches.value = []
  }
  testReplace()
}

function testReplace() {
  if (!pattern.value || !testText.value) {
    replacedText.value = ''
    return
  }
  try {
    const regex = new RegExp(pattern.value, flags.value)
    replacedText.value = testText.value.replace(regex, replacement.value)
  } catch {
    replacedText.value = ''
  }
}

function explainRegex(regex: string): ExplainItem[] {
  if (!regex) return []
  const result: ExplainItem[] = []
  let escaped = false
  let i = 0
  while (i < regex.length) {
    const ch = regex[i]
    if (escaped) {
      const map: Record<string, string> = {
        d: '数字（0-9）',
        D: '非数字',
        w: '单词字符（字母、数字、下划线）',
        W: '非单词字符',
        s: '空白字符',
        S: '非空白字符',
        t: '制表符',
        n: '换行符',
        r: '回车符',
        b: '单词边界',
        B: '非单词边界',
        '.': '句点字符',
        '\\': '反斜杠',
        '/': '正斜杠',
      }
      result.push({ token: '\\\\' + ch, desc: map[ch] || '转义字符 ' + ch })
      escaped = false
      i++
      continue
    }
    if (ch === '\\') {
      escaped = true
      i++
      continue
    }
    if (ch === '[') {
      const close = regex.indexOf(']', i)
      if (close === -1) {
        result.push({ token: '[', desc: '字符类开始（未闭合）' })
      } else {
        const content = regex.slice(i, close + 1)
        const negate = content[1] === '^'
        result.push({
          token: content,
          desc: negate ? `字符类：不匹配 ${content.slice(2, -1)}` : `字符类：匹配 ${content.slice(1, -1)} 中的任意一个`,
        })
        i = close + 1
        continue
      }
    }
    if (ch === '(') {
      if (regex.slice(i + 1).startsWith('?:')) {
        result.push({ token: '(?:', desc: '非捕获组开始' })
        i += 2
      } else if (regex.slice(i + 1).startsWith('?=')) {
        result.push({ token: '(?=', desc: '正向前瞻断言' })
        i += 2
      } else if (regex.slice(i + 1).startsWith('?!')) {
        result.push({ token: '(?!', desc: '负向前瞻断言' })
        i += 2
      } else {
        result.push({ token: '(', desc: '捕获组开始' })
      }
      i++
      continue
    }
    if (ch === ')') {
      result.push({ token: ')', desc: '分组结束' })
      i++
      continue
    }
    if (ch === '|') {
      result.push({ token: '|', desc: '或（匹配左边或右边）' })
      i++
      continue
    }
    if (ch === '^') {
      result.push({ token: '^', desc: '行首锚点' })
      i++
      continue
    }
    if (ch === '$') {
      result.push({ token: '$', desc: '行尾锚点' })
      i++
      continue
    }
    if (ch === '.') {
      result.push({ token: '.', desc: '任意字符（除换行）' })
      i++
      continue
    }
    if (ch === '*' || ch === '+' || ch === '?') {
      const desc = ch === '*' ? '零个或多个' : ch === '+' ? '一个或多个' : '零个或一个'
      result.push({ token: ch, desc })
      i++
      continue
    }
    if (ch === '{') {
      const close = regex.indexOf('}', i)
      if (close !== -1) {
        const content = regex.slice(i, close + 1)
        result.push({ token: content, desc: `量词：重复 ${content.slice(1, -1)} 次` })
        i = close + 1
        continue
      }
    }
    result.push({ token: ch, desc: '匹配字符 ' + ch })
    i++
  }
  return result
}

function applyPreset(preset: { name: string; pattern: string; flags: string }) {
  pattern.value = preset.pattern
  flags.value = preset.flags
  testRegex()
}

function clearAll() {
  pattern.value = ''
  flags.value = 'g'
  testText.value = ''
  replacement.value = ''
  matches.value = []
  replacedText.value = ''
  explanation.value = []
  errorMsg.value = ''
}

watch(pattern, testRegex)
watch(flags, testRegex)
watch(testText, testRegex)
</script>

<style scoped>
.card {
  background: var(--n-card-color);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--n-border-color);
}
.matches-list {
  max-height: 300px;
  overflow-y: auto;
}
.match-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}
.match-item:hover {
  background: rgba(0, 0, 0, 0.04);
}
.dark .match-item:hover {
  background: rgba(255, 255, 255, 0.06);
}
.match-index {
  width: 30px;
  flex-shrink: 0;
}
.match-value {
  flex: 1;
  word-break: break-all;
}
.explain-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.explain-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.02);
}
.dark .explain-item {
  background: rgba(255, 255, 255, 0.04);
}
.explain-token {
  min-width: 80px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f0f0f0;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}
.dark .explain-token {
  background: #2a2a4a;
}
.explain-desc {
  color: #666;
  font-size: 13px;
}
.dark .explain-desc {
  color: #aaa;
}
.preset-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}
.preset-item {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #e8e8e8;
  transition: all 0.2s;
}
.preset-item:hover {
  border-color: #36ad6a;
  background: #f0f9eb;
}
.dark .preset-item {
  border-color: #2a2a4a;
}
.dark .preset-item:hover {
  border-color: #63e2b7;
  background: #1a3a2a;
}
.preset-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}
.preset-pattern {
  color: #888;
}
</style>
