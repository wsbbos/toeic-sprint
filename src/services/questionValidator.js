import {
  PART5_ANSWER_KEYS,
  PART5_CATEGORIES,
  PART5_DIFFICULTIES,
  PART5_REQUIRED_FIELDS
} from '../data/part5Schema.js'

const ANSWER_DISTRIBUTION_MIN_SIZE = 20
const CATEGORY_DISTRIBUTION_MIN_SIZE = 100
const MAX_ANSWER_SHARE = 0.45
const MAX_CATEGORY_SHARE = 0.35

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
    : ''
}

function isMissing(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  return false
}

function createIssue(code, message, questionId, details) {
  return {
    code,
    message,
    ...(questionId ? { questionId } : {}),
    ...(details ? { details } : {})
  }
}

function findExplicitAnswer(explanation) {
  const patterns = [
    /(?:correct\s+answer|answer|choice|option)\s*(?:is|:)?\s*\(?([A-D])\)?\b/i,
    /(?:答案|選項|應選)\s*(?:是|為|：|:)?\s*\(?([A-D])\)?/i
  ]

  for (const pattern of patterns) {
    const match = explanation.match(pattern)
    if (match) return match[1].toUpperCase()
  }

  return null
}

function validateQuestion(question, index, errors) {
  const questionId = typeof question?.id === 'string' ? question.id : `index:${index}`

  if (!question || typeof question !== 'object' || Array.isArray(question)) {
    errors.push(createIssue('INVALID_QUESTION', 'Question must be an object.', questionId))
    return
  }

  for (const field of PART5_REQUIRED_FIELDS) {
    if (!(field in question) || isMissing(question[field])) {
      errors.push(createIssue('MISSING_FIELD', `Missing required field: ${field}.`, questionId, { field }))
    }
  }

  const choices = question.choices
  if (!choices || typeof choices !== 'object' || Array.isArray(choices)) {
    errors.push(createIssue('INVALID_CHOICES', 'Choices must be an object with A, B, C, and D.', questionId))
  } else {
    const normalizedChoices = []
    for (const key of PART5_ANSWER_KEYS) {
      const value = choices[key]
      if (isMissing(value)) {
        errors.push(createIssue('MISSING_CHOICE', `Choice ${key} is missing.`, questionId, { key }))
      } else {
        normalizedChoices.push([key, normalizeText(value)])
      }
    }

    const firstKeyByText = new Map()
    for (const [key, text] of normalizedChoices) {
      if (firstKeyByText.has(text)) {
        errors.push(createIssue(
          'DUPLICATE_CHOICE',
          `Choices ${firstKeyByText.get(text)} and ${key} contain the same text.`,
          questionId,
          { keys: [firstKeyByText.get(text), key] }
        ))
      } else {
        firstKeyByText.set(text, key)
      }
    }
  }

  if (!PART5_ANSWER_KEYS.includes(question.answer) || isMissing(choices?.[question.answer])) {
    errors.push(createIssue('ANSWER_NOT_FOUND', 'The answer must reference an existing choice A-D.', questionId))
  }

  if (!PART5_CATEGORIES.includes(question.category)) {
    errors.push(createIssue('INVALID_CATEGORY', `Unknown category: ${question.category}.`, questionId))
  }

  if (!PART5_DIFFICULTIES.includes(question.difficulty)) {
    errors.push(createIssue('INVALID_DIFFICULTY', `Unknown difficulty: ${question.difficulty}.`, questionId))
  }

  if (!Array.isArray(question.tags) || question.tags.length === 0) {
    errors.push(createIssue('EMPTY_TAGS', 'Tags must contain at least one value.', questionId))
  } else if (question.tags.some((tag) => typeof tag !== 'string' || tag.trim().length === 0)) {
    errors.push(createIssue('INVALID_TAG', 'Every tag must be a non-empty string.', questionId))
  }

  if (typeof question.explanation === 'string' && question.explanation.trim()) {
    const explicitAnswer = findExplicitAnswer(question.explanation)
    const correctChoice = normalizeText(choices?.[question.answer])
    const normalizedExplanation = normalizeText(question.explanation)
    const namesCorrectChoice = Boolean(correctChoice && normalizedExplanation.includes(correctChoice))

    if ((explicitAnswer && explicitAnswer !== question.answer) || (!explicitAnswer && !namesCorrectChoice)) {
      errors.push(createIssue(
        'EXPLANATION_ANSWER_MISMATCH',
        'The explanation does not support the configured answer.',
        questionId,
        { answer: question.answer, explicitAnswer }
      ))
    }
  }
}

