import { loadMiniMockDraft } from './miniMockDraftRepository.js'
import { loadPracticeDraft } from './practiceDraftRepository.js'

const PRACTICE_TITLES = Object.freeze({
  full_mock: 'Part 5 100 題計時練習',
  part7: 'Part 7 閱讀練習',
})

const countAnswers = (answers) => Object.keys(answers || {}).length

const practiceTitle = (draft) => {
  if (draft.config?.type === 'full_mock') return PRACTICE_TITLES.full_mock
  if (draft.config?.type === 'part7') return PRACTICE_TITLES.part7
  if (draft.config?.category && draft.config.category !== 'all') return 'Part 5 分類練習'
  if (draft.config?.difficulty && draft.config.difficulty !== 'all') return 'Part 5 難度練習'
  return 'Part 5 快速練習'
}

const asPracticeSummary = (draft) => draft && ({
  kind: 'practice',
  title: practiceTitle(draft),
  answeredCount: countAnswers(draft.answers),
  totalQuestions: draft.questionIds.length,
  currentIndex: draft.currentIndex,
  updatedAt: draft.updatedAt,
  config: {
    ...draft.config,
    count: draft.config.requestedCount ?? draft.config.count ?? draft.questionIds.length,
  },
})

const asMiniMockSummary = (draft) => draft && ({
  kind: 'mini_mock',
  title: '20 題文字 Mini Mock',
  answeredCount: countAnswers(draft.answers),
  totalQuestions: draft.questionIds.length,
  currentIndex: draft.currentIndex,
  updatedAt: draft.updatedAt,
  endsAt: draft.endsAt,
})

export function getActiveDraftSummaries(storage = globalThis.localStorage, ownerId = 'guest-local') {
  return [
    asPracticeSummary(loadPracticeDraft(storage, ownerId)),
    asMiniMockSummary(loadMiniMockDraft(storage, ownerId)),
  ]
    .filter(Boolean)
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
}
