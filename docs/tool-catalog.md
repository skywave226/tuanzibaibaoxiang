# 工具清单

由 `npm run catalog:generate` 从 `src/tools/*/meta.ts` 自动生成。分类规则见 `scripts/category-taxonomy.json`；请勿手动修改本文件。

当前共 **180** 个工具、**25** 个分类。每类达到 100 个时目标为 **2500** 个；当前差额 **2320** 个。

| 分类 | 现有 | 距 100 个 | 收录范围 | 排除边界 |
| --- | ---: | ---: | --- | --- |
| AI 工具 | 10 | 90 | 调用 AI 模型生成、改写、分析内容或与模型交互。 | 纯本地规则、提示词整理和配置辅助归入 AI 辅助。 |
| AI 辅助 | 10 | 90 | 帮助使用 AI 的本地辅助工具，例如提示词、关键词和规则检查。 | 实际调用模型的能力归入 AI 工具。 |
| API 测试 | 10 | 90 | 构造、发送、检查 API 请求与响应。 | 一般编码格式转换归入编码转换。 |
| 安全工具 | 4 | 96 | 密码、哈希、签名和安全检查。 | Base32、Base64 等可逆编码归入编码转换。 |
| 办公工具 | 1 | 99 | 日常办公流程、记录和效率辅助。 | 文件格式转换与内容提取归入文档处理。 |
| 编码转换 | 6 | 94 | 文本、数据与编码表示之间的可逆转换。 | 密码摘要和加密安全归入安全工具。 |
| 计算工具 | 3 | 97 | 通用数学、数值和公式计算。 | 日常生活场景归入生活计算；日期计算归入日期时间。 |
| 教育学习 | 11 | 89 | 知识速查、练习和教学辅助。 | 面向通用生产任务的工具按实际任务归类。 |
| 开发工具 | 8 | 92 | 代码编写、格式化、调试和开发数据处理。 | 数据库专用操作归入数据库工具；API 请求归入 API 测试。 |
| 日期时间 | 4 | 96 | 日期、时间、时区、日历与时间差。 | 其他生活公式归入生活计算。 |
| 设计工具 | 6 | 94 | 颜色、排版、视觉样式与设计资源。 | 图片文件编辑归入图片工具；游戏素材专用工作流归入游戏开发。 |
| 生成器 | 3 | 97 | 按参数生成可直接使用的标识、样例或内容。 | 输出有明确专业场景时优先归入该场景。 |
| 生活计算 | 5 | 95 | 消费、健康、单位等日常场景的计算与换算。 | 日期时间独立归类。 |
| 数据可视化 | 10 | 90 | 图表、数据展示及可视化配置。 | 仅清洗或转换数据归入开发工具或数据库工具。 |
| 数据库工具 | 10 | 90 | SQL 方言、数据库结构和数据查询辅助。 | 通用代码格式化归入开发工具。 |
| 图片工具 | 12 | 88 | 图片文件压缩、裁剪、识别和格式处理。 | 从图片抽取可编辑表格或文档内容归入文档处理。 |
| 网络工具 | 8 | 92 | 网络地址、协议、连通性和网络信息。 | 站点运营管理归入站长工具。 |
| 文本处理 | 9 | 91 | 文本编辑、比较、分析和纯文本转换。 | 输出音频归入音视频处理；提取文档内容归入文档处理。 |
| 文档处理 | 9 | 91 | 跨格式转换、OCR 和从文件提取可编辑内容。 | 对原有文档进行合并、拆分、旋转等编辑归入文档工具。 |
| 文档工具 | 1 | 99 | 对现有文档进行编辑、整理、合并与拆分。 | 跨格式转换和内容提取归入文档处理。 |
| 音视频处理 | 11 | 89 | 音频、视频的生成、转换、播放和编辑。 | 仅处理文字内容归入文本处理。 |
| 游戏开发 | 13 | 87 | 游戏素材、关卡、数值和游戏专用辅助。 | 通用视觉设计归入设计工具。 |
| 运维工具 | 10 | 90 | 部署、配置、日志和系统运行维护。 | 站点内容与搜索优化分别归入站长工具和 SEO 工具。 |
| 站长工具 | 1 | 99 | 站点运行、管理、内容发布和网站基础检查。 | 关键词、搜索意图和搜索排名优化归入 SEO 工具。 |
| SEO 工具 | 5 | 95 | 搜索关键词、页面优化和搜索引擎可见性分析。 | 非搜索场景的站点管理归入站长工具。 |

