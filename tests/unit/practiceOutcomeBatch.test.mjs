import assert from 'node:assert/strict'
import test from 'node:test'
import { createGuestProfile } from '../../src/data/userProfile.js'
import { recordPracticeOutcomes } from '../../src/services/userProgressService.js'

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
