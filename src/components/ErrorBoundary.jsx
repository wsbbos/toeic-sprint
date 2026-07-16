import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('Runtime boundary activated.', {
        name: error?.name || 'Error',
        componentStack: errorInfo?.componentStack || '',
      });
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
      }}>
        <section
          className="card"
          role="alert"
          aria-live="assertive"
          style={{
            maxWidth: '550px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '2.5rem',
            textAlign: 'center',
            borderTop: '6px solid var(--danger, #ef4444)',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>⚠️</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.75rem' }}>
            應用程式暫時發生錯誤
          </h1>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            你的本機學習資料仍會保留。請重新整理；若問題持續發生，請回到首頁後再試。
          </p>

          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '6px',
            padding: '1rem',
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: '#991b1b',
            marginBottom: '1.5rem',
            overflowWrap: 'anywhere',
          }}>
            <strong>錯誤代碼：</strong><br />
            APP_RENDER_FAILURE（不含個人資料）
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            <button type="button" onClick={this.handleRefresh} className="btn btn-primary" style={{ flex: '1 1 180px' }}>
              重新整理頁面
            </button>
            <button type="button" onClick={this.handleGoHome} className="btn btn-outline" style={{ flex: '1 1 180px' }}>
              回到首頁
            </button>
          </div>
        </section>
      </main>
    );
  }
}
