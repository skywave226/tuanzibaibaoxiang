<template>
  <div class="json-tree-viewer">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="parseTree">解析</n-button>
        <n-button @click="expandAll">全部展开</n-button>
        <n-button @click="collapseAll">全部折叠</n-button>
        <n-button @click="loadExample">示例</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
      <n-tag v-if="errorMsg" type="error">{{ errorMsg }}</n-tag>
      <n-tag v-else-if="rootNodes.length > 0" type="success">解析成功</n-tag>
    </div>

    <div class="editor-area">
      <!-- 左侧：JSON 输入 -->
      <div class="editor-pane">
        <div class="pane-label">JSON 输入</div>
        <n-input
          v-model:value="input"
          type="textarea"
          placeholder='粘贴 JSON，例如：{"name":"Tom","age":20}'
          class="code-input"
          :autosize="false"
          rows="20"
        />
      </div>

      <!-- 右侧：树形展示 -->
      <div class="editor-pane">
        <div class="pane-header">
          <span class="pane-label">树形视图</span>
          <n-input
            v-model:value="searchKeyword"
            size="small"
            placeholder="搜索 key/value"
            clearable
            class="search-input"
          >
            <template #prefix>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </template>
          </n-input>
        </div>
        <div class="tree-view">
          <n-empty v-if="rootNodes.length === 0" description="输入 JSON 并点击解析" />
          <div v-else class="tree-nodes">
            <template v-for="(node, _idx) in rootNodes" :key="_idx">
              <json-node
                :node="node"
                :path="node.key"
                :search="searchKeyword"
                :expanded-set="expandedSet"
                @copy-path="handleCopyPath"
                @toggle="handleToggle"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, h, VNode } from 'vue'
import { NButton, NSpace, NInput, NTag, NEmpty, useMessage } from 'naive-ui'

// 树节点数据结构
interface TreeNode {
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'
  children: TreeNode[]
}

const message = useMessage()
const input = ref('')
const errorMsg = ref('')
const rootNodes = ref<TreeNode[]>([])
const searchKeyword = ref('')
// 展开的节点 path 集合
const expandedSet = ref<Set<string>>(new Set())

// 判断 JSON 数据类型
function getType(val: any): TreeNode['type'] {
  if (val === null) return 'null'
  if (Array.isArray(val)) return 'array'
  const t = typeof val
  if (t === 'string' || t === 'number' || t === 'boolean') return t
  return 'object'
}

// 把 JSON 转换为树节点结构
function buildTree(val: any, key: string): TreeNode {
  const type = getType(val)
  const node: TreeNode = { key, value: val, type, children: [] }
  if (type === 'object') {
    Object.keys(val).forEach(k => {
      node.children.push(buildTree(val[k], k))
    })
  } else if (type === 'array') {
    val.forEach((item: any, idx: number) => {
      node.children.push(buildTree(item, String(idx)))
    })
  }
  return node
}

// 解析 JSON
function parseTree(): void {
  errorMsg.value = ''
  rootNodes.value = []
  expandedSet.value = new Set()
  if (!input.value.trim()) {
    errorMsg.value = '请输入 JSON 文本'
    return
  }
  try {
    const obj = JSON.parse(input.value)
    if (typeof obj === 'object' && obj !== null) {
      const isArr = Array.isArray(obj)
      rootNodes.value = [buildTree(obj, isArr ? 'root[]' : 'root{}')]
    } else {
      rootNodes.value = [buildTree(obj, 'root')]
    }
    // 默认展开第一层
    expandedSet.value = new Set(['root{}', 'root[]', 'root'])
    message.success('解析成功')
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
  }
}

// 递归收集所有对象/数组的路径
function collectPaths(node: TreeNode, path: string, set: Set<string>): void {
  if (node.type === 'object' || node.type === 'array') {
    set.add(path)
    node.children.forEach(child => {
      collectPaths(child, `${path}.${child.key}`, set)
    })
  }
}

function expandAll(): void {
  const set = new Set<string>()
  rootNodes.value.forEach(n => collectPaths(n, n.key, set))
  expandedSet.value = set
}

function collapseAll(): void {
  expandedSet.value = new Set()
}

