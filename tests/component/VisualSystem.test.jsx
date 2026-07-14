import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import LearningVisual from '../../src/components/visuals/LearningVisual.jsx'
import { LEARNING_VISUAL_VARIANTS } from '../../src/components/visuals/visualConfig.js'
import EmptyLearningState from '../../src/components/visuals/EmptyLearningState.jsx'

describe('learning visual system', () => {
  test('renders every original illustration variant with an accessible label', () => {
    const { container } = render(
      <div>{LEARNING_VISUAL_VARIANTS.map((variant) => <LearningVisual key={variant} variant={variant} />)}</div>,
    )

    expect(container.querySelectorAll('svg[data-visual]')).toHaveLength(LEARNING_VISUAL_VARIANTS.length)
    for (const variant of LEARNING_VISUAL_VARIANTS) {
      expect(container.querySelector(`[data-visual="${variant}"]`)).toHaveAttribute('role', 'img')
    }
  })

  test('can be decorative without adding noise to the accessibility tree', () => {
    const { container } = render(<LearningVisual variant="practice" decorative />)
    expect(container.querySelector('[role="img"]')).not.toBeInTheDocument()
  })

  test('empty state provides a real recovery action', async () => {
    const onAction = vi.fn()
    render(
      <EmptyLearningState
        variant="review"
        title="尚無錯題"
        description="完成練習後會顯示在這裡。"
        actionLabel="開始練習"
        onAction={onAction}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: '開始練習' }))
    expect(onAction).toHaveBeenCalledOnce()
    expect(screen.getByTestId('learning-empty-state')).toHaveAttribute('data-empty-variant', 'review')
  })
})
