// src/pages/MockTest.jsx

export default function MockTest({ setCurrentPage, onStartMockTest }) {
  const handleStartMini = () => {
    onStartMockTest('mini');
    setCurrentPage('mock-test-active'); // will build the active exam page
  };


  return (
    <div className="flex flex-col gap-3 practice-container">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '3rem' }}>📝</span>
        <h1 style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>文字題 Mini Mock 中心</h1>
        <p style={{ color: 'var(--text-sub)' }}>20 題混合文法與閱讀的限時自我檢測；用途與 Part 5 100 題計時練習不同。</p>
      </div>

      {/* Mini Mock Test Card */}
      <div className="card flex justify-between align-center" style={{ borderLeft: '5px solid var(--primary)' }}>
        <div style={{ flex: 1, paddingRight: '1.5rem' }}>
          <span className="badge badge-mastered" style={{ marginBottom: '0.5rem' }}>推薦入門 ⚡</span>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>20 題文字 Mini Mock</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)', lineHeight: '1.4' }}>
            Part 5 共 12 題、Part 7 共 8 題，限時 15 分鐘，適合快速檢查混合閱讀能力。
          </p>
          <div style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600, marginTop: '0.4rem' }}>
            ⚠️ 說明：目前系統為文字精簡版，沒有包含正式 TOEIC 官方圖片與音檔，本測驗僅包含純文字閱讀與文法理解題，供日常快速實力檢測。
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleStartMini}>
          開始測驗 ➔
        </button>
      </div>

      {/* Full Mock Test Card */}
      <div className="card flex justify-between align-center" style={{ borderLeft: '5px solid var(--border-color)', opacity: 0.6, backgroundColor: 'var(--bg-card)' }}>
        <div style={{ flex: 1, paddingRight: '1.5rem' }}>
          <span className="badge" style={{ marginBottom: '0.5rem', backgroundColor: 'var(--border-color)', color: 'var(--text-sub)' }}>即將推出 Coming Soon 🏆</span>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.25rem', color: 'var(--text-sub)' }}>完整 200 題模擬考（規劃中）</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
            規劃涵蓋聽力 100 題與閱讀 100 題、總作答時間 120 分鐘；目前尚未提供，請勿與上方 Mini Mock 混淆。
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>
            <span>🎧 Listening: 100 題 (即將推出)</span>
            <span>📖 Reading: 100 題 (即將推出)</span>
            <span>⏱️ 時間: 120 分鐘</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="btn btn-outline" disabled style={{ cursor: 'not-allowed' }}>
            即將推出
          </button>
        </div>
      </div>

      {/* Mock Exam Rules */}
      <div className="card" style={{ backgroundColor: 'hsl(220, 10%, 97%)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>⚠️ 考場規則說明</h3>
        <ul style={{ fontSize: '0.85rem', color: 'var(--text-sub)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
          <li>本文字題 Mini Mock 模擬考計時器啟動後，中途無法暫停，請確保有充足的時間作答。</li>
          <li>作答過程中「不會」顯示任何即時解析或正誤提示，交卷後方可查看結果與精美解析報告。</li>
          <li>交卷後，答錯題目會匯入「錯題本」；未作答會獨立列出，不納入弱點或熟練度。</li>
          <li>考試結果會顯示非官方區間估計，僅供本次練習比較，不代表正式 TOEIC 成績。</li>
        </ul>
      </div>
    </div>
  );
}
