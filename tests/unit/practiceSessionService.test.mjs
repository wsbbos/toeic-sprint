import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createPracticeSession,
  selectPracticeQuestions,
  setSessionAnswer,
  submitPracticeSession,
  toggleMarkedQuestion
} from '../../src/services/practiceSessionService.js'

const questions = Array.from({ length: 12 }, (_, index) => ({
  id: `q-${index + 1}`,
  part: 5,
  category: index < 6 ? 'word_form' : 'verb_tense',
  difficulty: index % 2 ? 'medium' : 'easy',
  question: `Question ${index + 1}`,
  choices: { A: 'one', B: 'two', C: 'three', D: 'four' },
  correctAnswer: index % 2 ? 'B' : 'A',
  explanation: 'Explanation'
}))

test('selectPracticeQuestions respects type, category, difficulty, and count', () => {
  const selected = selectPracticeQuestions(questions, {
    type: 'part5',
    category: 'word_form',
    difficulty: 'easy',
    count: 2
  }, () => 0.5)

  assert.equal(selected.length, 2)
  assert.ok(selected.every((question) => question.category === 'word_form' && question.difficulty === 'easy'))
})

test('session answers, navigation state, and marks update immutably', () => {
  const session = createPracticeSession(questions.slice(0, 3), { type: 'part5', count: 3 }, new Date('2026-07-13T00:00:00Z'))
  const answered = setSessionAnswer(session, 'q-1', 'A')
  const marked = toggleMarkedQuestion(answered, 'q-2')

  assert.deepEqual(session.answers, {})
  assert.equal(answered.answers['q-1'], 'A')
  assert.deepEqual(marked.markedQuestionIds, ['q-2'])
})

test('submitPracticeSession calculates score, categories, and is idempotent', () => {
  let session = createPracticeSession(questions.slice(0, 4), { type: 'part5', count: 4 }, new Date('2026-07-13T00:00:00Z'))
  session = setSessionAnswer(session, 'q-1', 'A')
  session = setSessionAnswer(session, 'q-2', 'A')
  session = setSessionAnswer(session, 'q-3', 'A')
  session = setSessionAnswer(session, 'q-4', 'B')

  const submitted = submitPracticeSession(session, questions, new Date('2026-07-13T00:02:00Z'))
  const repeated = submitPracticeSession(submitted.session, questions, new Date('2026-07-13T00:03:00Z'))

  assert.equal(submitted.result.correctCount, 3)
  assert.equal(submitted.result.accuracy, 75)
  assert.equal(submitted.result.elapsedSeconds, 120)
  assert.equal(submitted.result.categoryPerformance.word_form.total, 4)
  assert.deepEqual(repeated.result, submitted.result)
})

test('selection safely returns the available questions when count is too large', () => {
  const selected = selectPracticeQuestions(questions, { type: 'part5', count: 99 }, () => 0.5)
  assert.equal(selected.length, questions.length)
  assert.equal(new Set(selected.map((question) => question.id)).size, questions.length)
})
