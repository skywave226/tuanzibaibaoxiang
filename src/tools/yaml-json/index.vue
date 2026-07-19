<template>
  <div class="yaml-json">
    <div class="toolbar mb-3 flex items-center gap-3 flex-wrap">
      <n-space>
        <n-button @click="convert('yaml-to-json')">YAML → JSON</n-button>
        <n-button @click="convert('json-to-yaml')">JSON → YAML</n-button>
        <n-button @click="convert('yaml-to-toml')">YAML → TOML</n-button>
        <n-button @click="convert('toml-to-yaml')">TOML → YAML</n-button>
        <n-button @click="convert('json-to-toml')">JSON → TOML</n-button>
        <n-button @click="convert('toml-to-json')">TOML → JSON</n-button>
      </n-space>
      <n-button size="small" @click="loadExample">示例</n-button>
    </div>

    <div class="editors">
      <div class="editor">
        <div class="label flex justify-between">
          <span>输入</span>
          <div class="flex gap-2">
            <n-button size="tiny" quaternary @click="copyText(inputValue)">复制</n-button>
            <n-button size="tiny" quaternary @click="clearInput">清空</n-button>
          </div>
        </div>
        <n-tabs v-model:value="inputFormat" type="segment" size="small" class="mb-2">
          <n-tab-pane name="yaml" tab="YAML"></n-tab-pane>
          <n-tab-pane name="json" tab="JSON"></n-tab-pane>
          <n-tab-pane name="toml" tab="TOML"></n-tab-pane>
        </n-tabs>
        <n-input v-model:value="inputValue" type="textarea" :rows="18" placeholder="在此输入内容" />
      </div>
      <div class="editor">
        <div class="label flex justify-between">
          <span>输出</span>
          <div class="flex gap-2">
            <n-button size="tiny" quaternary @click="copyText(outputValue)" :disabled="!outputValue">复制</n-button>
            <n-button size="tiny" quaternary @click="downloadOutput" :disabled="!outputValue">下载</n-button>
          </div>
        </div>
        <n-tabs v-model:value="outputFormat" type="segment" size="small" class="mb-2">
          <n-tab-pane name="yaml" tab="YAML"></n-tab-pane>
          <n-tab-pane name="json" tab="JSON"></n-tab-pane>
          <n-tab-pane name="toml" tab="TOML"></n-tab-pane>
        </n-tabs>
        <n-input v-model:value="outputValue" type="textarea" :rows="18" readonly placeholder="转换结果" />
      </div>
    </div>

    <n-alert v-if="error" type="error" class="mt-4" closable @close="error = ''">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NInput, NButton, NAlert, NTabs, NTabPane, NSpace, useMessage } from 'naive-ui'

const message = useMessage()
type Format = 'yaml' | 'json' | 'toml'

const inputFormat = ref<Format>('yaml')
const outputFormat = ref<Format>('json')
const inputValue = ref('')
const outputValue = ref('')
const error = ref('')

let jsYaml: typeof import('js-yaml') | null = null
let toml: typeof import('@iarna/toml') | null = null

onMounted(async () => {
  const [yamlMod, tomlMod] = await Promise.all([
    import('js-yaml'),
    import('@iarna/toml')
  ])
  jsYaml = yamlMod
  toml = tomlMod
})

function setFormats(from: Format, to: Format) {
  inputFormat.value = from
  outputFormat.value = to
}

function parseInput(format: Format): unknown {
  if (format === 'yaml') {
    if (!jsYaml) throw new Error('YAML 库尚未加载')
    return jsYaml.load(inputValue.value)
  }
  if (format === 'json') {
    return JSON.parse(inputValue.value)
  }
  if (format === 'toml') {
    if (!toml) throw new Error('TOML 库尚未加载')
    return toml.parse(inputValue.value)
  }
  throw new Error('未知格式')
}

function stringifyOutput(data: unknown, format: Format): string {
  if (format === 'yaml') {
    if (!jsYaml) throw new Error('YAML 库尚未加载')
    return jsYaml.dump(data, { lineWidth: -1, noRefs: true })
  }
  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }
  if (format === 'toml') {
    if (!toml) throw new Error('TOML 库尚未加载')
    return toml.stringify(data as any)
  }
  throw new Error('未知格式')
}

function convert(mode: string) {
  error.value = ''
  outputValue.value = ''

  const map: Record<string, [Format, Format]> = {
    'yaml-to-json': ['yaml', 'json'],
    'json-to-yaml': ['json', 'yaml'],
    'yaml-to-toml': ['yaml', 'toml'],
    'toml-to-yaml': ['toml', 'yaml'],
    'json-to-toml': ['json', 'toml'],
    'toml-to-json': ['toml', 'json'],
  }

  const [from, to] = map[mode]
  setFormats(from, to)

  try {
    const data = parseInput(from)
    outputValue.value = stringifyOutput(data, to)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function copyText(text: string) {
  navigator.clipboard.writeText(text)
  message.success('已复制')
}

function clearInput() {
  inputValue.value = ''
  outputValue.value = ''
  error.value = ''
}

function downloadOutput() {
  const map: Record<Format, string> = { yaml: 'yml', json: 'json', toml: 'toml' }
  const blob = new Blob([outputValue.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `result.${map[outputFormat.value]}`
  a.click()
  URL.revokeObjectURL(url)
}

function loadExample() {
  inputFormat.value = 'yaml'
  inputValue.value = `name: 团子百宝箱
version: 1.0.0
author:
  name: skywave226
  email: dev@example.com
tools:
  - text-diff
  - markdown-preview
  - yaml-json
config:
  theme: dark
  max_history: 50
`
}
</script>

<style scoped>
.yaml-json { max-width: 1200px; margin: 0 auto; }
.toolbar { display: flex; gap: 8px; flex-wrap: wrap; justify-content: space-between; }
.editors { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.label { margin-bottom: 8px; font-weight: 500; font-size: 13px; color: #666; display: flex; align-items: center; }
.dark .label { color: #aaa; }

@media (max-width: 768px) {
  .editors { grid-template-columns: 1fr; }
}
</style>
