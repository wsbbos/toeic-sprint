// src/pages/PracticeCenter.jsx
import { getPracticeReadyListeningQuestions, listeningQuestionBank } from '../data/listeningQuestionBank';

export default function PracticeCenter({ setCurrentPage, setPracticeFilter }) {
  const availableListeningCount = getPracticeReadyListeningQuestions().length;
  const totalListeningCount = listeningQuestionBank.length;
  const listeningPracticeOptions = [
    { label: '快速練習', count: 5 },
    { label: '標準練習', count: 10 },
    { label: '每日聽力', count: 20 }
  ];

  const startListeningPractice = (option) => {
    if (setPracticeFilter) {
      setPracticeFilter({
        type: 'listening',
        count: option.count,
        label: option.label
      });
    }
    setCurrentPage('question-practice');
  };

  const practiceModes = [
    {
      id: 'part5',
      title: 'Part 5 單字與文法填空',
      desc: 'Incomplete Sentences - 訓練字彙詞性、動詞時態、介系詞與連接詞。',
      questions: '20 題庫',
      badge: 'Grammar & Vocab',
      action: () => {
        if (setPracticeFilter) setPracticeFilter('5');
        setCurrentPage('question-practice');
      }
    },
    {
      id: 'part7',
      title: 'Part 7 閱讀理解訓練',
      desc: 'Reading Comprehension - 訓練主旨題、細節推論、同義替換與多篇幅文章快速定位。',
      questions: '10 題庫',
      badge: 'Reading Comprehension',
      action: () => {
        if (setPracticeFilter) setPracticeFilter('7');
        setCurrentPage('question-practice');
      }
    },
    {
      id: 'listening',
      title: 'Listening 聽力模擬演練',
      desc: 'Listening Question Bank - 依題數抽取可用聽力題；Part 1 必須有圖片才會進入有效練習。',
      questions: `${availableListeningCount} / ${totalListeningCount} 題可練`,
      badge: 'Listening TTS Demo',
      action: null
    }
  ];

  return (
    <div className="flex flex-col gap-3">
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>🎯 練習中心</h1>
        <p style={{ color: 'var(--text-sub)' }}>選擇您今天想要加強的 TOEIC 考試單元</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {practiceModes.map(mode => (
          <div key={mode.id} className="card flex flex-col justify-between" style={{ minHeight: mode.id === 'listening' ? '300px' : '240px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-review">{mode.badge}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>{mode.questions}</span>
              </div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{mode.title}</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>{mode.desc}</p>
              {mode.id === 'listening' && availableListeningCount < 5 && (
                <p style={{ fontSize: '0.82rem', color: 'var(--warning)', fontWeight: 700, marginTop: '0.75rem', lineHeight: '1.5' }}>
                  目前 Listening 題庫只有 {availableListeningCount} 題可用，已排除缺少圖片的 Part 1 題。
                </p>
              )}
            </div>

            {mode.id === 'listening' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {listeningPracticeOptions.map(option => (
                  <button
                    key={option.count}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => startListeningPractice(option)}
                  >
                    {option.label}：{option.count} 題
                  </button>
                ))}
              </div>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={mode.action}
              >
                開始練習 ➔
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
