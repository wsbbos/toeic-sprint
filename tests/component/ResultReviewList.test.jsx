import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'

import ResultReviewList from '../../src/components/explanations/ResultReviewList.jsx'

const makeQuestion = (id) => ({
  id, part: 5, category: 'word_form', tags: ['word_form'],
  question: `${id} ------- proposal.`,
  choices: { A: 'clear', B: 'clearly', C: 'clarity', D: 'cleared' },
  correctAnswer: 'A', explanation: 'A is the adjective required before proposal.',
})

const outcomes = [
  { question: makeQuestion('correct'), questionId: 'correct', userAnswer: 'A', correctAnswer: 'A', isCorrect: true, status: 'correct' },
  { question: makeQuestion('incorrect'), questionId: 'incorrect', userAnswer: 'B', correctAnswer: 'A', isCorrect: false, status: 'incorrect' },
  { question: makeQuestion('unanswered'), questionId: 'unanswered', userAnswer: '', correctAnswer: 'A', isCorrect: false, status: 'unanswered' },
]

describe('ResultReviewList', () => {
  test('defaults to mistakes and keeps unanswered items in a separate filter', async () => {
    const user = userEvent.setup()
    render(<ResultReviewList outcomes={outcomes} />)

    expect(screen.getByRole('button', { name: '錯題 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: /incorrect ------- proposal\./ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /unanswered ------- proposal\./ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '未作答 1' }))
    expect(screen.getByRole('heading', { name: /unanswered ------- proposal\./ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /incorrect ------- proposal\./ })).not.toBeInTheDocument()
  })

  test('supports per-question collapse and expand-all controls', async () => {
    const user = userEvent.setup()
    render(<ResultReviewList outcomes={outcomes} />)

    const item = screen.getByTestId('result-review-incorrect')
    const toggle = within(item).getByRole('button', { name: /收合第 2 題解析/ })
    expect(within(item).getByTestId('explanation-panel')).toBeInTheDocument()
    await user.click(toggle)
    expect(within(item).queryByTestId('explanation-panel')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '全部展開' }))
    expect(within(item).getByTestId('explanation-panel')).toBeInTheDocument()
  })
})
