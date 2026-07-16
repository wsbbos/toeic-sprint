// src/pages/Settings.jsx
import { useState } from 'react';

export default function Settings({ currentUser, onSaveGoals, onClearData, onDeleteAccount, syncStatus = 'synced', syncError = null, localPersistenceStatus = 'available', onManualSync }) {
  const [targetScore, setTargetScore] = useState(currentUser?.goals?.targetScore || 700);
  const [examDate, setExamDate] = useState(currentUser?.goals?.examDate || '');
  const [dailyVocabularyGoal, setDailyVocabularyGoal] = useState(currentUser?.goals?.dailyVocabularyGoal || 30);
  const [dailyQuestionGoal, setDailyQuestionGoal] = useState(currentUser?.goals?.dailyQuestionGoal || 30);
  const [dailyStudyMinutesGoal, setDailyStudyMinutesGoal] = useState(currentUser?.goals?.dailyStudyMinutesGoal || 45);
  const isGuest = Boolean(currentUser?.isGuest || !currentUser?.email);

  const handleSave = async (e) => {
    e.preventDefault();
    await onSaveGoals({
      targetScore: Number(targetScore),
      examDate,
      dailyVocabularyGoal: Number(dailyVocabularyGoal),
      dailyQuestionGoal: Number(dailyQuestionGoal),
      dailyStudyMinutesGoal: Number(dailyStudyMinutesGoal)
    });
  };

  const getSyncStatusText = (status, localOnly, persistenceStatus) => {
    if (localOnly && persistenceStatus === 'failed') {
      return { text: '⚠️ 本機儲存失敗', color: 'var(--danger)', bg: 'var(--danger-light)' };
    }
    if (localOnly) return { text: '💾 已儲存於此裝置', color: 'var(--success)', bg: 'var(--success-light)' };
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

  const syncInfo = getSyncStatusText(syncStatus, isGuest, localPersistenceStatus);

  // Wiping of current user logs (Cloud data clear)
  const handleClearClick = async () => {
    if (!currentUser) return;

    const expectedConfirmation = isGuest ? '清除' : currentUser.email;
    const identityConfirm = window.prompt(isGuest
      ? '⚠️ 本操作將清除此裝置上的訪客學習紀錄。請輸入「清除」以繼續：'
      : `⚠️ 本操作將清除此帳號在雲端及本機的所有學習紀錄。請輸入帳號 E-mail（${currentUser.email}）以繼續：`);
    if (identityConfirm === null) return;
    if (identityConfirm.trim().toLowerCase() !== expectedConfirmation.toLowerCase()) {
      window.alert(isGuest ? '❌ 確認文字不符，已取消清除。' : '❌ 輸入的 E-mail 不符合，已取消清除。');
      return;
    }

    if (window.confirm(isGuest ? '再次確認：要清除此裝置上的所有訪客學習紀錄嗎？' : '再次確認：要清除雲端及本機的所有學習紀錄嗎？')) {
      await onClearData();
      window.alert(isGuest ? '🧹 訪客學習紀錄已清空。' : '🧹 雲端與本機學習紀錄已清空。');
    }
  };

  // Secure account deletion (Wipe cloud data and logout)
  const handleDeleteClick = async () => {
    if (!currentUser) return;

    const expectedConfirmation = isGuest ? '登出' : currentUser.email;
    const identityConfirm = window.prompt(isGuest
      ? '⚠️ 這會清除訪客學習紀錄並離開訪客模式。請輸入「登出」以繼續：'
      : `⚠️ 這會清除學習紀錄並登出，但不會刪除 Supabase 登入帳號。請輸入帳號 E-mail（${currentUser.email}）以繼續：`);
    if (identityConfirm === null) return;
    if (identityConfirm.trim().toLowerCase() !== expectedConfirmation.toLowerCase()) {
      window.alert(isGuest ? '❌ 確認文字不符，已取消操作。' : '❌ 輸入的 E-mail 不符合，已取消操作。');
      return;
    }

    if (window.confirm('再次確認：要清除所有學習紀錄並登出嗎？')) {
      await onDeleteAccount();
      window.alert('🗑️ 學習紀錄已清空，並已完成登出。');
    }
  };

  return (
    <div className="flex flex-col gap-3 practice-container">
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>⚙️ 學習計畫與系統設定</h1>
        <p style={{ color: 'var(--text-sub)' }}>{isGuest ? '在此調整 TOEIC 目標與每日目標；訪客資料會保存在目前裝置。' : '在此調整 TOEIC 目標與每日目標，並查看雲端同步狀態。'}</p>
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
          {isGuest ? '💾 本機資料保存狀態' : '☁️ 雲端同步狀態'}
        </h3>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div>
            <strong>登入帳號：</strong><span style={{ fontFamily: 'monospace' }}>{currentUser?.email || '本機訪客模式'}</span>
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

          {/* User-safe recovery guidance; raw backend diagnostics stay out of the DOM. */}
          {syncStatus === 'failed' && syncError && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#991b1b',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <strong>雲端同步暫時失敗，本機資料已保留。</strong>
              <span>請確認網路後重新同步；若持續發生，請稍後再試。</span>
            </div>
          )}
          {localPersistenceStatus === 'failed' && (
            <div className="offline-notice" role="alert" aria-live="assertive">
              <strong>此瀏覽器目前無法儲存學習進度。</strong>
              <span style={{ display: 'block', marginTop: '0.25rem' }}>
                請保留此頁面並確認儲存空間或隱私設定；登入使用者仍可嘗試雲端同步。
              </span>
            </div>
          )}
          {!isGuest && (
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onManualSync}
                disabled={syncStatus === 'syncing'}
              >
                {syncStatus === 'syncing' ? '🔄 同步中...' : '☁️ 重新同步資料'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Target Goals Form */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>🎯 調整我的每日目標</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label" htmlFor="target-score">目標 TOEIC 分數</label>
            <select id="target-score" className="form-input" value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value))}>
              <option value={550}>550分</option>
              <option value={730}>730分</option>
              <option value={860}>860分</option>
              <option value={900}>900分</option>
              <option value={950}>950分</option>
              <option value={990}>990分 🏆</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="exam-date">預計考試日期</label>
            <input id="exam-date" type="date" className="form-input" value={examDate} onChange={(e) => setExamDate(e.target.value)} required />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="form-group">
              <label className="form-label" htmlFor="daily-vocabulary-goal">每日單字目標</label>
              <input id="daily-vocabulary-goal" type="number" className="form-input" value={dailyVocabularyGoal} onChange={(e) => setDailyVocabularyGoal(Number(e.target.value))} min={5} max={200} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="daily-question-goal">每日題目目標</label>
              <input id="daily-question-goal" type="number" className="form-input" value={dailyQuestionGoal} onChange={(e) => setDailyQuestionGoal(Number(e.target.value))} min={5} max={200} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="daily-study-minutes-goal">每日學習分鐘</label>
              <input id="daily-study-minutes-goal" type="number" className="form-input" value={dailyStudyMinutesGoal} onChange={(e) => setDailyStudyMinutesGoal(Number(e.target.value))} min={5} max={480} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {isGuest ? '💾 儲存本機計畫' : '💾 儲存並同步計畫'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid var(--danger-light)' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--danger)', marginBottom: '0.75rem' }}>⚠️ 危險區域 (Danger Zone)</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '1.25rem' }}>
          {isGuest ? '以下操作只會影響此裝置上的訪客學習紀錄。' : '以下操作會清除學習紀錄並同步更新本機與 Supabase；不會刪除登入帳號。'}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: 1, color: 'var(--danger)', borderColor: 'var(--danger)' }}
            onClick={handleClearClick}
          >
            {isGuest ? '🧹 清空訪客紀錄' : '🧹 清空雲端/本機紀錄'}
          </button>

          <button
            type="button"
            className="btn btn-danger"
            style={{ flex: 1 }}
            onClick={handleDeleteClick}
          >
            {isGuest ? '🚪 清除訪客資料並離開' : '🚪 清除學習資料並登出'}
          </button>
        </div>
      </div>
    </div>
  );
}
