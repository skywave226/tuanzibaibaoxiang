<template>
  <div class="yaml-json">
    <div class="toolbar">
      <n-button @click="yamlToJson">YAML → JSON</n-button>
      <n-button @click="jsonToYaml">JSON → YAML</n-button>
    </div>
    <div class="editors">
      <div class="editor">
        <div class="label">YAML</div>
        <n-input v-model:value="yaml" type="textarea" :rows="15" placeholder="key: value" />
      </div>
      <div class="editor">
        <div class="label">JSON</div>
        <n-input v-model:value="json" type="textarea" :rows="15" placeholder='{"key": "value"}' />
      </div>
    </div>
    <n-alert v-if="error" type="error" class="mt-4">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NInput, NButton, NAlert } from 'naive-ui'

const yaml = ref('')
const json = ref('')
const error = ref('')

let jsYaml: typeof import('js-yaml') | null = null

onMounted(async () => {
  jsYaml = await import('js-yaml')
})

const yamlToJson = () => {
  if (!jsYaml) { error.value = '库尚未加载完成，请稍后再试'; return }
  try {
    const obj = jsYaml.load(yaml.value)
    json.value = JSON.stringify(obj, null, 2)
    error.value = ''
  } catch (e: unknown) { error.value = e instanceof Error ? e.message : String(e) }
}

const jsonToYaml = () => {
  if (!jsYaml) { error.value = '库尚未加载完成，请稍后再试'; return }
  try {
    const obj = JSON.parse(json.value)
    yaml.value = jsYaml.dump(obj, { lineWidth: -1, noRefs: true })
    error.value = ''
  } catch (e: unknown) { error.value = e instanceof Error ? e.message : String(e) }
}
</script>

<style scoped>
.yaml-json { max-width: 1200px; margin: 0 auto; }
.toolbar { display: flex; gap: 8px; margin-bottom: 16px; }
.editors { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.label { margin-bottom: 8px; font-weight: 500; }
.mt-4 { margin-top: 16px; }
</style>
