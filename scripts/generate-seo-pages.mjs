import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TOOLS_DIR = join(__dirname, '../src/tools')
const PUBLIC_DIR = join(__dirname, '../public')
const DIST_DIR = join(__dirname, '../dist')
const BASE_PATH = ''
const SITE_URL = 'https://tool.youxianmengguan.com'
const INJECT_SPA = process.argv.includes('--inject-spa')
const ANALYTICS_SCRIPT = `<script charset="UTF-8" id="LA_COLLECT" src="//sdk.51.la/js-sdk-pro.min.js?id=3QaSafSRwObXL74l&ck=3QaSafSRwObXL74l"></script>`

const LOCALES = [
  { code: 'zh-CN', prefix: '', name: '团子百宝箱' },
  { code: 'en', prefix: 'en', name: 'Tuanzi Toolbox' },
  { code: 'es', prefix: 'es', name: 'Caja de Herramientas Tuanzi' },
  { code: 'fr', prefix: 'fr', name: 'Boîte à Outils Tuanzi' },
  { code: 'de', prefix: 'de', name: 'Tuanzi Werkzeugkasten' },
  { code: 'ja', prefix: 'ja', name: '団子ツールボックス' },
  { code: 'it', prefix: 'it', name: 'Cassetta degli Attrezzi Tuanzi' },
  { code: 'ko', prefix: 'ko', name: '떡이의 도구상자' },
  { code: 'zh-TW', prefix: 'zh-TW', name: '團子百寶箱' },
  { code: 'ru', prefix: 'ru', name: 'Набор Инструментов Туанзи' },
  { code: 'pt', prefix: 'pt', name: 'Caixa de Ferramentas Tuanzi' },
]

const UI_STRINGS = {
  'zh-CN': { use_now: '立即使用', footer: '在线工具集合' },
  en: { use_now: 'Use Now', footer: 'Online Tools Collection' },
  es: { use_now: 'Usar Ahora', footer: 'Colección de Herramientas en Línea' },
  fr: { use_now: 'Utiliser Maintenant', footer: "Collection d'Outils en Ligne" },
  de: { use_now: 'Jetzt Nutzen', footer: 'Online-Werkzeugsammlung' },
  ja: { use_now: '今すぐ使用', footer: 'オンラインツール集' },
  it: { use_now: 'Usa Ora', footer: 'Raccolta di Strumenti Online' },
  ko: { use_now: '지금 사용', footer: '온라인 도구 모음' },
  'zh-TW': { use_now: '立即使用', footer: '線上工具集合' },
  ru: { use_now: 'Использовать', footer: 'Коллекция Онлайн-Инструментов' },
  pt: { use_now: 'Usar Agora', footer: 'Coleção de Ferramentas Online' },
}

