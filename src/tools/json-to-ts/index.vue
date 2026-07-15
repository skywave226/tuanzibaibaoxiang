<template>
  <div class="json-to-ts">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="convert">生成类型</n-button>
        <n-button @click="copy" :disabled="!result">复制</n-button>
        <n-button @click="clear">清空</n-button>
      </n-space>
      <n-space>
        <n-radio-group v-model:value="exportMode" size="small">
          <n-radio-button value="interface">interface</n-radio-button>
          <n-radio-button value="type">type</n-radio-button>
        </n-radio-group>
        <n-input v-model:value="rootName" placeholder="根类型名" style="width: 160px" />
      </n-space>
    </div>

    <div class="options mb-4">
      <n-space>
        <n-checkbox v-model:checked="optionalFields">可选字段（null/undefined）</n-checkbox>
        <n-checkbox v-model:checked="readonlyFields">只读字段（readonly）</n-checkbox>
        <n-checkbox v-model:checked="exportKeyword">导出（export）</n-checkbox>
      </n-space>
    </div>

    <div class="editor-area">
      <div class="editor-pane">
        <div class="pane-label">JSON 输入</div>
        <n-input
          v-model:value="input"
          type="textarea"
          placeholder='粘贴 JSON，例如：{"name":"Tom","age":18,"tags":["a","b"]}'
          rows="16"
          :autosize="false"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label">TypeScript 类型定义</div>
        <n-input
          :value="result"
          type="textarea"
          readonly
          rows="16"
          :autosize="false"
          class="code-output"
        />
      </div>
    </div>

    <n-alert type="error" v-if="errorMsg" class="mt-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>

    <div class="examples card mt-4">
      <h3 class="text-sm font-bold mb-3">示例</h3>
      <n-space vertical size="small">
        <n-button
          v-for="(ex, i) in examples"
          :key="i"
          text
          size="small"
          @click="loadExample(i)"
          class="example-btn"
        >
          {{ ex.label }}
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace, NInput, NAlert, NRadioGroup, NRadioButton, NCheckbox } from 'naive-ui'
import { useMessage } from 'naive-ui'

const message = useMessage()
const input = ref('')
const result = ref('')
const errorMsg = ref('')
const rootName = ref('RootObject')
const exportMode = ref<'interface' | 'type'>('interface')
const optionalFields = ref(true)
const readonlyFields = ref(false)
const exportKeyword = ref(true)

const examples = [
  {
    label: '用户对象',
    json: '{"name":"Tom","age":18,"email":"tom@example.com","isActive":true,"tags":["vip","new"],"address":{"city":"北京","zip":"100000"}}',
  },
  {
    label: '数组',
    json: '[{"id":1,"name":"a"},{"id":2,"name":"b"}]',
  },
  {
    label: '嵌套结构',
    json: '{"users":[{"id":1,"name":"Tom"},{"id":2,"name":"Jerry"}],"total":2,"page":1,"hasMore":false}',
  },
  {
    label: '复杂类型',
    json: '{"name":null,"count":0,"price":9.99,"createdAt":"2024-01-01","tags":[],"meta":{"key":null}}',
  },
]

interface FieldInfo {
  name: string
  type: string
  optional: boolean
}

interface InterfaceInfo {
  name: string
  fields: FieldInfo[]
  nested: InterfaceInfo[]
}

let interfaceCounter = 0

function resetCounter() {
  interfaceCounter = 0
}

function getNextName(base: string): string {
  interfaceCounter++
  return `${base}${interfaceCounter}`
}

