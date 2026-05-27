// src/components/Navbar.jsx

export default function Navbar({ currentPage, setCurrentPage, currentUser, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <a href="#dashboard" className="nav-brand" onClick={(e) => { e.preventDefault(); if (currentUser) setCurrentPage('dashboard'); }}>
          <span>🚀 TOEIC Sprint</span>
        </a>
        
        {currentUser && (
          <ul className="nav-links">
            <li>
              <a 
                href="#dashboard" 
                className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}
              >
                儀表板
              </a>
            </li>
            <li>
              <a 
                href="#practice" 
                className={`nav-link ${currentPage === 'practice-center' || currentPage === 'question-practice' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage('practice-center'); }}
              >
                練習中心
              </a>
            </li>
            <li>
              <a 
                href="#vocab" 
                className={`nav-link ${currentPage === 'vocabulary' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage('vocabulary'); }}
              >
                單字庫
              </a>
            </li>
            <li>
              <a 
                href="#wrongbook" 
                className={`nav-link ${currentPage === 'wrong-book' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage('wrong-book'); }}
              >
                錯題本
              </a>
            </li>
            <li>
              <a 
                href="#mocktest" 
                className={`nav-link ${currentPage === 'mock-test' || currentPage === 'result' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage('mock-test'); }}
              >
                模擬考
              </a>
            </li>
            <li>
              <a 
                href="#stats" 
                className={`nav-link ${currentPage === 'statistics' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage('statistics'); }}
              >
                統計分析
              </a>
            </li>
            <li>
              <a 
                href="#friends" 
                className={`nav-link ${currentPage === 'friends' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage('friends'); }}
              >
                互相監督
              </a>
            </li>
            <li>
              <a 
                href="#settings" 
                className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage('settings'); }}
              >
                設定
              </a>
            </li>
          </ul>
        )}

        <div className="flex align-center gap-2">
          {currentUser ? (
            <>
              <div className="streak-badge">
                🔥 {currentUser.progress?.streakDays || 0} 天
              </div>
              <div className="score-badge">
                🎯 {currentUser.goals?.targetScore || 700}
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                {currentUser.username}
              </span>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={onLogout}
                title="登出 / 切換帳號"
              >
                切換帳號
              </button>
            </>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500 }}>
              未登入
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
