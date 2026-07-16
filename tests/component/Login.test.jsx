import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
}))

vi.mock('../../src/lib/supabase.js', () => ({
  supabase: { auth: mocks },
}))
import Login from '../../src/pages/Login.jsx'

beforeEach(() => {
  mocks.signInWithPassword.mockReset().mockResolvedValue({
    data: { session: { user: { id: 'user-1', email: 'learner@example.com' } } },
    error: null,
  })
  mocks.signUp.mockReset()
})

test('valid labeled credentials complete the Supabase login callback', async () => {
  const onLoginSuccess = vi.fn()
  render(<Login onLoginSuccess={onLoginSuccess} />)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('電子信箱 Email'), 'learner@example.com')
  await user.type(screen.getByLabelText('密碼 Password'), 'secret12')
  await user.click(screen.getByRole('button', { name: '登入帳號 ➔' }))
  await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(
    expect.objectContaining({ user: expect.objectContaining({ id: 'user-1' }) }),
    null,
  ))
})

test('authentication failures never render or log raw backend details', async () => {
  mocks.signInWithPassword.mockResolvedValueOnce({
    data: null,
    error: { message: 'private SQL detail at https://secret-project.supabase.co' },
  })
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<Login onLoginSuccess={vi.fn()} />)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('電子信箱 Email'), 'learner@example.com')
  await user.type(screen.getByLabelText('密碼 Password'), 'secret12')
  await user.click(screen.getByRole('button', { name: '登入帳號 ➔' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('登入失敗，請確認帳號狀態或稍後再試')
  expect(screen.queryByText(/private SQL|secret-project/)).not.toBeInTheDocument()
  expect(consoleError).not.toHaveBeenCalled()
})
