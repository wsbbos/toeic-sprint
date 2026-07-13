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

export function normalizeUserProfile(user = {}) {
  return createDefaultUserProfile(user && typeof user === 'object' ? user : {});
}
