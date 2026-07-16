import { render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

vi.mock('../../src/lib/supabase.js', () => ({ isSupabaseConfigured: false, supabase: null }))

import Friends from '../../src/pages/Friends.jsx'

beforeEach(() => {
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})

test('guest mode shows an honest sign-in requirement without touching Supabase', () => {
  render(<Friends currentUser={{ id: 'guest-local', isGuest: true, username: '訪客學員' }} />)
  expect(screen.getByRole('heading', { name: '登入後使用讀書小隊' })).toBeInTheDocument()
  expect(screen.queryByText('雲端連線正常')).not.toBeInTheDocument()
})