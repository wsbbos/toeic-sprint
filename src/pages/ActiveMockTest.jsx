import { useCallback, useEffect, useRef, useState } from 'react'
import DocumentRenderer from '../components/documents/DocumentRenderer.jsx'
import EmptyLearningState from '../components/visuals/EmptyLearningState.jsx'
import {
  buildMiniMockResult,
  MINI_MOCK_DURATION_SECONDS,
  selectMiniMockQuestions,
} from '../services/miniMockService.js'
import {
  clearMiniMockDraft,
  createMiniMockDraft,
  loadMiniMockDraft,
  saveMiniMockDraft,
} from '../services/miniMockDraftRepository.js'

export default function ActiveMockTest({ currentUser, setCurrentPage, onMockExamSubmitted, questions = [] }) {
  const ownerId = currentUser?.isGuest ? 'guest-local' : currentUser?.id || 'guest-local'
  const [initialState] = useState(() => {
    const initializedAt = new Date()
    const questionById = new Map(questions.map((question) => [question.id, question]))
    const restored = loadMiniMockDraft(undefined, ownerId)
    if (restored?.questionIds.every((questionId) => questionById.has(questionId))) {
      return {
        draft: restored,
        questions: restored.questionIds.map((questionId) => questionById.get(questionId)),
        timeLeft: Math.max(0, Math.ceil((Date.parse(restored.endsAt) - initializedAt.getTime()) / 1000)),
      }
    }
    const selected = selectMiniMockQuestions(questions)
    return {
      draft: createMiniMockDraft(
        selected.map((question) => question.id),
        ownerId,
        initializedAt,
        MINI_MOCK_DURATION_SECONDS,
      ),
      questions: selected,
      timeLeft: MINI_MOCK_DURATION_SECONDS,
    }
  })
  const activeQuestions = initialState.questions
  const [currentIdx, setCurrentIdx] = useState(initialState.draft.currentIndex)
  const [answers, setAnswers] = useState(initialState.draft.answers)
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft)
  const answersRef = useRef(initialState.draft.answers)
  const timeLeftRef = useRef(initialState.timeLeft)
  const endsAtRef = useRef(Date.parse(initialState.draft.endsAt))
  const submittedRef = useRef(false)

  const submitExam = useCallback(() => {
    if (submittedRef.current) return
    submittedRef.current = true
    const result = buildMiniMockResult(activeQuestions, answersRef.current, timeLeftRef.current)
    clearMiniMockDraft(undefined, ownerId)
    onMockExamSubmitted?.(result)
    setCurrentPage('result')
  }, [activeQuestions, onMockExamSubmitted, ownerId, setCurrentPage])

  useEffect(() => {
    if (!activeQuestions.length || submittedRef.current) return undefined
    saveMiniMockDraft({
      ...initialState.draft,
      answers,
      currentIndex: currentIdx,
      updatedAt: new Date().toISOString(),
    }, undefined, ownerId)
    return undefined
  }, [activeQuestions.length, answers, currentIdx, initialState.draft, ownerId])

  useEffect(() => {
    if (!activeQuestions.length) return undefined
    const finishExpiredExam = () => {
      if (submittedRef.current) return true
      const next = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000))
      timeLeftRef.current = next
      setTimeLeft(next)
      if (next > 0) return false
      window.alert('時間到！系統已自動幫您提交試卷。')
      submitExam()
      return true
    }
    if (finishExpiredExam()) return undefined
    const timer = window.setInterval(() => {
      if (finishExpiredExam()) window.clearInterval(timer)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [activeQuestions.length, submitExam])

  useEffect(() => {
    const warnBeforeUnload = (event) => {
      if (submittedRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [])

  const handleSelect = (questionId, choice) => {
    setAnswers((previous) => {
      const next = { ...previous, [questionId]: choice }
      answersRef.current = next
      return next
    })
  }

  const handleConfirmSubmit = () => {
    if (!submittedRef.current && window.confirm('確定要提前交卷嗎？')) submitExam()
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  if (!activeQuestions.length) {
    return (
      <EmptyLearningState
        variant="empty"
        title="目前沒有可用的模擬考題目"
        description="題庫暫時無法建立 Mini Mock，請返回模擬考中心後再試一次。"
        actionLabel="返回模擬考中心"
        onAction={() => setCurrentPage('mock-test')}
      />
    )
  }

  const question = activeQuestions[currentIdx]

  return (
    <main data-testid="active-mock-test" className="practice-container" aria-labelledby="mock-title">
      <header className="flex justify-between align-center" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 id="mock-title" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>📝 Mini Mock Test（模擬測驗中）</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>考試中不顯示正誤解析，交卷後生成報告</span>
        </div>
        <div aria-label={`剩餘時間 ${formatTime(timeLeft)}`} style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: timeLeft < 120 ? 'var(--danger)' : 'var(--text-main)', padding: '0.25rem 0.75rem', backgroundColor: timeLeft < 120 ? 'var(--danger-light)' : 'hsl(220, 10%, 93%)', borderRadius: 'var(--radius-sm)' }}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </header>

      <nav className="card flex gap-1 justify-between align-center" aria-label="模擬考題目導覽" style={{ padding: '0.75rem 1rem', overflowX: 'auto', marginBottom: '1.5rem' }}>
        <div className="flex gap-1">
          {activeQuestions.map((item, index) => (
            <button key={item.id} className={`btn btn-sm ${currentIdx === index ? 'btn-primary' : answers[item.id] ? 'btn-secondary' : 'btn-outline'}`} style={{ minWidth: '35px', padding: '0.25rem' }} onClick={() => setCurrentIdx(index)} aria-label={`前往第 ${index + 1} 題`}>
              {index + 1}
            </button>
          ))}
        </div>
        <button className="btn btn-danger btn-sm" onClick={handleConfirmSubmit}>💾 立即交卷</button>
      </nav>

      <article className="card" style={{ padding: '2rem' }}>
        <div className="flex justify-between align-center" style={{ marginBottom: '1rem' }}>
          <span className="badge badge-new">Part {question.part}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>第 {currentIdx + 1} / {activeQuestions.length} 題</span>
        </div>
        {question.passage && <DocumentRenderer passage={question.passage} document={question.document} compact />}
        <h2 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', fontWeight: 600 }}>{question.question}</h2>
        <div className="choice-container" role="radiogroup" aria-label="答案選項">
          {Object.entries(question.choices || {}).map(([key, value]) => {
            const isSelected = answers[question.id] === key
            return (
              <button key={key} role="radio" aria-checked={isSelected} className={`choice-btn ${isSelected ? 'selected' : ''}`} onClick={() => handleSelect(question.id, key)}>
                <span className="choice-letter">{key}</span><span>{value}</span>
              </button>
            )
          })}
        </div>
        <div className="flex justify-between gap-2" style={{ marginTop: '2rem' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} disabled={currentIdx === 0} onClick={() => setCurrentIdx((previous) => previous - 1)}>◀ 上一題</button>
          {currentIdx + 1 < activeQuestions.length
            ? <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentIdx((previous) => previous + 1)}>下一題 ▶</button>
            : <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirmSubmit}>交卷 ➔</button>}
        </div>
      </article>
    </main>
  )
}
