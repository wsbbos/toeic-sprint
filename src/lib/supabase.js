import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function isValidHttpUrl(value) {
  if (!value || /your[-_ ]|example|placeholder/i.test(value)) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

const hasCandidateConfig = isValidHttpUrl(supabaseUrl) && Boolean(supabaseAnonKey && supabaseAnonKey.length >= 20);
let client = null;
if (hasCandidateConfig) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    client = null;
  }
}

export const supabase = client;
export const isSupabaseConfigured = Boolean(client);

export const getSupabaseDebugInfo = () => ({
  mode: import.meta.env.MODE || 'unknown',
  hasUrl: Boolean(supabaseUrl),
  hasKey: Boolean(supabaseAnonKey),
  urlPrefixOk: isValidHttpUrl(supabaseUrl),
  isSbPublishable: supabaseAnonKey ? supabaseAnonKey.startsWith('sb_publishable_') : false,
  isJwtFormat: supabaseAnonKey ? supabaseAnonKey.startsWith('eyJ') : false
});
