const clampCount = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const shuffle = (items, random) => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

export function selectPracticeQuestions(questions, config = {}, random = Math.random) {
  const type = config.type || 'part5'
  let candidates = [...questions]

  if (type === 'part5' || type === 'full_mock') candidates = candidates.filter((question) => question.part === 5)
  if (type === 'part7') candidates = candidates.filter((question) => question.part === 7)
  if (type === 'listening') candidates = candidates.filter((question) => question.part >= 1 && question.part <= 4 && (question.part !== 1 || question.imageUrl || question.image || question.photo))
  if (config.category && config.category !== 'all') {
    candidates = candidates.filter((question) => question.category === config.category)
  }
  if (config.difficulty && config.difficulty !== 'all') {
    candidates = candidates.filter((question) => question.difficulty?.toLowerCase() === config.difficulty.toLowerCase())
  }

  const defaultCount = type === 'full_mock' ? 100 : candidates.length
  return shuffle(candidates, random).slice(0, clampCount(config.count, defaultCount))
}

export function createPracticeSession(questions, config = {}, now = new Date(), ownerId = 'guest-local') {
  const startedAt = now.toISOString()
  return {
    id: `practice-${now.getTime()}`,
    version: 2,
    ownerId,
    config: { ...config, requestedCount: clampCount(config.count, questions.length), count: questions.length },
    questionIds: questions.map((question) => question.id),
    answers: {},
    markedQuestionIds: [],
    currentIndex: 0,
    startedAt,
    updatedAt: startedAt,
    submittedAt: null,
    status: 'active',
    result: null
  }
}

export function setSessionAnswer(session, questionId, choice, now = new Date()) {
  if (session.status === 'submitted' || !session.questionIds.includes(questionId)) return session
  return {
    ...session,
    answers: { ...session.answers, [questionId]: choice },
    updatedAt: now.toISOString()
  }
}

export function setSessionCurrentIndex(session, currentIndex, now = new Date()) {
  const maxIndex = Math.max(0, session.questionIds.length - 1)
  return {
    ...session,
    currentIndex: Math.min(Math.max(0, currentIndex), maxIndex),
    updatedAt: now.toISOString()
  }
}

export function toggleMarkedQuestion(session, questionId, now = new Date()) {
  const marked = new Set(session.markedQuestionIds)
  if (marked.has(questionId)) marked.delete(questionId)
  else marked.add(questionId)
  return { ...session, markedQuestionIds: [...marked], updatedAt: now.toISOString() }
}

export function submitPracticeSession(session, questions, now = new Date()) {
  if (session.status === 'submitted' && session.result) return { session, result: session.result }

  const questionById = new Map(questions.map((question) => [question.id, question]))
  const outcomes = session.questionIds.map((questionId) => {
    const question = questionById.get(questionId)
    const userAnswer = session.answers[questionId] || null
    const correctAnswer = question?.correctAnswer || question?.answer
    const isCorrect = Boolean(question && userAnswer === correctAnswer)
    return {
      question,
      questionId,
      userAnswer,
      correctAnswer,
      isCorrect,
      status: isCorrect ? 'correct' : userAnswer ? 'incorrect' : 'unanswered'
    }
  })
  const correctCount = outcomes.filter((outcome) => outcome.isCorrect).length
  const answeredCount = outcomes.filter((outcome) => outcome.status !== 'unanswered').length
  const incorrectCount = outcomes.filter((outcome) => outcome.status === 'incorrect').length
  const unansweredCount = outcomes.length - answeredCount
  const totalQuestions = outcomes.length
  const categoryPerformance = {}

  for (const outcome of outcomes) {
    if (outcome.status === 'unanswered') continue
    const category = outcome.question?.category || outcome.question?.type || `Part ${outcome.question?.part || '?'}`
    const current = categoryPerformance[category] || { total: 0, correct: 0, accuracy: 0 }
    current.total += 1
    if (outcome.isCorrect) current.correct += 1
    current.accuracy = Math.round((current.correct / current.total) * 100)
    categoryPerformance[category] = current
  }

  const result = {
    sessionId: session.id,
    totalQuestions,
    answeredCount,
    correctCount,
    incorrectCount,
    wrongCount: incorrectCount,
    unansweredCount,
    accuracy: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
    elapsedSeconds: Math.max(0, Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 1000)),
    categoryPerformance,
    outcomes,
    submittedAt: now.toISOString()
  }
  const submittedSession = {
    ...session,
    status: 'submitted',
    submittedAt: result.submittedAt,
    updatedAt: result.submittedAt,
    result
  }

  return { session: submittedSession, result }
}