function validateDuplicates(questions, errors) {
  const idIndexes = new Map()
  const questionIndexes = new Map()

  questions.forEach((question, index) => {
    if (!question || typeof question !== 'object') return

    const id = normalizeText(question.id)
    if (id) {
      if (idIndexes.has(id)) {
        errors.push(createIssue('DUPLICATE_ID', `Duplicate id also used at index ${idIndexes.get(id)}.`, question.id))
      } else {
        idIndexes.set(id, index)
      }
    }

    const text = normalizeText(question.question)
    if (text) {
      if (questionIndexes.has(text)) {
        errors.push(createIssue(
          'DUPLICATE_QUESTION',
          `Duplicate question text also used at index ${questionIndexes.get(text)}.`,
          question.id
        ))
      } else {
        questionIndexes.set(text, index)
      }
    }
  })
}

function calculateStats(questions) {
  const answerDistribution = Object.fromEntries(PART5_ANSWER_KEYS.map((key) => [key, 0]))
  const categoryDistribution = Object.fromEntries(PART5_CATEGORIES.map((category) => [category, 0]))
  const difficultyDistribution = Object.fromEntries(PART5_DIFFICULTIES.map((difficulty) => [difficulty, 0]))

  for (const question of questions) {
    if (question && PART5_ANSWER_KEYS.includes(question.answer)) answerDistribution[question.answer] += 1
    if (question && PART5_CATEGORIES.includes(question.category)) categoryDistribution[question.category] += 1
    if (question && PART5_DIFFICULTIES.includes(question.difficulty)) difficultyDistribution[question.difficulty] += 1
  }

  return {
    total: questions.length,
    answerDistribution,
    categoryDistribution,
    difficultyDistribution
  }
}

function validateDistribution(stats, errors, warnings) {
  if (stats.total >= ANSWER_DISTRIBUTION_MIN_SIZE) {
    const missingAnswers = PART5_ANSWER_KEYS.filter((key) => stats.answerDistribution[key] === 0)
    if (missingAnswers.length > 0) {
      errors.push(createIssue(
        'ANSWER_POSITION_MISSING',
        `No correct answers use position(s): ${missingAnswers.join(', ')}.`,
        null,
        { positions: missingAnswers }
      ))
    }

    const highestAnswerShare = Math.max(...Object.values(stats.answerDistribution)) / stats.total
    if (highestAnswerShare > MAX_ANSWER_SHARE) {
      errors.push(createIssue(
        'ANSWER_DISTRIBUTION_SKEW',
        `One answer position represents ${(highestAnswerShare * 100).toFixed(1)}% of the bank.`,
        null,
        { highestShare: highestAnswerShare, threshold: MAX_ANSWER_SHARE }
      ))
    }
  }

  if (stats.total >= CATEGORY_DISTRIBUTION_MIN_SIZE) {
    const highestCategoryShare = Math.max(...Object.values(stats.categoryDistribution)) / stats.total
    const missingCategories = PART5_CATEGORIES.filter((category) => stats.categoryDistribution[category] === 0)
    if (highestCategoryShare > MAX_CATEGORY_SHARE || missingCategories.length > 0) {
      errors.push(createIssue(
        'CATEGORY_DISTRIBUTION_SKEW',
        'The category distribution is too concentrated or omits required Part 5 categories.',
        null,
        { highestShare: highestCategoryShare, missingCategories }
      ))
    }
  } else {
    warnings.push(createIssue(
      'CATEGORY_SAMPLE_SMALL',
      `Category distribution checks become strict at ${CATEGORY_DISTRIBUTION_MIN_SIZE} questions.`
    ))
  }
}

export function validatePart5QuestionBank(questionBank, options = {}) {
  const errors = []
  const warnings = []
  const questions = Array.isArray(questionBank) ? questionBank : []

  if (!Array.isArray(questionBank)) {
    errors.push(createIssue('INVALID_BANK', 'Question bank must be an array.'))
  }

  questions.forEach((question, index) => validateQuestion(question, index, errors))
  validateDuplicates(questions, errors)

  const stats = calculateStats(questions)
  if (options.checkDistribution !== false) validateDistribution(stats, errors, warnings)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats
  }
}
