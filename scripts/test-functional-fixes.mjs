import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/tools/http-request/index.vue', import.meta.url), 'utf8')
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)))
const functions = [
  extract('function exportCurl()', '// cURL 导入'),
  extract('function parseCurl(', 'function tokenizeCurl('),
  source.slice(source.indexOf('function tokenizeCurl('), source.indexOf('</script>', source.indexOf('function tokenizeCurl('))),
].join('\n')

let copied = ''
const context = {
  method: { value: 'POST' },
  noCors: { value: true },
  includeHeaders: { value: true },
  headers: { value: [{ key: 'X-Name', value: "O'Reilly" }] },
  includeBody: { value: true },
  hasBody: { value: true },
  body: { value: '{"message":"O\'Reilly"}' },
  url: { value: 'https://example.com/a?title=two words' },
  applyEnvVars: value => value,
  copyText: value => { copied = value },
}
const compiled = ts.transpileModule(functions + '\nglobalThis.api = { exportCurl, parseCurl, tokenizeCurl }', {
  compilerOptions: { target: ts.ScriptTarget.ES2020 },
}).outputText
vm.runInNewContext(compiled, context, { timeout: 5000 })
context.api.exportCurl()

assert.ok(!copied.includes('--no-cors'))
assert.ok(copied.startsWith('curl -X POST'))
const parsed = context.api.parseCurl(copied)
assert.equal(parsed.method, 'POST')
assert.equal(parsed.url, context.url.value)
assert.equal(parsed.body, context.body.value)
assert.equal(parsed.headers[0].key, 'X-Name')
assert.equal(parsed.headers[0].value, "O'Reilly")
assert.throws(() => context.api.tokenizeCurl("curl 'unfinished"), /引号未闭合/)
console.log('Passed: exported cURL is validly quoted and imports without losing request data.')
