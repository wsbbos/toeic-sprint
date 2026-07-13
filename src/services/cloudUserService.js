import { createDefaultUserProfile, normalizeUserProfile } from '../data/userProfile.js';

export function toCloudAppData(user) {
  const appData = normalizeUserProfile(user);
  delete appData.id;
  delete appData.email;
  delete appData.isGuest;
  return appData;
}

export async function upsertProfile(client, authUser, username) {
  return client
    .from('profiles')
    .upsert({
      id: authUser.id,
      email: authUser.email,
      username: username || authUser.email?.split('@')[0] || 'Learner',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
}

export async function fetchCloudUser(client, authUser) {
  const { data, error } = await client
    .from('user_data')
    .select('app_data')
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (error) throw error;
  if (!data?.app_data) return null;

  return normalizeUserProfile({
    id: authUser.id,
    email: authUser.email,
    username: data.app_data.username || authUser.email?.split('@')[0],
    ...data.app_data,
  });
}

export async function saveCloudUser(client, user, now = new Date()) {
  if (!user?.id) {
    throw new Error('A user id is required for cloud sync');
  }

  const { error } = await client
    .from('user_data')
    .upsert({
      user_id: user.id,
      app_data: toCloudAppData(user),
      updated_at: now.toISOString(),
    }, { onConflict: 'user_id' });

  if (error) throw error;
}

export async function fetchOrCreateCloudUser(client, authUser, username) {
  const existing = await fetchCloudUser(client, authUser);
  if (existing) return { user: existing, created: false };

  const user = createDefaultUserProfile({
    id: authUser.id,
    email: authUser.email,
    username: username || authUser.email?.split('@')[0] || 'Learner',
  });
  await saveCloudUser(client, user);
  return { user, created: true };
}

const safePercentage = (value, goal) => {
  if (!Number.isFinite(goal) || goal <= 0) return 0;
  return Math.min((Number(value || 0) / goal) * 100, 100);
};

export function buildPublicStats(user, userId, now = new Date()) {
  const date = now.toISOString().split('T')[0];
  const today = (user.dailyRecords || []).find((record) => record.date === date) || {};
  const goals = user.goals || {};
  const completion = [
    safePercentage(today.wordsLearned, goals.dailyVocabularyGoal || 30),
    safePercentage(today.questionsAnswered, goals.dailyQuestionGoal || 50),
    safePercentage(today.studyMinutes, goals.dailyStudyMinutesGoal || 60),
  ];
  const mockScores = (user.mockTestHistory || [])
    .map((entry) => Number(entry.score))
    .filter(Number.isFinite);

  return {
    user_id: userId,
    display_name: user.username || user.email?.split('@')[0] || 'Learner',
    streak_days: Number(user.progress?.streakDays || 0),
    today_completion_rate: Math.round(
      completion.reduce((total, value) => total + value, 0) / completion.length,
    ),
    total_questions_answered: Number(user.progress?.totalQuestionsAnswered || 0),
    total_wrong_count: Number(user.wrongBook?.length || 0),
    mock_high_score: mockScores.length > 0 ? Math.max(...mockScores) : 0,
    updated_at: now.toISOString(),
  };
}

export async function syncPublicStats(client, user, userId = user?.id, now = new Date()) {
  if (!client || !user || !userId) return { skipped: true };
  const { error } = await client
    .from('user_public_stats')
    .upsert(buildPublicStats(user, userId, now), { onConflict: 'user_id' });

  if (error) throw error;
  return { skipped: false };
}

export async function signOutWithTimeout(client, timeoutMs = 3_000) {
  if (!client) return;
  let timer;
  try {
    await Promise.race([
      client.auth.signOut({ scope: 'local' }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('SIGNOUT_TIMEOUT')), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
