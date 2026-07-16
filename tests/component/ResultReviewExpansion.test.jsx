import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import ResultReviewList from '../../src/components/explanations/ResultReviewList.jsx'

const question = (id) => ({
  id, part: 5, question: `${id} -------.`, category: 'word_form', tags: [],
  choices: { A: 'clear', B: 'clearly', C: 'clarity', D: 'cleared' },
  correctAnswer: 'A', explanation: 'A is correct; B, C, and D do not fit.',
})

test('large result reviews initially expand only the first visible item', async () => {
  const outcomes = ['one', 'two'].map((id) => ({
    question: question(id), questionId: id, userAnswer: 'B', correctAnswer: 'A', isCorrect: false, status: 'incorrect',
  }))
  const user = userEvent.setup()
  render(<ResultReviewList outcomes={outcomes} />)

  expect(screen.getAllByTestId('explanation-panel')).toHaveLength(1)
  await user.click(screen.getByRole('button', { name: '全部展開' }))
  expect(screen.getAllByTestId('explanation-panel')).toHaveLength(2)
})
