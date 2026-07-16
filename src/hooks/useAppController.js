import { useCallback, useMemo, useRef, useState } from 'react';
import { createGuestProfile, normalizeUserProfile } from '../data/userProfile';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  fetchOrCreateCloudUser,
  saveCloudUser,
  stampProfileUpdate,
  signOutWithTimeout,
  syncPublicStats as syncPublicStatsToCloud,
  upsertProfile,
} from '../services/cloudUserService';
import {
  clearAuthStorage,
  hasImportedLegacyData,
  loadCachedUser,
  loadLegacyUsers,
  markLegacyDataImported,
  saveCachedUser,
} from '../services/localUserRepository';
import {
  recordMockResult,
  recordPracticeOutcomes,
  recordRetake,
  removeWrongQuestion,
  resetLearningData,
  toggleFavorite,
  updateVocabularyStatus,
  updateWrongReason,
  updateWrongStatus,
} from '../services/userProgressService';
import { isStaleSessionError, sanitizeError } from '../utils/errorSanitizer';
import { useSupabaseSession } from './useSupabaseSession';

const EMPTY_TODAY_RECORD = Object.freeze({
  wordsLearned: 0,
  questionsAnswered: 0,
  studyMinutes: 0,
  mistakesReviewed: 0,
});

export function useAppController() {
  const [currentUser, setCurrentUser] = useState(() => {
    const cached = loadCachedUser();
    return cached ? normalizeUserProfile(cached) : null;
  });
  const [currentPage, setCurrentPage] = useState('login');
  const [practiceFilter, setPracticeFilter] = useState('');
  const [activeMockResult, setActiveMockResult] = useState(null);
  const [retakeList, setRetakeList] = useState([]);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [syncError, setSyncError] = useState(null);
  const [localPersistenceStatus, setLocalPersistenceStatus] = useState('available');
  const [localPersistenceError, setLocalPersistenceError] = useState(null);
  const [legacyLocalUsers, setLegacyLocalUsers] = useState([]);
  const [selectedLegacyUserToImport, setSelectedLegacyUserToImport] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const handlingStaleSessionRef = useRef(false);
  const currentUserRef = useRef(currentUser);
  const syncQueueRef = useRef(Promise.resolve());
  const commitCurrentUser = useCallback((user) => {
    currentUserRef.current = user;
    setCurrentUser(user);
  }, []);

  const reportLocalPersistence = useCallback((persisted) => {
    if (persisted) {
      setLocalPersistenceStatus('available');
      setLocalPersistenceError(null);
    } else {
      setLocalPersistenceStatus('failed');
      setLocalPersistenceError({
        code: 'LOCAL_STORAGE_UNAVAILABLE',
        message: '此瀏覽器目前無法儲存學習進度。',
        details: '請保留此頁面並確認瀏覽器儲存空間或隱私設定；登入使用者仍可嘗試雲端同步。',
      });
    }
    return persisted;
  }, []);

  const persistCachedUser = useCallback((user) => (
    reportLocalPersistence(saveCachedUser(undefined, user))
  ), [reportLocalPersistence]);

  const clearLocalSession = useCallback(() => {
    clearAuthStorage();
    try {
      sessionStorage.clear();
    } catch {
      // Storage may be unavailable in privacy mode.
    }
    commitCurrentUser(null);
    setCurrentPage('login');
  }, [commitCurrentUser]);

  const handleStaleSession = useCallback(async (error) => {
    if (!isStaleSessionError(error)) return false;
    if (handlingStaleSessionRef.current) return true;

    handlingStaleSessionRef.current = true;
    try {
      await signOutWithTimeout(supabase);
    } catch (signOutError) {
      console.warn('Stale session sign-out failed; local cleanup continued.', sanitizeError(signOutError));
    } finally {
      clearLocalSession();
      handlingStaleSessionRef.current = false;
    }
    window.alert('登入狀態已失效，請重新登入。');
    return true;
  }, [clearLocalSession]);

  const exposeSyncError = useCallback(async (error) => {
    const stale = await handleStaleSession(error);
    if (!stale) {
      setSyncError(sanitizeError(error));
      setSyncStatus('failed');
    }
  }, [handleStaleSession]);

  const syncPublicStatsSafely = useCallback(async (user, sessionUserId = user?.id) => {
    try {
      await syncPublicStatsToCloud(supabase, user, sessionUserId || user?.id);
    } catch (error) {
      const stale = await handleStaleSession(error);
      if (!stale) {
        console.warn('Public stats sync failed without blocking local progress.', sanitizeError(error));
      }
    }
  }, [handleStaleSession]);

  const handleSessionChange = useCallback(async (
    session,
    event = 'UNKNOWN',
    customUsername = null,
  ) => {

    if (!session) {
      if (event === 'INITIAL_SESSION' && currentUserRef.current?.isGuest) return;
      if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        clearLocalSession();
      }
      return;
    }

    setSyncStatus('syncing');
    setSyncError(null);
    const authUser = session.user;

    try {
      try {
        const { error: profileError } = await upsertProfile(
          supabase,
          authUser,
          customUsername,
        );
        if (profileError) {
          const stale = await handleStaleSession(profileError);
          if (!stale) {
            console.warn('Profile sync did not block app-data loading.', sanitizeError(profileError));
          }
        }
      } catch (profileError) {
        console.warn('Profile sync exception did not block app-data loading.', sanitizeError(profileError));
      }

      const { user } = await fetchOrCreateCloudUser(
        supabase,
        authUser,
        customUsername,
        currentUserRef.current,
      );
      commitCurrentUser(user);
      persistCachedUser(user);
      setCurrentPage(user.goals?.examDate ? 'home' : 'onboarding');
      setSyncStatus('synced');
      await syncPublicStatsSafely(user, authUser.id);

      const legacyUsers = loadLegacyUsers();
      if (legacyUsers.length > 0 && !hasImportedLegacyData(undefined, authUser.id)) {
        setLegacyLocalUsers(legacyUsers);
        setSelectedLegacyUserToImport(legacyUsers[0].id);
        setShowImportModal(true);
      }
    } catch (error) {
      await exposeSyncError(error);
    }
  }, [clearLocalSession, commitCurrentUser, exposeSyncError, handleStaleSession, persistCachedUser, syncPublicStatsSafely]);

  const sessionStatus = useSupabaseSession({
    client: supabase,
    enabled: isSupabaseConfigured,
    onSession: handleSessionChange,
    onError: exposeSyncError,
  });

  const syncWithCloud = useCallback((user) => {
    if (!user || user.isGuest || !isSupabaseConfigured) {
      setSyncStatus('synced');
      return Promise.resolve();
    }

    const pending = syncQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        setSyncStatus('syncing');
        setSyncError(null);
        try {
          await saveCloudUser(supabase, user);
          await syncPublicStatsSafely(user);
          setSyncStatus('synced');
        } catch (error) {
          await exposeSyncError(error);
        }
      });
    syncQueueRef.current = pending;
    return pending;
  }, [exposeSyncError, syncPublicStatsSafely]);

  const updateActiveUser = useCallback(async (transform) => {
    const activeUser = currentUserRef.current;
    if (!activeUser) return null;
    const updated = stampProfileUpdate(
      normalizeUserProfile(transform(normalizeUserProfile(activeUser))),
    );
    commitCurrentUser(updated);
    persistCachedUser(updated);
    await syncWithCloud(updated);
    return updated;
  }, [commitCurrentUser, persistCachedUser, syncWithCloud]);

  const handleGuestLogin = useCallback(() => {
    const guest = createGuestProfile();
    commitCurrentUser(guest);
    persistCachedUser(guest);
    setSyncStatus('synced');
    setCurrentPage('home');
  }, [commitCurrentUser, persistCachedUser]);

  const handleLoginSuccess = useCallback((session, customUsername) => (
    handleSessionChange(session, 'SIGNED_IN', customUsername)
  ), [handleSessionChange]);

  const handleImportLocalData = useCallback(async (legacyUserId) => {
    const legacyUser = loadLegacyUsers().find((user) => user.id === legacyUserId);
    if (!legacyUser || !currentUser) return;

    const mergedUser = stampProfileUpdate(normalizeUserProfile({
      ...currentUser,
      ...legacyUser,
      id: currentUser.id,
      email: currentUser.email,
      username: currentUser.username || legacyUser.username,
    }));
    commitCurrentUser(mergedUser);
    persistCachedUser(mergedUser);
    await syncWithCloud(mergedUser);
    markLegacyDataImported(undefined, currentUser.id);
    setShowImportModal(false);
    window.alert('本機學習資料已匯入。');
  }, [commitCurrentUser, currentUser, persistCachedUser, syncWithCloud]);

  const dismissImportModal = useCallback(() => {
    if (currentUser?.id) {
      markLegacyDataImported(undefined, currentUser.id);
    }
    setShowImportModal(false);
  }, [currentUser]);

  const handleManualSync = useCallback(async () => {
    if (!supabase || !currentUserRef.current) return;
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      await syncQueueRef.current.catch(() => undefined);
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const authUser = data?.session?.user;
      if (!authUser) throw new Error('NO_ACTIVE_SESSION');
      const localUser = currentUserRef.current;

      const { error: profileError } = await upsertProfile(
        supabase,
        authUser,
        localUser.username,
      );
      if (profileError) throw profileError;

      const { user } = await fetchOrCreateCloudUser(
        supabase,
        authUser,
        localUser.username,
        localUser,
      );
      commitCurrentUser(user);
      persistCachedUser(user);
      await syncPublicStatsSafely(user, authUser.id);
      setSyncStatus('synced');
    } catch (error) {
      await exposeSyncError(error);
    }
  }, [commitCurrentUser, exposeSyncError, persistCachedUser, syncPublicStatsSafely]);

  const safeLogout = useCallback(async () => {
    try {
      await signOutWithTimeout(supabase);
    } catch (error) {
      console.warn('Remote sign-out failed; local session was still cleared.', sanitizeError(error));
    } finally {
      clearLocalSession();
    }
  }, [clearLocalSession]);

  const handleSaveGoals = useCallback(async (goals) => {
    await updateActiveUser((user) => ({
      ...user,
      goals: { ...user.goals, ...goals },
    }));
    setCurrentPage('home');
  }, [updateActiveUser]);

  const handleClearData = useCallback(() => (
    updateActiveUser((user) => resetLearningData(user))
  ), [updateActiveUser]);

  const handleDeleteAccount = useCallback(async () => {
    await handleClearData();
    await safeLogout();
  }, [handleClearData, safeLogout]);

  const handlePracticeCompleted = useCallback((outcomes) => (
    updateActiveUser((user) => recordPracticeOutcomes(user, outcomes))
  ), [updateActiveUser]);

  const handleMockExamSubmitted = useCallback((result) => {
    updateActiveUser((user) => recordMockResult(user, result));
    setActiveMockResult(result);
  }, [updateActiveUser]);

  const handleWordStatusChanged = useCallback((wordId, status) => (
    updateActiveUser((user) => updateVocabularyStatus(user, wordId, status))
  ), [updateActiveUser]);

  const handleToggleFavorite = useCallback((question) => (
    updateActiveUser((user) => toggleFavorite(user, question))
  ), [updateActiveUser]);

  const handleUpdateWrongReason = useCallback((questionId, reason) => (
    updateActiveUser((user) => updateWrongReason(user, questionId, reason))
  ), [updateActiveUser]);

  const handleUpdateWrongStatus = useCallback((questionId, status) => (
    updateActiveUser((user) => updateWrongStatus(user, questionId, status))
  ), [updateActiveUser]);

  const handleRemoveWrongQuestion = useCallback((questionId) => {
    updateActiveUser((user) => removeWrongQuestion(user, questionId));
    window.alert('已從錯題本移除。');
  }, [updateActiveUser]);

  const handleRetakeCompleted = useCallback((questionId, isCorrect) => (
    updateActiveUser((user) => recordRetake(user, questionId, isCorrect))
  ), [updateActiveUser]);

  const handleStartRetakeSession = useCallback((items) => {
    setRetakeList(items);
    setCurrentPage('retake-practice');
  }, []);

  const todayRecord = useMemo(() => {
    const date = new Date().toISOString().split('T')[0];
    return currentUser?.dailyRecords?.find((record) => record.date === date)
      || EMPTY_TODAY_RECORD;
  }, [currentUser]);

  const actions = useMemo(() => ({
    onPracticeCompleted: handlePracticeCompleted,
    onClearData: handleClearData,
    onDeleteAccount: handleDeleteAccount,
    onGuestLogin: handleGuestLogin,
    onLoginSuccess: handleLoginSuccess,
    onManualSync: handleManualSync,
    onLocalPersistenceResult: reportLocalPersistence,
    onMockExamSubmitted: handleMockExamSubmitted,
    onRemoveWrongQuestion: handleRemoveWrongQuestion,
    onRetakeCompleted: handleRetakeCompleted,
    onSaveGoals: handleSaveGoals,
    onStartRetakeSession: handleStartRetakeSession,
    onToggleFavorite: handleToggleFavorite,
    onUpdateWrongReason: handleUpdateWrongReason,
    onUpdateWrongStatus: handleUpdateWrongStatus,
    onWordStatusChanged: handleWordStatusChanged,
    setCurrentPage,
    setPracticeFilter,
  }), [
    handlePracticeCompleted,
    handleClearData,
    handleDeleteAccount,
    handleGuestLogin,
    handleLoginSuccess,
    handleManualSync,
    handleMockExamSubmitted,
    reportLocalPersistence,
    handleRemoveWrongQuestion,
    handleRetakeCompleted,
    handleSaveGoals,
    handleStartRetakeSession,
    handleToggleFavorite,
    handleUpdateWrongReason,
    handleUpdateWrongStatus,
    handleWordStatusChanged,
  ]);

  return {
    actions,
    activeMockResult,
    currentPage,
    currentUser,
    localPersistenceError,
    localPersistenceStatus,
    importModal: {
      onDismiss: dismissImportModal,
      onImport: handleImportLocalData,
      onSelectedUserChange: setSelectedLegacyUserToImport,
      selectedUserId: selectedLegacyUserToImport,
      users: legacyLocalUsers,
    },
    practiceFilter,
    retakeList,
    safeLogout,
    sessionStatus,
    showImportModal,
    syncError,
    syncStatus,
    todayRecord,
  };
}
