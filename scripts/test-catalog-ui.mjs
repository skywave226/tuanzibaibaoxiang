import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import http from 'node:http'
import net from 'node:net'
import { join, relative, resolve, sep } from 'node:path'
import { tmpdir } from 'node:os'

const root = resolve(import.meta.dirname, '..')
const dist = join(root, 'dist')
const toolIndex = JSON.parse(await readFile(join(root, 'scripts', 'tools-data.json'), 'utf8'))
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const file = resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`)
    const inside = relative(dist, file)
    if (inside.startsWith('..') || inside.includes(`..${sep}`)) throw new Error('Invalid path')
    const content = await readFile(file)
    response.writeHead(200, { 'Content-Type': mime[file.slice(file.lastIndexOf('.'))] || 'application/octet-stream' })
    response.end(content)
  } catch {
    response.writeHead(404)
    response.end('Not found')
  }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const site = `http://127.0.0.1:${server.address().port}`

const reserve = net.createServer()
await new Promise(resolve => reserve.listen(0, '127.0.0.1', resolve))
const debugPort = reserve.address().port
await new Promise(resolve => reserve.close(resolve))

const profile = await mkdtemp(join(tmpdir(), 'web-tool-catalog-test-'))
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--no-proxy-server',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, site,
], { windowsHide: true, stdio: 'ignore' })

let socket
try {
  let tab
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()
      tab = tabs.find(item => item.type === 'page' && item.url.startsWith(site))
      if (tab) break
    } catch { /* browser starting */ }
    await delay(250)
  }
  if (!tab) throw new Error('Headless Chrome did not start')

  socket = new WebSocket(tab.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let id = 0
  const pending = new Map()
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (!message.id) return
    const handler = pending.get(message.id)
    if (!handler) return
    pending.delete(message.id)
    if (message.error) handler.reject(new Error(message.error.message))
    else handler.resolve(message.result)
  })
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const next = ++id
    pending.set(next, { resolve, reject })
    socket.send(JSON.stringify({ id: next, method, params }))
  })
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true })
    return result.result?.value
  }
  const waitFor = async predicate => {
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        const state = await evaluate(predicate)
        if (state) return state
      } catch { /* navigation may reset execution context */ }
      await delay(100)
    }
    throw new Error(`Timed out waiting for ${predicate}`)
  }
  await call('Page.enable')
  await call('Runtime.enable')
  await waitFor("document.querySelectorAll('.tool-card').length > 0")
  await evaluate("localStorage.setItem('tuanzi-locale', 'zh-CN')")
  await call('Page.reload')
  await waitFor("document.documentElement.lang === 'zh-CN' && document.querySelectorAll('.tool-card').length === 48")
  const firstPagePath = await evaluate("document.querySelector('.tool-card').getAttribute('href')")
  const firstTool = toolIndex[0]
  assert.ok(firstPagePath.endsWith(`#${firstTool.path}`))
  const firstIcons = JSON.parse(await readFile(join(root, 'src', 'generated', 'tool-icons', `${firstTool.category}.json`), 'utf8'))
  await waitFor(`performance.getEntriesByType('resource').some(x => decodeURI(new URL(x.name).pathname).includes(${JSON.stringify(`/assets/${firstTool.category}-`)}))`)
  const iconMatched = await evaluate(`(() => {
    const expected = new DOMParser().parseFromString(${JSON.stringify(firstIcons[firstTool.path])}, 'text/html').querySelector('svg')
    const actual = document.querySelector('.tool-card .tool-icon svg')
    return expected?.outerHTML === actual?.outerHTML
  })()`)
  assert.equal(iconMatched, true, 'Tool icon should load from its category chunk')
  const loadedLocales = await evaluate("performance.getEntriesByType('resource').filter(x => /\\/(?:en|de|es|fr|it|ja|ko|pt|ru|zh-TW)-[A-Za-z0-9_-]+\\.js$/.test(x.name)).length")
  assert.equal(loadedLocales, 0, 'Chinese home should not fetch other tool languages')

  await call('Page.navigate', { url: `${site}/#/?page=2` })
  await waitFor("location.hash.includes('page=2') && document.querySelectorAll('.tool-card').length === 48")
  const secondPagePath = await evaluate("document.querySelector('.tool-card').getAttribute('href')")
  assert.notEqual(secondPagePath, firstPagePath)

  const gameSearch = `${site}/#/?category=${encodeURIComponent('游戏开发')}&q=${encodeURIComponent('像素')}`
  await call('Page.navigate', { url: gameSearch })
  await waitFor("document.querySelectorAll('.tool-card').length === 2 && document.querySelector('.category-search input')?.value === '像素'")

  await evaluate("localStorage.setItem('tuanzi-locale', 'en')")
  await call('Page.navigate', { url: site })
  await waitFor("document.documentElement.lang === 'en' && document.querySelectorAll('.tool-card').length === 48")
  const englishLoaded = await evaluate("performance.getEntriesByType('resource').some(x => /\\/en-[A-Za-z0-9_-]+\\.js$/.test(x.name))")
  assert.equal(englishLoaded, true, 'English tool index should load on demand')
  console.log('Passed: 48-card pages, page navigation, category search, and language/icon chunks.')
} finally {
  socket?.close()
  chrome.kill()
  await new Promise(resolve => server.close(resolve))
  const parent = resolve(tmpdir())
  const child = resolve(profile)
  if (relative(parent, child).startsWith('web-tool-catalog-test-') && !relative(parent, child).includes('..') && !relative(parent, child).includes(sep)) {
    await delay(500)
    await rm(child, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
  }
}
