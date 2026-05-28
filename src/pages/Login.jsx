// src/pages/Login.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login({ onLoginSuccess }) {
  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration States
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Email format validator
  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail) {
      setLoginError('❌ 請輸入電子信箱！');
      setLoginLoading(false);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setLoginError('❌ 請輸入格式正確的電子信箱！');
      setLoginLoading(false);
      return;
    }

    if (!loginPassword) {
      setLoginError('❌ 請輸入密碼！');
      setLoginLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setLoginError('❌ 帳號或密碼錯誤！請再次確認。');
        } else {
          setLoginError(`❌ 登入失敗：${error.message}`);
        }
        setLoginLoading(false);
        return;
      }

      if (data?.session) {
        // Authenticated successfully!
        onLoginSuccess(data.session, null); // passing session and no custom registration profile details
      }
    } catch (err) {
      console.error('Supabase Login Error:', err);
      setLoginError('❌ 網路或系統服務異常，請重試！');
    } finally {
      setLoginLoading(false);
    }
  };

  // Registration handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMsg('');
    setRegLoading(true);

    const trimmedEmail = regEmail.trim();
    const trimmedUsername = regUsername.trim();

    if (!trimmedEmail) {
      setRegError('❌ 請輸入電子信箱！');
      setRegLoading(false);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setRegError('❌ 請輸入格式正確的電子信箱！');
      setRegLoading(false);
      return;
    }

    if (!trimmedUsername) {
      setRegError('❌ 請輸入使用者暱稱！');
      setRegLoading(false);
      return;
    }

    if (regPassword.length < 6) {
      setRegError('❌ 密碼長度至少需要 6 位數！');
      setRegLoading(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('❌ 兩次輸入的密碼不一致！');
      setRegLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: regPassword,
      });

      if (error) {
        setRegError(`❌ 註冊失敗：${error.message}`);
        setRegLoading(false);
        return;
      }

      if (data?.user) {
        // Check if session is already active (auto-sign in enabled in Supabase)
        if (data.session) {
          alert('🎉 帳號註冊且登入成功！');
          onLoginSuccess(data.session, trimmedUsername); // Pass username to save in cloud app_data
        } else {
          setRegSuccessMsg('✉️ 註冊成功！驗證郵件已發送至您的信箱，請至信箱點擊確認連結後登入。');
          setRegEmail('');
          setRegUsername('');
          setRegPassword('');
          setRegConfirmPassword('');
          setShowAddForm(false);
        }
      }
    } catch (err) {
      console.error('Supabase Registration Error:', err);
      setRegError('❌ 網路或系統服務異常，請重試！');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="practice-container flex flex-col gap-3" style={{ marginTop: '2rem' }}>
      
      {/* Brand Header */}
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <span style={{ fontSize: '3rem', display: 'block', animation: 'float 3s ease-in-out infinite' }}>🚀</span>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 800 }}>
          TOEIC Sprint V2.1
        </h1>
        <p style={{ color: 'var(--text-sub)' }}>
          真正雲端帳號系統 • 跨裝置即時學習同步中心 ☁️
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        
        {/* LEFT COLUMN: Login Panel */}
        <div className="card flex flex-col gap-3">
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            🔑 登入雲端帳號
          </h2>

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3" style={{ marginTop: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label">電子信箱 Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="example@email.com" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={loginLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">密碼 Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showLoginPassword ? "text" : "password"} 
                  className="form-input" 
                  placeholder="請輸入密碼" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={loginLoading}
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
                  disabled={loginLoading}
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

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              disabled={loginLoading}
            >
              {loginLoading ? '登入驗證中...' : '登入帳號 ➔'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Register Panel */}
        <div className="card flex flex-col gap-3">
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            ➕ 註冊全新雲端帳號
          </h2>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
            建立雲端帳號後，您可以在手機、平板與電腦等多台裝置登入相同信箱，所有做題、單字與模擬考記錄將即時安全同步。
          </p>

          {regSuccessMsg && (
            <div className="card" style={{ 
              backgroundColor: 'var(--success-light)', 
              color: 'var(--success)', 
              fontSize: '0.9rem', 
              fontWeight: 600,
              lineHeight: '1.5',
              padding: '1rem',
              border: '1px solid var(--success)',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              {regSuccessMsg}
            </div>
          )}

          {showAddForm ? (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div className="form-group">
                <label className="form-label">✉️ 電子信箱 Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="your-email@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  disabled={regLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">👤 使用者暱稱 Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="輸入您的英文名字或暱稱"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  disabled={regLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">🔒 設定安全密碼 (至少 6 位數)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showRegPassword ? "text" : "password"} 
                    className="form-input" 
                    placeholder="請輸入密碼" 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    disabled={regLoading}
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
                    disabled={regLoading}
                  >
                    {showRegPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">✍️ 再次確認密碼</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="再次輸入相同密碼" 
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  disabled={regLoading}
                />
              </div>

              {regError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {regError}
                </div>
              )}

              <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={regLoading}>
                  {regLoading ? '帳號建立中...' : '確認註冊 ➔'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowAddForm(false);
                    setRegError('');
                  }}
                  disabled={regLoading}
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
                setRegError('');
                setRegSuccessMsg('');
              }}
            >
              ➕ 建立新雲端帳號
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
