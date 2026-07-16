import {
  PART5_ANSWER_KEYS,
  PART5_CATEGORIES,
  PART5_DIFFICULTIES,
  PART5_REQUIRED_FIELDS
} from '../data/part5Schema.js'
import {
  PART7_ANSWER_KEYS,
  PART7_DIFFICULTIES,
  PART7_REQUIRED_FIELDS,
  PART7_SCHEMA_VERSION,
  PART7_TYPES,
} from '../data/part7Schema.js'
import { SUPPORTED_DOCUMENT_TYPES } from './documentModel.js'

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
    /(?:答案|選項|應選)\s*(?:是|為|：|:)?\s*\(?([A-D])\)?/i,
    /選\s*\(?([A-D])\)?/i
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
function textSimilarity(first, second) {
  const left = normalizeText(first)
  const right = normalizeText(second)
  if (!left || !right) return 0
  if (left === right) return 1
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0]
    previous[0] = row
    for (let column = 1; column <= right.length; column += 1) {
      const above = previous[column]
      const substitution = diagonal + (left[row - 1] === right[column - 1] ? 0 : 1)
      previous[column] = Math.min(previous[column] + 1, previous[column - 1] + 1, substitution)
      diagonal = above
    }
  }
  return 1 - (previous[right.length] / Math.max(left.length, right.length))
}

function validatePart7Question(question, index, errors) {
  const questionId = typeof question?.id === 'string' ? question.id : `index:${index}`
  if (!question || typeof question !== 'object' || Array.isArray(question)) {
    errors.push(createIssue('INVALID_QUESTION', 'Question must be an object.', questionId))
    return
  }

  for (const field of PART7_REQUIRED_FIELDS) {
    if (!(field in question) || isMissing(question[field])) {
      errors.push(createIssue('MISSING_FIELD', `Missing required field: ${field}.`, questionId, { field }))
    }
  }

  if (question.part !== 7) errors.push(createIssue('INVALID_PART', 'Part 7 questions must use part: 7.', questionId))
  if (!PART7_TYPES.includes(question.type)) errors.push(createIssue('INVALID_TYPE', `Unknown Part 7 type: ${question.type}.`, questionId))
  if (!PART7_DIFFICULTIES.includes(question.difficulty)) errors.push(createIssue('INVALID_DIFFICULTY', `Unknown Part 7 difficulty: ${question.difficulty}.`, questionId))
  if (question.version !== PART7_SCHEMA_VERSION) errors.push(createIssue('INVALID_VERSION', `Part 7 version must be ${PART7_SCHEMA_VERSION}.`, questionId))

  const choices = question.choices
  if (!choices || typeof choices !== 'object' || Array.isArray(choices)) {
    errors.push(createIssue('INVALID_CHOICES', 'Choices must be an object with A, B, C, and D.', questionId))
  } else {
    const keys = Object.keys(choices)
    if (keys.length !== PART7_ANSWER_KEYS.length || keys.some((key) => !PART7_ANSWER_KEYS.includes(key))) {
      errors.push(createIssue('INVALID_CHOICE_KEYS', 'Choices must contain exactly A, B, C, and D.', questionId))
    }
    const seen = new Map()
    for (const key of PART7_ANSWER_KEYS) {
      const value = choices[key]
      if (isMissing(value)) {
        errors.push(createIssue('MISSING_CHOICE', `Choice ${key} is missing.`, questionId, { key }))
        continue
      }
      const normalized = normalizeText(value)
      if (seen.has(normalized)) {
        errors.push(createIssue('DUPLICATE_CHOICE', `Choices ${seen.get(normalized)} and ${key} contain the same text.`, questionId))
      } else {
        seen.set(normalized, key)
      }
    }
  }

  if (!PART7_ANSWER_KEYS.includes(question.correctAnswer) || isMissing(choices?.[question.correctAnswer])) {
    errors.push(createIssue('ANSWER_NOT_FOUND', 'The correctAnswer must reference an existing choice A-D.', questionId))
  }

  const document = question.document
  if (!document || typeof document !== 'object' || !SUPPORTED_DOCUMENT_TYPES.includes(document.type)) {
    errors.push(createIssue('INVALID_DOCUMENT', 'Part 7 requires a supported business-document type.', questionId))
  }

  const evidence = question.evidence
  if (!evidence || typeof evidence !== 'object' || isMissing(evidence.quote) || isMissing(evidence.label)) {
    errors.push(createIssue('INVALID_EVIDENCE', 'Part 7 requires a labeled answer-evidence quote.', questionId))
  } else if (!normalizeText(question.passage).includes(normalizeText(evidence.quote))) {
    errors.push(createIssue('EVIDENCE_NOT_IN_PASSAGE', 'The answer evidence does not exist in the source passage.', questionId))
  }

  if (!Array.isArray(question.tags) || question.tags.length === 0) {
    errors.push(createIssue('EMPTY_TAGS', 'Tags must contain at least one value.', questionId))
  } else if (question.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
    errors.push(createIssue('INVALID_TAG', 'Every tag must be a non-empty string.', questionId))
  }

  if (typeof question.explanation === 'string' && question.explanation.trim()) {
    const explicitAnswer = findExplicitAnswer(question.explanation)
    const correctChoice = normalizeText(choices?.[question.correctAnswer])
    const namesCorrectChoice = Boolean(correctChoice && normalizeText(question.explanation).includes(correctChoice))
    if ((explicitAnswer && explicitAnswer !== question.correctAnswer) || (!explicitAnswer && !namesCorrectChoice)) {
      errors.push(createIssue('EXPLANATION_ANSWER_MISMATCH', 'The explanation does not support the configured answer.', questionId))
    }
  }
}

