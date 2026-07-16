import { normalizeUserProfile } from '../data/userProfile.js';
import { calculateStudyStreak, updateReviewSchedule } from './learningInsightsService.js';

export const WRONG_STATUS = Object.freeze({
  UNLEARNED: '\u672A\u7406\u89E3',
  REVIEWING: '\u8907\u7FD2\u4E2D',
  MASTERED: '\u5DF2\u638C\u63E1',
});

const cloneProfile = (user) => normalizeUserProfile(
  typeof structuredClone === 'function'
    ? structuredClone(user || {})
    : JSON.parse(JSON.stringify(user || {})),
);

const dateKey = (now) => now.toISOString().split('T')[0];

const getOrCreateDailyRecord = (user, now) => {
  const date = dateKey(now);
  let record = user.dailyRecords.find((item) => item.date === date);
  if (!record) {
    record = {
      date,
      wordsLearned: 0,
      questionsAnswered: 0,
      studyMinutes: 0,
      mistakesReviewed: 0,
    };
    user.dailyRecords.push(record);
  }
  return record;
};

export function recordPracticeAnswer(
  user,
  question,
  userAnswer,
  isCorrect,
  now = new Date(),
) {
  const next = cloneProfile(user);
  next.progress.totalQuestionsAnswered += 1;
  next.progress[isCorrect ? 'totalCorrect' : 'totalWrong'] += 1;

  if (!isCorrect) {
    const existing = next.wrongBook.find((item) => item.questionId === question.id);
    if (existing) {
      existing.wrongCount = (existing.wrongCount || 1) + 1;
      existing.status = WRONG_STATUS.UNLEARNED;
      Object.assign(existing, updateReviewSchedule(existing, false, now));
      existing.userAnswer = userAnswer;
      existing.lastAnsweredAt = now.toISOString();
    } else {
      next.wrongBook.push({
        questionId: question.id,
        part: question.part,
        question: question.question,
        passage: question.passage || '',
        choices: { ...(question.choices || {}) },
        userAnswer,
        correctAnswer: question.correctAnswer || question.answer,
        explanation: question.explanation,
        tags: [...(question.tags || [])],
        difficulty: question.difficulty || 'medium',
        wrongCount: 1,
        reviewCount: 0,
        status: WRONG_STATUS.UNLEARNED,
        createdAt: now.toISOString(),
        lastAnsweredAt: now.toISOString(),
        lastReviewedAt: null,
        nextReviewAt: new Date(now.getTime() + 86400000).toISOString(),
        reviewLevel: 0,
        mastery: 0,
      });
    }
  }

  const todayRecord = getOrCreateDailyRecord(next, now);
  todayRecord.questionsAnswered += 1;
  todayRecord.correctAnswers = (todayRecord.correctAnswers || 0) + (isCorrect ? 1 : 0);
  todayRecord.wrongAnswers = (todayRecord.wrongAnswers || 0) + (isCorrect ? 0 : 1);
  todayRecord.studyMinutes += 1;
  next.progress.totalStudyMinutes += 1;
  next.progress.streakDays = calculateStudyStreak(next.dailyRecords, now);
  next.practiceHistory.push({
    questionId: question.id,
    part: question.part,
    category: question.category || question.type || '',
    difficulty: question.difficulty || 'medium',
    tags: [...(question.tags || [])],
    isCorrect,
    userAnswer,
    answeredAt: now.toISOString(),
    date: dateKey(now),
  });

  return next;
}

export function recordPracticeOutcomes(user, outcomes = [], now = new Date()) {
  return outcomes.reduce((current, outcome) => {
    if (!outcome?.question || !outcome.userAnswer) return current;
    return recordPracticeAnswer(
      current,
      outcome.question,
      outcome.userAnswer,
      outcome.isCorrect,
      now,
    );
  }, user);
}

