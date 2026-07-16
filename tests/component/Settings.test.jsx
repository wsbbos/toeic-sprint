import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import Settings from '../../src/pages/Settings.jsx'

const guest = {
  id: 'guest-local',
  isGuest: true,
  username: '訪客學員',
  goals: {},
}

afterEach(() => { cleanup(); vi.restoreAllMocks() })

test('guest settings report local persistence without claiming cloud sync', () => {
  render(<Settings currentUser={guest} onSaveGoals={vi.fn()} onClearData={vi.fn()} onDeleteAccount={vi.fn()} onManualSync={vi.fn()} />)
  expect(screen.getByText('💾 已儲存於此裝置')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /重新同步資料/ })).not.toBeInTheDocument()
})

test('guest can clear local learning data with two confirmations and no email error', async () => {
  const onClearData = vi.fn().mockResolvedValue(undefined)
  vi.spyOn(window, 'prompt').mockReturnValue('清除')
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.spyOn(window, 'alert').mockImplementation(() => {})
  render(<Settings currentUser={guest} onSaveGoals={vi.fn()} onClearData={onClearData} onDeleteAccount={vi.fn()} />)

  await userEvent.click(screen.getByRole('button', { name: '🧹 清空訪客紀錄' }))
  expect(onClearData).toHaveBeenCalledTimes(1)
  expect(window.prompt).toHaveBeenCalledTimes(1)
  expect(window.confirm).toHaveBeenCalledTimes(1)
})
test('sync failures show recovery guidance without backend diagnostics', () => {
  render(<Settings
    currentUser={{ id: 'user-1', email: 'learner@example.com', username: 'Learner', goals: {} }}
    onSaveGoals={vi.fn()}
    onClearData={vi.fn()}
    onDeleteAccount={vi.fn()}
    onManualSync={vi.fn()}
    syncStatus="failed"
    syncError={{ message: 'private SQL detail', code: '42501', details: 'row policy internals' }}
  />)
  expect(screen.getByRole('alert')).toHaveTextContent('本機資料已保留')
  expect(screen.queryByText(/private SQL|42501|row policy/)).not.toBeInTheDocument()
})
