import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import QuestionPractice from '../../src/pages/QuestionPractice.jsx'
import { savePracticeDraft } from '../../src/services/practiceDraftRepository.js'

const questions = [1, 2].map((number) => ({ id: `q-${number}`, part: 5, category: 'word_form', difficulty: 'easy', question: `Question ${number} -------.`, choices: { A: 'correct', B: 'wrong', C: 'other', D: 'none' }, correctAnswer: 'A', answer: 'A', explanation: 'A is correct.' }))

beforeEach(() => { localStorage.clear(); vi.spyOn(window, 'confirm').mockReturnValue(true) })
afterEach(() => vi.restoreAllMocks())

test('answers, navigates, submits once, and renders result analysis', async () => {
  const onAnswerSubmitted = vi.fn()
  render(<QuestionPractice currentUser={{ favorites: [] }} setCurrentPage={vi.fn()} practiceFilter={{ type: 'part5', count: 2 }} onAnswerSubmitted={onAnswerSubmitted} questions={questions} />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('radio', { name: /correct/ }))
  await user.click(screen.getByRole('button', { name: '下一題' }))
  await user.click(screen.getByRole('radio', { name: /wrong/ }))
  await user.click(screen.getByRole('button', { name: '確認交卷' }))
  expect(await screen.findByRole('heading', { name: '練習結果' })).toBeInTheDocument()
  expect(onAnswerSubmitted).toHaveBeenCalledTimes(2)
})

test('does not resume a draft created for a different requested question count', () => {
  savePracticeDraft({
    id: 'one-question-draft',
    version: 2,
    ownerId: 'guest-local',
    status: 'active',
    config: { type: 'part5', count: 1, requestedCount: 1 },
    questionIds: ['q-1'],
    answers: {},
    markedQuestionIds: [],
    currentIndex: 0,
    startedAt: '2026-07-16T01:00:00.000Z',
    updatedAt: '2026-07-16T01:00:00.000Z',
  })

  render(<QuestionPractice currentUser={{ isGuest: true, favorites: [] }} setCurrentPage={vi.fn()} practiceFilter={{ type: 'part5', count: 2 }} questions={questions} />)

  expect(screen.getByText('1 / 2')).toBeInTheDocument()
})
test('practice drafts report storage failures to the application shell', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError')
  })
  const onLocalPersistenceResult = vi.fn()

  render(
    <QuestionPractice
      currentUser={{ isGuest: true, favorites: [] }}
      setCurrentPage={vi.fn()}
      practiceFilter={{ type: 'part5', count: 2 }}
      questions={questions}
      onLocalPersistenceResult={onLocalPersistenceResult}
    />,
  )

  await waitFor(() => expect(onLocalPersistenceResult).toHaveBeenCalledWith(false))
})
