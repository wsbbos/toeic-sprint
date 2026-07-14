// src/pages/WrongBook.jsx
import { useState } from 'react';
import WrongQuestionCard from '../components/WrongQuestionCard';
import EmptyLearningState from '../components/visuals/EmptyLearningState.jsx';

export default function WrongBook({ currentUser, onUpdateReason, onUpdateStatus, onRemoveWrongQuestion, onStartRetakeSession }) {
  const [partFilter, setPartFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const wrongBook = currentUser?.wrongBook || [];

  const errorReasons = [
    { value: 'vocab', label: '單字不會' },
    { value: 'grammar', label: '文法不懂' },
    { value: 'long_sentence', label: '句子太長看不懂' },
    { value: 'careless', label: '看太快粗心' },
    { value: 'time_limit', label: '時間不夠' },
    { value: 'trap_choice', label: '被陷阱選項騙' },
    { value: 'listening_keyword', label: '聽力沒聽到關鍵字' }
  ];

  // Filtering logic
  const filteredBook = wrongBook.filter(item => {
    let matchesPart = true;
    if (partFilter === 'listening') {
      matchesPart = item.part >= 1 && item.part <= 4;
    } else if (partFilter) {
      matchesPart = String(item.part) === partFilter;
    }
    const matchesReason = !reasonFilter || item.errorReason === reasonFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesPart && matchesReason && matchesStatus;
  });

  const handleRetakeAll = () => {
    if (filteredBook.length === 0) return;
    onStartRetakeSession(filteredBook);
  };

  // Calculations for progress indicators
  const totalWrong = wrongBook.length;
  const masteredCount = wrongBook.filter(w => w.status === '已掌握').length;
  const reviewCount = wrongBook.filter(w => w.status === '複習中').length;
  const unlearnedCount = wrongBook.filter(w => w.status === '未理解').length;
  const masteredPercent = totalWrong > 0 ? Math.round((masteredCount / totalWrong) * 100) : 0;

  return (
    <div data-testid="wrong-book" className="flex flex-col gap-3">
      {/* Upper Panel */}
      <div className="card flex justify-between align-center flex-col md:flex-row gap-3" style={{ borderLeft: '5px solid var(--danger)' }}>
        <div>
          <span className="badge badge-learning" style={{ marginBottom: '0.5rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
            ERRORS ANALYZER 🎯
          </span>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>❌ 錯題本與弱點診斷</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            系統自動記錄做錯的題目。請分類標記錯誤原因並反覆演練，直到完全掌握。
          </p>
        </div>
        
        {/* Mastered Progress Card */}
        <div className="flex gap-3 align-center" style={{ 
          backgroundColor: 'hsl(220, 15%, 97%)',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          minWidth: '280px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: `conic-gradient(var(--success) ${masteredPercent}%, hsl(220, 10%, 85%) 0)`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {masteredPercent}%
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>掌握度</span>
          </div>

          <div style={{ flex: 1, fontSize: '0.85rem' }}>
            <div className="flex justify-between" style={{ marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--danger)' }}>🆕 未理解:</span>
              <strong style={{ fontFamily: 'var(--font-display)' }}>{unlearnedCount} 題</strong>
            </div>
            <div className="flex justify-between" style={{ marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--warning)' }}>⏳ 複習中:</span>
              <strong style={{ fontFamily: 'var(--font-display)' }}>{reviewCount} 題</strong>
            </div>
            <div className="flex justify-between">
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>✅ 已掌握:</span>
              <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--success)' }}>{masteredCount} / {totalWrong} 題</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and retake panel */}
      <div className="card flex justify-between align-center gap-2 flex-col md:flex-row" style={{ padding: '1rem 1.5rem' }}>
        <div className="flex gap-2 flex-col sm:flex-row" style={{ flex: 1, width: '100%' }}>
          <div style={{ flex: 1 }}>
            <select 
              className="form-input" 
              value={partFilter} 
              onChange={(e) => setPartFilter(e.target.value)}
            >
              <option value="">全部 TOEIC Part 題型</option>
              <option value="5">Part 5 Incomplete Sentences</option>
              <option value="7">Part 7 Reading Comprehension</option>
              <option value="listening">聽力 demo 題型 (Part 1-4)</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <select 
              className="form-input" 
              value={reasonFilter} 
              onChange={(e) => setReasonFilter(e.target.value)}
            >
              <option value="">全部錯誤原因</option>
              {errorReasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <select 
              className="form-input" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全部複習狀態</option>
              <option value="未理解">🆕 未理解</option>
              <option value="複習中">⏳ 複習中</option>
              <option value="已掌握">✅ 已掌握</option>
            </select>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          disabled={filteredBook.length === 0}
          data-testid="retake-all"
          onClick={handleRetakeAll}
          style={{ width: '100%', maxWidth: '280px', marginTop: '0.5rem' }}
        >
          🔄 重新練習篩選錯題 ({filteredBook.length})
        </button>
      </div>

      {/* Wrong List */}
      {filteredBook.length === 0 ? (
        <EmptyLearningState
          variant="review"
          title={totalWrong === 0 ? '你的錯題本目前是空的' : '找不到符合篩選條件的錯題'}
          description={totalWrong === 0
            ? '完成練習後，答錯題目會自動進入這裡，並依複習時程安排下一次作答。'
            : '請調整 Part、錯誤原因或掌握狀態篩選器，再查看其他錯題紀錄。'}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBook.map((item) => (
            <WrongQuestionCard 
              key={item.questionId}
              item={item}
              onUpdateReason={onUpdateReason}
              onUpdateStatus={onUpdateStatus}
              onRemove={onRemoveWrongQuestion}
              onRetake={(q) => onStartRetakeSession([q])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
