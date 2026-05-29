import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import PracticeCenter from './pages/PracticeCenter';
import QuestionPractice from './pages/QuestionPractice';
import Vocabulary from './pages/Vocabulary';
import MockTest from './pages/MockTest';
import ActiveMockTest from './pages/ActiveMockTest';
import Result from './pages/Result';
import WrongBook from './pages/WrongBook';
import RetakePractice from './pages/RetakePractice';
import Home from './pages/Home';
import Friends from './pages/Friends';
import Settings from './pages/Settings';
import { supabase, isSupabaseConfigured, getSupabaseDebugInfo } from './lib/supabase';
import { getTodayRecord, updateTodayRecord } from './utils/storage';
import { vocabularyData } from './data/vocabulary';
import { questionsData } from './data/questions';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const cached = localStorage.getItem('toeic_sprint_cloud_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [currentSession, setCurrentSession] = useState(null);
  const [currentPage, setCurrentPage] = useState('login'); // Router State
  const [practiceFilter, setPracticeFilter] = useState('');
  const [activeMockResult, setActiveMockResult] = useState(null);
  const [retakeList, setRetakeList] = useState([]);
  
  // Cloud Sync States
  const [syncStatus, setSyncStatus] = useState('synced'); // synced | syncing | failed
  const [syncError, setSyncError] = useState(null); // { message, code, details }
  const [showImportModal, setShowImportModal] = useState(false);
  const [legacyLocalUsers, setLegacyLocalUsers] = useState([]);
  const [selectedLegacyUserToImport, setSelectedLegacyUserToImport] = useState('');

  // Stale Session Recovery & Error Masking States
  const [isHandlingStaleSession, setIsHandlingStaleSession] = useState(false);

  const sanitizeError = (err) => {
    if (!err) return null;
    const str = (val) => {
      if (!val) return '';
      let s = typeof val === 'object' ? JSON.stringify(val) : String(val);
      s = s.replace(/ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, '[PROTECTED_JWT]');
      s = s.replace(/https:\/\/[A-Za-z0-9-]+\.supabase\.co/g, '[PROTECTED_SUPABASE_URL]');
      return s;
    };
    return {
      message: str(err.message || err.error_description || '未知錯誤'),
      code: str(err.code || 'UNKNOWN_CODE'),
      details: str(err.details || '無詳細資訊')
    };
  };

  const handleStaleSession = async (error) => {
    if (!error) return false;
    const errMsg = String(error.message || error.error_description || error || '');
    const errCode = String(error.code || '');

    const isStale = 
      errMsg.includes('Invalid Refresh Token') ||
      errMsg.includes('Refresh Token Not Found') ||
      errMsg.includes('refresh_token_not_found') ||
      errMsg.includes('invalid_grant') ||
      errMsg.toLowerCase().includes('refresh token') ||
      errCode === 'refresh_token_not_found';

    if (isStale) {
      if (isHandlingStaleSession) return true;
      setIsHandlingStaleSession(true);
      console.warn('Stale session detected, logging out:', error);
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error during stale session recovery:', e);
      }
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key === 'toeic_sprint_cloud_user') {
          localStorage.removeItem(key);
        }
      });
      setCurrentUser(null);
      setCurrentPage('login');
      alert('登入狀態已失效，請重新登入。');
      setIsHandlingStaleSession(false);
      return true;
    }
    return false;
  };

  const handleSessionChange = async (session, customUsername = null) => {
    setCurrentSession(session);
    if (session) {
      const { user } = session;
      setSyncStatus('syncing');
      setSyncError(null);
      
      try {
        // 1. Safe Profiles Sync (Non-blocking)
        try {
          const profileUsername = customUsername || user.email.split('@')[0];
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id, // Must equal auth user id
              email: user.email,
              username: profileUsername,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
          if (profileError) {
            console.error('Non-blocking Profiles Sync Error:', profileError);
            await handleStaleSession(profileError);
          }
        } catch (profileErr) {
          console.error('Profiles exception (non-blocking):', profileErr);
        }

        // 2. Fetch cloud user data
        const { data, error } = await supabase
          .from('user_data')
          .select('app_data')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching cloud data:', error);
          const isStale = await handleStaleSession(error);
          if (!isStale) {
            setSyncError(sanitizeError(error));
            setSyncStatus('failed');
          }
        }

        let cloudUser = null;
        if (data && data.app_data) {
          // Cloud profile exists!
          cloudUser = {
            id: user.id,
            email: user.email,
            username: data.app_data.username || user.email.split('@')[0],
            ...data.app_data
          };
          if (!error) {
            setSyncStatus('synced');
            setSyncError(null);
          }
        } else {
          // Cloud profile does not exist! Create a default profile
          const defaultProfile = {
            username: customUsername || user.email.split('@')[0],
            goals: {
              targetScore: 700,
              examDate: '',
              dailyVocabularyGoal: 30,
              dailyQuestionGoal: 30,
              dailyStudyMinutesGoal: 45,
              dailyErrorReviewGoal: 10,
              weeklyMockTestGoal: 1
            },
            progress: {
              streakDays: 0,
              totalQuestionsAnswered: 0,
              totalCorrect: 0,
              totalWrong: 0,
              totalStudyMinutes: 0,
              learnedVocabularyCount: 0
            },
            vocabularyProgress: {},
            wrongBook: [],
            practiceHistory: [],
            mockTestHistory: [],
            dailyRecords: []
          };

          const { error: insertError } = await supabase
            .from('user_data')
            .upsert({
              user_id: user.id,
              app_data: defaultProfile,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

          if (insertError) {
            console.error('Error inserting default cloud data:', insertError);
            const isStale = await handleStaleSession(insertError);
            if (!isStale) {
              setSyncError(sanitizeError(insertError));
              setSyncStatus('failed');
            }
          } else {
            setSyncStatus('synced');
            setSyncError(null);
          }

          cloudUser = {
            id: user.id,
            email: user.email,
            ...defaultProfile
          };
        }

        setCurrentUser(cloudUser);
        localStorage.setItem('toeic_sprint_cloud_user', JSON.stringify(cloudUser));
        await syncPublicStats(cloudUser);
        
        // If goals are unset, go to onboarding, else to home
        if (cloudUser.goals && !cloudUser.goals.examDate) {
          setCurrentPage('onboarding');
        } else {
          setCurrentPage('home');
        }

        // Check for legacy local storage profiles to import
        const legacyData = localStorage.getItem('toeic_sprint_users');
        const importedKey = `toeic_sprint_imported_for_${user.id}`;
        const hasImported = localStorage.getItem(importedKey) === 'true';

        if (legacyData && !hasImported) {
          try {
            const parsedLegacy = JSON.parse(legacyData);
            if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
              setLegacyLocalUsers(parsedLegacy);
              setSelectedLegacyUserToImport(parsedLegacy[0].id);
              setShowImportModal(true);
            }
          } catch (e) {
            console.error('Error parsing legacy local data:', e);
          }
        }
      } catch (err) {
        console.error('Exception during session fetch:', err);
        const isStale = await handleStaleSession(err);
        if (!isStale) {
          setSyncError(sanitizeError(err));
          setSyncStatus('failed');
        }
      }
    } else {
      // Logged out
      setCurrentUser(null);
      setCurrentSession(null);
      localStorage.removeItem('toeic_sprint_cloud_user');
      setCurrentPage('login');
    }
  };

  const handleLoginSuccess = (session, customUsername) => {
    handleSessionChange(session, customUsername);
  };

  // Handle Supabase Auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;

    // 1. Get current active session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!active) return;
      if (error) {
        await handleStaleSession(error);
        return;
      }
      if (session) {
        setCurrentSession(session);
        await handleSessionChange(session);
      } else {
        setCurrentSession(null);
        setCurrentUser(null);
        setCurrentPage('login');
      }
    }).catch(async (err) => {
      if (active) {
        await handleStaleSession(err);
      }
    });

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        setCurrentSession(null);
        setCurrentUser(null);
        setCurrentPage('login');
      } else if (session) {
        setCurrentSession(session);
        await handleSessionChange(session);
      } else {
        setCurrentSession(null);
        setCurrentUser(null);
        setCurrentPage('login');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isSupabaseConfigured) {
    const debugInfo = getSupabaseDebugInfo();
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem'
      }}>
        <div className="card" style={{
          maxWidth: '550px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          padding: '2.5rem',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1.25rem' }}>⚠️</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
            Supabase 環境變數尚未設定
          </h2>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            本系統雲端版需要配置必要的 API 連線金鑰。請前往您的 <strong>Vercel 專案設定 (Environment Variables)</strong> 配置以下環境變數，並重新部署專案：
          </p>
          <div style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.25rem',
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            color: '#374151',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e5e7eb', paddingBottom: '0.35rem' }}>
              <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>• VITE_SUPABASE_URL</span>
              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>(Supabase API 網址)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.15rem' }}>
              <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>• VITE_SUPABASE_ANON_KEY</span>
              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>(公開 Anon 金鑰)</span>
            </div>
          </div>

          {/* Secure Environment Debug Panel */}
          <div style={{
            textAlign: 'left',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem'
          }}>
            <h3 style={{ 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              color: '#334155', 
              marginBottom: '0.75rem', 
              marginTop: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🛠️ 安全偵錯資訊 (Secure Debug Panel)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontFamily: 'monospace' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>MODE (編譯模式):</span>
                <span style={{ 
                  fontWeight: 600, 
                  color: '#0f172a',
                  backgroundColor: '#f1f5f9',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>{debugInfo.mode}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>has VITE_SUPABASE_URL:</span>
                <span style={{ 
                  fontWeight: 600, 
                  color: debugInfo.hasUrl ? '#16a34a' : '#dc2626',
                  backgroundColor: debugInfo.hasUrl ? '#f0fdf4' : '#fef2f2',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${debugInfo.hasUrl ? '#bbf7d0' : '#fecaca'}`
                }}>{debugInfo.hasUrl ? 'true' : 'false'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>has VITE_SUPABASE_ANON_KEY:</span>
                <span style={{ 
                  fontWeight: 600, 
                  color: debugInfo.hasKey ? '#16a34a' : '#dc2626',
                  backgroundColor: debugInfo.hasKey ? '#f0fdf4' : '#fef2f2',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${debugInfo.hasKey ? '#bbf7d0' : '#fecaca'}`
                }}>{debugInfo.hasKey ? 'true' : 'false'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>URL prefix 是否為 https://:</span>
                <span style={{ 
                  fontWeight: 600, 
                  color: debugInfo.urlPrefixOk ? '#16a34a' : '#dc2626',
                  backgroundColor: debugInfo.urlPrefixOk ? '#f0fdf4' : '#fef2f2',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${debugInfo.urlPrefixOk ? '#bbf7d0' : '#fecaca'}`
                }}>{debugInfo.urlPrefixOk ? 'true' : 'false'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>key prefix 是否為 sb_publishable_:</span>
                <span style={{ 
                  fontWeight: 600, 
                  color: debugInfo.isSbPublishable ? '#16a34a' : '#94a3b8',
                  backgroundColor: debugInfo.isSbPublishable ? '#f0fdf4' : '#f8fafc',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${debugInfo.isSbPublishable ? '#bbf7d0' : '#e2e8f0'}`
                }}>{debugInfo.isSbPublishable ? 'true' : 'false'}</span>
              </div>

              {debugInfo.hasKey && !debugInfo.isSbPublishable && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#64748b', 
                  borderTop: '1px solid #e2e8f0', 
                  paddingTop: '0.5rem',
                  marginTop: '0.25rem',
                  lineHeight: '1.4'
                }}>
                  💡 偵測到金鑰格式為 <strong>{debugInfo.isJwtFormat ? '標準 JWT (eyJ...)' : '其他格式'}</strong>。舊款/標準 Supabase 專案的金鑰通常是 `eyJ` 開頭的 JWT，這也是完全正常的，但請確保在 Vercel 設定時沒有複製到前後空格或換行字元。
                </div>
              )}

            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
            >
              🔄 重新整理網頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper to synchronize user stats to user_public_stats table (non-blocking)
  async function syncPublicStats(updatedUser) {
    if (!updatedUser) return;
    try {
      const sessionResult = await supabase.auth.getSession();
      const sessionUser = sessionResult.data?.session?.user;
      const id = sessionUser?.id || updatedUser.id;
      if (!id) {
        console.warn('Cannot sync user_public_stats: no valid user ID found.');
        return;
      }
      const display_name = updatedUser.username || updatedUser.email?.split('@')[0] || '未知用戶';
      const streak = updatedUser.progress?.streakDays || 0;
      
      // Calculate today completion rate
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = updatedUser.dailyRecords?.find(r => r.date === todayStr) || {
        wordsLearned: 0,
        questionsAnswered: 0,
        studyMinutes: 0
      };
      
      const wordsGoal = updatedUser.goals?.dailyVocabularyGoal || 30;
      const questionsGoal = updatedUser.goals?.dailyQuestionGoal || 50;
      const studyGoal = updatedUser.goals?.dailyStudyMinutesGoal || 60;
      
      const wP = Math.min((todayRecord.wordsLearned / wordsGoal) * 100, 100);
      const qP = Math.min((todayRecord.questionsAnswered / questionsGoal) * 100, 100);
      const sP = Math.min((todayRecord.studyMinutes / studyGoal) * 100, 100);
      const completionRate = Math.round((wP + qP + sP) / 3);
      
      const totalAnswered = updatedUser.progress?.totalQuestionsAnswered || 0;
      const wrongCount = updatedUser.wrongBook ? updatedUser.wrongBook.length : 0;
      
      const mockTestHistory = updatedUser.mockTestHistory || [];
      const mockHighScore = mockTestHistory.length > 0
        ? Math.max(...mockTestHistory.map(h => h.score))
        : 0;

      const { error } = await supabase
        .from('user_public_stats')
        .upsert({
          user_id: id,
          display_name: display_name,
          streak_days: Number(streak),
          today_completion_rate: Number(completionRate),
          total_questions_answered: Number(totalAnswered),
          total_wrong_count: Number(wrongCount),
          mock_high_score: Number(mockHighScore),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Non-blocking user_public_stats sync error:', error);
        await handleStaleSession(error);
      }
    } catch (err) {
      console.error('Non-blocking user_public_stats sync exception:', err);
    }
  }

  // Cloud Sync Writer
  const syncWithCloud = async (updatedUser) => {
    if (!updatedUser || !updatedUser.id) return;
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const appData = { ...updatedUser };
      const { id } = appData;
      delete appData.id;
      delete appData.email;
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: id,
          app_data: appData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) {
        console.error('Cloud sync failed:', error);
        const isStale = await handleStaleSession(error);
        if (!isStale) {
          setSyncError(sanitizeError(error));
          setSyncStatus('failed');
        }
      } else {
        setSyncStatus('synced');
        setSyncError(null);
        await syncPublicStats(updatedUser);
      }
    } catch (err) {
      console.error('Cloud sync exception:', err);
      const isStale = await handleStaleSession(err);
      if (!isStale) {
        setSyncError(sanitizeError(err));
        setSyncStatus('failed');
      }
    }
  };

  // Helper to safely update active user both locally and to the cloud
  const updateActiveUser = async (updateFn) => {
    if (!currentUser) return null;
    const copy = JSON.parse(JSON.stringify(currentUser));
    const updated = updateFn(copy);
    setCurrentUser(updated);
    localStorage.setItem('toeic_sprint_cloud_user', JSON.stringify(updated));
    await syncWithCloud(updated);
    return updated;
  };

  // Import local legacy data to active cloud user
  const handleImportLocalData = async (legacyUserId) => {
    if (!currentUser) return;
    const selectedLegacy = legacyLocalUsers.find(u => u.id === legacyUserId);
    if (!selectedLegacy) {
      alert('❌ 找不到所選的本機舊資料！');
      return;
    }

    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const mergedUser = {
        ...currentUser,
        username: selectedLegacy.username || currentUser.username,
        goals: selectedLegacy.goals || currentUser.goals,
        progress: selectedLegacy.progress || currentUser.progress,
        vocabularyProgress: selectedLegacy.vocabularyProgress || currentUser.vocabularyProgress,
        wrongBook: selectedLegacy.wrongBook || currentUser.wrongBook,
        practiceHistory: selectedLegacy.practiceHistory || currentUser.practiceHistory,
        mockTestHistory: selectedLegacy.mockTestHistory || currentUser.mockTestHistory,
        dailyRecords: selectedLegacy.dailyRecords || currentUser.dailyRecords
      };

      const appData = { ...mergedUser };
      const { id } = appData;
      delete appData.id;
      delete appData.email;
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: id,
          app_data: appData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Failed to import data to cloud:', error);
        const isStale = await handleStaleSession(error);
        if (!isStale) {
          setSyncError(sanitizeError(error));
          setSyncStatus('failed');
          alert(`❌ 匯入雲端失敗：${error.message}`);
        }
      } else {
        setSyncStatus('synced');
        setSyncError(null);
        setCurrentUser(mergedUser);
        localStorage.setItem('toeic_sprint_cloud_user', JSON.stringify(mergedUser));
        localStorage.setItem(`toeic_sprint_imported_for_${currentUser.id}`, 'true');
        setShowImportModal(false);
        alert('🎉 成功將本機舊學習資料匯入至雲端帳號！');
      }
    } catch (err) {
      console.error('Exception during import:', err);
      const isStale = await handleStaleSession(err);
      if (!isStale) {
        setSyncError(sanitizeError(err));
        setSyncStatus('failed');
        alert('❌ 匯入資料時發生系統錯誤，請重試！');
      }
    }
  };

  // Manual Trigger for Cloud Re-sync
  const handleManualSync = async () => {
    const sessionResult = await supabase.auth.getSession();
    const session = sessionResult.data?.session;
    if (!session) {
      alert('🔒 請先登入帳號後再執行同步！');
      return;
    }
    
    setSyncStatus('syncing');
    setSyncError(null);
    
    try {
      const { user } = session;
      
      // 1. Safe Profiles Sync (Non-blocking)
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            username: currentUser?.username || user.email.split('@')[0],
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        if (profileError) {
          console.error('Non-blocking Profiles Sync Error during manual trigger:', profileError);
          await handleStaleSession(profileError);
        }
      } catch (profileErr) {
        console.error('Profiles exception during manual trigger:', profileErr);
      }

      // 2. Fetch latest app_data
      const { data, error } = await supabase
        .from('user_data')
        .select('app_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Manual sync fetch failed:', error);
        const isStale = await handleStaleSession(error);
        if (!isStale) {
          setSyncError(sanitizeError(error));
          setSyncStatus('failed');
        }
        return;
      }

      // 3. Sync payload upsert
      let currentAppData = null;
      if (currentUser) {
        currentAppData = { ...currentUser };
        delete currentAppData.id;
        delete currentAppData.email;
      } else {
        currentAppData = data?.app_data || {};
      }

      const { error: upsertError } = await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          app_data: currentAppData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Manual sync upsert failed:', upsertError);
        const isStale = await handleStaleSession(upsertError);
        if (!isStale) {
          setSyncError(sanitizeError(upsertError));
          setSyncStatus('failed');
        }
      } else {
        setSyncStatus('synced');
        setSyncError(null);
        const refreshedUser = {
          id: user.id,
          email: user.email,
          ...(currentUser || {}),
          ...currentAppData
        };
        setCurrentUser(refreshedUser);
        localStorage.setItem('toeic_sprint_cloud_user', JSON.stringify(refreshedUser));
        await syncPublicStats(refreshedUser);
        alert('✨ 雲端同步完成！您的最新學習資料已安全儲存。');
      }
    } catch (err) {
      console.error('Manual sync exception:', err);
      const isStale = await handleStaleSession(err);
      if (!isStale) {
        setSyncError(sanitizeError(err));
        setSyncStatus('failed');
      }
    }
  };

  const dismissImportModal = () => {
    if (currentUser) {
      localStorage.setItem(`toeic_sprint_imported_for_${currentUser.id}`, 'true');
    }
    setShowImportModal(false);
  };

  const handleSaveGoals = (goals) => {
    updateActiveUser(u => {
      u.goals = { ...u.goals, ...goals };
      return u;
    });
    setCurrentPage('home');
  };

  const handleLogout = async () => {
    console.log('SAFE LOGOUT START', currentSession);

    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SIGNOUT_TIMEOUT')), 5000)
        )
      ]);
    } catch (err) {
      console.warn('Supabase signOut failed or timeout, fallback to local cleanup:', err);
    }

    try {
      Object.keys(localStorage)
        .filter(k =>
          k.startsWith('sb-') ||
          k.includes('supabase') ||
          k.includes('auth')
        )
        .forEach(k => localStorage.removeItem(k));

      sessionStorage.clear();
    } catch (err) {
      console.warn('Local auth cleanup failed:', err);
    }

    setCurrentUser(null);
    setCurrentSession(null);

    alert('已登出，請重新登入');
    window.location.href = '/';
  };

  const handleClearData = async () => {
    await updateActiveUser(u => {
      u.progress = {
        streakDays: 0,
        totalQuestionsAnswered: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalStudyMinutes: 0,
        learnedVocabularyCount: 0
      };
      u.vocabularyProgress = {};
      u.wrongBook = [];
      u.practiceHistory = [];
      u.mockTestHistory = [];
      u.dailyRecords = [];
      return u;
    });
  };

  const handleDeleteAccount = async () => {
    // Clear cloud user database details first
    await handleClearData();
    // Then log out
    await handleLogout();
  };

  // Practice Engine Answer Submission Handler
  const handleAnswerSubmitted = (question, userAnswer, isCorrect) => {
    updateActiveUser(u => {
      // 1. Update overall statistics
      u.progress.totalQuestionsAnswered += 1;
      if (isCorrect) {
        u.progress.totalCorrect += 1;
      } else {
        u.progress.totalWrong += 1;
      }

      // 2. Add to Wrong Book if incorrect
      if (!isCorrect) {
        const alreadyExists = u.wrongBook.find(w => w.questionId === question.id);
        if (alreadyExists) {
          alreadyExists.wrongCount = (alreadyExists.wrongCount || 1) + 1;
          alreadyExists.status = '未理解';
        } else {
          u.wrongBook.push({
            questionId: question.id,
            part: question.part,
            question: question.question,
            passage: question.passage || '',
            choices: question.choices,
            userAnswer: userAnswer,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            tags: question.tags || [],
            difficulty: question.difficulty || 'Medium',
            wrongCount: 1,
            reviewCount: 0,
            status: '未理解',
            createdAt: new Date().toISOString(),
            lastReviewedAt: null
          });
        }
      }

      // 3. Update Today's study records
      const todayRec = getTodayRecord(u);
      todayRec.questionsAnswered += 1;
      todayRec.studyMinutes += 1; // Assume 1 minute spent per question answered
      u = updateTodayRecord(u, todayRec);

      // 4. Update practice history
      if (!u.practiceHistory) u.practiceHistory = [];
      u.practiceHistory.push({
        questionId: question.id,
        part: question.part,
        tags: question.tags || [],
        isCorrect: isCorrect,
        date: new Date().toISOString().split('T')[0]
      });

      return u;
    });
  };

  // Mock Exam Submission Handler
  const handleMockExamSubmitted = (resultPayload) => {
    updateActiveUser(u => {
      // 1. Save Mock Test history
      if (!u.mockTestHistory) u.mockTestHistory = [];
      u.mockTestHistory.push({
        id: resultPayload.id,
        date: resultPayload.date,
        mode: resultPayload.mode,
        totalQuestions: resultPayload.totalQuestions,
        correctCount: resultPayload.correctCount,
        wrongCount: resultPayload.wrongCount,
        score: resultPayload.score,
        timeSpent: resultPayload.timeSpent
      });

      // 2. Aggregate counts to general progress
      u.progress.totalQuestionsAnswered += resultPayload.totalQuestions;
      u.progress.totalCorrect += resultPayload.correctCount;
      u.progress.totalWrong += resultPayload.wrongCount;

      // 3. Add errors to Wrong Book
      resultPayload.wrongList.forEach(wrongItem => {
        const alreadyExists = u.wrongBook.find(w => w.questionId === wrongItem.questionId);
        if (alreadyExists) {
          alreadyExists.wrongCount = (alreadyExists.wrongCount || 1) + 1;
          alreadyExists.status = '未理解';
        } else {
          u.wrongBook.push({
            ...wrongItem,
            wrongCount: 1,
            reviewCount: 0,
            status: '未理解',
            createdAt: new Date().toISOString(),
            lastReviewedAt: null
          });
        }
      });

      // 4. Update Today's record
      const todayRec = getTodayRecord(u);
      todayRec.questionsAnswered += resultPayload.totalQuestions;
      todayRec.studyMinutes += Math.round(resultPayload.timeSpent / 60);
      u = updateTodayRecord(u, todayRec);

      // 5. Save individual question outcomes in practiceHistory
      if (!u.practiceHistory) u.practiceHistory = [];
      if (resultPayload.questionOutcomes) {
        resultPayload.questionOutcomes.forEach(outcome => {
          u.practiceHistory.push({
            questionId: outcome.questionId,
            part: outcome.part,
            tags: outcome.tags,
            isCorrect: outcome.isCorrect,
            date: resultPayload.date
          });
        });
      }

      return u;
    });

    setActiveMockResult(resultPayload);
  };

  // Vocabulary word progress trainer status updates
  const handleWordStatusChanged = (wordId, status) => {
    updateActiveUser(u => {
      if (!u.vocabularyProgress) u.vocabularyProgress = {};
      
      const prevStatus = u.vocabularyProgress[wordId];
      u.vocabularyProgress[wordId] = status;

      // Update counters
      const prevMastered = prevStatus === 'mastered';
      const nowMastered = status === 'mastered';

      if (!prevMastered && nowMastered) {
        u.progress.learnedVocabularyCount += 1;
        // Today's daily record increments
        const todayRec = getTodayRecord(u);
        todayRec.wordsLearned += 1;
        todayRec.studyMinutes += 1; // studying a word counts as 1 min
        u = updateTodayRecord(u, todayRec);
      } else if (prevMastered && !nowMastered) {
        u.progress.learnedVocabularyCount = Math.max(0, u.progress.learnedVocabularyCount - 1);
        const todayRec = getTodayRecord(u);
        todayRec.wordsLearned = Math.max(0, todayRec.wordsLearned - 1);
        u = updateTodayRecord(u, todayRec);
      }

      return u;
    });
  };

  // Wrong Book updating methods
  const handleUpdateWrongReason = (qId, reasonVal) => {
    updateActiveUser(u => {
      const item = u.wrongBook.find(w => w.questionId === qId);
      if (item) {
        item.errorReason = reasonVal;
      }
      return u;
    });
  };

  const handleUpdateWrongStatus = (qId, statusVal) => {
    updateActiveUser(u => {
      const item = u.wrongBook.find(w => w.questionId === qId);
      if (item) {
        item.status = statusVal;
        item.lastReviewedAt = new Date().toISOString();
        if (statusVal === '已掌握') {
          item.reviewCount = (item.reviewCount || 0) + 1;
        }
      }
      return u;
    });
  };

  const handleRemoveWrongQuestion = (qId) => {
    updateActiveUser(u => {
      u.wrongBook = u.wrongBook.filter(w => w.questionId !== qId);
      return u;
    });
    alert('錯題已從錯題本中移除！');
  };

  const handleRetakeCompleted = (qId, isCorrect) => {
    updateActiveUser(u => {
      const item = u.wrongBook.find(w => w.questionId === qId);
      if (item) {
        item.reviewCount = (item.reviewCount || 0) + 1;
        item.lastReviewedAt = new Date().toISOString();
        if (isCorrect) {
          item.status = '已掌握';
        } else {
          item.status = '未理解';
          item.wrongCount += 1;
        }
      }

      // Add to today's study questions
      const todayRec = getTodayRecord(u);
      todayRec.questionsAnswered += 1;
      todayRec.studyMinutes += 1;
      todayRec.mistakesReviewed = (todayRec.mistakesReviewed || 0) + 1;
      u = updateTodayRecord(u, todayRec);

      return u;
    });
  };

  const handleStartRetakeSession = (list) => {
    setRetakeList(list);
    setCurrentPage('retake-practice');
  };

  // Today's record helper
  const todayRecord = currentUser ? getTodayRecord(currentUser) : null;

  return (
    <div className="app-container">
      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        currentUser={currentUser}
        users={[]}
        onLogout={handleLogout}
      />
      
      <main className="main-content">
        {!currentUser ? (
          <Login 
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          <>
            {currentPage === 'onboarding' && (
              <Onboarding 
                currentUser={currentUser} 
                onSaveGoals={handleSaveGoals} 
              />
            )}

            {currentPage === 'dashboard' && (
              <Dashboard 
                currentUser={currentUser} 
                setCurrentPage={setCurrentPage} 
                todayRecord={todayRecord}
                setPracticeFilter={setPracticeFilter}
              />
            )}

            {currentPage === 'practice-center' && (
              <PracticeCenter 
                setCurrentPage={setCurrentPage} 
                setPracticeFilter={setPracticeFilter}
              />
            )}

            {currentPage === 'question-practice' && (
              <QuestionPractice 
                currentUser={currentUser}
                setCurrentPage={setCurrentPage}
                practiceFilter={practiceFilter}
                onAnswerSubmitted={handleAnswerSubmitted}
                questions={questionsData}
              />
            )}

            {currentPage === 'vocabulary' && (
              <Vocabulary 
                currentUser={currentUser}
                onWordStatusChanged={handleWordStatusChanged}
                vocabulary={vocabularyData}
              />
            )}

            {currentPage === 'mock-test' && (
              <MockTest 
                setCurrentPage={setCurrentPage}
                onStartMockTest={() => {}}
              />
            )}

            {currentPage === 'mock-test-active' && (
              <ActiveMockTest 
                currentUser={currentUser}
                setCurrentPage={setCurrentPage}
                onMockExamSubmitted={handleMockExamSubmitted}
                questions={questionsData}
              />
            )}

            {currentPage === 'result' && (
              <Result 
                setCurrentPage={setCurrentPage}
                activeMockResult={activeMockResult}
              />
            )}

            {currentPage === 'wrong-book' && (
              <WrongBook 
                currentUser={currentUser}
                onUpdateReason={handleUpdateWrongReason}
                onUpdateStatus={handleUpdateWrongStatus}
                onRemoveWrongQuestion={handleRemoveWrongQuestion}
                onStartRetakeSession={handleStartRetakeSession}
              />
            )}

            {currentPage === 'retake-practice' && (
              <RetakePractice 
                currentUser={currentUser}
                setCurrentPage={setCurrentPage}
                retakeList={retakeList}
                onRetakeCompleted={handleRetakeCompleted}
                onUpdateReason={handleUpdateWrongReason}
              />
            )}

            {currentPage === 'home' && (
              <Home 
                currentUser={currentUser}
                setCurrentPage={setCurrentPage}
              />
            )}

            {currentPage === 'friends' && (
              <Friends 
                currentUser={currentUser}
                currentSession={currentSession}
              />
            )}

            {currentPage === 'settings' && (
              <Settings 
                currentUser={currentUser}
                onSaveGoals={handleSaveGoals}
                onClearData={handleClearData}
                onDeleteAccount={handleDeleteAccount}
                syncStatus={syncStatus}
                syncError={syncError}
                onManualSync={handleManualSync}
              />
            )}
          </>
        )}
      </main>

      {/* Cloud Import Prompt Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ 
            margin: '1.5rem', 
            width: '100%', 
            maxWidth: '520px', 
            backgroundColor: 'var(--bg-card)', 
            boxShadow: 'var(--shadow-lg)',
            padding: '2rem' 
          }}>
            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📋 偵測到本機舊學習資料
            </h2>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              系統偵測到您在此瀏覽器中留有舊版的本機離線學習紀錄（包含做題歷史、單字狀態、錯題本與學習天數）。是否將本機舊資料匯入並覆蓋此全新雲端帳號？
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">選擇欲匯入的本機帳號</label>
              <select 
                className="form-input" 
                value={selectedLegacyUserToImport} 
                onChange={(e) => setSelectedLegacyUserToImport(e.target.value)}
                style={{ width: '100%', padding: '0.65rem' }}
              >
                {legacyLocalUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} (目標: {user.goals?.targetScore || 700}分 | 連續: {user.progress?.streakDays || 0}天)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => handleImportLocalData(selectedLegacyUserToImport)}
              >
                📥 匯入此本機資料到雲端
              </button>
              
              <button 
                className="btn btn-outline" 
                style={{ flex: 1 }}
                onClick={dismissImportModal}
              >
                ❌ 暫不匯入，直接使用雲端
              </button>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '1rem', textAlign: 'center' }}>
              ⚠️ 注意：匯入操作會用本機選擇的資料覆寫雲端 app_data，且不會刪除本機舊資料。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
