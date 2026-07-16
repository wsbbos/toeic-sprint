import assert from 'node:assert/strict'
import test from 'node:test'

import { part5QuestionBank } from '../../src/data/part5QuestionBank.js'
import { questionsData } from '../../src/data/questions.js'

test('confirmed Part 7 complaint distractors and document fields remain business-plausible', () => {
  const complaint = questionsData.find((question) => question.id === 'q115')
  assert.ok(complaint)
  assert.equal('Sent' in (complaint.document?.fields || {}), false)
  const choices = Object.values(complaint.choices).join(' ')
  assert.doesNotMatch(choices, /sommelier|software subscriptions|probationary period/i)
  assert.match(choices, /fifty chairs|entire chair order|postponed opening/i)
})

test('confirmed early Part 5 explanations distinguish each distractor form', () => {
  const obligation = part5QuestionBank.find((question) => question.id === 'p5-002')
  const passive = part5QuestionBank.find((question) => question.id === 'p5-003')
  assert.match(obligation.explanation, /without an obligation marker/i)
  assert.match(obligation.explanation, /gerund/i)
  assert.match(passive.explanation, /missing the auxiliary/i)
  assert.match(passive.explanation, /active present-tense verb/i)
})
