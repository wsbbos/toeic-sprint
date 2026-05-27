// src/pages/Settings.jsx
import { useState } from 'react';
import { hashPassword } from '../utils/crypto';

export default function Settings({ currentUser, onSaveGoals, onClearData, onDeleteAccount, onImportData, users }) {
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
    alert('設定成功！已更新個人學習計畫。');
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `toeic_sprint_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].username) {
          onImportData(parsed);
          alert('備份資料匯入成功！系統已更新。');
        } else {
          alert('匯入格式有誤，請使用本系統導出的 JSON 備份檔！');
        }
      } catch (err) {
        console.error('JSON Import Failed:', err);
        alert('解析 JSON 備份檔失敗！');
      }
    };
    fileReader.readAsText(file);
  };

  // Secure Wiping of current user logs
  const handleClearClick = async () => {
    if (!currentUser) return;

    if (currentUser.passwordHash) {
      const password = prompt("⚠️ 請輸入您的帳號密碼以確認清空所有歷史資料：");
      if (password === null) return; // cancelled
      if (!password) {
        alert("❌ 密碼不能為空！");
        return;
      }

      try {
        const computedHash = await hashPassword(password, currentUser.salt);
        if (computedHash !== currentUser.passwordHash) {
          alert("❌ 密碼錯誤，拒絕清空歷史資料！");
          return;
        }
      } catch (err) {
        console.error(err);
        alert("❌ 加密驗證失敗！");
        return;
      }
    }

    if (confirm('警告！這將清除您目前帳號的所有作答歷史、單字熟練度以及錯題記錄，重設為初始狀態。確定要繼續嗎？')) {
      onClearData();
    }
  };

  // Secure account deletion
  const handleDeleteClick = async () => {
    if (!currentUser) return;

    if (currentUser.passwordHash) {
      const password = prompt("⚠️ 請輸入您的帳號密碼以確認「徹底刪除」此帳號：");
      if (password === null) return; // cancelled
      if (!password) {
        alert("❌ 密碼不能為空！");
        return;
      }

      try {
        const computedHash = await hashPassword(password, currentUser.salt);
        if (computedHash !== currentUser.passwordHash) {
          alert("❌ 密碼錯誤，拒絕刪除帳號！");
          return;
        }
      } catch (err) {
        console.error(err);
        alert("❌ 加密驗證失敗！");
        return;
      }
    }

    if (confirm('警告！！！這將「永久刪除」您的此學習帳號，且無法撤銷。確定要刪除帳號嗎？\n此操作會永久刪除此帳號的所有學習紀錄，無法復原。')) {
      onDeleteAccount();
    }
  };

  return (
    <div className="flex flex-col gap-3 practice-container">
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>⚙️ 學習計畫與系統設定</h1>
        <p style={{ color: 'var(--text-sub)' }}>在此調整您的 TOEIC 目標分數，或對本地學習數據進行備份與匯入。</p>
      </div>

      {/* Security Disclaimer Panel */}
      <div className="card" style={{ 
        borderLeft: '5px solid var(--secondary)', 
        backgroundColor: 'var(--secondary-light)',
        padding: '1rem 1.25rem'
      }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--secondary)', marginBottom: '0.25rem', fontWeight: 700 }}>
          🛡️ 本地安全儲存說明
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
          目前 V1.2 使用本機儲存資料，密碼僅用於保護同一台裝置上的帳號切換。若未來要跨裝置同步，需要正式雲端登入系統。
        </p>
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
            💾 儲存並更新計畫
          </button>
        </form>
      </div>

      {/* Data portability panel */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>💾 資料備份與還原 (Data Portability)</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '1.25rem' }}>
          本系統採用本機儲存 (localStorage)，為了防止瀏覽器快取被清空時資料丟失，建議定期匯出備份 JSON。
        </p>
        <div className="flex gap-2">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleExport}>
            📤 匯出本機資料 JSON
          </button>
          
          <div style={{ flex: 1, position: 'relative' }}>
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => document.getElementById('import-file-btn').click()}>
              📥 匯入資料備份 JSON
            </button>
            <input 
              id="import-file-btn" 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleImport}
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid var(--danger-light)' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--danger)', marginBottom: '0.75rem' }}>⚠️ 危險區域 (Danger Zone)</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '1.25rem' }}>
          以下操作將直接影響您的本機儲存資料，請務必謹慎執行！需要密碼以確保安全。
        </p>
        <div className="flex gap-2">
          <button 
            className="btn btn-outline" 
            style={{ flex: 1, color: 'var(--danger)', borderColor: 'var(--danger)' }}
            onClick={handleClearClick}
          >
            🧹 清除目前帳號資料
          </button>
          
          <button 
            className="btn btn-danger" 
            style={{ flex: 1 }}
            onClick={handleDeleteClick}
          >
            🗑️ 徹底刪除此帳號
          </button>
        </div>
      </div>
    </div>
  );
}
