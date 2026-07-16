import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import Home from '../../src/pages/Home.jsx'
import { createMiniMockDraft, saveMiniMockDraft } from '../../src/services/miniMockDraftRepository.js'
import { savePracticeDraft } from '../../src/services/practiceDraftRepository.js'

beforeEach(() => localStorage.clear())

describe('Home unfinished practice cards', () => {
  test('resumes practice directly with type, progress, and last activity time', async () => {
    savePracticeDraft({
      id: 'practice-home', version: 2, ownerId: 'guest-local', status: 'active',
      config: { type: 'part5', mode: 'quick', count: 10, requestedCount: 10 },
      questionIds: Array.from({ length: 10 }, (_, index) => `q-${index}`),
      answers: { 'q-0': 'A', 'q-1': 'B' }, markedQuestionIds: [], currentIndex: 2,
      startedAt: '2026-07-16T01:00:00.000Z', updatedAt: '2026-07-16T01:20:00.000Z',
    })
    const setCurrentPage = vi.fn()
    const setPracticeFilter = vi.fn()
    const user = userEvent.setup()

    render(<Home currentUser={{ isGuest: true }} setCurrentPage={setCurrentPage} setPracticeFilter={setPracticeFilter} />)

    expect(screen.getByRole('heading', { name: '繼續未完成練習' })).toBeInTheDocument()
    expect(screen.getByText('Part 5 快速練習')).toBeInTheDocument()
    expect(screen.getByText('已作答 2 / 10 題')).toBeInTheDocument()
    expect(screen.getByText(/最後作答/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /繼續 Part 5 快速練習/ }))
    expect(setPracticeFilter).toHaveBeenCalledWith(expect.objectContaining({ type: 'part5', count: 10 }))
    expect(setCurrentPage).toHaveBeenCalledWith('question-practice')
  })

  test('shows a separate Mini Mock resume action', async () => {
    const draft = createMiniMockDraft(Array.from({ length: 20 }, (_, index) => `mock-${index}`), 'guest-local', new Date('2026-07-16T01:00:00.000Z'))
    saveMiniMockDraft({ ...draft, answers: { 'mock-0': 'C' } })
    const setCurrentPage = vi.fn()
    const user = userEvent.setup()

    render(<Home currentUser={{ isGuest: true }} setCurrentPage={setCurrentPage} setPracticeFilter={vi.fn()} />)

    expect(screen.getByText('20 題文字 Mini Mock')).toBeInTheDocument()
    expect(screen.getByText('已作答 1 / 20 題')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /繼續 20 題文字 Mini Mock/ }))
    expect(setCurrentPage).toHaveBeenCalledWith('mock-test-active')
  })
})
