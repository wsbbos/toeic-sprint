import assert from 'node:assert/strict'
import test from 'node:test'
import { createGuestProfile } from '../../src/data/userProfile.js'
import { recordMockResult, recordPracticeOutcomes } from '../../src/services/userProgressService.js'

const question = (id, correctAnswer) => ({
  id,
  part: 5,
  question: `Question ${id}`,
  choices: { A: 'one', B: 'two', C: 'three', D: 'four' },
  correctAnswer,
  explanation: 'Explanation',
  category: 'word_form',
  difficulty: 'easy',
  tags: ['grammar'],
})

test('a multi-answer practice is persisted as one complete profile update', () => {
  const original = createGuestProfile()
  const outcomes = [
    { question: question('one', 'A'), userAnswer: 'A', isCorrect: true },
    { question: question('two', 'B'), userAnswer: 'A', isCorrect: false },
  ]
  const updated = recordPracticeOutcomes(original, outcomes, new Date('2026-07-15T12:00:00Z'))
  assert.equal(updated.progress.totalQuestionsAnswered, 2)
  assert.equal(updated.progress.totalCorrect, 1)
  assert.equal(updated.progress.totalWrong, 1)
  assert.equal(updated.practiceHistory.length, 2)
  assert.equal(updated.wrongBook.length, 1)
  assert.equal(original.progress.totalQuestionsAnswered, 0)
})

test('recording the same mock result twice is idempotent', () => {
  const original = createGuestProfile()
  const result = {
    id: 'mock-fixed-id',
    date: '2026-07-16',
    mode: 'mini_mock',
    totalQuestions: 2,
    correctCount: 1,
    wrongCount: 1,
    score: 50,
    timeSpent: 120,
    wrongList: [],
    questionOutcomes: [],
  }

  const once = recordMockResult(original, result, new Date('2026-07-16T12:00:00Z'))
  const twice = recordMockResult(once, result, new Date('2026-07-16T12:00:01Z'))

  assert.equal(twice.mockTestHistory.length, 1)
  assert.equal(twice.progress.totalQuestionsAnswered, 2)
  assert.equal(twice.progress.totalCorrect, 1)
  assert.equal(twice.progress.totalWrong, 1)
})