## AI 工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 中英文翻译 | `/translator` | 调用 OpenAI 兼容接口进行中英文互译，支持自定义接口配置 |
| AI 代码助手 | `/ai-code-assistant` | AI 代码生成、解释、重构与优化，支持多种编程语言 |
| AI 取名神器 | `/ai-naming` | AI 为产品、项目、品牌、域名智能取名，支持风格定制 |
| AI 图片生成 | `/ai-image-generator` | 调用 OpenAI 兼容接口根据提示词生成图片，支持自定义模型和尺寸 |
| AI 文案生成 | `/ai-copywriter` | AI 营销文案、产品描述、广告语与种草文案自动生成 |
| AI 写作助手 | `/ai-writer` | 基于 OpenAI 兼容接口的 AI 写作、改写、标题生成与文案润色工具 |
| AI 邮件助手 | `/ai-email` | AI 撰写商务邮件、回复邮件与邮件模板生成 |
| AI 智能问答 | `/ai-qa` | AI 智能问答助手，支持多轮对话与上下文记忆 |
| AI 周报生成 | `/ai-report` | 输入工作要点，AI 自动生成结构化工作周报 |
| AI SQL 生成 | `/ai-sql` | 自然语言转 SQL 查询，支持表结构描述与多方言 |

## AI 辅助

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 翻译对比 | `/translation-compare` | 多引擎翻译结果对比（链接生成） |
| 关键词提取 | `/keyword-extractor` | 从文本中提取关键词 |
| 情感分析 | `/sentiment-analyzer` | 分析文本的情感倾向 |
| 提示词模板 | `/prompt-templates` | AI 提示词模板库 |
| 文本分类 | `/text-classifier` | 基于规则的文本分类 |
| 文本摘要 | `/text-summarizer` | 自动提取文本摘要 |
| 语法检查 | `/grammar-checker` | 英文语法基础检查 |
| AI 配置生成 | `/ai-config-generator` | 生成 AI 模型配置文件 |
| Markdown 润色 | `/markdown-polisher` | Markdown 文档格式润色 |
| Token 计数器 | `/token-counter` | 估算文本的 Token 数量 |

## API 测试

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| API 密钥生成 | `/api-key-generator` | 批量生成随机 API 密钥，支持自定义前缀、长度与编码格式 |
| GraphQL 查询测试 | `/graphql-tester` | 发送 GraphQL 查询请求，支持变量、请求头编辑与历史记录 |
| gRPC 服务查询 | `/grpc-reflector` | gRPC 服务说明、protobuf 基础知识、.proto 语法速查与 grpcurl 命令生成器 |
| HMAC 签名 | `/hmac-signer` | 使用 Web Crypto API 计算 HMAC 签名，支持 SHA256/384/512/MD5 |
| JWT 调试 | `/jwt-debugger` | 解码 JWT Token，查看 Header/Payload/Signature，检查过期时间与 alg:none 风险 |
| Mock 服务器 | `/mock-server` | 定义 Mock 路由并生成配置 JSON，支持本地模拟请求与下载 |
| OpenAPI 校验 | `/openapi-validator` | 校验 OpenAPI/Swagger 文档结构，列出 API 端点与必需字段检查 |
| SSE 测试 | `/sse-tester` | 连接 SSE 服务端，实时接收 Server-Sent Events 消息流 |
| Webhook 测试 | `/webhook-tester` | 向 Webhook URL 发送请求，测试回调接口（支持自定义方法与请求体） |
| WebSocket 测试 | `/websocket-tester` | 连接 WebSocket 服务，收发消息并记录通信日志 |

## 安全工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 密码强度检测 | `/password-strength` | 检测密码强度并给出建议 |
| AES 加密解密 | `/aes-encrypt` | AES-128/192/256 加密解密 |
| Hash 计算 | `/hash-calculator` | 计算文本与文件的 MD5、SHA-1、SHA-256、SHA-512 哈希值，支持 HMAC 与 Base64 输出 |
| RSA 加密解密 | `/rsa-encrypt` | RSA 公钥加密、私钥解密 |

## 办公工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 表格数据处理 | `/data-processor` | 在线处理 CSV / Excel 数据，支持去重、拆分列、合并文件、筛选排序与格式转换 |

