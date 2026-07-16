export const CLOUD_USER_KEY = 'toeic_sprint_cloud_user';
export const LEGACY_USERS_KEY = 'toeic_sprint_users';

const resolveStorage = (storage) => {
  try {
    return storage || globalThis.localStorage || null;
  } catch {
    return null;
  }
};

export function loadJson(storage, key, fallback = null) {
  const target = resolveStorage(storage);
  try {
    const raw = target?.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJson(storage, key, value) {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadCachedUser(storage) {
  const value = loadJson(storage, CLOUD_USER_KEY, null);
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

export function saveCachedUser(storage, user) {
  const target = resolveStorage(storage);
  if (!target) return false;
  if (user) return saveJson(target, CLOUD_USER_KEY, user);
  try {
    target.removeItem(CLOUD_USER_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadLegacyUsers(storage) {
  const value = loadJson(storage, LEGACY_USERS_KEY, []);
  return Array.isArray(value) ? value : [];
}

export function getLegacyImportKey(userId) {
  return `toeic_sprint_imported_for_${userId}`;
}

export function hasImportedLegacyData(storage, userId) {
  if (!userId) return false;
  try {
    return resolveStorage(storage)?.getItem(getLegacyImportKey(userId)) === 'true';
  } catch {
    return false;
  }
}

export function markLegacyDataImported(storage, userId) {
  if (!userId) return false;
  try {
    const target = resolveStorage(storage);
    if (!target) return false;
    target.setItem(getLegacyImportKey(userId), 'true');
    return true;
  } catch {
    return false;
  }
}

const isOwnedAuthKey = (key) => (
  key.startsWith('sb-')
  || key.startsWith('supabase.auth.')
  || key === CLOUD_USER_KEY
  || key.startsWith('toeic_sprint_imported_for_')
);

export function clearAuthStorage(storage) {
  const target = resolveStorage(storage);
  if (!target) return false;

  try {
    const keys = Array.from({ length: target.length }, (_, index) => target.key(index))
      .filter((key) => typeof key === 'string' && isOwnedAuthKey(key));
    let cleared = true;
    for (const key of keys) {
      try {
        target.removeItem(key);
      } catch {
        cleared = false;
      }
    }
    return cleared;
  } catch {
    return false;
  }
}