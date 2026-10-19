# 全站工具逐项检查

检查与修复日期：2026-10-19。范围：180 个 `meta.ts` / `index.vue` 工具条目。

## 检查方法与边界

- 对全部 180 个工具检查元数据与组件配对、路径唯一性，并用生产构建后的页面逐一访问，记录页面加载和浏览器异常；重复路径按实际可访问的组件计数。
- 另对音频转换、Hash、UUID、年龄、密码生成、科学计算器等输出逻辑进行源码定向复核。
- “页面加载”只表示组件渲染，不表示已验证该工具的全部输入、计算与导出。需上传文件、调用外部 API 或获取硬件权限的流程没有逐一执行。

## 汇总

- 修复后 180/180 个工具拥有独立且可访问的入口；浏览器复测未记录控制台异常。
- 类型检查、生产构建、针对性修复验证和现有回归检查均通过。
- 23 个工具包含网络请求，35 个包含文件上传入口，12 个使用动态 HTML 渲染；这些标记用于安排后续输入输出测试，不自动代表缺陷。

## 已修复的问题

- **音频格式转换**（[audio-converter](../src/tools/audio-converter/index.vue)）：去除无法编码的 MP3 选项，输出格式和扩展名统一为 WAV。
- **Hash 计算**（[hash-calculator](../src/tools/hash-calculator/index.vue)）：提供密钥时正确计算 HMAC-MD5；与独立实现及标准样例核对。
- **UUID 生成器**（[uuid-generator](../src/tools/uuid-generator/index.vue)）：用 BigInt 构建 v1 时间字段，1000 个样例均唯一且时间可解码。
- **年龄计算器**（[age-calculator](../src/tools/age-calculator/index.vue)）：按日期边界计算周岁和下次生日，验证未到生日、生日当天及明日生日。
- **密码生成器**（[password-generator](../src/tools/password-generator/index.vue)）：改用加密随机数打乱，按生成词表和参数估算强度。
- **科学计算器**（[scientific-calculator](../src/tools/scientific-calculator/index.vue)）：修正 DEG 模式三角函数及嵌套函数表达式。
- **繁简转换**（[traditional-simplified](../src/tools/traditional-simplified/index.vue)）：按 OpenCC 当前参数格式初始化，核对双向转换。
- **SQL 格式化**（[sql-formatter-db](../src/tools/sql-formatter-db/index.vue)）：独立地址改为 `/sql-formatter-db`，开发工具版本保留 `/sql-formatter`。

针对性样例见 [test-tool-repairs.mjs](../scripts/test-tool-repairs.mjs)。其余未标记条目仍需按实际输入和输出做进一步验收。

## 全量清单

