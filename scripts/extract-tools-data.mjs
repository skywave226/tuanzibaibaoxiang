import { readFile, writeFile, readdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TOOLS_DIR = join(__dirname, '../src/tools')

function parseMeta(content) {
  const get = (key) => {
    const m = content.match(new RegExp(`${key}:\\s*'([^']*)'`))
      || content.match(new RegExp(`${key}:\\s*"([^"]*)"`))
    return m ? m[1] : ''
  }
  const keywordsMatch = content.match(/keywords:\s*\[([^\]]*)\]/s)
  const keywords = keywordsMatch
    ? keywordsMatch[1]
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    : []
  return {
    name: get('name'),
    path: get('path'),
    description: get('description'),
    category: get('category'),
    keywords,
  }
}

async function findMetaFiles(dir) {
  const files = []
  const entries = await readdir(dir)
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const s = await stat(fullPath)
    if (s.isDirectory()) {
      files.push(...await findMetaFiles(fullPath))
    } else if (entry === 'meta.ts') {
      files.push(fullPath)
    }
  }
  return files
}

async function main() {
  const metaFiles = await findMetaFiles(TOOLS_DIR)
  const tools = []
  for (const file of metaFiles) {
    const content = await readFile(file, 'utf-8')
    const meta = parseMeta(content)
    if (!meta.name || !meta.path) continue
    tools.push(meta)
  }
  tools.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  await writeFile(join(__dirname, 'tools-data.json'), JSON.stringify(tools, null, 2), 'utf-8')
  console.log(`Extracted ${tools.length} tools`)
}

main().catch(console.error)
