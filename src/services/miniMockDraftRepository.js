const KEY_PREFIX = 'toeic-sprint:mini-mock-draft:v1:'
const DEFAULT_OWNER_ID = 'guest-local'
const VALID_CHOICES = new Set(['A', 'B', 'C', 'D'])

const normalizeOwnerId = (ownerId) => (
  typeof ownerId === 'string' && ownerId.trim() ? ownerId.trim() : DEFAULT_OWNER_ID
)
const getKey = (ownerId) => `${KEY_PREFIX}${encodeURIComponent(normalizeOwnerId(ownerId))}`
const validDate = (value) => (
  typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null
)

export function createMiniMockDraft(questionIds, ownerId = DEFAULT_OWNER_ID, now = new Date(), durationSeconds = 15 * 60) {
  const startedAt = now.toISOString()
  return {
    version: 1,
    ownerId: normalizeOwnerId(ownerId),
    status: 'active',
    questionIds: [...questionIds],
    answers: {},
    currentIndex: 0,
    startedAt,
    endsAt: new Date(now.getTime() + Math.max(1, Number(durationSeconds) || 1) * 1000).toISOString(),
    updatedAt: startedAt,
  }
}

export function normalizeMiniMockDraft(value, ownerId = DEFAULT_OWNER_ID) {
  if (!value || typeof value !== 'object' || value.status !== 'active') return null
  const questionIds = [...new Set(
    (Array.isArray(value.questionIds) ? value.questionIds : [])
      .filter((id) => typeof id === 'string' && id.trim())
      .map((id) => id.trim()),
  )]
  const startedAt = validDate(value.startedAt)
  const endsAt = validDate(value.endsAt)
  if (!questionIds.length || !startedAt || !endsAt || Date.parse(endsAt) < Date.parse(startedAt)) return null

  const allowedIds = new Set(questionIds)
  const answers = Object.fromEntries(
    Object.entries(value.answers && typeof value.answers === 'object' ? value.answers : {})
      .filter(([questionId, choice]) => allowedIds.has(questionId) && VALID_CHOICES.has(choice)),
  )
  const requestedIndex = Number.parseInt(value.currentIndex, 10)

  return {
    version: 1,
    ownerId: normalizeOwnerId(ownerId),
    status: 'active',
    questionIds,
    answers,
    currentIndex: Number.isFinite(requestedIndex)
      ? Math.min(Math.max(0, requestedIndex), questionIds.length - 1)
      : 0,
    startedAt,
    endsAt,
    updatedAt: validDate(value.updatedAt) || startedAt,
  }
}

export function loadMiniMockDraft(storage = globalThis.localStorage, ownerId = DEFAULT_OWNER_ID) {
  try {
    return normalizeMiniMockDraft(JSON.parse(storage?.getItem(getKey(ownerId)) || 'null'), ownerId)
  } catch {
    return null
  }
}

export function saveMiniMockDraft(draft, storage = globalThis.localStorage, ownerId = draft?.ownerId || DEFAULT_OWNER_ID) {
  try {
    const normalized = normalizeMiniMockDraft(draft, ownerId)
    if (!normalized) return false
    storage?.setItem(getKey(ownerId), JSON.stringify(normalized))
    return true
  } catch {
    return false
  }
}

export function clearMiniMockDraft(storage = globalThis.localStorage, ownerId = DEFAULT_OWNER_ID) {
  try {
    storage?.removeItem(getKey(ownerId))
    return true
  } catch {
    return false
  }
}