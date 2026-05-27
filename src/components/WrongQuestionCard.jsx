// src/components/WrongQuestionCard.jsx

export default function WrongQuestionCard({ item, onUpdateReason, onUpdateStatus, onRemove, onRetake }) {
  const errorReasons = [
    { value: 'vocab', label: '單字不會' },
    { value: 'grammar', label: '文法不懂' },
    { value: 'long_sentence', label: '句子太長看不懂' },
    { value: 'careless', label: '看太快粗心' },
    { value: 'time_limit', label: '時間不夠' },
    { value: 'trap_choice', label: '被陷阱選項騙' },
    { value: 'listening_keyword', label: '聽力沒聽到關鍵字' }
  ];

  return (
    <div className="card" style={{ borderLeft: '5px solid var(--danger)', padding: '1.5rem' }}>
      {/* Header */}
      <div className="flex justify-between align-center" style={{ marginBottom: '1rem' }}>
        <div className="flex gap-2 align-center">
          <span className="badge badge-new">Part {item.part}</span>
          <span className="badge badge-review" style={{ backgroundColor: 'hsl(350, 75%, 95%)', color: 'var(--danger)' }}>
            答錯次數: {item.wrongCount || 1} 次
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
            複習次數: {item.reviewCount || 0}
          </span>
        </div>
        
        <select 
          className="form-input btn-sm" 
          style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
          value={item.errorReason || ''}
          onChange={(e) => onUpdateReason(item.questionId, e.target.value)}
        >
          <option value="">❓ 選擇錯誤原因</option>
          {errorReasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Passage / Question */}
      {item.passage && (
        <div style={{ 
          backgroundColor: 'hsl(220, 10%, 97%)', 
          padding: '0.75rem', 
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          marginBottom: '1rem'
        }}>
          {item.passage}
        </div>
      )}
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
        {item.question}
      </h3>

      {/* Answer comparison */}
      <div style={{ 
        display: 'flex', 
        gap: '2rem', 
        fontSize: '0.85rem', 
        backgroundColor: 'var(--primary-light)', 
        padding: '0.75rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1rem'
      }}>
        <div>
          ❌ 你的回答: <strong style={{ color: 'var(--danger)' }}>{item.userAnswer}</strong>
        </div>
        <div>
          ✅ 正確答案: <strong style={{ color: 'var(--success)' }}>{item.correctAnswer}</strong>
        </div>
        <div>
          狀態: <span style={{ fontWeight: 600 }}>{item.status || '未理解'}</span>
        </div>
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '1.25rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.5rem' }}>
        <strong>中文解析：</strong>{item.explanation}
      </div>

      {/* Actions */}
      <div className="flex gap-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onRetake(item)}>
          🔄 重新練習此題
        </button>
        
        {item.status !== '已掌握' ? (
          <button className="btn btn-outline btn-sm" style={{ flex: 1, color: 'var(--success)' }} onClick={() => onUpdateStatus(item.questionId, '已掌握')}>
            ✅ 標記為已掌握
          </button>
        ) : (
          <button className="btn btn-outline btn-sm" style={{ flex: 1, color: 'var(--warning)' }} onClick={() => onUpdateStatus(item.questionId, '複習中')}>
            ⏳ 設為複習中
          </button>
        )}

        <button className="btn btn-danger btn-sm" onClick={() => onRemove(item.questionId)} title="移除錯題">
          🗑️ 移除
        </button>
      </div>
    </div>
  );
}
