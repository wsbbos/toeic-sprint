const LEGACY_DRAFT_KEY = 'toeic-sprint:practice-draft:v1'
const DRAFT_KEY_PREFIX = 'toeic-sprint:practice-draft:v2:'
const DEFAULT_OWNER_ID = 'guest-local'
const VALID_CHOICES = new Set(['A', 'B', 'C', 'D'])

const normalizeOwnerId = (ownerId) => (
  typeof ownerId === 'string' && ownerId.trim() ? ownerId.trim() : DEFAULT_OWNER_ID
)

const getDraftKey = (ownerId) => `${DRAFT_KEY_PREFIX}${encodeURIComponent(normalizeOwnerId(ownerId))}`

const validIsoDate = (value) => (
  typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null
)

export function normalizePracticeDraft(value, ownerId = DEFAULT_OWNER_ID) {
  if (!value || typeof value !== 'object' || value.status !== 'active') return null

  const questionIds = [...new Set(
    (Array.isArray(value.questionIds) ? value.questionIds : [])
      .filter((id) => typeof id === 'string' && id.trim())
      .map((id) => id.trim()),
  )]
  const startedAt = validIsoDate(value.startedAt)
  if (!questionIds.length || !startedAt) return null

  const allowedQuestionIds = new Set(questionIds)
  const answers = Object.fromEntries(
    Object.entries(value.answers && typeof value.answers === 'object' ? value.answers : {})
      .filter(([questionId, choice]) => allowedQuestionIds.has(questionId) && VALID_CHOICES.has(choice)),
  )
  const markedQuestionIds = [...new Set(
    (Array.isArray(value.markedQuestionIds) ? value.markedQuestionIds : [])
      .filter((questionId) => allowedQuestionIds.has(questionId)),
  )]
  const requestedIndex = Number.parseInt(value.currentIndex, 10)
  const currentIndex = Number.isFinite(requestedIndex)
    ? Math.min(Math.max(0, requestedIndex), questionIds.length - 1)
    : 0
  const config = value.config && typeof value.config === 'object' ? value.config : {}

  return {
    ...value,
    id: typeof value.id === 'string' && value.id ? value.id : `practice-${Date.parse(startedAt)}`,
    version: 2,
    ownerId: normalizeOwnerId(ownerId),
    config: { ...config, count: questionIds.length },
    questionIds,
    answers,
    markedQuestionIds,
    currentIndex,
    startedAt,
    updatedAt: validIsoDate(value.updatedAt) || startedAt,
    submittedAt: null,
    status: 'active',
    result: null,
  }
}

const parseDraft = (serialized, ownerId) => {
  try {
    return normalizePracticeDraft(JSON.parse(serialized || 'null'), ownerId)
  } catch {
    return null
  }
}

export function loadPracticeDraft(storage = globalThis.localStorage, ownerId = DEFAULT_OWNER_ID) {
  const normalizedOwnerId = normalizeOwnerId(ownerId)
  try {
    const scopedDraft = parseDraft(storage?.getItem(getDraftKey(normalizedOwnerId)), normalizedOwnerId)
    if (scopedDraft) return scopedDraft

    if (normalizedOwnerId !== DEFAULT_OWNER_ID) return null
    const legacyDraft = parseDraft(storage?.getItem(LEGACY_DRAFT_KEY), normalizedOwnerId)
    if (!legacyDraft) return null

    try {
      storage?.setItem(getDraftKey(normalizedOwnerId), JSON.stringify(legacyDraft))
      storage?.removeItem(LEGACY_DRAFT_KEY)
    } catch {
      // A repaired in-memory draft is still safe to use when migration persistence fails.
    }
    return legacyDraft
  } catch {
    return null
  }
}

export function savePracticeDraft(session, storage = globalThis.localStorage, ownerId = session?.ownerId || DEFAULT_OWNER_ID) {
  try {
    const normalized = normalizePracticeDraft(session, ownerId)
    if (!normalized) return false
    storage?.setItem(getDraftKey(ownerId), JSON.stringify(normalized))
    return true
  } catch {
    return false
  }
}

export function clearPracticeDraft(storage = globalThis.localStorage, ownerId = DEFAULT_OWNER_ID) {
  try {
    const normalizedOwnerId = normalizeOwnerId(ownerId)
    storage?.removeItem(getDraftKey(normalizedOwnerId))
    if (normalizedOwnerId === DEFAULT_OWNER_ID) storage?.removeItem(LEGACY_DRAFT_KEY)
    return true
  } catch {
    return false
  }
}
