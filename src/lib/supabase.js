import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Env debug checking (Do not leak keys!)
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Config check (Dev Mode):', {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseAnonKey
  });
}

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing in environment configuration. Application will render fallback instructions screen.');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const getSupabaseDebugInfo = () => {
  return {
    mode: import.meta.env.MODE || 'unknown',
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPrefixOk: supabaseUrl ? supabaseUrl.startsWith('https://') : false,
    isSbPublishable: supabaseAnonKey ? supabaseAnonKey.startsWith('sb_publishable_') : false,
    isJwtFormat: supabaseAnonKey ? supabaseAnonKey.startsWith('eyJ') : false
  };
};
