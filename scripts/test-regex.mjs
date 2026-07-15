import { readFile } from 'fs/promises'

const content = await readFile('src/tools/address-converter/meta.ts', 'utf-8')
console.log('has icon:', content.includes('icon:'))
console.log('match:', content.match(/icon:\s*['"][^'"]+['"],?/))
console.log('parse name:', content.match(/name:\s*['"]([^'"]*)['"]/))
