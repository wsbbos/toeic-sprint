// src/components/VocabularyCard.jsx
import { speakText, isSpeechSupported } from '../utils/speech';

export default function VocabularyCard({ vocab, isFlipped, currentStatus, onFlip, onStatusChange }) {
  const getBadgeClass = (status) => {
    switch (status) {
      case 'learning': return 'badge badge-learning';
      case 'review': return 'badge badge-review';
      case 'mastered': return 'badge badge-mastered';
      default: return 'badge badge-new';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'learning': return '學習中';
      case 'review': return '需複習';
      case 'mastered': return '已掌握';
      default: return '未學習';
    }
  };

  const handleActionClick = (e, status) => {
    e.stopPropagation(); // Prevent flipping when clicking status button
    onStatusChange(status);
  };

  const speechAvailable = isSpeechSupported();

  return (
    <div className={`vocab-card-wrapper ${isFlipped ? 'flipped' : ''}`} onClick={onFlip}>
      <div className="vocab-card-inner">
        {/* FRONT */}
        <div className="vocab-card-front">
          <div className="flex justify-between align-center">
            <span className="badge badge-new" style={{ backgroundColor: 'hsl(220, 15%, 92%)', color: 'var(--text-sub)' }}>
              {vocab.category}
            </span>
            <span className={getBadgeClass(currentStatus)}>
              {getStatusText(currentStatus)}
            </span>
          </div>
          
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
              {vocab.word}
            </h2>
            <span style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-light)' }}>
              {vocab.partOfSpeech}
            </span>
          </div>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center' }}>
            💡 點擊卡片翻轉看釋義
          </div>
        </div>

        {/* BACK */}
        <div className="vocab-card-back">
          <div className="flex justify-between align-center" style={{ marginBottom: '0.5rem' }}>
            <div className="flex align-center gap-1">
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{vocab.word}</span>
              <button 
                type="button"
                className="btn-outline"
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  cursor: speechAvailable ? 'pointer' : 'not-allowed', 
                  fontSize: '0.9rem', 
                  padding: '2px 4px', 
                  borderRadius: 'var(--radius-sm)',
                  opacity: speechAvailable ? 1 : 0.4
                }}
                disabled={!speechAvailable}
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(vocab.word, 1.0);
                }}
                title={speechAvailable ? "🔊 正常語速發音" : "此瀏覽器不支援發音"}
              >
                🔊
              </button>
              <button 
                type="button"
                className="btn-outline"
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  cursor: speechAvailable ? 'pointer' : 'not-allowed', 
                  fontSize: '0.9rem', 
                  padding: '2px 4px', 
                  borderRadius: 'var(--radius-sm)',
                  opacity: speechAvailable ? 1 : 0.4
                }}
                disabled={!speechAvailable}
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(vocab.word, 0.7);
                }}
                title={speechAvailable ? "🐌 慢速發音" : "此瀏覽器不支援發音"}
              >
                🐌
              </button>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>釋義</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              {vocab.meaningZh}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: '1.4' }}>
              <strong>例句：</strong><br />
              {vocab.exampleSentence}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem', lineHeight: '1.4' }}>
              {vocab.exampleTranslation}
            </div>
          </div>

          {/* Quick status selector */}
          <div className="flex gap-1" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
            <button 
              className={`btn btn-sm ${currentStatus === 'learning' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.25rem' }}
              onClick={(e) => handleActionClick(e, 'learning')}
            >
              不熟
            </button>
            <button 
              className={`btn btn-sm ${currentStatus === 'review' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.25rem' }}
              onClick={(e) => handleActionClick(e, 'review')}
            >
              複習
            </button>
            <button 
              className={`btn btn-sm ${currentStatus === 'mastered' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.25rem' }}
              onClick={(e) => handleActionClick(e, 'mastered')}
            >
              掌握
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
