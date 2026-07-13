import ActiveMockTest from '../pages/ActiveMockTest';
import Dashboard from '../pages/Dashboard';
import Friends from '../pages/Friends';
import Home from '../pages/Home';
import LearningInsightsPanel from './LearningInsightsPanel';
import '../styles/insights.css';
import Login from '../pages/Login';
import MockTest from '../pages/MockTest';
import Onboarding from '../pages/Onboarding';
import PracticeCenter from '../pages/PracticeCenter';
import QuestionPractice from '../pages/QuestionPractice';
import Result from '../pages/Result';
import RetakePractice from '../pages/RetakePractice';
import Settings from '../pages/Settings';
import Vocabulary from '../pages/Vocabulary';
import WrongBook from '../pages/WrongBook';
import { questionsData } from '../data/questions';
import { vocabularyData } from '../data/vocabulary';

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
    return <Login onLoginSuccess={actions.onLoginSuccess} />;
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
          onAnswerSubmitted={actions.onAnswerSubmitted}
          onToggleFavorite={actions.onToggleFavorite}
          questions={questionsData}
        />
      );
    case 'vocabulary':
      return (
        <Vocabulary
          currentUser={currentUser}
          onWordStatusChanged={actions.onWordStatusChanged}
          vocabulary={vocabularyData}
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
          questions={questionsData}
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
