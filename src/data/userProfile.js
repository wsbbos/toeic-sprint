/**
 * @typedef {Object} UserProfile
 * @property {string} [id]
 * @property {string} [email]
 * @property {boolean} [isGuest]
 * @property {string} username
 * @property {string} createdAt
 * @property {string} [dataUpdatedAt]
 * @property {Record<string, any>} goals
 * @property {Record<string, any>} progress
 * @property {Record<string, any>} vocabularyProgress
 * @property {any[]} wrongBook
 * @property {any[]} favorites
 * @property {any[]} practiceHistory
 * @property {any[]} mockTestHistory
 * @property {any[]} dailyRecords
 */
export const DEFAULT_GOALS = Object.freeze({
  targetScore: 700,
  examDate: '',
  dailyVocabularyGoal: 30,
  dailyQuestionGoal: 30,
  dailyStudyMinutesGoal: 45,
  dailyErrorReviewGoal: 10,
  weeklyMockTestGoal: 1,
});

export const DEFAULT_PROGRESS = Object.freeze({
  streakDays: 0,
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  totalWrong: 0,
  totalStudyMinutes: 0,
  learnedVocabularyCount: 0,
});

export const PROFILE_RETENTION_LIMITS = Object.freeze({
  practiceHistory: 2000,
  mockTestHistory: 100,
  dailyRecords: 730,
});

const isRecord = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const asRecord = (value) => isRecord(value) ? value : {};
const nonNegativeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
const positiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const copyObjectArray = (value) => (
  Array.isArray(value)
    ? value.filter(isRecord).map((item) => ({ ...item }))
    : []
);

const normalizeGoals = (value) => {
  const source = asRecord(value);
  return {
    ...DEFAULT_GOALS,
    ...source,
    targetScore: positiveNumber(source.targetScore, DEFAULT_GOALS.targetScore),
    examDate: typeof source.examDate === 'string' ? source.examDate : DEFAULT_GOALS.examDate,
    dailyVocabularyGoal: positiveNumber(source.dailyVocabularyGoal, DEFAULT_GOALS.dailyVocabularyGoal),
    dailyQuestionGoal: positiveNumber(source.dailyQuestionGoal, DEFAULT_GOALS.dailyQuestionGoal),
    dailyStudyMinutesGoal: positiveNumber(source.dailyStudyMinutesGoal, DEFAULT_GOALS.dailyStudyMinutesGoal),
    dailyErrorReviewGoal: positiveNumber(source.dailyErrorReviewGoal, DEFAULT_GOALS.dailyErrorReviewGoal),
    weeklyMockTestGoal: positiveNumber(source.weeklyMockTestGoal, DEFAULT_GOALS.weeklyMockTestGoal),
  };
};

const normalizeProgress = (value) => {
  const source = asRecord(value);
  return {
    ...DEFAULT_PROGRESS,
    ...source,
    streakDays: nonNegativeNumber(source.streakDays),
    totalQuestionsAnswered: nonNegativeNumber(source.totalQuestionsAnswered),
    totalCorrect: nonNegativeNumber(source.totalCorrect),
    totalWrong: nonNegativeNumber(source.totalWrong),
    totalStudyMinutes: nonNegativeNumber(source.totalStudyMinutes),
    learnedVocabularyCount: nonNegativeNumber(source.learnedVocabularyCount),
  };
};

const dedupeByQuestionId = (value) => {
  const byQuestion = new Map();
  for (const item of copyObjectArray(value)) {
    const questionId = typeof item.questionId === 'string' ? item.questionId : '';
    if (!questionId) continue;
    const existing = byQuestion.get(questionId);
    byQuestion.set(questionId, existing ? {
      ...existing,
      ...item,
      wrongCount: Math.max(nonNegativeNumber(existing.wrongCount), nonNegativeNumber(item.wrongCount)),
      reviewCount: Math.max(nonNegativeNumber(existing.reviewCount), nonNegativeNumber(item.reviewCount)),
      mastery: Math.max(nonNegativeNumber(existing.mastery), nonNegativeNumber(item.mastery)),
    } : item);
  }
  return [...byQuestion.values()];
};

const dedupeFavorites = (value) => {
  const byQuestion = new Map();
  for (const item of copyObjectArray(value)) {
    const questionId = typeof item.questionId === 'string' ? item.questionId : '';
    if (!questionId) continue;
    byQuestion.set(questionId, { ...(byQuestion.get(questionId) || {}), ...item });
  }
  return [...byQuestion.values()];
};

const DAILY_NUMBER_FIELDS = [
  'wordsLearned',
  'questionsAnswered',
  'studyMinutes',
  'mistakesReviewed',
  'correctAnswers',
  'wrongAnswers',
];

const normalizeDailyRecords = (value) => {
  const byDate = new Map();
  for (const item of copyObjectArray(value)) {
    const date = typeof item.date === 'string' ? item.date : '';
    if (!date) continue;
    const existing = byDate.get(date) || { date };
    const normalized = { ...existing, ...item, date };
    for (const field of DAILY_NUMBER_FIELDS) {
      normalized[field] = Math.max(
        nonNegativeNumber(existing[field]),
        nonNegativeNumber(item[field]),
      );
    }
    byDate.set(date, normalized);
  }
  return [...byDate.values()].slice(-PROFILE_RETENTION_LIMITS.dailyRecords);
};

/**
 * @param {Partial<UserProfile> & Record<string, any>} [overrides]
 * @returns {UserProfile}
 */
export function createDefaultUserProfile(overrides = {}) {
  const source = asRecord(overrides);
  return {
    ...source,
    createdAt: typeof source.createdAt === 'string' && source.createdAt
      ? source.createdAt
      : new Date().toISOString(),
    username: typeof source.username === 'string' && source.username.trim()
      ? source.username.trim()
      : 'TOEIC Sprint Learner',
    goals: normalizeGoals(source.goals),
    progress: normalizeProgress(source.progress),
    vocabularyProgress: { ...asRecord(source.vocabularyProgress) },
    wrongBook: dedupeByQuestionId(source.wrongBook),
    favorites: dedupeFavorites(source.favorites),
    practiceHistory: copyObjectArray(source.practiceHistory).slice(-PROFILE_RETENTION_LIMITS.practiceHistory),
    mockTestHistory: copyObjectArray(source.mockTestHistory).slice(-PROFILE_RETENTION_LIMITS.mockTestHistory),
    dailyRecords: normalizeDailyRecords(source.dailyRecords),
  };
}

/**
 * @param {Partial<UserProfile> & Record<string, any>} [overrides]
 * @returns {UserProfile}
 */
export function createGuestProfile(overrides = {}) {
  return createDefaultUserProfile({ id: 'guest-local', username: '訪客學員', isGuest: true, ...overrides });
}

/**
 * @param {unknown} [user]
 * @returns {UserProfile}
 */
export function normalizeUserProfile(user = {}) {
  const source = isRecord(user)
    ? /** @type {Partial<UserProfile> & Record<string, any>} */ (user)
    : {};
  return createDefaultUserProfile(source);
}
