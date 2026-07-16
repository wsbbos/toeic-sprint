import assert from 'node:assert/strict'
import test from 'node:test'

import { savePracticeDraft } from '../../src/services/practiceDraftRepository.js'
import { getActiveDraftSummaries } from '../../src/services/resumeDraftService.js'

test('resume configuration preserves the original requested count when fewer questions were available', () => {
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
  savePracticeDraft({
    id: 'limited-category', version: 2, ownerId: 'guest-local', status: 'active',
    config: { type: 'part5', category: 'rare', requestedCount: 10, count: 6 },
    questionIds: Array.from({ length: 6 }, (_, index) => `limited-${index}`),
    answers: {}, markedQuestionIds: [], currentIndex: 0,
    startedAt: '2026-07-16T01:00:00.000Z', updatedAt: '2026-07-16T01:00:00.000Z',
  }, storage)

  const [summary] = getActiveDraftSummaries(storage, 'guest-local')
  assert.equal(summary.totalQuestions, 6)
  assert.equal(summary.config.count, 10)
})
