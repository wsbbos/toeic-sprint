import { lazy } from 'react';
import AuthGateway from './AuthGateway';
import '../styles/insights.css';

const ActiveMockTest = lazy(() => import('../pages/ActiveMockTestRoute.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const Friends = lazy(() => import('../pages/Friends.jsx'));
const Home = lazy(() => import('../pages/Home.jsx'));
const LearningInsightsPanel = lazy(() => import('./LearningInsightsPanel.jsx'));
const MockTest = lazy(() => import('../pages/MockTest.jsx'));
const Onboarding = lazy(() => import('../pages/Onboarding.jsx'));
const PracticeCenter = lazy(() => import('../pages/PracticeCenter.jsx'));
const QuestionPractice = lazy(() => import('../pages/QuestionPracticeRoute.jsx'));
const Result = lazy(() => import('../pages/Result.jsx'));
const RetakePractice = lazy(() => import('../pages/RetakePractice.jsx'));
const Settings = lazy(() => import('../pages/Settings.jsx'));
const Vocabulary = lazy(() => import('../pages/VocabularyRoute.jsx'));
const WrongBook = lazy(() => import('../pages/WrongBook.jsx'));

export default function AppRoutes({
  currentPage,
  currentUser,
  currentSession,
  practiceFilter,
  activeMockResult,
  retakeList,
  todayRecord,
  syncStatus,
  syncError,
  actions,
}) {
  if (!currentUser) {
    return <AuthGateway onLoginSuccess={actions.onLoginSuccess} onGuestLogin={actions.onGuestLogin} />;
  }

  switch (currentPage) {
    case 'onboarding':
      return <Onboarding currentUser={currentUser} onSaveGoals={actions.onSaveGoals} />;
    case 'dashboard':
      return (
        <>
          <Dashboard currentUser={currentUser} setCurrentPage={actions.setCurrentPage} todayRecord={todayRecord} setPracticeFilter={actions.setPracticeFilter} />
          <LearningInsightsPanel currentUser={currentUser} setCurrentPage={actions.setCurrentPage} setPracticeFilter={actions.setPracticeFilter} onStartRetakeSession={actions.onStartRetakeSession} />
        </>
      );
    case 'practice-center':
      return (
        <PracticeCenter
          setCurrentPage={actions.setCurrentPage}
          setPracticeFilter={actions.setPracticeFilter}
        />
      );
    case 'question-practice':
      return (
        <QuestionPractice
          currentUser={currentUser}
          setCurrentPage={actions.setCurrentPage}
          practiceFilter={practiceFilter}
          onPracticeCompleted={actions.onPracticeCompleted}
          onToggleFavorite={actions.onToggleFavorite}
        />
      );
    case 'vocabulary':
      return (
        <Vocabulary
          currentUser={currentUser}
          onWordStatusChanged={actions.onWordStatusChanged}
        />
      );
    case 'mock-test':
      return <MockTest setCurrentPage={actions.setCurrentPage} onStartMockTest={() => {}} />;
    case 'mock-test-active':
      return (
        <ActiveMockTest
          currentUser={currentUser}
          setCurrentPage={actions.setCurrentPage}
          onMockExamSubmitted={actions.onMockExamSubmitted}
        />
      );
    case 'result':
      return (
        <Result
          setCurrentPage={actions.setCurrentPage}
          activeMockResult={activeMockResult}
        />
      );
    case 'wrong-book':
      return (
        <WrongBook
          currentUser={currentUser}
          onUpdateReason={actions.onUpdateWrongReason}
          onUpdateStatus={actions.onUpdateWrongStatus}
          onRemoveWrongQuestion={actions.onRemoveWrongQuestion}
          onStartRetakeSession={actions.onStartRetakeSession}
        />
      );
    case 'retake-practice':
      return (
        <RetakePractice
          currentUser={currentUser}
          setCurrentPage={actions.setCurrentPage}
          retakeList={retakeList}
          onRetakeCompleted={actions.onRetakeCompleted}
          onUpdateReason={actions.onUpdateWrongReason}
        />
      );
    case 'friends':
      return <Friends currentUser={currentUser} currentSession={currentSession} />;
    case 'settings':
      return (
        <Settings
          currentUser={currentUser}
          onSaveGoals={actions.onSaveGoals}
          onClearData={actions.onClearData}
          onDeleteAccount={actions.onDeleteAccount}
          syncStatus={syncStatus}
          syncError={syncError}
          onManualSync={actions.onManualSync}
        />
      );
    case 'home':
    default:
      return <Home currentUser={currentUser} setCurrentPage={actions.setCurrentPage} />;
  }
}
