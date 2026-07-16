import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearMiniMockDraft,
  createMiniMockDraft,
  loadMiniMockDraft,
  saveMiniMockDraft,
} from '../../src/services/miniMockDraftRepository.js'

const createStorage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

test('Mini Mock drafts persist independently for each owner', () => {
  const storage = createStorage()
  const first = createMiniMockDraft(['q-1'], 'user-a', new Date('2026-07-16T00:00:00Z'), 60)
  const second = createMiniMockDraft(['q-2'], 'user-b', new Date('2026-07-16T00:00:00Z'), 60)
  saveMiniMockDraft(first, storage, 'user-a')
  saveMiniMockDraft(second, storage, 'user-b')

  assert.deepEqual(loadMiniMockDraft(storage, 'user-a').questionIds, ['q-1'])
  assert.deepEqual(loadMiniMockDraft(storage, 'user-b').questionIds, ['q-2'])
  assert.equal(clearMiniMockDraft(storage, 'user-a'), true)
  assert.equal(loadMiniMockDraft(storage, 'user-a'), null)
  assert.deepEqual(loadMiniMockDraft(storage, 'user-b').questionIds, ['q-2'])
})

test('Mini Mock draft loading repairs answers and navigation while preserving expiry', () => {
  const storage = createStorage()
  const draft = createMiniMockDraft(['q-1', 'q-2'], 'guest-local', new Date('2026-07-16T00:00:00Z'), 60)
  saveMiniMockDraft({
    ...draft,
    questionIds: ['q-1', 'q-1', 'q-2'],
    answers: { 'q-1': 'A', unknown: 'B', 'q-2': 'Z' },
    currentIndex: 99,
  }, storage)

  const restored = loadMiniMockDraft(storage)
  assert.deepEqual(restored.questionIds, ['q-1', 'q-2'])
  assert.deepEqual(restored.answers, { 'q-1': 'A' })
  assert.equal(restored.currentIndex, 1)
  assert.equal(restored.endsAt, '2026-07-16T00:01:00.000Z')
})