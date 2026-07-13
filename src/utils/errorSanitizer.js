const JWT_PATTERN = /ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g;
const SUPABASE_URL_PATTERN = /https:\/\/[A-Za-z0-9-]+\.supabase\.co/g;

const protectValue = (value) => {
  if (!value) return '';
  const source = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return source
    .replace(JWT_PATTERN, '[PROTECTED_JWT]')
    .replace(SUPABASE_URL_PATTERN, '[PROTECTED_SUPABASE_URL]');
};

export function sanitizeError(error) {
  if (!error) return null;
  return {
    message: protectValue(error.message || error.error_description || '\u672A\u77E5\u932F\u8AA4'),
    code: protectValue(error.code || 'UNKNOWN_CODE'),
    details: protectValue(error.details || '\u7121\u8A73\u7D30\u8CC7\u8A0A'),
  };
}

export function isStaleSessionError(error) {
  if (!error) return false;
  const message = String(error.message || error.error_description || error || '').toLowerCase();
  const code = String(error.code || '').toLowerCase();

  return (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('refresh_token_not_found') ||
    message.includes('invalid_grant') ||
    message.includes('refresh token') ||
    code === 'refresh_token_not_found'
  );
}
