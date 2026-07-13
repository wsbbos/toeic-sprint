import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, test, expect, beforeEach } from 'vitest'
import QuestionPractice from '../../src/pages/QuestionPractice.jsx'

const questions = [1, 2].map((number) => ({ id: `q-${number}`, part: 5, category: 'word_form', difficulty: 'easy', question: `Question ${number} -------.`, choices: { A: 'correct', B: 'wrong', C: 'other', D: 'none' }, correctAnswer: 'A', answer: 'A', explanation: 'A is correct.' }))

beforeEach(() => { localStorage.clear(); vi.spyOn(window, 'confirm').mockReturnValue(true) })

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
