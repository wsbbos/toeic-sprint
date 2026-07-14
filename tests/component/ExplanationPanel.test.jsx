import { render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import ExplanationPanel from '../../src/components/explanations/ExplanationPanel.jsx'

describe('ExplanationPanel', () => {
  test('turns a Part 5 result into a sentence and answer comparison lesson', () => {
    const question = {
      id: 'part5-1',
      part: 5,
      category: 'word_form',
      tags: ['word-form'],
      question: 'The ------- proposal impressed the board.',
      choices: { A: 'innovate', B: 'innovation', C: 'innovative', D: 'innovatively' },
      correctAnswer: 'C',
      explanation: 'C 是形容詞，修飾名詞 proposal；其他選項的詞性不符合此位置。',
    }

    render(<ExplanationPanel question={question} userAnswer="B" index={0} />)

    expect(screen.getByRole('heading', { name: /第 1 題/ })).toBeInTheDocument()
    expect(screen.getByText('詞性')).toBeInTheDocument()
    expect(screen.getByTestId('sentence-blank')).toHaveTextContent('正確答案：innovative')
    const comparison = screen.getByRole('list', { name: '選項比較' })
    expect(within(comparison).getByText(/你的選擇/)).toBeInTheDocument()
    expect(within(comparison).getByText(/正確答案/)).toBeInTheDocument()
  })

  test('highlights the answer evidence inside a Part 7 business document', () => {
    const question = {
      id: 'part7-1',
      part: 7,
      passage: 'To: All Staff\nSubject: Training\n\nThe workshop begins at 9:30 A.M. in Room 401.',
      document: { type: 'email', title: 'Training update' },
      choices: { A: '8:30', B: '9:00', C: '9:30', D: '10:00' },
      correctAnswer: 'C',
      explanation: '文中寫道「begins at 9:30 A.M.」，所以選 C。',
    }

    render(<ExplanationPanel question={question} userAnswer="B" index={1} />)

    expect(screen.getByRole('heading', { name: /第 2 題/ })).toBeInTheDocument()
    expect(screen.getByText('答案依據')).toBeInTheDocument()
    expect(screen.getByText('begins at 9:30 A.M.', { selector: 'mark' })).toBeInTheDocument()
    expect(screen.getByTestId('business-document')).toHaveAttribute('data-document-type', 'email')
  })
})
