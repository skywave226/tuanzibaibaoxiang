<template>
  <div class="grpc-reflector">
    <!-- 说明提示 -->
    <n-alert type="info" class="mb-4" :bordered="false">
      <template #header>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        关于 gRPC 与浏览器
      </template>
      gRPC 基于 HTTP/2 与 Protobuf，浏览器无法直接调用。本工具提供 gRPC 服务说明、protobuf 知识速查，并支持生成 grpcurl 命令与 .proto 模板，便于在终端或后端调用。
    </n-alert>

    <!-- Tabs 切换 -->
    <n-tabs type="line" animated>
      <!-- grpcurl 命令生成器 -->
      <n-tab-pane name="generator" tab="grpcurl 生成器">
        <n-card :bordered="false">
          <div class="card-title">
            <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg></span>
            <span>grpcurl 命令生成</span>
          </div>

          <n-form label-placement="left" :label-width="100">
            <n-form-item label="服务地址">
              <n-input
                v-model:value="form.host"
                placeholder="localhost:50051"
              />
            </n-form-item>
            <n-form-item label="是否明文">
              <n-switch v-model:value="form.plaintext">
                <template #checked>明文（-plaintext）</template>
                <template #unchecked>TLS 加密</template>
              </n-switch>
            </n-form-item>
            <n-form-item label="操作类型">
              <n-radio-group v-model:value="form.action">
                <n-radio-button value="list">列出服务</n-radio-button>
                <n-radio-button value="list-methods">列出方法</n-radio-button>
                <n-radio-button value="describe">描述服务</n-radio-button>
                <n-radio-button value="invoke">调用方法</n-radio-button>
              </n-radio-group>
            </n-form-item>
            <n-form-item label="服务名" v-if="form.action !== 'list'">
              <n-input
                v-model:value="form.service"
                placeholder="package.ServiceName，如 helloworld.Greeter"
              />
            </n-form-item>
            <n-form-item label="方法名" v-if="form.action === 'invoke'">
              <n-input
                v-model:value="form.method"
                placeholder="方法名，如 SayHello"
              />
            </n-form-item>
            <n-form-item label="请求数据" v-if="form.action === 'invoke'">
              <n-input
                v-model:value="form.data"
                type="textarea"
                :rows="4"
                placeholder='{"name": "World"}'
              />
              <n-checkbox v-model:checked="form.useStdin" class="mt-2">使用 stdin 输入（-d @）</n-checkbox>
            </n-form-item>
            <n-form-item label="额外参数">
              <n-input
                v-model:value="form.extra"
                placeholder="如 -H 'authorization: Bearer xxx'"
              />
            </n-form-item>
          </n-form>

          <!-- 生成的命令 -->
          <div class="result-block">
            <div class="result-head">
              <span class="result-label">生成的命令</span>
              <n-button text size="tiny" @click="copyCommand">
                <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>复制
              </n-button>
            </div>
            <pre class="code-block">{{ generatedCommand }}</pre>
          </div>
        </n-card>
      </n-tab-pane>

      <!-- .proto 模板 -->
      <n-tab-pane name="proto-template" tab=".proto 模板">
        <n-card :bordered="false">
          <div class="card-title">
            <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
            <span>.proto 文件模板生成</span>
          </div>

          <n-form label-placement="left" :label-width="100">
            <n-form-item label="包名">
              <n-input v-model:value="protoForm.package" placeholder="如 helloworld" />
            </n-form-item>
            <n-form-item label="语法版本">
              <n-radio-group v-model:value="protoForm.syntax">
                <n-radio-button value="proto3">proto3（推荐）</n-radio-button>
                <n-radio-button value="proto2">proto2</n-radio-button>
              </n-radio-group>
            </n-form-item>
            <n-form-item label="服务名">
              <n-input v-model:value="protoForm.serviceName" placeholder="如 Greeter" />
            </n-form-item>
            <n-form-item label="Java 包选项">
              <n-checkbox v-model:checked="protoForm.javaPackage">添加 java_package 选项</n-checkbox>
            </n-form-item>
          </n-form>

          <div class="method-editor">
            <div class="pane-label">方法定义（每行一个方法：返回类型 方法名(请求类型)）</div>
            <n-input
              v-model:value="protoForm.methods"
              type="textarea"
              :rows="4"
              placeholder="HelloReply SayHello(HelloRequest)&#10;HelloReply SayHelloAgain(HelloRequest)"
            />
          </div>

          <div class="result-block mt-3">
            <div class="result-head">
              <span class="result-label">.proto 模板</span>
              <n-button text size="tiny" @click="copyProto">
                <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>复制
              </n-button>
            </div>
            <pre class="code-block">{{ generatedProto }}</pre>
          </div>
        </n-card>
      </n-tab-pane>

      <!-- protobuf 知识 -->
      <n-tab-pane name="knowledge" tab="protobuf 基础">
        <n-card :bordered="false">
          <div class="card-title">
            <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
            <span>Protobuf 基础知识</span>
          </div>

          <div class="knowledge-section">
            <div class="kb-title">什么是 Protocol Buffers</div>
            <p class="kb-text">
              Protocol Buffers（protobuf）是 Google 推出的语言无关、平台无关、可扩展的序列化数据结构协议。相比 JSON/XML 更小、更快、更简单，广泛用于 gRPC 与数据存储场景。
            </p>
          </div>

          <div class="knowledge-section">
            <div class="kb-title">基本数据类型</div>
            <n-data-table
              :columns="typeColumns"
              :data="protoTypes"
              :bordered="false"
              :single-line="false"
              size="small"
            />
          </div>

          <div class="knowledge-section">
            <div class="kb-title">字段规则</div>
            <div class="rule-list">
              <div class="rule-item">
                <n-tag :bordered="false" size="small" type="success">singular</n-tag>
                <span>默认规则，消息中可有 0 或 1 个该字段（proto3 默认）</span>
              </div>
              <div class="rule-item">
                <n-tag :bordered="false" size="small" type="info">optional</n-tag>
                <span>显式标记字段是否存在，可区分未设置与默认值</span>
              </div>
              <div class="rule-item">
                <n-tag :bordered="false" size="small" type="warning">repeated</n-tag>
                <span>重复字段，相当于数组/列表</span>
              </div>
              <div class="rule-item">
                <n-tag :bordered="false" size="small" type="error">map</n-tag>
                <span>键值对，如 map&lt;string, int32&gt; = 1;</span>
              </div>
            </div>
          </div>

          <div class="knowledge-section">
            <div class="kb-title">字段编号</div>
            <p class="kb-text">
              每个字段有唯一的编号，用于在二进制流中标识字段。<strong>编号 1-15</strong> 占 1 字节，常用于高频字段；<strong>16-2047</strong> 占 2 字节。
              编号 <strong>19000-19999</strong> 是保留区间不可使用。一旦发布不应再修改编号，否则会破坏兼容性。
            </p>
          </div>

          <div class="knowledge-section">
            <div class="kb-title">gRPC 四种服务方法</div>
            <div class="rule-list">
              <div class="rule-item">
                <n-tag :bordered="false" size="small" type="default">Unary</n-tag>
                <span>一元调用：客户端发一个请求，服务端回一个响应（最常用）</span>
              </div>
              <div class="rule-item">
                <n-tag :bordered="false" size="small" type="info">Server Stream</n-tag>
                <span>服务端流：客户端发一个请求，服务端回多个响应</span>
              </div>
              <div class="rule-item">
                <n-tag :bordered="false" size="small" type="success">Client Stream</n-tag>
                <span>客户端流：客户端发多个请求，服务端回一个响应</span>
              </div>
              <div class="rule-item">
                <n-tag :bordered="false" size="small" type="warning">Bidirectional</n-tag>
                <span>双向流：双方可互相发送多个消息</span>
              </div>
            </div>
          </div>
        </n-card>
      </n-tab-pane>

      <!-- .proto 语法速查 -->
      <n-tab-pane name="syntax" tab=".proto 语法速查">
        <n-card :bordered="false">
          <div class="card-title">
            <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></span>
            <span>.proto 语法速查</span>
          </div>

          <div class="syntax-list">
            <article v-for="item in syntaxItems" :key="item.title" class="syntax-card">
              <div class="syntax-title">{{ item.title }}</div>
              <div class="syntax-desc">{{ item.desc }}</div>
              <pre class="code-block">{{ item.code }}</pre>
            </article>
          </div>
        </n-card>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NTabs, NTabPane, NCard, NAlert, NForm, NFormItem, NInput, NButton,
  NSwitch, NRadioGroup, NRadioButton, NCheckbox, NTag, NDataTable, useMessage,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const message = useMessage()

