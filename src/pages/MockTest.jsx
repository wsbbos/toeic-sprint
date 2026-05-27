// src/pages/MockTest.jsx

export default function MockTest({ setCurrentPage, onStartMockTest }) {
  const handleStartMini = () => {
    onStartMockTest('mini');
    setCurrentPage('mock-test-active'); // will build the active exam page
  };

  const handleStartFull = () => {
    alert('目前題庫不足 200 題，請先使用 Mini Mock Test 或新增更多題目。');
  };

  return (
    <div className="flex flex-col gap-3 practice-container">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '3rem' }}>📝</span>
        <h1 style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>TOEIC 模擬考試中心</h1>
        <p style={{ color: 'var(--text-sub)' }}>擬真模擬考場規則，考試中不顯示答案，交卷後自動批改並生成詳細分析報告。</p>
      </div>

      {/* Mini Mock Test Card */}
      <div className="card flex justify-between align-center" style={{ borderLeft: '5px solid var(--primary)' }}>
        <div style={{ flex: 1, paddingRight: '1.5rem' }}>
          <span className="badge badge-mastered" style={{ marginBottom: '0.5rem' }}>推薦入門 ⚡</span>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Mini Mock Test (極速模擬考)</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>
            精選 20 題模擬考題 (包含聽力題與閱讀理解)，15 分鐘作答時間。適合檢測當前學習水平與測試系統。
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleStartMini}>
          開始測驗 ➔
        </button>
      </div>

      {/* Full Mock Test Card */}
      <div className="card flex justify-between align-center" style={{ borderLeft: '5px solid var(--secondary)', opacity: 0.85 }}>
        <div style={{ flex: 1, paddingRight: '1.5rem' }}>
          <span className="badge badge-review" style={{ marginBottom: '0.5rem' }}>黃金規格 🏆</span>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Full Mock Test (完整模擬考)</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>
            比照官方 200 題完整規格。聽力 100 題 (45 分鐘) + 閱讀 100 題 (75 分鐘)。總作答時間 120 分鐘。
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>
            <span>🎧 Listening: 100 題</span>
            <span>📖 Reading: 100 題</span>
            <span>⏱️ 時間: 120 分鐘</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={handleStartFull}>
            架構預覽
          </button>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', textAlign: 'center' }}>V1 提示: 題庫不足200題</span>
        </div>
      </div>

      {/* Mock Exam Rules */}
      <div className="card" style={{ backgroundColor: 'hsl(220, 10%, 97%)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>⚠️ 考場規則說明</h3>
        <ul style={{ fontSize: '0.85rem', color: 'var(--text-sub)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
          <li>模擬考計時器啟動後，中途無法暫停，請確保有充足的時間作答。</li>
          <li>作答過程中「不會」顯示任何即時解析或正誤提示，交卷後方可查看結果。</li>
          <li>交卷後，所有答錯題目將自動匯入至「錯題本」，以便後續追蹤。</li>
          <li>考試結果將生成估算分數 (10-990分) 並列入學習數據統計中。</li>
        </ul>
      </div>
    </div>
  );
}
