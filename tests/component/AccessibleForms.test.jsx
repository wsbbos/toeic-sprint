import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import Onboarding from '../../src/pages/Onboarding.jsx'
import PracticeCenter from '../../src/pages/PracticeCenter.jsx'
import Vocabulary from '../../src/pages/Vocabulary.jsx'

test('onboarding controls expose stable accessible labels', () => {
  render(<Onboarding currentUser={{ username: 'Learner' }} onSaveGoals={vi.fn()} />)

  expect(screen.getByLabelText(/目標 TOEIC 分數/)).toHaveAttribute('id', 'onboarding-target-score')
  expect(screen.getByLabelText(/預計考試日期/)).toHaveAttribute('id', 'onboarding-exam-date')
  expect(screen.getByLabelText(/每日單字學習目標/)).toBeInTheDocument()
  expect(screen.getByLabelText(/每日題目練習目標/)).toBeInTheDocument()
  expect(screen.getByLabelText(/每日學習時間目標/)).toBeInTheDocument()
  expect(screen.getByLabelText(/每週模擬測驗目標/)).toBeInTheDocument()
})

test('practice configuration is keyboard and screen-reader addressable', () => {
  render(<PracticeCenter setCurrentPage={vi.fn()} setPracticeFilter={vi.fn()} />)

  expect(screen.getByLabelText('題數')).toHaveAttribute('type', 'number')
  expect(screen.getByLabelText('分類')).toBeInTheDocument()
  expect(screen.getByLabelText('難度')).toBeInTheDocument()
  expect(screen.getByLabelText('計時模式')).toHaveAttribute('type', 'checkbox')
})

test('vocabulary filters expose associated labels', () => {
  render(<Vocabulary currentUser={{ goals: {}, dailyRecords: [], vocabularyProgress: {} }} onWordStatusChanged={vi.fn()} vocabulary={[]} />)

  expect(screen.getByLabelText(/搜尋單字或中文/)).toHaveAttribute('id', 'vocabulary-search')
  expect(screen.getByLabelText(/商業分類篩選/)).toHaveAttribute('id', 'vocabulary-category')
  expect(screen.getByLabelText(/掌握度狀態篩選/)).toHaveAttribute('id', 'vocabulary-status')
})