## 编码转换

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| Base32 编解码 | `/base32-codec` | Base32 编码与解码（RFC 4648 标准） |
| Base64 编解码 | `/base64-codec` | 文本与 Base64 编码互转，支持 URL 安全 Base64、文件拖放转 Base64、图片预览与原文件下载 |
| HTML 实体编解码 | `/html-entity-codec` | HTML 实体编码与解码，支持 &amp; &lt; &gt; 等特殊字符 |
| JSON 格式化 | `/json-formatter` | 格式化、压缩、校验 JSON 数据，支持 JSONPath 查询、Schema 校验与 CSV/TSV 导出 |
| Unicode 转换 | `/unicode-converter` | Unicode 转义序列转换（\uXXXX），支持中文与特殊字符 |
| URL 编解码 | `/url-codec` | URL 编码与解码，支持 URL 参数解析、批量处理、自动判断编码方向 |

## 计算工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 百分比计算器 | `/percentage-calculator` | 百分比、增减比例、基数等多种百分比计算 |
| 进制转换 | `/number-base-converter` | 二进制、八进制、十进制、十六进制互转 |
| 科学计算器 | `/scientific-calculator` | 支持三角函数、对数、幂运算等科学计算功能 |

## 教育学习

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 成语词典 | `/idiom-dictionary` | 成语查询词典，支持释义、出处、例句 |
| 公式速查 | `/formula-reference` | 数学物理公式速查表，按分类浏览，支持搜索与变量说明 |
| 古诗词 | `/poetry-collection` | 古诗词鉴赏查询，支持按朝代、作者、主题浏览 |
| 基础单位换算 | `/unit-converter-edu` | 多类别单位换算工具，支持长度、质量、温度、时间、面积、体积、速度、数据 |
| 记忆卡片 | `/flashcard` | 记忆卡片与单词本工具，支持卡片组管理、翻转动画、顺序/随机浏览、掌握度标记、复习模式与导入导出 |
| 历史年表 | `/history-timeline` | 中外历史年表，横向时间轴展示，支持中国/世界筛选与事件详情 |
| 拼音转换 | `/pinyin-converter` | 汉字转拼音工具，支持带声调、无声调、首字母模式 |
| 数学练习 | `/math-practice` | 数学练习题生成器，支持加减乘除、难度分级、计时 |
| 英语语法基础 | `/english-grammar` | 英语语法参考工具，时态、句型、词性详解 |
| 英语语法速查 | `/grammar-reference` | 英语语法速查，含时态、句型、从句、虚拟语气等 |
| 元素周期表 | `/periodic-table` | 化学元素周期表，118 种元素完整数据，点击查看详细信息 |

## 开发工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 代码压缩 | `/code-minifier` | HTML/CSS/JS 代码压缩和美化 |
| CSS 单位转换 | `/css-unit` | px / rem / em / vw / vh 等 CSS 单位互转，可配置根字号 |
| JSON 表格编辑器 | `/json-table-editor` | 将 JSON 数组可视化为表格，支持单元格编辑、增删行列，并导出 JSON 或 CSV |
| JSON 转 TS 类型 | `/json-to-ts` | 根据 JSON 数据自动生成 TypeScript 类型定义（interface） |
| JWT 解析 | `/jwt-decoder` | 解析 JSON Web Token，查看 header/payload/signature |
| SQL 快速格式化 | `/sql-formatter` | SQL 语句美化和压缩 |
| XML 格式化 | `/xml-formatter` | XML 格式化、压缩、验证 |
| YAML ↔ JSON 转换 | `/yaml-json` | YAML 和 JSON 格式互转 |

## 日期时间

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 节气查询 | `/solar-term-query` | 查询 24 节气日期、含义、习俗与养生建议 |
| 日期差计算 | `/date-diff` | 计算两个日期之间的天数、月数、年数 |
| 时间戳转换 | `/timestamp-converter` | Unix 时间戳与日期时间互转，支持时区选择、多种格式模板、批量转换 |
| 时区转换 | `/timezone-converter` | 全球时区时间对照与转换，含工作日换算 |

## 设计工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 调色板生成器 | `/palette-generator` | 生成互补色、类似色、三角配色等调色板，可导出 CSS 变量 |
| 渐变生成器 | `/gradient-generator` | 生成 CSS 线性/径向渐变代码 |
| 颜色选择器 | `/color-picker` | 可视化选择颜色，支持多种格式 |
| 颜色转换 | `/color-converter` | HEX、RGB、HSL、CMYK 颜色格式互转，支持 WCAG 对比度检查、配色方案、CSS 颜色名识别 |
| 阴影生成器 | `/shadow-generator` | 生成 CSS box-shadow 代码 |
| Favicon 生成 | `/favicon-generator` | 用文字或 Emoji 生成多尺寸 Favicon 图标（PNG/ICO） |

