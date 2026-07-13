export default function AppLoadingState({ message = '正在載入學習資料…', contained = false }) {
  const Element = contained ? 'div' : 'main'
  return (
    <Element className="app-state-screen" role="status" aria-live="polite">
      <div className="app-state-spinner" aria-hidden="true" />
      <p>{message}</p>
    </Element>
  );
}
