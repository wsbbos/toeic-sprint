import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import Home from '../../src/pages/Home.jsx'
import PracticeCenter from '../../src/pages/PracticeCenter.jsx'
import WrongBook from '../../src/pages/WrongBook.jsx'
import LearningInsightsPanel from '../../src/components/LearningInsightsPanel.jsx'

describe('visual content integration', () => {
  test('home and practice center use the shared brand illustrations', () => {
    const { rerender, container } = render(<Home currentUser={{}} setCurrentPage={vi.fn()} />)
    expect(container.querySelector('[data-visual="hero"]')).toBeInTheDocument()

    rerender(<PracticeCenter setCurrentPage={vi.fn()} setPracticeFilter={vi.fn()} />)
    expect(container.querySelector('[data-visual="practice"]')).toBeInTheDocument()
    expect(container.querySelector('[data-visual="reading"]')).toBeInTheDocument()
  })

  test('wrong book and insights explain empty review, favorite, and weakness states visually', () => {
    const user = { wrongBook: [], favorites: [], practiceHistory: [], dailyRecords: [] }
    const { rerender, container } = render(
      <WrongBook currentUser={user} onStartRetakeSession={vi.fn()} />,
    )
    expect(screen.getByTestId('learning-empty-state')).toHaveAttribute('data-empty-variant', 'review')

    rerender(
      <LearningInsightsPanel
        currentUser={user}
        setCurrentPage={vi.fn()}
        setPracticeFilter={vi.fn()}
        onStartRetakeSession={vi.fn()}
      />,
    )
    expect(container.querySelector('[data-visual="favorites"]')).toBeInTheDocument()
    expect(container.querySelector('[data-visual="weakness"]')).toBeInTheDocument()
  })
})
