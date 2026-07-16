const safeString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;

  try {
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  } catch {
    return '[unavailable]';
  }
};

export function isStaleSessionError(error) {
  if (!error) return false;
  const message = safeString(error.message || error.error_description || error).toLowerCase();
  const code = safeString(error.code).toLowerCase();

  return (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('refresh_token_not_found') ||
    message.includes('invalid_grant') ||
    message.includes('refresh token') ||
    code === 'refresh_token_not_found'
  );
}

export function sanitizeError(error) {
  if (!error) return null;

  if (isStaleSessionError(error)) {
    return {
      message: '登入狀態已失效，請重新登入。',
      code: 'SESSION_EXPIRED',
      details: '本機學習資料未受影響。',
    };
  }

  const diagnostic = [error.message, error.error_description, error.code, error.details]
    .map(safeString)
    .join(' ')
    .toLowerCase();
  const isNetworkFailure = /failed to fetch|network|offline|timeout|timed out|connection/.test(diagnostic);

  return {
    message: '雲端同步暫時失敗，本機資料已保留。',
    code: isNetworkFailure ? 'NETWORK_UNAVAILABLE' : 'SYNC_FAILED',
    details: '請確認網路後重新同步；若持續發生，請稍後再試。',
  };
}
