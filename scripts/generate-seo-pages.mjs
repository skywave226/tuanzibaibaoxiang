import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TOOLS_DIR = join(__dirname, '../src/tools')
const PUBLIC_DIR = join(__dirname, '../public')
const BASE_PATH = '/tuanzibaibaoxiang'
const SITE_URL = 'https://skywave226.github.io/tuanzibaibaoxiang'
const BRAND = '团子百宝箱'

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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

function toolPageHtml(tool) {
  const title = `${tool.name} - 在线工具 | ${BRAND}`
  const desc = tool.description || `${tool.name}是一款免费的在线工具，支持${tool.keywords.slice(0, 5).join('、')}等功能。`
  const keywords = [...tool.keywords, tool.name, tool.category, '在线工具'].join(',')
  const pageUrl = `${SITE_URL}/tools${tool.path}`
  const toolUrl = `${BASE_PATH}/#${tool.path}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: desc,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <link rel="canonical" href="${escapeHtml(pageUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #f5f7fa; color: #333; line-height: 1.6; }
    .header { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 12px 24px; display: flex; align-items: center; gap: 12px; }
    .header a { text-decoration: none; color: inherit; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 18px; }
    .container { max-width: 800px; margin: 40px auto; padding: 0 24px; }
    .tool-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .tool-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .tool-icon { width: 56px; height: 56px; border-radius: 12px; background: #f0f9eb; display: flex; align-items: center; justify-content: center; color: #36ad6a; }
    .tool-icon svg { width: 32px; height: 32px; }
    .tool-title { font-size: 28px; font-weight: 700; margin: 0; }
    .tool-category { display: inline-block; background: #eef2ff; color: #4f46e5; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin-bottom: 16px; }
    .tool-desc { font-size: 16px; color: #555; margin-bottom: 24px; }
    .tool-keywords { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
    .keyword { background: #f3f4f6; color: #666; padding: 4px 10px; border-radius: 6px; font-size: 13px; }
    .cta { display: inline-flex; align-items: center; gap: 8px; background: #36ad6a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
    .cta:hover { background: #2f8f59; }
    .footer { text-align: center; padding: 40px 24px; color: #999; font-size: 14px; }
    @media (max-width: 600px) {
      .tool-title { font-size: 22px; }
      .tool-header { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <header class="header">
    <a href="${BASE_PATH}/">
      <img src="${BASE_PATH}/logo.svg" width="24" height="24" alt="${BRAND}">
      <span>${BRAND}</span>
    </a>
  </header>
  <main class="container">
    <article class="tool-card">
      <div class="tool-header">
        <div class="tool-icon">${tool.icon}</div>
        <h1 class="tool-title">${escapeHtml(tool.name)}</h1>
      </div>
      <div class="tool-category">${escapeHtml(tool.category)}</div>
      <p class="tool-desc">${escapeHtml(tool.description || desc)}</p>
      <div class="tool-keywords">
        ${tool.keywords.map(k => `<span class="keyword">${escapeHtml(k)}</span>`).join('\n        ')}
      </div>
      <a class="cta" href="${escapeHtml(toolUrl)}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        立即使用
      </a>
    </article>
  </main>
  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} ${BRAND} - 在线工具集合</p>
  </footer>
</body>
</html>
`
}

function sitemapXml(tools) {
  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    ...tools.map(t => ({ loc: `${SITE_URL}/tools${t.path}`, priority: '0.8' })),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`
}

function robotsTxt() {
  return `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
`
}

async function main() {
  const metaFiles = await findMetaFiles(TOOLS_DIR)
  const tools = []

  for (const file of metaFiles) {
    const content = await readFile(file, 'utf-8')
    const meta = parseMeta(content)
    if (!meta.name || !meta.path) continue
    const iconMatch = content.match(/icon:\s*'([^']*)'/) || content.match(/icon:\s*"([^"]*)"/)
    meta.icon = iconMatch ? iconMatch[1] : ''
    tools.push(meta)
  }

  tools.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  // 生成每个工具的静态落地页
  for (const tool of tools) {
    const pageDir = join(PUBLIC_DIR, 'tools', tool.path.replace(/^\//, ''))
    await mkdir(pageDir, { recursive: true })
    await writeFile(join(pageDir, 'index.html'), toolPageHtml(tool), 'utf-8')
  }

  // 生成 sitemap.xml 和 robots.txt
  await writeFile(join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml(tools), 'utf-8')
  await writeFile(join(PUBLIC_DIR, 'robots.txt'), robotsTxt(), 'utf-8')

  console.log(`Generated ${tools.length} SEO pages in public/tools/`)
  console.log('Generated public/sitemap.xml')
  console.log('Generated public/robots.txt')
}

main().catch(console.error)
