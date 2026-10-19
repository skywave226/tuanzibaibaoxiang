import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import OpenCC from 'opencc-js'

const root = path.resolve(import.meta.dirname, '..')

function scriptFor(folder) {
  const source = fs.readFileSync(path.join(root, 'src', 'tools', folder, 'index.vue'), 'utf8')
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)?.[1]
  assert.ok(script, `Missing script setup: ${folder}`)
  return { source, script, ast: ts.createSourceFile(`${folder}.ts`, script, ts.ScriptTarget.Latest, true) }
}

function statement(tool, name) {
  const node = tool.ast.statements.find(item =>
    (ts.isFunctionDeclaration(item) && item.name?.text === name)
    || (ts.isVariableStatement(item) && item.declarationList.declarations.some(decl => decl.name.getText(tool.ast) === name)))
  assert.ok(node, `Missing ${name}`)
  return node.getText(tool.ast)
}

function runTypeScript(source, args = [], values = [], returnName) {
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  return new Function(...args, `${js}\nreturn ${returnName};`)(...values)
}

// RFC 2202 and Node's HMAC implementation provide independent expected values.
const hash = scriptFor('hash-calculator')
const hmacMd5 = runTypeScript([statement(hash, 'md5'), statement(hash, 'hmacMd5')].join('\n'), [], [], 'hmacMd5')
const key = new TextEncoder().encode('key')
const data = new TextEncoder().encode('The quick brown fox jumps over the lazy dog')
assert.equal(Buffer.from(hmacMd5(key, data)).toString('hex'), createHmac('md5', key).update(data).digest('hex'))
assert.equal(Buffer.from(hmacMd5(new Uint8Array(16).fill(0x0b), new TextEncoder().encode('Hi There'))).toString('hex'), '9294727a3638bb1c13f48ef8158bfc9d')
const longKey = new Uint8Array(100).fill(0xaa)
assert.equal(Buffer.from(hmacMd5(longKey, data)).toString('hex'), createHmac('md5', longKey).update(data).digest('hex'))

const uuid = scriptFor('uuid-generator')
const uuidState = uuid.script.slice(uuid.script.indexOf('let lastV1Timestamp'), uuid.script.indexOf('function applyFormat'))
const generateV1 = runTypeScript([statement(uuid, 'hexFromBytes'), uuidState].join('\n'), ['crypto'], [globalThis.crypto], 'generateV1')
const uuids = Array.from({ length: 1000 }, () => generateV1())
assert.equal(new Set(uuids).size, uuids.length)
for (const value of uuids) {
  assert.match(value, /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  const [low, mid, high] = value.split('-')
  const ticks = (BigInt(parseInt(high, 16) & 0x0fff) << 48n) | (BigInt(`0x${mid}`) << 32n) | BigInt(`0x${low}`)
  const milliseconds = Number(ticks / 10000n) - 12219292800000
  assert.ok(Math.abs(milliseconds - Date.now()) < 1000, `Incorrect UUID timestamp: ${value}`)
}

const age = scriptFor('age-calculator')
const ageSource = statement(age, 'age')
function ageAt(birth, today) {
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [today])) }
  }
  return runTypeScript(ageSource, ['computed', 'birthDate', 'Date'], [fn => fn(), { value: new Date(`${birth}T00:00:00`).getTime() }, FixedDate], 'age')
}
assert.equal(ageAt('2000-12-20', '2026-10-19').years, 25)
assert.equal(ageAt('2000-10-19', '2026-10-19').years, 26)
assert.equal(ageAt('2000-10-19', '2026-10-19').daysToNextBirthday, 0)
assert.equal(ageAt('2000-10-20', '2026-10-19').daysToNextBirthday, 1)
assert.equal(ageAt('2026-10-20', '2026-10-19'), null)
assert.equal(ageAt('2024-02-29', '2027-03-02').nextBirthday, new Date(2028, 1, 29).toLocaleDateString())

const calculator = scriptFor('scientific-calculator')
const buildExpression = runTypeScript(statement(calculator, 'buildExpression'), ['angleMode'], [{ value: 'deg' }], 'buildExpression')
const evaluate = expression => new Function('Math', `_fact`, `return ${buildExpression(expression)}`)(Math, () => 1)
assert.ok(Math.abs(evaluate('sin(30)') - 0.5) < 1e-12)
assert.ok(Math.abs(evaluate('cos(60)') - 0.5) < 1e-12)
assert.ok(Math.abs(evaluate('tan(45)') - 1) < 1e-12)
assert.ok(Math.abs(evaluate('sin(30+cos(60)*60)') - Math.sqrt(3) / 2) < 1e-12)
const buildRadians = runTypeScript(statement(calculator, 'buildExpression'), ['angleMode'], [{ value: 'rad' }], 'buildExpression')
assert.ok(Math.abs(new Function('Math', `return ${buildRadians('sin(PI/2)')}`)(Math) - 1) < 1e-12)

const toSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' })
const toTraditional = OpenCC.Converter({ from: 'cn', to: 'tw' })
assert.equal(toSimplified('漢語'), '汉语')
assert.equal(toTraditional('汉语'), '漢語')

const audio = scriptFor('audio-converter')
const encodeWav = runTypeScript(statement(audio, 'encodeWav'), [], [], 'encodeWav')
const wav = encodeWav({ sampleRate: 8000, numberOfChannels: 1, length: 4, getChannelData: () => new Float32Array([0, 0.5, -0.5, 0]) })
const wavData = new Uint8Array(await wav.arrayBuffer())
assert.equal(new TextDecoder().decode(wavData.subarray(0, 4)), 'RIFF')
assert.equal(new TextDecoder().decode(wavData.subarray(8, 12)), 'WAVE')
assert.equal(wav.type, 'audio/wav')
assert.match(audio.script, /_converted\.wav/)
assert.doesNotMatch(audio.source, /value="mp3"/)

const password = scriptFor('password-generator')
assert.doesNotMatch(password.script, /Math\.random/)
assert.match(password.script, /wordCount\.value \* Math\.log2\(WORD_LIST\.length\)/)
const wordList = password.script.match(/const WORD_LIST = \[([\s\S]*?)\]/)?.[1].match(/'[^']+'/g)
assert.ok(wordList)
assert.ok(5 * Math.log2(wordList.length) + Math.log2(1000) < 50)

const metas = fs.readdirSync(path.join(root, 'src', 'tools'), { withFileTypes: true })
  .filter(item => item.isDirectory())
  .map(item => fs.readFileSync(path.join(root, 'src', 'tools', item.name, 'meta.ts'), 'utf8').match(/\bpath:\s*'([^']+)'/)?.[1])
assert.equal(new Set(metas).size, metas.length)
assert.ok(metas.includes('/sql-formatter-db'))

console.log('Tool repair checks passed: HMAC-MD5, UUID v1, age boundaries, DEG trigonometry, OpenCC, WAV output, password entropy, unique routes.')
