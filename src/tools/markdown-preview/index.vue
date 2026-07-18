<template>
  <div class="markdown-preview">
    <div class="toolbar mb-3 flex items-center gap-3 flex-wrap">
      <n-button size="small" @click="loadExample">示例</n-button>
      <n-button size="small" @click="copyMarkdown" :disabled="!markdown">复制 Markdown</n-button>
      <n-button size="small" @click="downloadHtml">导出 HTML</n-button>
      <n-button size="small" @click="clearAll">清空</n-button>
      <n-radio-group v-model:value="previewMode" size="small">
        <n-radio-button value="split">分屏</n-radio-button>
        <n-radio-button value="edit">仅编辑</n-radio-button>
        <n-radio-button value="preview">仅预览</n-radio-button>
      </n-radio-group>
    </div>

    <div class="editor-grid" :class="previewMode">
      <div class="editor-pane" v-show="previewMode !== 'preview'">
        <div class="pane-label mb-2 flex justify-between">
          <span>Markdown 源码</span>
          <span class="text-xs text-gray-400">{{ markdown.length }} 字符</span>
        </div>
        <n-input
          v-model:value="markdown"
          type="textarea"
          placeholder="输入 Markdown 内容"
          class="code-input"
          :autosize="false"
          rows="20"
        />
      </div>
      <div class="preview-pane" v-show="previewMode !== 'edit'">
        <div class="pane-label mb-2 flex justify-between">
          <span>预览</span>
          <n-button size="tiny" quaternary @click="scrollToToc">目录</n-button>
        </div>
        <div class="preview-content card" v-html="renderedHtml"></div>
      </div>
    </div>

    <n-card title="目录" class="toc-card mt-4" v-if="toc.length > 1">
      <div class="toc-list">
        <div
          v-for="item in toc"
          :key="item.id"
          class="toc-item"
          :style="{ paddingLeft: (item.level - 1) * 16 + 'px' }"
          @click="scrollToHeading(item.id)"
        >
          {{ item.text }}
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NInput, NButton, NCard, NRadioGroup, NRadioButton, useMessage } from 'naive-ui'

const message = useMessage()
const markdown = ref('')
const previewMode = ref<'split' | 'edit' | 'preview'>('split')
const toc = ref<{ id: string; text: string; level: number }[]>([])

let markedParse: ((src: string) => string) | null = null
let purify: ((dirty: string) => string) | null = null
const ready = ref(false)

onMounted(async () => {
  const [markedModule, DOMPurifyModule] = await Promise.all([
    import('marked'),
    import('dompurify')
  ])
  const marked = markedModule.marked
  marked.setOptions({
    gfm: true,
    breaks: true,
  })
  markedParse = (src: string) => marked.parse(src) as string
  purify = DOMPurifyModule.default.sanitize
  ready.value = true
  loadExample()
})

const renderedHtml = computed(() => {
  if (!markedParse || !purify) return '<p>加载中...</p>'
  try {
    const raw = markedParse(markdown.value)
    const clean = purify(raw)
    buildToc(raw)
    return clean
  } catch {
    return '<p style="color:red">Markdown 解析出错</p>'
  }
})

function buildToc(html: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h1, h2, h3, h4')
  toc.value = Array.from(headings).map((h, index) => {
    const level = Number(h.tagName[1])
    const text = h.textContent || ''
    const id = `heading-${index}`
    return { id, text, level }
  })
}

function scrollToToc() {
  const el = document.querySelector('.toc-card')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function scrollToHeading(id: string) {
  const preview = document.querySelector('.preview-content')
  if (!preview) return
  const index = toc.value.findIndex(t => t.id === id)
  const headings = preview.querySelectorAll('h1, h2, h3, h4')
  if (headings[index]) {
    headings[index].scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function copyMarkdown() {
  navigator.clipboard.writeText(markdown.value)
  message.success('已复制 Markdown')
}

function downloadHtml() {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Markdown 导出</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.8; max-width: 800px; margin: 40px auto; padding: 0 20px; }
pre { background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; }
code { font-family: monospace; }
blockquote { border-left: 4px solid #36ad6a; padding-left: 16px; margin: 1em 0; color: #666; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px; }
th { background: #f5f5f5; }
</style>
</head>
<body>
${renderedHtml.value}
</body>
</html>`
  const blob = new Blob([fullHtml], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'markdown-preview.html'
  a.click()
  URL.revokeObjectURL(url)
}

function clearAll() {
  markdown.value = ''
  toc.value = []
}

function loadExample() {
  markdown.value = `# Markdown 预览器

## 功能特性

- 支持标题、列表、代码块
- 实时预览
- 导出 HTML
- 目录大纲

## 代码示例

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

## 表格示例

| 功能 | 状态 |
|------|------|
| 标题 | ✅ |
| 列表 | ✅ |
| 代码 | ✅ |

> 这是一个引用块

**粗体** 和 *斜体* 文本
`
}
</script>

<style scoped>
.markdown-preview { max-width: 1400px; margin: 0 auto; }

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: calc(100vh - 220px);
  min-height: 500px;
}

.editor-grid.edit {
  grid-template-columns: 1fr;
}

.editor-grid.preview {
  grid-template-columns: 1fr;
}

@media (max-width: 768px) {
  .editor-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
  .editor-grid.split .editor-pane,
  .editor-grid.split .preview-pane {
    height: 500px;
  }
}

.editor-pane, .preview-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  height: 100%;
}

.preview-content {
  overflow-y: auto;
  height: 100%;
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

.dark .preview-content :deep(blockquote) {
  color: #aaa;
}

.preview-content :deep(ul), .preview-content :deep(ol) {
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

.toc-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toc-item {
  cursor: pointer;
  font-size: 14px;
  color: #555;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.toc-item:hover {
  background: #f0f0f0;
  color: #36ad6a;
}

.dark .toc-item {
  color: #aaa;
}

.dark .toc-item:hover {
  background: #2a2a4a;
}
</style>