// ===== grpcurl 生成器表单 =====
const form = ref({
  host: 'localhost:50051',
  plaintext: true,
  action: 'list' as 'list' | 'list-methods' | 'describe' | 'invoke',
  service: '',
  method: '',
  data: '',
  useStdin: false,
  extra: '',
})

// 生成 grpcurl 命令
const generatedCommand = computed(() => {
  const parts = ['grpcurl']
  if (form.value.plaintext) parts.push('-plaintext')
  if (form.value.action === 'list') {
    // 仅列出服务
    if (form.value.extra) parts.push(form.value.extra)
    parts.push(form.value.host)
    return parts.join(' ')
  }
  if (form.value.action === 'list-methods') parts.push('list')
  else if (form.value.action === 'describe') parts.push('describe')
  else if (form.value.action === 'invoke') {
    if (form.value.useStdin) {
      parts.push('-d @')
    } else if (form.value.data) {
      // 转义引号
      const escaped = form.value.data.replace(/'/g, "'\\''")
      parts.push(`-d '${escaped}'`)
    }
  }
  if (form.value.extra) parts.push(form.value.extra)
  parts.push(form.value.host)
  // 服务/方法
  if (form.value.service) {
    if (form.value.action === 'invoke' && form.value.method) {
      parts.push(`${form.value.service}/${form.value.method}`)
    } else {
      parts.push(form.value.service)
    }
  }
  return parts.join(' ')
})

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(generatedCommand.value)
    message.success('命令已复制')
  } catch {
    message.error('复制失败，请手动复制')
  }
}

