import { PART5_ANSWER_KEYS } from '../part5Schema.js'

const DIFFICULTY_SEQUENCE = ['easy', 'medium', 'medium', 'hard']

export function buildCategorySeeds(category, rows, optionRoles = []) {
  return rows.map(([question, options, correctIndex, rationale, tags = []], index) => ({
    question,
    choices: Object.fromEntries(PART5_ANSWER_KEYS.map((key, optionIndex) => [key, options[optionIndex]])),
    answer: PART5_ANSWER_KEYS[correctIndex],
    rationale,
    category,
    difficulty: DIFFICULTY_SEQUENCE[index % DIFFICULTY_SEQUENCE.length],
    tags: [category, 'business English', ...tags],
    choiceRoles: Object.fromEntries(
      PART5_ANSWER_KEYS.map((key, optionIndex) => [key, optionRoles[optionIndex] || 'an unsuitable form or meaning'])
    )
  }))
}
