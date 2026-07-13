export default function AppLoadingState({ message = '正在載入學習資料…' }) {
  return (
    <main className="app-state-screen" role="status" aria-live="polite">
      <div className="app-state-spinner" aria-hidden="true" />
      <p>{message}</p>
    </main>
  );
}
