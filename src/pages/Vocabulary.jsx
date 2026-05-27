// src/pages/Vocabulary.jsx
import { useState } from 'react';
import VocabularyCard from '../components/VocabularyCard';

export default function Vocabulary({ currentUser, onWordStatusChanged, vocabulary = [] }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [flippedCards, setFlippedCards] = useState({}); // cardId -> boolean

  const categories = [
    'Business', 'Office', 'Meeting', 'Travel', 'Hotel', 
    'Finance', 'Hiring', 'Customer Service', 'Shipping', 'Restaurant'
  ];

  // Helper to get status of a word for current user
  const getWordStatus = (wordId) => {
    return currentUser?.vocabularyProgress?.[wordId] || 'new';
  };

  const filteredVocab = vocabulary.filter(vocab => {
    const matchesSearch = vocab.word.toLowerCase().includes(search.toLowerCase()) || 
                          vocab.meaningZh.includes(search);
    const matchesCategory = !categoryFilter || vocab.category === categoryFilter;
    
    const wordStatus = getWordStatus(vocab.id);
    const matchesStatus = !statusFilter || wordStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const toggleFlip = (wordId) => {
    setFlippedCards(prev => ({
      ...prev,
      [wordId]: !prev[wordId]
    }));
  };

  // Count progress numbers
  const getTodayWords = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const record = currentUser?.dailyRecords?.find(r => r.date === todayStr) || {
      wordsLearned: 0
    };
    return record.wordsLearned;
  };
  const wordsDone = getTodayWords();
  const goal = currentUser?.goals?.dailyVocabularyGoal || 30;

  return (
    <div className="flex flex-col gap-3">
      {/* Upper Panel */}
      <div className="card flex justify-between align-center">
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>📖 TOEIC 核心單字庫</h1>
          <p style={{ color: 'var(--text-sub)' }}>
            雙面字卡翻轉複習，點擊單字卡即可看釋義與例句。
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sub)' }}>今日已學 / 每日目標</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
            {wordsDone} / {goal}
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="card grid grid-cols-3 gap-2" style={{ padding: '1rem 1.5rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">🔍 搜尋單字或中文</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="例如: collaborate 或 合作" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">📂 商業分類篩選</label>
          <select 
            className="form-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">全部商業分類</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">🏷️ 掌握度狀態篩選</label>
          <select 
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">全部狀態</option>
            <option value="new">🆕 未學習 (New)</option>
            <option value="learning">⏳ 學習中 (Learning)</option>
            <option value="review">🔄 需複習 (Review)</option>
            <option value="mastered">✅ 已掌握 (Mastered)</option>
          </select>
        </div>
      </div>

      {/* Word Grid */}
      {filteredVocab.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span style={{ fontSize: '2rem' }}>🔍</span>
          <h3 style={{ marginTop: '0.5rem' }}>找不到符合條件的單字</h3>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>請嘗試調整搜尋關鍵字或篩選器</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filteredVocab.map(vocab => {
            const isFlipped = !!flippedCards[vocab.id];
            const currentStatus = getWordStatus(vocab.id);

            return (
              <VocabularyCard 
                key={vocab.id}
                vocab={vocab}
                isFlipped={isFlipped}
                currentStatus={currentStatus}
                onFlip={() => toggleFlip(vocab.id)}
                onStatusChange={(status) => onWordStatusChanged(vocab.id, status)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
