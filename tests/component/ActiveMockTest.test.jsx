import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import ActiveMockTest from '../../src/pages/ActiveMockTest.jsx'

const questions = [
  { id: 'p5-1', part: 5, question: 'The report is -------.', choices: { A: 'ready', B: 'read', C: 'readily', D: 'reader' }, correctAnswer: 'A', explanation: 'A is correct.', category: 'word_form', difficulty: 'easy', tags: ['grammar'] },
  { id: 'p7-1', part: 7, question: 'When is the meeting?', passage: 'The meeting begins at 9 a.m.', choices: { A: 'At 8 a.m.', B: 'At 9 a.m.', C: 'At noon.', D: 'Tomorrow.' }, correctAnswer: 'B', explanation: 'B is correct.', category: 'detail', difficulty: 'easy', tags: ['reading'] },
]

beforeEach(() => {
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
