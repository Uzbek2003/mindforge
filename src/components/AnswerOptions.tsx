interface AnswerOptionsProps {
  /** Unique name for the radio group (must be stable per question). */
  groupName: string
  labelledBy: string
  options: readonly [string, string, string, string]
  selectedIndex: number | null
  disabled: boolean
  correctIndex?: number
  /** When true, show correct/wrong styling based on selection. */
  revealed: boolean
  onSelect: (index: number) => void
  /** Extra class logic for story retry edge cases; defaults to standard quiz styling. */
  getOptionClassName?: (index: number) => string
}

/**
 * Semantic radio answer list — keeps existing `.option-btn` visual design.
 * Native radios provide keyboard, focus, and screen-reader selection behavior.
 */
export function AnswerOptions({
  groupName,
  labelledBy,
  options,
  selectedIndex,
  disabled,
  correctIndex,
  revealed,
  onSelect,
  getOptionClassName,
}: AnswerOptionsProps) {
  return (
    <div className="options-grid" role="radiogroup" aria-labelledby={labelledBy}>
      {options.map((option, i) => {
        let className = getOptionClassName?.(i) ?? defaultOptionClassName(i, {
          revealed,
          selectedIndex,
          correctIndex,
        })

        let statusLabel = ''
        if (revealed && correctIndex != null) {
          if (i === correctIndex) statusLabel = 'Correct answer'
          else if (i === selectedIndex) statusLabel = 'Your answer — incorrect'
        }

        const letter = String.fromCharCode(65 + i)
        const inputId = `${groupName}-option-${i}`

        return (
          <label
            key={`${groupName}-${i}`}
            htmlFor={inputId}
            className={className}
            aria-label={`${letter}. ${option}${statusLabel ? `. ${statusLabel}` : ''}`}
          >
            <input
              id={inputId}
              className="option-radio-input"
              type="radio"
              name={groupName}
              value={i}
              checked={selectedIndex === i}
              disabled={disabled}
              onChange={() => onSelect(i)}
            />
            <span className="option-letter" aria-hidden="true">
              {letter}
            </span>
            <span className="option-text">{option}</span>
            {revealed && correctIndex != null && i === correctIndex && (
              <span className="result-icon correct-icon" aria-hidden="true">
                ✓
              </span>
            )}
            {revealed &&
              selectedIndex === i &&
              correctIndex != null &&
              i !== correctIndex && (
                <span className="result-icon wrong-icon" aria-hidden="true">
                  ✕
                </span>
              )}
          </label>
        )
      })}
    </div>
  )
}

function defaultOptionClassName(
  index: number,
  {
    revealed,
    selectedIndex,
    correctIndex,
  }: {
    revealed: boolean
    selectedIndex: number | null
    correctIndex?: number
  },
): string {
  let className = 'option-btn'
  if (revealed && correctIndex != null) {
    if (index === correctIndex) className += ' correct'
    else if (index === selectedIndex) className += ' wrong'
  } else if (selectedIndex === index) {
    className += ' selected'
  }
  return className
}
