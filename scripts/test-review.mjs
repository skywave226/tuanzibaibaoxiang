import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function evaluate(source, context) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  })
  vm.runInNewContext(outputText, context, { timeout: 5000 })
}

const component = readFileSync(new URL('../src/tools/text-diff/index.vue', import.meta.url), 'utf8')
const script = component.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const context = {
  ref: value => ({ value }),
  computed: getter => ({ get value() { return getter() } }),
  useCopy: () => ({ copy() {} }),
  window: { setTimeout: () => null },
}
evaluate(script.replace(/^import .*$/gm, '') + `
globalThis.api = { text1, text2, diffResult, compare, highlightInline, highlightWordDiff, computeLCS }
`, context)
const api = context.api

// Exhaustive short inputs cover insertion, deletion, reordering and repeated lines.
const sequences = ['']
for (let length = 1; length <= 4; length++) {
  for (let bits = 0; bits < 2 ** length; bits++) {
    sequences.push(Array.from({ length }, (_, i) => bits & (1 << i) ? 'a' : 'b').join('\n'))
  }
}
for (const before of sequences) {
  for (const after of sequences) {
    api.text1.value = before
    api.text2.value = after
    api.compare()
    const result = Array.from(api.diffResult.value)
    assert.equal(result.filter(line => line.type !== 'added').map(line => line.content).join('\n'), before)
    assert.equal(result.filter(line => line.type !== 'removed').map(line => line.content).join('\n'), after)
    assert.equal(result.filter(line => line.type === 'same').length,
      api.computeLCS(before.split('\n'), after.split('\n')).length)
    const oldWords = before.replaceAll('\n', ' ')
    const newWords = after.replaceAll('\n', ' ')
    const highlighted = api.highlightWordDiff(oldWords, newWords)
    assert.equal(highlighted.removedHtml.replace(/<\/?span\b[^>]*>/g, ''), oldWords)
    assert.equal(highlighted.addedHtml.replace(/<\/?span\b[^>]*>/g, ''), newWords)
  }
}
for (const payload of ['<img src=x onerror=alert(1)>', '<svg onload=alert(1)>', '&lt;b&gt;']) {
  for (const type of ['same', 'added', 'removed']) {
    assert.ok(!api.highlightInline({ type, content: payload }).includes('<'))
  }
  const highlighted = api.highlightWordDiff('hello world', payload + ' hello world')
  assert.ok(!highlighted.addedHtml.includes('<img'))
  assert.ok(!highlighted.addedHtml.includes('<svg'))
}
assert.ok(component.includes('v-html="highlightInline(line)"'))
assert.ok(!component.includes('line.highlighted || line.content'))

let stored
const storageContext = {
  exports: {}, window: {},
  localStorage: { getItem: () => stored, setItem: (_, value) => { stored = value } },
}
evaluate(readFileSync(new URL('../src/composables/useVisitStats.ts', import.meta.url), 'utf8'), storageContext)
const stats = storageContext.exports
for (const invalid of ['{', '{}', 'null', '42', '[null,{},false,{"timestamp":"bad"}]']) {
  stored = invalid
  assert.equal(stats.getVisitStats().total, 0)
  stats.recordVisit('/test', '测试')
  assert.equal(stats.getVisitStats().total, 1)
}
stored = JSON.stringify([
  null, { path: '/bad', name: 'bad', timestamp: 1e20 },
  { path: '/valid', name: '有效', timestamp: Date.now() },
])
assert.equal(stats.getVisitStats().total, 1)
assert.equal(stats.getVisitStats().topTools[0].path, '/valid')
stored = JSON.stringify(Array.from({ length: 5001 }, () => ({ path: '/', name: '首页', timestamp: Date.now() })))
assert.equal(stats.getVisits().length, 5000)
console.log(`Passed: ${sequences.length ** 2} text comparisons, HTML escaping and corrupt visit storage regressions.`)
