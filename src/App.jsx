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
import { supabase } from './lib/supabase';
import { getTodayRecord, updateTodayRecord } from './utils/storage';
import { vocabularyData } from './data/vocabulary';
import { questionsData } from './data/questions';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const cached = localStorage.getItem('toeic_sprint_cloud_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [currentPage, setCurrentPage] = useState('login'); // Router State
  const [practiceFilter, setPracticeFilter] = useState('');
  const [activeMockResult, setActiveMockResult] = useState(null);
  const [retakeList, setRetakeList] = useState([]);
  
  // Cloud Sync States
  const [syncStatus, setSyncStatus] = useState('synced'); // synced | syncing | failed
  const [showImportModal, setShowImportModal] = useState(false);
  const [legacyLocalUsers, setLegacyLocalUsers] = useState([]);
  const [selectedLegacyUserToImport, setSelectedLegacyUserToImport] = useState('');

  const handleSessionChange = async (session, customUsername = null) => {
    if (session) {
      const { user } = session;
      setSyncStatus('syncing');
      
      try {
        // Fetch cloud user data
        const { data, error } = await supabase
          .from('user_data')
          .select('app_data')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching cloud data:', error);
          setSyncStatus('failed');
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
          setSyncStatus('synced');
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
              id: user.id,
              app_data: defaultProfile,
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error inserting default cloud data:', insertError);
            setSyncStatus('failed');
          } else {
            setSyncStatus('synced');
          }

          cloudUser = {
            id: user.id,
            email: user.email,
            ...defaultProfile
          };
        }

        setCurrentUser(cloudUser);
        localStorage.setItem('toeic_sprint_cloud_user', JSON.stringify(cloudUser));
        
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
        setSyncStatus('failed');
      }
    } else {
      // Logged out
      setCurrentUser(null);
      localStorage.removeItem('toeic_sprint_cloud_user');
      setCurrentPage('login');
    }
  };

  const handleLoginSuccess = (session, customUsername) => {
    handleSessionChange(session, customUsername);
  };

  // Handle Supabase Auth state changes
  useEffect(() => {
    // 1. Get current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSessionChange(session);
      } else {
        setCurrentUser(null);
        setCurrentPage('login');
      }
    });

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleSessionChange(session);
      } else {
        setCurrentUser(null);
        setCurrentPage('login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Cloud Sync Writer
  const syncWithCloud = async (updatedUser) => {
    if (!updatedUser || !updatedUser.id) return;
    setSyncStatus('syncing');
    try {
      const appData = { ...updatedUser };
      const { id } = appData;
      delete appData.id;
      delete appData.email;
      const { error } = await supabase
        .from('user_data')
        .upsert({
          id: id,
          app_data: appData,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Cloud sync failed:', error);
        setSyncStatus('failed');
      } else {
        setSyncStatus('synced');
      }
    } catch (err) {
      console.error('Cloud sync exception:', err);
      setSyncStatus('failed');
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
          id: id,
          app_data: appData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to import data to cloud:', error);
        setSyncStatus('failed');
        alert(`❌ 匯入雲端失敗：${error.message}`);
      } else {
        setSyncStatus('synced');
        setCurrentUser(mergedUser);
        localStorage.setItem('toeic_sprint_cloud_user', JSON.stringify(mergedUser));
        localStorage.setItem(`toeic_sprint_imported_for_${currentUser.id}`, 'true');
        setShowImportModal(false);
        alert('🎉 成功將本機舊學習資料匯入至雲端帳號！');
      }
    } catch (err) {
      console.error('Exception during import:', err);
      setSyncStatus('failed');
      alert('❌ 匯入資料時發生系統錯誤，請重試！');
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
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout Exception:', err);
    }
    setCurrentUser(null);
    localStorage.removeItem('toeic_sprint_cloud_user');
    setCurrentPage('login');
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
              />
            )}

            {currentPage === 'settings' && (
              <Settings 
                currentUser={currentUser}
                onSaveGoals={handleSaveGoals}
                onClearData={handleClearData}
                onDeleteAccount={handleDeleteAccount}
                syncStatus={syncStatus}
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
