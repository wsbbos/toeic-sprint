import LearningVisual from './visuals/LearningVisual.jsx'
import {
  buildLearningTrends,
  buildWeaknessAnalysis,
  estimateUnofficialScoreRange,
  getDueReviews
} from '../services/learningInsightsService.js'

export default function LearningInsightsPanel({ currentUser, setCurrentPage, setPracticeFilter, onStartRetakeSession }) {
  const history = currentUser?.practiceHistory || []
  const dueReviews = getDueReviews(currentUser?.wrongBook || [])
  const weakness = buildWeaknessAnalysis(history)
  const trends = buildLearningTrends(currentUser?.dailyRecords || [])
  const estimate = estimateUnofficialScoreRange(history)
  const favorites = currentUser?.favorites || []

  const startRecommendation = () => {
    if (!weakness.recommendation) return
    setPracticeFilter({ type: 'part5', mode: 'recommended', category: weakness.recommendation.category, difficulty: 'all', count: weakness.recommendation.suggestedCount })
    setCurrentPage('question-practice')
  }

  return (
    <section className="card learning-insights" aria-labelledby="insights-title">
      <div className="flex justify-between align-center gap-2" style={{ flexWrap: 'wrap' }}>
        <div><span className="badge badge-review">Personal Learning</span><h2 id="insights-title" style={{ marginTop: '.5rem' }}>個人化學習建議</h2></div>
        {estimate && <span className="badge badge-new">{estimate.label}：{estimate.min}–{estimate.max}</span>}
      </div>
      <div className="grid grid-cols-3 gap-3" style={{ marginTop: '1rem' }}>
        <article><LearningVisual className="insight-visual" variant="review" size="icon" decorative /><strong>{dueReviews.length}</strong><span>今日到期複習</span><button className="btn btn-outline btn-sm" disabled={!dueReviews.length} onClick={() => onStartRetakeSession(dueReviews)}>開始複習</button></article>
        <article><LearningVisual className="insight-visual" variant="favorites" size="icon" decorative /><strong>{favorites.length}</strong><span>收藏題目</span><button className="btn btn-outline btn-sm" disabled={!favorites.length} onClick={() => setCurrentPage('practice-center')}>查看練習</button></article>
        <article><LearningVisual className="insight-visual" variant="weakness" size="icon" decorative /><strong>{weakness.recommendation?.category?.replaceAll('_', ' ') || '累積資料中'}</strong><span>{weakness.recommendation?.reason || '至少完成 3 題後提供建議'}</span><button className="btn btn-primary btn-sm" disabled={!weakness.recommendation} onClick={startRecommendation}>推薦練習</button></article>
      </div>
      <div className="trend-strip" aria-label="最近七日學習趨勢">{trends.map((day) => <div key={day.date} title={`${day.date}: ${day.questionsAnswered} 題`}><span style={{ height: `${Math.max(4, Math.min(60, day.questionsAnswered * 3))}px` }} /><small>{day.date.slice(5)}</small></div>)}</div>
      {estimate && <p className="estimate-disclaimer">此區間由站內練習樣本推估，非 ETS 官方成績預測，不能取代正式模擬測驗。</p>}
    </section>
  )
}
