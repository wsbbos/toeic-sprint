import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DocumentRenderer from '../components/documents/DocumentRenderer.jsx'
import ExplanationPanel from '../components/explanations/ExplanationPanel.jsx'
import EmptyLearningState from '../components/visuals/EmptyLearningState.jsx'
import VisualAsset from '../components/visuals/VisualAsset.jsx'
import { clearPracticeDraft, loadPracticeDraft, savePracticeDraft } from '../services/practiceDraftRepository.js'
import {
  createPracticeSession,
  selectPracticeQuestions,
  setSessionAnswer,
  setSessionCurrentIndex,
  submitPracticeSession,
  toggleMarkedQuestion
} from '../services/practiceSessionService.js'
import { extractAudioTranscript, isSpeechSupported, speakText, stopSpeaking } from '../utils/speech.js'

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export default function QuestionPractice({ currentUser, setCurrentPage, practiceFilter, onAnswerSubmitted, onPracticeCompleted, onToggleFavorite, questions = [] }) {
  const ownerId = currentUser?.isGuest ? 'guest-local' : currentUser?.id || 'guest-local'
  const questionById = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions])
  const [session, setSession] = useState(() => {
    const draft = loadPracticeDraft(undefined, ownerId)
    const requestedConfig = practiceFilter || { type: 'part5', count: 10 }
    const draftMatchesConfig = ['type', 'mode', 'category', 'difficulty', 'timed', 'durationSeconds'].every((key) => (draft?.config?.[key] || null) === (requestedConfig[key] || null))
      && Number(draft?.config?.requestedCount ?? draft?.config?.count ?? 0) === Number(requestedConfig.count ?? 0)
    const draftIsUsable = draftMatchesConfig && draft?.questionIds.every((id) => questions.some((question) => question.id === id))
    if (draftIsUsable) return draft
    const selected = selectPracticeQuestions(questions, requestedConfig)
    return createPracticeSession(selected, requestedConfig, new Date(), ownerId)
  })
  const [result, setResult] = useState(session.result)
  const [elapsedSeconds, setElapsedSeconds] = useState(() => Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)))
  const [isPlaying, setIsPlaying] = useState(false)
  const submittingRef = useRef(false)

  const activeQuestions = useMemo(() => session.questionIds.map((id) => questionById.get(id)).filter(Boolean), [questionById, session.questionIds])
  const currentQuestion = activeQuestions[session.currentIndex]
  const selectedChoice = currentQuestion ? session.answers[currentQuestion.id] || '' : ''
  const isFavorite = currentQuestion ? (currentUser?.favorites || []).some((item) => item.questionId === currentQuestion.id) : false
  const duration = Number(session.config.durationSeconds) || 0
  const remaining = duration ? Math.max(0, duration - elapsedSeconds) : null

  useEffect(() => {
    if (session.status !== 'active') return undefined
    savePracticeDraft(session, undefined, ownerId)
    return undefined
  }, [ownerId, session])

  useEffect(() => {
    if (session.status !== 'active') return undefined
    const timer = setInterval(() => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000))), 1000)
    return () => clearInterval(timer)
  }, [session.startedAt, session.status])

  useEffect(() => () => stopSpeaking(), [])

  const finish = useCallback((automatic = false) => {
    if (session.status !== 'active' || submittingRef.current) return
    const unanswered = session.questionIds.length - Object.keys(session.answers).length
    if (!automatic && !window.confirm(`確定交卷嗎？尚有 ${unanswered} 題未作答。`)) return
    submittingRef.current = true
    const submitted = submitPracticeSession(session, questions)
    const trackedOutcomes = submitted.result.outcomes.filter((outcome) => outcome.question && outcome.userAnswer)
    if (onPracticeCompleted) onPracticeCompleted(trackedOutcomes)
    else trackedOutcomes.forEach((outcome) => onAnswerSubmitted?.(outcome.question, outcome.userAnswer, outcome.isCorrect))
    setSession(submitted.session)
    setResult(submitted.result)
    clearPracticeDraft(undefined, ownerId)
  }, [onAnswerSubmitted, onPracticeCompleted, ownerId, questions, session])

  useEffect(() => {
    // Timer expiry is an external time event; submit once when the countdown reaches zero.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (remaining === 0 && session.status === 'active') finish(true)
  }, [finish, remaining, session.status])

  const leave = () => {
    if (window.confirm('離開後會保留目前答案，下次可繼續作答。')) setCurrentPage('practice-center')
  }

  if (!currentQuestion && !result) {
    return <EmptyLearningState variant="empty" title="沒有符合條件的題目" description="目前題庫沒有符合這組篩選條件的題目，請返回練習中心調整題數、分類或難度。" actionLabel="返回練習中心" onAction={() => setCurrentPage('practice-center')} />
  }

  if (result) {
    return (
      <main data-testid="practice-result" className="practice-result" aria-labelledby="result-title">
        <section className="card result-hero"><VisualAsset className="result-hero-visual" name="result" decorative /><span className="badge badge-mastered">Completed</span><h1 id="result-title">練習結果</h1>
          <div className="result-metrics"><div><strong>{result.accuracy}%</strong><span>正確率</span></div><div><strong>{result.correctCount}/{result.totalQuestions}</strong><span>答對題數</span></div><div><strong>{formatTime(result.elapsedSeconds)}</strong><span>作答時間</span></div></div>
        </section>
        <section className="card"><h2>分類表現</h2><div className="category-results">{Object.entries(result.categoryPerformance).map(([category, stats]) => <div key={category}><span>{category.replaceAll('_', ' ')}</span><strong>{stats.correct}/{stats.total} · {stats.accuracy}%</strong></div>)}</div></section>
        <section className="flex flex-col gap-3" aria-label="逐題解析">
          {result.outcomes.map((outcome, index) => (
            <ExplanationPanel
              key={outcome.questionId}
              question={outcome.question}
              userAnswer={outcome.userAnswer}
              correctAnswer={outcome.correctAnswer}
              index={index}
            />
          ))}
        </section>
        <button className="btn btn-primary" onClick={() => setCurrentPage('practice-center')}>返回練習中心</button>
      </main>
    )
  }

  const isListening = currentQuestion.part >= 1 && currentQuestion.part <= 4
  const imageUrl = currentQuestion.imageUrl || currentQuestion.image || currentQuestion.photo
  const progress = Math.round(((session.currentIndex + 1) / activeQuestions.length) * 100)

  return (
    <main data-testid="question-practice" className="practice-container" aria-labelledby="question-title">
      <header className="practice-toolbar"><button className="btn btn-outline btn-sm" onClick={leave}>離開並保存</button><span>{remaining === null ? `已用 ${formatTime(elapsedSeconds)}` : `剩餘 ${formatTime(remaining)}`}</span><span>{session.currentIndex + 1} / {activeQuestions.length}</span></header>
      <div className="progress-bar-container" aria-label={`進度 ${progress}%`}><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div>
      <article className="card question-card">
        <div className="flex justify-between align-center"><span className="badge badge-new">Part {currentQuestion.part}</span><div className="flex gap-2"><button className={`btn btn-sm ${isFavorite ? 'btn-accent' : 'btn-outline'}`} onClick={() => onToggleFavorite?.(currentQuestion)}>{isFavorite ? '已收藏' : '收藏'}</button><button className={`btn btn-sm ${session.markedQuestionIds.includes(currentQuestion.id) ? 'btn-accent' : 'btn-outline'}`} onClick={() => setSession((current) => toggleMarkedQuestion(current, currentQuestion.id))}>{session.markedQuestionIds.includes(currentQuestion.id) ? '已標記' : '標記題目'}</button></div></div>
        {currentQuestion.passage && <DocumentRenderer passage={currentQuestion.passage} document={currentQuestion.document} />}
        {imageUrl && <img className="question-image" src={imageUrl} alt="TOEIC Part 1 題目圖片" />}
        {isListening && <button className="btn btn-outline" disabled={!isSpeechSupported()} onClick={() => { if (isPlaying) { stopSpeaking(); setIsPlaying(false) } else { setIsPlaying(true); speakText(currentQuestion.audioText || currentQuestion.transcript || extractAudioTranscript(currentQuestion.question), 0.9, () => setIsPlaying(false)) } }}>{isPlaying ? '停止播放' : '播放聽力題目'}</button>}
        <h1 id="question-title">{currentQuestion.question}</h1>
        <div className="choice-container" role="radiogroup" aria-label="答案選項">{Object.entries(currentQuestion.choices || {}).map(([key, value]) => <button key={key} role="radio" aria-checked={selectedChoice === key} className={`choice-btn ${selectedChoice === key ? 'selected' : ''}`} onClick={() => setSession((current) => setSessionAnswer(current, currentQuestion.id, key))}><span className="choice-letter">{key}</span><span>{value}</span></button>)}</div>
        <nav className="practice-navigation" aria-label="題目導覽"><button className="btn btn-outline" disabled={session.currentIndex === 0} onClick={() => setSession((current) => setSessionCurrentIndex(current, current.currentIndex - 1))}>上一題</button><button data-testid="next-question" className="btn btn-outline" disabled={session.currentIndex === activeQuestions.length - 1} onClick={() => setSession((current) => setSessionCurrentIndex(current, current.currentIndex + 1))}>下一題</button><button data-testid="submit-practice" className="btn btn-primary" onClick={() => finish(false)}>確認交卷</button></nav>
      </article>
    </main>
  )
}
