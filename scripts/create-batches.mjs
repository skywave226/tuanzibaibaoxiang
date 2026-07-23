import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tools = JSON.parse(await readFile(join(__dirname, 'tools-data.json'), 'utf-8'))
const BATCH_SIZE = 20
const batchesDir = join(__dirname, 'batches')
await mkdir(batchesDir, { recursive: true })

for (let i = 0; i < tools.length; i += BATCH_SIZE) {
  const batch = tools.slice(i, i + BATCH_SIZE)
  await writeFile(join(batchesDir, `batch-${Math.floor(i / BATCH_SIZE) + 1}.json`), JSON.stringify(batch, null, 2), 'utf-8')
}

console.log(`Created ${Math.ceil(tools.length / BATCH_SIZE)} batches`)
