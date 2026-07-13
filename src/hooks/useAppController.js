import { useCallback, useMemo, useRef, useState } from 'react';
import { normalizeUserProfile } from '../data/userProfile';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  fetchCloudUser,
  fetchOrCreateCloudUser,
  saveCloudUser,
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
  recordPracticeAnswer,
  recordRetake,
  removeWrongQuestion,
  resetLearningData,
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
  const [currentSession, setCurrentSession] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [practiceFilter, setPracticeFilter] = useState('');
  const [activeMockResult, setActiveMockResult] = useState(null);
  const [retakeList, setRetakeList] = useState([]);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [syncError, setSyncError] = useState(null);
  const [legacyLocalUsers, setLegacyLocalUsers] = useState([]);
  const [selectedLegacyUserToImport, setSelectedLegacyUserToImport] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const handlingStaleSessionRef = useRef(false);

  const clearLocalSession = useCallback(() => {
    clearAuthStorage();
    try {
      sessionStorage.clear();
    } catch {
      // Storage may be unavailable in privacy mode.
    }
    setCurrentUser(null);
    setCurrentSession(null);
    setCurrentPage('login');
  }, []);

  const handleStaleSession = useCallback(async (error) => {
    if (!isStaleSessionError(error)) return false;
    if (handlingStaleSessionRef.current) return true;

    handlingStaleSessionRef.current = true;
    try {
      await signOutWithTimeout(supabase);
    } catch (signOutError) {
      console.warn('Stale session sign-out failed; local cleanup continued.', signOutError);
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

  const syncPublicStatsSafely = useCallback(async (user, sessionUserId) => {
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
    setCurrentSession(session);

    if (!session) {
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
      );
      setCurrentUser(user);
      saveCachedUser(undefined, user);
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
  }, [clearLocalSession, exposeSyncError, handleStaleSession, syncPublicStatsSafely]);

  const sessionStatus = useSupabaseSession({
    client: supabase,
    enabled: isSupabaseConfigured,
    onSession: handleSessionChange,
    onError: exposeSyncError,
  });

  const syncWithCloud = useCallback(async (user) => {
    if (!user || user.isGuest || !isSupabaseConfigured) {
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');
    setSyncError(null);
    try {
      await saveCloudUser(supabase, user);
      await syncPublicStatsSafely(user);
      setSyncStatus('synced');
    } catch (error) {
      await exposeSyncError(error);
    }
  }, [exposeSyncError, syncPublicStatsSafely]);

  const updateActiveUser = useCallback(async (transform) => {
    if (!currentUser) return null;
    const updated = normalizeUserProfile(transform(normalizeUserProfile(currentUser)));
    setCurrentUser(updated);
    saveCachedUser(undefined, updated);
    await syncWithCloud(updated);
    return updated;
  }, [currentUser, syncWithCloud]);

  const handleLoginSuccess = useCallback((session, customUsername) => (
    handleSessionChange(session, 'SIGNED_IN', customUsername)
  ), [handleSessionChange]);

  const handleImportLocalData = useCallback(async (legacyUserId) => {
    const legacyUser = loadLegacyUsers().find((user) => user.id === legacyUserId);
    if (!legacyUser || !currentUser) return;

    const mergedUser = normalizeUserProfile({
      ...currentUser,
      ...legacyUser,
      id: currentUser.id,
      email: currentUser.email,
      username: currentUser.username || legacyUser.username,
    });
    setCurrentUser(mergedUser);
    saveCachedUser(undefined, mergedUser);
    await syncWithCloud(mergedUser);
    markLegacyDataImported(undefined, currentUser.id);
    setShowImportModal(false);
    window.alert('本機學習資料已匯入。');
  }, [currentUser, syncWithCloud]);

  const dismissImportModal = useCallback(() => {
    if (currentUser?.id) {
      markLegacyDataImported(undefined, currentUser.id);
    }
    setShowImportModal(false);
  }, [currentUser]);

  const handleManualSync = useCallback(async () => {
    if (!supabase || !currentUser) return;
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const authUser = data?.session?.user;
      if (!authUser) throw new Error('NO_ACTIVE_SESSION');

      const { error: profileError } = await upsertProfile(
        supabase,
        authUser,
        currentUser.username,
      );
      if (profileError) throw profileError;

      const cloudUser = await fetchCloudUser(supabase, authUser);
      if (cloudUser) {
        setCurrentUser(cloudUser);
        saveCachedUser(undefined, cloudUser);
        await syncPublicStatsSafely(cloudUser, authUser.id);
      } else {
        await saveCloudUser(supabase, currentUser);
        await syncPublicStatsSafely(currentUser, authUser.id);
      }
      setSyncStatus('synced');
    } catch (error) {
      await exposeSyncError(error);
    }
  }, [currentUser, exposeSyncError, syncPublicStatsSafely]);

  const safeLogout = useCallback(async () => {
    try {
      await signOutWithTimeout(supabase);
    } catch (error) {
      console.warn('Remote sign-out failed; local session was still cleared.', sanitizeError(error));
    } finally {
      clearLocalSession();
    }
  }, [clearLocalSession]);

  const handleSaveGoals = useCallback((goals) => {
    updateActiveUser((user) => ({
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

  const handleAnswerSubmitted = useCallback((question, userAnswer, isCorrect) => (
    updateActiveUser((user) => (
      recordPracticeAnswer(user, question, userAnswer, isCorrect)
    ))
  ), [updateActiveUser]);

  const handleMockExamSubmitted = useCallback((result) => {
    updateActiveUser((user) => recordMockResult(user, result));
    setActiveMockResult(result);
  }, [updateActiveUser]);

  const handleWordStatusChanged = useCallback((wordId, status) => (
    updateActiveUser((user) => updateVocabularyStatus(user, wordId, status))
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
    onAnswerSubmitted: handleAnswerSubmitted,
    onClearData: handleClearData,
    onDeleteAccount: handleDeleteAccount,
    onLoginSuccess: handleLoginSuccess,
    onManualSync: handleManualSync,
    onMockExamSubmitted: handleMockExamSubmitted,
    onRemoveWrongQuestion: handleRemoveWrongQuestion,
    onRetakeCompleted: handleRetakeCompleted,
    onSaveGoals: handleSaveGoals,
    onStartRetakeSession: handleStartRetakeSession,
    onUpdateWrongReason: handleUpdateWrongReason,
    onUpdateWrongStatus: handleUpdateWrongStatus,
    onWordStatusChanged: handleWordStatusChanged,
    setCurrentPage,
    setPracticeFilter,
  }), [
    handleAnswerSubmitted,
    handleClearData,
    handleDeleteAccount,
    handleLoginSuccess,
    handleManualSync,
    handleMockExamSubmitted,
    handleRemoveWrongQuestion,
    handleRetakeCompleted,
    handleSaveGoals,
    handleStartRetakeSession,
    handleUpdateWrongReason,
    handleUpdateWrongStatus,
    handleWordStatusChanged,
  ]);

  return {
    actions,
    activeMockResult,
    currentPage,
    currentSession,
    currentUser,
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
