<template>
  <div class="flowchart-generator">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="copyCode">复制代码</n-button>
        <n-button @click="openLiveEditor" type="primary" ghost>在 Mermaid Live Editor 打开</n-button>
        <n-button @click="loadExample">加载示例</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
      <n-tag v-if="code" type="success">代码已生成</n-tag>
    </div>

    <div class="editor-area">
      <!-- 左侧：流程描述输入 -->
      <div class="editor-pane">
        <div class="pane-header">
          <span class="pane-label">流程描述（Mermaid 语法）</span>
          <n-tag size="small" type="info">flowchart</n-tag>
        </div>
        <n-input
          v-model:value="input"
          type="textarea"
          placeholder="输入 Mermaid 流程图代码，例如：&#10;flowchart TD&#10;    A[开始] --> B{条件判断}&#10;    B -->|是| C[执行操作]&#10;    B -->|否| D[结束]"
          class="code-input"
          :autosize="false"
          rows="20"
        />
      </div>

      <!-- 右侧：生成代码 + 预览链接 -->
      <div class="editor-pane">
        <div class="pane-header">
          <span class="pane-label">生成代码</span>
          <n-space size="small">
            <n-button size="small" text @click="copyCode">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              复制
            </n-button>
          </n-space>
        </div>
        <pre class="code-block"><code v-html="highlightedCode"></code></pre>

        <div class="preview-section">
          <div class="pane-label">Mermaid Live Editor 预览</div>
          <p class="hint-text">
            点击下方按钮在新窗口打开 Mermaid 官方编辑器，自动带入当前代码进行可视化预览。
          </p>
          <n-button type="primary" @click="openLiveEditor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            打开 Mermaid Live Editor
          </n-button>
        </div>
      </div>
    </div>

    <!-- 语法参考 -->
    <div class="reference-section">
      <div class="pane-label">语法参考</div>
      <n-collapse>
        <n-collapse-item title="基础语法（节点与连接）" name="basic">
          <div class="reference-content">
            <p><code>flowchart TD</code> 或 <code>flowchart LR</code> 声明流程图方向（TD/上下，LR/左右，BT/下上，RL/右左）。</p>
            <p>节点形状：</p>
            <ul>
              <li><code>A[矩形]</code> - 矩形节点</li>
              <li><code>A(圆角)</code> - 圆角矩形</li>
              <li><code>A((圆形))</code> - 圆形</li>
              <li><code>A{菱形}</code> - 菱形（判断）</li>
              <li><code>A&gt;不对称]</code> - 不对称节点</li>
              <li><code>A[/平行四边形/]</code> - 平行四边形</li>
              <li><code>A[(数据库)]</code> - 数据库形状</li>
            </ul>
            <p>连接方式：</p>
            <ul>
              <li><code>A --&gt; B</code> - 箭头</li>
              <li><code>A --- B</code> - 实线无箭头</li>
              <li><code>A -.-&gt; B</code> - 虚线箭头</li>
              <li><code>A ==&gt; B</code> - 粗箭头</li>
              <li><code>A -- 文本 --&gt; B</code> - 带文本的连接</li>
              <li><code>A --&gt;|文本| B</code> - 另一种文本写法</li>
            </ul>
          </div>
        </n-collapse-item>
        <n-collapse-item title="子图与样式" name="subgraph">
          <div class="reference-content">
            <p>子图：</p>
            <pre class="ref-code">flowchart TD
    subgraph 一组
        A --> B
    end
    subgraph 二组
        C --> D
    end
    B --> C</pre>
            <p>样式类：</p>
            <pre class="ref-code">flowchart TD
    A[节点]:::className
    classDef className fill:#f9f,stroke:#333</pre>
            <p>注释：<code>%% 这是注释</code></p>
          </div>
        </n-collapse-item>
        <n-collapse-item title="完整示例" name="example">
          <div class="reference-content">
            <pre class="ref-code">flowchart TD
    Start([开始]) --> Input[/输入数据/]
    Input --> Check{数据有效?}
    Check -->|是| Process[处理数据]
    Check -->|否| Error[显示错误]
    Error --> Input
    Process --> Save[(保存数据库)]
    Save --> End([结束])</pre>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NInput, NTag, NCollapse, NCollapseItem, useMessage } from 'naive-ui'

const message = useMessage()
const input = ref('')

// 生成的 Mermaid 代码（去除空行与首尾空白）
const code = computed(() => {
  if (!input.value.trim()) return ''
  return input.value
    .split('\n')
    .map(l => l.replace(/\s+$/g, ''))
    .filter((l, i, arr) => !(l === '' && (i === 0 || i === arr.length - 1)))
    .join('\n')
    .trim()
})

