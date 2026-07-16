export const SUPPORTED_DOCUMENT_TYPES = Object.freeze([
  'email',
  'memo',
  'notice',
  'advertisement',
  'schedule',
  'form',
  'invoice',
  'review',
  'message_thread',
  'table_chart',
])

const TYPE_ALIASES = Object.freeze({
  ad: 'advertisement',
  chart: 'table_chart',
  message: 'message_thread',
  messages: 'message_thread',
  table: 'table_chart',
  thread: 'message_thread',
})

const HEADER_LABELS = Object.freeze(['To', 'From', 'Date', 'Subject', 'Cc', 'Invoice', 'Reference'])

const normalizeType = (type) => {
  const normalized = String(type || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  const resolved = TYPE_ALIASES[normalized] || normalized
  return SUPPORTED_DOCUMENT_TYPES.includes(resolved) ? resolved : null
}

const inferType = (passage) => {
  const source = String(passage || '')
  if (/^memorandum\b/im.test(source)) return 'memo'
  if (/^(to|from|subject):/im.test(source) || /dear\s+(colleagues|customer|team|sir|madam)/i.test(source)) return 'email'
  if (/free trial|available for lease|subscription|purchase before/i.test(source)) return 'advertisement'
  if (/\bnotice\b|\bannouncement\b/i.test(source)) return 'notice'
  return 'notice'
}

const normalizeFields = (fields) => {
  if (Array.isArray(fields)) {
    return fields
      .map((field) => ({ label: String(field?.label || '').trim(), value: String(field?.value || '').trim() }))
      .filter((field) => field.label && field.value)
  }
  if (fields && typeof fields === 'object') {
    return Object.entries(fields)
      .map(([label, value]) => ({ label: String(label).trim(), value: String(value || '').trim() }))
      .filter((field) => field.label && field.value)
  }
  return []
}

const parseLegacyPassage = (passage) => {
  const lines = String(passage || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const fields = []
  const bodyLines = []
  let heading = ''

  lines.forEach((line, index) => {
    const match = line.match(/^([^:]{2,18}):\s*(.+)$/)
    const label = match?.[1]?.trim()
    if (match && HEADER_LABELS.some((item) => item.toLowerCase() === label.toLowerCase())) {
      fields.push({ label: HEADER_LABELS.find((item) => item.toLowerCase() === label.toLowerCase()), value: match[2].trim() })
      return
    }
    if (index === 0 && line.length <= 90 && !/[.!?]$/.test(line)) {
      heading = line
      return
    }
    bodyLines.push(line)
  })

  return { fields, heading, body: bodyLines.join('\n\n') }
}

const normalizeRows = (rows) => Array.isArray(rows)
  ? rows.map((row) => Array.isArray(row) ? row.map((cell) => String(cell ?? '')) : Object.values(row || {}).map((cell) => String(cell ?? '')))
  : []

/** @param {{ passage?: string, document?: Record<string, any> }} [options] */
export function createDocumentModel({ passage = '', document = {} } = {}) {
  const legacy = parseLegacyPassage(passage)
  const explicitFields = normalizeFields(document.fields)
  const subject = [...explicitFields, ...legacy.fields].find((field) => field.label.toLowerCase() === 'subject')?.value
  const type = normalizeType(document.type || document.kind) || inferType(passage)
  const title = String(document.title || subject || legacy.heading || 'Business document').trim()

  return {
    type,
    title,
    eyebrow: String(document.eyebrow || '').trim(),
    body: String(document.body || legacy.body || passage || '').trim(),
    sourceText: String(passage || ''),
    fields: explicitFields.length ? explicitFields : legacy.fields,
    columns: Array.isArray(document.columns) ? document.columns.map((column) => String(column)) : [],
    rows: normalizeRows(document.rows),
    messages: Array.isArray(document.messages) ? document.messages.filter((message) => message?.body) : [],
    metrics: Array.isArray(document.metrics) ? document.metrics.filter((metric) => metric?.label && metric?.value) : [],
    callouts: Array.isArray(document.callouts) ? document.callouts.map((item) => String(item)).filter(Boolean) : [],
    attachment: String(document.attachment || '').trim(),
    action: String(document.action || '').trim(),
    highlights: Array.isArray(document.highlights) ? document.highlights.filter((item) => item?.text) : [],
  }
}
