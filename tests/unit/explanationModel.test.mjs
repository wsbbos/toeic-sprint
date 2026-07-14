import test from 'node:test'
import assert from 'node:assert/strict'

import { createExplanationModel } from '../../src/services/explanationModel.js'

test('creates a Part 5 sentence map and comparable answer states', () => {
  const model = createExplanationModel({
    question: {
      id: 'p5-structure',
      part: 5,
      category: 'verb_tense',
      difficulty: 'medium',
      tags: ['present-perfect', 'time-signal'],
      question: 'The manager has ------- the report already.',
      choices: { A: 'review', B: 'reviewed', C: 'reviewing', D: 'reviews' },
      correctAnswer: 'B',
      explanation: 'B reviewed completes the present perfect form has + past participle. The other forms cannot follow has here.',
    },
    userAnswer: 'A',
  })

  assert.equal(model.kind, 'part5')
  assert.deepEqual(model.sentence, {
    beforeBlank: 'The manager has',
    blank: '-------',
    afterBlank: 'the report already.',
  })
  assert.equal(model.grammarPoint, '動詞時態')
  assert.ok(model.keywords.includes('already'))
  assert.equal(model.choices.find((choice) => choice.key === 'B').status, 'correct')
  assert.equal(model.choices.find((choice) => choice.key === 'A').status, 'selected-wrong')
})

test('locates a Part 7 evidence quote only when it exists in the source document', () => {
  const passage = 'Please submit the signed form by Friday. Late forms cannot be processed.'
  const question = {
    id: 'p7-evidence',
    part: 7,
    passage,
    choices: { A: 'Thursday', B: 'Friday', C: 'Saturday', D: 'Monday' },
    correctAnswer: 'B',
    explanation: '文中明確指出「submit the signed form by Friday」，因此截止日是星期五。',
  }
  const model = createExplanationModel({
    question,
    userAnswer: 'A',
  })

  assert.equal(model.kind, 'part7')
  assert.equal(model.evidence, 'submit the signed form by Friday')
  assert.equal(model.evidenceSource, '文件原文')

  const unsupported = createExplanationModel({
    question: { ...question, passage, explanation: '解析提到「next Wednesday」，但原文沒有這句。' },
    userAnswer: 'A',
  })
  assert.equal(unsupported.evidence, '')
})

test('uses structured per-question evidence before inferred explanation quotes', () => {
  const model = createExplanationModel({
    question: {
      id: 'p7-structured',
      part: 7,
      passage: 'The workshop begins at 9:30 A.M. in Room 401.',
      evidence: { quote: 'begins at 9:30 A.M.', label: '活動時間' },
      choices: { A: '8:30', B: '9:00', C: '9:30', D: '10:00' },
      correctAnswer: 'C',
      explanation: 'The workshop begins in the morning.',
    },
    userAnswer: 'C',
  })

  assert.equal(model.evidence, 'begins at 9:30 A.M.')
  assert.equal(model.evidenceLabel, '活動時間')
})
