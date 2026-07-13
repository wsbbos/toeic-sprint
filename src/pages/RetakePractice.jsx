// src/pages/RetakePractice.jsx
import { useState } from 'react';

export default function RetakePractice({ setCurrentPage, retakeList = [], onRetakeCompleted, onUpdateReason }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showReasonSelect, setShowReasonSelect] = useState(false);

  const currentItem = retakeList[currentIdx];

  const handleSelect = (choice) => {
    if (submitted) return;
    setSelectedChoice(choice);
  };

  const errorReasons = [
    { value: 'vocab', label: '單字不會' },
    { value: 'grammar', label: '文法不懂' },
    { value: 'long_sentence', label: '句子太長看不懂' },
    { value: 'careless', label: '看太快粗心' },
    { value: 'time_limit', label: '時間不夠' },
    { value: 'trap_choice', label: '被陷阱選項騙' },
    { value: 'listening_keyword', label: '聽力沒聽到關鍵字' }
  ];

  const handleSubmit = () => {
    if (!selectedChoice || submitted) return;
    setSubmitted(true);

    const isCorrect = selectedChoice === currentItem.correctAnswer;
    onRetakeCompleted(currentItem.questionId, isCorrect);

    if (!isCorrect) {
      // Show error reason prompt
      setShowReasonSelect(true);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < retakeList.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedChoice('');
      setSubmitted(false);
      setShowReasonSelect(false);
    } else {
      alert('錯題重新演練結束！系統已更新複習次數與掌握度狀態。');
      setCurrentPage('wrong-book');
    }
  };

  const handleReasonSelect = (reasonVal) => {
    onUpdateReason(currentItem.questionId, reasonVal);
    setShowReasonSelect(false);
  };

  if (retakeList.length === 0) return null;

  return (
    <div data-testid="retake-practice" className="practice-container">
      <div className="flex justify-between align-center" style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setCurrentPage('wrong-book')}>
          ✕ 結束重練
        </button>
        <div style={{ fontWeight: 600, color: 'var(--danger)' }}>
          錯題演練中 🔄
        </div>
        <div style={{ fontWeight: 600, color: 'var(--text-sub)' }}>
          進度: {currentIdx + 1} / {retakeList.length}
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {currentItem.passage && (
          <div style={{ 
            backgroundColor: 'hsl(220, 10%, 97%)', 
            padding: '1.25rem', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem',
            maxHeight: '260px',
            overflowY: 'auto',
            fontSize: '0.95rem',
            whiteSpace: 'pre-wrap'
          }}>
            {currentItem.passage}
          </div>
        )}

        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          {currentItem.question}
        </h3>

        <div className="choice-container">
          {Object.entries(currentItem.choices || {}).map(([key, value]) => {
            let btnClass = 'choice-btn';
            if (submitted) {
              if (key === currentItem.correctAnswer) btnClass += ' correct';
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
              >
                <span className="choice-letter">{key}</span>
                <span>{value}</span>
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className={`explanation-box ${selectedChoice === currentItem.correctAnswer ? '' : 'incorrect'}`} style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
              {selectedChoice === currentItem.correctAnswer ? '🎉 重新解答正確！' : '❌ 仍然答錯了！'}
            </h4>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              正確答案是 <strong>{currentItem.correctAnswer}</strong>
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.5rem' }}>
              <strong>中文解析：</strong> {currentItem.explanation}
            </div>
          </div>
        )}

        {/* Dynamic reason select block */}
        {showReasonSelect && (
          <div className="card" style={{ backgroundColor: 'var(--danger-light)', borderColor: 'var(--danger-light)', marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
            <h4 style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '0.75rem' }}>
              ❓ 本次答錯的主要原因是什麼？
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {errorReasons.map(r => (
                <button 
                  key={r.value}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', backgroundColor: 'white' }}
                  onClick={() => handleReasonSelect(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between" style={{ marginTop: '2rem' }}>
          {!submitted ? (
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={handleSubmit}
              disabled={!selectedChoice}
            >
              提交答案
            </button>
          ) : (
            <button 
              className="btn btn-accent" 
              style={{ width: '100%' }}
              onClick={handleNext}
              disabled={showReasonSelect} // Force choosing reason before proceeding
            >
              {currentIdx + 1 === retakeList.length ? '完成錯題練習' : '下一題 ➔'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
