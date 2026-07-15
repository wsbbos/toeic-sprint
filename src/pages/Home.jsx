import LearningVisual from '../components/visuals/LearningVisual.jsx';
import VisualAsset from '../components/visuals/VisualAsset.jsx';

// src/pages/Home.jsx

export default function Home({ currentUser, setCurrentPage }) {
  if (!currentUser) return null;

  return (
    <div className="flex flex-col gap-4 practice-container" style={{ marginTop: '1.5rem', maxWidth: '900px', margin: '1.5rem auto' }}>
      
      {/* Brand Hero Card */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
        color: 'white',
        padding: '3rem 2.5rem',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating background design elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '30%', height: '30%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-20%', width: '40%', height: '40%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />

        <VisualAsset className="home-hero-visual" name="hero" alt="TOEIC Sprint 學習進度" priority />
        <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>
          TOEIC Sprint V1.3
        </h1>
        <p style={{ fontSize: '1.15rem', opacity: 0.95, maxWidth: '650px', margin: '0 auto 2rem auto', lineHeight: '1.7' }}>
          目標導向的 TOEIC 訓練與互相監督系統。精準追蹤每日學習進度，從文法、單字卡訓練到文字題模擬考，幫您以最高效率獲取金色證書！
        </p>

        <div className="flex justify-center gap-2 flex-wrap">
          <button 
            type="button" 
            className="btn btn-accent" 
            style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            onClick={() => setCurrentPage('practice-center')}
          >
            開始自主學習
          </button>
          <button 
            type="button" 
            className="btn" 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              color: 'white', 
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '0.85rem 2rem',
              fontSize: '1.05rem'
            }}
            onClick={() => setCurrentPage('dashboard')}
          >
            查看學習總覽
          </button>
        </div>
      </div>

      {/* Honest Version Disclaimer Warning Box */}
      <div className="card" style={{ 
        borderLeft: '5px solid var(--warning)', 
        backgroundColor: 'var(--warning-light)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-md)'
      }}>
        <h3 style={{ fontSize: '1.1rem', color: 'hsl(38, 92%, 35%)', marginBottom: '0.5rem', fontWeight: 700 }}>
          ⚠️ 目前版本限制說明
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'hsl(38, 92%, 20%)', lineHeight: '1.6' }}>
          {currentUser.isGuest ? '訪客模式的學習紀錄會保存在目前瀏覽器；清除網站資料或更換裝置前請留意資料不會自動移轉。' : '登入使用者會優先同步學習紀錄；雲端暫時不可用時，仍會保留本機副本並顯示同步狀態。'}
          此外，由於現階段未引入大型外部音檔與專有版權圖片，<strong>Listening (聽力演練) 與 Mock Test (模擬測驗) 為 Demo 示範用途</strong>，
          其中聽力採瀏覽器語音合成（TTS）朗讀，模擬考則特別重新定位為「文字題 Mini Mock」，以確保數據真實與合法合規。
        </p>
      </div>

      {/* Core Features Grid */}
      <div>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '1rem', fontWeight: 700 }}>
          💡 核心學習模組介紹
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="card flex flex-col gap-1">
            <LearningVisual variant="favorites" size="icon" decorative />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>核心單字卡</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
              精選 TOEIC 常考核心詞彙，支援雙面卡片翻轉記憶、不熟/熟練狀態標記。V1.3 翻面後支援美音發音功能，全面加深字彙聽感！
            </p>
          </div>
          
          <div className="card flex flex-col gap-1">
            <LearningVisual variant="practice" size="icon" decorative />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>文法與閱讀練習</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
              提供完整的 Part 5 單字文法填空與 Part 7 閱讀理解訓練。支援即時批改解析與答錯題目自動收錄，助您精準查漏補缺。
            </p>
          </div>

          <div className="card flex flex-col gap-1">
            <LearningVisual variant="review" size="icon" decorative />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>錯題本弱點複習</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
              專屬您的個人錯題庫。答錯的題目會自動匯入，並支援錯誤原因歸類（單字不會、文法不懂、粗心等）與獨立錯題重練，攻克盲點。
            </p>
          </div>

          <div className="card flex flex-col gap-1">
            <LearningVisual variant="result" size="icon" decorative />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>文字題 Mini Mock</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
              為您提供 20 題極速模擬測驗，專注於 Part 5 與 Part 7 題型，不夾雜缺失圖片音檔的虛假功能，考後自動生成分數報告。
            </p>
          </div>

          <div className="card flex flex-col gap-1">
            <LearningVisual variant="weakness" size="icon" decorative />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>個人學習總覽</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
              全新 V1.3 大幅整合了原本冗餘的儀表板與統計頁面。將單字、題量、答題正確率、各 Part 佔比、考點弱點與歷史紀錄全面聚合展現。
            </p>
          </div>

          <div className="card flex flex-col gap-1">
            <LearningVisual variant="hero" size="icon" decorative />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>戰友互相監督</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
              支援多個本機帳號之間的達成率、學習天數與模擬考高分排行榜，同舟共濟，互相激勵！
            </p>
          </div>
        </div>
      </div>

      {/* Target Audience Section */}
      <div className="card" style={{ marginTop: '0.5rem', backgroundColor: 'var(--primary-light)' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.75rem', fontWeight: 700 }}>
          🎯 誰最適合使用 TOEIC Sprint？
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
          <div>
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>👉 目標導向的高效衝刺者</strong>
            每天需要有明確進度指標（每日單字、做題量、專注時間），要求實時進度條推動的自律型學員。
          </div>
          <div>
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>👉 錯題複習至上的細節控</strong>
            熱衷於整理錯題本、歸納錯誤原因，不願再重複踏入同一個文法陷阱的細緻學習者。
          </div>
        </div>
      </div>

    </div>
  );
}
