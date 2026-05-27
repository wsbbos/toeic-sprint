import { useState } from 'react';
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

import { 
  getUsers, 
  getCurrentUser, 
  setCurrentUserId, 
  createUser, 
  deleteUser, 
  resetUserData, 
  saveUsers, 
  updateCurrentUser,
  getTodayRecord,
  updateTodayRecord,
  initStorage,
  setPasswordForUser
} from './utils/storage';

import { vocabularyData } from './data/vocabulary';
import { questionsData } from './data/questions';

export default function App() {
  const [users, setUsers] = useState(() => {
    initStorage();
    return getUsers();
  });
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [currentPage, setCurrentPage] = useState(() => getCurrentUser() ? 'home' : 'login'); // Router State
  const [practiceFilter, setPracticeFilter] = useState('');
  const [activeMockResult, setActiveMockResult] = useState(null);
  const [retakeList, setRetakeList] = useState([]);

  // Sync state helpers
  const refreshUserData = () => {
    setUsers(getUsers());
    setCurrentUser(getCurrentUser());
  };

  const handleSelectUser = (userId) => {
    setCurrentUserId(userId);
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Switch page
    if (user.progress.streakDays === 0 && !user.goals.examDate) {
      setCurrentPage('onboarding');
    } else {
      // If user logs in, calculate/maintain streak
      const updated = updateCurrentUser(u => {
        // Simple streak maintainer: if streak is 0, give it 1 day to start
        if (u.progress.streakDays === 0) {
          u.progress.streakDays = 1;
        }
        return u;
      });
      setCurrentUser(updated);
      setUsers(getUsers());
      setCurrentPage('home');
    }
  };

  const handleCreateUser = (username, passwordHash = '', salt = '') => {
    const newUser = createUser(username, passwordHash, salt);
    handleSelectUser(newUser.id);
  };

  const handleSetPassword = (userId, passwordHash, salt) => {
    setPasswordForUser(userId, passwordHash, salt);
    refreshUserData();
  };

  const handleDeleteUser = (userId) => {
    deleteUser(userId);
    refreshUserData();
  };

  const handleSaveGoals = (goals) => {
    const updated = updateCurrentUser(u => {
      u.goals = { ...u.goals, ...goals };
      return u;
    });
    setCurrentUser(updated);
    setUsers(getUsers());
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setCurrentUserId('');
    setCurrentUser(null);
    setCurrentPage('login');
  };

  const handleClearData = () => {
    if (!currentUser) return;
    resetUserData(currentUser.id);
    refreshUserData();
    alert('歷史資料已清空！');
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    deleteUser(currentUser.id);
    handleLogout();
    refreshUserData();
    alert('帳號已刪除！');
  };

  const handleImportData = (newUsers) => {
    saveUsers(newUsers);
    refreshUserData();
    // Auto select first user
    if (newUsers.length > 0) {
      handleSelectUser(newUsers[0].id);
    }
  };

  // Practice Engine Answer Submission Handler
  const handleAnswerSubmitted = (question, userAnswer, isCorrect) => {
    if (!currentUser) return;

    const updated = updateCurrentUser(u => {
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

    setCurrentUser(updated);
    setUsers(getUsers());
  };

  // Mock Exam Submission Handler
  const handleMockExamSubmitted = (resultPayload) => {
    if (!currentUser) return;

    const updated = updateCurrentUser(u => {
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
    setCurrentUser(updated);
    setUsers(getUsers());
  };

  // Vocabulary word progress trainer status updates
  const handleWordStatusChanged = (wordId, status) => {
    if (!currentUser) return;

    const updated = updateCurrentUser(u => {
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

    setCurrentUser(updated);
    setUsers(getUsers());
  };

  // Wrong Book updating methods
  const handleUpdateWrongReason = (qId, reasonVal) => {
    if (!currentUser) return;
    const updated = updateCurrentUser(u => {
      const item = u.wrongBook.find(w => w.questionId === qId);
      if (item) {
        item.errorReason = reasonVal;
      }
      return u;
    });
    setCurrentUser(updated);
    setUsers(getUsers());
  };

  const handleUpdateWrongStatus = (qId, statusVal) => {
    if (!currentUser) return;
    const updated = updateCurrentUser(u => {
      const item = u.wrongBook.find(w => w.questionId === qId);
      if (item) {
        item.status = statusVal;
        item.lastReviewedAt = new Date().toISOString();
        if (statusVal === '已掌握') {
          // If upgraded to mastered, increment review counts
          item.reviewCount = (item.reviewCount || 0) + 1;
        }
      }
      return u;
    });
    setCurrentUser(updated);
    setUsers(getUsers());
  };

  const handleRemoveWrongQuestion = (qId) => {
    if (!currentUser) return;
    const updated = updateCurrentUser(u => {
      u.wrongBook = u.wrongBook.filter(w => w.questionId !== qId);
      return u;
    });
    setCurrentUser(updated);
    setUsers(getUsers());
    alert('錯題已從錯題本中移除！');
  };

  // Wrong Book Quiz Runner Complete Actions
  const handleRetakeCompleted = (qId, isCorrect) => {
    if (!currentUser) return;
    const updated = updateCurrentUser(u => {
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

    setCurrentUser(updated);
    setUsers(getUsers());
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
        users={users}
        onLogout={handleLogout}
      />
      
      <main className="main-content">
        {!currentUser ? (
          <Login 
            users={users} 
            onSelectUser={handleSelectUser} 
            onCreateUser={handleCreateUser} 
            onDeleteUser={handleDeleteUser}
            onSetPassword={handleSetPassword}
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
                users={users}
              />
            )}

            {currentPage === 'settings' && (
              <Settings 
                currentUser={currentUser}
                onSaveGoals={handleSaveGoals}
                onClearData={handleClearData}
                onDeleteAccount={handleDeleteAccount}
                onImportData={handleImportData}
                users={users}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