// ===== .proto 模板生成 =====
const protoForm = ref({
  syntax: 'proto3' as 'proto3' | 'proto2',
  package: 'helloworld',
  serviceName: 'Greeter',
  javaPackage: false,
  methods: 'HelloReply SayHello(HelloRequest)\nHelloReply SayHelloAgain(HelloRequest)',
})

// 解析方法定义
const parsedMethods = computed(() => {
  return protoForm.value.methods
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      // 格式：返回类型 方法名(请求类型)
      const match = line.match(/^(\w+)\s+(\w+)\s*\(\s*(\w+)\s*\)$/)
      if (match) {
        return { replyType: match[1], methodName: match[2], requestType: match[3] }
      }
      return null
    })
    .filter(Boolean) as { replyType: string; methodName: string; requestType: string }[]
})

// 收集所有用到的消息类型
const usedTypes = computed(() => {
  const types = new Set<string>()
  parsedMethods.value.forEach(m => {
    types.add(m.requestType)
    types.add(m.replyType)
  })
  return Array.from(types)
})

const generatedProto = computed(() => {
  const lines: string[] = []
  lines.push(`syntax = "${protoForm.value.syntax}";`)
  lines.push('')
  if (protoForm.value.javaPackage) {
    lines.push('option java_package = "com.example.' + protoForm.value.package + '";')
    lines.push('option java_multiple_files = true;')
    lines.push('')
  }
  lines.push(`package ${protoForm.value.package};`)
  lines.push('')
  // 服务定义
  lines.push(`service ${protoForm.value.serviceName} {`)
  parsedMethods.value.forEach(m => {
    // 简单 Unary 调用
    lines.push(`  rpc ${m.methodName} (${m.requestType}) returns (${m.replyType});`)
  })
  lines.push('}')
  lines.push('')
  // 消息定义
  usedTypes.value.forEach(typeName => {
    lines.push(`message ${typeName} {`)
    lines.push('  string message = 1;  // TODO: 修改为实际字段')
    lines.push('}')
    lines.push('')
  })
  return lines.join('\n')
})

async function copyProto() {
  try {
    await navigator.clipboard.writeText(generatedProto.value)
    message.success('.proto 模板已复制')
  } catch {
    message.error('复制失败，请手动复制')
  }
}

// ===== protobuf 类型表 =====
const typeColumns: DataTableColumns = [
  { title: 'protobuf 类型', key: 'proto', width: 140 },
  { title: '对应语言类型', key: 'lang', width: 200 },
  { title: '说明', key: 'desc' },
]

const protoTypes = ref([
  { proto: 'double', lang: 'double / float64', desc: '双精度浮点数' },
  { proto: 'float', lang: 'float / float32', desc: '单精度浮点数' },
  { proto: 'int32', lang: 'int / int32', desc: '使用变长编码，负数效率低' },
  { proto: 'int64', lang: 'long / int64', desc: '使用变长编码' },
  { proto: 'uint32', lang: 'uint / uint32', desc: '无符号整型，变长编码' },
  { proto: 'uint64', lang: 'ulong / uint64', desc: '无符号长整型，变长编码' },
  { proto: 'sint32', lang: 'int / int32', desc: '使用 ZigZig 编码，负数效率高' },
  { proto: 'sint64', lang: 'long / int64', desc: '使用 ZigZig 编码，负数效率高' },
  { proto: 'fixed32', lang: 'uint / uint32', desc: '固定 4 字节，值大于 2^28 时比 uint32 高效' },
  { proto: 'fixed64', lang: 'ulong / uint64', desc: '固定 8 字节' },
  { proto: 'sfixed32', lang: 'int / int32', desc: '固定 4 字节' },
  { proto: 'sfixed64', lang: 'long / int64', desc: '固定 8 字节' },
  { proto: 'bool', lang: 'bool', desc: '布尔值' },
  { proto: 'string', lang: 'string', desc: 'UTF-8 编码字符串' },
  { proto: 'bytes', lang: 'byte[]', desc: '任意字节序列' },
])

