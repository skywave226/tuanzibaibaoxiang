<template>
  <div class="meta-tag-generator">
    <n-form label-placement="left" label-width="120">
      <n-form-item label="页面标题">
        <n-input v-model:value="title" placeholder="页面标题" />
      </n-form-item>
      <n-form-item label="页面描述">
        <n-input v-model:value="description" type="textarea" :rows="2" placeholder="页面描述" />
      </n-form-item>
      <n-form-item label="关键词">
        <n-input v-model:value="keywords" placeholder="关键词1, 关键词2, 关键词3" />
      </n-form-item>
      <n-form-item label="作者">
        <n-input v-model:value="author" placeholder="作者名称" />
      </n-form-item>
      <n-form-item label="OG 图片">
        <n-input v-model:value="ogImage" placeholder="https://example.com/image.jpg" />
      </n-form-item>
      <n-form-item label="Twitter 卡片">
        <n-select v-model:value="twitterCard" :options="twitterCardOptions" />
      </n-form-item>
    </n-form>
    
    <n-button type="primary" @click="generate">生成 Meta 标签</n-button>
    
    <div v-if="output" class="output">
      <div class="label">生成的 HTML 代码</div>
      <n-input :value="output" type="textarea" readonly :rows="15" />
      <n-button @click="copy(output)">复制代码</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NForm, NFormItem, NInput, NButton, NSelect } from 'naive-ui'

const title = ref('')
const description = ref('')
const keywords = ref('')
const author = ref('')
const ogImage = ref('')
const twitterCard = ref('summary_large_image')
const output = ref('')

const twitterCardOptions = [
  { label: 'Summary', value: 'summary' },
  { label: 'Summary Large Image', value: 'summary_large_image' },
]

function generate() {
  const tags: string[] = []
  
  tags.push(`<meta charset="UTF-8">`)
  tags.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`)
  
  if (description.value) {
    tags.push(`<meta name="description" content="${escapeHtml(description.value)}">`)
  }
  
  if (keywords.value) {
    tags.push(`<meta name="keywords" content="${escapeHtml(keywords.value)}">`)
  }
  
  if (author.value) {
    tags.push(`<meta name="author" content="${escapeHtml(author.value)}">`)
  }
  
  tags.push(`<meta property="og:title" content="${escapeHtml(title.value)}">`)
  
  if (description.value) {
    tags.push(`<meta property="og:description" content="${escapeHtml(description.value)}">`)
  }
  
  if (ogImage.value) {
    tags.push(`<meta property="og:image" content="${escapeHtml(ogImage.value)}">`)
  }
  
  tags.push(`<meta name="twitter:card" content="${escapeHtml(twitterCard.value)}">`)
  tags.push(`<meta name="twitter:title" content="${escapeHtml(title.value)}">`)
  
  if (description.value) {
    tags.push(`<meta name="twitter:description" content="${escapeHtml(description.value)}">`)
  }
  
  if (ogImage.value) {
    tags.push(`<meta name="twitter:image" content="${escapeHtml(ogImage.value)}">`)
  }
  
  output.value = tags.join('\n')
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.meta-tag-generator { max-width: 800px; margin: 0 auto; }
.output { margin-top: 24px; }
.label { margin-bottom: 8px; font-weight: 500; }
</style>
