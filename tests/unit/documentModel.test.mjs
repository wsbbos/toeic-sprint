import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SUPPORTED_DOCUMENT_TYPES,
  createDocumentModel,
} from '../../src/services/documentModel.js'
import { questionsData } from '../../src/data/questions.js'

const requiredTypes = [
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
]

test('document model exposes every required business-document template', () => {
  assert.deepEqual(SUPPORTED_DOCUMENT_TYPES, requiredTypes)
})

test('legacy Part 7 text becomes a structured email without changing its content', () => {
  const passage = [
    'To: Regional Sales Team',
    'From: Mia Chen',
    'Date: July 14, 2026',
    'Subject: Quarterly Review',
    'Dear colleagues,',
    'Please bring the latest sales report.',
  ].join('\n')

  const model = createDocumentModel({ passage })

  assert.equal(model.type, 'email')
  assert.equal(model.title, 'Quarterly Review')
  assert.deepEqual(model.fields.slice(0, 2), [
    { label: 'To', value: 'Regional Sales Team' },
    { label: 'From', value: 'Mia Chen' },
  ])
  assert.match(model.body, /Please bring the latest sales report\./)
  assert.equal(model.sourceText, passage)
})

test('explicit structured data is normalized for table, schedule, form, invoice, review and thread templates', () => {
  for (const type of ['table_chart', 'schedule', 'form', 'invoice', 'review', 'message_thread']) {
    const model = createDocumentModel({
      passage: 'Fallback business document body.',
      document: {
        type,
        title: 'Structured document',
        columns: ['Item', 'Status'],
        rows: [['Registration', 'Open']],
        messages: [{ sender: 'Alex', time: '09:30', body: 'Please review the update.' }],
        metrics: [{ label: 'Rating', value: '4.8/5' }],
        fields: { Department: 'Sales' },
      },
    })

    assert.equal(model.type, type)
    assert.equal(model.title, 'Structured document')
    assert.equal(model.rows.length, 1)
    assert.equal(model.messages.length, 1)
    assert.deepEqual(model.fields, [{ label: 'Department', value: 'Sales' }])
  }
})

test('all production Part 7 questions retain passage text and receive document metadata', () => {
  const part7 = questionsData.filter((question) => question.part === 7)
  assert.equal(part7.length, 30)
  assert.ok(part7.every((question) => question.passage && question.document?.type))
  assert.ok(part7.every((question) => SUPPORTED_DOCUMENT_TYPES.includes(question.document.type)))
  assert.ok(new Set(part7.map((question) => question.document.type)).size >= 6)
})