export function recordMockResult(user, result, now = new Date()) {
  const next = cloneProfile(user);
  if (result?.id && next.mockTestHistory.some((entry) => entry.id === result.id)) return next;
  const unansweredCount = Math.max(0, Number(result.unansweredCount) || 0);
  const answeredCount = Number.isFinite(Number(result.answeredCount))
    ? Math.max(0, Number(result.answeredCount))
    : Math.max(0, Number(result.totalQuestions) - unansweredCount);
  const wrongItems = (result.wrongList || []).filter((item) => item?.userAnswer && item.userAnswer !== '無作答');
  next.mockTestHistory.push({
    id: result.id,
    date: result.date,
    mode: result.mode,
    totalQuestions: result.totalQuestions,
    correctCount: result.correctCount,
    wrongCount: result.wrongCount,
    score: result.score,
    timeSpent: result.timeSpent,
    answeredCount,
    unansweredCount,
  });
  next.progress.totalQuestionsAnswered += answeredCount;
  next.progress.totalCorrect += result.correctCount;
  next.progress.totalWrong += result.wrongCount;

  wrongItems.forEach((wrongItem) => {
    const existing = next.wrongBook.find((item) => item.questionId === wrongItem.questionId);
    if (existing) {
      existing.wrongCount = (existing.wrongCount || 1) + 1;
      existing.status = WRONG_STATUS.UNLEARNED;
    } else {
      next.wrongBook.push({
        ...wrongItem,
        wrongCount: 1,
        reviewCount: 0,
        status: WRONG_STATUS.UNLEARNED,
        createdAt: now.toISOString(),
        lastReviewedAt: null,
      });
    }
  });

  const todayRecord = getOrCreateDailyRecord(next, now);
  todayRecord.questionsAnswered += answeredCount;
  todayRecord.studyMinutes += Math.round(result.timeSpent / 60);

  (result.questionOutcomes || [])
    .filter((outcome) => outcome.status !== 'unanswered' && outcome.userAnswer !== '')
    .forEach((outcome) => {
    next.practiceHistory.push({
      questionId: outcome.questionId,
      part: outcome.part,
      category: outcome.category || '',
      difficulty: outcome.difficulty || 'medium',
      tags: [...(outcome.tags || [])],
      isCorrect: outcome.isCorrect,
      answeredAt: now.toISOString(),
      date: result.date || dateKey(now),
    });
    });

  return next;
}

export function updateVocabularyStatus(user, wordId, status, now = new Date()) {
  const next = cloneProfile(user);
  const previousStatus = next.vocabularyProgress[wordId];
  next.vocabularyProgress[wordId] = status;

  if (previousStatus !== 'mastered' && status === 'mastered') {
    next.progress.learnedVocabularyCount += 1;
    const todayRecord = getOrCreateDailyRecord(next, now);
    todayRecord.wordsLearned += 1;
    todayRecord.studyMinutes += 1;
  } else if (previousStatus === 'mastered' && status !== 'mastered') {
    next.progress.learnedVocabularyCount = Math.max(
      0,
      next.progress.learnedVocabularyCount - 1,
    );
    const todayRecord = getOrCreateDailyRecord(next, now);
    todayRecord.wordsLearned = Math.max(0, todayRecord.wordsLearned - 1);
  }

  return next;
}

export function updateWrongReason(user, questionId, reason) {
  const next = cloneProfile(user);
  const item = next.wrongBook.find((entry) => entry.questionId === questionId);
  if (item) item.errorReason = reason;
  return next;
}

export function updateWrongStatus(user, questionId, status, now = new Date()) {
  const next = cloneProfile(user);
  const item = next.wrongBook.find((entry) => entry.questionId === questionId);
  if (item) {
    item.status = status;
    item.lastReviewedAt = now.toISOString();
    if (status === WRONG_STATUS.MASTERED) {
      item.reviewCount = (item.reviewCount || 0) + 1;
    }
  }
  return next;
}

export function removeWrongQuestion(user, questionId) {
  const next = cloneProfile(user);
  next.wrongBook = next.wrongBook.filter((entry) => entry.questionId !== questionId);
  return next;
}

export function recordRetake(user, questionId, isCorrect, now = new Date()) {
  const next = cloneProfile(user);
  const item = next.wrongBook.find((entry) => entry.questionId === questionId);
  if (item) {
    Object.assign(item, updateReviewSchedule(item, isCorrect, now));
    item.reviewCount = (item.reviewCount || 0) + 1;
    item.lastReviewedAt = now.toISOString();
    if (isCorrect) {
      item.status = WRONG_STATUS.MASTERED;
    } else {
      item.status = WRONG_STATUS.UNLEARNED;
      item.wrongCount = (item.wrongCount || 0) + 1;
    }
  }

  const todayRecord = getOrCreateDailyRecord(next, now);
  todayRecord.questionsAnswered += 1;
  todayRecord.studyMinutes += 1;
  todayRecord.mistakesReviewed += 1;
  todayRecord.correctAnswers = (todayRecord.correctAnswers || 0) + (isCorrect ? 1 : 0);
  todayRecord.wrongAnswers = (todayRecord.wrongAnswers || 0) + (isCorrect ? 0 : 1);
  next.progress.totalStudyMinutes += 1;
  next.progress.streakDays = calculateStudyStreak(next.dailyRecords, now);
  return next;
}

export function toggleFavorite(user, question) {
  const next = cloneProfile(user);
  const exists = next.favorites.some((item) => item.questionId === question.id);
  next.favorites = exists ? next.favorites.filter((item) => item.questionId !== question.id) : [...next.favorites, { questionId: question.id, question: question.question, part: question.part, category: question.category || '', addedAt: new Date().toISOString() }];
  return next;
}

export function resetLearningData(user) {
  const next = cloneProfile(user);
  next.progress = {
    ...next.progress,
    streakDays: 0,
    totalQuestionsAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalStudyMinutes: 0,
    learnedVocabularyCount: 0,
  };
  next.vocabularyProgress = {};
  next.wrongBook = [];
  next.favorites = [];
  next.practiceHistory = [];
  next.mockTestHistory = [];
  next.dailyRecords = [];
  return next;
}
