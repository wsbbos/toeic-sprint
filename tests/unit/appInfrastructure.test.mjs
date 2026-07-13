import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearAuthStorage,
  loadCachedUser,
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
    'custom-auth-cache': 'secret',
    toeic_sprint_cloud_user: '{}',
    toeic_sprint_imported_for_123: 'true',
    toeic_sprint_practice_draft: '{"answers":{}}',
  });

  clearAuthStorage(storage);

  assert.equal(storage.getItem('sb-demo-auth-token'), null);
  assert.equal(storage.getItem('custom-auth-cache'), null);
  assert.equal(storage.getItem('toeic_sprint_cloud_user'), null);
  assert.equal(storage.getItem('toeic_sprint_imported_for_123'), null);
  assert.equal(storage.getItem('toeic_sprint_practice_draft'), '{"answers":{}}');
});

test('error sanitizer masks tokens and Supabase project URLs', () => {
  const sanitized = sanitizeError({
    message: 'Request eyJhbGciOiJIUzI1NiJ9.payload.signature failed at https://private-project.supabase.co',
    code: 'PGRST301',
    details: 'refresh token missing',
  });

  assert.equal(sanitized.code, 'PGRST301');
  assert.equal(sanitized.message.includes('private-project'), false);
  assert.equal(sanitized.message.includes('eyJhbGci'), false);
  assert.equal(sanitized.message.includes('[PROTECTED_JWT]'), true);
  assert.equal(isStaleSessionError({ code: 'refresh_token_not_found' }), true);
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
