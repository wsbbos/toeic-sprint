import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const authUser = { id: 'user-1', email: 'learner@example.com' }
  return {
    authUser,
    client: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: authUser } }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
    },
    pendingSaves: [],
    saveCloudUser: vi.fn(),
    syncPublicStats: vi.fn().mockResolvedValue({ skipped: false }),
    fetchOrCreateCloudUser: vi.fn(),
  }
})

vi.mock('../../src/lib/supabase.js', () => ({ isSupabaseConfigured: true, supabase: mocks.client }))
vi.mock('../../src/services/cloudUserService.js', async (importOriginal) => ({
  ...await importOriginal(),
  fetchOrCreateCloudUser: mocks.fetchOrCreateCloudUser,
  saveCloudUser: mocks.saveCloudUser,
  syncPublicStats: mocks.syncPublicStats,
  upsertProfile: vi.fn().mockResolvedValue({ error: null }),
}))

import { useAppController } from '../../src/hooks/useAppController.js'

beforeEach(() => {
  localStorage.clear()
  mocks.pendingSaves.length = 0
  mocks.saveCloudUser.mockReset()
  mocks.saveCloudUser.mockImplementation((_client, user) => new Promise((resolve) => {
    mocks.pendingSaves.push({ user: structuredClone(user), resolve })
  }))
  mocks.fetchOrCreateCloudUser.mockResolvedValue({
    created: false,
    user: { id: mocks.authUser.id, email: mocks.authUser.email, username: 'Learner', favorites: [] },
  })
})

test('cloud writes are serialized so an older profile cannot overwrite newer progress', async () => {
  const { result } = renderHook(() => useAppController())
  await waitFor(() => expect(result.current.currentUser?.id).toBe(mocks.authUser.id))

  let firstUpdate
  let secondUpdate
  act(() => {
    firstUpdate = result.current.actions.onToggleFavorite({ id: 'p5-001', part: 5, question: 'First' })
    secondUpdate = result.current.actions.onToggleFavorite({ id: 'p5-002', part: 5, question: 'Second' })
  })

  await waitFor(() => expect(mocks.pendingSaves).toHaveLength(1))
  expect(mocks.pendingSaves[0].user.favorites.map((item) => item.questionId)).toEqual(['p5-001'])

  mocks.pendingSaves[0].resolve()
  await waitFor(() => expect(mocks.pendingSaves).toHaveLength(2))
  expect(mocks.pendingSaves[1].user.favorites.map((item) => item.questionId)).toEqual(['p5-001', 'p5-002'])

  mocks.pendingSaves[1].resolve()
  await act(async () => Promise.all([firstUpdate, secondUpdate]))
  expect(result.current.syncStatus).toBe('synced')
})