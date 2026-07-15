<template>
  <div class="markdown-preview">
    <div class="editor-grid">
      <div class="editor-pane">
        <div class="pane-label mb-2">Markdown 源码</div>
        <n-input
          v-model:value="markdown"
          type="textarea"
          placeholder="输入 Markdown 内容"
          class="code-input"
          :autosize="false"
          rows="20"
        />
      </div>
      <div class="preview-pane">
        <div class="pane-label mb-2">预览</div>
        <div class="preview-content card" v-html="renderedHtml"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NInput } from 'naive-ui'

const markdown = ref(`# Markdown 预览

## 功能特性

- 支持标题、列表、代码块
- 实时预览
- 纯前端实现

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
`)

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
    breaks: true
  })
  markedParse = (src: string) => marked.parse(src) as string
  purify = DOMPurifyModule.default.sanitize
  ready.value = true
})

const renderedHtml = computed(() => {
  if (!markedParse || !purify) return ''
  try {
    const raw = markedParse(markdown.value)
    return purify(raw)
  } catch {
    return '<p style="color:red">Markdown 解析出错</p>'
  }
})
</script>

<style scoped>
.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: calc(100vh - 200px);
  min-height: 500px;
}

@media (max-width: 768px) {
  .editor-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
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