let toolTranslations = {}
try {
  toolTranslations = JSON.parse(await readFile(join(__dirname, '../src/i18n/toolTranslations.json'), 'utf-8'))
} catch (e) {
  console.warn('toolTranslations.json not found, using Chinese metadata only')
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function extractSpaAssets(distHtml) {
  const cssMatch = distHtml.match(/<link rel="stylesheet"[^>]*>/)
  const jsMatch = distHtml.match(/<script type="module"[^>]*><\/script>/)
  return {
    css: cssMatch ? cssMatch[0] : '',
    js: jsMatch ? jsMatch[0] : '',
  }
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

function getLocalizedTool(tool, locale) {
  if (locale === 'zh-CN') return tool
  const tr = toolTranslations[tool.path]?.[locale]
  if (!tr) return tool
  return {
    ...tool,
    name: tr.name || tool.name,
    description: tr.description || tool.description,
    keywords: tr.keywords?.length ? tr.keywords : tool.keywords,
  }
}

function toolPageHtml(tool, locale, spaAssets = null) {
  const loc = LOCALES.find(l => l.code === locale) || LOCALES[0]
  const ui = UI_STRINGS[locale] || UI_STRINGS['zh-CN']
  const localized = getLocalizedTool(tool, locale)
  const brand = loc.name
  const title = `${localized.name} - ${ui.footer} | ${brand}`
  const desc = localized.description || `${localized.name}是一款免费的在线工具，支持${localized.keywords.slice(0, 5).join('、')}等功能。`
  const keywords = [...localized.keywords, localized.name, tool.category, ui.footer].join(',')
  const pagePath = `${loc.prefix ? `/${loc.prefix}` : ''}/tools${tool.path}`
  const pageUrl = `${SITE_URL}${pagePath}`
  const toolUrl = `${BASE_PATH}/#${tool.path}`

  const alternateLinks = LOCALES.map(l => {
    const altPath = `${l.prefix ? `/${l.prefix}` : ''}/tools${tool.path}`
    return `<link rel="alternate" hreflang="${l.code}" href="${SITE_URL}${altPath}">`
  }).join('\n  ')
  const xDefault = `<link rel="alternate" hreflang="x-default" href="${SITE_URL}/tools${tool.path}">`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: localized.name,
    description: desc,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
  }

  const seoHead = `
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <link rel="canonical" href="${escapeHtml(pageUrl)}">
  ${alternateLinks}
  ${xDefault}
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`

  const localeScript = locale !== 'zh-CN'
    ? `  <script>try { localStorage.setItem('tuanzi-locale', '${locale}') } catch (e) {}<\/script>`
    : ''

  const commonStyle = `
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
  </style>`

  const staticBody = `
  <header class="header">
    <a href="${BASE_PATH}${loc.prefix ? `/${loc.prefix}` : ''}/">
      <img src="${BASE_PATH}/logo.svg" width="24" height="24" alt="${escapeHtml(brand)}">
      <span>${escapeHtml(brand)}</span>
    </a>
  </header>
  <main class="container">
    <article class="tool-card">
      <div class="tool-header">
        <div class="tool-icon">${tool.icon}</div>
        <h1 class="tool-title">${escapeHtml(localized.name)}</h1>
      </div>
      <div class="tool-category">${escapeHtml(tool.category)}</div>
      <p class="tool-desc">${escapeHtml(localized.description || desc)}</p>
      <div class="tool-keywords">
        ${localized.keywords.map(k => `<span class="keyword">${escapeHtml(k)}</span>`).join('\n        ')}
      </div>
      <a class="cta" href="${escapeHtml(toolUrl)}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        ${ui.use_now}
      </a>
    </article>
  </main>
  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} ${escapeHtml(brand)} - ${ui.footer}</p>
  </footer>`

  if (spaAssets && spaAssets.css && spaAssets.js) {
    return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
${seoHead}
${commonStyle}
  ${spaAssets.css}
${localeScript}
  <script>history.replaceState(null, '', '#${tool.path}')<\/script>
  ${spaAssets.js}
</head>
<body>
  <div id="app">
${staticBody}
  </div>
  ${ANALYTICS_SCRIPT}
</body>
</html>
`
  }

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
${seoHead}
${commonStyle}
</head>
<body>
${staticBody}
  ${ANALYTICS_SCRIPT}
</body>
</html>
`
}

function sitemapXml(tools) {
  const urls = []
  urls.push({ loc: `${SITE_URL}/`, priority: '1.0' })
  for (const l of LOCALES) {
    const prefix = l.prefix ? `/${l.prefix}` : ''
    urls.push({ loc: `${SITE_URL}${prefix}/`, priority: l.code === 'zh-CN' ? '1.0' : '0.9' })
  }
  for (const tool of tools) {
    for (const l of LOCALES) {
      const prefix = l.prefix ? `/${l.prefix}` : ''
      urls.push({ loc: `${SITE_URL}${prefix}/tools${tool.path}`, priority: '0.8' })
    }
  }
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
    const iconMatch = content.match(/icon:\\s*'([^']*)'/) || content.match(/icon:\\s*"([^"]*)"/)
    meta.icon = iconMatch ? iconMatch[1] : ''
    tools.push(meta)
  }

  tools.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  let spaAssets = null
  let outputDir = PUBLIC_DIR

  if (INJECT_SPA) {
    const distIndexPath = join(DIST_DIR, 'index.html')
    try {
      const distHtml = await readFile(distIndexPath, 'utf-8')
      spaAssets = extractSpaAssets(distHtml)
      outputDir = DIST_DIR
      console.log('Injecting SPA assets into static pages')
    } catch (e) {
      console.warn('dist/index.html not found, generating landing pages only')
    }
  }

  // 生成每个工具的多语言静态落地页
  let generated = 0
  for (const tool of tools) {
    for (const l of LOCALES) {
      const prefix = l.prefix ? `${l.prefix}/` : ''
      const pageDir = join(outputDir, prefix, 'tools', tool.path.replace(/^\//, ''))
      await mkdir(pageDir, { recursive: true })
      await writeFile(join(pageDir, 'index.html'), toolPageHtml(tool, l.code, spaAssets), 'utf-8')
      generated++
    }
  }

  // 生成 sitemap.xml 和 robots.txt
  await writeFile(join(outputDir, 'sitemap.xml'), sitemapXml(tools), 'utf-8')
  await writeFile(join(outputDir, 'robots.txt'), robotsTxt(), 'utf-8')

  console.log(`Generated ${generated} SEO pages in ${outputDir.replace(__dirname + '/', '')}/`)
  console.log(`Generated ${outputDir.replace(__dirname + '/', '')}/sitemap.xml`)
  console.log(`Generated ${outputDir.replace(__dirname + '/', '')}/robots.txt`)
}

main().catch(console.error)
