import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

vi.mock('../../src/lib/supabase.js', () => ({ isSupabaseConfigured: false, supabase: null }))

import { useAppController } from '../../src/hooks/useAppController.js'

beforeEach(() => localStorage.clear())

test('rapid local updates compose from the latest profile without losing favorites', async () => {
  const { result } = renderHook(() => useAppController())
  act(() => result.current.actions.onGuestLogin())
  await waitFor(() => expect(result.current.currentUser?.isGuest).toBe(true))

  const first = { id: 'p5-001', part: 5, question: 'First question', category: 'word_form' }
  const second = { id: 'p5-002', part: 5, question: 'Second question', category: 'verb_tense' }

  await act(async () => {
    await Promise.all([
      result.current.actions.onToggleFavorite(first),
      result.current.actions.onToggleFavorite(second),
    ])
  })

  expect(result.current.currentUser.favorites.map((item) => item.questionId)).toEqual(['p5-001', 'p5-002'])
})
