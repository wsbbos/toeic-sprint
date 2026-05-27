// src/pages/QuestionPractice.jsx
import { useState, useEffect } from 'react';

export default function QuestionPractice({ setCurrentPage, practiceFilter, onAnswerSubmitted, questions = [] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionResults, setSessionResults] = useState([]);
  const [focusMode, setFocusMode] = useState(false); // Focus Mode Toggle

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter questions based on part/type
  const activeQuestions = questions.filter(q => {
    if (!practiceFilter) return true;
    if (practiceFilter === '5') return q.part === 5;
    if (practiceFilter === '7') return q.part === 7;
    if (practiceFilter === 'listening') return q.part === 1 || q.part === 2 || q.part === 3 || q.part === 4;
    return true;
  });

  const currentQuestion = activeQuestions[currentIdx];

  const handleSelect = (choice) => {
    if (submitted) return;
    setSelectedChoice(choice);
  };

  const handleSubmit = () => {
    if (!selectedChoice || submitted) return;
    setSubmitted(true);

    const isCorrect = selectedChoice === currentQuestion.correctAnswer;
    
    // Call high level progress tracker
    onAnswerSubmitted(currentQuestion, selectedChoice, isCorrect);

    // Save locally to display at the end of session
    setSessionResults(prev => [...prev, {
      question: currentQuestion,
      userAnswer: selectedChoice,
      isCorrect
    }]);
  };

  const handleNext = () => {
    if (currentIdx + 1 < activeQuestions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedChoice('');
      setSubmitted(false);
    } else {
      // Completed all questions in list! Show summary dialog
      const corrects = sessionResults.filter(r => r.isCorrect).length;
      alert(`🎉 恭喜你！已完成本次練習。\n作答題量：${activeQuestions.length} 題\n答對題數：${corrects} 題\n正確率：${Math.round((corrects / activeQuestions.length) * 100)}%\n\n系統已自動將答錯題記錄至錯題本。`);
      setCurrentPage('dashboard');
    }
  };

  if (activeQuestions.length === 0) {
    return (
      <div className="practice-container card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>📭 目前該單元沒有題目</h2>
        <p style={{ color: 'var(--text-sub)', marginTop: '0.5rem' }}>請返回練習中心選擇其他項目</p>
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setCurrentPage('practice-center')}>
          返回練習中心
        </button>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIdx) / activeQuestions.length) * 100);

  return (
    <div className="practice-container" style={{ maxWidth: focusMode ? '800px' : '700px', transition: 'max-width 0.4s ease' }}>
      {/* Practice Header with Progress and Timer */}
      <div className="flex justify-between align-center" style={{ marginBottom: '1.25rem' }}>
        <button className="btn btn-outline btn-sm" onClick={() => {
          if (confirm('確定要離開本次練習嗎？未完成的進度將不會計入日誌。')) {
            setCurrentPage('practice-center');
          }
        }}>
          ✕ 結束練習
        </button>
        
        <button 
          className={`btn btn-sm ${focusMode ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFocusMode(prev => !prev)}
          style={{ transition: 'all 0.3s ease' }}
        >
          {focusMode ? '👀 退出專注模式' : '🧘 啟動專注模式'}
        </button>

        <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
          ⏱️ 時間: {Math.floor(seconds / 60)} 分 {seconds % 60} 秒
        </div>
        <div style={{ fontWeight: 600, color: 'var(--text-sub)' }}>
          題號: {currentIdx + 1} / {activeQuestions.length}
        </div>
      </div>

      <div className="progress-bar-container" style={{ height: '6px', marginBottom: '2rem' }}>
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, background: 'var(--secondary)' }} />
      </div>

      {/* Main Question Card */}
      <div className="card" style={{ 
        padding: focusMode ? '3rem 4rem' : '2.5rem', 
        border: focusMode ? '2px solid var(--primary)' : '1px solid var(--border-color)',
        boxShadow: focusMode ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        backgroundColor: focusMode ? 'hsl(220, 25%, 99%)' : 'var(--bg-card)',
        transition: 'padding 0.4s ease, border 0.4s ease'
      }}>
        <div className="flex justify-between align-center" style={{ marginBottom: '1.25rem' }}>
          <span className="badge badge-new" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
            Part {currentQuestion.part} - {currentQuestion.type || '精選'}
          </span>
          <span className={`badge ${currentQuestion.difficulty === 'Easy' ? 'badge-mastered' : currentQuestion.difficulty === 'Medium' ? 'badge-review' : 'badge-learning'}`}>
            {currentQuestion.difficulty || 'Medium'}
          </span>
        </div>

        {currentQuestion.passage && (
          <div style={{ 
            backgroundColor: 'hsl(220, 10%, 97%)', 
            padding: '1.5rem', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem',
            maxHeight: focusMode ? '350px' : '260px',
            overflowY: 'auto',
            fontSize: focusMode ? '1.05rem' : '0.95rem',
            lineHeight: '1.7',
            whiteSpace: 'pre-wrap',
            transition: 'all 0.4s ease'
          }}>
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>[閱讀短文 Passage]</strong>
            {currentQuestion.passage}
          </div>
        )}

        {/* Listening Mock Audio Control */}
        {(currentQuestion.part >= 1 && currentQuestion.part <= 4) && (
          <div className="audio-player-mock" style={{ padding: '1.25rem', backgroundColor: 'var(--primary-light)', border: '1px dashed var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2rem', animation: submitted ? 'none' : 'float 3s ease-in-out infinite' }}>🎧</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>聽力測驗模擬音檔</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>點擊播放按鈕模擬日常聽力聽感</div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => alert('聽力音檔播放中... 🔊')}>
              🔊 播放 Mock Audio
            </button>
          </div>
        )}

        <h3 style={{ 
          fontSize: focusMode ? '1.35rem' : '1.15rem', 
          marginBottom: '1.75rem', 
          fontWeight: 700, 
          lineHeight: '1.5',
          color: 'var(--text-main)',
          transition: 'font-size 0.4s ease'
        }}>
          {currentQuestion.question}
        </h3>

        <div className="choice-container" style={{ gap: focusMode ? '1rem' : '0.75rem' }}>
          {Object.entries(currentQuestion.choices || {}).map(([key, value]) => {
            let btnClass = 'choice-btn';
            if (submitted) {
              if (key === currentQuestion.correctAnswer) btnClass += ' correct';
              else if (key === selectedChoice) btnClass += ' wrong';
              else btnClass += ' disabled';
            } else if (key === selectedChoice) {
              btnClass += ' selected';
            }

            return (
              <button 
                key={key} 
                className={btnClass}
                onClick={() => handleSelect(key)}
                disabled={submitted}
                style={{ 
                  padding: focusMode ? '1.25rem 1.5rem' : '1rem 1.25rem',
                  fontSize: focusMode ? '1.05rem' : '0.95rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <span className="choice-letter">{key}</span>
                <span>{value}</span>
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className={`explanation-box ${selectedChoice === currentQuestion.correctAnswer ? '' : 'incorrect'}`} style={{ marginTop: '2rem' }}>
            <h4 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem', color: selectedChoice === currentQuestion.correctAnswer ? 'var(--success)' : 'var(--danger)' }}>
              {selectedChoice === currentQuestion.correctAnswer ? '🎉 恭喜你！答對了！' : '❌ 答錯了，再接再厲！'}
            </h4>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>
              正確答案是： <span className="badge badge-mastered" style={{ fontSize: '0.85rem' }}>{currentQuestion.correctAnswer}</span>
            </p>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.75rem', lineHeight: '1.6' }}>
              <strong>中文解析：</strong> {currentQuestion.explanation}
            </div>
          </div>
        )}

        <div className="flex justify-between" style={{ marginTop: '2.5rem' }}>
          {!submitted ? (
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
              onClick={handleSubmit}
              disabled={!selectedChoice}
            >
              提交作答
            </button>
          ) : (
            <button 
              className="btn btn-accent" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
              onClick={handleNext}
            >
              {currentIdx + 1 === activeQuestions.length ? '🎉 完成本次練習' : '下一題 ➔'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
