import { createDefaultUserProfile, normalizeUserProfile } from '../data/userProfile.js';
const parseTimestamp = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const collectActivityTimestamps = (user) => {
  const values = [user?.dataUpdatedAt];
  for (const item of user?.practiceHistory || []) values.push(item?.answeredAt, item?.submittedAt);
  for (const item of user?.wrongBook || []) values.push(item?.lastAnsweredAt, item?.lastReviewedAt, item?.createdAt);
  for (const item of user?.favorites || []) values.push(item?.addedAt);
  for (const item of user?.mockTestHistory || []) values.push(item?.submittedAt, item?.date);
  for (const item of user?.dailyRecords || []) values.push(item?.date);
  return values.map(parseTimestamp).filter(Number.isFinite);
};

export function getProfileUpdatedAt(user) {
  const timestamps = collectActivityTimestamps(user);
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : '';
}

export function stampProfileUpdate(user, now = new Date()) {
  const normalized = normalizeUserProfile(user);
  return { ...normalized, dataUpdatedAt: now.toISOString() };
}

export function selectNewestUserProfile(localUser, cloudUser) {
  if (!localUser) return { source: 'cloud', user: normalizeUserProfile(cloudUser) };
  if (!cloudUser) return { source: 'local', user: normalizeUserProfile(localUser) };

  const local = normalizeUserProfile(localUser);
  const cloud = normalizeUserProfile(cloudUser);
  if (!local.id || !cloud.id || local.id !== cloud.id || local.isGuest) {
    return { source: 'cloud', user: cloud };
  }

  const localTimestamp = parseTimestamp(getProfileUpdatedAt(local)) ?? -1;
  const cloudTimestamp = parseTimestamp(getProfileUpdatedAt(cloud)) ?? -1;
  return localTimestamp > cloudTimestamp
    ? { source: 'local', user: local }
    : { source: 'cloud', user: cloud };
}

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
    .select('app_data, updated_at')
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (error) throw error;
  if (!data?.app_data) return null;

  return normalizeUserProfile({
    ...data.app_data,
    id: authUser.id,
    email: authUser.email,
    username: data.app_data.username || authUser.email?.split('@')[0],
    dataUpdatedAt: getProfileUpdatedAt(data.app_data) || data.updated_at || '',
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

export async function fetchOrCreateCloudUser(
  client,
  authUser,
  username,
  localUser = null,
  now = new Date(),
) {
  const localCandidate = localUser?.id === authUser.id && !localUser.isGuest
    ? normalizeUserProfile({
      ...localUser,
      id: authUser.id,
      email: authUser.email,
      username: localUser.username || username || authUser.email?.split('@')[0] || 'Learner',
    })
    : null;
  const existing = await fetchCloudUser(client, authUser);

  if (existing) {
    const resolved = selectNewestUserProfile(localCandidate, existing);
    if (resolved.source === 'local') {
      const user = stampProfileUpdate(resolved.user, now);
      await saveCloudUser(client, user, now);
      return { user, created: false, source: 'local' };
    }
    return { user: resolved.user, created: false, source: 'cloud' };
  }

  const user = stampProfileUpdate(localCandidate || createDefaultUserProfile({
    id: authUser.id,
    email: authUser.email,
    username: username || authUser.email?.split('@')[0] || 'Learner',
  }), now);
  await saveCloudUser(client, user, now);
  return { user, created: true, source: localCandidate ? 'local' : 'created' };
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
