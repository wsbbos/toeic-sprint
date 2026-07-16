import { useMemo, useState } from 'react'
import ExplanationPanel from './ExplanationPanel.jsx'
import '../../styles/result-review.css'

const FILTERS = Object.freeze([
  { id: 'all', label: '全部' },
  { id: 'incorrect', label: '錯題' },
  { id: 'unanswered', label: '未作答' },
])

const normalizeOutcome = (outcome, index) => {
  const question = outcome.question && typeof outcome.question === 'object' ? outcome.question : outcome
  const rawAnswer = outcome.userAnswer === '無作答' ? '' : outcome.userAnswer || ''
  const isCorrect = Boolean(outcome.isCorrect)
  const status = outcome.status || (isCorrect ? 'correct' : rawAnswer ? 'incorrect' : 'unanswered')
  return {
    ...outcome,
    question,
    questionId: outcome.questionId || question.id || `review-${index}`,
    userAnswer: rawAnswer,
    correctAnswer: outcome.correctAnswer || question.correctAnswer || question.answer,
    isCorrect,
    status,
    originalIndex: index,
  }
}

export default function ResultReviewList({ outcomes = [] }) {
  const normalized = useMemo(() => outcomes.map(normalizeOutcome), [outcomes])
  const initialMistakes = useMemo(() => normalized.filter((item) => item.status === 'incorrect').slice(0, 1).map((item) => item.questionId), [normalized])
  const [filter, setFilter] = useState('incorrect')
  const [expandedIds, setExpandedIds] = useState(() => new Set(initialMistakes))
  const counts = {
    all: normalized.length,
    incorrect: normalized.filter((item) => item.status === 'incorrect').length,
    unanswered: normalized.filter((item) => item.status === 'unanswered').length,
  }
  const visible = filter === 'all' ? normalized : normalized.filter((item) => item.status === filter)

  const selectFilter = (nextFilter) => {
    setFilter(nextFilter)
    const nextVisible = nextFilter === 'all' ? normalized : normalized.filter((item) => item.status === nextFilter)
    setExpandedIds(new Set(nextVisible.slice(0, 1).map((item) => item.questionId)))
  }
  const toggleItem = (questionId) => setExpandedIds((current) => {
    const next = new Set(current)
    if (next.has(questionId)) next.delete(questionId)
    else next.add(questionId)
    return next
  })

  return (
    <section className="result-review" aria-labelledby="result-review-title">
      <header className="result-review-header">
        <div>
          <h2 id="result-review-title">逐題解析</h2>
          <p>預設顯示答錯題目；未作答會獨立列出，不計入弱點分析。</p>
        </div>
        <div className="result-review-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setExpandedIds(new Set(visible.map((item) => item.questionId)))}>全部展開</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setExpandedIds(new Set())}>全部收合</button>
        </div>
      </header>

      <div className="result-review-filters" role="group" aria-label="解析篩選">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`result-filter${filter === item.id ? ' is-active' : ''}`}
            aria-pressed={filter === item.id}
            onClick={() => selectFilter(item.id)}
          >
            {item.label} {counts[item.id]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="result-review-empty" role="status">這個篩選目前沒有題目。</p>
      ) : (
        <div className="result-review-items">
          {visible.map((outcome) => {
            const expanded = expandedIds.has(outcome.questionId)
            return (
              <article className="result-review-item" data-testid={`result-review-${outcome.questionId}`} key={outcome.questionId}>
                <div className="result-review-summary">
                  <div>
                    <span className={`result-review-status is-${outcome.status}`}>{outcome.status === 'correct' ? '答對' : outcome.status === 'incorrect' ? '錯題' : '未作答'}</span>
                    <h3>第 {outcome.originalIndex + 1} 題 · {outcome.question.question}</h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    aria-expanded={expanded}
                    aria-label={`${expanded ? '收合' : '展開'}第 ${outcome.originalIndex + 1} 題解析`}
                    onClick={() => toggleItem(outcome.questionId)}
                  >
                    {expanded ? '收合' : '展開'}
                  </button>
                </div>
                {expanded && (
                  <ExplanationPanel
                    question={outcome.question}
                    userAnswer={outcome.userAnswer}
                    correctAnswer={outcome.correctAnswer}
                    index={outcome.originalIndex}
                  />
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
