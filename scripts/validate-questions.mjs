import { part5QuestionBank } from '../src/data/part5QuestionBank.js'
import { questionsData } from '../src/data/questions.js'
import {
  validatePart5QuestionBank,
  validatePart7QuestionBank,
  validateUnifiedQuestionIds,
} from '../src/services/questionValidator.js'

const part7QuestionBank = questionsData.filter((question) => question.part === 7)
const part5Result = validatePart5QuestionBank(part5QuestionBank)
const part7Result = validatePart7QuestionBank(part7QuestionBank)
const unifiedResult = validateUnifiedQuestionIds(questionsData)

const reportIssues = (label, result) => {
  for (const warning of result.warnings || []) {
    console.warn(`[${label}:warning:${warning.code}] ${warning.message}`)
  }
  for (const error of result.errors || []) {
    const location = error.questionId ? ` (${error.questionId})` : ''
    console.error(`[${label}:error:${error.code}]${location} ${error.message}`)
  }
}

console.log('Part 5 question bank validation')
console.log(`Questions: ${part5Result.stats.total}`)
console.log(`Answers: ${JSON.stringify(part5Result.stats.answerDistribution)}`)
console.log(`Categories: ${JSON.stringify(part5Result.stats.categoryDistribution)}`)
console.log(`Difficulties: ${JSON.stringify(part5Result.stats.difficultyDistribution)}`)
reportIssues('part5', part5Result)

console.log('Part 7 question bank validation')
console.log(`Questions: ${part7Result.stats.total} across ${part7Result.stats.passages} passages`)
console.log(`Answers: ${JSON.stringify(part7Result.stats.answerDistribution)}`)
console.log(`Types: ${JSON.stringify(part7Result.stats.typeDistribution)}`)
console.log(`Difficulties: ${JSON.stringify(part7Result.stats.difficultyDistribution)}`)
reportIssues('part7', part7Result)

console.log(`Unified question IDs: ${unifiedResult.stats.uniqueIds}/${unifiedResult.stats.total} unique`)
reportIssues('unified', unifiedResult)

if (!part5Result.valid || !part7Result.valid || !unifiedResult.valid) process.exitCode = 1