// src/pages/Settings.jsx
import { useState } from 'react';

export default function Settings({ currentUser, onSaveGoals, onClearData, onDeleteAccount, syncStatus = 'synced', syncError = null, onManualSync }) {
  const [targetScore, setTargetScore] = useState(currentUser?.goals?.targetScore || 700);
  const [examDate, setExamDate] = useState(currentUser?.goals?.examDate || '');
  const [dailyVocabularyGoal, setDailyVocabularyGoal] = useState(currentUser?.goals?.dailyVocabularyGoal || 30);
  const [dailyQuestionGoal, setDailyQuestionGoal] = useState(currentUser?.goals?.dailyQuestionGoal || 50);
  const [dailyStudyMinutesGoal, setDailyStudyMinutesGoal] = useState(currentUser?.goals?.dailyStudyMinutesGoal || 60);

  const handleSave = (e) => {
    e.preventDefault();
    onSaveGoals({
      targetScore: Number(targetScore),
      examDate,
      dailyVocabularyGoal: Number(dailyVocabularyGoal),
      dailyQuestionGoal: Number(dailyQuestionGoal),
      dailyStudyMinutesGoal: Number(dailyStudyMinutesGoal)
    });
  };

  const getSyncStatusText = (status) => {
    switch (status) {
      case 'syncing':
        return { text: '🔄 同步中...', color: 'var(--primary)', bg: 'var(--primary-light)' };
      case 'failed':
        return { text: '❌ 同步失敗', color: 'var(--danger)', bg: 'var(--danger-light)' };
      case 'synced':
      default:
        return { text: '✨ 已同步到雲端', color: 'var(--success)', bg: 'var(--success-light)' };
    }
  };

  const syncInfo = getSyncStatusText(syncStatus);

  // Wiping of current user logs (Cloud data clear)
  const handleClearClick = async () => {
    if (!currentUser) return;

    const emailConfirm = prompt(`⚠️ 本操作將抹除此帳號在雲端及本機的所有做題、單字與模擬考歷史記錄。\n確定要清除嗎？請輸入您的帳號 E-mail (${currentUser.email}) 以確認清除：`);
    if (emailConfirm === null) return; // cancelled
    
    if (emailConfirm.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
      alert("❌ 輸入的 E-mail 不符合，拒絕清空歷史資料！");
      return;
    }

    if (confirm('警告！這將清除您雲端及本機的所有作答歷史、單字熟練度以及錯題記錄，重設為初始狀態。確定要繼續嗎？')) {
      await onClearData();
      alert('🧹 雲端與本機數據已成功清空！');
    }
  };

  // Secure account deletion (Wipe cloud data and logout)
  const handleDeleteClick = async () => {
    if (!currentUser) return;

    const emailConfirm = prompt(`🚨 徹底刪除帳號警告 🚨\n這將永久刪除您的此雲端帳號及所有相關學習紀錄，不可撤銷！\n確定要刪除嗎？請輸入您的帳號 E-mail (${currentUser.email}) 以確認徹底刪除：`);
    if (emailConfirm === null) return; // cancelled

    if (emailConfirm.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
      alert("❌ 輸入的 E-mail 不符合，拒絕刪除帳號！");
      return;
    }

    if (confirm('警告！！！這將「永久刪除」您的雲端帳號學習檔案，且無法撤銷。確定要徹底刪除嗎？')) {
      await onDeleteAccount();
      alert('🗑️ 帳號數據已成功清空，帳號已完成登出！');
    }
  };

  return (
    <div className="flex flex-col gap-3 practice-container">
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>⚙️ 學習計畫與系統設定</h1>
        <p style={{ color: 'var(--text-sub)' }}>在此調整您的 TOEIC 目標分數與每日目標，並查看雲端同步狀態。</p>
      </div>

      {/* Cloud Status Panel */}
      <div className="card" style={{ 
        borderLeft: '5px solid var(--secondary)', 
        backgroundColor: 'var(--secondary-light)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', fontWeight: 700, margin: 0 }}>
          ☁️ 雲端同步狀態 (V2.1 Cloud)
        </h3>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div>
            <strong>登入帳號：</strong><span style={{ fontFamily: 'monospace' }}>{currentUser?.email || '未知雲端用戶'}</span>
          </div>
          <div>
            <strong>暱稱稱呼：</strong><span>{currentUser?.username || '未設定'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <strong>同步狀態：</strong>
            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              padding: '0.25rem 0.5rem', 
              borderRadius: 'var(--radius-sm)',
              color: syncInfo.color,
              backgroundColor: syncInfo.bg
            }}>
              {syncInfo.text}
            </span>
          </div>

          {/* Sync Error Diagnostic Summary */}
          {syncStatus === 'failed' && syncError && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#991b1b'
            }}>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>🔍 錯誤診斷摘要：</strong>
              <div style={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div>• 訊息: {syncError.message}</div>
                <div>• 代碼: {syncError.code}</div>
                <div>• 細節: {syncError.details}</div>
              </div>
            </div>
          )}

          {/* Manual Re-sync Button */}
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onManualSync}
              disabled={syncStatus === 'syncing'}
              style={{
                backgroundColor: 'var(--secondary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
                opacity: syncStatus === 'syncing' ? 0.7 : 1,
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              onMouseOver={(e) => {
                if (syncStatus !== 'syncing') e.currentTarget.style.backgroundColor = '#1e3a8a';
              }}
              onMouseOut={(e) => {
                if (syncStatus !== 'syncing') e.currentTarget.style.backgroundColor = 'var(--secondary)';
              }}
            >
              {syncStatus === 'syncing' ? '🔄 同步中...' : '☁️ 重新同步資料'}
            </button>
          </div>
        </div>
      </div>

      {/* Adjust Target Goals Form */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>🎯 調整我的每日目標</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label">目標 TOEIC 分數</label>
            <select className="form-input" value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value))}>
              <option value={550}>550分</option>
              <option value={730}>730分</option>
              <option value={860}>860分</option>
              <option value={900}>900分</option>
              <option value={950}>950分</option>
              <option value={990}>990分 🏆</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">預計考試日期</label>
            <input type="date" className="form-input" value={examDate} onChange={(e) => setExamDate(e.target.value)} required />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="form-group">
              <label className="form-label">每日單字目標</label>
              <input type="number" className="form-input" value={dailyVocabularyGoal} onChange={(e) => setDailyVocabularyGoal(Number(e.target.value))} min={5} max={200} />
            </div>
            <div className="form-group">
              <label className="form-label">每日題目目標</label>
              <input type="number" className="form-input" value={dailyQuestionGoal} onChange={(e) => setDailyQuestionGoal(Number(e.target.value))} min={5} max={200} />
            </div>
            <div className="form-group">
              <label className="form-label">每日學習分鐘</label>
              <input type="number" className="form-input" value={dailyStudyMinutesGoal} onChange={(e) => setDailyStudyMinutesGoal(Number(e.target.value))} min={5} max={480} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            💾 儲存並更新雲端計畫
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid var(--danger-light)' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--danger)', marginBottom: '0.75rem' }}>⚠️ 危險區域 (Danger Zone)</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '1.25rem' }}>
          以下操作將會清空或抹除您的學習紀錄，將同步更新於本機緩存與 Supabase 雲端資料庫。
        </p>
        <div className="flex gap-2">
          <button 
            className="btn btn-outline" 
            style={{ flex: 1, color: 'var(--danger)', borderColor: 'var(--danger)' }}
            onClick={handleClearClick}
          >
            🧹 清空雲端/本機紀錄
          </button>
          
          <button 
            className="btn btn-danger" 
            style={{ flex: 1 }}
            onClick={handleDeleteClick}
          >
            🗑️ 抹除雲端資料並登出
          </button>
        </div>
      </div>
    </div>
  );
}
