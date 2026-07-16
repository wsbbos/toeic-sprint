import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import ActiveMockTest from '../../src/pages/ActiveMockTest.jsx'
import { createMiniMockDraft, saveMiniMockDraft } from '../../src/services/miniMockDraftRepository.js'

const questions = [
  { id: 'p5-1', part: 5, question: 'The report is -------.', choices: { A: 'ready', B: 'read', C: 'readily', D: 'reader' }, correctAnswer: 'A', explanation: 'A is correct.', category: 'word_form', difficulty: 'easy', tags: ['grammar'] },
  { id: 'p7-1', part: 7, question: 'When is the meeting?', passage: 'The meeting begins at 9 a.m.', choices: { A: 'At 8 a.m.', B: 'At 9 a.m.', C: 'At noon.', D: 'Tomorrow.' }, correctAnswer: 'B', explanation: 'B is correct.', category: 'detail', difficulty: 'easy', tags: ['reading'] },
]

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})

afterEach(() => vi.restoreAllMocks())

test('Mini Mock submits the latest answers only once', () => {
  const onMockExamSubmitted = vi.fn()
  render(<ActiveMockTest questions={questions} setCurrentPage={vi.fn()} onMockExamSubmitted={onMockExamSubmitted} />)

  expect(screen.getByText('第 1 / 2 題')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: /ready/ }))
  const submit = screen.getByRole('button', { name: /立即交卷/ })
  fireEvent.click(submit)
  fireEvent.click(submit)

  expect(onMockExamSubmitted).toHaveBeenCalledTimes(1)
  expect(onMockExamSubmitted.mock.calls[0][0].questionOutcomes[0]).toMatchObject({
    questionId: 'p5-1',
    userAnswer: 'A',
    isCorrect: true,
  })
})

test('Mini Mock shows a recoverable empty state when the bank is unavailable', () => {
  const setCurrentPage = vi.fn()
  render(<ActiveMockTest questions={[]} setCurrentPage={setCurrentPage} onMockExamSubmitted={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: '返回模擬考中心' }))
  expect(setCurrentPage).toHaveBeenCalledWith('mock-test')
})

test('Mini Mock restores the current question and answers after remount', () => {
  const props = {
    currentUser: { id: 'guest-local', isGuest: true },
    questions,
    setCurrentPage: vi.fn(),
    onMockExamSubmitted: vi.fn(),
  }
  const firstRender = render(<ActiveMockTest {...props} />)
  fireEvent.click(screen.getByRole('radio', { name: /ready/ }))
  fireEvent.click(screen.getByRole('button', { name: '前往第 2 題' }))
  expect(screen.getByText('第 2 / 2 題')).toBeInTheDocument()
  firstRender.unmount()

  render(<ActiveMockTest {...props} />)
  expect(screen.getByText('第 2 / 2 題')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '前往第 1 題' }))
  expect(screen.getByRole('radio', { name: /ready/ })).toHaveAttribute('aria-checked', 'true')
})
test('an expired restored Mini Mock auto-submits exactly once', async () => {
  const ownerId = 'user-expired'
  const startedAt = new Date(Date.now() - 5_000)
  saveMiniMockDraft(createMiniMockDraft(
    questions.map((question) => question.id),
    ownerId,
    startedAt,
    1,
  ), undefined, ownerId)
  const onMockExamSubmitted = vi.fn()
  const setCurrentPage = vi.fn()

  render(<ActiveMockTest currentUser={{ id: ownerId }} questions={questions} setCurrentPage={setCurrentPage} onMockExamSubmitted={onMockExamSubmitted} />)

  await waitFor(() => expect(onMockExamSubmitted).toHaveBeenCalledTimes(1))
  expect(setCurrentPage).toHaveBeenCalledWith('result')
})
test('Mini Mock drafts report storage failures to the application shell', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError')
  })
  const onLocalPersistenceResult = vi.fn()

  render(
    <ActiveMockTest
      currentUser={{ id: 'guest-local', isGuest: true }}
      questions={questions}
      setCurrentPage={vi.fn()}
      onMockExamSubmitted={vi.fn()}
      onLocalPersistenceResult={onLocalPersistenceResult}
    />,
  )

  await waitFor(() => expect(onLocalPersistenceResult).toHaveBeenCalledWith(false))
})
