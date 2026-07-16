import assert from 'node:assert/strict'
import test from 'node:test'
import {
  fetchOrCreateCloudUser,
  getProfileUpdatedAt,
  selectNewestUserProfile,
  stampProfileUpdate,
} from '../../src/services/cloudUserService.js'

const profile = (overrides = {}) => ({
  id: 'user-1',
  email: 'learner@example.com',
  username: 'Learner',
  progress: {},
  goals: {},
  vocabularyProgress: {},
  wrongBook: [],
  favorites: [],
  practiceHistory: [],
  mockTestHistory: [],
  dailyRecords: [],
  ...overrides,
})

test('profile updates receive a stable last-write timestamp', () => {
  const stamped = stampProfileUpdate(profile(), new Date('2026-07-16T03:00:00.000Z'))
  assert.equal(stamped.dataUpdatedAt, '2026-07-16T03:00:00.000Z')
})

test('newer local progress wins instead of being overwritten by stale cloud data', () => {
  const local = profile({
    dataUpdatedAt: '2026-07-16T03:00:00.000Z',
    progress: { totalQuestionsAnswered: 12 },
  })
  const cloud = profile({
    dataUpdatedAt: '2026-07-16T02:00:00.000Z',
    progress: { totalQuestionsAnswered: 10 },
  })
  const resolved = selectNewestUserProfile(local, cloud)
  assert.equal(resolved.source, 'local')
  assert.equal(resolved.user.progress.totalQuestionsAnswered, 12)
})

test('newer cloud progress is adopted on another device', () => {
  const local = profile({ dataUpdatedAt: '2026-07-16T01:00:00.000Z' })
  const cloud = profile({
    dataUpdatedAt: '2026-07-16T02:00:00.000Z',
    favorites: [{ questionId: 'p5-001' }],
  })
  const resolved = selectNewestUserProfile(local, cloud)
  assert.equal(resolved.source, 'cloud')
  assert.deepEqual(resolved.user.favorites.map((item) => item.questionId), ['p5-001'])
})

test('legacy profiles infer freshness from real learning activity', () => {
  const local = profile({
    practiceHistory: [{ questionId: 'p5-002', answeredAt: '2026-07-16T04:00:00.000Z' }],
  })
  const cloud = profile({ dataUpdatedAt: '2026-07-16T03:00:00.000Z' })
  assert.equal(getProfileUpdatedAt(local), '2026-07-16T04:00:00.000Z')
  assert.equal(selectNewestUserProfile(local, cloud).source, 'local')
})

test('a profile from another owner is never reconciled into the active account', () => {
  const local = profile({ id: 'user-2', dataUpdatedAt: '2026-07-16T05:00:00.000Z' })
  const cloud = profile({ id: 'user-1', dataUpdatedAt: '2026-07-16T03:00:00.000Z' })
  assert.equal(selectNewestUserProfile(local, cloud).source, 'cloud')
})
test('missing cloud data uploads the matching local profile instead of creating a blank one', async () => {
  const writes = []
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
      upsert: async (payload) => {
        writes.push(payload)
        return { error: null }
      },
    }),
  }
  const local = profile({
    dataUpdatedAt: '2026-07-16T04:00:00.000Z',
    progress: { totalQuestionsAnswered: 18 },
  })
  const resolved = await fetchOrCreateCloudUser(
    client,
    { id: 'user-1', email: 'learner@example.com' },
    'Learner',
    local,
  )
  assert.equal(resolved.source, 'local')
  assert.equal(resolved.user.progress.totalQuestionsAnswered, 18)
  assert.equal(writes[0].app_data.progress.totalQuestionsAnswered, 18)
})

test('existing newer cloud data remains authoritative during reconciliation', async () => {
  let writes = 0
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              app_data: profile({ progress: { totalQuestionsAnswered: 20 } }),
              updated_at: '2026-07-16T05:00:00.000Z',
            },
            error: null,
          }),
        }),
      }),
      upsert: async () => {
        writes += 1
        return { error: null }
      },
    }),
  }
  const local = profile({
    dataUpdatedAt: '2026-07-16T04:00:00.000Z',
    progress: { totalQuestionsAnswered: 18 },
  })
  const resolved = await fetchOrCreateCloudUser(
    client,
    { id: 'user-1', email: 'learner@example.com' },
    'Learner',
    local,
  )
  assert.equal(resolved.source, 'cloud')
  assert.equal(resolved.user.progress.totalQuestionsAnswered, 20)
  assert.equal(writes, 0)
})
test('invalid profile timestamps are ignored in favor of valid activity dates', () => {
  const legacy = profile({
    dataUpdatedAt: 'not-a-date',
    favorites: [{ questionId: 'p5-003', addedAt: '2026-07-16T06:00:00.000Z' }],
  })
  assert.equal(getProfileUpdatedAt(legacy), '2026-07-16T06:00:00.000Z')
})

test('missing cloud data never uploads a cached profile owned by another account', async () => {
  const writes = []
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
      upsert: async (payload) => {
        writes.push(payload)
        return { error: null }
      },
    }),
  }
  const resolved = await fetchOrCreateCloudUser(
    client,
    { id: 'user-1', email: 'learner@example.com' },
    'Learner',
    profile({ id: 'user-2', favorites: [{ questionId: 'private-other-user' }] }),
    new Date('2026-07-16T06:00:00.000Z'),
  )
  assert.equal(resolved.source, 'created')
  assert.deepEqual(writes[0].app_data.favorites, [])
})
