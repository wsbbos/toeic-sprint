import { Suspense } from 'react';
import AppLoadingState from './components/AppLoadingState';
import AppRoutes from './components/AppRoutes';
import LocalImportModal from './components/LocalImportModal';
import LocalPersistenceBanner from './components/LocalPersistenceBanner';
import Navbar from './components/Navbar';
import OfflineBanner from './components/OfflineBanner';
import { useAppController } from './hooks/useAppController';

export default function App() {
  const app = useAppController();


  if (app.sessionStatus === 'loading' && !app.currentUser) {
    return <AppLoadingState />;
  }

  return (
    <div className="app-container">
      <OfflineBanner />
      <LocalPersistenceBanner status={app.localPersistenceStatus} />
      <Navbar
        currentPage={app.currentPage}
        setCurrentPage={app.actions.setCurrentPage}
        currentUser={app.currentUser}
        onLogout={app.safeLogout}
      />

      <main className="main-content">
        <Suspense fallback={<AppLoadingState contained message="正在載入頁面…" />}>
          <AppRoutes
            currentPage={app.currentPage}
            currentUser={app.currentUser}
            practiceFilter={app.practiceFilter}
            activeMockResult={app.activeMockResult}
            retakeList={app.retakeList}
            todayRecord={app.todayRecord}
            syncStatus={app.syncStatus}
            syncError={app.syncError}
            localPersistenceStatus={app.localPersistenceStatus}
            actions={app.actions}
          />
        </Suspense>
      </main>

      {app.showImportModal && (
        <LocalImportModal {...app.importModal} />
      )}
    </div>
  );
}
