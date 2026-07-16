import assert from 'node:assert/strict'
import test from 'node:test'
import { questionsData } from '../../src/data/questions.js'
import {
  validatePart7QuestionBank,
  validateUnifiedQuestionIds,
} from '../../src/services/questionValidator.js'

const makeQuestion = (index, overrides = {}) => ({
  id: `part7-test-${index}`,
  part: 7,
  type: index % 2 ? '細節' : '主旨',
  passageId: `passage-${Math.floor(index / 3)}`,
  passage: `To: Team\nPlease submit report ${index} by Friday. The office opens at nine.`,
  document: { type: 'email', title: `Report ${index}` },
  evidence: { quote: `Please submit report ${index} by Friday`, label: '提交期限' },
  question: `What should the team submit for scenario ${index}?`,
  choices: {
    A: `Report ${index}`,
    B: `Invoice ${index}`,
    C: `Badge ${index}`,
    D: `Menu ${index}`,
  },
  correctAnswer: 'A',
  explanation: `原文明確要求提交 Report ${index}，答案選 A。`,
  difficulty: 'Medium',
  tags: ['細節題', '文件定位'],
  version: 'part7-v1',
  ...overrides,
})

test('accepts schema-valid Part 7 questions with source-backed evidence', () => {
  const result = validatePart7QuestionBank(
    Array.from({ length: 4 }, (_, index) => makeQuestion(index)),
    { checkDistribution: false, checkPassageGroups: false },
  )
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2))
})

test('rejects missing document fields, duplicate choices and unsupported answers', () => {
  const result = validatePart7QuestionBank([makeQuestion(0, {
    document: null,
    evidence: null,
    choices: { A: 'same', B: 'same', C: 'third', D: 'fourth' },
    correctAnswer: 'E',
    explanation: '答案選 B。',
  })], { checkDistribution: false, checkPassageGroups: false })
  const codes = result.errors.map((issue) => issue.code)
  assert.ok(codes.includes('INVALID_DOCUMENT'))
  assert.ok(codes.includes('INVALID_EVIDENCE'))
  assert.ok(codes.includes('DUPLICATE_CHOICE'))
  assert.ok(codes.includes('ANSWER_NOT_FOUND'))
  assert.ok(codes.includes('EXPLANATION_ANSWER_MISMATCH'))
})

test('rejects answer evidence that does not exist in the source document', () => {
  const result = validatePart7QuestionBank([makeQuestion(0, {
    evidence: { quote: 'This sentence is not in the document', label: '不存在' },
  })], { checkDistribution: false, checkPassageGroups: false })
  assert.ok(result.errors.some((issue) => issue.code === 'EVIDENCE_NOT_IN_PASSAGE'))
})

test('reports exact and near-duplicate Part 7 questions', () => {
  const first = makeQuestion(0)
  const exact = makeQuestion(1, { id: first.id, question: ` ${first.question.toUpperCase()} ` })
  const near = makeQuestion(2, { question: 'What should the team submit for scenario zero?' })
  const result = validatePart7QuestionBank([first, exact, near], {
    checkDistribution: false,
    checkPassageGroups: false,
  })
  assert.ok(result.errors.some((issue) => issue.code === 'DUPLICATE_ID'))
  assert.ok(result.errors.some((issue) => issue.code === 'DUPLICATE_QUESTION'))
  assert.ok(result.warnings.some((issue) => issue.code === 'NEAR_DUPLICATE_QUESTION'))
})

test('unified IDs are unique across Parts 5, 7 and listening', () => {
  const valid = validateUnifiedQuestionIds(questionsData)
  assert.equal(valid.valid, true, JSON.stringify(valid.errors, null, 2))
  const invalid = validateUnifiedQuestionIds([{ id: 'same' }, { id: 'same' }])
  assert.ok(invalid.errors.some((issue) => issue.code === 'DUPLICATE_ID'))
})

test('production Part 7 passes schema, evidence, group and distribution gates', () => {
  const part7 = questionsData.filter((question) => question.part === 7)
  const result = validatePart7QuestionBank(part7)
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2))
  assert.equal(result.stats.total, 30)
  assert.ok(Math.max(...Object.values(result.stats.answerDistribution)) <= 9)
})
test('answer-position repairs preserve every confirmed correct choice meaning', () => {
  const expected = {
    q101: 'To inform staff about an office relocation',
    q103: 'Pack their personal belongings',
    q106: "A laptop and last quarter's sales report",
    q107: 'An updated corporate travel policy',
    q109: 'Within ten business days of returning',
    q112: 'Complimentary 24/7 technical helpline support',
    q114: 'On May 25',
    q116: 'The planned retirement of Mr. Kenneth Green',
    q118: 'By next October',
    q121: 'Save all active project documents locally',
    q122: 'The 15th Annual Marketing Summit',
    q124: 'By sending five or more attendees',
    q125: 'Commercial office spaces for lease',
    q127: 'Robert Davis',
  }
  const byId = new Map(questionsData.map((question) => [question.id, question]))
  for (const [id, correctText] of Object.entries(expected)) {
    const question = byId.get(id)
    assert.equal(question.choices[question.correctAnswer], correctText, id)
  }
})
