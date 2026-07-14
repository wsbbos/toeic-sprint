import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import DocumentRenderer from '../../src/components/documents/DocumentRenderer.jsx'

afterEach(cleanup)

const requiredTypes = [
  'email', 'memo', 'notice', 'advertisement', 'schedule',
  'form', 'invoice', 'review', 'message_thread', 'table_chart',
]

describe('DocumentRenderer', () => {
  test.each(requiredTypes)('renders the %s template with a stable accessible boundary', (type) => {
    render(
      <DocumentRenderer
        passage="Fallback business document body."
        document={{
          type,
          title: `${type} example`,
          fields: { Department: 'Sales' },
          columns: ['Item', 'Status'],
          rows: [['Registration', 'Open']],
          messages: [{ sender: 'Alex', time: '09:30', body: 'Please review the update.' }],
          metrics: [{ label: 'Rating', value: '4.8/5' }],
        }}
      />,
    )

    const renderer = screen.getByTestId('business-document')
    expect(renderer).toHaveAttribute('data-document-type', type)
    expect(renderer).toHaveAccessibleName(`${type} example`)
  })

  test('renders real table semantics for table/chart documents', () => {
    render(
      <DocumentRenderer
        passage="Suite comparison."
        document={{
          type: 'table_chart',
          title: 'Available office suites',
          columns: ['Suite', 'Area'],
          rows: [['402', '120 m²'], ['900', '350 m²']],
        }}
      />,
    )

    expect(screen.getByRole('table', { name: 'Available office suites' })).toBeVisible()
    expect(screen.getByText('350 m²')).toBeVisible()
  })
})
