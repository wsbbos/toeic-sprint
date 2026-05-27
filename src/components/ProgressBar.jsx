// src/components/ProgressBar.jsx

export default function ProgressBar({ value, max, label, showPercentage = true }) {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;

  return (
    <div className="flex flex-col gap-1" style={{ width: '100%' }}>
      {(label || showPercentage) && (
        <div className="flex justify-between align-center" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-sub)' }}>{label}</span>
          <span style={{ color: 'var(--primary)' }}>
            {value} / {max} {showPercentage && `(${percentage}%)`}
          </span>
        </div>
      )}
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
