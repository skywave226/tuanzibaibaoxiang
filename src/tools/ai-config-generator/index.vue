<template>
  <div class="ai-config-generator">
    <!-- 模型配置区 -->
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">模型配置</h3>
      <div class="config-grid">
        <div class="config-item">
          <label>模型提供商</label>
          <n-select v-model:value="provider" :options="(providerOptions as any)" @update:value="onProviderChange" />
        </div>
        <div class="config-item">
          <label>模型名称</label>
          <n-select v-model:value="model" :options="(modelOptions as any)" filterable tag />
        </div>
        <div class="config-item">
          <label>API Key（可选，仅用于生成代码）</label>
          <n-input v-model:value="apiKey" placeholder="sk-..." type="password" show-password-on="click" />
        </div>
        <div class="config-item">
          <label>API Base URL</label>
          <n-input v-model:value="baseUrl" placeholder="https://api.openai.com/v1" />
        </div>
      </div>

      <!-- 参数配置 -->
      <h3 class="text-sm font-bold mt-4 mb-3">参数配置</h3>
      <div class="config-grid">
        <div class="config-item">
          <label>Temperature（{{ temperature.toFixed(2) }}）</label>
          <n-slider v-model:value="temperature" :min="0" :max="2" :step="0.05" />
        </div>
        <div class="config-item">
          <label>Max Tokens</label>
          <n-input-number v-model:value="maxTokens" :min="1" :max="128000" :step="100" />
        </div>
        <div class="config-item">
          <label>Top P（{{ topP.toFixed(2) }}）</label>
          <n-slider v-model:value="topP" :min="0" :max="1" :step="0.05" />
        </div>
        <div class="config-item">
          <label>Frequency Penalty（{{ frequencyPenalty.toFixed(2) }}）</label>
          <n-slider v-model:value="frequencyPenalty" :min="-2" :max="2" :step="0.1" />
        </div>
        <div class="config-item">
          <label>Presence Penalty（{{ presencePenalty.toFixed(2) }}）</label>
          <n-slider v-model:value="presencePenalty" :min="-2" :max="2" :step="0.1" />
        </div>
        <div class="config-item">
          <label>流式输出</label>
          <n-switch v-model:value="stream">
            <template #checked>开启</template>
            <template #unchecked>关闭</template>
          </n-switch>
        </div>
      </div>

      <!-- 系统提示词 -->
      <div class="config-item full mt-4">
        <label>系统提示词（System Prompt）</label>
        <n-input
          v-model:value="systemPrompt"
          type="textarea"
          :rows="3"
          placeholder="你是一个有帮助的助手..."
        />
      </div>
      <div class="config-item full mt-3">
        <label>用户消息（用于生成代码示例）</label>
        <n-input
          v-model:value="userMessage"
          type="textarea"
          :rows="2"
          placeholder="请介绍一下你自己"
        />
      </div>
    </div>

    <!-- 输出区 -->
    <div class="card">
      <div class="output-header">
        <n-tabs v-model:value="outputTab" type="line" animated>
          <n-tab-pane name="json" tab="JSON 配置">
            <div class="code-block">
              <div class="code-actions">
                <n-button size="small" @click="copy(jsonOutput)">
                  <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
                  复制
                </n-button>
              </div>
              <pre><code>{{ jsonOutput }}</code></pre>
            </div>
          </n-tab-pane>
          <n-tab-pane name="python" tab="Python 代码">
            <div class="code-block">
              <div class="code-actions">
                <n-button size="small" @click="copy(pythonCode)">
                  <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
                  复制
                </n-button>
              </div>
              <pre><code>{{ pythonCode }}</code></pre>
            </div>
          </n-tab-pane>
          <n-tab-pane name="nodejs" tab="Node.js 代码">
            <div class="code-block">
              <div class="code-actions">
                <n-button size="small" @click="copy(nodejsCode)">
                  <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
                  复制
                </n-button>
              </div>
              <pre><code>{{ nodejsCode }}</code></pre>
            </div>
          </n-tab-pane>
          <n-tab-pane name="curl" tab="cURL 命令">
            <div class="code-block">
              <div class="code-actions">
                <n-button size="small" @click="copy(curlCommand)">
                  <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
                  复制
                </n-button>
              </div>
              <pre><code>{{ curlCommand }}</code></pre>
            </div>
          </n-tab-pane>
        </n-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NSelect,
  NInput,
  NInputNumber,
  NSlider,
  NSwitch,
  NTabs,
  NTabPane,
  NButton,
  useMessage,
} from 'naive-ui'

const message = useMessage()

// 提供商定义
interface ProviderOption {
  label: string
  value: string
}