// ===== .proto 语法速查 =====
const syntaxItems = [
  {
    title: '声明语法版本',
    desc: '必须在文件首行声明，推荐使用 proto3',
    code: `syntax = "proto3";

package mypackage;`,
  },
  {
    title: '定义消息',
    desc: '消息是 protobuf 的核心数据结构',
    code: `message Person {
  string name = 1;
  int32 id = 2;
  string email = 3;
  repeated string phones = 4;
}`,
  },
  {
    title: '字段编号与 reserved',
    desc: '删除字段后需保留编号避免兼容问题',
    code: `message Foo {
  reserved 2, 15, 9 to 11;
  reserved "foo", "bar";
  string new_field = 3;
}`,
  },
  {
    title: '枚举类型',
    desc: '枚举必须有 0 值作为默认值',
    code: `enum Corpus {
  UNIVERSAL = 0;
  WEB = 1;
  IMAGES = 2;
}`,
  },
  {
    title: '嵌套消息',
    desc: '消息可嵌套定义',
    code: `message SearchResponse {
  message Result {
    string url = 1;
    string title = 2;
  }
  repeated Result results = 1;
}`,
  },
  {
    title: '定义服务（gRPC）',
    desc: '服务由一组 RPC 方法组成',
    code: `service SearchService {
  rpc Search (SearchRequest) returns (SearchResponse);
  rpc StreamSearch (SearchRequest)
      returns (stream SearchResponse);
}`,
  },
  {
    title: 'Map 类型',
    desc: '键值对字段',
    code: `message Project {
  map<string, Project> projects = 1;
}`,
  },
  {
    title: 'Any 类型',
    desc: '可承载任意消息类型',
    code: `import "google/protobuf/any.proto";

message ErrorStatus {
  string message = 1;
  repeated google.protobuf.Any details = 2;
}`,
  },
  {
    title: 'Oneof',
    desc: '一组字段中至多设置一个',
    code: `message SampleMessage {
  oneof test_oneof {
    string name = 4;
    SubMessage sub_message = 9;
  }
}`,
  },
  {
    title: 'Timestamp 等常用类型',
    desc: '使用 Google 标准类型',
    code: `import "google/protobuf/timestamp.proto";
import "google/protobuf/duration.proto";
import "google/protobuf/empty.proto";

message Event {
  google.protobuf.Timestamp time = 1;
  google.protobuf.Duration duration = 2;
}`,
  },
]
</script>

<style scoped>
.grpc-reflector {
  max-width: 1000px;
  margin: 0 auto;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.mt-3 {
  margin-top: 12px;
}

.mr-1 {
  margin-right: 4px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.title-icon {
  font-size: 18px;
  color: #18a058;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.method-editor {
  margin-top: 16px;
}

/* 代码块 */
.code-block {
  margin: 0;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #333;
  border: 1px solid #eee;
}

.result-block {
  margin-top: 16px;
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.result-label {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

/* 知识区 */
.knowledge-section {
  margin-bottom: 24px;
}

.knowledge-section:last-child {
  margin-bottom: 0;
}

.kb-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid #18a058;
}

.kb-text {
  font-size: 14px;
  line-height: 1.7;
  color: #555;
  margin: 0;
}

.kb-text strong {
  color: #d63384;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #555;
}

/* 语法速查 */
.syntax-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 16px;
}

.syntax-card {
  border: 1px solid #e0e0e6;
  border-radius: 8px;
  padding: 14px;
  background: #fff;
  transition: box-shadow 0.2s;
}

.syntax-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.syntax-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.syntax-desc {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.syntax-card .code-block {
  background: #f5f5f5;
  font-size: 12.5px;
}

/* 深色模式适配 */
.dark .card-title,
.dark .kb-title,
.dark .syntax-title,
.dark .code-block {
  color: rgba(255, 255, 255, 0.85);
}

.dark .code-block,
.dark .syntax-card .code-block {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}

.dark .kb-text,
.dark .rule-item,
.dark .syntax-desc {
  color: rgba(255, 255, 255, 0.65);
}

.dark .kb-text strong {
  color: #ff9eb1;
}

.dark .syntax-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}

.dark .syntax-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.dark .pane-label,
.dark .result-label {
  color: rgba(255, 255, 255, 0.45);
}

.dark .title-icon {
  color: #63e2b6;
}

.dark .kb-title {
  border-left-color: #63e2b6;
}

/* 响应式 */
@media (max-width: 768px) {
  .syntax-list {
    grid-template-columns: 1fr;
  }
}
</style>
