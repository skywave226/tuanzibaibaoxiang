import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const scriptsDir = dirname(fileURLToPath(import.meta.url))
const rootDir = join(scriptsDir, '..')
const toolsDir = join(rootDir, 'src', 'tools')
const inventoryFile = join(scriptsDir, 'tools-data.json')
const catalogFile = join(rootDir, 'docs', 'tool-catalog.md')
const localeDir = join(rootDir, 'src', 'generated', 'tool-locales')
const iconDir = join(rootDir, 'src', 'generated', 'tool-icons')
const taxonomy = JSON.parse(await readFile(join(scriptsDir, 'category-taxonomy.json'), 'utf8'))
const checkOnly = process.argv.includes('--check')

function literal(node, field, file) {
  if (!node || !ts.isStringLiteralLike(node)) {
    throw new Error(`${file}: ${field} 必须是静态字符串`)
  }
  return node.text.trim()
}

function parseMeta(source, file) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
  const exportNode = ast.statements.find(ts.isExportAssignment)
  if (!exportNode || !ts.isObjectLiteralExpression(exportNode.expression)) {
    throw new Error(`${file}: 缺少 export default 元数据对象`)
  }
  const properties = new Map()
  for (const property of exportNode.expression.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    const key = property.name.getText(ast).replace(/^['"]|['"]$/g, '')
    properties.set(key, property.initializer)
  }
  const meta = {}
  for (const field of ['name', 'path', 'description', 'category']) {
    meta[field] = literal(properties.get(field), field, file)
    if (!meta[field]) throw new Error(`${file}: ${field} 不能为空`)
  }
  meta.icon = literal(properties.get('icon'), 'icon', file)
  const keywordNode = properties.get('keywords')
  if (!keywordNode || !ts.isArrayLiteralExpression(keywordNode)) {
    throw new Error(`${file}: keywords 必须是字符串数组`)
  }
  meta.keywords = keywordNode.elements.map(node => literal(node, 'keywords', file))
  if (!meta.keywords.length || meta.keywords.some(keyword => !keyword)) {
    throw new Error(`${file}: keywords 不能为空`)
  }
  return meta
}

function parseIconOverrides(source) {
  const ast = ts.createSourceFile('toolIcons.ts', source, ts.ScriptTarget.Latest, true)
  const declaration = ast.statements
    .filter(ts.isVariableStatement)
    .flatMap(statement => [...statement.declarationList.declarations])
    .find(item => item.name.getText(ast) === 'toolIconMap')
  if (!declaration || !declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) {
    throw new Error('src/data/toolIcons.ts: 缺少 toolIconMap 对象')
  }
  const overrides = {}
  for (const property of declaration.initializer.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    const path = literal(property.name, 'icon path', 'src/data/toolIcons.ts')
    overrides[path] = literal(property.initializer, 'icon', 'src/data/toolIcons.ts')
  }
  return overrides
}

async function findMetaFiles(dir) {
  const files = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await findMetaFiles(path))
    else if (entry.name === 'meta.ts') files.push(path)
  }
  return files
}