## 生成器

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 密码生成器 | `/password-generator` | 生成安全随机密码与易记口令短语，支持自定义字符集、排除易混淆字符、熵值评估 |
| Lorem Ipsum 生成器 | `/lorem-ipsum` | 生成占位文本（Lorem Ipsum），支持按段落/句子/单词生成 |
| UUID 生成器 | `/uuid-generator` | 批量生成 UUID v1/v4，支持无横线、大写、URN、花括号等多种格式，可下载 TXT |

## 生活计算

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 贷款计算器 | `/loan-calculator` | 等额本息与等额本金两种方式计算房贷还款明细 |
| 单位换算 | `/unit-converter` | 支持长度、重量、温度、面积、体积、速度、时间、数据、压强、能量等单位转换，含常用市制/英制单位 |
| 个税计算器 | `/tax-calculator` | 基于 2024 个税税率表计算个人所得税，支持专项附加扣除 |
| 年龄计算器 | `/age-calculator` | 根据生日计算精确年龄 |
| BMI 计算器 | `/bmi-calculator` | 根据身高体重计算 BMI 指数 |

## 数据可视化

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 关系图 | `/relation-graph-maker` | 生成节点关系图（Mermaid graph） |
| 流程图生成 | `/flowchart-generator` | 生成 Mermaid 流程图代码 |
| 热力图 | `/heatmap-maker` | 生成数据热力图 |
| 时间轴生成 | `/timeline-generator` | 生成时间轴可视化 |
| 树状图绘制 | `/tree-diagram-drawer` | 绘制层级树状结构图 |
| 数据表格渲染 | `/data-table-renderer` | 将 CSV/JSON 数据渲染为表格 |
| 思维导图 | `/mind-map-maker` | 生成思维导图（Mermaid mindmap） |
| 统计图表 | `/stats-chart-maker` | 生成柱状图/折线图/饼图统计图表 |
| CSV 图表生成 | `/csv-chart-generator` | 将 CSV 数据生成为图表 |
| JSON 树视图 | `/json-tree-viewer` | 将 JSON 数据以可折叠树形结构展示 |

## 数据库工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 表结构生成 | `/table-schema-gen` | 可视化设计数据库表结构并生成 DDL |
| 多方言 SQL 格式化 | `/sql-formatter-db` | SQL 语句格式化与美化，支持多种方言 |
| 连接串解析 | `/connection-string-parser` | 解析数据库连接字符串（MySQL/PostgreSQL/MongoDB 等） |
| 索引优化建议 | `/index-optimizer` | 分析 SQL 查询并给出索引优化建议 |
| ER 图生成 | `/er-diagram-gen` | 根据表结构生成 ER 实体关系图（Mermaid） |
| MongoDB 查询构建 | `/mongo-query-builder` | 可视化构建 MongoDB 查询语句 |
| Redis 命令查询 | `/redis-command-ref` | Redis 命令速查手册与示例 |
| SQL 注入检测 | `/sql-injection-check` | 检测 SQL 语句中的注入风险 |
| SQL 转 MongoDB | `/sql-to-mongo` | 将 SQL 查询语句转换为 MongoDB 查询语法 |
| SQL 转实体 | `/sql-to-entity` | 将 SQL 建表语句转换为 TypeScript 实体类 |

## 图片工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 二维码美化 | `/qrcode-beautifier` | 生成高颜值二维码，支持圆点、圆角、渐变、Logo 叠加与多种 eye 样式，可导出 PNG / SVG |
| 二维码生成器 | `/qrcode-generator` | 生成二维码，支持自定义颜色、纠错等级、中心 Logo、批量生成、PNG/SVG 导出与历史记录 |
| 二维码识别 | `/qrcode-reader` | 从图片中识别二维码内容 |
| 图片裁剪 | `/image-crop` | 裁剪图片尺寸和区域 |
| 图片格式转换 | `/image-format` | JPG/PNG/WebP/GIF 互转 |
| 图片拼接 | `/image-merge` | 多张图片横向或竖向拼接，可调整间距与背景色 |
| 图片去背景 | `/bg-remover` | 移除图片背景或替换为指定颜色，适合纯色背景照片快速抠图 |
| 图片去水印 | `/watermark-remover` | 用图片局部区域覆盖水印，适合去除纯色或简单背景上的水印 |
| 图片水印 | `/image-watermark` | 为图片添加文字或图片水印，可调整位置、透明度与大小 |
| 图片压缩 | `/image-compress` | 批量压缩 JPG/PNG/WebP 图片，支持格式转换与 ZIP 打包下载 |
| 图片转 Base64 | `/image-to-base64` | 图片转 Base64 编码 |
| 证件照换底色 | `/id-photo` | 上传照片一键更换证件照背景色，支持蓝底、白底、红底及常用尺寸裁剪 |

