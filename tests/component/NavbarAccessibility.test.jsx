import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import Navbar from '../../src/components/Navbar.jsx'

const props = {
  currentPage: 'home',
  setCurrentPage: vi.fn(),
  currentUser: { username: 'Learner', goals: {}, progress: {} },
  onLogout: vi.fn(),
}

test('mobile navigation behaves as a focus-managed modal dialog', async () => {
  const user = userEvent.setup()
  render(<Navbar {...props} />)
  const trigger = screen.getByRole('button', { name: '開啟選單' })

  await user.click(trigger)
  const dialog = screen.getByRole('dialog', { name: '主選單' })
  expect(dialog).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '關閉選單' })).toHaveFocus()

  await user.tab({ shift: true })
  expect(screen.getByRole('link', { name: /登出/ })).toHaveFocus()

  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: '主選單' })).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})
