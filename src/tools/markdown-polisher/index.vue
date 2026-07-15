<template>
  <div class="markdown-polisher">
    <!-- 工具栏 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">润色选项</div>
      <div class="options-row">
        <n-checkbox v-model:checked="options.normalizeHeadings">统一标题层级</n-checkbox>
        <n-checkbox v-model:checked="options.normalizeLists">规范列表缩进</n-checkbox>
        <n-checkbox v-model:checked="options.normalizeCodeBlocks">格式化代码块</n-checkbox>
        <n-checkbox v-model:checked="options.normalizeBlankLines">规范空行</n-checkbox>
        <n-checkbox v-model:checked="options.normalizeLinks">规范链接格式</n-checkbox>
        <n-checkbox v-model:checked="options.trimTrailingSpace">去除行尾空格</n-checkbox>
      </div>
      <div class="toolbar mt-3">
        <n-button type="primary" @click="polish">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg></span>
          开始润色
        </n-button>
        <n-button @click="loadExample">加载示例</n-button>
        <n-button @click="clearAll">清空</n-button>
        <n-button @click="copyResult" :disabled="!output">复制结果</n-button>
      </div>
    </div>

    <!-- 输入输出对比 -->
    <div class="editor-grid">
      <div class="editor-pane">
        <div class="pane-label mb-2">原始 Markdown</div>
        <n-input
          v-model:value="input"
          type="textarea"
          placeholder="输入需要润色的 Markdown 内容..."
          :rows="20"
          class="code-input"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label mb-2">润色结果</div>
        <n-input
          :value="output"
          type="textarea"
          readonly
          placeholder="润色后的 Markdown 将显示在这里..."
          :rows="20"
          class="code-input"
        />
      </div>
    </div>

    <!-- 预览 -->
    <div class="card mt-4" v-if="output">
      <div class="pane-label mb-2">预览效果</div>
      <div class="preview-content" v-html="renderedHtml"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NInput, NButton, NCheckbox, useMessage } from 'naive-ui'

const message = useMessage()

// 润色选项
const options = ref({
  normalizeHeadings: true,
  normalizeLists: true,
  normalizeCodeBlocks: true,
  normalizeBlankLines: true,
  normalizeLinks: true,
  trimTrailingSpace: true,
})

const input = ref('')
const output = ref('')

let markedParse: ((src: string) => string) | null = null
let purify: ((dirty: string) => string) | null = null

// 动态加载 marked 和 dompurify
onMounted(async () => {
  const [markedModule, DOMPurifyModule] = await Promise.all([
    import('marked'),
    import('dompurify')
  ])
  const marked = markedModule.marked
  marked.setOptions({ gfm: true, breaks: true })
  markedParse = (src: string) => marked.parse(src) as string
  purify = DOMPurifyModule.default.sanitize
})

// 渲染预览 HTML
const renderedHtml = computed(() => {
  if (!markedParse || !purify || !output.value) return ''
  try {
    return purify(markedParse(output.value))
  } catch {
    return '<p style="color:red">解析出错</p>'
  }
})

// 润色主函数
function polish() {
  if (!input.value.trim()) {
    message.warning('请输入需要润色的内容')
    return
  }
  let result = input.value

  if (options.value.trimTrailingSpace) {
    result = trimTrailingSpace(result)
  }
  if (options.value.normalizeBlankLines) {
    result = normalizeBlankLines(result)
  }
  if (options.value.normalizeHeadings) {
    result = normalizeHeadings(result)
  }
  if (options.value.normalizeLists) {
    result = normalizeLists(result)
  }
  if (options.value.normalizeCodeBlocks) {
    result = normalizeCodeBlocks(result)
  }
  if (options.value.normalizeLinks) {
    result = normalizeLinks(result)
  }
  // 最后再统一空行
  if (options.value.normalizeBlankLines) {
    result = normalizeBlankLines(result)
  }

  output.value = result
  message.success('润色完成')
}

// 去除行尾空格
function trimTrailingSpace(text: string): string {
  return text.split('\n').map(line => line.replace(/\s+$/, '')).join('\n')
}

// 规范空行：最多保留一个空行，去除首尾空行
function normalizeBlankLines(text: string): string {
  // 将 3 个及以上换行替换为 2 个换行（即一个空行）
  let result = text.replace(/\n{3,}/g, '\n\n')
  // 去除开头空行
  result = result.replace(/^\n+/, '')
  // 去除结尾空行
  result = result.replace(/\n+$/, '')
  return result + '\n'
}

