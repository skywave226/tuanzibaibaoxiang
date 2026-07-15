<template>
  <div class="code-minifier">
    <n-tabs type="segment">
      <n-tab-pane name="html" tab="HTML">
        <n-input v-model:value="htmlInput" type="textarea" :rows="10" placeholder="HTML 代码..." />
        <div class="toolbar">
          <n-button @click="minifyHtml">压缩</n-button>
          <n-button @click="formatHtml">美化</n-button>
        </div>
        <n-input :value="htmlOutput" type="textarea" readonly :rows="10" />
      </n-tab-pane>
      <n-tab-pane name="css" tab="CSS">
        <n-input v-model:value="cssInput" type="textarea" :rows="10" placeholder="CSS 代码..." />
        <div class="toolbar">
          <n-button @click="minifyCss">压缩</n-button>
          <n-button @click="formatCss">美化</n-button>
        </div>
        <n-input :value="cssOutput" type="textarea" readonly :rows="10" />
      </n-tab-pane>
      <n-tab-pane name="js" tab="JavaScript">
        <n-input v-model:value="jsInput" type="textarea" :rows="10" placeholder="JavaScript 代码..." />
        <div class="toolbar">
          <n-button @click="minifyJs">压缩</n-button>
        </div>
        <n-input :value="jsOutput" type="textarea" readonly :rows="10" />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NTabs, NTabPane, NInput, NButton } from 'naive-ui'

const htmlInput = ref('')
const htmlOutput = ref('')
const cssInput = ref('')
const cssOutput = ref('')
const jsInput = ref('')
const jsOutput = ref('')

let terserMod: any = null

onMounted(async () => {
  terserMod = await import('terser')
})

// 浏览器可用的轻量 HTML 压缩
function minifyHtmlSimple(html: string): string {
  // 移除注释
  let result = html.replace(/<!--[\s\S]*?-->/g, '')
  // 保留 pre/textarea/script/style 内容，先替换为占位符
  const preserves: string[] = []
  const save = (match: string): string => {
    preserves.push(match)
    return `\u0000${preserves.length - 1}\u0000`
  }
  result = result
    .replace(/<pre[\s\S]*?<\/pre>/gi, save)
    .replace(/<textarea[\s\S]*?<\/textarea>/gi, save)
    .replace(/<script[\s\S]*?<\/script>/gi, save)
    .replace(/<style[\s\S]*?<\/style>/gi, save)
  // 标签间空白压缩
  result = result.replace(/>\s+</g, '><')
  // 标签内多余空白
  result = result.replace(/\s+/g, ' ')
  // 标签属性前空格规范化为单个
  result = result.replace(/\s*\/\s*>/g, '/>')
  // 恢复占位符
  result = result.replace(/\u0000(\d+)\u0000/g, (_, i) => preserves[Number(i)])
  return result.trim()
}

const minifyHtml = async () => {
  try {
    htmlOutput.value = minifyHtmlSimple(htmlInput.value)
  } catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); htmlOutput.value = '压缩失败: ' + msg }
}

const formatHtml = async () => {
  try {
    // html-minifier-terser 没有美化功能，使用基本格式化
    let html = htmlInput.value
    // 简单美化：在标签间添加换行和缩进
    let formatted = ''
    let indent = 0
    const tokens = html.replace(/>\s*</g, '>\n<').split('\n')
    for (const token of tokens) {
      const trimmed = token.trim()
      if (!trimmed) continue
      if (trimmed.match(/^<\//)) indent = Math.max(0, indent - 1)
      formatted += '  '.repeat(indent) + trimmed + '\n'
      if (trimmed.match(/^<\w[^>]*[^\/]>$/) && !trimmed.startsWith('<!') && !trimmed.startsWith('<?')) indent++
    }
    htmlOutput.value = formatted.trim()
  } catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); htmlOutput.value = '美化失败: ' + msg }
}

// 浏览器可用的轻量 CSS 压缩
function minifyCssSimple(css: string): string {
  // 移除注释
  let result = css.replace(/\/\*[\s\S]*?\*\//g, '')
  // 保留字符串内容
  const strings: string[] = []
  const saveStr = (match: string): string => {
    strings.push(match)
    return `\u0001${strings.length - 1}\u0001`
  }
  result = result.replace(/"(?:\\.|[^"\\])*"/g, saveStr).replace(/'(?:\\.|[^'\\])*'/g, saveStr)
  // 移除多余空白
  result = result
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;\}/g, '}')
    .replace(/\s+(!important)/g, '$1')
    .trim()
  // 恢复字符串
  result = result.replace(/\u0001(\d+)\u0001/g, (_, i) => strings[Number(i)])
  return result
}

const minifyCss = () => {
  try {
    cssOutput.value = minifyCssSimple(cssInput.value)
  } catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); cssOutput.value = '压缩失败: ' + msg }
}

const formatCss = () => {
  cssOutput.value = cssInput.value.replace(/{/g, ' {\n  ').replace(/;/g, ';\n  ').replace(/}/g, '\n}\n').replace(/\n\s*\n/g, '\n').trim()
}

const minifyJs = async () => {
  if (!terserMod) { jsOutput.value = '库尚未加载完成，请稍后再试'; return }
  try {
    const result = await terserMod.minify(jsInput.value)
    jsOutput.value = result.code || ''
  } catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); jsOutput.value = '压缩失败: ' + msg }
}
</script>
<style scoped>
.code-minifier { max-width: 1200px; margin: 0 auto; }
.toolbar { display: flex; gap: 8px; margin: 12px 0; }
</style>
