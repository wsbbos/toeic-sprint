import assert from 'node:assert/strict'
import test from 'node:test'

import { createGuestProfile } from '../../src/data/userProfile.js'
import { buildMiniMockResult, MINI_MOCK_DURATION_SECONDS } from '../../src/services/miniMockService.js'
import { createPracticeSession, setSessionAnswer, submitPracticeSession } from '../../src/services/practiceSessionService.js'
import { recordMockResult } from '../../src/services/userProgressService.js'

const question = (id, part = 5, correctAnswer = 'A', category = 'word_form') => ({
  id,
  part,
  category,
  difficulty: 'easy',
  tags: ['grammar'],
  question: `Question ${id}`,
  choices: { A: 'one', B: 'two', C: 'three', D: 'four' },
  correctAnswer,
  explanation: 'Explanation',
})

test('practice results keep unanswered questions out of mistake and weakness totals', () => {
  const questions = [question('one'), question('two', 5, 'B'), question('three')]
  let session = createPracticeSession(questions, { type: 'part5', count: 3 }, new Date('2026-07-16T01:00:00Z'))
  session = setSessionAnswer(session, 'one', 'A')
  session = setSessionAnswer(session, 'two', 'A')

  const { result } = submitPracticeSession(session, questions, new Date('2026-07-16T01:01:00Z'))

  assert.equal(result.incorrectCount, 1)
  assert.equal(result.wrongCount, 1)
  assert.equal(result.unansweredCount, 1)
  assert.equal(result.answeredCount, 2)
  assert.equal(result.categoryPerformance.word_form.total, 2)
  assert.equal(result.outcomes[2].status, 'unanswered')
})

test('Mini Mock separates review lists and persists only answered outcomes', () => {
  const questions = [question('one'), question('two', 7, 'B', 'reading_detail'), question('three')]
  const result = buildMiniMockResult(
    questions,
    { one: 'A', two: 'A' },
    MINI_MOCK_DURATION_SECONDS - 75,
    new Date('2026-07-16T12:00:00Z'),
  )

  assert.equal(result.incorrectCount, 1)
  assert.equal(result.wrongCount, 1)
  assert.equal(result.unansweredCount, 1)
  assert.equal(result.answeredCount, 2)
  assert.equal(result.wrongList[0].questionId, 'two')
  assert.equal(result.unansweredList[0].questionId, 'three')
  assert.equal(result.reviewItems.length, 3)
  assert.equal(result.questionOutcomes[2].status, 'unanswered')

  const updated = recordMockResult(createGuestProfile(), result, new Date('2026-07-16T12:00:00Z'))
  assert.equal(updated.progress.totalQuestionsAnswered, 2)
  assert.equal(updated.progress.totalWrong, 1)
  assert.deepEqual(updated.wrongBook.map((item) => item.questionId), ['two'])
  assert.deepEqual(updated.practiceHistory.map((item) => item.questionId), ['one', 'two'])
  assert.equal(updated.dailyRecords[0].questionsAnswered, 2)
})
