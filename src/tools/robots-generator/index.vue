<template>
  <div class="robots-generator">
    <n-form label-placement="left" label-width="150">
      <n-form-item label="User-agent">
        <n-input v-model:value="userAgent" placeholder="* 或特定爬虫（如 Googlebot）" />
      </n-form-item>
      <n-form-item label="允许访问路径">
        <n-dynamic-input v-model:value="allowPaths" placeholder="/path/" />
      </n-form-item>
      <n-form-item label="禁止访问路径">
        <n-dynamic-input v-model:value="disallowPaths" placeholder="/admin/" />
      </n-form-item>
      <n-form-item label="Crawl-delay（秒）">
        <n-input-number v-model:value="crawlDelay" :min="0" :max="60" />
      </n-form-item>
      <n-form-item label="Sitemap 地址">
        <n-input v-model:value="sitemap" placeholder="https://example.com/sitemap.xml" />
      </n-form-item>
    </n-form>
    
    <n-button type="primary" @click="generate">生成 robots.txt</n-button>
    
    <div v-if="output" class="output">
      <div class="label">生成的 robots.txt</div>
      <n-input :value="output" type="textarea" readonly :rows="12" />
      <n-button @click="copy(output)">复制内容</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NButton, NDynamicInput } from 'naive-ui'

const userAgent = ref('*')
const allowPaths = ref<string[]>(['/'])
const disallowPaths = ref<string[]>([])
const crawlDelay = ref(0)
const sitemap = ref('')
const output = ref('')

function generate() {
  const lines: string[] = []
  
  lines.push(`User-agent: ${userAgent.value}`)
  
  allowPaths.value.forEach(path => {
    if (path.trim()) {
      lines.push(`Allow: ${path.trim()}`)
    }
  })
  
  disallowPaths.value.forEach(path => {
    if (path.trim()) {
      lines.push(`Disallow: ${path.trim()}`)
    }
  })
  
  if (crawlDelay.value > 0) {
    lines.push(`Crawl-delay: ${crawlDelay.value}`)
  }
  
  if (sitemap.value) {
    lines.push('')
    lines.push(`Sitemap: ${sitemap.value}`)
  }
  
  output.value = lines.join('\n')
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.robots-generator { max-width: 800px; margin: 0 auto; }
.output { margin-top: 24px; }
.label { margin-bottom: 8px; font-weight: 500; }
</style>
