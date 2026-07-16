import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import DocumentRenderer from '../../src/components/documents/DocumentRenderer.jsx'

afterEach(cleanup)

describe('DocumentRenderer UX boundaries', () => {
  test('table documents include a mobile horizontal-scroll hint', () => {
    render(
      <DocumentRenderer
        passage="Suite comparison."
        document={{
          type: 'table_chart', title: 'Available office suites',
          columns: ['Suite', 'Area'], rows: [['402', '120 m²'], ['900', '350 m²']],
        }}
      />,
    )

    expect(screen.getByText('左右滑動查看完整表格')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Available office suites' })).toBeVisible()
  })

  test('evidence mode removes the compact inner clipping boundary', () => {
    render(
      <DocumentRenderer
        passage="The workshop begins at 9:30 A.M. in Room 401."
        document={{ type: 'email', title: 'Training update' }}
        compact
        highlightTerms={['begins at 9:30 A.M.']}
      />,
    )

    expect(screen.getByTestId('business-document')).toHaveClass('document-evidence-view')
    expect(screen.getByText('begins at 9:30 A.M.', { selector: 'mark' })).toBeVisible()
  })
})
