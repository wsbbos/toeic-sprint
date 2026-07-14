import test from 'node:test'
import assert from 'node:assert/strict'

import { questionsData } from '../../src/data/questions.js'

test('every Part 7 question has a source-backed answer evidence marker', () => {
  const questions = questionsData.filter((question) => question.part === 7)
  assert.equal(questions.length, 30)

  for (const question of questions) {
    assert.ok(question.evidence?.quote, `${question.id} is missing evidence`)
    assert.ok(
      question.passage.toLocaleLowerCase().includes(question.evidence.quote.toLocaleLowerCase()),
      `${question.id} evidence must be copied from its source document`,
    )
  }
})
