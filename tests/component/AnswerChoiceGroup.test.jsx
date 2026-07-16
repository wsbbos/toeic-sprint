import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import AnswerChoiceGroup from '../../src/components/AnswerChoiceGroup.jsx'

const choices = { A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta' }

function Harness({ disabled = false, onSelect = vi.fn() }) {
  const [selected, setSelected] = useState('')
  return (
    <AnswerChoiceGroup
      choices={choices}
      selectedChoice={selected}
      disabled={disabled}
      onSelect={(choice) => {
        setSelected(choice)
        onSelect(choice)
      }}
    />
  )
}

test('arrow, Home and End keys move focus and select within the answer group', async () => {
  const onSelect = vi.fn()
  const user = userEvent.setup()
  render(<Harness onSelect={onSelect} />)

  const alpha = screen.getByRole('radio', { name: /Alpha/ })
  alpha.focus()
  await user.keyboard('{ArrowRight}')
  const bravo = screen.getByRole('radio', { name: /Bravo/ })
  expect(bravo).toHaveFocus()
  expect(bravo).toHaveAttribute('aria-checked', 'true')

  await user.keyboard('{End}')
  expect(screen.getByRole('radio', { name: /Delta/ })).toHaveFocus()
  await user.keyboard('{Home}')
  expect(alpha).toHaveFocus()
  expect(onSelect).toHaveBeenNthCalledWith(1, 'B')
  expect(onSelect).toHaveBeenNthCalledWith(2, 'D')
  expect(onSelect).toHaveBeenNthCalledWith(3, 'A')
})

test('disabled answer groups cannot change selection from the keyboard', async () => {
  const onSelect = vi.fn()
  const user = userEvent.setup()
  render(<Harness disabled onSelect={onSelect} />)
  await user.tab()
  await user.keyboard('{ArrowDown}')
  expect(onSelect).not.toHaveBeenCalled()
})
