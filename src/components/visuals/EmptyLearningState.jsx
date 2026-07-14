import LearningVisual from './LearningVisual.jsx'

export default function EmptyLearningState({ variant = 'empty', title, description, actionLabel, onAction, compact = false }) {
  return (
    <section
      className={`learning-empty-state${compact ? ' is-compact' : ''}`}
      data-empty-variant={variant}
      data-testid="learning-empty-state"
      aria-live="polite"
    >
      <LearningVisual variant={variant} size={compact ? 'small' : 'medium'} decorative />
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {actionLabel && onAction && <button className="btn btn-primary" type="button" onClick={onAction}>{actionLabel}</button>}
      </div>
    </section>
  )
}
