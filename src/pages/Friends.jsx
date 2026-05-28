// src/pages/Friends.jsx
import { useState } from 'react';

export default function Friends({ currentUser }) {
  const [subscribed, setSubscribed] = useState(false);

  if (!currentUser) return null;

  // Extract active user statistics safely
  const streak = currentUser.progress?.streakDays || 0;
  const totalAnswered = currentUser.progress?.totalQuestionsAnswered || 0;
  const totalCorrect = currentUser.progress?.totalCorrect || 0;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const vocabMastered = currentUser.progress?.learnedVocabularyCount || 0;
  const targetScore = currentUser.goals?.targetScore || 700;

  const mockTestHistory = currentUser.mockTestHistory || [];
  const mockHighScore = mockTestHistory.length > 0
    ? Math.max(...mockTestHistory.map(h => h.score))
    : 0;

  // Calculate today's record numbers
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = currentUser.dailyRecords?.find(r => r.date === todayStr) || {
    wordsLearned: 0,
    questionsAnswered: 0,
    studyMinutes: 0
  };

  const wordsGoal = currentUser.goals?.dailyVocabularyGoal || 30;
  const questionsGoal = currentUser.goals?.dailyQuestionGoal || 50;
  const studyGoal = currentUser.goals?.dailyStudyMinutesGoal || 60;

  const wP = Math.min((todayRecord.wordsLearned / wordsGoal) * 100, 100);
  const qP = Math.min((todayRecord.questionsAnswered / questionsGoal) * 100, 100);
  const sP = Math.min((todayRecord.studyMinutes / studyGoal) * 100, 100);
  const completionRate = Math.round((wP + qP + sP) / 3);

  return (
    <div className="flex flex-col gap-3 practice-container" style={{ maxWidth: '850px', margin: '0 auto' }}>
      
      {/* Cloud Announcement Header Banner */}
      <div className="card" style={{ 
        borderLeft: '5px solid var(--secondary)', 
        backgroundColor: 'var(--secondary-light)',
        padding: '1.5rem',
        borderRadius: 'var(--radius-md)'
      }}>
        <span className="badge badge-review" style={{ marginBottom: '0.5rem', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
          CLOUD ACCUMULATION COOP 👥
        </span>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
          🤝 雲端互相監督系統
        </h1>
        <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600, marginTop: '0.5rem' }}>
          📢 狀態聲明：目前跨裝置互相監督功能正在進行雲端重構，系統已停止顯示舊版「本機假帳號排行榜」以確保學習數據真實度。
        </div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
          <strong>下一版將支援建立讀書小隊、邀請朋友加入、查看彼此真實學習進度。</strong> 我們正全力打造多租戶 Supabase RLS 安全社交組隊機制，讓您能邀請真人考友一同組隊，互相監督衝刺進度！
        </p>
      </div>

      {/* Active User's Own Cloud Study Summary */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>
            👤 我的雲端學習摘要 (My Cloud Profile)
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>帳號信箱: {currentUser.email}</span>
        </div>

        <div className="grid grid-cols-4 gap-2" style={{ marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: 'hsl(220, 10%, 98%)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>連續學習</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.25rem' }}>🔥 {streak} 天</div>
          </div>
          <div className="card" style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: 'hsl(220, 10%, 98%)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>今日任務</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>🎯 {completionRate}%</div>
          </div>
          <div className="card" style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: 'hsl(220, 10%, 98%)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>累積答題數</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>✏️ {totalAnswered} 題</div>
          </div>
          <div className="card" style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: 'hsl(220, 10%, 98%)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>模擬考最高分</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.25rem' }}>🏆 {mockHighScore > 0 ? `${mockHighScore}分` : '尚未測驗'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3" style={{ fontSize: '0.875rem', color: 'var(--text-main)', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div>
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>👉 今日任務進度統計：</strong>
            • 核心單字已學：{todayRecord.wordsLearned} 字 (目標 {wordsGoal} 字)<br />
            • 答題訓練已做：{todayRecord.questionsAnswered} 題 (目標 {questionsGoal} 題)<br />
            • 專注讀書時間：{todayRecord.studyMinutes} 分鐘 (目標 {studyGoal} 分鐘)
          </div>
          <div>
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>👉 個人學習目標設定：</strong>
            • 當前目標 TOEIC 分數：<strong>{targetScore} 分</strong><br />
            • 整體累計做題正確率：<strong>{accuracy}%</strong><br />
            • 已標記掌握核心單字：<strong>{vocabMastered} 字</strong>
          </div>
        </div>
      </div>

      {/* Premium Mockup/Preview Box of Cloud Teams Feature */}
      <div className="card" style={{ 
        position: 'relative', 
        padding: '2.5rem 2rem', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, hsl(220, 15%, 96%), hsl(220, 10%, 91%))',
        border: '1px dashed var(--border-color)'
      }}>
        {/* Subtle Watermark Blur Backdrop */}
        <div style={{ 
          fontSize: '4.5rem', 
          display: 'block', 
          marginBottom: '0.5rem',
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))',
          animation: 'float 3.5s ease-in-out infinite' 
        }}>
          🔒
        </div>
        
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          👥 讀書小隊雲端排行榜 (Preview)
        </h3>
        
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-sub)', 
          maxWidth: '520px', 
          margin: '0 auto 1.5rem auto',
          lineHeight: '1.6' 
        }}>
          未來的讀書小隊頁面將為您呈現組隊考友的每日實時數據排行榜！小隊隊友上線打卡、完成每日目標、或是模擬考取得金色證書，您都能第一時間同步掌握，同舟共濟衝刺高分。
        </p>

        {/* Locked Placeholder List Mockup */}
        <div style={{ 
          opacity: 0.35, 
          maxWidth: '450px', 
          margin: '0 auto 1.5rem auto', 
          pointerEvents: 'none',
          filter: 'blur(1.5px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'white',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
            <span>排名</span>
            <span>隊友</span>
            <span>今日進度</span>
          </div>
          <div style={{ display: 'flex', justify: 'space-between', paddingTop: '0.5rem' }}>
            <span>🥇 1</span>
            <span>Alex (戰友)</span>
            <span>95% (🔥12天)</span>
          </div>
          <div style={{ display: 'flex', justify: 'space-between', paddingTop: '0.5rem' }}>
            <span>🥈 2</span>
            <span>Sarah (戰友)</span>
            <span>80% (🔥25天)</span>
          </div>
        </div>

        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => {
            setSubscribed(true);
            alert('🔔 訂閱成功！感謝您的期待，我們將在下一個版本（V2.2）優先發布真人社交組隊小隊機制！');
          }}
          disabled={subscribed}
        >
          {subscribed ? '✓ 已訂閱新功能通知' : '🔔 搶先訂閱小隊功能發布通知'}
        </button>
      </div>

    </div>
  );
}
