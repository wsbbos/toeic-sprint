// src/components/Navbar.jsx
import { useState } from 'react';

export default function Navbar({ currentPage, setCurrentPage, currentUser, onLogout }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <a
            href="#home"
            className="nav-brand"
            onClick={(e) => {
              e.preventDefault();
              if (currentUser) setCurrentPage('home');
            }}
          >
            <span>🚀 TOEIC Sprint</span>
          </a>

          {currentUser && (
            <ul className="nav-links">
              <li>
                <a
                  href="#home"
                  className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}
                >
                  首頁
                </a>
              </li>
              <li>
                <a
                  href="#dashboard"
                  className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}
                >
                  學習總覽
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
                {/* Mobile Hamburger Button */}
                <button
                  type="button"
                  className="mobile-menu-btn"
                  onClick={() => setIsDrawerOpen(true)}
                  aria-label="開啟選單"
                >
                  ☰
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

      {/* Mobile sliding drawer menu overlay */}
      {currentUser && isDrawerOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={() => setIsDrawerOpen(false)} />
          <div className="mobile-drawer">
            <div className="drawer-header">
              <span className="drawer-title">🚀 TOEIC Sprint</span>
              <button type="button" className="drawer-close" onClick={() => setIsDrawerOpen(false)}>✕</button>
            </div>
            <div className="drawer-body">
              <a href="#home" className={`drawer-item ${currentPage === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentPage('home'); setIsDrawerOpen(false); }}>🏠 系統首頁</a>
              <a href="#dashboard" className={`drawer-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); setIsDrawerOpen(false); }}>📊 學習總覽</a>
              <a href="#practice" className={`drawer-item ${currentPage === 'practice-center' || currentPage === 'question-practice' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentPage('practice-center'); setIsDrawerOpen(false); }}>📖 練習中心</a>
              <a href="#vocab" className={`drawer-item ${currentPage === 'vocabulary' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentPage('vocabulary'); setIsDrawerOpen(false); }}>📚 核心單字</a>
              <a href="#wrongbook" className={`drawer-item ${currentPage === 'wrong-book' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentPage('wrong-book'); setIsDrawerOpen(false); }}>📓 錯題本</a>
              <a href="#mocktest" className={`drawer-item ${currentPage === 'mock-test' || currentPage === 'result' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentPage('mock-test'); setIsDrawerOpen(false); }}>📝 模擬考</a>
              <a href="#friends" className={`drawer-item ${currentPage === 'friends' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentPage('friends'); setIsDrawerOpen(false); }}>🤝 戰友排行榜</a>
              <a href="#settings" className={`drawer-item ${currentPage === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentPage('settings'); setIsDrawerOpen(false); }}>⚙️ 學習設定</a>
              <div className="drawer-divider" />
              <a href="#logout" className="drawer-item" style={{ color: 'var(--danger)' }} onClick={(e) => { e.preventDefault(); onLogout(); setIsDrawerOpen(false); }}>🚪 登出 / 切換帳號</a>
            </div>
            <div className="drawer-footer">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>目前登入使用者:</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>{currentUser.username}</div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      {currentUser && (
        <div className="mobile-bottom-tabs">
          <button type="button"
            className={`mobile-tab-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            <span className="tab-icon">🏠</span>
            <span>首頁</span>
          </button>
          <button type="button"
            className={`mobile-tab-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="tab-icon">📊</span>
            <span>總覽</span>
          </button>
          <button type="button"
            className={`mobile-tab-item ${currentPage === 'practice-center' || currentPage === 'question-practice' ? 'active' : ''}`}
            onClick={() => setCurrentPage('practice-center')}
          >
            <span className="tab-icon">📖</span>
            <span>練習</span>
          </button>
          <button type="button"
            className={`mobile-tab-item ${currentPage === 'wrong-book' ? 'active' : ''}`}
            onClick={() => setCurrentPage('wrong-book')}
          >
            <span className="tab-icon">📓</span>
            <span>錯題本</span>
          </button>
          <button type="button"
            className={`mobile-tab-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            <span className="tab-icon">⚙️</span>
            <span>設定</span>
          </button>
        </div>
      )}
    </>
  );
}
