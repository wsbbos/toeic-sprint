export const MINI_MOCK_DURATION_SECONDS = 15 * 60

export function selectMiniMockQuestions(questions = []) {
  const validQuestions = questions.filter((question) => (
    question?.id
    && question.question
    && Object.keys(question.choices || {}).length >= 4
    && question.correctAnswer
    && question.explanation
    && (question.part === 5 || question.part === 7)
  ))
  const part5 = validQuestions.filter((question) => question.part === 5)
  const part7 = validQuestions.filter((question) => question.part === 7)
  let selectedPart5 = part5.slice(0, 12)
  let selectedPart7 = part7.slice(0, 8)

  if (selectedPart5.length < 12) selectedPart7 = part7.slice(0, 8 + (12 - selectedPart5.length))
  else if (selectedPart7.length < 8) selectedPart5 = part5.slice(0, 12 + (8 - selectedPart7.length))

  return [...selectedPart5, ...selectedPart7].slice(0, 20)
}

export function buildMiniMockResult(
  questions,
  answers = {},
  secondsRemaining = MINI_MOCK_DURATION_SECONDS,
  now = new Date(),
) {
  const outcomes = questions.map((question) => {
    const userAnswer = answers[question.id] || ''
    return {
      question,
      questionId: question.id,
      part: question.part,
      category: question.category || '',
      difficulty: question.difficulty || 'medium',
      tags: [...(question.tags || [])],
      userAnswer,
      isCorrect: userAnswer === question.correctAnswer,
    }
  })
  const correctCount = outcomes.filter((outcome) => outcome.isCorrect).length
  const totalQuestions = questions.length
  const wrongList = outcomes.filter((outcome) => !outcome.isCorrect).map(({ question, userAnswer }) => ({
    questionId: question.id,
    part: question.part,
    question: question.question,
    passage: question.passage || '',
    document: question.document || null,
    choices: { ...(question.choices || {}) },
    userAnswer: userAnswer || '無作答',
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    category: question.category || '',
    difficulty: question.difficulty || 'medium',
    tags: [...(question.tags || [])],
  }))
  const rawScore = totalQuestions ? Math.round((correctCount / totalQuestions) * 980 + 10) : 10
  const score = Math.min(990, Math.max(10, Math.round(rawScore / 5) * 5))

  return {
    id: `mock_${now.getTime()}`,
    date: now.toISOString().split('T')[0],
    mode: 'Mini Mock',
    totalQuestions,
    correctCount,
    wrongCount: wrongList.length,
    score,
    lScore: 0,
    rScore: score,
    listeningCorrect: 0,
    listeningTotal: 0,
    readingCorrect: correctCount,
    readingTotal: totalQuestions,
    timeSpent: Math.max(0, MINI_MOCK_DURATION_SECONDS - Number(secondsRemaining || 0)),
    wrongList,
    questionOutcomes: outcomes.map((outcome) => ({
      questionId: outcome.questionId,
      part: outcome.part,
      category: outcome.category,
      difficulty: outcome.difficulty,
      tags: outcome.tags,
      userAnswer: outcome.userAnswer,
      isCorrect: outcome.isCorrect,
    })),
  }
}
