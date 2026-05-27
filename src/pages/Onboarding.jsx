// src/pages/Onboarding.jsx
import { useState } from 'react';

export default function Onboarding({ currentUser, onSaveGoals }) {
  const [targetScore, setTargetScore] = useState(700);
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });
  const [dailyVocabularyGoal, setDailyVocabularyGoal] = useState(30);
  const [dailyQuestionGoal, setDailyQuestionGoal] = useState(30);
  const [dailyStudyMinutesGoal, setDailyStudyMinutesGoal] = useState(45);
  const [weeklyMockTestGoal, setWeeklyMockTestGoal] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveGoals({
      targetScore: Number(targetScore),
      examDate,
      dailyVocabularyGoal: Number(dailyVocabularyGoal),
      dailyQuestionGoal: Number(dailyQuestionGoal),
      dailyStudyMinutesGoal: Number(dailyStudyMinutesGoal),
      weeklyMockTestGoal: Number(weeklyMockTestGoal)
    });
  };

  return (
    <div className="practice-container card" style={{ marginTop: '2rem', padding: '2.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span style={{ fontSize: '3rem' }}>🎯</span>
        <h1 style={{ fontSize: '1.8rem', marginTop: '1rem', color: 'var(--primary)' }}>設定你的 TOEIC 學習目標</h1>
        <p style={{ color: 'var(--text-sub)', marginTop: '0.25rem' }}>
          嗨，{currentUser?.username}！讓我們量身規劃你的黃金讀書計畫吧！
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="form-group">
          <label className="form-label">🎯 目標 TOEIC 分數</label>
          <select 
            className="form-input" 
            value={targetScore} 
            onChange={(e) => setTargetScore(Number(e.target.value))}
          >
            <option value={550}>550分 (綠色證書 - 基礎商務)</option>
            <option value={730}>730分 (藍色證書 - 中高級商務)</option>
            <option value={860}>860分 (金色證書 - 高級流暢)</option>
            <option value={900}>900分 (黃金衝刺 - 頂尖高手)</option>
            <option value={950}>950分 (學霸狂飆 - 頂級標竿)</option>
            <option value={990}>990分 (滿分大滿貫 🏆)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">📅 預計考試日期</label>
          <input 
            type="date" 
            className="form-input" 
            value={examDate} 
            onChange={(e) => setExamDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">📖 每日單字學習目標</label>
            <select 
              className="form-input" 
              value={dailyVocabularyGoal} 
              onChange={(e) => setDailyVocabularyGoal(Number(e.target.value))}
            >
              <option value={10}>10 個單字 (輕鬆熱身)</option>
              <option value={20}>20 個單字 (穩定進步)</option>
              <option value={30}>30 個單字 (推薦標準)</option>
              <option value={50}>50 個單字 (高強度衝刺)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">📝 每日題目練習目標</label>
            <select 
              className="form-input" 
              value={dailyQuestionGoal} 
              onChange={(e) => setDailyQuestionGoal(Number(e.target.value))}
            >
              <option value={15}>15 題 (維持語感)</option>
              <option value={30}>30 題 (主力訓練)</option>
              <option value={50}>50 題 (深度衝刺)</option>
              <option value={80}>80 題 (極限飛躍)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">⏱️ 每日學習時間目標</label>
            <select 
              className="form-input" 
              value={dailyStudyMinutesGoal} 
              onChange={(e) => setDailyStudyMinutesGoal(Number(e.target.value))}
            >
              <option value={20}>20 分鐘 (微習慣養成)</option>
              <option value={45}>45 分鐘 (深度學習)</option>
              <option value={60}>60 分鐘 (黃金學習期)</option>
              <option value={120}>120 分鐘 (極速狂人)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">📊 每週模擬測驗目標</label>
            <select 
              className="form-input" 
              value={weeklyMockTestGoal} 
              onChange={(e) => setWeeklyMockTestGoal(Number(e.target.value))}
            >
              <option value={1}>每週 1 回 (維持節奏)</option>
              <option value={2}>每週 2 回 (深度檢測)</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem', fontSize: '1.1rem', padding: '1rem' }}
        >
          🚀 開啟我的 TOEIC Sprint 訓練！
        </button>
      </form>
    </div>
  );
}
