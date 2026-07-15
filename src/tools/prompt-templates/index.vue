<template>
  <div class="prompt-templates">
    <!-- 顶部搜索栏 -->
    <div class="card mb-4">
      <n-input
        v-model:value="searchQuery"
        placeholder="搜索模板名称、描述或内容..."
        clearable
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
    </div>

    <div class="main-layout">
      <!-- 左侧分类导航 -->
      <div class="sidebar card">
        <div class="pane-label mb-2">分类</div>
        <div class="category-list">
          <div
            class="category-item"
            :class="{ active: activeCategory === 'all' }"
            @click="activeCategory = 'all'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>全部</span>
            <span class="count">{{ allTemplates.length }}</span>
          </div>
          <div
            v-for="cat in categories"
            :key="cat.key"
            class="category-item"
            :class="{ active: activeCategory === cat.key }"
            @click="activeCategory = cat.key"
          >
            <span v-html="cat.icon"></span>
            <span>{{ cat.label }}</span>
            <span class="count">{{ countByCategory(cat.key) }}</span>
          </div>
          <div class="category-divider"></div>
          <div
            class="category-item favorite-item"
            :class="{ active: activeCategory === 'favorites' }"
            @click="activeCategory = 'favorites'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>收藏夹</span>
            <span class="count">{{ favorites.length }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧模板列表与编辑 -->
      <div class="content-area">
        <!-- 模板列表 -->
        <div class="card mb-4" v-if="!selectedTemplate">
          <div class="pane-label mb-3">
            {{ activeCategory === 'favorites' ? '收藏的模板' : '模板列表' }}
            <span class="text-muted">（{{ filteredTemplates.length }} 个）</span>
          </div>
          <div class="template-grid" v-if="filteredTemplates.length > 0">
            <div
              v-for="tpl in filteredTemplates"
              :key="tpl.id"
              class="template-card"
              @click="selectTemplate(tpl)"
            >
              <div class="template-card-header">
                <span class="template-title">{{ tpl.title }}</span>
                <span
                  class="favorite-btn"
                  :class="{ active: isFavorite(tpl.id) }"
                  @click.stop="toggleFavorite(tpl.id)"
                >
                  <svg v-if="isFavorite(tpl.id)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </span>
              </div>
              <div class="template-desc">{{ tpl.description }}</div>
              <div class="template-card-footer">
                <n-tag size="small" :bordered="false" round>{{ categoryLabel(tpl.category) }}</n-tag>
              </div>
            </div>
          </div>
          <n-empty v-else description="暂无匹配的模板" />
        </div>

        <!-- 模板编辑 -->
        <div class="card" v-else>
          <div class="template-editor-header">
            <div class="header-left">
              <n-button text size="small" @click="selectedTemplate = null">
                <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></span>
                返回列表
              </n-button>
              <span class="template-title ml-3">{{ selectedTemplate.title }}</span>
              <n-tag size="small" :bordered="false" round class="ml-2">
                {{ categoryLabel(selectedTemplate.category) }}
              </n-tag>
            </div>
            <div class="header-right">
              <n-button
                size="small"
                :type="isFavorite(selectedTemplate.id) ? 'error' : 'default'"
                @click="toggleFavorite(selectedTemplate.id)"
              >
                <svg v-if="isFavorite(selectedTemplate.id)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {{ isFavorite(selectedTemplate.id) ? '取消收藏' : '收藏' }}
              </n-button>
              <n-button size="small" type="primary" @click="copyContent">
                <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
                复制
              </n-button>
            </div>
          </div>
          <div class="template-desc-text">{{ selectedTemplate.description }}</div>
          <n-input
            v-model:value="editContent"
            type="textarea"
            :rows="16"
            placeholder="模板内容..."
            class="code-input"
          />
          <div class="toolbar mt-3">
            <n-button size="small" @click="resetContent">
              <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
              恢复原样
            </n-button>
            <n-button size="small" @click="copyContent">
              <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
              复制内容
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NTag, NEmpty, useMessage } from 'naive-ui'

const message = useMessage()

// 模板接口定义
interface PromptTemplate {
  id: string
  title: string
  description: string
  category: string
  content: string
}

