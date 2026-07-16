import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createStudyGroup: vi.fn(),
  fetchStudyGroupLeaderboard: vi.fn(),
  fetchStudyGroups: vi.fn(),
  generateInviteCode: vi.fn(() => 'ABC123'),
  joinStudyGroup: vi.fn(),
}))

vi.mock('../../src/lib/supabase.js', () => ({ isSupabaseConfigured: true, supabase: {} }))
vi.mock('../../src/services/studyGroupService.js', async (importOriginal) => ({
  ...await importOriginal(),
  ...mocks,
}))

import Friends from '../../src/pages/Friends.jsx'

const currentUser = {
  id: 'user-1',
  email: 'learner@example.com',
  username: 'Learner',
  progress: {},
  goals: {},
  dailyRecords: [],
  mockTestHistory: [],
}

beforeEach(() => {
  vi.spyOn(window, 'alert').mockImplementation(() => {})
  mocks.fetchStudyGroups.mockReset().mockResolvedValue([])
  mocks.fetchStudyGroupLeaderboard.mockReset().mockResolvedValue([])
  mocks.createStudyGroup.mockReset().mockResolvedValue({ status: 'created', groupId: 'group-1', inviteCode: 'ABC123' })
  mocks.joinStudyGroup.mockReset()
})

test('cloud load failures render a retryable inline error', async () => {
  mocks.fetchStudyGroups.mockRejectedValueOnce(new Error('backend detail'))
  render(<Friends currentUser={currentUser} />)

  expect(await screen.findByRole('alert')).toHaveTextContent('雲端小隊暫時無法使用')
  fireEvent.click(screen.getByRole('button', { name: '重新載入' }))
  await waitFor(() => expect(mocks.fetchStudyGroups).toHaveBeenCalledTimes(2))
})

test('study-group forms have labels and create through the service', async () => {
  render(<Friends currentUser={currentUser} />)
  const user = userEvent.setup()
  await user.type(screen.getByRole('textbox', { name: '小隊名稱' }), 'Sprint Team')
  await user.click(screen.getByRole('button', { name: '建立小隊' }))

  await waitFor(() => expect(mocks.createStudyGroup).toHaveBeenCalledWith({}, 'Sprint Team', 'ABC123'))
  expect(await screen.findByText('ABC123')).toBeInTheDocument()
})

test('joined group cards are keyboard-focusable controls', async () => {
  mocks.fetchStudyGroups.mockResolvedValue([{
    id: 'group-1',
    name: 'Sprint Team',
    invite_code: 'ABC123',
    owner_id: 'user-1',
    myRole: 'owner',
    memberCount: 1,
  }])
  render(<Friends currentUser={currentUser} />)

  expect(await screen.findByRole('button', { name: '選擇小隊 Sprint Team' })).toHaveAttribute('tabindex', '0')
})