# 团子百宝箱

一个基于 Vue 3 + TypeScript 的免费在线工具集合，包含 160+ 实用工具，支持开发、转换、图片、文本、加密、生活等多个分类。

在线访问：**https://skywave226.github.io/tuanzibaibaoxiang/**

## 特性

- 160+ 在线工具，无需注册即可使用
- 响应式设计，支持桌面端和移动端
- 自定义内联 SVG 图标，无外部图标库依赖
- 静态 SEO 落地页，每个工具都有独立的搜索引擎友好页面
- 本地访问统计，记录热门工具和访问趋势
- 深色模式支持
- GitHub Actions 自动部署到 GitHub Pages

## 技术栈

- Vue 3
- TypeScript
- Vue Router 4
- Naive UI
- UnoCSS
- Vite

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 生成 SEO 静态页面
npm run generate-seo
```

## 项目结构

```
web_tool/
├── public/                  # 静态资源
│   ├── logo.svg            # 站点 Logo
│   ├── sitemap.xml         # 站点地图
│   ├── robots.txt          # 爬虫规则
│   └── tools/              # SEO 静态落地页
├── scripts/                 # 构建脚本
│   └── generate-seo-pages.mjs
├── src/
│   ├── components/          # 公共组件
│   ├── composables/         # 组合式函数
│   ├── layouts/             # 布局
│   ├── router/              # 路由
│   ├── styles/              # 全局样式
│   ├── tools/               # 工具实现
│   │   ├── <tool-name>/
│   │   │   ├── meta.ts      # 工具元数据
│   │   │   └── index.vue    # 工具组件
│   ├── views/               # 页面视图
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── vite.config.ts
└── uno.config.ts
```

## 添加新工具

在 `src/tools/` 下新建目录，包含 `meta.ts` 和 `index.vue`：

```typescript
// src/tools/my-tool/meta.ts
export default {
  name: '我的工具',
  path: '/my-tool',
  icon: '<svg>...</svg>',
  description: '工具描述',
  category: '开发工具',
  keywords: ['关键词'],
}
```

工具会自动注册到路由和首页，无需手动配置。

## 部署

本项目使用 GitHub Actions 自动部署到 GitHub Pages。

### 首次部署

1. 在 GitHub 创建仓库 `tuanzibaibaoxiang`
2. 推送代码：`git push -u origin main`
3. 打开 Settings → Pages，Source 选择 **GitHub Actions**
4. 等待 Actions 运行完成

### 自定义域名

1. 在 `public/` 下添加 `CNAME` 文件，写入你的域名
2. 修改 `vite.config.ts` 中的 `base: '/'`
3. 修改 `scripts/generate-seo-pages.mjs` 中的 `SITE_URL`
4. 重新生成 SEO 页面并推送

## 访问统计

站点内置本地访问统计功能，数据保存在浏览器 `localStorage` 中。访问 `/site-stats` 查看统计详情。

## 许可证

MIT
