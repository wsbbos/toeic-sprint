import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearAuthStorage,
  hasImportedLegacyData,
  loadCachedUser,
  markLegacyDataImported,
  saveCachedUser,
} from '../../src/services/localUserRepository.js';
import { buildPublicStats } from '../../src/services/cloudUserService.js';
import {
  isStaleSessionError,
  sanitizeError,
} from '../../src/utils/errorSanitizer.js';
import {
  createDefaultUserProfile,
  normalizeUserProfile,
} from '../../src/data/userProfile.js';
import {
  recordPracticeAnswer,
  resetLearningData,
} from '../../src/services/userProgressService.js';

class MemoryStorage {
  constructor(entries = {}) {
    this.entries = new Map(Object.entries(entries));
  }

  get length() {
    return this.entries.size;
  }

  key(index) {
    return [...this.entries.keys()][index] ?? null;
  }

  getItem(key) {
    return this.entries.has(key) ? this.entries.get(key) : null;
  }

  setItem(key, value) {
    this.entries.set(key, String(value));
  }

  removeItem(key) {
    this.entries.delete(key);
  }

  clear() {
    this.entries.clear();
  }
}

test('cached user repository survives malformed JSON and round-trips valid users', () => {
  const storage = new MemoryStorage({ toeic_sprint_cloud_user: '{broken' });

  assert.equal(loadCachedUser(storage), null);

  saveCachedUser(storage, { id: 'guest', username: 'Guest' });
  assert.deepEqual(loadCachedUser(storage), { id: 'guest', username: 'Guest' });
});

test('auth cleanup removes auth material without deleting practice drafts', () => {
  const storage = new MemoryStorage({
    'sb-demo-auth-token': 'secret',
    'custom-auth-cache': 'unrelated application data',
    toeic_sprint_author_notes: 'must survive logout',
    toeic_sprint_cloud_user: '{}',
    toeic_sprint_imported_for_123: 'true',
    toeic_sprint_practice_draft: '{"answers":{}}',
  });

  clearAuthStorage(storage);

  assert.equal(storage.getItem('sb-demo-auth-token'), null);
  assert.equal(storage.getItem('custom-auth-cache'), 'unrelated application data');
  assert.equal(storage.getItem('toeic_sprint_author_notes'), 'must survive logout');
  assert.equal(storage.getItem('toeic_sprint_cloud_user'), null);
  assert.equal(storage.getItem('toeic_sprint_imported_for_123'), null);
  assert.equal(storage.getItem('toeic_sprint_practice_draft'), '{"answers":{}}');
});

test('storage denial never crashes cache cleanup or legacy-import checks', () => {
  const deniedStorage = {
    get length() { throw new Error('SECURITY_ERR'); },
    getItem() { throw new Error('SECURITY_ERR'); },
    setItem() { throw new Error('QUOTA_ERR'); },
    removeItem() { throw new Error('SECURITY_ERR'); },
  };

  assert.equal(loadCachedUser(deniedStorage), null);
  assert.equal(saveCachedUser(deniedStorage, null), false);
  assert.equal(hasImportedLegacyData(deniedStorage, 'u1'), false);
  assert.equal(markLegacyDataImported(deniedStorage, 'u1'), false);
  assert.equal(clearAuthStorage(deniedStorage), false);
});

test('error sanitizer masks tokens and Supabase project URLs', () => {
  const sanitized = sanitizeError({
    message: 'Request eyJhbGciOiJIUzI1NiJ9.payload.signature failed at https://private-project.supabase.co',
    code: 'PGRST301',
    details: 'refresh token missing',
  });

  assert.equal(sanitized.code, 'SYNC_FAILED');
  assert.equal(sanitized.message, '雲端同步暫時失敗，本機資料已保留。');
  assert.equal(JSON.stringify(sanitized).includes('private-project'), false);
  assert.equal(JSON.stringify(sanitized).includes('eyJhbGci'), false);
  assert.equal(isStaleSessionError({ code: 'refresh_token_not_found' }), true);
  const circular = {};
  circular.self = circular;
  assert.doesNotThrow(() => sanitizeError({ message: circular }));
});

