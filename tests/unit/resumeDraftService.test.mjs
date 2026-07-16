import assert from 'node:assert/strict'
import test from 'node:test'

import { getActiveDraftSummaries } from '../../src/services/resumeDraftService.js'
import { createMiniMockDraft, saveMiniMockDraft } from '../../src/services/miniMockDraftRepository.js'
import { savePracticeDraft } from '../../src/services/practiceDraftRepository.js'

const createStorage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

test('active practice and Mini Mock drafts are summarized by most recent activity', () => {
  const storage = createStorage()
  savePracticeDraft({
    id: 'practice-one', version: 2, ownerId: 'guest-local', status: 'active',
    config: { type: 'full_mock', mode: 'full_mock', count: 100, requestedCount: 100 },
    questionIds: Array.from({ length: 100 }, (_, index) => `p5-${index}`),
    answers: { 'p5-0': 'A', 'p5-1': 'B' }, markedQuestionIds: [], currentIndex: 2,
    startedAt: '2026-07-16T01:00:00.000Z', updatedAt: '2026-07-16T01:20:00.000Z',
  }, storage)
  const miniDraft = createMiniMockDraft(Array.from({ length: 20 }, (_, index) => `mock-${index}`), 'guest-local', new Date('2026-07-16T01:10:00.000Z'))
  saveMiniMockDraft({ ...miniDraft, answers: { 'mock-0': 'A' }, updatedAt: '2026-07-16T01:30:00.000Z' }, storage)

  const summaries = getActiveDraftSummaries(storage, 'guest-local')
  assert.deepEqual(summaries.map((item) => item.kind), ['mini_mock', 'practice'])
  assert.equal(summaries[0].title, '20 題文字 Mini Mock')
  assert.equal(summaries[0].answeredCount, 1)
  assert.equal(summaries[0].totalQuestions, 20)
  assert.equal(summaries[1].title, 'Part 5 100 題計時練習')
  assert.equal(summaries[1].answeredCount, 2)
  assert.equal(summaries[1].config.type, 'full_mock')
})

test('draft summaries are owner scoped and ignore malformed storage', () => {
  const storage = createStorage()
  storage.setItem('toeic-sprint:practice-draft:v2:guest-local', '{broken')
  assert.deepEqual(getActiveDraftSummaries(storage, 'guest-local'), [])
  assert.deepEqual(getActiveDraftSummaries(storage, 'signed-in-user'), [])
})
