import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PART5_ANSWER_KEYS,
  PART5_CATEGORIES,
  PART5_DIFFICULTIES,
  PART5_SCHEMA_VERSION
} from '../../src/data/part5Schema.js'
import { part5QuestionBank } from '../../src/data/part5QuestionBank.js'
import { validatePart5QuestionBank } from '../../src/services/questionValidator.js'

function makeQuestion(index, overrides = {}) {
  const answer = PART5_ANSWER_KEYS[index % PART5_ANSWER_KEYS.length]
  const category = PART5_CATEGORIES[index % PART5_CATEGORIES.length]
  const choices = {
    A: `option-a-${index}`,
    B: `option-b-${index}`,
    C: `option-c-${index}`,
    D: `option-d-${index}`
  }

  return {
    id: `test-${String(index).padStart(3, '0')}`,
    question: `The project team selected ------- for business scenario ${index}.`,
    choices,
    answer,
    explanation: `The correct answer is ${answer}, ${choices[answer]}. The other choices do not fit this sentence.`,
    category,
    difficulty: PART5_DIFFICULTIES[index % PART5_DIFFICULTIES.length],
    tags: [category, 'business'],
    version: PART5_SCHEMA_VERSION,
    ...overrides
  }
}

test('accepts a balanced schema-compliant question bank', () => {
  const questions = Array.from({ length: 56 }, (_, index) => makeQuestion(index))
  const result = validatePart5QuestionBank(questions)

  assert.equal(result.valid, true)
  assert.deepEqual(result.errors, [])
  assert.equal(result.stats.total, 56)
})

test('reports missing fields and invalid enum values', () => {
  const question = makeQuestion(0, {
    explanation: '',
    difficulty: 'expert',
    tags: []
  })
  const result = validatePart5QuestionBank([question], { checkDistribution: false })
  const codes = result.errors.map((issue) => issue.code)

  assert.ok(codes.includes('MISSING_FIELD'))
  assert.ok(codes.includes('INVALID_DIFFICULTY'))
  assert.ok(codes.includes('EMPTY_TAGS'))
})

test('reports duplicate ids, questions, and choice text', () => {
  const first = makeQuestion(0, {
    choices: { A: 'same', B: 'same', C: 'third', D: 'fourth' },
    explanation: 'The correct answer is A, same. The other choices do not fit.'
  })
  const second = makeQuestion(1, {
    id: first.id,
    question: `  ${first.question.toUpperCase()}  `
  })
  const result = validatePart5QuestionBank([first, second], { checkDistribution: false })
  const codes = result.errors.map((issue) => issue.code)

  assert.ok(codes.includes('DUPLICATE_ID'))
  assert.ok(codes.includes('DUPLICATE_QUESTION'))
  assert.ok(codes.includes('DUPLICATE_CHOICE'))
})

test('reports an answer key that does not exist in choices', () => {
  const result = validatePart5QuestionBank(
    [makeQuestion(0, { answer: 'E', explanation: 'The correct answer is E.' })],
    { checkDistribution: false }
  )

  assert.ok(result.errors.some((issue) => issue.code === 'ANSWER_NOT_FOUND'))
})

test('reports an explanation that explicitly names a different answer', () => {
  const result = validatePart5QuestionBank(
    [makeQuestion(0, { answer: 'B', explanation: 'The correct answer is A because it is an adverb.' })],
    { checkDistribution: false }
  )

  assert.ok(result.errors.some((issue) => issue.code === 'EXPLANATION_ANSWER_MISMATCH'))
})

test('reports severely skewed answer and category distributions', () => {
  const questions = Array.from({ length: 100 }, (_, index) =>
    makeQuestion(index, {
      answer: 'A',
      category: 'word_form',
      explanation: `The correct answer is A, option-a-${index}. The other choices do not fit.`
    })
  )
  const result = validatePart5QuestionBank(questions)
  const codes = result.errors.map((issue) => issue.code)

  assert.ok(codes.includes('ANSWER_POSITION_MISSING'))
  assert.ok(codes.includes('ANSWER_DISTRIBUTION_SKEW'))
  assert.ok(codes.includes('CATEGORY_DISTRIBUTION_SKEW'))
})

test('keeps the current Part 5 bank schema-valid while exposing its distribution debt', () => {
  const schemaResult = validatePart5QuestionBank(part5QuestionBank, { checkDistribution: false })
  const fullResult = validatePart5QuestionBank(part5QuestionBank)

  assert.equal(schemaResult.valid, true)
  assert.deepEqual(schemaResult.errors, [])
  assert.equal(fullResult.valid, false)
  assert.ok(fullResult.errors.some((issue) => issue.code === 'ANSWER_POSITION_MISSING'))
})