## 网络工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 端口查询 | `/port-lookup` | 查询常用端口号及其对应的服务和用途 |
| 网络延迟测试 | `/network-speed` | 测试到各大网站的网络延迟 |
| DNS 查询 | `/dns-query` | 查询域名 DNS 解析记录，支持多种记录类型 |
| HTTP 请求测试 | `/http-request` | 发送 HTTP 请求测试 API，支持多方法、自定义请求头、环境变量、请求历史、cURL 导入导出 |
| HTTP 状态码查询 | `/http-status` | 查询 HTTP 状态码的含义和用途 |
| IP 地址查询 | `/ip-query` | 查询当前公网 IP 地址及地理位置信息 |
| IP 子网计算器 | `/subnet-calculator` | 计算 IP 子网信息，包括网络地址、广播地址、可用主机数等 |
| UserAgent 解析 | `/ua-parser` | 解析 User-Agent 字符串，识别浏览器、操作系统与设备信息 |

## 文本处理

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 大小写转换 | `/case-converter` | 英文大小写转换，支持驼峰、帕斯卡、蛇形、短横线、常量、路径、点分隔、URL Slug、反转大小写等 |
| 繁简转换 | `/traditional-simplified` | 繁体中文和简体中文互转 |
| 金额大写转换 | `/money-cn` | 数字金额转中文大写（壹贰叁） |
| 摩斯密码 | `/morse-code` | 摩斯密码（Morse Code）编解码，支持中英文与音频播放 |
| 文本对比 | `/text-diff` | 对比两段文本的差异，高亮显示新增、删除和修改的内容 |
| 文本去重排序 | `/text-dedup-sort` | 去除重复行、按字母/数字排序 |
| 正则测试器 | `/regex-tester` | 正则表达式匹配、替换测试与表达式解析，含常用正则库 |
| 字数统计 | `/word-counter` | 统计文本字符数、单词数、行数、段落数、中文字符、阅读/朗读时间，并展示词频排行 |
| Markdown 预览 | `/markdown-preview` | 实时预览 Markdown 渲染效果 |

## 文档处理

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 图片表格识别 | `/image-table-recognizer` | 上传图片识别表格内容，自动生成可编辑表格并导出 |
| 文档字数统计 | `/doc-word-count` | 统计文档字数、行数、段落数 |
| CSV 转 JSON | `/csv-to-json` | 将 CSV 数据转换为 JSON 数组 |
| Excel 转 CSV | `/excel-to-csv` | 将 Excel 文件转换为 CSV 格式 |
| Markdown 转 PDF | `/markdown-to-pdf` | 将 Markdown 转换为 PDF 文档 |
| Markdown 转 Word | `/markdown-to-word` | 将 Markdown 转换为 Word 文档（.doc） |
| PDF 转换器 | `/pdf-converter` | 将 PDF 转换为 Word、Excel、OCR 文本或图片，支持页面预览与批量导出 |
| TXT 转 EPUB | `/txt-to-epub` | 将纯文本文件转换为 EPUB 电子书 |
| Word 转 Markdown | `/word-to-markdown` | 将 Word 文档转换为 Markdown |

## 文档工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| PDF 工具箱 | `/pdf-toolbox` | PDF 合并、拆分、旋转、压缩、提取文本多功能工具箱 |

## 音视频处理

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 波形图生成 | `/waveform-generator` | 生成音频波形图 |
| 视频截图 | `/video-screenshot` | 从视频中截取画面图片 |
| 视频信息提取 | `/video-info-extract` | 提取视频元数据信息 |
| 视频转 GIF | `/video-to-gif` | 将视频片段转换为 GIF 动图 |
| 文本转语音 | `/text-to-speech` | 将文本转换为语音播放，支持多语言与语速调节 |
| 音频变速 | `/audio-speed-changer` | 改变音频播放速度 |
| 音频格式转换 | `/audio-converter` | 音频文件格式转换 |
| 音频剪辑 | `/audio-trimmer` | 剪辑音频片段 |
| 音频降噪 | `/audio-noise-reduction` | 简单音频降噪处理 |
| 音频可视化 | `/audio-visualizer` | 音频频谱可视化 |
| TTS 音频合成 | `/tts-audio-synth` | 文本转语音并导出音频 |

