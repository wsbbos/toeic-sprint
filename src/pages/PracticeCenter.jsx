import { useState } from 'react'
import LearningVisual from '../components/visuals/LearningVisual.jsx'
import VisualAsset from '../components/visuals/VisualAsset.jsx'
import '../styles/practice.css'
import { part5QuestionBank } from '../data/part5QuestionBank.js'
import { PART5_CATEGORIES } from '../data/part5Schema.js'

const CATEGORY_LABELS = {
  word_form: '詞性', verb_tense: '動詞時態', voice: '主被動', subject_verb_agreement: '主謂一致',
  preposition: '介系詞', conjunction: '連接詞', relative_clause: '關係詞', pronoun: '代名詞',
  comparison: '比較級', participle: '分詞', infinitive: '不定詞', gerund: '動名詞',
  vocabulary: '字彙', business_collocation: '商務慣用語'
}

export default function PracticeCenter({ setCurrentPage, setPracticeFilter }) {
  const [count, setCount] = useState(20)
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [timed, setTimed] = useState(false)

  const start = (config) => {
    setPracticeFilter?.(config)
    setCurrentPage('question-practice')
  }

  const startCustom = () => start({
    type: 'part5',
    mode: 'custom',
    count: Math.min(100, Math.max(5, Number(count) || 20)),
    category,
    difficulty,
    timed,
    durationSeconds: timed ? Math.max(300, Number(count || 20) * 45) : null
  })

  return (
    <main data-testid="practice-center" className="flex flex-col gap-3" aria-labelledby="practice-title">
      <header className="visual-page-header">
        <div><h1 id="practice-title" style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>練習中心</h1>
        <p style={{ color: 'var(--text-sub)' }}>從 300 題 Part 5 題庫建立可恢復的個人練習，或進入 Part 7 閱讀練習。</p></div>
        <VisualAsset name="practice" decorative />
      </header>

      <section className="grid grid-cols-3 gap-3" aria-label="快速練習模式">
        <article className="card">
          <LearningVisual variant="practice" size="icon" decorative />
          <span className="badge badge-review">Quick Practice</span>
          <h2 style={{ margin: '0.8rem 0 0.4rem' }}>快速練習</h2>
          <p style={{ color: 'var(--text-sub)' }}>隨機抽題，適合每日短時間維持手感。</p>
          <div className="flex gap-2" style={{ marginTop: '1rem', flexWrap: 'wrap' }}>
            {[10, 20].map((quickCount) => (
              <button key={quickCount} data-testid={`quick-${quickCount}`} className="btn btn-primary btn-sm" onClick={() => start({ type: 'part5', mode: 'quick', count: quickCount })}>
                {quickCount} 題
              </button>
            ))}
          </div>
        </article>

        <article className="card">
          <LearningVisual variant="result" size="icon" decorative />
          <span className="badge badge-new">Full Simulation</span>
          <h2 style={{ margin: '0.8rem 0 0.4rem' }}>Part 5 完整模擬</h2>
          <p style={{ color: 'var(--text-sub)' }}>100 題、75 分鐘倒數，交卷後一次查看完整解析。</p>
          <button className="btn btn-accent" style={{ marginTop: '1rem', width: '100%' }} onClick={() => start({ type: 'full_mock', mode: 'full_mock', count: 100, timed: true, durationSeconds: 4500 })}>
            開始完整模擬
          </button>
        </article>

        <article className="card">
          <LearningVisual variant="reading" size="icon" decorative />
          <span className="badge badge-mastered">Part 7</span>
          <h2 style={{ margin: '0.8rem 0 0.4rem' }}>閱讀理解</h2>
          <p style={{ color: 'var(--text-sub)' }}>保留既有 Part 7 題庫與文章閱讀流程。</p>
          <button data-testid="start-part7" className="btn btn-outline" style={{ marginTop: '1rem', width: '100%' }} onClick={() => start({ type: 'part7', mode: 'reading', count: 30 })}>
            開始 Part 7
          </button>
        </article>
      </section>

      <section className="card" aria-labelledby="custom-title">
        <h2 id="custom-title">自訂 Part 5 練習</h2>
        <div className="practice-config-grid" style={{ marginTop: '1rem' }}>
          <label>題數
            <input type="number" min="5" max="100" value={count} onChange={(event) => setCount(event.target.value)} />
          </label>
          <label>分類
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">全部分類</option>
              {PART5_CATEGORIES.map((item) => <option key={item} value={item}>{CATEGORY_LABELS[item]}</option>)}
            </select>
          </label>
          <label>難度
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="all">全部難度</option>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </label>
          <label className="practice-checkbox"><input type="checkbox" checked={timed} onChange={(event) => setTimed(event.target.checked)} /> 計時模式</label>
        </div>
        <div className="flex justify-between align-center" style={{ marginTop: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-sub)' }}>可用題目：{part5QuestionBank.length} 題</span>
          <button className="btn btn-primary" onClick={startCustom}>建立練習</button>
        </div>
      </section>
    </main>
  )
}
