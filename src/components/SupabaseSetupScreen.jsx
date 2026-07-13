export default function SupabaseSetupScreen({ debugInfo }) {
  return (
    <main className="setup-screen">
      <section className="card setup-card" aria-labelledby="setup-title">
        <span className="setup-icon" aria-hidden="true">⚠️</span>
        <h1 id="setup-title">Supabase 環境變數尚未設定</h1>
        <p>
          雲端登入版需要公開的專案 URL 與 anon key。請在本機或 Vercel 設定後重新整理。
          請勿在前端放入 service role key。
        </p>

        <dl className="setup-variable-list">
          <div>
            <dt>VITE_SUPABASE_URL</dt>
            <dd>{debugInfo.hasUrl ? '已設定' : '未設定'}</dd>
          </div>
          <div>
            <dt>VITE_SUPABASE_ANON_KEY</dt>
            <dd>{debugInfo.hasKey ? '已設定' : '未設定'}</dd>
          </div>
          <div>
            <dt>MODE</dt>
            <dd>{debugInfo.mode}</dd>
          </div>
          <div>
            <dt>HTTPS URL</dt>
            <dd>{debugInfo.urlPrefixOk ? '有效' : '待確認'}</dd>
          </div>
        </dl>

        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          重新整理
        </button>
      </section>
    </main>
  );
}