// 复制路径
function handleCopyPath(path: string): void {
  // 去掉根包装符号，输出标准 JSON Pointer 风格路径
  const formatted = path
    .replace(/^root(\{\}|\[\])?/, '')
    .replace(/^\./, '')
  navigator.clipboard.writeText(formatted || path)
  message.success(`已复制路径：${formatted || path}`)
}

// 切换节点展开状态
function handleToggle(path: string): void {
  const set = new Set(expandedSet.value)
  if (set.has(path)) set.delete(path)
  else set.add(path)
  expandedSet.value = set
}

// 加载示例
function loadExample(): void {
  input.value = JSON.stringify({
    name: 'Tom',
    age: 28,
    married: false,
    spouse: null,
    hobbies: ['reading', 'coding', 'traveling'],
    address: {
      city: 'Beijing',
      zip: '100000',
      geo: { lat: 39.9, lng: 116.4 },
    },
    scores: [98, 85, 92],
  }, null, 2)
  parseTree()
}

function clearAll(): void {
  input.value = ''
  errorMsg.value = ''
  rootNodes.value = []
  expandedSet.value = new Set()
  searchKeyword.value = ''
}

// 类型颜色映射
const typeColorMap: Record<string, string> = {
  string: '#63e2b7',
  number: '#fab387',
  boolean: '#f38ba8',
  null: '#6c7086',
  object: '#89b4fa',
  array: '#f9e2af',
}
const keyColor = '#cba6f7'

// 递归渲染单个节点（使用 defineComponent 实现自引用）
const JsonNode: ReturnType<typeof defineComponent> = defineComponent({
  name: 'JsonNode',
  props: {
    node: { type: Object as () => TreeNode, required: true },
    path: { type: String, required: true },
    search: { type: String, default: '' },
    expandedSet: { type: Object as () => Set<string>, required: true },
  },
  emits: ['copy-path', 'toggle'],
  setup(props, { emit }) {
    // 判断文本是否匹配搜索
    function matchSearch(text: string): boolean {
      if (!props.search) return true
      return text.toLowerCase().includes(props.search.toLowerCase())
    }

    // 判断子树是否含有匹配项
    function hasMatch(node: TreeNode): boolean {
      if (matchSearch(node.key)) return true
      if (node.type === 'string' || node.type === 'number' || node.type === 'boolean') {
        return matchSearch(String(node.value))
      }
      return node.children.some(c => hasMatch(c))
    }

    return (): VNode | null => {
      const node = props.node
      const fullPath = props.path
      const hasChildren = node.type === 'object' || node.type === 'array'
      const expanded = props.expandedSet.has(fullPath)
      // 搜索时不显示无匹配项的节点
      const shouldShow = !props.search || hasMatch(node)
      if (!shouldShow) return null

      const isRoot = node.key.startsWith('root')

      // 渲染值预览
      const renderValuePreview = () => {
        if (node.type === 'object') {
          return h('span', { class: 'preview' }, `{} (${node.children.length})`)
        }
        if (node.type === 'array') {
          return h('span', { class: 'preview' }, `[] (${node.children.length})`)
        }
        if (node.type === 'null') {
          return h('span', { class: 'value null' }, 'null')
        }
        if (node.type === 'string') {
          const str = String(node.value)
          const display = str.length > 60 ? str.slice(0, 60) + '…' : str
          return h('span', { class: 'value string' }, `"${display}"`)
        }
        if (node.type === 'boolean') {
          return h('span', { class: 'value boolean' }, String(node.value))
        }
        return h('span', { class: 'value number' }, String(node.value))
      }

      // 顶层节点直接渲染容器
      if (isRoot && hasChildren) {
        return h('div', { class: 'tree-root' }, [
          h('div', { class: 'tree-row root-row' }, [
            h('span', {
              class: ['toggle', expanded ? 'expanded' : ''],
              onClick: (e: Event) => {
                e.stopPropagation()
                emit('toggle', fullPath)
              },
            }, expanded ? '▼' : '▶'),
            h('span', { class: 'root-label' }, node.key),
            h('span', { class: 'preview' }, `(${node.children.length})`),
          ]),
          expanded && h('div', { class: 'tree-children' },
            node.children.map((child, idx) =>
              h(JsonNode, {
                key: idx,
                node: child,
                path: `${fullPath}.${child.key}`,
                search: props.search,
                expandedSet: props.expandedSet,
                onCopyPath: (p: string) => emit('copy-path', p),
                onToggle: (p: string) => emit('toggle', p),
              })
            )
          ),
        ])
      }

      // 普通节点行
      const rowChildren: any[] = []
      rowChildren.push(h('span', {
        class: ['toggle', !hasChildren ? 'leaf' : expanded ? 'expanded' : ''],
        onClick: (e: Event) => {
          if (!hasChildren) return
          e.stopPropagation()
          emit('toggle', fullPath)
        },
      }, hasChildren ? (expanded ? '▼' : '▶') : '•'))

      if (node.key && !isRoot) {
        rowChildren.push(h('span', { class: 'key', style: { color: keyColor } }, `"${node.key}":`))
      }

      // 展开时不显示值预览（除非是叶子），折叠时显示预览
      if (!hasChildren || !expanded) {
        rowChildren.push(renderValuePreview())
      } else {
        rowChildren.push(renderValuePreview())
      }

      // 复制路径按钮
      rowChildren.push(h('span', {
        class: 'copy-btn',
        title: '复制路径',
        onClick: (e: Event) => {
          e.stopPropagation()
          emit('copy-path', fullPath)
        },
      }, '⧉'))

      const row = h('div', {
        class: 'tree-row',
        style: { '--node-color': typeColorMap[node.type] },
      }, rowChildren)

      // 子节点
      let childNodes: any = null
      if (hasChildren && expanded) {
        childNodes = h('div', { class: 'tree-children' },
          node.children.map((child, idx) =>
            h(JsonNode, {
              key: idx,
              node: child,
              path: `${fullPath}.${child.key}`,
              search: props.search,
              expandedSet: props.expandedSet,
              onCopyPath: (p: string) => emit('copy-path', p),
              onToggle: (p: string) => emit('toggle', p),
            })
          )
        )
      }

      return h('div', {
        class: ['tree-node', props.search && hasMatch(node) ? 'matched' : ''],
      }, [row, childNodes])
    }
  },
})
</script>

