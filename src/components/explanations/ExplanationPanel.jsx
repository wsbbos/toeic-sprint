import DocumentRenderer from '../documents/DocumentRenderer.jsx'
import { createExplanationModel } from '../../services/explanationModel.js'
import '../../styles/explanation-content.css'

const STATUS_LABELS = Object.freeze({
  correct: '正確答案',
  'selected-correct': '你的選擇 · 正確答案',
  'selected-wrong': '你的選擇',
})

function ChoiceComparison({ choices }) {
  return (
    <ul className="answer-comparison" aria-label="選項比較">
      {choices.map((choice) => (
        <li className={`answer-comparison-item is-${choice.status}`} key={choice.key}>
          <span className="answer-letter" aria-hidden="true">{choice.key}</span>
          <span className="answer-choice-text">{choice.text}</span>
          {STATUS_LABELS[choice.status] && <strong>{STATUS_LABELS[choice.status]}</strong>}
        </li>
      ))}
    </ul>
  )
}

function Part5Lesson({ model }) {
  const correctChoice = model.choices.find((choice) => choice.key === model.correctAnswer)
  return (
    <>
      <div className="explanation-badges">
        <span className="learning-badge grammar-badge">{model.grammarPoint}</span>
        {model.tags.map((tag) => <span className="learning-badge" key={tag}>{tag.replaceAll('_', ' ')}</span>)}
      </div>
      <div className="sentence-map" aria-label="句子結構">
        <span>{model.sentence.beforeBlank}</span>
        <strong className="sentence-answer" data-testid="sentence-blank">
          <small>正確答案：</small>{correctChoice?.text || model.correctAnswer}
        </strong>
        <span>{model.sentence.afterBlank}</span>
      </div>
      {model.keywords.length > 0 && (
        <div className="keyword-strip" aria-label="判斷關鍵字">
          <strong>判斷關鍵字</strong>
          {model.keywords.map((keyword) => <mark key={keyword}>{keyword}</mark>)}
        </div>
      )}
    </>
  )
}

function Part7Lesson({ model, question }) {
  return (
    <>
      <DocumentRenderer
        passage={question.passage}
        document={question.document}
        highlightTerms={model.evidence ? [model.evidence] : []}
        compact
      />
      <aside className={`evidence-card${model.evidence ? '' : ' evidence-missing'}`} aria-label="答案依據">
        <strong>答案依據</strong>
        {model.evidence ? (
          <><span>{model.evidence}</span><small>{model.evidenceLabel} · {model.evidenceSource}</small></>
        ) : (
          <span>本題解析未提供可安全對應至原文的逐字線索，請搭配完整解析複習。</span>
        )}
      </aside>
      <p className="reading-question"><strong>題目：</strong>{question.question}</p>
    </>
  )
}

/** @param {{ question?: Record<string, any>, userAnswer?: string, correctAnswer?: string, index?: number }} props */
export default function ExplanationPanel({ question = {}, userAnswer = '', correctAnswer, index = 0 }) {
  const model = createExplanationModel({ question, userAnswer, correctAnswer })
  return (
    <article className={`card explanation-panel explanation-${model.kind}`} data-testid="explanation-panel">
      <header className="explanation-heading">
        <div>
          <span className={`result-status ${model.isCorrect ? 'is-correct' : userAnswer ? 'is-wrong' : 'is-unanswered'}`}>
            {model.isCorrect ? '答對' : userAnswer ? '待加強' : '未作答'}
          </span>
          <h3>第 {index + 1} 題 · Part {model.part}</h3>
        </div>
        <p>你的答案 <strong>{userAnswer || '—'}</strong><span aria-hidden="true">→</span>正確答案 <strong>{model.correctAnswer}</strong></p>
      </header>

      {model.kind === 'part7'
        ? <Part7Lesson model={model} question={question} />
        : <Part5Lesson model={model} />}

      <ChoiceComparison choices={model.choices} />
      <div className="explanation-note"><strong>解析</strong><p>{model.explanation}</p></div>
    </article>
  )
}
