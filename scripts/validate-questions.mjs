import { part5QuestionBank } from '../src/data/part5QuestionBank.js'
import { validatePart5QuestionBank } from '../src/services/questionValidator.js'

const result = validatePart5QuestionBank(part5QuestionBank)

console.log('Part 5 question bank validation')
console.log(`Questions: ${result.stats.total}`)
console.log(`Answers: ${JSON.stringify(result.stats.answerDistribution)}`)
console.log(`Categories: ${JSON.stringify(result.stats.categoryDistribution)}`)
console.log(`Difficulties: ${JSON.stringify(result.stats.difficultyDistribution)}`)

for (const warning of result.warnings) {
  console.warn(`[warning:${warning.code}] ${warning.message}`)
}

for (const error of result.errors) {
  const location = error.questionId ? ` (${error.questionId})` : ''
  console.error(`[error:${error.code}]${location} ${error.message}`)
}

if (!result.valid) process.exitCode = 1
