import test from 'node:test'
import assert from 'node:assert/strict'

import { clearPracticeDraft, loadPracticeDraft, savePracticeDraft } from '../../src/services/practiceDraftRepository.js'

function createStorage(initialValue = null) {
  let value = initialValue
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next },
    removeItem: () => { value = null }
  }
}

test('practice draft persists an active session and clears after submission', () => {
  const storage = createStorage()
  const session = {
    id: 'practice-1',
    version: 2,
    ownerId: 'guest-local',
    status: 'active',
    config: { count: 1 },
    questionIds: ['q-1'],
    answers: { 'q-1': 'A' },
    markedQuestionIds: [],
    currentIndex: 0,
    startedAt: '2026-07-16T01:00:00.000Z',
    updatedAt: '2026-07-16T01:00:00.000Z',
    submittedAt: null,
    result: null,
  }

  assert.equal(savePracticeDraft(session, storage), true)
  assert.deepEqual(loadPracticeDraft(storage), session)
  assert.equal(clearPracticeDraft(storage), true)
  assert.equal(loadPracticeDraft(storage), null)
})

test('practice draft safely ignores malformed or submitted data', () => {
  assert.equal(loadPracticeDraft(createStorage('{bad json')), null)
  assert.equal(loadPracticeDraft(createStorage(JSON.stringify({ status: 'submitted', questionIds: [] }))), null)
})

function createKeyedStorage(entries = {}) {
  const values = new Map(Object.entries(entries))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

test('practice drafts are isolated by owner and never overwrite another account', () => {
  const storage = createKeyedStorage()
  const first = { id: 'draft-a', ownerId: 'user-a', status: 'active', questionIds: ['q-1'], answers: {}, startedAt: '2026-07-16T01:00:00.000Z' }
  const second = { id: 'draft-b', ownerId: 'user-b', status: 'active', questionIds: ['q-2'], answers: {}, startedAt: '2026-07-16T01:05:00.000Z' }

  savePracticeDraft(first, storage, 'user-a')
  savePracticeDraft(second, storage, 'user-b')

  assert.equal(loadPracticeDraft(storage, 'user-a').id, 'draft-a')
  assert.equal(loadPracticeDraft(storage, 'user-b').id, 'draft-b')
})

test('legacy guest drafts are repaired without duplicate questions or invalid navigation state', () => {
  const storage = createKeyedStorage({
    'toeic-sprint:practice-draft:v1': JSON.stringify({
      id: 'legacy-draft',
      status: 'active',
      questionIds: ['q-1', 'q-1'],
      answers: { 'q-1': 'A', unknown: 'B' },
      markedQuestionIds: ['q-1', 'unknown'],
      currentIndex: 99,
      startedAt: '2026-07-16T01:00:00.000Z',
      config: { type: 'part5', count: 2 },
    }),
  })

  const draft = loadPracticeDraft(storage, 'guest-local')
  assert.equal(draft.version, 2)
  assert.equal(draft.ownerId, 'guest-local')
  assert.deepEqual(draft.questionIds, ['q-1'])
  assert.deepEqual(draft.answers, { 'q-1': 'A' })
  assert.deepEqual(draft.markedQuestionIds, ['q-1'])
  assert.equal(draft.currentIndex, 0)
})
