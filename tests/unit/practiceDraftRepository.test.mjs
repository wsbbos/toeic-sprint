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
  const session = { status: 'active', questionIds: ['q-1'], answers: { 'q-1': 'A' } }

  assert.equal(savePracticeDraft(session, storage), true)
  assert.deepEqual(loadPracticeDraft(storage), session)
  assert.equal(clearPracticeDraft(storage), true)
  assert.equal(loadPracticeDraft(storage), null)
})

test('practice draft safely ignores malformed or submitted data', () => {
  assert.equal(loadPracticeDraft(createStorage('{bad json')), null)
  assert.equal(loadPracticeDraft(createStorage(JSON.stringify({ status: 'submitted', questionIds: [] }))), null)
})
