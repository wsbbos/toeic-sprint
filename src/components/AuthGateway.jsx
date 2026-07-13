import Login from '../pages/Login.jsx'
import { isSupabaseConfigured } from '../lib/supabase.js'

export default function AuthGateway({ onLoginSuccess, onGuestLogin }) {
  return (
    <main className="practice-container flex flex-col gap-3" style={{ marginTop: '2rem' }}>
      <section className="card" style={{ textAlign: 'center' }}>
        <span className="badge badge-mastered">Local-first</span>
        <h1 style={{ margin: '.75rem 0 .4rem' }}>先以訪客模式開始</h1>
        <p style={{ color: 'var(--text-sub)' }}>核心練習、錯題、收藏與學習紀錄都可在此裝置使用；登入後再啟用跨裝置同步。</p>
        <button data-testid="guest-entry" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={onGuestLogin}>進入訪客模式</button>
        {!isSupabaseConfigured && <p className="offline-notice" role="status">雲端服務尚未設定，目前將安全使用本機儲存。</p>}
      </section>
      {isSupabaseConfigured && <Login onLoginSuccess={onLoginSuccess} />}
    </main>
  )
}
