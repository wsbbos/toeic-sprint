export const CLOUD_USER_KEY = 'toeic_sprint_cloud_user';
export const LEGACY_USERS_KEY = 'toeic_sprint_users';

const resolveStorage = (storage) => storage || globalThis.localStorage;

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
  if (!user) {
    target.removeItem(CLOUD_USER_KEY);
    return true;
  }
  return saveJson(target, CLOUD_USER_KEY, user);
}

export function loadLegacyUsers(storage) {
  const value = loadJson(storage, LEGACY_USERS_KEY, []);
  return Array.isArray(value) ? value : [];
}

export function getLegacyImportKey(userId) {
  return `toeic_sprint_imported_for_${userId}`;
}

export function hasImportedLegacyData(storage, userId) {
  return resolveStorage(storage)?.getItem(getLegacyImportKey(userId)) === 'true';
}

export function markLegacyDataImported(storage, userId) {
  if (!userId) return;
  resolveStorage(storage)?.setItem(getLegacyImportKey(userId), 'true');
}

export function clearAuthStorage(storage) {
  const target = resolveStorage(storage);
  if (!target) return;

  const keys = Array.from({ length: target.length }, (_, index) => target.key(index))
    .filter(Boolean);

  keys
    .filter((key) => (
      key.startsWith('sb-') ||
      key.includes('supabase') ||
      key.includes('auth') ||
      key === CLOUD_USER_KEY ||
      key.startsWith('toeic_sprint_imported_for_')
    ))
    .forEach((key) => target.removeItem(key));
}
