import { useState, useEffect } from 'react';

export default function ActiveMockTest({ setCurrentPage, onMockExamSubmitted, questions = [] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> selectedChoice
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins for Mini Mock

  // Select 5 Listening, 10 Part 5, and 5 Part 7 questions to make a balanced 20-question Mini Mock Test
  const activeQuestions = (() => {
    const listening = questions.filter(q => q.part >= 1 && q.part <= 4).slice(0, 5);
    const part5 = questions.filter(q => q.part === 5).slice(0, 10);
    const part7 = questions.filter(q => q.part === 7).slice(0, 5);
    return [...listening, ...part5, ...part7];
  })();

  const submitExam = () => {
    let correctCount = 0;
    let listeningCorrect = 0;
    let listeningTotal = 0;
    let readingCorrect = 0;
    let readingTotal = 0;
    const wrongList = [];

    activeQuestions.forEach(q => {
      const userAns = answers[q.id] || '';
      const isCorrect = userAns === q.correctAnswer;
      const isListening = q.part >= 1 && q.part <= 4;
      
      if (isListening) {
        listeningTotal++;
        if (isCorrect) listeningCorrect++;
      } else {
        readingTotal++;
        if (isCorrect) readingCorrect++;
      }

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

    // Simulate authentic Listening and Reading scaled scores (5 to 495 each)
    const lPercent = listeningTotal > 0 ? listeningCorrect / listeningTotal : 0;
    const rPercent = readingTotal > 0 ? readingCorrect / readingTotal : 0;
    
    let lScore = Math.round(lPercent * 490 + 5);
    let rScore = Math.round(rPercent * 490 + 5);
    
    // Round to standard 5-point intervals
    lScore = Math.round(lScore / 5) * 5;
    rScore = Math.round(rScore / 5) * 5;
    
    if (lScore > 495) lScore = 495;
    if (lScore < 5) lScore = 5;
    if (rScore > 495) rScore = 495;
    if (rScore < 5) rScore = 5;
    
    const score = lScore + rScore;

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

        {q.passage && (
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
            {q.passage}
          </div>
        )}

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
