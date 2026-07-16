import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import ErrorBoundary from '../../src/components/ErrorBoundary.jsx'

function BrokenView() {
  throw new Error('private-token-and-database-detail')
}

test('runtime fallback never exposes the captured exception to the user', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<ErrorBoundary><BrokenView /></ErrorBoundary>)
  expect(screen.getByRole('alert')).toHaveTextContent('應用程式暫時發生錯誤')
  expect(screen.queryByText(/private-token-and-database-detail/)).not.toBeInTheDocument()
})
