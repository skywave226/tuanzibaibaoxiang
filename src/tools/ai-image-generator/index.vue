<template>
  <div class="ai-image-generator">
    <n-alert type="info" class="mb-4">
      调用你提供的 OpenAI 兼容图像生成接口（支持自定义 baseURL、API Key、模型）。所有配置仅保存在浏览器本地。
    </n-alert>

    <n-collapse class="mb-4">
      <n-collapse-item title="接口配置" name="config">
        <div class="config-grid">
          <div class="config-item">
            <label>API Base URL</label>
            <n-input v-model:value="config.baseURL" placeholder="https://api.openai.com/v1" />
          </div>
          <div class="config-item">
            <label>API Key</label>
            <n-input v-model:value="config.apiKey" type="password" show-password-on="mousedown" placeholder="sk-..." />
          </div>
          <div class="config-item">
            <label>模型</label>
            <n-input v-model:value="config.model" placeholder="dall-e-3" />
          </div>
        </div>
        <div class="mt-3">
          <n-button size="small" @click="saveConfig">保存配置到本地</n-button>
        </div>
      </n-collapse-item>
    </n-collapse>

    <div class="card mb-4">
      <div class="pane-label mb-2">提示词</div>
      <n-input
        v-model:value="prompt"
        type="textarea"
        :rows="4"
        placeholder="描述你想生成的图片内容，例如：一只戴着墨镜的猫坐在沙滩上..."
      />

      <div class="options mt-4">
        <span>图片尺寸</span>
        <n-radio-group v-model:value="size" size="small">
          <n-radio-button value="1024x1024">1024×1024</n-radio-button>
          <n-radio-button value="1024x1792">1024×1792</n-radio-button>
          <n-radio-button value="1792x1024">1792×1024</n-radio-button>
          <n-radio-button value="512x512">512×512</n-radio-button>
        </n-radio-group>
      </div>

      <div class="options mt-4">
        <span>生成数量</span>
        <n-input-number v-model:value="n" :min="1" :max="4" />
        <span class="ml-4">自定义尺寸</span>
        <n-input v-model:value="customSize" placeholder="例如 768x512" style="width: 140px" />
      </div>

      <div class="toolbar mt-4">
        <n-button type="primary" @click="generate" :loading="loading" :disabled="!prompt.trim()">
          生成图片
        </n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <div class="card" v-if="images.length">
      <div class="result-header mb-3 flex justify-between items-center flex-wrap gap-2">
        <h3 class="text-sm font-bold">生成结果</h3>
        <n-button size="small" @click="downloadAll" :disabled="images.length === 1">打包下载</n-button>
      </div>
      <div class="images-grid">
        <div v-for="(img, index) in images" :key="index" class="image-card">
          <img :src="img.url" :alt="`生成结果 ${index + 1}`" />
          <div class="image-actions">
            <span>图片 {{ index + 1 }}</span>
            <n-button size="tiny" quaternary @click="downloadImage(img.url, index)">下载</n-button>
          </div>
        </div>
      </div>
    </div>

    <n-alert v-if="error" type="error" class="mt-4" closable @close="error = ''">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NAlert, NCollapse, NCollapseItem, NInput, NButton, NRadioGroup, NRadioButton, NInputNumber } from 'naive-ui'

interface Config {
  baseURL: string
  apiKey: string
  model: string
}

interface GeneratedImage {
  url: string
  revisedPrompt?: string
}

const CONFIG_KEY = 'ai_image_generator_config'

const config = ref<Config>({
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'dall-e-3',
})

const prompt = ref('')
const size = ref('1024x1024')
const n = ref(1)
const customSize = ref('')
const images = ref<GeneratedImage[]>([])
const loading = ref(false)
const error = ref('')

onMounted(() => {
  const saved = localStorage.getItem(CONFIG_KEY)
  if (saved) {
    try {
      config.value = JSON.parse(saved)
    } catch {
      // ignore
    }
  }
})

function saveConfig() {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config.value))
}

function getSize(): string {
  return customSize.value.trim() || size.value
}

async function generate() {
  error.value = ''
  images.value = []
  loading.value = true

  if (!config.value.baseURL || !config.value.apiKey) {
    error.value = '请先填写 API Base URL 和 API Key'
    loading.value = false
    return
  }

  try {
    const url = config.value.baseURL.replace(/\/$/, '') + '/images/generations'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.value.apiKey}`,
      },
      body: JSON.stringify({
        model: config.value.model,
        prompt: prompt.value,
        n: n.value,
        size: getSize(),
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`HTTP ${response.status}: ${err}`)
    }

    const data = await response.json()
    images.value = data.data?.map((item: any) => ({
      url: item.url || '',
      revisedPrompt: item.revised_prompt || '',
    })) || []

    if (images.value.length === 0) {
      throw new Error('接口未返回图片')
    }
  } catch (e: unknown) {
    error.value = '生成失败：' + (e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

async function downloadAll() {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  let completed = 0

  await Promise.all(images.value.map(async (img, index) => {
    try {
      const res = await fetch(img.url)
      const blob = await res.blob()
      zip.file(`generated-${String(index + 1).padStart(3, '0')}.png`, blob)
      completed++
    } catch {
      // ignore single failure
    }
  }))

  if (completed === 0) {
    error.value = '下载失败，图片链接无法访问'
    return
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, 'ai-images.zip')
}

function downloadImage(url: string, index: number) {
  const a = document.createElement('a')
  a.href = url
  a.download = `generated-${String(index + 1).padStart(3, '0')}.png`
  a.target = '_blank'
  a.click()
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function clear() {
  prompt.value = ''
  images.value = []
  error.value = ''
}
</script>

<style scoped>
.ai-image-generator { max-width: 900px; margin: 0 auto; }

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label { color: #aaa; }

.options {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar { display: flex; gap: 12px; }

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.image-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.dark .image-card { border-color: #2a2a4a; }

.image-card img {
  width: 100%;
  height: auto;
  display: block;
}

.image-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
}

.ml-4 { margin-left: 16px; }
</style>