// 统一标题层级：确保标题前后有空行，规范 # 号后空格
function normalizeHeadings(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headingMatch = line.match(/^(#{1,6})\s*(.*?)\s*#*\s*$/)
    if (headingMatch) {
      const hashes = headingMatch[1]
      const title = headingMatch[2].trim()
      const normalized = `${hashes} ${title}`
      // 前面加空行（如果不是第一行且前一行不是空行）
      if (result.length > 0 && result[result.length - 1].trim() !== '') {
        result.push('')
      }
      result.push(normalized)
      // 后面加空行（如果下一行不是空行且不是结尾）
      if (i < lines.length - 1 && lines[i + 1].trim() !== '') {
        result.push('')
      }
    } else {
      result.push(line)
    }
  }
  return result.join('\n')
}

// 规范列表缩进：统一使用 2 空格缩进
function normalizeLists(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let inList = false

  for (const line of lines) {
    // 匹配无序列表项：- * + 开头
    const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)$/)
    // 匹配有序列表项：数字. 开头
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/)

    if (ulMatch) {
      const indent = ulMatch[1]
      // 计算缩进层级，每 2 或 4 空格转为 2 空格
      const level = Math.floor(indent.length / 2)
      const newIndent = '  '.repeat(level)
      result.push(`${newIndent}- ${ulMatch[3].trim()}`)
      inList = true
    } else if (olMatch) {
      const indent = olMatch[1]
      const level = Math.floor(indent.length / 2)
      const newIndent = '  '.repeat(level)
      result.push(`${newIndent}1. ${olMatch[3].trim()}`)
      inList = true
    } else if (line.trim() === '') {
      result.push(line)
      inList = false
    } else if (inList && line.trim().startsWith('|')) {
      // 表格不需要特殊处理
      result.push(line)
    } else {
      result.push(line)
      inList = false
    }
  }
  return result.join('\n')
}

// 格式化代码块：确保 ``` 前后有空行
function normalizeCodeBlocks(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let inCodeBlock = false
  let codeLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // 检测代码块开始/结束标记
    const fenceMatch = line.match(/^(\s*)```(.*)$/)
    if (fenceMatch) {
      if (!inCodeBlock) {
        // 代码块开始
        inCodeBlock = true
        codeLang = fenceMatch[2].trim().toLowerCase()
        // 前面加空行
        if (result.length > 0 && result[result.length - 1].trim() !== '') {
          result.push('')
        }
        result.push('```' + codeLang)
      } else {
        // 代码块结束
        inCodeBlock = false
        result.push('```')
        // 后面加空行
        if (i < lines.length - 1 && lines[i + 1].trim() !== '') {
          result.push('')
        }
      }
    } else {
      result.push(line)
    }
  }
  return result.join('\n')
}

// 规范链接格式：统一使用 [文本](URL) 格式
function normalizeLinks(text: string): string {
  let result = text
  // 将 <url> 格式的裸链接转为 [url](url)
  result = result.replace(/<(https?:\/\/[^>]+)>/g, '[$1]($1)')
  // 将 [文本] (url) 中间多余的空格去掉
  result = result.replace(/\[([^\]]+)\]\s+\(([^)]+)\)/g, '[$1]($2)')
  // 规范引用式链接 [文本][引用] 之间的空格
  result = result.replace(/\[([^\]]+)\]\s*\[([^\]]+)\]/g, '[$1][$2]')
  return result
}

// 加载示例
function loadExample() {
  input.value = `#示例文档
##  二级标题
这里是一段文字。


-   列表项1
-   列表项2
    - 子列表项

\`\`\`javascript
function hello(){
console.log("hello");
}
\`\`\`

请访问 <https://example.com> 了解更多。

[链接 ](  https://test.com  )

1.  第一项
2.第二项`
  output.value = ''
}

// 清空
function clearAll() {
  input.value = ''
  output.value = ''
}

// 复制结果
async function copyResult() {
  try {
    await navigator.clipboard.writeText(output.value)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败')
  }
}
</script>

<style scoped>
.markdown-polisher {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.options-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* 预览样式 */
.preview-content {
  padding: 16px;
  line-height: 1.8;
}

.preview-content :deep(h1) {
  font-size: 2em;
  font-weight: bold;
  margin: 0.67em 0;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 0.3em;
}

.preview-content :deep(h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.83em 0;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 0.3em;
}

.preview-content :deep(h3) {
  font-size: 1.17em;
  font-weight: bold;
  margin: 1em 0;
}

.preview-content :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
}

.dark .preview-content :deep(pre) {
  background: #1e1e1e;
}

.preview-content :deep(code) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.9em;
}

.preview-content :deep(blockquote) {
  border-left: 4px solid #36ad6a;
  padding-left: 16px;
  margin: 1em 0;
  color: #666;
}

.preview-content :deep(ul) {
  padding-left: 2em;
  margin: 1em 0;
}

.preview-content :deep(li) {
  margin: 0.5em 0;
}

.preview-content :deep(a) {
  color: #36ad6a;
  text-decoration: none;
}

.preview-content :deep(a:hover) {
  text-decoration: underline;
}

.preview-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  text-align: left;
}

.dark .preview-content :deep(th),
.dark .preview-content :deep(td) {
  border-color: #2a2a4a;
}

.preview-content :deep(th) {
  background: #f5f5f5;
  font-weight: bold;
}

.dark .preview-content :deep(th) {
  background: #1e1e1e;
}
</style>
