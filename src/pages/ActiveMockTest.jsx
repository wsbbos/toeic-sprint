import { useState, useEffect } from 'react';
import DocumentRenderer from '../components/documents/DocumentRenderer.jsx';

export default function ActiveMockTest({ setCurrentPage, onMockExamSubmitted, questions = [] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> selectedChoice
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins for Mini Mock

  // Select strictly 20 complete text questions from Part 5 (12 items) and Part 7 (8 items)
  const activeQuestions = (() => {
    const validQuestions = questions.filter(q => 
      q && 
      q.id &&
      q.question && 
      q.choices && 
      Object.keys(q.choices).length >= 4 && // Standard multiple-choice
      q.correctAnswer && 
      q.explanation &&
      (q.part === 5 || q.part === 7) // Pure text questions, ignore listening parts 1-4
    );

    const part5 = validQuestions.filter(q => q.part === 5);
    const part7 = validQuestions.filter(q => q.part === 7);

    // Try to get 12 from Part 5 and 8 from Part 7
    let selectedPart5 = part5.slice(0, 12);
    let selectedPart7 = part7.slice(0, 8);

    // Robust fallback: if one part has fewer questions, take more from the other part to make total 20
    if (selectedPart5.length < 12) {
      const extraNeeded = 12 - selectedPart5.length;
      selectedPart7 = part7.slice(0, 8 + extraNeeded);
    } else if (selectedPart7.length < 8) {
      const extraNeeded = 8 - selectedPart7.length;
      selectedPart5 = part5.slice(0, 12 + extraNeeded);
    }

    const combined = [...selectedPart5, ...selectedPart7];
    return combined.slice(0, 20); // Cap at strictly 20 questions
  })();

  const submitExam = () => {
    let correctCount = 0;
    const wrongList = [];

    activeQuestions.forEach(q => {
      const userAns = answers[q.id] || '';
      const isCorrect = userAns === q.correctAnswer;

      if (isCorrect) {
        correctCount++;
      } else {
        wrongList.push({
          questionId: q.id,
          part: q.part,
          question: q.question,
          passage: q.passage || '',
          choices: q.choices,
          userAnswer: userAns || '無作答',
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          tags: q.tags
        });
      }
    });

    const wrongCount = wrongList.length;
    const totalCount = activeQuestions.length;
    const timeSpent = 15 * 60 - timeLeft;

    // Scale score out of 990 purely on reading correct percentages
    // score = Math.round((correctCount / totalQuestions) * 980 + 10)
    // rounded to standard 5-point intervals
    const totalQuestions = totalCount || 1;
    let rawScore = Math.round((correctCount / totalQuestions) * 980 + 10);
    let score = Math.round(rawScore / 5) * 5;
    
    if (score > 990) score = 990;
    if (score < 10) score = 10;

    // This is a pure reading text mock, so lScore is 0 (or minimum 5), rScore represents the full scaled reading score
    const lScore = 0;
    const rScore = score;
    const listeningCorrect = 0;
    const listeningTotal = 0;
    const readingCorrect = correctCount;
    const readingTotal = totalQuestions;

    const questionOutcomes = activeQuestions.map(q => {
      const userAns = answers[q.id] || '';
      const isCorrect = userAns === q.correctAnswer;
      return {
        questionId: q.id,
        part: q.part,
        tags: q.tags || [],
        isCorrect: isCorrect
      };
    });

    const resultPayload = {
      id: 'mock_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      mode: 'Mini Mock',
      totalQuestions: totalCount,
      correctCount,
      wrongCount,
      score,
      lScore,
      rScore,
      listeningCorrect,
      listeningTotal,
      readingCorrect,
      readingTotal,
      timeSpent,
      wrongList,
      questionOutcomes
    };

    onMockExamSubmitted(resultPayload);
    setCurrentPage('result');
  };

  const handleAutoSubmit = () => {
    alert('時間到！系統已自動幫您提交試卷。');
    submitExam();
  };

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (qId, choice) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: choice
    }));
  };

  const handleConfirmSubmit = () => {
    if (confirm('確定要提前交卷嗎？')) {
      submitExam();
    }
  };

  const q = activeQuestions[currentIdx];

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (activeQuestions.length === 0) return null;

  return (
    <div className="practice-container">
      <div className="flex justify-between align-center" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>📝 Mini Mock Test (模擬測驗中)</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>考試中不顯示正誤解析，交卷後生成報告</span>
        </div>
        <div style={{ 
          fontSize: '1.4rem', 
          fontWeight: 800, 
          fontFamily: 'var(--font-display)', 
          color: timeLeft < 120 ? 'var(--danger)' : 'var(--text-main)',
          padding: '0.25rem 0.75rem',
          backgroundColor: timeLeft < 120 ? 'var(--danger-light)' : 'hsl(220, 10%, 93%)',
          borderRadius: 'var(--radius-sm)'
        }}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Index list */}
      <div className="card flex gap-1 justify-between align-center" style={{ padding: '0.75rem 1rem', overflowX: 'auto', marginBottom: '1.5rem' }}>
        <div className="flex gap-1">
          {activeQuestions.map((item, idx) => (
            <button
              key={idx}
              className={`btn btn-sm ${currentIdx === idx ? 'btn-primary' : answers[item.id] ? 'btn-secondary' : 'btn-outline'}`}
              style={{ minWidth: '35px', padding: '0.25rem' }}
              onClick={() => setCurrentIdx(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        
        <button className="btn btn-danger btn-sm" onClick={handleConfirmSubmit}>
          💾 立即交卷
        </button>
      </div>

      {/* Question Card */}
      <div className="card" style={{ padding: '2rem' }}>
        <div className="flex justify-between align-center" style={{ marginBottom: '1rem' }}>
          <span className="badge badge-new">Part {q.part}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>第 {currentIdx + 1} / 20 題</span>
        </div>

        {q.passage && <DocumentRenderer passage={q.passage} document={q.document} compact />}

        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          {q.question}
        </h3>

        <div className="choice-container">
          {Object.entries(q.choices || {}).map(([key, value]) => {
            const isSelected = answers[q.id] === key;
            return (
              <button 
                key={key} 
                className={`choice-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(q.id, key)}
              >
                <span className="choice-letter">{key}</span>
                <span>{value}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between gap-2" style={{ marginTop: '2rem' }}>
          <button 
            className="btn btn-outline" 
            style={{ flex: 1 }}
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
          >
            ◀ 上一題
          </button>
          
          {currentIdx + 1 < activeQuestions.length ? (
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              onClick={() => setCurrentIdx(prev => prev + 1)}
            >
              下一題 ▶
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              onClick={handleConfirmSubmit}
            >
              交卷 ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
