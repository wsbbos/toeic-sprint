import test from 'node:test'
import assert from 'node:assert/strict'

import { createDefaultUserProfile } from '../../src/data/userProfile.js'
import { toCloudAppData } from '../../src/services/cloudUserService.js'

test('guest profile supports full local data but guest identity never enters cloud payload', () => {
  const guest = createDefaultUserProfile({ id: 'guest-local', isGuest: true, username: '訪客學員', favorites: [{ questionId: 'q-1' }] })
  const payload = toCloudAppData(guest)

  assert.equal(guest.isGuest, true)
  assert.equal(guest.favorites.length, 1)
  assert.equal(Object.hasOwn(payload, 'isGuest'), false)
  assert.equal(Object.hasOwn(payload, 'id'), false)
})
