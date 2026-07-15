# Web Tool 在线工具集合 · Code Wiki

> 本文档是 `web_tool` 项目的结构化代码 Wiki，涵盖项目整体架构、模块职责、关键类与函数、依赖关系及运行方式。

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈与依赖](#2-技术栈与依赖)
3. [项目目录结构](#3-项目目录结构)
4. [整体架构](#4-整体架构)
5. [核心模块职责](#5-核心模块职责)
6. [工具注册机制（核心设计）](#6-工具注册机制核心设计)
7. [工具开发规范](#7-工具开发规范)
8. [关键类型与函数说明](#8-关键类型与函数说明)
9. [复杂工具剖析](#9-复杂工具剖析)
10. [工具全量目录](#10-工具全量目录)
11. [依赖关系图](#11-依赖关系图)
12. [项目运行方式](#12-项目运行方式)
13. [工程约定与经验](#13-工程约定与经验)

---

## 1. 项目概览

**Web Tool** 是一个纯前端的在线工具集合（SPA），基于 **Vue 3 + TypeScript + Vite 6** 构建，提供 **50 个** 离线/在线实用工具，覆盖文本处理、图片处理、编码转换、网络工具、开发工具、安全工具、SEO 工具、设计工具、生成器、计算工具、生活计算、日期时间共 **12 个分类**。

### 核心特性

- **纯前端实现**：无后端服务，所有计算在浏览器内完成，敏感数据不离设备。
- **自动工具注册**：通过 `import.meta.glob` 扫描 `src/tools/` 目录，无需手动配置路由或清单。
- **懒加载优化**：大型库（tesseract.js、xlsx 等）动态导入，降低首屏负担。
- **暗黑模式**：基于 `localStorage` 持久化主题切换。
- **响应式布局**：适配桌面与移动端。
- **多维度搜索**：按名称、描述、关键词检索工具。

---

## 2. 技术栈与依赖

### 运行时依赖（dependencies）

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| `vue` | ^3.5.13 | 响应式视图框架（Composition API） |
| `vue-router` | ^4.5.0 | 路由（hash 模式） |
| `naive-ui` | ^2.40.3 | UI 组件库（统一视觉） |
| `tesseract.js` | ^7.0.0 | OCR 文字识别（图片表格识别） |
| `xlsx` | ^0.18.5 | Excel 导出（表格识别） |
| `marked` | ^18.0.5 | Markdown 渲染 |
| `dompurify` | ^3.4.11 | HTML 净化（防 XSS） |
| `js-yaml` | ^5.2.1 | YAML 解析（YAML↔JSON） |
| `sql-formatter` | ^15.8.2 | SQL 格式化 |
| `opencc-js` | ^1.4.0 | 繁简中文转换 |
| `clean-css` | ^5.3.3 | CSS 压缩 |
| `html-minifier-terser` | ^7.2.0 | HTML 压缩 |
| `terser` | ^5.48.0 | JS 压缩 |

### 开发依赖（devDependencies）

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| `vite` | ^6.0.0 | 构建工具 |
| `@vitejs/plugin-vue` | ^5.2.1 | Vue SFC 支持 |
| `typescript` | ~5.6.0 | 类型系统 |
| `vue-tsc` | ^2.2.0 | Vue 类型检查 |
| `unocss` | ^0.65.3 | 原子化 CSS 引擎 |
| `@unocss/preset-uno` | ^0.65.3 | Uno 预设 |
| `@types/*` | — | 第三方库类型声明 |

---

## 3. 项目目录结构

```
web_tool/
├── public/
│   └── vite.svg                     # 站点图标
├── src/
│   ├── App.vue                      # 应用根组件（主题/消息 Provider）
│   ├── main.ts                      # 应用入口（挂载 router）
│   ├── env.d.ts                     # 全局类型声明（.vue 模块）
│   ├── composables/
│   │   └── useDark.ts               # 全局暗黑模式 Composable
│   ├── layouts/
│   │   └── DefaultLayout.vue        # 默认布局（顶栏 + 侧栏 + 主区）
│   ├── router/
│   │   └── index.ts                 # 路由定义（动态生成工具路由）
│   ├── styles/
│   │   └── global.css               # 全局样式
│   ├── types/
│   │   └── tool.ts                  # 工具元数据类型定义
│   ├── views/
│   │   ├── HomeView.vue             # 首页（工具网格展示）
│   │   └── ToolView.vue             # 工具承载视图（异步加载工具组件）
│   └── tools/                       # ★ 工具根目录（自动扫描）
│       ├── registry.ts              # 工具注册中心（自动注册逻辑）
│       ├── aes-encrypt/             # 各工具目录
│       │   ├── meta.ts              #   工具元数据
│       │   └── index.vue           #   工具组件
│       ├── ...(共 50 个工具目录)
│       ├── image-table-recognizer/ # 复杂工具示例（含子模块）
│       │   ├── index.vue
│       │   ├── meta.ts
│       │   ├── components/          #   工具内部子组件
│       │   └── composables/        #   工具内部逻辑封装
│       └── solar-term-query/        # 复杂工具示例（含数据层）
│           ├── index.vue
│           ├── meta.ts
│           ├── components/
│           ├── composables/
│           └── data/                #   静态数据层
├── index.html                       # HTML 模板
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── uno.config.ts                    # UnoCSS 配置
└── vite.config.ts                   # Vite 配置（别名 @ → src）
```

---

## 4. 整体架构

项目采用**分层架构**，自上而下分为四层：

```
┌─────────────────────────────────────────────────────┐
│  UI 层（App.vue / DefaultLayout / Views）            │  布局、路由出口、主题
├─────────────────────────────────────────────────────┤
│  注册中心层（tools/registry.ts）                      │  自动发现并注册工具
├─────────────────────────────────────────────────────┤
│  工具实现层（tools/<name>/）                         │  50 个独立工具
│   ├── meta.ts   元数据                              │
│   └── index.vue 工具组件（可含 components/composables）│
├─────────────────────────────────────────────────────┤
│  核心能力层（composables/ + 浏览器 API）              │  暗黑模式、Canvas、WebCrypto、fetch
└─────────────────────────────────────────────────────┘
```

### 启动流程

1. `main.ts` 创建 Vue 实例，注册 router，挂载到 `#app`。
2. `App.vue` 提供 Naive UI 的 `NConfigProvider`（主题）与 `NMessageProvider`（消息）。
3. `router/index.ts` 从 `registry.ts` 导入 `tools` 数组，为每个工具生成一条路由，统一挂载到 `DefaultLayout` 下。
4. `registry.ts` 在构建期通过 `import.meta.glob` 扫描所有 `meta.ts`（eager 加载）和 `index.vue`（懒加载）。
5. 用户访问工具路径 → `ToolView.vue` 异步加载对应组件并渲染。

---

## 5. 核心模块职责

### 5.1 应用入口 `src/main.ts`

职责：创建应用、注册路由、引入 UnoCSS 与全局样式。

```ts
createApp(App).use(router).mount('#app')
```

### 5.2 根组件 `src/App.vue`

职责：提供全局主题（亮/暗）与中文 locale，并通过 `<router-view />` 承载页面。
- 监听 `useDark()` 的 `isDark`，动态切换 `darkTheme`。

### 5.3 默认布局 `src/layouts/DefaultLayout.vue`

职责：应用整体骨架。

| 区域 | 内容 |
| --- | --- |
| 顶栏（header） | Logo、全局搜索框（聚焦跳首页）、暗黑模式切换按钮 |
| 侧栏（sidebar） | `n-menu` 展示分类（含「全部工具」+ 各分类及数量） |
| 主区（main） | `<router-view />` 路由出口 |

### 5.4 视图

- **`HomeView.vue`**：首页。以网格卡片展示全部工具，显示图标、名称、描述、分类标签。
- **`ToolView.vue`**：工具承载视图。依据路由 `path` 查找工具元数据，使用 `defineAsyncComponent` 懒加载工具组件，并提供面包屑导航。

### 5.5 路由 `src/router/index.ts`

职责：基于 `createWebHashHistory` 的 hash 路由。

```ts
const toolRoutes = tools.map(t => ({
  path: t.path,
  component: ToolView,
  meta: { toolPath: t.path },
}))
```

所有工具路由都是 `DefaultLayout` 的子路由，首页 `/` 为 `HomeView`。

### 5.6 全局 Composable `src/composables/useDark.ts`

职责：管理暗黑模式状态。`isDark` 为模块级单例 `ref`，通过 `watch` 同步写入 `localStorage` 并切换 `document.documentElement` 的 `dark` 类名。

### 5.7 工具注册中心 `src/tools/registry.ts`

见 [第 6 节](#6-工具注册机制核心设计)。

---

## 6. 工具注册机制（核心设计）

`registry.ts` 是整个项目最关键的设计，实现了**约定优于配置**的自动注册。

```ts
const toolModules = import.meta.glob('./**/index.vue')           // 懒加载组件
const metaModules = import.meta.glob('./**/meta.ts', { eager: true }) // 构建期读取元数据

export const tools: ToolMeta[] = Object.entries(metaModules)
  .filter(([path]) => path.endsWith('/meta.ts'))
  .map(([path, mod]) => {
    const meta = (mod as any).default
    const componentPath = path.replace('/meta.ts', '/index.vue')
    const loader = toolModules[componentPath]
    return { ...meta, component: loader }
  })
  .sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.name.localeCompare(b.name)
  })
```

**工作机制**：
1. Vite 在构建时扫描 `src/tools/` 下所有 `**/meta.ts`，以 `eager` 方式同步导入（获取元数据对象）。
2. 同时记录所有 `**/index.vue` 为**懒加载** chunk（仅在访问时拉取）。
3. 通过路径替换将 `meta.ts` 与对应 `index.vue` 关联。
4. 按分类、名称排序，导出 `tools` 数组供路由与首页使用。
5. **新增工具无需修改任何注册代码**——只需新建目录并放入 `meta.ts` + `index.vue`。

---

## 7. 工具开发规范

### 7.1 目录约定

每个工具必须是 `src/tools/<tool-name>/` 目录，包含两个必备文件：

| 文件 | 作用 |
| --- | --- |
| `meta.ts` | 工具元数据（默认导出对象） |
| `index.vue` | 工具组件（`<script setup lang="ts">`） |

复杂工具可额外包含：
- `components/`：工具内部子组件
- `composables/`：工具内部逻辑复用
- `data/`：静态数据

### 7.2 元数据结构 `meta.ts`

```ts
export default {
  name: '工具名称',          // 显示名称
  path: '/tool-path',       // 路由路径（须唯一）
  icon: '<svg ...>...</svg>', // 内联 SVG 图标
  description: '一句话描述',  // 首页卡片展示
  category: '分类名',        // 须与已有分类一致或新建
  keywords: ['关键词'],      // 搜索匹配字段
}
```

### 7.3 组件规范

- 使用 `<script setup lang="ts">` Composition API 语法。
- UI 组件统一使用 Naive UI（`NButton`、`NInput`、`NDataTable` 等）。
- 图标使用内联 SVG（`<svg xmlns="http://www.w3.org/2000/svg" ...></svg>`），工具 meta.ts 中的 icon 字段直接存放 SVG 字符串。
- 大型依赖必须动态导入：`const Tesseract = await import('tesseract.js')`。
- 网络工具须使用支持 CORS 的浏览器端 API。

---

## 8. 关键类型与函数说明

### 8.1 核心类型 `src/types/tool.ts`

```ts
export interface ToolMeta {
  name: string
  path: string
  icon: string
  description: string
  category: string
  keywords: string[]
  component: Component    // Vue 异步组件加载器
}
```

### 8.2 注册中心导出 API（`registry.ts`）

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `tools` | `ToolMeta[]` | 全部工具（已排序） |
| `categories` | `string[]` | 去重后的分类列表 |
| `getToolByPath(path)` | `(path: string) => ToolMeta \| undefined` | 按路径查找工具 |
| `searchTools(query)` | `(query: string) => ToolMeta[]` | 多字段模糊搜索（名称/描述/关键词） |

### 8.3 全局 Composable `useDark()`

| 导出 | 说明 |
| --- | --- |
| `isDark` | `Ref<boolean>` 暗黑模式状态（单例） |
| `toggle()` | 切换亮/暗，并持久化到 `localStorage` |

### 8.4 工具内部 Composable（示例：图片表格识别）

| Composable | 文件 | 职责 |
| --- | --- | --- |
| `useImageProcessor` | `composables/useImageProcessor.ts` | 图片→Canvas、灰度化、二值化预处理 |
| `useTableDetector` | `composables/useTableDetector.ts` | 基于线条检测的表格结构识别、单元格裁剪 |
| `useOCR` | `composables/useOCR.ts` | 调用 tesseract.js 识别文字 |
| `useTableExporter` | `composables/useTableExporter.ts` | 导出 CSV/Excel/HTML/Markdown |

**关键接口**：

```ts
interface ProcessedImage { original: string; processed: string; width: number; height: number }
interface TableCell { row: number; col: number; text: string; x: number; y: number; width: number; height: number }
interface TableStructure { rows: number; cols: number; cells: TableCell[] }
interface OCRResult { text: string; confidence: number; words: Array<{...}> }
```

### 8.5 节气查询工具内部模块

| 模块 | 文件 | 职责 |
| --- | --- | --- |
| `useSolarTerm` | `composables/useSolarTerm.ts` | 节气列表计算、最近节气、年份切换 |
| `useCalendar` | `composables/useCalendar.ts` | 生成 6×7 日历格子（含农历、节气标记） |
| `data/dates.ts` | — | 24 节气日期计算 |
| `data/solar-terms.ts` | — | 节气信息（含义/习俗/养生）静态数据 |
| `data/lunar.ts` | — | 公历转农历 |
| `data/poems.ts` | — | 节气诗词 |

---

## 9. 复杂工具剖析

### 9.1 图片表格识别（`image-table-recognizer`）

本项目最复杂的工具，采用**分层流水线**设计：

```
图片上传 → 预处理(灰度+二值化) → 表格线检测(水平/垂直线) → 单元格裁剪 → 逐格 OCR → 可编辑表格 → 多格式导出
```

**子组件**：`ImageUploader`、`ImagePreview`、`ProgressBar`、`TableEditor`、`ExportButtons`

**关键算法**（`useTableDetector.ts`）：
- 二值化阈值 128，`binary[idx] = avg < threshold ? 1 : 0`。
- 水平线检测：某行黑像素占比 > 0.7 且长度 ≥ 宽度 30% 视为水平线。
- 垂直线检测同理（按列扫描）。
- 相近线条（间距 ≤ 10px）合并，避免重复。
- 水平线数 -1 = 行数，垂直线数 -1 = 列数，构建单元格坐标。

### 9.2 节气查询（`solar-term-query`）

具有完整的数据驱动架构，包含 24 节气的含义、习俗、养生建议、诗词数据，支持日历视图与卡片视图切换。

---

## 10. 工具全量目录

共 **50 个工具**，按分类组织（分类内按名称排序）：

### 编码转换（3）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| Base64 编解码 | /base64-codec | 文本与 Base64 编码互转 |
| JSON 格式化 | /json-formatter | 格式化、压缩、校验 JSON 数据 |
| URL 编解码 | /url-codec | URL 编码与解码，支持中文与特殊字符 |

### 文本处理（9）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| 大小写转换 | /case-converter | 英文大小写转换（大写/小写/首字母/驼峰） |
| 图片表格识别 | /image-table-recognizer | OCR 识别图片表格，生成可编辑表格并导出 |
| Markdown 预览 | /markdown-preview | 实时预览 Markdown 渲染效果 |
| 金额大写转换 | /money-cn | 数字金额转中文大写（壹贰叁） |
| 正则测试器 | /regex-tester | 实时测试正则表达式，高亮匹配结果 |
| 文本去重排序 | /text-dedup-sort | 去除重复行、按字母/数字排序 |
| 文本对比 | /text-diff | 对比两段文本差异，高亮新增/删除/修改 |
| 繁简转换 | /traditional-simplified | 繁体中文与简体中文互转 |
| 字数统计 | /word-counter | 统计字符数、单词数、行数、段落数 |

### 图片工具（6）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| 图片压缩 | /image-compress | 压缩 JPG/PNG/WebP 图片 |
| 图片裁剪 | /image-crop | 裁剪图片尺寸和区域 |
| 图片格式转换 | /image-format | JPG/PNG/WebP/GIF 互转 |
| 图片转 Base64 | /image-to-base64 | 图片转 Base64 编码 |
| 二维码生成器 | /qrcode-generator | 生成二维码，支持自定义颜色和 Logo |
| 二维码识别 | /qrcode-reader | 从图片中识别二维码内容 |

### 网络工具（6）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| DNS 查询 | /dns-query | 查询域名 DNS 解析记录，支持 8 种记录类型 |
| HTTP 状态码查询 | /http-status | 查询 HTTP 状态码的含义和用途 |
| IP 地址查询 | /ip-query | 查询当前公网 IP 地址及地理位置信息 |
| 网络延迟测试 | /network-speed | 测试到 8 大网站的网络延迟 |
| 端口查询 | /port-lookup | 查询常用端口号及对应服务 |
| IP 子网计算器 | /subnet-calculator | 计算 IP 子网信息（网络/广播地址、主机数等） |

### 开发工具（6）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| 代码压缩 | /code-minifier | HTML/CSS/JS 代码压缩和美化 |
| Cron 表达式生成 | /cron-generator | 可视化生成 Cron 表达式 |
| JWT 解析 | /jwt-decoder | 解析 JWT，查看 header/payload/signature |
| SQL 格式化 | /sql-formatter | SQL 语句美化和压缩 |
| XML 格式化 | /xml-formatter | XML 格式化、压缩、验证 |
| YAML ↔ JSON 转换 | /yaml-json | YAML 和 JSON 格式互转 |

### 计算工具（3）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| 颜色转换 | /color-converter | HEX/RGB/HSL 颜色格式互转 |
| Hash 计算 | /hash-calculator | 计算 MD5、SHA-1、SHA-256、SHA-512 |
| 进制转换 | /number-base-converter | 二/八/十/十六进制互转 |

### 设计工具（3）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| 颜色选择器 | /color-picker | 可视化选择颜色，支持多种格式 |
| 渐变生成器 | /gradient-generator | 生成 CSS 线性/径向渐变代码 |
| 阴影生成器 | /shadow-generator | 生成 CSS box-shadow 代码 |

### 安全工具（3）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| AES 加密解密 | /aes-encrypt | AES-128/192/256 加密解密 |
| 密码强度检测 | /password-strength | 检测密码强度并给出建议 |
| RSA 加密解密 | /rsa-encrypt | RSA 公钥加密、私钥解密 |

### SEO 工具（3）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| Meta 标签生成 | /meta-tag-generator | 生成 HTML meta 标签（OG/Twitter） |
| Robots.txt 生成 | /robots-generator | 可视化生成 robots.txt 文件 |
| Sitemap 生成 | /sitemap-generator | 生成 XML sitemap |

### 生活计算（4）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| 年龄计算器 | /age-calculator | 根据生日计算精确年龄 |
| BMI 计算器 | /bmi-calculator | 根据身高体重计算 BMI 指数 |
| 日期差计算 | /date-diff | 计算两个日期间的天数/月数/年数 |
| 单位换算 | /unit-converter | 长度/重量/温度/面积/体积转换 |

### 生成器（2）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| 密码生成器 | /password-generator | 生成安全随机密码，可配置长度和字符类型 |
| UUID 生成器 | /uuid-generator | 批量生成 UUID v4 |

### 日期时间（2）
| 工具 | 路径 | 说明 |
| --- | --- | --- |
| 节气查询 | /solar-term-query | 查询 24 节气日期、含义、习俗与养生建议 |
| 时间戳转换 | /timestamp-converter | Unix 时间戳与日期时间互转 |

---

## 11. 依赖关系图

### 11.1 模块依赖

```
main.ts
  └─ App.vue
       ├─ composables/useDark.ts ── localStorage / DOM
       ├─ naive-ui (theme, locale, message)
       └─ router (router-view)
            └─ router/index.ts
                 ├─ layouts/DefaultLayout.vue ── tools/registry.ts
                 ├─ views/HomeView.vue ────────── tools/registry.ts
                 └─ views/ToolView.vue ────────── tools/registry.ts (getToolByPath)
                      └─ tools/<name>/index.vue (按需懒加载)
                           ├─ naive-ui 组件
                           ├─ 工具内部 composables/components
                           └─ 第三方库（tesseract.js / xlsx / marked 等，动态导入）
```

### 11.2 运行时数据流

```
浏览器 URL (hash) ──> vue-router ──> ToolView
                                          │
                          getToolByPath() │ 查 registry.ts 内存表
                                          ▼
                          defineAsyncComponent(loader) ──> 拉取工具 chunk
                                          │
                                          ▼
                              渲染 <component :is="toolComponent" />
```

### 11.3 主题数据流

```
useDark() ──> isDark (ref, 单例)
                │
                ├─ watch ──> localStorage.setItem('theme', ...)
                ├─ watch ──> document.documentElement.classList.toggle('dark')
                └─ App.vue ──> computed(theme) ──> NConfigProvider :theme
```

---

## 12. 项目运行方式

### 环境要求

- Node.js（推荐 18+）
- 包管理器：npm（项目附 `package-lock.json`）

### 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器（默认 http://localhost:5173/） |
| `npm run build` | 类型检查（vue-tsc）+ 生产构建（输出到 `dist/`） |
| `npm run preview` | 预览生产构建产物 |

### 构建说明

- `npm run build` 先执行 `vue-tsc -b` 进行类型检查，再 `vite build`。
- TypeScript 配置严格模式（`strict: true`，`noUnusedLocals`，`noUnusedParameters`）。
- 路径别名 `@` → `src/`（在 `vite.config.ts` 与 `tsconfig.app.json` 中均配置）。

### 新增工具流程

1. 在 `src/tools/` 下新建目录（如 `my-tool/`）。
2. 创建 `meta.ts`，导出包含 `name/path/icon/description/category/keywords` 的对象。
3. 创建 `index.vue`，使用 `<script setup lang="ts">` 实现功能。
4. **无需任何注册操作**，重启 dev server 后工具自动出现在首页与分类菜单。

---

## 13. 工程约定与经验

### 约定

- **工具必须放在 `src/tools/` 下**，且包含 `meta.ts` 和 `index.vue`。
- **自动注册**，禁止手动配置路由或清单。
- **统一技术栈**：Vue 3 + TypeScript + Composition API + Naive UI。
- **可复用逻辑**抽取到 `composables/`（全局）或工具内 `composables/`。
- **网络工具**须使用支持 CORS 的浏览器端第三方 API，并在 UI 标注数据来源。

### 性能经验

- **tesseract.js 及语言包约 25MB**，必须懒加载，否则首屏严重延迟。
- **xlsx、html-minifier-terser 等大库**同样动态 `import()`。
- 工具组件通过 `import.meta.glob`（非 eager）天然实现按需加载。
- 图片处理类工具应包含预处理（灰度 + 二值化）以提升 OCR 准确率。

### 配置要点

- **UnoCSS**：启用 `presetUno`；定义 `btn`、`card` 快捷类。
- **图标**：统一使用自定义内联 SVG，不再依赖 Carbon 图标集。
- **路由**：采用 `createWebHashHistory`（hash 模式），便于静态部署。
- **TypeScript**：`target ES2020`，`moduleResolution: bundler`，`isolatedModules`。

---

> 文档基于项目当前代码状态生成，共覆盖 50 个工具、12 个分类、4 层架构。新增工具或架构调整后建议同步更新本 Wiki。
