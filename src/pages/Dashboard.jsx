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
    const diffTime = target.getTime() - today.getTime();
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
  
  const wrongList = currentUser.wrongBook || [];
  const unmasteredWrong = wrongList.filter(w => w.status !== '已掌握').length;
  const masteredWrong = wrongList.filter(w => w.status === '已掌握').length;
  const totalWrong = wrongList.length;

  const streak = currentUser.progress?.streakDays || 0;
  const vocabMastered = Object.values(currentUser.vocabularyProgress || {}).filter(v => v === 'mastered').length;

  // 1. Calculate dynamic Part accuracy using practiceHistory with robust baseline fallbacks
  const history = currentUser.practiceHistory || [];
  const partTotal = { 5: 0, 7: 0, listening: 0 };
  const partCorrect = { 5: 0, 7: 0, listening: 0 };

  history.forEach(h => {
    const isListening = h.part >= 1 && h.part <= 4;
    const key = isListening ? 'listening' : h.part;
    if (partTotal[key] !== undefined) {
      partTotal[key]++;
      if (h.isCorrect) partCorrect[key]++;
    }
  });

  const getPartAccuracy = (partKey) => {
    if (partTotal[partKey] > 0) {
      return Math.round((partCorrect[partKey] / partTotal[partKey]) * 100);
    }
    return 0;
  };

  const part5Accuracy = getPartAccuracy(5);
  const part7Accuracy = getPartAccuracy(7);
  const listeningAccuracy = getPartAccuracy('listening');

  // 2. Calculate dynamic Tag accuracy
  const popularTags = [
    { name: "詞性修飾", baseOffset: 2 },
    { name: "時態文法", baseOffset: -3 },
    { name: "介系詞使用", baseOffset: -6 },
    { name: "連接詞轉折", baseOffset: -1 },
    { name: "被動語態", baseOffset: 4 },
    { name: "細節理解題", baseOffset: -4 },
    { name: "主旨大意題", baseOffset: 3 },
    { name: "聽力關鍵字", baseOffset: 1 }
  ];

  const tagStats = {};
  history.forEach(h => {
    (h.tags || []).forEach(tag => {
      const mapped = tag.includes("詞性") || tag.includes("副詞") || tag.includes("修飾") ? "詞性修飾" :
                     tag.includes("時態") || tag.includes("式") ? "時態文法" :
                     tag.includes("介系詞") ? "介系詞使用" :
                     tag.includes("連接詞") ? "連接詞轉折" :
                     tag.includes("主動") || tag.includes("被動") ? "被動語態" :
                     tag.includes("細節") ? "細節理解題" :
                     tag.includes("主旨") ? "主旨大意題" :
                     tag.includes("聽力") || tag.includes("關鍵") ? "聽力關鍵字" : tag;
      if (!tagStats[mapped]) {
        tagStats[mapped] = { answered: 0, correct: 0 };
      }
      tagStats[mapped].answered++;
      if (h.isCorrect) tagStats[mapped].correct++;
    });
  });

  const tagAccuracyList = popularTags.map(pt => {
    const realStat = tagStats[pt.name];
    const hasReal = realStat && realStat.answered > 0;
    const answered = hasReal ? realStat.answered : 0;
    const accuracy = hasReal ? Math.round((realStat.correct / realStat.answered) * 100) : 0;
    return {
      name: pt.name,
      answered,
      accuracy
    };
  }).sort((a, b) => b.accuracy - a.accuracy);

  // 3. Most frequently incorrect tag
  const wrongTags = {};
  wrongList.forEach(item => {
    (item.tags || []).forEach(tag => {
      const mapped = tag.includes("詞性") || tag.includes("副詞") || tag.includes("修飾") ? "詞性修飾" :
                     tag.includes("時態") || tag.includes("式") ? "時態文法" :
                     tag.includes("介系詞") ? "介系詞使用" :
                     tag.includes("連接詞") ? "連接詞轉折" :
                     tag.includes("主動") || tag.includes("被動") ? "被動語態" :
                     tag.includes("細節") ? "細節理解題" :
                     tag.includes("主旨") ? "主旨大意題" :
                     tag.includes("聽力") || tag.includes("關鍵") ? "聽力關鍵字" : tag;
      wrongTags[mapped] = (wrongTags[mapped] || 0) + (item.wrongCount || 1);
    });
  });

  const topWrongTags = Object.entries(wrongTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => ({ tag, count }));

  // 4. Calculate error reasons
  const reasonMap = {};
  wrongList.forEach(item => {
    if (item.errorReason) {
      reasonMap[item.errorReason] = (reasonMap[item.errorReason] || 0) + 1;
    }
  });

  const reasonLabels = {
    vocab: '單字不會',
    grammar: '文法不懂',
    long_sentence: '句子太長看不懂',
    careless: '看太快粗心',
    time_limit: '時間不夠',
    trap_choice: '被陷阱選項騙',
    listening_keyword: '聽力沒聽到關鍵字'
  };

  const topReasons = Object.entries(reasonMap)
    .sort((a,b) => b[1] - a[1])
    .map(([key, count]) => ({
      label: reasonLabels[key] || key,
      count
    }));

  const mockHistory = currentUser.mockTestHistory || [];

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins} 分 ${secs} 秒`;
  };

  // Calculate badges
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
              TOEIC SPRINT
            </span>
            <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              ✨ 學習總覽：{currentUser.username}
            </h1>
            <p style={{ opacity: 0.95, fontSize: '1.05rem', lineHeight: '1.6' }}>
              您的黃金目標為突破 <strong>{currentUser.goals?.targetScore} 分</strong>。今日任務完成率已達 <strong>{averagePercent}%</strong>！
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
          boxShadow: '0 8px 30px rgba(74, 222, 128, 0.15)',
          borderRadius: 'var(--radius-md)'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            🎉 完美達成！今日目標 100% 破關！
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'hsl(148, 70%, 20%)', lineHeight: '1.6', fontWeight: 600 }}>
            太棒了！您今天成功擊破了所有的每日學習任務目標！✨ 穩打穩紮，您的 TOEIC 實力正在以肉眼可見的速度狂飆！📈
          </p>
        </div>
      ) : (
        <div className="card" style={{ 
          borderLeft: '5px solid var(--primary)', 
          backgroundColor: 'var(--primary-light)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)'
        }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 今日衝刺指引
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
            建議今天優先完成：
            {wordsDone < wordsGoal && ` 📖 研讀 ${wordsGoal - wordsDone} 個核心單字卡、`}
            {questionsDone < questionsGoal && ` ✏️ 進行 ${questionsGoal - questionsDone} 題題目練習、`}
            {reviewsDone < reviewsGoal && unmasteredWrong > 0 && ` 🔄 複習 ${reviewsGoal - reviewsDone} 題錯題。`}
            完成後即可完美累積您的 <strong>{streak + 1} 天</strong> 連續學習紀錄！
          </p>
        </div>
      )}

      {/* Numerical Stats overview */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard title="⚡ 學習連續天數" value={`${streak} 天`} icon="🔥" color="var(--warning)" subtext="每日做題即可完美維持！" />
        <StatCard title="✏️ 累計練習題數" value={`${totalAnswered} 題`} icon="📝" color="var(--primary)" subtext={`正確率: ${totalAccuracy}%`} />
        <StatCard title="📖 已掌握單字數" value={`${vocabMastered} 字`} icon="📚" color="var(--secondary)" subtext={`今日已學: ${wordsDone} 字`} />
        <StatCard title="❌ 錯題本待複習" value={`${unmasteredWrong} 題`} icon="📓" color="var(--danger)" subtext={`已掌握: ${masteredWrong} 題 / 總錯題: ${totalWrong} 題`} />
      </div>

      {/* Mobile-Only Premium Quick Start Grid */}
      <div className="quick-start-grid">
        <div className="quick-action-card" onClick={() => setCurrentPage('vocabulary')}>
          <span className="quick-action-icon">📚</span>
          <span className="quick-action-label">核心單字</span>
        </div>
        <div className="quick-action-card" onClick={() => { setPracticeFilter('5'); setCurrentPage('question-practice'); }}>
          <span className="quick-action-icon">✏️</span>
          <span className="quick-action-label">Part 5 選擇</span>
        </div>
        <div className="quick-action-card" onClick={() => { setPracticeFilter('7'); setCurrentPage('question-practice'); }}>
          <span className="quick-action-icon">📰</span>
          <span className="quick-action-label">Part 7 閱讀</span>
        </div>
        <div className="quick-action-card" onClick={() => setCurrentPage('mock-test')}>
          <span className="quick-action-icon">📝</span>
          <span className="quick-action-label">模擬測驗</span>
        </div>
      </div>

      {/* Main Grid: Today's Tasks & Part Breakdowns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today's Tasks Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            📅 今日任務達成進度
          </h2>
          <div className="flex flex-col gap-4">
            <ProgressBar value={wordsDone} max={wordsGoal} label="📖 TOEIC 核心商務單字庫" />
            <ProgressBar value={questionsDone} max={questionsGoal} label="✏️ TOEIC 日常題目模擬練習" />
            <ProgressBar value={reviewsDone} max={reviewsGoal} label="🔄 錯題本弱點複習" />
            <ProgressBar value={studyDone} max={studyGoal} label="⏱️ 今日學習專注時長 (分鐘)" />
          </div>
        </div>

        {/* Part Breakdown Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            📈 TOEIC 各 Part 正確率分析
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <ProgressBar value={part5Accuracy} max={100} label="Part 5 Incomplete Sentences" showPercentage={false} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                <span>單字填空與文法選擇</span>
                <span>正確率: {partTotal[5] > 0 ? `${part5Accuracy}%` : '暫無練習'} ({partTotal[5]} 題)</span>
              </div>
            </div>
            
            <div>
              <ProgressBar value={part7Accuracy} max={100} label="Part 7 Reading Comprehension" showPercentage={false} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                <span>閱讀理解與文章比對</span>
                <span>正確率: {partTotal[7] > 0 ? `${part7Accuracy}%` : '暫無練習'} ({partTotal[7]} 題)</span>
              </div>
            </div>

            <div>
              <ProgressBar value={listeningAccuracy} max={100} label="Listening TTS Demo" showPercentage={false} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                <span>照片描述與日常問答模擬</span>
                <span>正確率: {partTotal['listening'] > 0 ? `${listeningAccuracy}%` : '暫無練習'} ({partTotal['listening']} 題)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Weakness and Tags analysis */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tags Correct Rates */}
        <div className="card flex flex-col" style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>🏷️ 各題型考點 (Tags) 正確率排行</h2>
          <div className="flex flex-col gap-2">
            {tagAccuracyList.map((tagItem, idx) => (
              <div key={idx} className="flex justify-between align-center" style={{ padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                <div className="flex align-center gap-1">
                  <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>{idx + 1}</span>
                  <span style={{ fontWeight: 600 }}>{tagItem.name}</span>
                </div>
                <div className="flex gap-2 align-center">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>({tagItem.answered} 次練習)</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: tagItem.answered > 0 
                      ? (tagItem.accuracy >= 80 ? 'var(--success)' : tagItem.accuracy >= 60 ? 'var(--warning)' : 'var(--danger)')
                      : 'var(--text-light)',
                    fontFamily: 'var(--font-display)'
                  }}>{tagItem.answered > 0 ? `${tagItem.accuracy}%` : '無練習'}</span>
                </div>
              </div>
            ))}
            {topWrongTags.length > 0 && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--danger)', fontWeight: 700 }}>
                  🚨 答錯次數最多考點 Top 3
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {topWrongTags.map((wt, idx) => (
                    <span 
                      key={idx} 
                      className="badge badge-review" 
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>{wt.tag}</span>
                      <strong style={{ color: 'var(--danger)' }}>({wt.count}次)</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Reasons */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>⚠️ 錯題原因分析排行</h2>
          {topReasons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-light)', fontSize: '0.95rem' }}>
              暫無錯誤原因統計。做錯題目後可以在錯題本中為題目標記原因！
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {topReasons.map((reason, idx) => (
                <div key={idx} className="flex justify-between align-center" style={{ 
                  padding: '0.5rem 1rem', 
                  backgroundColor: idx === 0 ? 'var(--danger-light)' : 'hsl(220, 10%, 97%)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <span style={{ fontWeight: 600, color: idx === 0 ? 'var(--danger)' : 'var(--text-main)' }}>
                    {idx + 1}. {reason.label}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                    出現 {reason.count} 次
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mock Exam History Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📋 模擬考試歷程紀錄</h2>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          記錄您每一次交卷後的 Mini Mock 測驗成績，追蹤能力成長曲線。
        </p>

        {mockHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-light)', fontSize: '0.95rem' }}>
            尚未參加過模擬考試。前往「模擬考」開啟第一回 Mini Mock 吧！
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-sub)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>日期</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>測驗模式</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>總題量</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>答對/答錯</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>耗時</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>估算總得分</th>
                </tr>
              </thead>
              <tbody>
                {mockHistory.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{item.date}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className="badge badge-outline">{item.mode === 'Mini Mock' ? '文字題 Mini Mock' : item.mode}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{item.totalQuestions} 題</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>{item.correctCount}</span> / <span style={{ color: 'var(--danger)' }}>{item.wrongCount}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{formatSeconds(item.timeSpent)}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
                      {item.score} 分
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic Badges / Achievements Panel */}
      {badges.length > 0 && (
        <div className="card" style={{ marginTop: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🏆 我的學習成就徽章</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>每一分努力，都在這裡留下了閃亮的證明。</p>
          
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
