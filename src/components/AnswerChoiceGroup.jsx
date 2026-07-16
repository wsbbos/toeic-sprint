import { useRef } from 'react'

const FORWARD_KEYS = new Set(['ArrowRight', 'ArrowDown'])
const BACKWARD_KEYS = new Set(['ArrowLeft', 'ArrowUp'])

export default function AnswerChoiceGroup({
  choices = {},
  selectedChoice = '',
  onSelect,
  disabled = false,
  getChoiceClassName = null,
  ariaLabel = '答案選項',
}) {
  const choiceKeys = Object.keys(choices)
  const buttonRefs = useRef(new Map())
  const focusKey = choiceKeys.includes(selectedChoice) ? selectedChoice : choiceKeys[0]

  const moveSelection = (event, currentIndex) => {
    if (disabled || choiceKeys.length === 0) return

    let nextIndex
    if (FORWARD_KEYS.has(event.key)) nextIndex = (currentIndex + 1) % choiceKeys.length
    else if (BACKWARD_KEYS.has(event.key)) nextIndex = (currentIndex - 1 + choiceKeys.length) % choiceKeys.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = choiceKeys.length - 1
    else return

    event.preventDefault()
    const nextKey = choiceKeys[nextIndex]
    onSelect?.(nextKey)
    buttonRefs.current.get(nextKey)?.focus()
  }

  return (
    <div className="choice-container" role="radiogroup" aria-label={ariaLabel}>
      {choiceKeys.map((key, index) => {
        const selected = selectedChoice === key
        const className = getChoiceClassName
          ? getChoiceClassName(key, { selected, disabled })
          : `choice-btn ${selected ? 'selected' : ''}`

        return (
          <button
            key={key}
            ref={(node) => {
              if (node) buttonRefs.current.set(key, node)
              else buttonRefs.current.delete(key)
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={disabled ? -1 : key === focusKey ? 0 : -1}
            className={className}
            onClick={() => onSelect?.(key)}
            onKeyDown={(event) => moveSelection(event, index)}
            disabled={disabled}
          >
            <span className="choice-letter">{key}</span>
            <span>{choices[key]}</span>
          </button>
        )
      })}
    </div>
  )
}