| 分类 | 工具 | 路径 | 页面加载 | 备注 |
|---|---|---|---|---|
| 安全工具 | [密码强度检测](../src/tools/password-strength/index.vue) | `/password-strength` | 已加载 | 输入输出未单独验证 |
| 安全工具 | [AES 加密解密](../src/tools/aes-encrypt/index.vue) | `/aes-encrypt` | 已加载 | 输入输出未单独验证 |
| 安全工具 | [Base32 编解码](../src/tools/base32-codec/index.vue) | `/base32-codec` | 已加载 | 输入输出未单独验证 |
| 安全工具 | [RSA 加密解密](../src/tools/rsa-encrypt/index.vue) | `/rsa-encrypt` | 已加载 | 输入输出未单独验证 |
| 办公工具 | [表格数据处理](../src/tools/data-processor/index.vue) | `/data-processor` | 已加载 | 输入输出未单独验证 |
| 编码转换 | [Base64 编解码](../src/tools/base64-codec/index.vue) | `/base64-codec` | 已加载 | 输入输出未单独验证 |
| 编码转换 | [HTML 实体编解码](../src/tools/html-entity-codec/index.vue) | `/html-entity-codec` | 已加载 | 输入输出未单独验证 |
| 编码转换 | [JSON 格式化](../src/tools/json-formatter/index.vue) | `/json-formatter` | 已加载 | 输入输出未单独验证 |
| 编码转换 | [Unicode 转换](../src/tools/unicode-converter/index.vue) | `/unicode-converter` | 已加载 | 输入输出未单独验证 |
| 编码转换 | [URL 编解码](../src/tools/url-codec/index.vue) | `/url-codec` | 已加载 | 输入输出未单独验证 |
| 计算工具 | [百分比计算器](../src/tools/percentage-calculator/index.vue) | `/percentage-calculator` | 已加载 | 输入输出未单独验证 |
| 计算工具 | [进制转换](../src/tools/number-base-converter/index.vue) | `/number-base-converter` | 已加载 | 输入输出未单独验证 |
| 计算工具 | [科学计算器](../src/tools/scientific-calculator/index.vue) | `/scientific-calculator` | 已加载 | DEG 三角函数已修复并验证 |
| 计算工具 | [颜色转换](../src/tools/color-converter/index.vue) | `/color-converter` | 已加载 | 输入输出未单独验证 |
| 计算工具 | [Hash 计算](../src/tools/hash-calculator/index.vue) | `/hash-calculator` | 已加载 | HMAC-MD5 已修复并验证 |
| 教育学习 | [成语词典](../src/tools/idiom-dictionary/index.vue) | `/idiom-dictionary` | 已加载 | 输入输出未单独验证 |
| 教育学习 | [单位换算](../src/tools/unit-converter-edu/index.vue) | `/unit-converter-edu` | 已加载 | 输入输出未单独验证 |
| 教育学习 | [公式速查](../src/tools/formula-reference/index.vue) | `/formula-reference` | 已加载 | 输入输出未单独验证 |
| 教育学习 | [古诗词](../src/tools/poetry-collection/index.vue) | `/poetry-collection` | 已加载 | 输入输出未单独验证 |
| 教育学习 | [记忆卡片](../src/tools/flashcard/index.vue) | `/flashcard` | 已加载 | 输入输出未单独验证 |
| 教育学习 | [历史年表](../src/tools/history-timeline/index.vue) | `/history-timeline` | 已加载 | 输入输出未单独验证 |
| 教育学习 | [拼音转换](../src/tools/pinyin-converter/index.vue) | `/pinyin-converter` | 已加载 | 输入输出未单独验证 |
| 教育学习 | [数学练习](../src/tools/math-practice/index.vue) | `/math-practice` | 已加载 | 输入输出未单独验证 |
| 教育学习 | [英语语法](../src/tools/english-grammar/index.vue) | `/english-grammar` | 已加载 | 输入输出未单独验证 |
| 教育学习 | [英语语法](../src/tools/grammar-reference/index.vue) | `/grammar-reference` | 已加载 | 输入输出未单独验证 |
| 教育学习 | [元素周期表](../src/tools/periodic-table/index.vue) | `/periodic-table` | 已加载 | 输入输出未单独验证 |
| 开发工具 | [代码压缩](../src/tools/code-minifier/index.vue) | `/code-minifier` | 已加载 | 输入输出未单独验证 |
| 开发工具 | [CSS 单位转换](../src/tools/css-unit/index.vue) | `/css-unit` | 已加载 | 输入输出未单独验证 |
| 开发工具 | [JSON 表格编辑器](../src/tools/json-table-editor/index.vue) | `/json-table-editor` | 已加载 | 输入输出未单独验证 |
| 开发工具 | [JSON 转 TS 类型](../src/tools/json-to-ts/index.vue) | `/json-to-ts` | 已加载 | 输入输出未单独验证 |
| 开发工具 | [JWT 解析](../src/tools/jwt-decoder/index.vue) | `/jwt-decoder` | 已加载 | 输入输出未单独验证 |
| 开发工具 | [SQL 格式化](../src/tools/sql-formatter/index.vue) | `/sql-formatter` | 已加载 | 路径唯一 |
| 开发工具 | [XML 格式化](../src/tools/xml-formatter/index.vue) | `/xml-formatter` | 已加载 | 输入输出未单独验证 |
| 开发工具 | [YAML ↔ JSON 转换](../src/tools/yaml-json/index.vue) | `/yaml-json` | 已加载 | 输入输出未单独验证 |
| 日期时间 | [节气查询](../src/tools/solar-term-query/index.vue) | `/solar-term-query` | 已加载 | 输入输出未单独验证 |
| 日期时间 | [时间戳转换](../src/tools/timestamp-converter/index.vue) | `/timestamp-converter` | 已加载 | 输入输出未单独验证 |
| 日期时间 | [时区转换](../src/tools/timezone-converter/index.vue) | `/timezone-converter` | 已加载 | 输入输出未单独验证 |
| 设计工具 | [调色板生成器](../src/tools/palette-generator/index.vue) | `/palette-generator` | 已加载 | 输入输出未单独验证 |
| 设计工具 | [渐变生成器](../src/tools/gradient-generator/index.vue) | `/gradient-generator` | 已加载 | 输入输出未单独验证 |
| 设计工具 | [颜色选择器](../src/tools/color-picker/index.vue) | `/color-picker` | 已加载 | 输入输出未单独验证 |
| 设计工具 | [阴影生成器](../src/tools/shadow-generator/index.vue) | `/shadow-generator` | 已加载 | 输入输出未单独验证 |
| 设计工具 | [Favicon 生成](../src/tools/favicon-generator/index.vue) | `/favicon-generator` | 已加载 | 输入输出未单独验证 |
| 生成器 | [密码生成器](../src/tools/password-generator/index.vue) | `/password-generator` | 已加载 | 随机打乱与强度估计已修复 |
| 生成器 | [Lorem Ipsum 生成器](../src/tools/lorem-ipsum/index.vue) | `/lorem-ipsum` | 已加载 | 输入输出未单独验证 |
| 生成器 | [UUID 生成器](../src/tools/uuid-generator/index.vue) | `/uuid-generator` | 已加载 | v1 时间字段已修复并验证 |
| 生活计算 | [贷款计算器](../src/tools/loan-calculator/index.vue) | `/loan-calculator` | 已加载 | 输入输出未单独验证 |
| 生活计算 | [单位换算](../src/tools/unit-converter/index.vue) | `/unit-converter` | 已加载 | 输入输出未单独验证 |
| 生活计算 | [个税计算器](../src/tools/tax-calculator/index.vue) | `/tax-calculator` | 已加载 | 输入输出未单独验证 |
| 生活计算 | [年龄计算器](../src/tools/age-calculator/index.vue) | `/age-calculator` | 已加载 | 日期边界已修复并验证 |
| 生活计算 | [日期差计算](../src/tools/date-diff/index.vue) | `/date-diff` | 已加载 | 输入输出未单独验证 |
| 生活计算 | [BMI 计算器](../src/tools/bmi-calculator/index.vue) | `/bmi-calculator` | 已加载 | 输入输出未单独验证 |
| 数据可视化 | [关系图](../src/tools/relation-graph-maker/index.vue) | `/relation-graph-maker` | 已加载 | 输入输出未单独验证 |
| 数据可视化 | [流程图生成](../src/tools/flowchart-generator/index.vue) | `/flowchart-generator` | 已加载 | 输入输出未单独验证 |
| 数据可视化 | [热力图](../src/tools/heatmap-maker/index.vue) | `/heatmap-maker` | 已加载 | 输入输出未单独验证 |
| 数据可视化 | [时间轴生成](../src/tools/timeline-generator/index.vue) | `/timeline-generator` | 已加载 | 输入输出未单独验证 |
| 数据可视化 | [树状图绘制](../src/tools/tree-diagram-drawer/index.vue) | `/tree-diagram-drawer` | 已加载 | 输入输出未单独验证 |
| 数据可视化 | [数据表格渲染](../src/tools/data-table-renderer/index.vue) | `/data-table-renderer` | 已加载 | 输入输出未单独验证 |
| 数据可视化 | [思维导图](../src/tools/mind-map-maker/index.vue) | `/mind-map-maker` | 已加载 | 输入输出未单独验证 |
| 数据可视化 | [统计图表](../src/tools/stats-chart-maker/index.vue) | `/stats-chart-maker` | 已加载 | 输入输出未单独验证 |
| 数据可视化 | [CSV 图表生成](../src/tools/csv-chart-generator/index.vue) | `/csv-chart-generator` | 已加载 | 输入输出未单独验证 |
| 数据可视化 | [JSON 树视图](../src/tools/json-tree-viewer/index.vue) | `/json-tree-viewer` | 已加载 | 输入输出未单独验证 |
| 数据库工具 | [表结构生成](../src/tools/table-schema-gen/index.vue) | `/table-schema-gen` | 已加载 | 输入输出未单独验证 |
| 数据库工具 | [连接串解析](../src/tools/connection-string-parser/index.vue) | `/connection-string-parser` | 已加载 | 输入输出未单独验证 |
| 数据库工具 | [索引优化建议](../src/tools/index-optimizer/index.vue) | `/index-optimizer` | 已加载 | 输入输出未单独验证 |
| 数据库工具 | [ER 图生成](../src/tools/er-diagram-gen/index.vue) | `/er-diagram-gen` | 已加载 | 输入输出未单独验证 |
| 数据库工具 | [MongoDB 查询构建](../src/tools/mongo-query-builder/index.vue) | `/mongo-query-builder` | 已加载 | 输入输出未单独验证 |
| 数据库工具 | [Redis 命令查询](../src/tools/redis-command-ref/index.vue) | `/redis-command-ref` | 已加载 | 输入输出未单独验证 |
| 数据库工具 | [SQL 格式化](../src/tools/sql-formatter-db/index.vue) | `/sql-formatter-db` | 已加载 | 路径唯一 |
| 数据库工具 | [SQL 注入检测](../src/tools/sql-injection-check/index.vue) | `/sql-injection-check` | 已加载 | 输入输出未单独验证 |
| 数据库工具 | [SQL 转 MongoDB](../src/tools/sql-to-mongo/index.vue) | `/sql-to-mongo` | 已加载 | 输入输出未单独验证 |
| 数据库工具 | [SQL 转实体](../src/tools/sql-to-entity/index.vue) | `/sql-to-entity` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [二维码美化](../src/tools/qrcode-beautifier/index.vue) | `/qrcode-beautifier` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [二维码生成器](../src/tools/qrcode-generator/index.vue) | `/qrcode-generator` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [二维码识别](../src/tools/qrcode-reader/index.vue) | `/qrcode-reader` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [图片裁剪](../src/tools/image-crop/index.vue) | `/image-crop` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [图片格式转换](../src/tools/image-format/index.vue) | `/image-format` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [图片拼接](../src/tools/image-merge/index.vue) | `/image-merge` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [图片去背景](../src/tools/bg-remover/index.vue) | `/bg-remover` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [图片去水印](../src/tools/watermark-remover/index.vue) | `/watermark-remover` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [图片水印](../src/tools/image-watermark/index.vue) | `/image-watermark` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [图片压缩](../src/tools/image-compress/index.vue) | `/image-compress` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [图片转 Base64](../src/tools/image-to-base64/index.vue) | `/image-to-base64` | 已加载 | 输入输出未单独验证 |
| 图片工具 | [证件照换底色](../src/tools/id-photo/index.vue) | `/id-photo` | 已加载 | 输入输出未单独验证 |
| 网络工具 | [端口查询](../src/tools/port-lookup/index.vue) | `/port-lookup` | 已加载 | 输入输出未单独验证 |
| 网络工具 | [网络延迟测试](../src/tools/network-speed/index.vue) | `/network-speed` | 已加载 | 输入输出未单独验证 |
| 网络工具 | [DNS 查询](../src/tools/dns-query/index.vue) | `/dns-query` | 已加载 | 输入输出未单独验证 |
| 网络工具 | [HTTP 请求测试](../src/tools/http-request/index.vue) | `/http-request` | 已加载 | 输入输出未单独验证 |
| 网络工具 | [HTTP 状态码查询](../src/tools/http-status/index.vue) | `/http-status` | 已加载 | 输入输出未单独验证 |
| 网络工具 | [IP 地址查询](../src/tools/ip-query/index.vue) | `/ip-query` | 已加载 | 输入输出未单独验证 |
| 网络工具 | [IP 子网计算器](../src/tools/subnet-calculator/index.vue) | `/subnet-calculator` | 已加载 | 输入输出未单独验证 |
| 网络工具 | [UserAgent 解析](../src/tools/ua-parser/index.vue) | `/ua-parser` | 已加载 | 输入输出未单独验证 |
| 文本处理 | [大小写转换](../src/tools/case-converter/index.vue) | `/case-converter` | 已加载 | 输入输出未单独验证 |
| 文本处理 | [繁简转换](../src/tools/traditional-simplified/index.vue) | `/traditional-simplified` | 已加载 | 双向转换已修复并验证 |
| 文本处理 | [金额大写转换](../src/tools/money-cn/index.vue) | `/money-cn` | 已加载 | 输入输出未单独验证 |
| 文本处理 | [摩斯密码](../src/tools/morse-code/index.vue) | `/morse-code` | 已加载 | 输入输出未单独验证 |
| 文本处理 | [图片表格识别](../src/tools/image-table-recognizer/index.vue) | `/image-table-recognizer` | 已加载 | 输入输出未单独验证 |
| 文本处理 | [文本对比](../src/tools/text-diff/index.vue) | `/text-diff` | 已加载 | 输入输出未单独验证 |
| 文本处理 | [文本去重排序](../src/tools/text-dedup-sort/index.vue) | `/text-dedup-sort` | 已加载 | 输入输出未单独验证 |
| 文本处理 | [文本转语音](../src/tools/text-to-speech/index.vue) | `/text-to-speech` | 已加载 | 输入输出未单独验证 |
| 文本处理 | [正则测试器](../src/tools/regex-tester/index.vue) | `/regex-tester` | 已加载 | 输入输出未单独验证 |
| 文本处理 | [字数统计](../src/tools/word-counter/index.vue) | `/word-counter` | 已加载 | 输入输出未单独验证 |
| 文本处理 | [Markdown 预览](../src/tools/markdown-preview/index.vue) | `/markdown-preview` | 已加载 | 输入输出未单独验证 |
| 文档处理 | [文档字数统计](../src/tools/doc-word-count/index.vue) | `/doc-word-count` | 已加载 | 输入输出未单独验证 |
| 文档处理 | [CSV 转 JSON](../src/tools/csv-to-json/index.vue) | `/csv-to-json` | 已加载 | 输入输出未单独验证 |
| 文档处理 | [Excel 转 CSV](../src/tools/excel-to-csv/index.vue) | `/excel-to-csv` | 已加载 | 输入输出未单独验证 |
| 文档处理 | [Markdown 转 PDF](../src/tools/markdown-to-pdf/index.vue) | `/markdown-to-pdf` | 已加载 | 输入输出未单独验证 |
| 文档处理 | [Markdown 转 Word](../src/tools/markdown-to-word/index.vue) | `/markdown-to-word` | 已加载 | 输入输出未单独验证 |
| 文档处理 | [PDF 工具箱](../src/tools/pdf-toolbox/index.vue) | `/pdf-toolbox` | 已加载 | 输入输出未单独验证 |
| 文档处理 | [TXT 转 EPUB](../src/tools/txt-to-epub/index.vue) | `/txt-to-epub` | 已加载 | 输入输出未单独验证 |
| 文档处理 | [Word 转 Markdown](../src/tools/word-to-markdown/index.vue) | `/word-to-markdown` | 已加载 | 输入输出未单独验证 |
| 文档工具 | [PDF 转换器](../src/tools/pdf-converter/index.vue) | `/pdf-converter` | 已加载 | 输入输出未单独验证 |
| 音视频处理 | [波形图生成](../src/tools/waveform-generator/index.vue) | `/waveform-generator` | 已加载 | 输入输出未单独验证 |
| 音视频处理 | [视频截图](../src/tools/video-screenshot/index.vue) | `/video-screenshot` | 已加载 | 输入输出未单独验证 |
| 音视频处理 | [视频信息提取](../src/tools/video-info-extract/index.vue) | `/video-info-extract` | 已加载 | 输入输出未单独验证 |
| 音视频处理 | [视频转 GIF](../src/tools/video-to-gif/index.vue) | `/video-to-gif` | 已加载 | 输入输出未单独验证 |
| 音视频处理 | [音频变速](../src/tools/audio-speed-changer/index.vue) | `/audio-speed-changer` | 已加载 | 输入输出未单独验证 |
| 音视频处理 | [音频格式转换](../src/tools/audio-converter/index.vue) | `/audio-converter` | 已加载 | WAV 输出格式与扩展名一致 |
| 音视频处理 | [音频剪辑](../src/tools/audio-trimmer/index.vue) | `/audio-trimmer` | 已加载 | 输入输出未单独验证 |
| 音视频处理 | [音频降噪](../src/tools/audio-noise-reduction/index.vue) | `/audio-noise-reduction` | 已加载 | 输入输出未单独验证 |
| 音视频处理 | [音频可视化](../src/tools/audio-visualizer/index.vue) | `/audio-visualizer` | 已加载 | 输入输出未单独验证 |
| 音视频处理 | [TTS 音频合成](../src/tools/tts-audio-synth/index.vue) | `/tts-audio-synth` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [地图生成](../src/tools/map-generator/index.vue) | `/map-generator` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [精灵图切片工具](../src/tools/sprite-slicer/index.vue) | `/sprite-slicer` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [碰撞检测工具](../src/tools/collision-detector/index.vue) | `/collision-detector` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [随机数生成](../src/tools/random-generator/index.vue) | `/random-generator` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [向量计算工具](../src/tools/vector-calculator/index.vue) | `/vector-calculator` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [像素艺术](../src/tools/pixel-art-tool/index.vue) | `/pixel-art-tool` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [像素艺术编辑](../src/tools/pixel-art-editor/index.vue) | `/pixel-art-editor` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [颜色拾取工具](../src/tools/color-picker-game/index.vue) | `/color-picker-game` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [游戏配置生成](../src/tools/game-config-gen/index.vue) | `/game-config-gen` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [游戏随机数](../src/tools/game-random-gen/index.vue) | `/game-random-gen` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [游戏颜色拾取](../src/tools/game-color-picker/index.vue) | `/game-color-picker` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [噪声生成](../src/tools/noise-generator/index.vue) | `/noise-generator` | 已加载 | 输入输出未单独验证 |
| 游戏开发 | [坐标转换](../src/tools/coord-converter/index.vue) | `/coord-converter` | 已加载 | 输入输出未单独验证 |
| 运维工具 | [磁盘容量计算](../src/tools/disk-calculator/index.vue) | `/disk-calculator` | 已加载 | 输入输出未单独验证 |
| 运维工具 | [端口扫描](../src/tools/port-scanner/index.vue) | `/port-scanner` | 已加载 | 输入输出未单独验证 |
| 运维工具 | [进程查询](../src/tools/process-lookup/index.vue) | `/process-lookup` | 已加载 | 输入输出未单独验证 |
| 运维工具 | [内存单位转换](../src/tools/memory-unit-converter/index.vue) | `/memory-unit-converter` | 已加载 | 输入输出未单独验证 |
| 运维工具 | [日志分析](../src/tools/log-analyzer/index.vue) | `/log-analyzer` | 已加载 | 输入输出未单独验证 |
| 运维工具 | [Cron 表达式生成器](../src/tools/cron-expr-gen/index.vue) | `/cron-expr-gen` | 已加载 | 输入输出未单独验证 |
| 运维工具 | [Docker Compose 生成](../src/tools/docker-compose-gen/index.vue) | `/docker-compose-gen` | 已加载 | 输入输出未单独验证 |
| 运维工具 | [Nginx 配置生成](../src/tools/nginx-config-gen/index.vue) | `/nginx-config-gen` | 已加载 | 输入输出未单独验证 |
| 运维工具 | [SSH 密钥生成](../src/tools/ssh-keygen/index.vue) | `/ssh-keygen` | 已加载 | 输入输出未单独验证 |
| 运维工具 | [SSL 证书解析](../src/tools/ssl-cert-parser/index.vue) | `/ssl-cert-parser` | 已加载 | 输入输出未单独验证 |
| 站长工具 | [访问统计](../src/tools/site-stats/index.vue) | `/site-stats` | 已加载 | 输入输出未单独验证 |
| 站长工具 | [关键词挖掘](../src/tools/keyword-miner/index.vue) | `/keyword-miner` | 已加载 | 输入输出未单独验证 |
| AI 辅助 | [翻译对比](../src/tools/translation-compare/index.vue) | `/translation-compare` | 已加载 | 输入输出未单独验证 |
| AI 辅助 | [关键词提取](../src/tools/keyword-extractor/index.vue) | `/keyword-extractor` | 已加载 | 输入输出未单独验证 |
| AI 辅助 | [情感分析](../src/tools/sentiment-analyzer/index.vue) | `/sentiment-analyzer` | 已加载 | 输入输出未单独验证 |
| AI 辅助 | [提示词模板](../src/tools/prompt-templates/index.vue) | `/prompt-templates` | 已加载 | 输入输出未单独验证 |
| AI 辅助 | [文本分类](../src/tools/text-classifier/index.vue) | `/text-classifier` | 已加载 | 输入输出未单独验证 |
| AI 辅助 | [文本摘要](../src/tools/text-summarizer/index.vue) | `/text-summarizer` | 已加载 | 输入输出未单独验证 |
| AI 辅助 | [语法检查](../src/tools/grammar-checker/index.vue) | `/grammar-checker` | 已加载 | 输入输出未单独验证 |
| AI 辅助 | [AI 配置生成](../src/tools/ai-config-generator/index.vue) | `/ai-config-generator` | 已加载 | 输入输出未单独验证 |
| AI 辅助 | [Markdown 润色](../src/tools/markdown-polisher/index.vue) | `/markdown-polisher` | 已加载 | 输入输出未单独验证 |
| AI 辅助 | [Token 计数器](../src/tools/token-counter/index.vue) | `/token-counter` | 已加载 | 输入输出未单独验证 |
| AI 工具 | [中英文翻译](../src/tools/translator/index.vue) | `/translator` | 已加载 | 输入输出未单独验证 |
| AI 工具 | [AI 代码助手](../src/tools/ai-code-assistant/index.vue) | `/ai-code-assistant` | 已加载 | 输入输出未单独验证 |
| AI 工具 | [AI 取名神器](../src/tools/ai-naming/index.vue) | `/ai-naming` | 已加载 | 输入输出未单独验证 |
| AI 工具 | [AI 图片生成](../src/tools/ai-image-generator/index.vue) | `/ai-image-generator` | 已加载 | 输入输出未单独验证 |
| AI 工具 | [AI 文案生成](../src/tools/ai-copywriter/index.vue) | `/ai-copywriter` | 已加载 | 输入输出未单独验证 |
| AI 工具 | [AI 写作助手](../src/tools/ai-writer/index.vue) | `/ai-writer` | 已加载 | 输入输出未单独验证 |
| AI 工具 | [AI 邮件助手](../src/tools/ai-email/index.vue) | `/ai-email` | 已加载 | 输入输出未单独验证 |
| AI 工具 | [AI 智能问答](../src/tools/ai-qa/index.vue) | `/ai-qa` | 已加载 | 输入输出未单独验证 |
| AI 工具 | [AI 周报生成](../src/tools/ai-report/index.vue) | `/ai-report` | 已加载 | 输入输出未单独验证 |
| AI 工具 | [AI SQL 生成](../src/tools/ai-sql/index.vue) | `/ai-sql` | 已加载 | 输入输出未单独验证 |
| API 测试 | [API 密钥生成](../src/tools/api-key-generator/index.vue) | `/api-key-generator` | 已加载 | 输入输出未单独验证 |
| API 测试 | [GraphQL 查询测试](../src/tools/graphql-tester/index.vue) | `/graphql-tester` | 已加载 | 输入输出未单独验证 |
| API 测试 | [gRPC 服务查询](../src/tools/grpc-reflector/index.vue) | `/grpc-reflector` | 已加载 | 输入输出未单独验证 |
| API 测试 | [HMAC 签名](../src/tools/hmac-signer/index.vue) | `/hmac-signer` | 已加载 | 输入输出未单独验证 |
| API 测试 | [JWT 调试](../src/tools/jwt-debugger/index.vue) | `/jwt-debugger` | 已加载 | 输入输出未单独验证 |
| API 测试 | [Mock 服务器](../src/tools/mock-server/index.vue) | `/mock-server` | 已加载 | 输入输出未单独验证 |
| API 测试 | [OpenAPI 校验](../src/tools/openapi-validator/index.vue) | `/openapi-validator` | 已加载 | 输入输出未单独验证 |
| API 测试 | [SSE 测试](../src/tools/sse-tester/index.vue) | `/sse-tester` | 已加载 | 输入输出未单独验证 |
| API 测试 | [Webhook 测试](../src/tools/webhook-tester/index.vue) | `/webhook-tester` | 已加载 | 输入输出未单独验证 |
| API 测试 | [WebSocket 测试](../src/tools/websocket-tester/index.vue) | `/websocket-tester` | 已加载 | 输入输出未单独验证 |
| SEO 工具 | [关键词密度分析](../src/tools/keyword-density/index.vue) | `/keyword-density` | 已加载 | 输入输出未单独验证 |
| SEO 工具 | [Meta 标签生成](../src/tools/meta-tag-generator/index.vue) | `/meta-tag-generator` | 已加载 | 输入输出未单独验证 |
| SEO 工具 | [Robots.txt 生成](../src/tools/robots-generator/index.vue) | `/robots-generator` | 已加载 | 输入输出未单独验证 |
| SEO 工具 | [Sitemap 生成](../src/tools/sitemap-generator/index.vue) | `/sitemap-generator` | 已加载 | 输入输出未单独验证 |
