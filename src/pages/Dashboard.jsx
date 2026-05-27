// src/pages/Dashboard.jsx
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';

export default function Dashboard({ currentUser, setCurrentPage, todayRecord, setPracticeFilter }) {
  if (!currentUser) return null;

  // Calculate days left for exam
  const getDaysLeft = (targetDateStr) => {
    if (!targetDateStr) return 0;
    const target = new Date(targetDateStr);
    const today = new Date();
    target.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const daysLeft = getDaysLeft(currentUser.goals?.examDate);

  // Today's actual metrics vs goals
  const wordsGoal = currentUser.goals?.dailyVocabularyGoal || 30;
  const questionsGoal = currentUser.goals?.dailyQuestionGoal || 50;
  const studyGoal = currentUser.goals?.dailyStudyMinutesGoal || 60;
  const reviewsGoal = currentUser.goals?.dailyErrorReviewGoal || 10;

  const wordsDone = todayRecord?.wordsLearned || 0;
  const questionsDone = todayRecord?.questionsAnswered || 0;
  const studyDone = todayRecord?.studyMinutes || 0;
  const reviewsDone = todayRecord?.mistakesReviewed || 0;

  // Calculate general progress percent
  const vocabPercent = Math.min((wordsDone / wordsGoal) * 100, 100);
  const questionsPercent = Math.min((questionsDone / questionsGoal) * 100, 100);
  const studyPercent = Math.min((studyDone / studyGoal) * 100, 100);
  const reviewsPercent = Math.min((reviewsDone / reviewsGoal) * 100, 100);
  const averagePercent = Math.round((vocabPercent + questionsPercent + studyPercent + reviewsPercent) / 4);

  // Total database metrics
  const totalAnswered = currentUser.progress?.totalQuestionsAnswered || 0;
  const totalCorrect = currentUser.progress?.totalCorrect || 0;
  const totalAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  
  const unmasteredWrong = currentUser.wrongBook?.filter(w => w.status !== '已掌握').length || 0;
  const masteredWrong = currentUser.wrongBook?.filter(w => w.status === '已掌握').length || 0;
  const totalWrong = currentUser.wrongBook?.length || 0;

  // Calculate badges
  const streak = currentUser.progress?.streakDays || 0;
  const vocabMastered = Object.values(currentUser.vocabularyProgress || {}).filter(v => v === 'mastered').length;

  const badges = [];
  if (streak >= 3) badges.push({ icon: "🔥", title: "持之以恆", desc: "連續學習 3 天以上" });
  if (streak >= 15) badges.push({ icon: "⚡", title: "自律狂人", desc: "連續學習 15 天以上" });
  if (totalAnswered >= 50) badges.push({ icon: "✏️", title: "刷題高手", desc: "累計做題超過 50 題" });
  if (totalAnswered >= 300) badges.push({ icon: "👑", title: "題庫收割者", desc: "累計做題超過 300 題" });
  if (vocabMastered >= 20) badges.push({ icon: "📚", title: "單字達人", desc: "掌握單字超過 20 個" });
  if (vocabMastered >= 100) badges.push({ icon: "🎓", title: "詞彙大師", desc: "掌握單字超過 100 個" });
  if (totalAccuracy >= 85 && totalAnswered >= 30) badges.push({ icon: "🎯", title: "黃金神射手", desc: "正確率維持 85% 以上" });

  return (
    <div className="flex flex-col gap-3">
      {/* Welcome banner */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
        color: 'white',
        padding: '2.5rem 2rem',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div className="flex justify-between align-center flex-col md:flex-row gap-2">
          <div>
            <span className="badge badge-mastered" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
              TOEIC SPRINT V1.1 PRO
            </span>
            <h1 style={{ color: 'white', fontSize: '2.2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              ✨ 歡迎回來，{currentUser.username}！
            </h1>
            <p style={{ opacity: 0.95, fontSize: '1.05rem', lineHeight: '1.6' }}>
              你的黃金學習目標是突破 <strong style={{ textDecoration: 'underline', color: 'hsl(45, 100%, 60%)', fontSize: '1.15rem' }}>{currentUser.goals?.targetScore} 分</strong>，繼續保持你的自律學習節奏！
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            minWidth: '150px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.9, display: 'block', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>考試倒數</span>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'block', margin: '0.2rem 0' }}>{daysLeft}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>天 (Goal Date)</span>
          </div>
        </div>
      </div>

      {/* Dynamic Smart Study Guide Panel */}
      {averagePercent === 100 ? (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, hsl(148, 70%, 93%), hsl(190, 85%, 93%))', 
          borderLeft: '5px solid var(--success)', 
          padding: '1.5rem 2rem',
          animation: 'fadeIn 0.4s ease-out, float 4s ease-in-out infinite',
          boxShadow: '0 8px 30px rgba(74, 222, 128, 0.15)',
          borderRadius: 'var(--radius-md)'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            🎉 完美達成！今日目標 100% 破關！
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'hsl(148, 70%, 20%)', lineHeight: '1.6', fontWeight: 600 }}>
            太神奇了，{currentUser.username}！你今天成功擊破了所有的每日學習任務目標！✨
            連續自律的種子已播下，你的 TOEIC 分數正在以肉眼可見的速度狂飆！📈 明天也要繼續維持，穩拿金色證書！
          </p>
        </div>
      ) : (
        <div className="card" style={{ 
          borderLeft: '5px solid var(--primary)', 
          backgroundColor: 'var(--primary-light)',
          padding: '1.25rem 1.5rem',
          animation: 'fadeIn 0.4s ease-out',
          borderRadius: 'var(--radius-md)'
        }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 今日學霸衝刺指引
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
            <span>
              系統分析你的當前目標，建議今天優先完成：
              {wordsDone < wordsGoal && ` 📖 研讀 ${wordsGoal - wordsDone} 個核心單字卡、`}
              {questionsDone < questionsGoal && ` ✏️ 進行 ${questionsGoal - questionsDone} 題題目練習、`}
              {reviewsDone < reviewsGoal && unmasteredWrong > 0 && ` 🔄 複習 ${reviewsGoal - reviewsDone} 題錯題本中的題目。`}
              完成後即可維持你的 <strong>{streak + 1} 天</strong> 連續學習完美紀錄！
            </span>
          </p>
        </div>
      )}

      {/* Numerical Stats overview */}
      <div className="grid grid-cols-4">
        <StatCard 
          title="🔥 學習連續天數" 
          value={`${streak} 天`} 
          icon="⚡" 
          color="var(--warning)" 
          subtext="每日做題即可完美維持！"
        />
        <StatCard 
          title="📅 預計考試日期" 
          value={`${currentUser.goals?.examDate || '未設定'}`} 
          icon="⏳" 
          color="var(--secondary)" 
          subtext={`倒數天數: ${daysLeft} 天`}
        />
        <StatCard 
          title="🎯 答題累計正確率" 
          value={`${totalAccuracy}%`} 
          icon="📈" 
          color="var(--success)" 
          subtext={`累計答題: ${totalAnswered} 題`}
        />
        <StatCard 
          title="❌ 錯題本待複習" 
          value={`${unmasteredWrong} 題`} 
          icon="📚" 
          color="var(--danger)" 
          subtext={`已掌握: ${masteredWrong} 題 | 總錯題: ${totalWrong} 題`}
        />
      </div>

      {/* Main Grid: Today's Tasks & Quick Starts */}
      <div className="grid grid-cols-3 gap-3">
        {/* Today's Tasks Card */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="flex justify-between align-center" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}>📅 今日任務達成進度</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>完成進度將寫入你的今日學習日誌</span>
            </div>
            <span className="badge badge-mastered" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem', backgroundColor: 'var(--primary)', color: 'white' }}>
              今日總完成率：{averagePercent}%
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <ProgressBar 
              value={wordsDone} 
              max={wordsGoal} 
              label="📖 TOEIC 核心商務單字庫" 
            />
            <ProgressBar 
              value={questionsDone} 
              max={questionsGoal} 
              label="✏️ TOEIC 日常題目模擬練習" 
            />
            <ProgressBar 
              value={reviewsDone} 
              max={reviewsGoal} 
              label="🔄 錯題本弱點複習" 
            />
            <ProgressBar 
              value={studyDone} 
              max={studyGoal} 
              label="⏱️ 今日學習專注時長 (分鐘)" 
            />
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="card flex flex-col justify-between">
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>⚡ 快速開始練習</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '1.25rem' }}>一鍵開啟對應的專注學習區塊</p>
          </div>
          
          <div className="flex flex-col gap-2" style={{ flex: 1 }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'flex-start' }}
              onClick={() => setCurrentPage('vocabulary')}
            >
              📖 開始單字卡訓練
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'flex-start' }}
              onClick={() => {
                setPracticeFilter('5');
                setCurrentPage('question-practice');
              }}
            >
              ✍️ 開始 Part 5 詞彙文法練習
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'flex-start' }}
              onClick={() => {
                setPracticeFilter('7');
                setCurrentPage('question-practice');
              }}
            >
              📰 開始 Part 7 閱讀理解練習
            </button>
            <button 
              className="btn btn-accent" 
              style={{ width: '100%', justifyContent: 'flex-start' }}
              onClick={() => setCurrentPage('mock-test')}
            >
              📝 進行 Mini 模擬測驗
            </button>
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
              onClick={() => setCurrentPage('wrong-book')}
            >
              ❌ 複習錯題本 ({unmasteredWrong})
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Badges / Achievements Panel */}
      {badges.length > 0 && (
        <div className="card" style={{ marginTop: '0.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>🏆 我的學習成就徽章</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>你的每一分努力，都在這裡留下了閃亮的證明。</p>
          
          <div className="flex gap-2" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {badges.map((badge, idx) => (
              <div 
                key={idx} 
                style={{
                  backgroundColor: 'var(--primary-light)',
                  border: '1px solid hsl(245, 82%, 90%)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  minWidth: '160px',
                  textAlign: 'center',
                  animation: 'float 3s ease-in-out infinite',
                  animationDelay: `${idx * 0.2}s`
                }}
              >
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>{badge.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', display: 'block' }}>{badge.title}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '0.25rem', display: 'block' }}>{badge.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
