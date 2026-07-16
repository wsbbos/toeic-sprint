import VisualAsset from './VisualAsset.jsx'

/** @param {{ variant?: string, title: string, description?: string, actionLabel?: string, onAction?: () => void, compact?: boolean }} props */
export default function EmptyLearningState({ variant = 'empty', title, description, actionLabel, onAction, compact = false }) {
  return (
    <section
      className={`learning-empty-state${compact ? ' is-compact' : ''}`}
      data-empty-variant={variant}
      data-testid="learning-empty-state"
      aria-live="polite"
    >
      <VisualAsset name={variant} decorative className={compact ? 'visual-empty-compact' : ''} />
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {actionLabel && onAction && <button className="btn btn-primary" type="button" onClick={onAction}>{actionLabel}</button>}
      </div>
    </section>
  )
}
