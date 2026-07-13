import test from 'node:test'
import assert from 'node:assert/strict'

import { createDefaultUserProfile } from '../../src/data/userProfile.js'
import { recordPracticeAnswer, recordRetake, toggleFavorite } from '../../src/services/userProgressService.js'

const question = { id: 'q-1', part: 5, question: 'Test -------.', choices: { A: 'a', B: 'b', C: 'c', D: 'd' }, answer: 'A', category: 'word_form', difficulty: 'easy', tags: ['word_form'], explanation: 'A is correct.' }

test('wrong answers schedule a review and retakes update mastery', () => {
  const user = createDefaultUserProfile({ createdAt: '2026-07-13T00:00:00Z' })
  const wrong = recordPracticeAnswer(user, question, 'B', false, new Date('2026-07-13T00:00:00Z'))
  const reviewed = recordRetake(wrong, question.id, true, new Date('2026-07-14T00:00:00Z'))

  assert.equal(wrong.wrongBook[0].nextReviewAt, '2026-07-14T00:00:00.000Z')
  assert.equal(reviewed.wrongBook[0].reviewLevel, 1)
  assert.equal(reviewed.wrongBook[0].mastery, 20)
})

test('favorites toggle without duplicates', () => {
  const user = createDefaultUserProfile()
  const added = toggleFavorite(user, question)
  const removed = toggleFavorite(added, question)

  assert.equal(added.favorites.length, 1)
  assert.equal(removed.favorites.length, 0)
})