## 游戏开发

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 地图生成 | `/map-generator` | 程序化地图生成工具，支持洞穴、迷宫、BSP 房间生成，可导出二维数组 |
| 精灵图切片工具 | `/sprite-slicer` | 精灵图切片工具，支持上传精灵图、网格切分、帧预览、手动调整切片区域及导出单帧或全部帧 |
| 碰撞检测工具 | `/collision-detector` | 2D 碰撞检测可视化工具，支持 AABB、圆形、矩形圆形、点与图形、线段碰撞检测及算法公式 |
| 随机数生成 | `/random-generator` | 多种分布随机数生成器，支持均匀/正态/指数分布，含统计直方图 |
| 向量计算工具 | `/vector-calculator` | 2D/3D 向量运算工具，支持加减、点乘、叉乘、模长、归一化、角度、距离、投影、Lerp 插值及可视化 |
| 像素艺术 | `/pixel-art-tool` | 像素画绘制工具，支持画笔/橡皮/填充/吸管，含撤销重做与调色板预设 |
| 像素艺术编辑 | `/pixel-art-editor` | 像素艺术绘制工具，支持网格绘制、调色板、导出 |
| 游戏配色与对比度 | `/color-picker-game` | 游戏开发专用颜色工具，支持 HEX/RGB/HSL/HSV 互转、调色板生成、WCAG 对比度检测及配置导出 |
| 游戏配置生成 | `/game-config-gen` | 游戏配置生成工具，支持角色/物品/关卡模板，含 DPS/TTK 平衡性计算 |
| 游戏随机数 | `/game-random-gen` | 游戏随机数生成器，支持种子随机、加权随机、概率分布 |
| 游戏颜色拾取 | `/game-color-picker` | 游戏开发专用颜色拾取器，支持 HEX/RGB/HSL/HSV 互转及调色板生成 |
| 噪声生成 | `/noise-generator` | Perlin/Simplex 噪声生成器，可调节频率振幅八度，支持一维二维可视化 |
| 坐标转换 | `/coord-converter` | 游戏坐标系转换工具，支持屏幕/世界/笛卡尔/极坐标/等距/瓦片坐标互转，以及 2D/3D 变换矩阵计算 |

## 运维工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 磁盘容量计算 | `/disk-calculator` | 磁盘容量与 RAID 计算器 |
| 端口扫描 | `/port-scanner` | 扫描主机开放端口 |
| 进程查询 | `/process-lookup` | 进程信息查询参考 |
| 内存单位转换 | `/memory-unit-converter` | 存储/内存单位转换 |
| 日志分析 | `/log-analyzer` | 分析服务器日志文件 |
| Cron 表达式生成器 | `/cron-expr-gen` | 可视化生成 5/6 段 Cron 表达式，支持字段编辑、快捷预设、自定义输入与下次执行时间预览 |
| Docker Compose 生成 | `/docker-compose-gen` | 生成 docker-compose.yml |
| Nginx 配置生成 | `/nginx-config-gen` | 生成 Nginx 配置文件 |
| SSH 密钥生成 | `/ssh-keygen` | 生成 SSH 密钥对（浏览器内） |
| SSL 证书解析 | `/ssl-cert-parser` | 解析 X.509 SSL 证书 |

## 站长工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 访问统计 | `/site-stats` | 查看本站访问数据，支持时间范围筛选、趋势图、热门排行与 CSV 导出 |

## SEO 工具

| 工具 | 地址 | 功能 |
| --- | --- | --- |
| 关键词密度分析 | `/keyword-density` | 分析文本关键词密度与频率，支持中英文分词与停用词过滤 |
| 关键词挖掘 | `/keyword-miner` | 基于种子词生成长尾关键词组合，并分析文本关键词密度与搜索意图 |
| Meta 标签生成 | `/meta-tag-generator` | 生成 HTML meta 标签（OG/Twitter） |
| Robots.txt 生成 | `/robots-generator` | 可视化生成 robots.txt 文件 |
| Sitemap 生成 | `/sitemap-generator` | 生成 XML sitemap |
