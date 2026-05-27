import { useState } from 'react';

export default function Friends({ currentUser, users = [] }) {
  const [activeTab, setActiveTab] = useState('completion'); // completion, streak, volume, mockScore
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Helper to calculate daily completion rate for a user
  const getCompletionRate = (user) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const record = user.dailyRecords?.find(r => r.date === todayStr) || {
      wordsLearned: 0,
      questionsAnswered: 0,
      studyMinutes: 0
    };

    const wordsGoal = user.goals?.dailyVocabularyGoal || 30;
    const questionsGoal = user.goals?.dailyQuestionGoal || 50;
    const studyGoal = user.goals?.dailyStudyMinutesGoal || 60;

    const wP = Math.min((record.wordsLearned / wordsGoal) * 100, 100);
    const qP = Math.min((record.questionsAnswered / questionsGoal) * 100, 100);
    const sP = Math.min((record.studyMinutes / studyGoal) * 100, 100);

    return Math.round((wP + qP + sP) / 3);
  };

  const getMockHighScore = (user) => {
    if (!user.mockTestHistory || user.mockTestHistory.length === 0) return 0;
    return Math.max(...user.mockTestHistory.map(h => h.score));
  };

  // Compile leaderboard list based on active tab
  const getLeaderboard = () => {
    const list = [...users];
    switch (activeTab) {
      case 'streak':
        return list.sort((a,b) => (b.progress?.streakDays || 0) - (a.progress?.streakDays || 0));
      case 'volume':
        return list.sort((a,b) => (b.progress?.totalQuestionsAnswered || 0) - (a.progress?.totalQuestionsAnswered || 0));
      case 'mockScore':
        return list.sort((a,b) => getMockHighScore(b) - getMockHighScore(a));
      case 'completion':
      default:
        return list.sort((a,b) => getCompletionRate(b) - getCompletionRate(a));
    }
  };

  const sortedUsers = getLeaderboard();

  // Extract Top 3 for the podium
  const firstPlace = sortedUsers[0];
  const secondPlace = sortedUsers[1];
  const thirdPlace = sortedUsers[2];

  const getMetricValForPodium = (user) => {
    if (!user) return '';
    const completion = getCompletionRate(user);
    const streak = user.progress?.streakDays || 0;
    switch (activeTab) {
      case 'streak':
        return `${streak} 天`;
      case 'volume':
        return `${user.progress?.totalQuestionsAnswered || 0} 題`;
      case 'mockScore':
        return `${getMockHighScore(user)} 分`;
      case 'completion':
      default:
        return `${completion}%`;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="card" style={{ borderLeft: '5px solid var(--secondary)' }}>
        <span className="badge badge-review" style={{ marginBottom: '0.5rem', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
          PEER ACCOUNTABILITY GROUP 👥
        </span>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>🤝 戰友互相監督與排行榜</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
          同舟共濟，互相督促！在這裡您可以查看其他戰友的今日任務進度、學習天數與模擬考高分榜。
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap" style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          className={`btn btn-sm ${activeTab === 'completion' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('completion')}
        >
          今日達成率榜 🎯
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'streak' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('streak')}
        >
          學習連續天數榜 🔥
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'volume' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('volume')}
        >
          累計答題題量榜 📝
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'mockScore' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('mockScore')}
        >
          模擬考最高分榜 🏆
        </button>
      </div>

      {/* Leaderboard Podium (Top 3 Medallions) */}
      <div className="card" style={{ 
        background: 'linear-gradient(180deg, hsl(220, 20%, 98%) 0%, hsl(220, 10%, 93%) 100%)',
        padding: '2.5rem 1.5rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 700 }}>
          🏆 前三名榮譽領獎台
        </h2>
        
        <div className="flex align-end justify-center gap-3" style={{ width: '100%', maxWidth: '500px', height: '240px' }}>
          
          {/* 2nd Place Pod */}
          {secondPlace && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1
            }}>
              <span style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>🥈</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100px', display: 'block' }}>{secondPlace.username.split(' ')[0]}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.5rem' }}>{getMetricValForPodium(secondPlace)}</span>
              
              <div style={{
                backgroundColor: 'hsl(220, 15%, 85%)',
                border: '1px solid hsl(220, 10%, 80%)',
                width: '100%',
                height: '90px',
                borderRadius: '8px 8px 0 0',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.4rem',
                color: 'hsl(220, 10%, 50%)',
                fontFamily: 'var(--font-display)'
              }}>
                2
              </div>
            </div>
          )}

          {/* 1st Place Pod */}
          {firstPlace && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1.2
            }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '0.2rem', animation: 'float 3s ease-in-out infinite' }}>🥇</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '120px', display: 'block', color: 'var(--primary)' }}>{firstPlace.username.split(' ')[0]}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 800, marginBottom: '0.5rem' }}>{getMetricValForPodium(firstPlace)}</span>
              
              <div style={{
                background: 'linear-gradient(135deg, hsl(45, 100%, 75%), hsl(45, 100%, 55%))',
                border: '1px solid hsl(45, 100%, 45%)',
                width: '100%',
                height: '130px',
                borderRadius: '10px 10px 0 0',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '2rem',
                color: 'hsl(45, 100%, 25%)',
                fontFamily: 'var(--font-display)',
                position: 'relative'
              }}>
                1
                <span style={{ position: 'absolute', top: '-10px', fontSize: '1.2rem' }}>👑</span>
              </div>
            </div>
          )}

          {/* 3rd Place Pod */}
          {thirdPlace && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1
            }}>
              <span style={{ fontSize: '1.6rem', marginBottom: '0.2rem' }}>🥉</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100px', display: 'block' }}>{thirdPlace.username.split(' ')[0]}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.5rem' }}>{getMetricValForPodium(thirdPlace)}</span>
              
              <div style={{
                backgroundColor: 'hsl(30, 40%, 80%)',
                border: '1px solid hsl(30, 30%, 75%)',
                width: '100%',
                height: '70px',
                borderRadius: '8px 8px 0 0',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: 'hsl(30, 30%, 45%)',
                fontFamily: 'var(--font-display)'
              }}>
                3
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-main)' }}>🏆 {
          activeTab === 'completion' ? '今日完成率排行榜' :
          activeTab === 'streak' ? '連續學習天數排行榜' :
          activeTab === 'volume' ? '總練習題數排行榜' : 'Mini Mock Test 最高分排行榜'
        }</h2>
        
        <div className="flex justify-between" style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', fontWeight: 700, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
          <div style={{ flex: 1 }}>排名</div>
          <div style={{ flex: 3 }}>戰友名稱</div>
          <div style={{ flex: 2, textAlign: 'center' }}>學習連續天數</div>
          <div style={{ flex: 2, textAlign: 'center' }}>今日任務完成率</div>
          <div style={{ flex: 2, textAlign: 'right' }}>指標數據</div>
        </div>

        <div className="flex flex-col" style={{ marginTop: '0.5rem' }}>
          {sortedUsers.map((user, idx) => {
            const isSelf = user.id === currentUser?.id;
            const completion = getCompletionRate(user);
            const streak = user.progress?.streakDays || 0;
            
            const metricVal = activeTab === 'streak'
              ? `${streak} 天`
              : activeTab === 'volume'
              ? `${user.progress?.totalQuestionsAnswered || 0} 題`
              : activeTab === 'mockScore'
              ? `${getMockHighScore(user)} 分`
              : `${completion}%`;

            return (
              <div 
                key={user.id}
                className="flex justify-between align-center" 
                style={{ 
                  padding: '1rem 0', 
                  borderBottom: idx + 1 < sortedUsers.length ? '1px solid var(--border-color)' : 'none',
                  backgroundColor: isSelf ? 'var(--primary-light)' : 'transparent',
                  margin: isSelf ? '0 -1.5rem' : '0',
                  paddingLeft: isSelf ? '1.5rem' : '0',
                  paddingRight: isSelf ? '1.5rem' : '0',
                  cursor: 'pointer',
                  borderRadius: isSelf ? 'var(--radius-sm)' : '0'
                }}
                onClick={() => setSelectedFriend(user)}
              >
                {/* Rank */}
                <div style={{ flex: 1, fontWeight: 700, fontSize: '1.1rem' }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                </div>

                {/* Username */}
                <div style={{ flex: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{user.username}</span>
                  {isSelf && <span className="badge badge-new" style={{ fontSize: '0.65rem' }}>自己</span>}
                </div>

                {/* Streak */}
                <div style={{ flex: 2, textAlign: 'center', fontWeight: 600 }}>
                  🔥 {streak} 天
                </div>

                {/* Completion Rate */}
                <div style={{ flex: 2, textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                  {completion}%
                </div>

                {/* Metric */}
                <div style={{ flex: 2, textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
                  {metricVal}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Buddies Detailed Status Grid */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>👥 戰友學習狀態詳細一覽</h2>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          本機模擬多帳號系統：即時顯示所有本機註冊帳號的當前學習指標與目標設定。
        </p>

        <div className="grid grid-cols-2 gap-3">
          {users.map(u => {
            const isSelf = u.id === currentUser?.id;
            const completion = getCompletionRate(u);
            
            // Get today's numbers
            const todayStr = new Date().toISOString().split('T')[0];
            const record = u.dailyRecords?.find(r => r.date === todayStr) || {
              wordsLearned: 0,
              questionsAnswered: 0,
              studyMinutes: 0
            };

            const totalAns = u.progress?.totalQuestionsAnswered || 0;
            const totalCorr = u.progress?.totalCorrect || 0;
            const accuracy = totalAns > 0 ? Math.round((totalCorr / totalAns) * 100) : 0;
            const streak = u.progress?.streakDays || 0;
            
            // wrong book count (we fallback to seeded count to look nice if empty)
            let wrongCount = u.wrongBook?.length || 0;
            if (wrongCount === 0 && u.progress?.totalWrong > 0) {
              wrongCount = u.progress.totalWrong;
            }

            return (
              <div 
                key={u.id} 
                className="card" 
                style={{ 
                  padding: '1.5rem', 
                  border: isSelf ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: isSelf ? 'var(--primary-light)' : 'transparent',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isSelf && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem'
                  }}>
                    <span className="badge badge-new" style={{ fontSize: '0.7rem' }}>目前登入</span>
                  </div>
                )}
                
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  👤 {u.username}
                </h3>
                
                <div className="grid grid-cols-2 gap-2" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>🎯 目標分數:</span>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{u.goals?.targetScore || 700} 分</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>🔥 連續學習:</span>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--warning)' }}>{streak} 天</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>📈 總正確率:</span>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)' }}>{accuracy}%</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>❌ 錯題數量:</span>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger)' }}>{wrongCount} 題</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>📅 今日題數:</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                      {record.questionsAnswered} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-light)' }}>/ {u.goals?.dailyQuestionGoal || 50} 題</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>📖 今日單字:</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                      {record.wordsLearned} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-light)' }}>/ {u.goals?.dailyVocabularyGoal || 30} 字</span>
                    </div>
                  </div>
                </div>

                {/* completion rate slider */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    <span>今日任務完成率</span>
                    <span>{completion}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'hsl(220, 10%, 90%)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${completion}%`, backgroundColor: 'var(--primary)', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedFriend(u)}>
                    詳細學習檔案 ➔
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Friend Detail Modal */}
      {selectedFriend && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }} onClick={() => setSelectedFriend(null)}>
          <div className="card practice-container" style={{ margin: '1.5rem', width: '100%', maxWidth: '500px', backgroundColor: 'white' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between align-center" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>👥 戰友學習檔案</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedFriend(null)}>✕ 關閉</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2.5rem' }}>👤</span>
              <h3 style={{ fontSize: '1.4rem', marginTop: '0.5rem' }}>{selectedFriend.username}</h3>
              <span className="badge badge-mastered" style={{ marginTop: '0.25rem' }}>
                目標分數: {selectedFriend.goals?.targetScore || 700} 分
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2" style={{ marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>連續學習</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>🔥 {selectedFriend.progress?.streakDays || 0} 天</div>
              </div>
              <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>累計答題</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>✏️ {selectedFriend.progress?.totalQuestionsAnswered || 0} 題</div>
              </div>
              <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>單字掌握</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>📖 {selectedFriend.progress?.learnedVocabularyCount || 0} 字</div>
              </div>
              <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>模擬考高分</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>🏆 {getMockHighScore(selectedFriend)} 分</div>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedFriend(null)}>
              為戰友加油打氣！👏
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