function inferType(value: any, parentName: string): { type: string; interfaces: InterfaceInfo[] } {
  if (value === null) {
    return { type: 'null', interfaces: [] }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'any[]', interfaces: [] }
    }
    // 取所有元素的类型联合
    const elementTypes: string[] = []
    const allInterfaces: InterfaceInfo[] = []
    const seenTypes = new Set<string>()

    for (const item of value) {
      const { type, interfaces } = inferType(item, parentName)
      const flatType = type.replace(/\s+/g, '')
      if (!seenTypes.has(flatType)) {
        seenTypes.add(flatType)
        elementTypes.push(type)
        allInterfaces.push(...interfaces)
      }
    }

    // 数组元素类型为联合类型
    const elementType = elementTypes.length === 1 ? elementTypes[0] : elementTypes.join(' | ')
    return { type: `(${elementType})[]`, interfaces: allInterfaces }
  }

  const type = typeof value

  if (type === 'string') return { type: 'string', interfaces: [] }
  if (type === 'number') return { type: 'number', interfaces: [] }
  if (type === 'boolean') return { type: 'boolean', interfaces: [] }
  if (type === 'undefined') return { type: 'undefined', interfaces: [] }

  if (type === 'object') {
    const interfaceName = getNextName(parentName)
    const fields: FieldInfo[] = []
    const nested: InterfaceInfo[] = []
    const ownInterface: InterfaceInfo = { name: interfaceName, fields, nested: [] }

    for (const key of Object.keys(value)) {
      const fieldValue = value[key]
      const { type: fieldType, interfaces: fieldInterfaces } = inferType(fieldValue, interfaceName)
      const optional = optionalFields.value && (fieldValue === null || fieldValue === undefined)
      fields.push({ name: formatKeyName(key), type: fieldType, optional })
      nested.push(...fieldInterfaces)
    }

    ownInterface.nested = nested
    return {
      type: interfaceName,
      interfaces: [ownInterface, ...nested],
    }
  }

  return { type: 'any', interfaces: [] }
}

function formatKeyName(name: string): string {
  // 非合法标识符需要加引号
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return `"${name}"`
  }
  return name
}

function deduplicateInterfaces(interfaces: InterfaceInfo[]): InterfaceInfo[] {
  const seen = new Set<string>()
  const result: InterfaceInfo[] = []
  for (const iface of interfaces) {
    const signature = `${iface.name}:${JSON.stringify(iface.fields)}`
    if (!seen.has(signature)) {
      seen.add(signature)
      result.push(iface)
    }
  }
  return result
}

function formatInterface(iface: InterfaceInfo): string {
  const prefix = (exportKeyword.value ? 'export ' : '') + (readonlyFields.value ? 'readonly ' : '')
  const keyword = exportMode.value === 'interface' ? 'interface' : 'type'

  if (exportMode.value === 'type') {
    const fieldsStr = iface.fields.map(f => {
      const opt = f.optional ? '?' : ''
      return `  ${readonlyFields.value ? 'readonly ' : ''}${f.name}${opt}: ${f.type};`
    }).join('\n')
    return `${prefix}${iface.name} = {\n${fieldsStr}\n}`
  }

  const fieldsStr = iface.fields.map(f => {
    const opt = f.optional ? '?' : ''
    return `  ${readonlyFields.value ? 'readonly ' : ''}${f.name}${opt}: ${f.type};`
  }).join('\n')
  return `${prefix}${keyword} ${iface.name} {\n${fieldsStr}\n}`
}

function convert() {
  errorMsg.value = ''
  result.value = ''

  if (!input.value.trim()) {
    errorMsg.value = '请输入 JSON'
    return
  }

  let json: any
  try {
    json = JSON.parse(input.value)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = 'JSON 解析失败：' + msg
    return
  }

  resetCounter()
  const rootNameValue = rootName.value.trim() || 'RootObject'
  const { type: rootType, interfaces } = inferType(json, rootNameValue)

  // 如果是数组，根类型名应为元素类型
  const deduped = deduplicateInterfaces(interfaces)

  // 找到根接口
  const rootInterface = deduped.find(i => i.name === rootType)
  let output = ''

  if (rootInterface) {
    // 重命名根接口为用户指定名称
    rootInterface.name = rootNameValue
    // 输出所有接口（根接口在前）
    const others = deduped.filter(i => i.name !== rootType && i.name !== rootNameValue)
    output = formatInterface(rootInterface)
    if (others.length > 0) {
      output += '\n\n' + others.map(formatInterface).join('\n\n')
    }
    // 替换类型引用
    output = output.replace(new RegExp(`\\b${rootType}\\b`, 'g'), rootNameValue)
  } else {
    // 根是基本类型
    const prefix = exportKeyword.value ? 'export ' : ''
    output = `${prefix}type ${rootNameValue} = ${rootType}`
  }

  result.value = output
}

function loadExample(index: number) {
  input.value = examples[index].json
  convert()
}

function copy() {
  navigator.clipboard.writeText(result.value)
  message.success('已复制到剪贴板')
}

function clear() {
  input.value = ''
  result.value = ''
  errorMsg.value = ''
}
</script>

<style scoped>
.json-to-ts {
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

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.code-output :deep(textarea),
.example-btn {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