test('default user profiles are normalized without sharing mutable collections', () => {
  const first = createDefaultUserProfile({ username: 'Wei Sheng' });
  const second = createDefaultUserProfile({ username: 'Another' });
  first.wrongBook.push({ questionId: 'p5-001' });

  assert.equal(second.wrongBook.length, 0);
  assert.equal(first.goals.dailyQuestionGoal, 30);

  const normalized = normalizeUserProfile({ id: 'u1', progress: { totalCorrect: 2 } });
  assert.equal(normalized.progress.totalCorrect, 2);
  assert.equal(normalized.progress.totalWrong, 0);
  assert.deepEqual(normalized.practiceHistory, []);
});

test('recordPracticeAnswer creates an immutable progress and wrong-book update', () => {
  const original = createDefaultUserProfile({ id: 'u1', username: 'Wei Sheng' });
  const question = {
    id: 'p5-001',
    part: 5,
    question: 'The report was completed -------.',
    choices: { A: 'careful', B: 'carefully', C: 'care', D: 'caring' },
    correctAnswer: 'B',
    explanation: 'An adverb modifies completed.',
    difficulty: 'easy',
    tags: ['word form'],
  };

  const updated = recordPracticeAnswer(original, question, 'A', false, new Date('2026-07-13T08:00:00Z'));

  assert.equal(original.progress.totalQuestionsAnswered, 0);
  assert.equal(updated.progress.totalQuestionsAnswered, 1);
  assert.equal(updated.progress.totalWrong, 1);
  assert.equal(updated.wrongBook.length, 1);
  assert.equal(updated.wrongBook[0].status, '\u672A\u7406\u89E3');
  assert.equal(updated.dailyRecords[0].date, '2026-07-13');
  assert.equal(updated.practiceHistory.length, 1);

  const cleared = resetLearningData(updated);
  assert.equal(cleared.wrongBook.length, 0);
  assert.equal(cleared.progress.totalQuestionsAnswered, 0);
  assert.equal(updated.wrongBook.length, 1);
});

test('public stats projection is deterministic and contains no private profile data', () => {
  const profile = createDefaultUserProfile({
    id: 'u1',
    email: 'private@example.com',
    username: 'Wei Sheng',
    goals: { dailyVocabularyGoal: 10, dailyQuestionGoal: 20, dailyStudyMinutesGoal: 30 },
    progress: { streakDays: 4, totalQuestionsAnswered: 80 },
    wrongBook: [{ questionId: 'p5-001' }],
    dailyRecords: [{
      date: '2026-07-13',
      wordsLearned: 5,
      questionsAnswered: 10,
      studyMinutes: 15,
    }],
    mockTestHistory: [{ score: 760 }, { score: 820 }],
  });

  const stats = buildPublicStats(profile, 'u1', new Date('2026-07-13T08:00:00Z'));
  assert.deepEqual(stats, {
    user_id: 'u1',
    display_name: 'Wei Sheng',
    streak_days: 4,
    today_completion_rate: 50,
    total_questions_answered: 80,
    total_wrong_count: 1,
    mock_high_score: 820,
    updated_at: '2026-07-13T08:00:00.000Z',
  });
  assert.equal(JSON.stringify(stats).includes('private@example.com'), false);
});

test('corrupted legacy profile fields are repaired before progress mutations', () => {
  const corrupted = {
    id: 'u1',
    goals: 'invalid',
    progress: { totalQuestionsAnswered: 'not-a-number', totalCorrect: -4 },
    wrongBook: [null, { questionId: 'p5-001', wrongCount: 1 }, { questionId: 'p5-001', wrongCount: 3 }],
    favorites: [{ questionId: 'p5-001' }, { questionId: 'p5-001' }, 'invalid'],
    dailyRecords: [null, { date: '2026-07-16', questionsAnswered: 'bad' }, { date: '2026-07-16', questionsAnswered: 5 }],
  };

  const normalized = normalizeUserProfile(corrupted);
  assert.equal(normalized.goals.dailyQuestionGoal, 30);
  assert.equal(normalized.progress.totalQuestionsAnswered, 0);
  assert.equal(normalized.progress.totalCorrect, 0);
  assert.equal(normalized.wrongBook.length, 1);
  assert.equal(normalized.wrongBook[0].wrongCount, 3);
  assert.equal(normalized.favorites.length, 1);
  assert.equal(normalized.dailyRecords.length, 1);
  assert.equal(normalized.dailyRecords[0].questionsAnswered, 5);

  assert.doesNotThrow(() => recordPracticeAnswer(
    corrupted,
    { id: 'p5-002', part: 5, question: 'Safe mutation', choices: {}, correctAnswer: 'A' },
    'B',
    false,
    new Date('2026-07-16T12:00:00Z'),
  ));
});
