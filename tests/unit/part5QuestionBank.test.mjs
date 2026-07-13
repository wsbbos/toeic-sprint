import test from 'node:test'
import assert from 'node:assert/strict'

import { part5QuestionBank } from '../../src/data/part5QuestionBank.js'
import { PART5_CATEGORIES } from '../../src/data/part5Schema.js'
import { validatePart5QuestionBank } from '../../src/services/questionValidator.js'

test('production Part 5 bank has at least 300 validated questions', () => {
  const result = validatePart5QuestionBank(part5QuestionBank)

  assert.ok(part5QuestionBank.length >= 300)
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2))
})

test('production Part 5 bank covers every required category with useful depth', () => {
  const result = validatePart5QuestionBank(part5QuestionBank)

  for (const category of PART5_CATEGORIES) {
    assert.ok(
      result.stats.categoryDistribution[category] >= 20,
      `${category} has only ${result.stats.categoryDistribution[category]} questions`
    )
  }
})

test('production Part 5 answers are reasonably distributed across A-D', () => {
  const counts = Object.values(validatePart5QuestionBank(part5QuestionBank).stats.answerDistribution)

  assert.ok(Math.max(...counts) - Math.min(...counts) <= 4)
})

test('every explanation discusses the correct and incorrect choices', () => {
  for (const question of part5QuestionBank) {
    for (const [key, choice] of Object.entries(question.choices)) {
      assert.ok(
        question.explanation.toLocaleLowerCase('en-US').includes(choice.toLocaleLowerCase('en-US')),
        `${question.id} explanation does not discuss ${key} (${choice})`
      )
    }
  }
})

test('legacy questions keep their correct answer meaning when positions move', () => {
  const expectedCorrectChoices = new Map([
    ['p5-001', 'carefully'],
    ['p5-002', 'must review'],
    ['p5-003', 'was approved'],
    ['p5-004', 'by'],
    ['p5-009', 'significantly'],
    ['p5-020', 'be']
  ])

  for (const [id, expectedChoice] of expectedCorrectChoices) {
    const question = part5QuestionBank.find((item) => item.id === id)
    assert.equal(question.choices[question.answer], expectedChoice)
  }
})