<style scoped>
.json-tree-viewer {
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

.search-input {
  width: 220px;
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.tree-view {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  height: 480px;
  overflow: auto;
  background: #fafafa;
}

.tree-nodes {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.8;
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: default;
}

.tree-row:hover {
  background: rgba(137, 180, 250, 0.1);
}

.tree-row:hover .copy-btn {
  opacity: 1;
}

.toggle {
  width: 14px;
  display: inline-block;
  text-align: center;
  color: #888;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.toggle.leaf {
  color: #bbb;
  cursor: default;
}

.root-row {
  font-weight: 700;
}

.root-label {
  color: #89b4fa;
}

.key {
  font-weight: 600;
}

.value {
  font-weight: 500;
}

.value.string {
  color: #63e2b7;
}

.value.number {
  color: #fab387;
}

.value.boolean {
  color: #f38ba8;
}

.value.null {
  color: #6c7086;
  font-style: italic;
}

.preview {
  color: #999;
  margin-left: 4px;
}

.copy-btn {
  margin-left: auto;
  cursor: pointer;
  color: #888;
  opacity: 0;
  font-size: 14px;
  padding: 0 4px;
  transition: opacity 0.2s, color 0.2s;
}

.copy-btn:hover {
  color: #36ad6a;
}

.tree-children {
  margin-left: 22px;
  border-left: 1px dashed #e0e0e0;
  padding-left: 8px;
}

.tree-node.matched > .tree-row {
  background: rgba(249, 226, 175, 0.18);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }

  .tree-view {
    height: 360px;
  }
}

/* 深色模式 */
.dark .pane-label {
  color: #888;
}

.dark .tree-view {
  border-color: #2a2a4a;
  background: #181828;
}

.dark .toggle {
  color: #888;
}

.dark .tree-row:hover {
  background: rgba(137, 180, 250, 0.15);
}

.dark .tree-children {
  border-left-color: #2a2a4a;
}

.dark .copy-btn {
  color: #888;
}

.dark .preview {
  color: #666;
}
</style>
