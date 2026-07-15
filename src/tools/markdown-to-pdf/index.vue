<template>
  <div class="markdown-to-pdf">
    <!-- 工具栏 -->
    <div class="toolbar mb-3">
      <n-space>
        <n-button type="primary" @click="printPdf" :disabled="!markdown.trim()">
          打印 / 生成 PDF
        </n-button>
        <n-button @click="loadExample">加载示例</n-button>
        <n-button @click="clearAll" :disabled="!markdown">清空</n-button>
      </n-space>
      <n-tag v-if="printing" type="info" class="ml-2">正在准备打印...</n-tag>
    </div>

    <!-- 编辑与预览区域 -->
    <div class="editor-grid">
      <div class="editor-pane">
        <div class="pane-label mb-2">Markdown 输入</div>
        <n-input
          v-model:value="markdown"
          type="textarea"
          placeholder="在此输入 Markdown 内容..."
          class="code-input"
          :autosize="false"
          rows="22"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label mb-2">渲染预览</div>
        <div class="preview-content card" v-html="renderedHtml"></div>
      </div>
    </div>

    <!-- 打印提示 -->
    <n-alert type="info" class="mt-3" :bordered="false">
      <template #header>使用说明</template>
      点击"打印 / 生成 PDF"后，在浏览器打印对话框中选择"另存为 PDF"作为目标即可生成 PDF 文件。
      打印时将自动隐藏页面其他元素，仅输出文档内容。
    </n-alert>

    <!-- 打印区域（仅在打印时可见） -->
    <div class="print-area" v-html="renderedHtml"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { NInput, NButton, NSpace, NTag, NAlert } from 'naive-ui'
import { useMessage } from 'naive-ui'

const message = useMessage()

// Markdown 输入内容
const markdown = ref(`# 文档标题

## 1. 简介

本文档由 **Markdown 转 PDF** 工具生成。支持标准的 Markdown 语法，包括标题、列表、表格、代码块等。

## 2. 功能特性

- 实时预览渲染效果
- 使用浏览器原生打印功能生成 PDF
- 优化打印样式，支持分页
- 纯前端实现，数据不外传

## 3. 表格示例

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 名称 |
| value | number | 数值 |
| active | boolean | 状态 |

## 4. 代码示例

\`\`\`javascript
function sum(a, b) {
  return a + b
}
\`\`\`

## 5. 引用与列表

> 任何足够先进的技术，都与魔法无异。

1. 第一步
2. 第二步
3. 第三步

## 6. 结语

点击上方按钮即可生成 PDF 文档。
`)

// marked 与 dompurify 引用
let markedParse: ((src: string) => string) | null = null
let purify: ((dirty: string) => string) | null = null
const ready = ref(false)
const printing = ref(false)

// 挂载时加载依赖库
onMounted(async () => {
  const [markedModule, domPurifyModule] = await Promise.all([
    import('marked'),
    import('dompurify'),
  ])
  const marked = markedModule.marked
  marked.setOptions({ gfm: true, breaks: true })
  markedParse = (src: string) => marked.parse(src) as string
  purify = domPurifyModule.default.sanitize
  ready.value = true
})

// 渲染后的 HTML（经过 XSS 过滤）
const renderedHtml = computed(() => {
  if (!markedParse || !purify || !markdown.value) return ''
  try {
    const raw = markedParse(markdown.value)
    return purify(raw)
  } catch {
    return '<p style="color:red">Markdown 解析出错</p>'
  }
})

