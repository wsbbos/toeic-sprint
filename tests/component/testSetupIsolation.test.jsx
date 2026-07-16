import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

test('renders a marker for the current test only', () => {
  render(<div>isolation marker</div>)
  expect(screen.getByText('isolation marker')).toBeInTheDocument()
})

test('starts with a clean document from the shared test setup', () => {
  expect(screen.queryByText('isolation marker')).not.toBeInTheDocument()
})
