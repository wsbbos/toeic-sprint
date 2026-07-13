import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, test, expect } from 'vitest'

vi.mock('../../src/lib/supabase.js', () => ({
  supabase: { auth: {
    signInWithPassword: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1', email: 'learner@example.com' } } }, error: null }),
    signUp: vi.fn()
  } }
}))
import Login from '../../src/pages/Login.jsx'

test('valid credentials complete the Supabase login callback', async () => {
  const onLoginSuccess = vi.fn()
  const { container } = render(<Login onLoginSuccess={onLoginSuccess} />)
  const form = container.querySelector('form')
  const user = userEvent.setup()
  await user.type(form.querySelector('input[type="email"]'), 'learner@example.com')
  await user.type(form.querySelector('input[type="password"]'), 'secret12')
  await user.click(form.querySelector('button[type="submit"]'))
  await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(expect.objectContaining({ user: expect.objectContaining({ id: 'user-1' }) }), null))
})