// 代码高亮（轻量自实现，零依赖）
const highlightedCode = computed(() => {
  let html = code.value
  if (!html) return '<span class="empty">在左侧输入 Mermaid 代码后将在此处显示</span>'
  // 转义 HTML
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 注释
  html = html.replace(/^(\s*%%.*)$/gm, '<span class="hl-comment">$1</span>')

  // 关键字：flowchart / graph / subgraph / end / classDef / class
  html = html.replace(
    /\b(flowchart|graph|subgraph|end|classDef|class|direction)\b/g,
    '<span class="hl-kw">$1</span>'
  )

  // 方向标记
  html = html.replace(/\b(TD|LR|BT|RL|TB)\b/g, '<span class="hl-dir">$1</span>')

  // 节点形状定义（如 A[xxx], B(xxx), C{xxx} 等）
  // 高亮节点 ID（行首）
  html = html.replace(
    /^(\s*)([A-Za-z_][\w]*)/gm,
    '$1<span class="hl-node">$2</span>'
  )

  // 连接线（-->  ---  -.-  ==>  -- text -->
  html = html.replace(
    /(-&gt;|-{2,}|={2,}|-\.|==&gt;|---&gt;|...)/g,
    '<span class="hl-arrow">$1</span>'
  )

  // 节点形状符号
  html = html.replace(
    /(\[\]|\(\)|\{\}|\(\(\)\)|\[\/[^\]]*\/\]|\[\([^\]]*\)\])/g,
    '<span class="hl-shape">$1</span>'
  )

  // 文本标签 |xxx|
  html = html.replace(/\|([^|]+)\|/g, '<span class="hl-label">|$1|</span>')

  // 字符串文本 [xxx] (xxx) {xxx} 中的内容
  html = html.replace(
    /(\[)([^\[\]]+)(\])/g,
    '$1<span class="hl-text">$2</span>$3'
  )

  return html
})

// 复制代码
function copyCode(): void {
  if (!code.value) {
    message.warning('暂无可复制的内容')
    return
  }
  navigator.clipboard.writeText(code.value)
  message.success('Mermaid 代码已复制到剪贴板')
}

// 打开 Mermaid Live Editor（自动带入代码）
function openLiveEditor(): void {
  if (!code.value) {
    message.warning('暂无代码，请先输入')
    return
  }
  // Mermaid Live Editor 支持 URL base64 编码自动加载
  // 格式：https://mermaid.live/edit#base64:<base64-encoded-json>
  // 这里使用更简单的 pako 压缩方案不可行（零依赖），改用纯 base64 方式
  try {
    // 构建 Mermaid Live Editor 期望的 JSON 配置
    const config = {
      code: code.value,
      mermaid: { theme: 'default' },
      autoSync: true,
      updateDiagram: true,
    }
    const json = JSON.stringify(config)
    // base64 编码（兼容 Unicode）
    const b64 = btoa(unescape(encodeURIComponent(json)))
    const url = `https://mermaid.live/edit#base64:${b64}`
    window.open(url, '_blank')
    message.success('已在新窗口打开 Mermaid Live Editor')
  } catch (e) {
    // 降级方案：直接打开编辑器，提示用户手动粘贴
    window.open('https://mermaid.live/edit', '_blank')
    message.info('已打开编辑器，请手动粘贴代码')
  }
}

// 加载示例
function loadExample(): void {
  input.value = `flowchart TD
    Start([开始]) --> Input[/输入用户数据/]
    Input --> Validate{数据校验通过?}
    Validate -->|是| Process[处理业务逻辑]
    Validate -->|否| ShowError[显示错误信息]
    ShowError --> Input
    Process --> Save[(写入数据库)]
    Save --> Notify[发送通知]
    Notify --> End([结束])`
  message.success('示例已加载')
}

function clearAll(): void {
  input.value = ''
  message.success('已清空')
}
</script>

<style scoped>
.flowchart-generator {
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.editor-pane {
  display: flex;
  flex-direction: column;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.code-block {
  background: #1e1e2e;
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #cdd6f4;
  min-height: 420px;
  max-height: 480px;
  white-space: pre;
  margin: 0;
}

.code-block :deep(.empty) {
  color: #6c7086;
  font-style: italic;
}

.code-block :deep(.hl-kw) {
  color: #cba6f7;
  font-weight: 700;
}

.code-block :deep(.hl-dir) {
  color: #f38ba8;
  font-weight: 700;
}

.code-block :deep(.hl-node) {
  color: #89b4fa;
  font-weight: 600;
}

.code-block :deep(.hl-arrow) {
  color: #a6e3a1;
  font-weight: 600;
}

.code-block :deep(.hl-shape) {
  color: #fab387;
}

.code-block :deep(.hl-text) {
  color: #f9e2af;
}

.code-block :deep(.hl-label) {
  color: #94e2d5;
  font-style: italic;
}

.code-block :deep(.hl-comment) {
  color: #6c7086;
  font-style: italic;
}

.preview-section {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fafafa;
}

.hint-text {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin: 8px 0 12px;
}

.reference-section {
  margin-top: 24px;
}

.reference-content {
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.7;
  color: #333;
}

.reference-content code {
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  color: #d63384;
}

.ref-code {
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 12px;
  border-radius: 6px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  overflow-x: auto;
  margin: 8px 0;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }

  .code-block {
    min-height: 240px;
  }
}

/* 深色模式 */
.dark .pane-label {
  color: #888;
}

.dark .preview-section {
  background: #181828;
  border-color: #2a2a4a;
}

.dark .hint-text {
  color: #aaa;
}

.dark .reference-content {
  color: #ddd;
}

.dark .reference-content code {
  background: #2a2a4a;
  color: #f38ba8;
}
</style>
