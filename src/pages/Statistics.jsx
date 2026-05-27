// src/pages/Statistics.jsx
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';

export default function Statistics({ currentUser, todayRecord }) {
  if (!currentUser) return null;

  const totalAnswered = currentUser.progress?.totalQuestionsAnswered || 0;
  const totalCorrect = currentUser.progress?.totalCorrect || 0;
  const totalAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const streak = currentUser.progress?.streakDays || 0;
  const vocabMastered = Object.values(currentUser.vocabularyProgress || {}).filter(v => v === 'mastered').length;

  const todayQuestions = todayRecord?.questionsAnswered || 0;
  const todayWords = todayRecord?.wordsLearned || 0;

  const wrongList = currentUser.wrongBook || [];
  const totalWrong = wrongList.length;
  const masteredWrong = wrongList.filter(w => w.status === '已掌握').length;

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

  // 3. 最常錯的題型 (Most frequently incorrect tag)
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

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="card">
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>📊 個人學習成效與統計分析</h1>
        <p style={{ color: 'var(--text-sub)' }}>
          透過多維度數據，分析您的強項與弱點，提供個人化的 TOEIC 衝刺建議。
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard title="✏️ 累計練習題數" value={`${totalAnswered} 題`} icon="📝" color="var(--primary)" />
        <StatCard title="📈 總平均正確率" value={`${totalAccuracy}%`} icon="🎯" color="var(--success)" />
        <StatCard title="📖 已掌握單字數" value={`${vocabMastered} 字`} icon="📚" color="var(--secondary)" />
        <StatCard title="⚡ 連續學習天數" value={`${streak} 天`} icon="🔥" color="var(--warning)" />
      </div>

      {/* Today & Wrong Book Details */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today's Stats Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>📅 今日學習進度</h2>
          <div className="grid grid-cols-2 gap-2">
            <div style={{ padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>今日完成題數</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--primary)', marginTop: '0.25rem' }}>
                {todayQuestions} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>/ {currentUser.goals?.dailyQuestionGoal || 50} 題</span>
              </div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--secondary-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>今日完成單字</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                {todayWords} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>/ {currentUser.goals?.dailyVocabularyGoal || 30} 字</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wrong Book Stats Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>❌ 錯題本追蹤狀態</h2>
          <div className="grid grid-cols-2 gap-2">
            <div style={{ padding: '1rem', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>錯題總數</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--danger)', marginTop: '0.25rem' }}>
                {totalWrong} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>題</span>
              </div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--success-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>已掌握錯題數</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--success)', marginTop: '0.25rem' }}>
                {masteredWrong} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>/ {totalWrong} 題</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Part breakdowns & Weakness Suggestions */}
      <div className="grid grid-cols-2 gap-3">
        {/* Part Breakdown Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>📈 TOEIC 各 Part 正確率分析</h2>
          <div className="flex flex-col gap-3">
            <div>
              <ProgressBar value={part5Accuracy} max={100} label="Part 5 Incomplete Sentences" showPercentage={false} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                <span>單字填空與文法選擇</span>
                <span>正確率: {partTotal[5] > 0 ? `${part5Accuracy}%` : '暫無練習'}</span>
              </div>
            </div>
            
            <div>
              <ProgressBar value={part7Accuracy} max={100} label="Part 7 Reading Comprehension" showPercentage={false} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                <span>閱讀理解與文章比對</span>
                <span>正確率: {partTotal[7] > 0 ? `${part7Accuracy}%` : '暫無練習'}</span>
              </div>
            </div>

            <div>
              <ProgressBar value={listeningAccuracy} max={100} label="Listening Demo Sections" showPercentage={false} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                <span>音感描述與日常會話模擬</span>
                <span>正確率: {partTotal['listening'] > 0 ? `${listeningAccuracy}%` : '暫無練習'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weakness Suggestion Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>❌ 錯誤原因排行榜</h2>
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

      {/* Tags accuracy & Most frequent mistakes */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tags Correct Rates */}
        <div className="card flex flex-col" style={{ maxHeight: '380px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🏷️ 各題型考點 (Tags) 正確率排行</h2>
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
          </div>
        </div>

        {/* Most frequent mistakes & Suggested strategy */}
        <div className="card flex flex-col gap-2">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>⚠️ 最常錯的題型排行</h2>
          {topWrongTags.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
              太棒了！目前尚無錯題標籤記錄。
            </div>
          ) : (
            <div className="flex flex-col gap-2" style={{ marginBottom: '1rem' }}>
              {topWrongTags.map((wTag, idx) => (
                <div key={idx} className="flex justify-between align-center" style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--danger)' }}>🎯 {wTag.tag}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: 500 }}>累計答錯 {wTag.count} 次</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem', fontWeight: 700 }}>💡 精準讀書建議</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
              {topWrongTags.length > 0 
                ? `您目前在「${topWrongTags[0].tag}」的錯題數量最多。建議明天的複習計劃中，優先點擊「錯題本」，點選錯誤原因為「${topReasons[0]?.label || '單字不會'}」的題目進行深度重練。`
                : "您的學習狀況非常優異！建議保持目前的步調，每天持續做單字卡與 Part 5 / Part 7 的精選日常練習，並每週維持 1-2 次模擬考以保持手感。"}
            </p>
          </div>
        </div>
      </div>

      {/* Mock Exam History Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>📋 模擬考歷史紀錄 (mockTestHistory)</h2>
        {mockHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
            📭 目前尚無模擬考試紀錄。請前往「模擬考試中心」進行您的第一次測驗！
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-sub)', fontWeight: 700 }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>測驗日期</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>模式</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>預估總分</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>答對題數 / 總題數</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>正確率</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>作答時間</th>
                </tr>
              </thead>
              <tbody>
                {mockHistory.slice().reverse().map((item, idx) => {
                  const acc = Math.round((item.correctCount / item.totalQuestions) * 100);
                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{item.date}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span className="badge badge-new" style={{ fontSize: '0.75rem' }}>{item.mode}</span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>
                        ⚡ {item.score} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-light)' }}>分</span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600 }}>
                        {item.correctCount} / {item.totalQuestions}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ 
                           fontWeight: 700,
                           color: acc >= 80 ? 'var(--success)' : acc >= 60 ? 'var(--warning)' : 'var(--danger)'
                        }}>{acc}%</span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-sub)' }}>
                        {formatSeconds(item.timeSpent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
