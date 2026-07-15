<template>
  <div class="sitemap-generator">
    <n-form label-placement="left" label-width="120">
      <n-form-item label="网站域名">
        <n-input v-model:value="baseUrl" placeholder="https://example.com" />
      </n-form-item>
      <n-form-item label="页面路径">
        <n-dynamic-input v-model:value="pages" placeholder="/page-path" />
      </n-form-item>
      <n-form-item label="更新频率">
        <n-select v-model:value="changeFreq" :options="freqOptions" />
      </n-form-item>
      <n-form-item label="优先级">
        <n-slider v-model:value="priority" :min="0" :max="1" :step="0.1" />
        <span class="priority-value">{{ priority.toFixed(1) }}</span>
      </n-form-item>
    </n-form>
    
    <n-button type="primary" @click="generate">生成 Sitemap</n-button>
    
    <div v-if="output" class="output">
      <div class="label">生成的 XML Sitemap</div>
      <n-input :value="output" type="textarea" readonly :rows="15" />
      <n-button @click="copy(output)">复制内容</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NForm, NFormItem, NInput, NButton, NDynamicInput, NSelect, NSlider } from 'naive-ui'

const baseUrl = ref('')
const pages = ref<string[]>(['/'])
const changeFreq = ref('weekly')
const priority = ref(0.8)
const output = ref('')

const freqOptions = [
  { label: 'always', value: 'always' },
  { label: 'hourly', value: 'hourly' },
  { label: 'daily', value: 'daily' },
  { label: 'weekly', value: 'weekly' },
  { label: 'monthly', value: 'monthly' },
  { label: 'yearly', value: 'yearly' },
  { label: 'never', value: 'never' },
]

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function generate() {
  if (!baseUrl.value) return

  const today = new Date().toISOString().split('T')[0]
  const escapedBase = escapeXml(baseUrl.value.replace(/\/$/, ''))
  const urls = pages.value
    .filter(p => p.trim())
    .map(page => {
      const fullUrl = escapedBase + escapeXml(page.trim())
      return `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${escapeXml(changeFreq.value)}</changefreq>
    <priority>${priority.value.toFixed(1)}</priority>
  </url>`
    })
    .join('\n')

  output.value = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.sitemap-generator { max-width: 800px; margin: 0 auto; }
.output { margin-top: 24px; }
.label { margin-bottom: 8px; font-weight: 500; }
.priority-value { margin-left: 12px; font-weight: 500; }
</style>