// 分类定义
const categories = [
  { key: 'writing', label: '写作', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
  { key: 'coding', label: '编程', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
  { key: 'analysis', label: '分析', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
  { key: 'translation', label: '翻译', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 3 3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 20l-3-8-3 8"/><path d="M17 18h6"/></svg>' },
  { key: 'summary', label: '总结', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="14" r="2"/><path d="M12 18a4 4 0 0 0 4-4"/></svg>' },
  { key: 'roleplay', label: '角色扮演', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
]

// 内置模板库
const allTemplates = ref<PromptTemplate[]>([
  // 写作类
  {
    id: 'w1',
    title: '文章开头生成',
    description: '根据主题生成引人入胜的文章开头',
    category: 'writing',
    content: `请作为一位资深写作专家，帮我为以下主题撰写一个引人入胜的文章开头。

主题：[在此填入主题]
风格：[正式/轻松/学术/幽默]
字数要求：约 200 字

要求：
1. 用一个问题或故事开头，吸引读者注意
2. 自然过渡到主题
3. 为后续内容做铺垫
4. 语言生动，避免陈词滥调`,
  },
  {
    id: 'w2',
    title: '产品描述文案',
    description: '撰写吸引人的产品营销描述',
    category: 'writing',
    content: `请作为营销文案专家，为以下产品撰写一段吸引人的产品描述。

产品名称：[产品名称]
核心卖点：[列出 3 个核心卖点]
目标用户：[目标用户群体]
平台：[电商详情页/官网/社交媒体]

要求：
1. 突出产品核心价值，而非堆砌功能
2. 用场景化的语言让用户产生代入感
3. 包含一个明确的行动号召（CTA）
4. 控制在 300 字以内`,
  },
  {
    id: 'w3',
    title: '正式邮件撰写',
    description: '撰写得体的商务正式邮件',
    category: 'writing',
    content: `请帮我撰写一封正式的商务邮件。

收件人：[收件人身份/职位]
邮件目的：[说明/请求/感谢/跟进]
关键信息：[需要传达的核心内容]
语气：[正式/友好/委婉]

要求：
1. 邮件主题简洁明确
2. 开头礼貌得体
3. 正文条理清晰，重点突出
4. 结尾包含明确的下一步行动
5. 语气专业但不生硬`,
  },
  // 编程类
  {
    id: 'c1',
    title: '代码审查助手',
    description: '对代码进行全面审查并给出改进建议',
    category: 'coding',
    content: `请作为资深工程师，对以下代码进行审查。

编程语言：[语言名称]
代码用途：[简要说明]
代码：
\`\`\`
[粘贴代码]
\`\`\`

请从以下维度审查：
1. 代码风格与可读性
2. 潜在的 Bug 与边界情况
3. 性能问题
4. 安全性问题
5. 可维护性与扩展性

输出格式：按严重程度（高/中/低）排列问题，并给出具体的改进代码示例。`,
  },
  {
    id: 'c2',
    title: 'Bug 修复助手',
    description: '分析 Bug 原因并提供修复方案',
    category: 'coding',
    content: `请帮我分析并修复以下代码中的 Bug。

问题描述：[描述 Bug 的表现]
期望行为：[说明正确的预期行为]
编程语言：[语言]
相关代码：
\`\`\`
[粘贴代码]
\`\`\`
错误信息（如有）：[粘贴错误信息]

请：
1. 分析 Bug 的根本原因
2. 给出修复后的完整代码
3. 解释修复思路
4. 提供预防类似问题的建议`,
  },
  {
    id: 'c3',
    title: '代码解释器',
    description: '逐行解释复杂代码的逻辑',
    category: 'coding',
    content: `请帮我详细解释以下代码的功能和逻辑。

编程语言：[语言]
代码：
\`\`\`
[粘贴代码]
\`\`\`

请按以下结构解释：
1. 整体功能概述
2. 逐段/逐行解释关键逻辑
3. 涉及的核心概念或算法
4. 输入输出说明
5. 潜在的改进建议`,
  },
  {
    id: 'c4',
    title: '重构建议',
    description: '对代码进行重构优化建议',
    category: 'coding',
    content: `请作为代码重构专家，对以下代码给出重构建议。

编程语言：[语言]
代码：
\`\`\`
[粘贴代码]
\`\`\`

重构目标：[可读性/性能/可测试性/简化]
请：
1. 指出当前代码的坏味道（bad smell）
2. 给出重构后的代码
3. 说明每项重构的理由
4. 保持功能不变`,
  },
  // 分析类
  {
    id: 'a1',
    title: '数据分析报告',
    description: '对数据进行分析并生成报告',
    category: 'analysis',
    content: `请作为数据分析师，对以下数据进行分析。

数据描述：[数据集说明]
分析目的：[发现趋势/对比/找出异常/预测]
数据：
[粘贴或描述数据]

请输出：
1. 数据概览（基本统计量）
2. 主要发现与趋势
3. 异常值识别
4. 可视化建议
5. 结论与建议`,
  },
  {
    id: 'a2',
    title: 'SWOT 分析',
    description: '进行全面的 SWOT 战略分析',
    category: 'analysis',
    content: `请帮我进行 SWOT 分析。

分析对象：[公司/产品/项目/个人]
背景信息：[提供相关背景]

请从以下四个维度分析：
1. 优势（Strengths）：内部有利因素
2. 劣势（Weaknesses）：内部不利因素
3. 机会（Opportunities）：外部有利因素
4. 威胁（Threats）：外部不利因素

最后给出基于 SWOT 矩阵的战略建议（SO/WO/ST/WT 策略）。`,
  },
  {
    id: 'a3',
    title: '对比分析',
    description: '多维度对比两个或多个选项',
    category: 'analysis',
    content: `请帮我进行多维度对比分析。

对比对象：[对象 A] vs [对象 B]
对比目的：[选择/决策/评估]

请按以下维度对比：
1. 核心功能/特性
2. 优缺点
3. 适用场景
4. 成本与收益
5. 长期影响

最后给出综合评价和推荐建议。`,
  },
  // 翻译类
  {
    id: 't1',
    title: '中英互译',
    description: '高质量的中英文翻译',
    category: 'translation',
    content: `请作为专业翻译，将以下内容进行翻译。

源语言：[中文/英文]
目标语言：[英文/中文]
内容：
[粘贴需要翻译的内容]

翻译要求：
1. 准确传达原文含义
2. 符合目标语言的表达习惯
3. 专业术语翻译统一
4. 保留原文的语气和风格
5. 如有歧义，请给出多个翻译版本并说明`,
  },
  {
    id: 't2',
    title: '文学翻译',
    description: '注重文采的文学性翻译',
    category: 'translation',
    content: `请作为文学翻译家，翻译以下文字。

源语言：[语言]
目标语言：[语言]
文学体裁：[小说/诗歌/散文/剧本]

原文：
[粘贴原文]

要求：
1. 注重文学性和美感
2. 保留原文的意境与修辞
3. 符合目标语言的文学表达习惯
4. 对难以直译的部分给出翻译说明`,
  },
  // 总结类
  {
    id: 's1',
    title: '文章总结',
    description: '提炼文章的核心要点',
    category: 'summary',
    content: `请帮我总结以下文章。

文章内容：
[粘贴文章]

请按以下结构输出：
1. 一句话总结（核心观点）
2. 关键要点（3-5 条）
3. 重要论据或数据
4. 文章结论
5. 个人启示

要求：简洁准确，不添加原文没有的信息。`,
  },
  {
    id: 's2',
    title: '会议纪要',
    description: '整理会议要点和待办事项',
    category: 'summary',
    content: `请帮我整理会议纪要。

会议主题：[主题]
会议内容/记录：
[粘贴会议记录]

请输出：
1. 会议基本信息（时间、参与人）
2. 讨论要点
3. 达成的共识与决议
4. 待办事项（含负责人和截止时间）
5. 下次会议建议议题`,
  },
  {
    id: 's3',
    title: '读书笔记',
    description: '生成结构化的读书笔记',
    category: 'summary',
    content: `请帮我整理读书笔记。

书名：[书名]
阅读内容：[粘贴章节或段落]

请按以下结构整理：
1. 核心主旨
2. 关键概念解释
3. 重要观点与论据
4. 金句摘录
5. 个人思考与感悟
6. 可应用的行动建议`,
  },
  // 角色扮演类
  {
    id: 'r1',
    title: '领域专家',
    description: '以专家身份回答专业问题',
    category: 'roleplay',
    content: `请你扮演一位资深的[领域名称]专家。

你的背景：
- 拥有 20 年以上[领域]经验
- 熟悉行业最佳实践和前沿趋势
- 擅长用通俗易懂的方式解释复杂概念

我的问题：[在此输入你的问题]

请以专家的视角回答，要求：
1. 给出专业、准确的解答
2. 提供实践经验和案例
3. 指出常见的误区
4. 给出进一步学习的建议`,
  },
  {
    id: 'r2',
    title: '面试官',
    description: '模拟面试场景进行提问',
    category: 'roleplay',
    content: `请你扮演一位[职位名称]的面试官。

面试场景设定：
- 公司类型：[初创/中型/大型企业]
- 职位：[职位名称]
- 候选人级别：[初级/中级/高级]
- 面试轮次：[技术面/行为面/系统设计面]

请：
1. 提出 5 个有针对性的面试问题
2. 对每个问题说明考察意图
3. 给出优秀回答的要点
4. 指出需要警惕的回答误区`,
  },
  {
    id: 'r3',
    title: '私人教师',
    description: '以教师身份耐心讲解知识点',
    category: 'roleplay',
    content: `请你扮演一位耐心的[学科]老师。

学生水平：[初学者/有一定基础/进阶]
学习目标：[说明想要达到的目标]

我想学习的知识点：[输入知识点]

请按以下方式教学：
1. 用生活中的类比解释概念
2. 分步骤讲解，由浅入深
3. 给出 2-3 个典型例题
4. 设计 1-2 个练习题让我思考
5. 指出常见的错误理解`,
  },
])

// 当前激活分类
const activeCategory = ref('all')
// 搜索关键词
const searchQuery = ref('')
// 选中的模板
const selectedTemplate = ref<PromptTemplate | null>(null)
// 编辑后的内容
const editContent = ref('')
// 收藏列表
const favorites = ref<string[]>([])

// 从 localStorage 加载收藏
function loadFavorites() {
  try {
    const stored = localStorage.getItem('prompt-favorites')
    if (stored) favorites.value = JSON.parse(stored)
  } catch {
    favorites.value = []
  }
}

// 保存收藏到 localStorage
function saveFavorites() {
  localStorage.setItem('prompt-favorites', JSON.stringify(favorites.value))
}

// 判断是否已收藏
function isFavorite(id: string): boolean {
  return favorites.value.includes(id)
}

// 切换收藏状态
function toggleFavorite(id: string) {
  if (isFavorite(id)) {
    favorites.value = favorites.value.filter(f => f !== id)
    message.success('已取消收藏')
  } else {
    favorites.value.push(id)
    message.success('已加入收藏')
  }
  saveFavorites()
}

// 按分类统计数量
function countByCategory(key: string): number {
  return allTemplates.value.filter(t => t.category === key).length
}

// 获取分类标签文字
function categoryLabel(key: string): string {
  return categories.find(c => c.key === key)?.label || key
}

// 过滤后的模板列表
const filteredTemplates = computed(() => {
  let list = allTemplates.value
  // 按分类过滤
  if (activeCategory.value === 'favorites') {
    list = list.filter(t => favorites.value.includes(t.id))
  } else if (activeCategory.value !== 'all') {
    list = list.filter(t => t.category === activeCategory.value)
  }
  // 按搜索关键词过滤
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q)
    )
  }
  return list
})

// 选择模板
function selectTemplate(tpl: PromptTemplate) {
  selectedTemplate.value = tpl
  editContent.value = tpl.content
}

// 复制内容
async function copyContent() {
  try {
    await navigator.clipboard.writeText(editContent.value)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败，请手动复制')
  }
}

// 恢复原始内容
function resetContent() {
  if (selectedTemplate.value) {
    editContent.value = selectedTemplate.value.content
    message.info('已恢复原样')
  }
}

// 初始化加载收藏
loadFavorites()
</script>

<style scoped>
.prompt-templates {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.text-muted {
  color: #aaa;
  font-weight: 400;
}

.main-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
}

/* 侧边栏分类列表 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  transition: all 0.2s;
}

.category-item:hover {
  background: #f5f5f5;
}

.dark .category-item {
  color: #bbb;
}

.dark .category-item:hover {
  background: #2a2a3a;
}

.category-item.active {
  background: #e8f5e9;
  color: #36ad6a;
  font-weight: 600;
}

.dark .category-item.active {
  background: #1a3a2a;
  color: #63e2b7;
}

.category-item .count {
  margin-left: auto;
  font-size: 12px;
  color: #aaa;
  background: #f0f0f0;
  padding: 1px 8px;
  border-radius: 10px;
}

.dark .category-item .count {
  background: #2a2a3a;
  color: #888;
}

.category-item.active .count {
  background: #36ad6a;
  color: #fff;
}

.dark .category-item.active .count {
  background: #63e2b7;
  color: #1a3a2a;
}

.category-divider {
  height: 1px;
  background: #e8e8e8;
  margin: 8px 0;
}

.dark .category-divider {
  background: #2a2a3a;
}

.favorite-item {
  color: #e8801b !important;
}

/* 模板网格 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.template-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-card:hover {
  border-color: #36ad6a;
  box-shadow: 0 2px 12px rgba(54, 173, 106, 0.15);
  transform: translateY(-2px);
}

.dark .template-card {
  border-color: #2a2a3a;
}

.dark .template-card:hover {
  border-color: #63e2b7;
  box-shadow: 0 2px 12px rgba(99, 226, 183, 0.15);
}

.template-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.template-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.dark .template-title {
  color: #ddd;
}

.template-desc {
  font-size: 12px;
  color: #888;
  line-height: 1.5;
  flex: 1;
}

.template-card-footer {
  display: flex;
  justify-content: flex-end;
}

.favorite-btn {
  cursor: pointer;
  color: #ccc;
  font-size: 16px;
  transition: color 0.2s;
}

.favorite-btn:hover {
  color: #e8801b;
}

.favorite-btn.active {
  color: #e8801b;
}

/* 模板编辑区 */
.template-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.header-right {
  display: flex;
  gap: 8px;
}

.template-desc-text {
  font-size: 13px;
  color: #888;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 3px solid #36ad6a;
}

.dark .template-desc-text {
  background: #1e1e2e;
  color: #aaa;
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.toolbar {
  display: flex;
  gap: 8px;
}
</style>
