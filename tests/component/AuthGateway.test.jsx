import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, test, expect } from 'vitest'

vi.mock('../../src/lib/supabase.js', () => ({ isSupabaseConfigured: false, supabase: null }))
import AuthGateway from '../../src/components/AuthGateway.jsx'

test('guest entry remains available when Supabase is not configured', async () => {
  const onGuestLogin = vi.fn()
  render(<AuthGateway onGuestLogin={onGuestLogin} onLoginSuccess={vi.fn()} />)
  await userEvent.click(screen.getByTestId('guest-entry'))
  expect(onGuestLogin).toHaveBeenCalledOnce()
  expect(screen.getByRole('status')).toBeInTheDocument()
})
