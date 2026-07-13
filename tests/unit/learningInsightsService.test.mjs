import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildLearningTrends,
  buildWeaknessAnalysis,
  calculateStudyStreak,
  getDueReviews,
  updateReviewSchedule
} from '../../src/services/learningInsightsService.js'

test('review schedule expands after success and resets after an error', () => {
  const item = { questionId: 'q-1', reviewLevel: 1, nextReviewAt: null }
  const correct = updateReviewSchedule(item, true, new Date('2026-07-13T00:00:00Z'))
  const wrong = updateReviewSchedule(correct, false, new Date('2026-07-16T00:00:00Z'))

  assert.equal(correct.reviewLevel, 2)
  assert.equal(correct.nextReviewAt, '2026-07-20T00:00:00.000Z')
  assert.equal(wrong.reviewLevel, 0)
  assert.equal(wrong.nextReviewAt, '2026-07-17T00:00:00.000Z')
})

test('due reviews include overdue and unscheduled mistakes', () => {
  const due = getDueReviews([
    { questionId: 'q-1', nextReviewAt: null },
    { questionId: 'q-2', nextReviewAt: '2026-07-12T00:00:00Z' },
    { questionId: 'q-3', nextReviewAt: '2026-07-14T00:00:00Z' }
  ], new Date('2026-07-13T00:00:00Z'))

  assert.deepEqual(due.map((item) => item.questionId), ['q-1', 'q-2'])
})

test('weakness analysis ranks categories using actual attempts and accuracy', () => {
  const history = [
    ...Array.from({ length: 4 }, (_, index) => ({ category: 'word_form', difficulty: 'easy', isCorrect: index === 0 })),
    ...Array.from({ length: 4 }, () => ({ category: 'verb_tense', difficulty: 'hard', isCorrect: true }))
  ]
  const analysis = buildWeaknessAnalysis(history)

  assert.equal(analysis.categories[0].key, 'word_form')
  assert.equal(analysis.categories[0].accuracy, 25)
  assert.equal(analysis.recommendation.category, 'word_form')
})

test('streak and seven-day trends are derived from unique calendar dates', () => {
  const records = [
    { date: '2026-07-11', questionsAnswered: 5, studyMinutes: 10 },
    { date: '2026-07-12', questionsAnswered: 8, studyMinutes: 15 },
    { date: '2026-07-13', questionsAnswered: 10, studyMinutes: 20 }
  ]

  assert.equal(calculateStudyStreak(records, new Date('2026-07-13T12:00:00Z')), 3)
  assert.equal(buildLearningTrends(records, 7, new Date('2026-07-13T12:00:00Z')).length, 7)
})
