// src/pages/Login.jsx
import { useState } from 'react';
import { hashPassword, generateSalt } from '../utils/crypto';

export default function Login({ users, onSelectUser, onCreateUser, onSetPassword }) {
  const [selectedUser, setSelectedUser] = useState(null); // The user currently attempting to log in or migrate
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Registration States
  const [newUsername, setNewUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Migration States (For legacy accounts without password)
  const [migratePassword, setMigratePassword] = useState('');
  const [migrateConfirm, setMigrateConfirm] = useState('');
  const [showMigratePassword, setShowMigratePassword] = useState(false);
  const [migrateError, setMigrateError] = useState('');

  const handleSelectAccountClick = (user) => {
    setSelectedUser(user);
    setLoginPassword('');
    setLoginError('');
    setMigratePassword('');
    setMigrateConfirm('');
    setMigrateError('');
  };

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoginError('');

    try {
      const computedHash = await hashPassword(loginPassword, selectedUser.salt);
      if (computedHash === selectedUser.passwordHash) {
        onSelectUser(selectedUser.id);
      } else {
        setLoginError('❌ 密碼錯誤，請再試一次！');
      }
    } catch (err) {
      console.error(err);
      setLoginError('❌ 加密驗證失敗！');
    }
  };

  // Legacy user password setup (Migration)
  const handleMigrationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setMigrateError('');

    if (migratePassword.length < 6) {
      setMigrateError('❌ 密碼長度至少需要 6 位數！');
      return;
    }

    if (migratePassword !== migrateConfirm) {
      setMigrateError('❌ 兩次輸入的密碼不一致！');
      return;
    }

    try {
      const salt = generateSalt();
      const hash = await hashPassword(migratePassword, salt);
      onSetPassword(selectedUser.id, hash, salt);
      alert('🔒 密碼設定成功！已完成舊帳號安全遷移。');
      onSelectUser(selectedUser.id);
    } catch (err) {
      console.error(err);
      setMigrateError('❌ 密碼生成失敗！');
    }
  };

  // Create new user registration handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    const trimmedUsername = newUsername.trim();
    if (!trimmedUsername) {
      setRegError('❌ 請輸入使用者名稱！');
      return;
    }

    // Duplicate check
    const isDuplicate = users.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    if (isDuplicate) {
      setRegError('❌ 此帳號名稱已被使用！');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('❌ 密碼長度至少需要 6 位數！');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('❌ 兩次輸入的密碼不一致！');
      return;
    }

    try {
      const salt = generateSalt();
      const hash = await hashPassword(regPassword, salt);
      onCreateUser(trimmedUsername, hash, salt);
      setNewUsername('');
      setRegPassword('');
      setRegConfirmPassword('');
      setShowAddForm(false);
      alert('🎉 帳號建立成功！密碼安全已啟用。');
    } catch (err) {
      console.error(err);
      setRegError('❌ 註冊失敗，請重試！');
    }
  };

  return (
    <div className="practice-container flex flex-col gap-3" style={{ marginTop: '2rem' }}>
      
      {/* Brand Header */}
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <span style={{ fontSize: '3rem', display: 'block', animation: 'float 3s ease-in-out infinite' }}>🚀</span>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 800 }}>TOEIC Sprint V1.2</h1>
        <p style={{ color: 'var(--text-sub)' }}>目標導向的 TOEIC 訓練與互相監督系統 • 帳號密碼保護版</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        
        {/* LEFT COLUMN: Select & Login Panel */}
        <div className="card flex flex-col gap-3">
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            👥 選擇現有學習帳號
          </h2>

          <div className="flex flex-col gap-2" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {users.map(user => {
              const isSelected = selectedUser?.id === user.id;
              const hasPassword = !!user.passwordHash;

              return (
                <div 
                  key={user.id} 
                  className={`card ${isSelected ? 'active' : ''}`} 
                  style={{ 
                    cursor: 'pointer', 
                    padding: '0.75rem 1rem',
                    borderLeft: `4px solid ${hasPassword ? 'var(--primary)' : 'var(--warning)'}`,
                    transition: 'all 0.25s ease'
                  }}
                  onClick={() => handleSelectAccountClick(user)}
                >
                  <div className="flex justify-between align-center">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                        {user.username} {!hasPassword && <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>(待設定密碼 ⚠️)</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '0.2rem' }}>
                        目標: {user.goals?.targetScore || 700}分 | 連續: {user.progress?.streakDays || 0}天
                      </div>
                    </div>
                    
                    <span style={{ fontSize: '1.1rem' }}>{hasPassword ? '🔒' : '🔑'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Login Form / Migration Form */}
          {selectedUser && (
            <div className="card" style={{ 
              backgroundColor: 'hsl(220, 15%, 97%)', 
              border: '1px solid var(--border-color)',
              animation: 'fadeIn 0.3s ease-out' 
            }}>
              
              {/* Case A: Account HAS password -> Normal Login */}
              {selectedUser.passwordHash ? (
                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-2">
                  <div className="flex justify-between align-center">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
                      🔑 登入：{selectedUser.username}
                    </h3>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => setSelectedUser(null)}
                    >
                      關閉
                    </button>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label">請輸入密碼</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showLoginPassword ? "text" : "password"} 
                        className="form-input" 
                        placeholder="請輸入密碼" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoFocus
                      />
                      <button 
                        type="button" 
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {loginError}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem' }}>
                    解鎖並登入 ➔
                  </button>
                </form>
              ) : (
                
                /* Case B: Account DOES NOT have password -> Migration Setup */
                <form onSubmit={handleMigrationSubmit} className="flex flex-col gap-2">
                  <div className="flex justify-between align-center">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--warning)' }}>
                      ⚠️ 舊帳號升級安全保護
                    </h3>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => setSelectedUser(null)}
                    >
                      關閉
                    </button>
                  </div>
                  
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: '1.4' }}>
                    這是您第一次在 V1.2 安全版中選擇此帳號，請設定一組密碼以啟用裝置鎖定：
                  </p>

                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label">設定新密碼 (至少 6 位數)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showMigratePassword ? "text" : "password"} 
                        className="form-input" 
                        placeholder="請設定密碼" 
                        value={migratePassword}
                        onChange={(e) => setMigratePassword(e.target.value)}
                        required
                      />
                      <button 
                        type="button" 
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                        onClick={() => setShowMigratePassword(!showMigratePassword)}
                      >
                        {showMigratePassword ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label">再次確認密碼</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="再次輸入密碼" 
                      value={migrateConfirm}
                      onChange={(e) => setMigrateConfirm(e.target.value)}
                      required
                    />
                  </div>

                  {migrateError && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {migrateError}
                    </div>
                  )}

                  <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '0.65rem' }}>
                    💾 設定密碼並登入
                  </button>
                </form>
              )}

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Add & Register Panel */}
        <div className="card flex flex-col gap-3">
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            ➕ 註冊全新學習帳號
          </h2>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
            建立全新帳號，設定一組獨立的學習密碼。資料將安全隔離在您的本機瀏覽器中。
          </p>

          {showAddForm ? (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-2" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">👤 使用者名稱</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="輸入您的英文名字或暱稱"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">🔒 設定安全密碼 (至少 6 位數)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showRegPassword ? "text" : "password"} 
                    className="form-input" 
                    placeholder="請輸入密碼" 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                    onClick={() => setShowRegPassword(!showRegPassword)}
                  >
                    {showRegPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">✍️ 再次確認密碼</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="再次輸入相同密碼" 
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {regError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {regError}
                </div>
              )}

              <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>確認建立 ➔</button>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowAddForm(false);
                    setRegError('');
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: 'auto', padding: '1rem' }}
              onClick={() => {
                setShowAddForm(true);
                setSelectedUser(null); // Close active login card to avoid overlaps
              }}
            >
              ➕ 建立新帳號
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