function validatePart7Duplicates(questions, errors, warnings) {
  const idIndexes = new Map()
  const textIndexes = new Map()
  questions.forEach((question, index) => {
    const id = normalizeText(question?.id)
    const text = normalizeText(question?.question)
    if (id) {
      if (idIndexes.has(id)) errors.push(createIssue('DUPLICATE_ID', `Duplicate id also used at index ${idIndexes.get(id)}.`, question.id))
      else idIndexes.set(id, index)
    }
    if (text) {
      if (textIndexes.has(text)) errors.push(createIssue('DUPLICATE_QUESTION', `Duplicate question text also used at index ${textIndexes.get(text)}.`, question.id))
      else textIndexes.set(text, index)
    }
  })

  for (let left = 0; left < questions.length; left += 1) {
    for (let right = left + 1; right < questions.length; right += 1) {
      const first = normalizeText(questions[left]?.question)
      const second = normalizeText(questions[right]?.question)
      if (first.length < 25 || second.length < 25 || first === second) continue
      const similarity = textSimilarity(first, second)
      if (similarity >= 0.86) {
        warnings.push(createIssue('NEAR_DUPLICATE_QUESTION', `Question text is ${(similarity * 100).toFixed(1)}% similar to ${questions[left]?.id || left}.`, questions[right]?.id, { similarity }))
      }
    }
  }
}

function validatePart7PassageGroups(questions, errors) {
  const groups = new Map()
  for (const question of questions) {
    const passageId = normalizeText(question?.passageId)
    if (!passageId) continue
    if (!groups.has(passageId)) groups.set(passageId, [])
    groups.get(passageId).push(question)
  }
  for (const [passageId, group] of groups) {
    if (group.length < 2 || group.length > 5) {
      errors.push(createIssue('INVALID_PASSAGE_GROUP_SIZE', `Passage ${passageId} must contain 2 to 5 questions.`, group[0]?.id, { count: group.length }))
    }
    const passages = new Set(group.map((question) => normalizeText(question.passage)))
    const documentTypes = new Set(group.map((question) => question.document?.type))
    if (passages.size !== 1 || documentTypes.size !== 1) {
      errors.push(createIssue('INCONSISTENT_PASSAGE_GROUP', `Passage ${passageId} has inconsistent source or document metadata.`, group[0]?.id))
    }
  }
}

function calculatePart7Stats(questions) {
  const answerDistribution = Object.fromEntries(PART7_ANSWER_KEYS.map((key) => [key, 0]))
  const typeDistribution = Object.fromEntries(PART7_TYPES.map((type) => [type, 0]))
  const difficultyDistribution = Object.fromEntries(PART7_DIFFICULTIES.map((difficulty) => [difficulty, 0]))
  const passageIds = new Set()
  for (const question of questions) {
    if (PART7_ANSWER_KEYS.includes(question?.correctAnswer)) answerDistribution[question.correctAnswer] += 1
    if (PART7_TYPES.includes(question?.type)) typeDistribution[question.type] += 1
    if (PART7_DIFFICULTIES.includes(question?.difficulty)) difficultyDistribution[question.difficulty] += 1
    if (normalizeText(question?.passageId)) passageIds.add(normalizeText(question.passageId))
  }
  return { total: questions.length, passages: passageIds.size, answerDistribution, typeDistribution, difficultyDistribution }
}

function validatePart7Distribution(stats, errors, warnings) {
  if (stats.total < 20) return
  const missingAnswers = PART7_ANSWER_KEYS.filter((key) => stats.answerDistribution[key] === 0)
  if (missingAnswers.length) errors.push(createIssue('ANSWER_POSITION_MISSING', `No Part 7 answers use position(s): ${missingAnswers.join(', ')}.`))
  const highestShare = Math.max(...Object.values(stats.answerDistribution)) / stats.total
  if (highestShare > 0.55) errors.push(createIssue('ANSWER_DISTRIBUTION_SKEW', `One Part 7 answer position represents ${(highestShare * 100).toFixed(1)}% of the bank.`))
  const missingDifficulties = PART7_DIFFICULTIES.filter((difficulty) => stats.difficultyDistribution[difficulty] === 0)
  if (missingDifficulties.length) warnings.push(createIssue('DIFFICULTY_COVERAGE', `Part 7 has no ${missingDifficulties.join(', ')} questions.`))
}

export function validatePart7QuestionBank(questionBank, options = {}) {
  const errors = []
  const warnings = []
  const questions = Array.isArray(questionBank) ? questionBank : []
  if (!Array.isArray(questionBank)) errors.push(createIssue('INVALID_BANK', 'Question bank must be an array.'))
  questions.forEach((question, index) => validatePart7Question(question, index, errors))
  validatePart7Duplicates(questions, errors, warnings)
  if (options.checkPassageGroups !== false) validatePart7PassageGroups(questions, errors)
  const stats = calculatePart7Stats(questions)
  if (options.checkDistribution !== false) validatePart7Distribution(stats, errors, warnings)
  return { valid: errors.length === 0, errors, warnings, stats }
}

export function validateUnifiedQuestionIds(questionBank) {
  const errors = []
  const seen = new Map()
  const questions = Array.isArray(questionBank) ? questionBank : []
  if (!Array.isArray(questionBank)) errors.push(createIssue('INVALID_BANK', 'Question bank must be an array.'))
  questions.forEach((question, index) => {
    const id = normalizeText(question?.id)
    if (!id) {
      errors.push(createIssue('MISSING_ID', `Question at index ${index} has no id.`))
    } else if (seen.has(id)) {
      errors.push(createIssue('DUPLICATE_ID', `Duplicate id also used at index ${seen.get(id)}.`, question.id))
    } else {
      seen.set(id, index)
    }
  })
  return { valid: errors.length === 0, errors, stats: { total: questions.length, uniqueIds: seen.size } }
}
