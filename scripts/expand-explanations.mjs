import fs from 'node:fs'
import path from 'node:path'

const files = [
  { file: 'src/data/math.ts', category: 'math' },
  { file: 'src/data/science.ts', category: 'science' },
  { file: 'src/data/history.ts', category: 'history' },
  { file: 'src/data/computer-science.ts', category: 'computer-science' },
]

function escape(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function expand(category, question, options, correctIndex, short) {
  const correct = options[correctIndex]
  const wrong = options.find((_, index) => index !== correctIndex) ?? 'another option'
  const cleanQuestion = question.replace(/'/g, '’')

  if (category === 'math') {
    return `${short} For "${cleanQuestion}", the correct answer is ${correct}. Show each step clearly and verify the operation before choosing. ${wrong} is incorrect because it does not match the proper calculation. Practicing similar problems helps you solve them faster and with fewer mistakes.`
  }

  if (category === 'science') {
    return `${short} The correct answer is ${correct}. This idea describes a real pattern in nature that scientists test with evidence and experiments. ${wrong} may sound related, but it does not explain the main principle in this question. Understanding ${correct} helps you connect observations to the right scientific reason.`
  }

  if (category === 'history') {
    return `${short} The correct answer is ${correct}. This event or figure matters because it shaped decisions, borders, cultures, or rights that people still study today. ${wrong} is associated with a different period or context. Remembering why ${correct} is significant makes history easier to understand and remember.`
  }

  return `${short} The correct answer is ${correct}. In computer science, this concept helps programs, networks, or data systems behave predictably. ${wrong} might appear in technology conversations, but it is not the best match here. A simple example is applying ${correct} when building or debugging software.`
}

for (const { file, category } of files) {
  const fullPath = path.join(process.cwd(), file)
  let content = fs.readFileSync(fullPath, 'utf8')
  const regex =
    /p\((\d+), '(\w+)', '((?:\\'|[^'])*)', (\[[^\]]+\]), (\d), '((?:\\'|[^'])*)', '((?:\\'|[^'])*)'\)/g

  content = content.replace(regex, (match, id, diff, question, optionsRaw, correctIndex, hint, explanation) => {
    const options = optionsRaw
      .slice(1, -1)
      .split(', ')
      .map((part) => part.slice(1, -1).replace(/\\'/g, "'"))
    const expanded = expand(category, question.replace(/\\'/g, "'"), options, Number(correctIndex), explanation.replace(/\\'/g, "'"))
    return `p(${id}, '${diff}', '${question}', ${optionsRaw}, ${correctIndex}, '${hint}', '${escape(expanded)}')`
  })

  fs.writeFileSync(fullPath, content)
  console.log(`Updated ${file}`)
}

console.log('Expanded all puzzle explanations')