interface ModelOption {
  label: string
  value: string
}

const providerOptions: ProviderOption[] = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic (Claude)', value: 'anthropic' },
  { label: 'Ollama (Llama)', value: 'ollama' },
  { label: '通义千问 (Qwen)', value: 'qwen' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: '智谱 (GLM)', value: 'zhipu' },
  { label: 'Moonshot (Kimi)', value: 'moonshot' },
]

// 各提供商对应的模型与默认配置
const providerConfig: Record<string, {
  models: ModelOption[]
  baseUrl: string
  sdk: string
}> = {
  openai: {
    models: [
      { label: 'gpt-4o', value: 'gpt-4o' },
      { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
      { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
      { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
    ],
    baseUrl: 'https://api.openai.com/v1',
    sdk: 'openai',
  },
  anthropic: {
    models: [
      { label: 'claude-3-5-sonnet-20241022', value: 'claude-3-5-sonnet-20241022' },
      { label: 'claude-3-opus-20240229', value: 'claude-3-opus-20240229' },
      { label: 'claude-3-haiku-20240307', value: 'claude-3-haiku-20240307' },
    ],
    baseUrl: 'https://api.anthropic.com',
    sdk: 'anthropic',
  },
  ollama: {
    models: [
      { label: 'llama3.1', value: 'llama3.1' },
      { label: 'llama3', value: 'llama3' },
      { label: 'qwen2.5', value: 'qwen2.5' },
      { label: 'mistral', value: 'mistral' },
    ],
    baseUrl: 'http://localhost:11434',
    sdk: 'ollama',
  },
  qwen: {
    models: [
      { label: 'qwen-max', value: 'qwen-max' },
      { label: 'qwen-plus', value: 'qwen-plus' },
      { label: 'qwen-turbo', value: 'qwen-turbo' },
    ],
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    sdk: 'openai',
  },
  deepseek: {
    models: [
      { label: 'deepseek-chat', value: 'deepseek-chat' },
      { label: 'deepseek-reasoner', value: 'deepseek-reasoner' },
    ],
    baseUrl: 'https://api.deepseek.com/v1',
    sdk: 'openai',
  },
  zhipu: {
    models: [
      { label: 'glm-4', value: 'glm-4' },
      { label: 'glm-4-flash', value: 'glm-4-flash' },
      { label: 'glm-4-air', value: 'glm-4-air' },
    ],
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    sdk: 'openai',
  },
  moonshot: {
    models: [
      { label: 'moonshot-v1-8k', value: 'moonshot-v1-8k' },
      { label: 'moonshot-v1-32k', value: 'moonshot-v1-32k' },
      { label: 'moonshot-v1-128k', value: 'moonshot-v1-128k' },
    ],
    baseUrl: 'https://api.moonshot.cn/v1',
    sdk: 'openai',
  },
}

// 配置状态
const provider = ref('openai')
const model = ref('gpt-4o')
const apiKey = ref('')
const baseUrl = ref('https://api.openai.com/v1')
const temperature = ref(0.7)
const maxTokens = ref(2048)
const topP = ref(1)
const frequencyPenalty = ref(0)
const presencePenalty = ref(0)
const stream = ref(false)
const systemPrompt = ref('你是一个有帮助的 AI 助手。')
const userMessage = ref('请介绍一下你自己')

const outputTab = ref('json')

// 当前提供商的模型列表
const modelOptions = computed<ModelOption[]>(() => {
  return providerConfig[provider.value]?.models || []
})

// 切换提供商时重置模型与 BaseUrl
function onProviderChange(val: string) {
  const config = providerConfig[val]
  if (config) {
    baseUrl.value = config.baseUrl
    if (config.models.length > 0) {
      model.value = config.models[0].value
    }
  }
}

// 生成请求参数对象（用于 JSON 输出）
function buildParams(): Record<string, any> {
  const params: Record<string, any> = {
    model: model.value,
    temperature: temperature.value,
    max_tokens: maxTokens.value,
    top_p: topP.value,
  }
  // 仅在非默认值时输出惩罚参数
  if (frequencyPenalty.value !== 0) params.frequency_penalty = frequencyPenalty.value
  if (presencePenalty.value !== 0) params.presence_penalty = presencePenalty.value
  if (stream.value) params.stream = true
  // 消息
  const messages: any[] = []
  if (systemPrompt.value.trim()) {
    messages.push({ role: 'system', content: systemPrompt.value })
  }
  if (userMessage.value.trim()) {
    messages.push({ role: 'user', content: userMessage.value })
  }
  params.messages = messages
  return params
}

// JSON 配置输出（包含完整配置）
const jsonOutput = computed(() => {
  const config = {
    provider: provider.value,
    model: model.value,
    api_base: baseUrl.value,
    api_key: apiKey.value ? apiKey.value : 'your-api-key-here',
    parameters: {
      temperature: temperature.value,
      max_tokens: maxTokens.value,
      top_p: topP.value,
      frequency_penalty: frequencyPenalty.value,
      presence_penalty: presencePenalty.value,
      stream: stream.value,
    },
    messages: {
      system: systemPrompt.value,
      user: userMessage.value,
    },
  }
  return JSON.stringify(config, null, 2)
})

// 转义字符串用于代码生成
function pyStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

// Python 代码生成
const pythonCode = computed(() => {
  const sdk = providerConfig[provider.value]?.sdk || 'openai'
  const key = apiKey.value || 'your-api-key-here'

  if (sdk === 'openai') {
    return [
      'from openai import OpenAI',
      '',
      `client = OpenAI(`,
      `    api_key="${key}",`,
      `    base_url="${baseUrl.value}",`,
      ')',
      '',
      'response = client.chat.completions.create(',
      `    model="${model.value}",`,
      `    messages=[`,
      ...(systemPrompt.value.trim()
        ? [`        {"role": "system", "content": "${pyStr(systemPrompt.value)}"},`]
        : []),
      ...(userMessage.value.trim()
        ? [`        {"role": "user", "content": "${pyStr(userMessage.value)}"},`]
        : []),
      `    ],`,
      `    temperature=${temperature.value},`,
      `    max_tokens=${maxTokens.value},`,
      `    top_p=${topP.value},`,
      ...(frequencyPenalty.value !== 0 ? [`    frequency_penalty=${frequencyPenalty.value},`] : []),
      ...(presencePenalty.value !== 0 ? [`    presence_penalty=${presencePenalty.value},`] : []),
      ...(stream.value ? [`    stream=True,`] : []),
      ')',
      '',
      stream.value
        ? 'for chunk in response:\n    if chunk.choices[0].delta.content:\n        print(chunk.choices[0].delta.content, end="")'
        : 'print(response.choices[0].message.content)',
    ].join('\n')
  }

  if (sdk === 'anthropic') {
    return [
      'import anthropic',
      '',
      `client = anthropic.Anthropic(`,
      `    api_key="${key}",`,
      ')',
      '',
      'message = client.messages.create(',
      `    model="${model.value}",`,
      `    max_tokens=${maxTokens.value},`,
      `    temperature=${temperature.value},`,
      ...(systemPrompt.value.trim()
        ? [`    system="${pyStr(systemPrompt.value)}",`]
        : []),
      `    messages=[`,
      ...(userMessage.value.trim()
        ? [`        {"role": "user", "content": "${pyStr(userMessage.value)}"},`]
        : []),
      `    ],`,
      ')',
      '',
      'print(message.content[0].text)',
    ].join('\n')
  }

  // ollama
  return [
    'import requests',
    '',
    'response = requests.post(',
    `    "${baseUrl.value}/api/chat",`,
    '    json={',
    `        "model": "${model.value}",`,
    `        "messages": [`,
    ...(systemPrompt.value.trim()
      ? [`            {"role": "system", "content": "${pyStr(systemPrompt.value)}"},`]
      : []),
    ...(userMessage.value.trim()
      ? [`            {"role": "user", "content": "${pyStr(userMessage.value)}"},`]
      : []),
    `        ],`,
    `        "stream": ${stream.value},`,
    `        "options": {`,
    `            "temperature": ${temperature.value},`,
    `            "num_predict": ${maxTokens.value},`,
    `            "top_p": ${topP.value},`,
    `        },`,
    '    }',
    ')',
    '',
    'data = response.json()',
    'print(data["message"]["content"])',
  ].filter(line => line !== '').join('\n')
})

// Node.js 代码生成
const nodejsCode = computed(() => {
  const sdk = providerConfig[provider.value]?.sdk || 'openai'
  const key = apiKey.value || 'your-api-key-here'

  if (sdk === 'openai') {
    return [
      "import OpenAI from 'openai';",
      '',
      'const client = new OpenAI({',
      `  apiKey: '${key}',`,
      `  baseURL: '${baseUrl.value}',`,
      '});',
      '',
      'async function main() {',
      '  const response = await client.chat.completions.create({',
      `    model: '${model.value}',`,
      '    messages: [',
      ...(systemPrompt.value.trim()
        ? [`      { role: 'system', content: ${JSON.stringify(systemPrompt.value)} },`]
        : []),
      ...(userMessage.value.trim()
        ? [`      { role: 'user', content: ${JSON.stringify(userMessage.value)} },`]
        : []),
      '    ],',
      `    temperature: ${temperature.value},`,
      `    max_tokens: ${maxTokens.value},`,
      `    top_p: ${topP.value},`,
      ...(frequencyPenalty.value !== 0 ? [`    frequency_penalty: ${frequencyPenalty.value},`] : []),
      ...(presencePenalty.value !== 0 ? [`    presence_penalty: ${presencePenalty.value},`] : []),
      ...(stream.value ? [`    stream: true,`] : []),
      '  });',
      '',
      stream.value
        ? '  for await (const chunk of response) {\n    process.stdout.write(chunk.choices[0]?.delta?.content || "");\n  }'
        : '  console.log(response.choices[0].message.content);',
      '}',
      '',
      'main();',
    ].join('\n')
  }

  if (sdk === 'anthropic') {
    return [
      "import Anthropic from '@anthropic-ai/sdk';",
      '',
      'const client = new Anthropic({',
      `  apiKey: '${key}',`,
      '});',
      '',
      'async function main() {',
      '  const message = await client.messages.create({',
      `    model: '${model.value}',`,
      `    max_tokens: ${maxTokens.value},`,
      `    temperature: ${temperature.value},`,
      ...(systemPrompt.value.trim()
        ? [`    system: ${JSON.stringify(systemPrompt.value)},`]
        : []),
      '    messages: [',
      ...(userMessage.value.trim()
        ? [`      { role: 'user', content: ${JSON.stringify(userMessage.value)} },`]
        : []),
      '    ],',
      '  });',
      '',
      "  console.log(message.content[0].text);",
      '}',
      '',
      'main();',
    ].join('\n')
  }

  // ollama fetch
  return [
    'const response = await fetch(',
    `  '${baseUrl.value}/api/chat',`,
    '  {',
    '    method: "POST",',
    '    headers: { "Content-Type": "application/json" },',
    '    body: JSON.stringify({',
    `      model: '${model.value}',`,
    '      messages: [',
    ...(systemPrompt.value.trim()
      ? [`        { role: 'system', content: ${JSON.stringify(systemPrompt.value)} },`]
      : []),
    ...(userMessage.value.trim()
      ? [`        { role: 'user', content: ${JSON.stringify(userMessage.value)} },`]
      : []),
    '      ],',
    `      stream: ${stream.value},`,
    `      options: { temperature: ${temperature.value}, num_predict: ${maxTokens.value}, top_p: ${topP.value} },`,
    '    }),',
    '  }',
    ');',
    '',
    'const data = await response.json();',
    'console.log(data.message.content);',
  ].filter(line => line !== '').join('\n')
})

// cURL 命令生成
const curlCommand = computed(() => {
  const params = buildParams()
  const key = apiKey.value || 'your-api-key-here'
  const sdk = providerConfig[provider.value]?.sdk || 'openai'

  if (sdk === 'anthropic') {
    // Anthropic 的请求结构不同
    const payload = JSON.stringify({
      model: model.value,
      max_tokens: maxTokens.value,
      temperature: temperature.value,
      ...(systemPrompt.value.trim() ? { system: systemPrompt.value } : {}),
      messages: userMessage.value.trim()
        ? [{ role: 'user', content: userMessage.value }]
        : [],
    })
    return [
      `curl ${baseUrl.value}/v1/messages \\`,
      `  -H "x-api-key: ${key}" \\`,
      `  -H "anthropic-version: 2023-06-01" \\`,
      `  -H "content-type: application/json" \\`,
      `  -d '${payload}'`,
    ].join('\n')
  }

  // OpenAI 兼容接口
  return [
    `curl ${baseUrl.value}/chat/completions \\`,
    `  -H "Authorization: Bearer ${key}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${JSON.stringify(params)}'`,
  ].join('\n')
})

// 复制内容
async function copy(content: string) {
  try {
    await navigator.clipboard.writeText(content)
    message.success('已复制到剪贴板')
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = content
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      message.success('已复制到剪贴板')
    } catch {
      message.error('复制失败，请手动复制')
    }
    document.body.removeChild(textarea)
  }
}
</script>

<style scoped>
.ai-config-generator {
  max-width: 1000px;
  margin: 0 auto;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item.full {
  grid-column: 1 / -1;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark .config-item label {
  color: #aaa;
}

.output-header {
  margin-top: 4px;
}

.code-block {
  position: relative;
  margin-top: 8px;
}

.code-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.code-block pre {
  background: #1e1e1e;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin: 0;
}

.code-block code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
  white-space: pre;
}

.dark .code-block pre {
  background: #161616;
}
</style>
