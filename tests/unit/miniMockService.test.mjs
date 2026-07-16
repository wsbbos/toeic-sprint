import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildMiniMockResult,
  MINI_MOCK_DURATION_SECONDS,
  selectMiniMockQuestions,
} from '../../src/services/miniMockService.js'

const question = (id, part, correctAnswer = 'A') => ({
  id,
  part,
  question: `Question ${id}`,
  choices: { A: 'one', B: 'two', C: 'three', D: 'four' },
  correctAnswer,
  explanation: 'Explanation',
  category: 'vocabulary',
  difficulty: 'medium',
  tags: ['business'],
})

test('Mini Mock keeps a 12/8 Part 5 and Part 7 mix when enough questions exist', () => {
  const source = [
    ...Array.from({ length: 15 }, (_, index) => question(`p5-${index}`, 5)),
    ...Array.from({ length: 10 }, (_, index) => question(`p7-${index}`, 7)),
  ]
  const selected = selectMiniMockQuestions(source)
  assert.equal(selected.length, 20)
  assert.equal(selected.filter((item) => item.part === 5).length, 12)
  assert.equal(selected.filter((item) => item.part === 7).length, 8)
})

test('Mini Mock result uses the latest answers and separates unanswered items safely', () => {
  const questions = [question('one', 5), question('two', 7, 'B')]
  const result = buildMiniMockResult(
    questions,
    { one: 'A' },
    MINI_MOCK_DURATION_SECONDS - 75,
    new Date('2026-07-15T12:00:00Z'),
  )
  assert.equal(result.correctCount, 1)
  assert.equal(result.wrongCount, 0)
  assert.equal(result.unansweredCount, 1)
  assert.equal(result.answeredCount, 1)
  assert.equal(result.timeSpent, 75)
  assert.equal(result.wrongList.length, 0)
  assert.equal(result.unansweredList[0].questionId, 'two')
  assert.equal(result.questionOutcomes[0].userAnswer, 'A')
  assert.equal(result.questionOutcomes[0].category, 'vocabulary')
})
