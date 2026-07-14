import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import VisualAsset from '../../src/components/visuals/VisualAsset.jsx'

describe('VisualAsset', () => {
  test('lazy-loads non-critical art with fixed dimensions and a placeholder', () => {
    render(<VisualAsset name="practice" />)
    const image = screen.getByRole('img', { name: '商務文件閱讀與題目練習' })
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(image).toHaveAttribute('decoding', 'async')
    expect(image).toHaveAttribute('width', '320')
    expect(image).toHaveAttribute('height', '240')
    expect(screen.getByTestId('visual-asset')).toHaveAttribute('data-asset-state', 'loading')

    fireEvent.load(image)
    expect(screen.getByTestId('visual-asset')).toHaveAttribute('data-asset-state', 'loaded')
  })

  test('loads the first-screen hero eagerly at high priority', () => {
    render(<VisualAsset name="hero" />)
    const image = screen.getByRole('img', { name: 'TOEIC Sprint 學習進度插圖' })
    expect(image).toHaveAttribute('loading', 'eager')
    expect(image).toHaveAttribute('fetchpriority', 'high')
  })

  test('replaces a failed image with the inline visual fallback', () => {
    const { container } = render(<VisualAsset name="review" />)
    fireEvent.error(container.querySelector('img'))
    expect(container.querySelector('[data-testid="visual-asset"]')).toHaveAttribute('data-asset-state', 'error')
    expect(container.querySelector('[data-visual="review"]')).toBeInTheDocument()
  })
})