// 加载示例
function loadExample() {
  markdown.value = `# 项目需求文档

## 1. 项目背景

本项目旨在开发一个**在线工具集合平台**，为开发者提供常用的工具集。

## 2. 功能需求

### 2.1 用户管理

| 模块 | 功能 | 优先级 |
|------|------|:------:|
| 注册 | 邮箱注册 | 高 |
| 登录 | 密码登录 | 高 |
| 个人中心 | 资料管理 | 中 |

### 2.2 工具模块

1. **编码转换**：Base64、URL 编码等
2. **格式化**：JSON、SQL、HTML 等
3. **生成器**：UUID、密码、二维码等

## 3. 技术方案

- 前端：Vue 3 + TypeScript
- UI 框架：Naive UI
- 构建工具：Vite

## 4. 代码示例

\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
}

function createUser(data: Partial<User>): User {
  return {
    id: crypto.randomUUID(),
    name: data.name || '匿名',
    email: data.email || '',
  }
}
\`\`\`

## 5. 时间计划

> 第一阶段：完成基础框架搭建
> 第二阶段：实现核心工具
> 第三阶段：优化与测试

## 6. 总结

本文档定义了项目的基本需求与技术方案，后续将根据实际情况调整。
`
  message.success('已加载示例内容')
}

// 清空
function clearAll() {
  markdown.value = ''
  message.success('已清空')
}

// 打印前的处理函数
function beforePrint() {
  printing.value = true
}

// 打印后的处理函数
function afterPrint() {
  printing.value = false
}

// 监听打印事件
onMounted(() => {
  window.addEventListener('beforeprint', beforePrint)
  window.addEventListener('afterprint', afterPrint)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeprint', beforePrint)
  window.removeEventListener('afterprint', afterPrint)
})

// 打印生成 PDF
function printPdf() {
  if (!markdown.value.trim()) {
    message.warning('请先输入 Markdown 内容')
    return
  }
  if (!ready.value) {
    message.warning('库正在加载中，请稍候')
    return
  }
  message.info('即将打开打印对话框，请选择"另存为 PDF"')
  setTimeout(() => {
    window.print()
  }, 300)
}
</script>

<style scoped>
.markdown-to-pdf {
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: calc(100vh - 220px);
  min-height: 500px;
}

@media (max-width: 768px) {
  .editor-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
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

.dark .preview-content :deep(blockquote) {
  color: #aaa;
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
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

/* 打印区域：屏幕上隐藏，仅在打印时显示 */
.print-area {
  display: none;
}

/* 打印样式 */
@media print {
  /* 隐藏页面所有元素 */
  body * {
    visibility: hidden;
  }

  /* 显示打印区域及其子元素 */
  .print-area,
  .print-area * {
    visibility: visible;
  }

  /* 将打印区域置于页面顶部 */
  .print-area {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0;
    margin: 0;
    font-family: '宋体', SimSun, serif;
    font-size: 12pt;
    line-height: 1.8;
    color: #000;
    background: #fff;
  }

  /* 打印区域排版样式 */
  .print-area :deep(h1) {
    font-size: 22pt;
    font-weight: bold;
    text-align: center;
    margin: 0.67em 0;
    page-break-after: avoid;
  }

  .print-area :deep(h2) {
    font-size: 18pt;
    font-weight: bold;
    margin: 0.83em 0;
    page-break-after: avoid;
  }

  .print-area :deep(h3) {
    font-size: 14pt;
    font-weight: bold;
    margin: 1em 0;
    page-break-after: avoid;
  }

  .print-area :deep(pre) {
    background: #f5f5f5;
    padding: 8pt;
    border: 1px solid #ddd;
    font-family: 'Consolas', monospace;
    font-size: 10pt;
    white-space: pre-wrap;
    word-wrap: break-word;
    page-break-inside: avoid;
  }

  .print-area :deep(code) {
    font-family: 'Consolas', monospace;
    font-size: 10pt;
  }

  .print-area :deep(blockquote) {
    border-left: 3pt solid #999;
    padding-left: 12pt;
    margin: 1em 0;
    color: #555;
    page-break-inside: avoid;
  }

  .print-area :deep(ul),
  .print-area :deep(ol) {
    padding-left: 2em;
    margin: 1em 0;
  }

  .print-area :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    page-break-inside: avoid;
  }

  .print-area :deep(th),
  .print-area :deep(td) {
    border: 1pt solid #000;
    padding: 6pt;
  }

  .print-area :deep(th) {
    background: #e8e8e8;
    font-weight: bold;
  }

  /* 设置打印页边距 */
  @page {
    margin: 2cm;
  }
}
</style>
