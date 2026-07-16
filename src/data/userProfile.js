/**
 * @typedef {Object} UserProfile
 * @property {string} [id]
 * @property {string} [email]
 * @property {boolean} [isGuest]
 * @property {string} username
 * @property {string} createdAt
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

const copyArray = (value) => (Array.isArray(value) ? value.map((item) => (
  item && typeof item === 'object' ? { ...item } : item
)) : []);

/**
 * @param {Partial<UserProfile> & Record<string, any>} [overrides]
 * @returns {UserProfile}
 */
export function createDefaultUserProfile(overrides = {}) {
  return {
    username: 'TOEIC Sprint Learner',
    createdAt: overrides.createdAt || new Date().toISOString(),
    ...overrides,
    goals: {
      ...DEFAULT_GOALS,
      ...(overrides.goals || {}),
    },
    progress: {
      ...DEFAULT_PROGRESS,
      ...(overrides.progress || {}),
    },
    vocabularyProgress: { ...(overrides.vocabularyProgress || {}) },
    wrongBook: copyArray(overrides.wrongBook),
    favorites: copyArray(overrides.favorites),
    practiceHistory: copyArray(overrides.practiceHistory),
    mockTestHistory: copyArray(overrides.mockTestHistory),
    dailyRecords: copyArray(overrides.dailyRecords),
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
  const source = user && typeof user === 'object'
    ? /** @type {Partial<UserProfile> & Record<string, any>} */ (user)
    : {};
  return createDefaultUserProfile(source);
}
