const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30]

const toDateKey = (date) => date.toISOString().slice(0, 10)

const addDays = (date, days) => {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export function updateReviewSchedule(item, isCorrect, now = new Date()) {
  const currentLevel = Number.isInteger(item.reviewLevel) ? item.reviewLevel : 0
  const reviewLevel = isCorrect ? Math.min(REVIEW_INTERVAL_DAYS.length - 1, currentLevel + 1) : 0
  const nextReviewAt = addDays(now, REVIEW_INTERVAL_DAYS[reviewLevel]).toISOString()
  return {
    ...item,
    reviewLevel,
    mastery: isCorrect ? Math.min(100, (item.mastery || 0) + 20) : Math.max(0, (item.mastery || 0) - 25),
    lastReviewedAt: now.toISOString(),
    nextReviewAt
  }
}

export function getDueReviews(wrongBook = [], now = new Date()) {
  return wrongBook
    .filter((item) => !item.nextReviewAt || new Date(item.nextReviewAt).getTime() <= now.getTime())
    .sort((left, right) => new Date(left.nextReviewAt || 0) - new Date(right.nextReviewAt || 0))
}

function aggregate(history, field) {
  const stats = new Map()
  for (const entry of history) {
    const key = entry[field] || 'unknown'
    const current = stats.get(key) || { key, attempts: 0, correct: 0, accuracy: 0 }
    current.attempts += 1
    if (entry.isCorrect) current.correct += 1
    current.accuracy = Math.round((current.correct / current.attempts) * 100)
    stats.set(key, current)
  }
  return [...stats.values()].sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
}

export function buildWeaknessAnalysis(history = []) {
  const categories = aggregate(history, 'category')
  const difficulties = aggregate(history, 'difficulty')
  const weakest = categories.find((item) => item.attempts >= 3) || categories[0] || null
  return {
    categories,
    difficulties,
    recommendation: weakest ? {
      category: weakest.key,
      reason: `${weakest.attempts} 次作答，正確率 ${weakest.accuracy}%`,
      suggestedCount: Math.min(20, Math.max(10, weakest.attempts * 2))
    } : null
  }
}

export function calculateStudyStreak(dailyRecords = [], now = new Date()) {
  const activeDates = new Set(dailyRecords.filter((record) => (record.questionsAnswered || 0) + (record.studyMinutes || 0) > 0).map((record) => record.date))
  let cursor = new Date(`${toDateKey(now)}T00:00:00.000Z`)
  if (!activeDates.has(toDateKey(cursor))) cursor = addDays(cursor, -1)
  let streak = 0
  while (activeDates.has(toDateKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function buildLearningTrends(dailyRecords = [], days = 7, now = new Date()) {
  const byDate = new Map(dailyRecords.map((record) => [record.date, record]))
  return Array.from({ length: days }, (_, offset) => {
    const date = toDateKey(addDays(now, offset - days + 1))
    const record = byDate.get(date) || {}
    const answered = record.questionsAnswered || 0
    const correct = record.correctAnswers || 0
    return {
      date,
      questionsAnswered: answered,
      studyMinutes: record.studyMinutes || 0,
      accuracy: answered ? Math.round((correct / answered) * 100) : null
    }
  })
}

export function estimateUnofficialScoreRange(history = []) {
  if (history.length < 50) return null
  const accuracy = history.filter((entry) => entry.isCorrect).length / history.length
  const midpoint = Math.round((10 + accuracy * 980) / 10) * 10
  return {
    min: Math.max(10, midpoint - 80),
    max: Math.min(990, midpoint + 80),
    label: '非官方區間估計',
    sampleSize: history.length
  }
}
