import fs from 'node:fs'

const files = [
  'src/data/math.ts',
  'src/data/science.ts',
  'src/data/history.ts',
  'src/data/computer-science.ts',
]

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  content = content.replace(/  ageMin: number,\n  ageMax: number,\n/g, '')
  content = content.replace(/  ageMin,\n  ageMax,\n/g, '')
  content = content.replace(/p\((\d+), '(\w+)', \d+, \d+, /g, "p($1, '$2', ")
  fs.writeFileSync(file, content)
}

console.log('Puzzle data updated')
