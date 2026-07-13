const DRAFT_KEY = 'toeic-sprint:practice-draft:v1'

export function loadPracticeDraft(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem(DRAFT_KEY) || 'null')
    return parsed && Array.isArray(parsed.questionIds) && parsed.status === 'active' ? parsed : null
  } catch {
    return null
  }
}

export function savePracticeDraft(session, storage = globalThis.localStorage) {
  try {
    if (session?.status === 'active') storage?.setItem(DRAFT_KEY, JSON.stringify(session))
    return true
  } catch {
    return false
  }
}

export function clearPracticeDraft(storage = globalThis.localStorage) {
  try {
    storage?.removeItem(DRAFT_KEY)
    return true
  } catch {
    return false
  }
}
