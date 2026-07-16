import { createDocumentModel } from '../../services/documentModel.js'
import '../../styles/document-content.css'

const TEMPLATE_LABELS = Object.freeze({
  advertisement: 'Advertisement',
  email: 'Email',
  form: 'Form',
  invoice: 'Invoice',
  memo: 'Memorandum',
  message_thread: 'Message thread',
  notice: 'Notice',
  review: 'Review',
  schedule: 'Schedule',
  table_chart: 'Table / chart',
})

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function HighlightText({ text, terms = [] }) {
  const value = String(text || '')
  const normalizedTerms = [...new Set(terms.map((term) => String(term || '').trim()).filter(Boolean))]
    .sort((left, right) => right.length - left.length)
  if (!normalizedTerms.length) return value

  const matcher = new RegExp(`(${normalizedTerms.map(escapeRegExp).join('|')})`, 'gi')
  const termSet = new Set(normalizedTerms.map((term) => term.toLocaleLowerCase()))
  return value.split(matcher).map((part, index) => termSet.has(part.toLocaleLowerCase())
    ? <mark className="document-clue" key={`${part}-${index}`}>{part}</mark>
    : part)
}

function DocumentGlyph({ type }) {
  const isConversation = type === 'email' || type === 'message_thread'
  const isData = ['invoice', 'schedule', 'table_chart'].includes(type)
  return (
    <svg className="document-glyph" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="5" y="3" width="22" height="26" rx="4" fill="currentColor" opacity=".12" />
      {isConversation ? (
        <path d="M8 10h16v11H14l-4.5 4v-4H8V10Zm2 2v1.5l6 4 6-4V12l-6 4-6-4Z" fill="currentColor" />
      ) : isData ? (
        <path d="M10 9h12v3H10V9Zm0 5h5v8h-5v-8Zm7 0h5v3h-5v-3Zm0 5h5v3h-5v-3Z" fill="currentColor" />
      ) : (
        <path d="M10 9h12v2H10V9Zm0 5h12v2H10v-2Zm0 5h8v2h-8v-2Z" fill="currentColor" />
      )}
    </svg>
  )
}

function DocumentFields({ fields, formStyle = false, highlightTerms }) {
  if (!fields.length) return null
  return (
    <dl className={formStyle ? 'document-fields document-form-fields' : 'document-fields'}>
      {fields.map((field) => (
        <div key={`${field.label}-${field.value}`}>
          <dt>{field.label}</dt>
          <dd><HighlightText text={field.value} terms={highlightTerms} /></dd>
        </div>
      ))}
    </dl>
  )
}

function DocumentBody({ body, highlightTerms }) {
  if (!body) return null
  return (
    <div className="document-body">
      {body.split(/\n{2,}/).map((paragraph, index) => <p key={`${paragraph.slice(0, 18)}-${index}`}><HighlightText text={paragraph} terms={highlightTerms} /></p>)}
    </div>
  )
}

function DocumentCallouts({ callouts, highlightTerms }) {
  if (!callouts.length) return null
  return <ul className="document-callouts">{callouts.map((item) => <li key={item}><HighlightText text={item} terms={highlightTerms} /></li>)}</ul>
}

function DocumentMetrics({ metrics, highlightTerms }) {
  if (!metrics.length) return null
  return (
    <div className="document-metrics">
      {metrics.map((metric) => <div key={metric.label}><strong><HighlightText text={metric.value} terms={highlightTerms} /></strong><span><HighlightText text={metric.label} terms={highlightTerms} /></span></div>)}
    </div>
  )
}

function DocumentTable({ model, highlightTerms }) {
  if (!model.rows.length) return null
  return (
    <>
      <p className="document-scroll-hint">左右滑動查看完整表格</p>
      <div className="document-table-scroll" tabIndex={0} aria-label={`${model.title} table region`}>
        <table aria-label={model.title}>
          {model.columns.length > 0 && <thead><tr>{model.columns.map((column) => <th key={column} scope="col"><HighlightText text={column} terms={highlightTerms} /></th>)}</tr></thead>}
          <tbody>{model.rows.map((row, rowIndex) => <tr key={`${row.join('-')}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}><HighlightText text={cell} terms={highlightTerms} /></td>)}</tr>)}</tbody>
        </table>
      </div>
    </>
  )
}

function DocumentThread({ messages, highlightTerms }) {
  if (!messages.length) return null
  return (
    <ol className="document-thread">
      {messages.map((message, index) => (
        <li key={`${message.sender}-${message.time}-${index}`}>
          <div className="document-avatar" aria-hidden="true">{String(message.sender || '?').slice(0, 1)}</div>
          <div><header><strong>{message.sender || 'Team member'}</strong><time>{message.time || ''}</time></header><p><HighlightText text={message.body} terms={highlightTerms} /></p></div>
        </li>
      ))}
    </ol>
  )
}

/** @param {{ passage?: string, document?: Record<string, any>, compact?: boolean, highlightTerms?: string[] }} props */
export default function DocumentRenderer({ passage = '', document = {}, compact = false, highlightTerms = [] }) {
  const model = createDocumentModel({ passage, document })
  const tableType = ['invoice', 'schedule', 'table_chart'].includes(model.type)
  const isThread = model.type === 'message_thread'
  const isForm = model.type === 'form'

  return (
    <article
      className={`business-document document-${model.type}${compact ? ' document-compact' : ''}${compact && highlightTerms.length ? ' document-evidence-view' : ''}`}
      data-testid="business-document"
      data-document-type={model.type}
      aria-label={model.title}
    >
      <header className="document-heading">
        <div className="document-kind"><DocumentGlyph type={model.type} /><span>{model.eyebrow || TEMPLATE_LABELS[model.type]}</span></div>
        <h2><HighlightText text={model.title} terms={highlightTerms} /></h2>
      </header>

      <DocumentFields fields={model.fields} formStyle={isForm} highlightTerms={highlightTerms} />
      <DocumentMetrics metrics={model.metrics} highlightTerms={highlightTerms} />
      {tableType && <DocumentTable model={model} highlightTerms={highlightTerms} />}
      {isThread && <DocumentThread messages={model.messages} highlightTerms={highlightTerms} />}
      <DocumentBody body={model.body} highlightTerms={highlightTerms} />
      <DocumentCallouts callouts={model.callouts} highlightTerms={highlightTerms} />

      {model.attachment && <div className="document-attachment"><span aria-hidden="true">↳</span><span>{model.attachment}</span></div>}
      {model.action && <div className="document-action" aria-label={`Call to action: ${model.action}`}>{model.action}</div>}
    </article>
  )
}
