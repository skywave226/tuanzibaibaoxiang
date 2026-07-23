import { readFile, writeFile, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import * as OpenCC from 'opencc-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRANSLATIONS_DIR = join(__dirname, '../src/i18n/translations')
const OUTPUT_FILE = join(__dirname, '../src/i18n/toolTranslations.json')
const TOOLS_FILE = join(__dirname, 'tools-data.json')

const converter = OpenCC.Converter({ from: 'cn', to: 'tw' })

async function main() {
  const tools = JSON.parse(await readFile(TOOLS_FILE, 'utf-8'))
  const files = await readdir(TRANSLATIONS_DIR)
  const batchFiles = files.filter(f => f.startsWith('batch-') && f.endsWith('.json'))

  const merged = {}
  for (const file of batchFiles) {
    const batch = JSON.parse(await readFile(join(TRANSLATIONS_DIR, file), 'utf-8'))
    Object.assign(merged, batch)
  }

  // 补齐 zh-CN 与 zh-TW
  const result = {}
  for (const tool of tools) {
    const path = tool.path
    const translations = merged[path] || {}

    // zh-CN 使用源数据
    translations['zh-CN'] = {
      name: tool.name,
      description: tool.description,
      keywords: tool.keywords,
    }

    // zh-TW 使用 OpenCC 转换
    translations['zh-TW'] = {
      name: converter(tool.name),
      description: converter(tool.description),
      keywords: tool.keywords.map(k => converter(k)),
    }

    result[path] = translations
  }

  await writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`Merged ${Object.keys(result).length} tools into ${OUTPUT_FILE}`)
}

main().catch(console.error)
