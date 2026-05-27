// src/components/StatCard.jsx

export default function StatCard({ title, value, icon, color = 'var(--primary)', subtext }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sub)' }}>{title}</span>
          <span style={{ fontSize: '1.2rem', color: color }}>{icon}</span>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-main)', margin: '0.25rem 0' }}>
          {value}
        </div>
      </div>
      {subtext && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 500 }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
