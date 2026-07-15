import ExplanationPanel from '../components/explanations/ExplanationPanel.jsx';
import EmptyLearningState from '../components/visuals/EmptyLearningState.jsx';
import VisualAsset from '../components/visuals/VisualAsset.jsx';


export default function Result({ setCurrentPage, activeMockResult }) {
  if (!activeMockResult) {
    return (
      <main className="practice-container">
        <EmptyLearningState variant="empty" title="沒有最近的模擬考紀錄" description="完成一次文字題 Mini Mock 後，這裡會顯示成績、弱點與逐題解析。" actionLabel="返回儀表板" onAction={() => setCurrentPage('dashboard')} />
      </main>
    );
  }

  const { 
    mode, 
    totalQuestions, 
    correctCount, 
    score, 
    listeningCorrect = 0, 
    listeningTotal = 0, 
    readingCorrect = 0, 
    readingTotal = 0, 
    timeSpent, 
    wrongCount, 
    wrongList = [] 
  } = activeMockResult;

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const estimateLow = Math.max(10, Math.floor((score - 35) / 5) * 5);
  const estimateHigh = Math.min(990, Math.ceil((score + 35) / 5) * 5);
  const lAccuracy = listeningTotal > 0 ? Math.round((listeningCorrect / listeningTotal) * 100) : 0;
  const rAccuracy = readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 100) : 0;

  // Calculate dynamic weakness tags of incorrect answers
  const tagMap = {};
  wrongList.forEach(q => {
    (q.tags || []).forEach(tag => {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    });
  });

  const sortedWeaknessTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Display top 5 weakness tags

  return (
    <div className="practice-container">
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '1.5rem' }}>
        <VisualAsset className="result-hero-visual" name="result" decorative />
        <h1 style={{ fontSize: '1.8rem', marginTop: '0.5rem', color: 'var(--success)' }}>模擬考試已完成！</h1>
        <p style={{ color: 'var(--text-sub)' }}>{mode} 結果與能力評估報告</p>

        {/* Scaled Score Circle */}
        <div style={{ margin: '2rem 0' }}>
          <div style={{ 
            display: 'inline-flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            width: '170px', 
            height: '170px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: 'white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.9, letterSpacing: '1px' }}>非官方區間估計</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: '1' }}>{estimateLow}–{estimateHigh}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: '6px', maxWidth: '130px' }}>僅依本次 Mini Mock 換算，不代表正式 TOEIC 成績</span>
          </div>
        </div>

        {/* Score Grid details */}
        <div className="grid grid-cols-4 gap-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>聽力題</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-sub)' }}>{listeningTotal > 0 ? `${lAccuracy}%` : '未納入'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>Mini Mock 目前以文字題為主</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>閱讀正確率</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--secondary)' }}>{rAccuracy}%</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>{readingCorrect} / {readingTotal} 題</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>總答對題數</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{correctCount} / {totalQuestions}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>總正確率: {accuracy}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>作答消耗時間</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {Math.floor(timeSpent / 60)} 分 {timeSpent % 60} 秒
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>本次作答時間紀錄</div>
          </div>
        </div>
      </div>

      {/* Dynamic Weakness Tags Analysis */}
      {sortedWeaknessTags.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '5px solid var(--warning)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>⚠️ 本次考試主要弱點分析</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '1rem' }}>
            系統分析了您作答錯誤題目的標籤分類，以下是您失分最多的前幾項考點：
          </p>
          <div className="flex flex-col gap-2">
            {sortedWeaknessTags.map(([tag, count], idx) => (
              <div key={idx} className="flex justify-between align-center" style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: 'hsl(38, 92%, 96%)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--warning)' }}>
                  🎯 {tag}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                  答錯 {count} 題
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mistakes list in Mock */}
      {wrongList.length > 0 && (
        <div id="mock-mistakes-section" className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>❌ 本次測驗錯題摘要 ({wrongCount})</h2>
          <div className="flex flex-col gap-2">
            {wrongList.map((item, idx) => (
              <ExplanationPanel
                key={item.questionId || idx}
                question={item}
                userAnswer={item.userAnswer}
                correctAnswer={item.correctAnswer}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-2">
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
          const el = document.getElementById('mock-mistakes-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            alert('本次測驗沒有錯題，恭喜獲得滿分！');
          }
        }}>
          🔎 查看錯題
        </button>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentPage('mock-test-active')}>
          🔄 再考一次
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setCurrentPage('dashboard')}>
          🏠 回 Dashboard
        </button>
      </div>
    </div>
  );
}
