import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'dist')
const toolRoot = path.join(root, 'src', 'tools')
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const folders = (await fs.readdir(toolRoot, { withFileTypes: true })).filter(item => item.isDirectory())
const tools = []
for (const folder of folders) {
  const base = path.join(toolRoot, folder.name)
  const meta = await fs.readFile(path.join(base, 'meta.ts'), 'utf8')
  const component = await fs.readFile(path.join(base, 'index.vue'), 'utf8')
  const name = meta.match(/\bname:\s*'([^']+)'/)?.[1]
  const route = meta.match(/\bpath:\s*'([^']+)'/)?.[1]
  const category = meta.match(/\bcategory:\s*'([^']+)'/)?.[1]
  if (!name || !route || !category) throw new Error(`Invalid metadata: ${folder.name}`)
  tools.push({ folder: folder.name, name, route, category, flags: {
    network: /\bfetch\s*\(|\bWebSocket\s*\(|\bEventSource\s*\(/.test(component),
    fileUpload: /<n-upload\b|<input[^>]*type="file"/.test(component),
    dynamicHtml: /v-html=|\.innerHTML\s*=/.test(component),
  } })
}
const routeCounts = new Map()
for (const tool of tools) routeCounts.set(tool.route, (routeCounts.get(tool.route) || 0) + 1)
for (const tool of tools) tool.duplicatePath = routeCounts.get(tool.route) > 1
const registryOrder = [...tools].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
const routeOwner = new Map()
for (const tool of registryOrder) if (!routeOwner.has(tool.route)) routeOwner.set(tool.route, tool.folder)
for (const tool of tools) tool.shadowed = routeOwner.get(tool.route) !== tool.folder

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    const file = path.resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname))
    if (path.relative(dist, file).startsWith('..')) throw new Error('Invalid path')
    const data = await fs.readFile(file)
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const site = `http://127.0.0.1:${server.address().port}`

const portServer = net.createServer()
await new Promise(resolve => portServer.listen(0, '127.0.0.1', resolve))
const debugPort = portServer.address().port
await new Promise(resolve => portServer.close(resolve))

const tempBase = path.join(root, 'reports')
await fs.mkdir(tempBase, { recursive: true })
const profile = await fs.mkdtemp(path.join(tempBase, 'codex-webtool-audit-'))
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--no-proxy-server',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, site,
], { windowsHide: true, stdio: 'ignore' })

let ws
try {
  let tab
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()
      tab = tabs.find(item => item.type === 'page' && item.url.startsWith(site))
      if (tab) break
    } catch { /* Chrome is starting */ }
    await sleep(250)
  }
  if (!tab) throw new Error('Headless Chrome did not start')

  ws = new WebSocket(tab.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })
  let nextId = 0
  const pending = new Map()
  let currentErrors = []
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id) {
      const callback = pending.get(message.id)
      if (callback) {
        pending.delete(message.id)
        if (message.error) callback.reject(new Error(message.error.message))
        else callback.resolve(message.result)
      }
    } else if (message.method === 'Runtime.exceptionThrown') {
      currentErrors.push(message.params.exceptionDetails.text)
    } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      currentErrors.push(message.params.args.map(arg => arg.value || arg.description || '').join(' '))
    }
  })
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
  await call('Page.enable')
  await call('Runtime.enable')

  const results = []
  for (const [index, tool] of tools.entries()) {
    currentErrors = []
    const started = Date.now()
    const target = `${site}/#${tool.route}`
    await call('Page.navigate', { url: target })
    let state = null
    while (Date.now() - started < 15000) {
      try {
        const response = await call('Runtime.evaluate', {
          expression: `({title: document.querySelector('.tool-title')?.textContent?.trim() || '', content: !!document.querySelector('.tool-content > *'), hash: location.hash})`,
          returnByValue: true,
        })
        state = response.result?.value
        if (state?.title === tool.name && state.content && state.hash === `#${tool.route}`) break
      } catch { /* Navigation may destroy the current execution context. */ }
      await sleep(100)
    }
    const routeLoaded = state?.title === tool.name && state.content && state.hash === `#${tool.route}`
    results.push({ ...tool, routeLoaded, loaded: routeLoaded && !tool.shadowed, ms: Date.now() - started, errors: [...new Set(currentErrors)] })
    if ((index + 1) % 20 === 0) console.log(`Checked ${index + 1}/${tools.length}`)
  }

  const output = path.join(root, 'reports', 'tool-page-audit.json')
  await fs.mkdir(path.dirname(output), { recursive: true })
  await fs.writeFile(output, JSON.stringify({ date: new Date().toISOString(), total: tools.length, results }, null, 2))
  console.log(`Reachable ${results.filter(result => result.loaded).length}/${tools.length}; ${results.filter(result => result.errors.length).length} routes had console errors.`)
  console.log(`Report: ${output}`)
} finally {
  ws?.close()
  chrome.kill()
  await new Promise(resolve => server.close(resolve))
  const relative = path.relative(tempBase, profile)
  if (relative.startsWith('codex-webtool-audit-') && !relative.includes('..') && !path.isAbsolute(relative)) {
    await sleep(500)
    await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
  }
}