function markdownCell(value) {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function buildCatalog(tools) {
  const lines = [
    '# 工具清单',
    '',
    '由 `npm run catalog:generate` 从 `src/tools/*/meta.ts` 自动生成。分类规则见 `scripts/category-taxonomy.json`；请勿手动修改本文件。',
    '',
    `当前共 **${tools.length}** 个工具、**${taxonomy.length}** 个分类。每类达到 100 个时目标为 **${taxonomy.length * 100}** 个；当前差额 **${taxonomy.length * 100 - tools.length}** 个。`,
    '',
    '| 分类 | 现有 | 距 100 个 | 收录范围 | 排除边界 |',
    '| --- | ---: | ---: | --- | --- |',
  ]
  for (const category of taxonomy) {
    const count = tools.filter(tool => tool.category === category.name).length
    lines.push(`| ${category.name} | ${count} | ${Math.max(0, 100 - count)} | ${markdownCell(category.scope)} | ${markdownCell(category.boundary)} |`)
  }
  for (const category of taxonomy) {
    lines.push('', `## ${category.name}`, '', '| 工具 | 地址 | 功能 |', '| --- | --- | --- |')
    for (const tool of tools.filter(item => item.category === category.name)) {
      lines.push(`| ${markdownCell(tool.name)} | \`${tool.path}\` | ${markdownCell(tool.description)} |`)
    }
  }
  lines.push('')
  return lines.join('\n')
}

async function verifyOrWrite(file, expected) {
  if (!checkOnly) {
    await writeFile(file, expected, 'utf8')
    return
  }
  const actual = await readFile(file, 'utf8').catch(() => '')
  if (actual.replaceAll('\r\n', '\n') !== expected) {
    throw new Error(`${relative(rootDir, file)} 已过期，请运行 npm run catalog:generate`)
  }
}

async function main() {
  if (taxonomy.length !== 25 || new Set(taxonomy.map(item => item.name)).size !== taxonomy.length) {
    throw new Error('分类定义必须包含 25 个互不重复的分类')
  }
  for (const category of taxonomy) {
    if (!category.name || !category.scope || !category.boundary) {
      throw new Error('每个分类都需要 name、scope 和 boundary')
    }
  }
  const categories = new Set(taxonomy.map(item => item.name))
  const paths = new Set()
  const names = new Set()
  const tools = []
  const toolIcons = {}
  const iconOverrides = parseIconOverrides(await readFile(join(rootDir, 'src', 'data', 'toolIcons.ts'), 'utf8'))
  for (const file of await findMetaFiles(toolsDir)) {
    const meta = parseMeta(await readFile(file, 'utf8'), relative(rootDir, file))
    const folder = relative(toolsDir, dirname(file)).split(sep).join('/')
    if (meta.path !== `/${folder}`) throw new Error(`${file}: path 应为 /${folder}`)
    if (!categories.has(meta.category)) throw new Error(`${file}: 未定义分类 ${meta.category}`)
    if (paths.has(meta.path)) throw new Error(`${file}: 地址重复 ${meta.path}`)
    const nameKey = meta.name.normalize('NFKC').toLocaleLowerCase()
    if (names.has(nameKey)) throw new Error(`${file}: 工具名称重复 ${meta.name}`)
    await access(join(dirname(file), 'index.vue')).catch(() => {
      throw new Error(`${file}: 缺少 index.vue`)
    })
    paths.add(meta.path)
    names.add(nameKey)
    toolIcons[meta.path] = iconOverrides[meta.path] || meta.icon
    const { icon, ...indexMeta } = meta
    tools.push(indexMeta)
  }
  for (const category of categories) {
    if (!tools.some(tool => tool.category === category)) throw new Error(`空分类：${category}`)
  }
  const translations = JSON.parse(await readFile(join(rootDir, 'src', 'i18n', 'toolTranslations.json'), 'utf8'))
  const locales = (await readdir(join(rootDir, 'src', 'i18n', 'locales')))
    .filter(file => file.endsWith('.json'))
    .map(file => file.slice(0, -5))
  for (const locale of locales) {
    const localizedNames = new Map()
    for (const tool of tools) {
      const name = translations[tool.path]?.[locale]?.name || tool.name
      if (locale === 'zh-CN' && name !== tool.name) {
        throw new Error(`${tool.path}: 简体中文译名与元数据名称不一致`)
      }
      const key = name.normalize('NFKC').toLocaleLowerCase()
      if (localizedNames.has(key)) {
        throw new Error(`${locale}: 工具名称重复 ${name} (${localizedNames.get(key)}、${tool.path})`)
      }
      localizedNames.set(key, tool.path)
    }
  }
  tools.sort((a, b) => a.category.localeCompare(b.category, 'zh-CN') || a.name.localeCompare(b.name, 'zh-CN') || a.path.localeCompare(b.path))
  await verifyOrWrite(inventoryFile, `${JSON.stringify(tools, null, 2)}\n`)
  await verifyOrWrite(catalogFile, buildCatalog(tools))
  if (!checkOnly) await mkdir(localeDir, { recursive: true })
  if (!checkOnly) await mkdir(iconDir, { recursive: true })
  for (const category of categories) {
    const icons = {}
    for (const tool of tools.filter(item => item.category === category)) icons[tool.path] = toolIcons[tool.path]
    await verifyOrWrite(join(iconDir, `${category}.json`), `${JSON.stringify(icons)}\n`)
  }
  for (const locale of locales.filter(item => item !== 'zh-CN')) {
    const overlay = {}
    for (const tool of tools) {
      const direct = translations[tool.path]?.[locale]
      const fallback = tool.path === '/sql-formatter-db' ? translations['/sql-formatter']?.[locale] : undefined
      if (!direct && !fallback) continue
      overlay[tool.path] = {
        name: direct?.name || fallback?.name || tool.name,
        description: direct?.description || fallback?.description || tool.description,
        keywords: direct?.keywords?.length ? direct.keywords : fallback?.keywords?.length ? fallback.keywords : tool.keywords,
      }
    }
    await verifyOrWrite(join(localeDir, `${locale}.json`), `${JSON.stringify(overlay)}\n`)
  }
  console.log(`${checkOnly ? 'Verified' : 'Generated'} ${tools.length} tools across ${taxonomy.length} categories`)
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
