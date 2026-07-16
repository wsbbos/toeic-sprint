const CATEGORY_LABELS = Object.freeze({
  adjective_adverb: '形容詞與副詞',
  business_collocation: '商務慣用語',
  comparative: '比較級與最高級',
  conjunction: '連接詞',
  gerund: '動名詞',
  infinitive: '不定詞',
  participle: '分詞',
  passive_voice: '主動與被動',
  preposition: '介系詞',
  pronoun: '代名詞',
  relative_clause: '關係詞',
  subject_verb_agreement: '主謂一致',
  verb_tense: '動詞時態',
  vocabulary: '商務字彙',
  word_form: '詞性',
})

const SIGNAL_WORDS = Object.freeze([
  'already', 'yet', 'since', 'for', 'currently', 'now', 'yesterday', 'tomorrow',
  'next', 'last', 'by', 'before', 'after', 'while', 'during', 'until', 'unless',
  'although', 'because', 'despite', 'than', 'most', 'every', 'each', 'to',
])

const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim()

const sentenceMap = (questionText) => {
  const text = normalize(questionText)
  const match = text.match(/^(.*?)\s*(-{3,}|_{3,})\s*(.*)$/)
  if (!match) return { beforeBlank: text, blank: '', afterBlank: '' }
  return {
    beforeBlank: normalize(match[1]),
    blank: match[2],
    afterBlank: normalize(match[3]),
  }
}

const keywordMatches = (questionText) => {
  const text = normalize(questionText)
  return SIGNAL_WORDS.filter((keyword) => new RegExp(`\\b${keyword}\\b`, 'i').test(text))
}

const choiceComparisons = (question, userAnswer, correctAnswer) => Object.entries(question?.choices || {}).map(([key, text]) => {
  let status = 'neutral'
  if (key === correctAnswer) status = 'correct'
  if (key === userAnswer && key !== correctAnswer) status = 'selected-wrong'
  if (key === userAnswer && key === correctAnswer) status = 'selected-correct'
  return { key, text, status }
})

const evidenceCandidates = (question) => {
  const candidates = []
  if (question?.evidence?.quote) {
    candidates.push({ text: question.evidence.quote, label: question.evidence.label || '答案線索', source: '題目標記' })
  }

  for (const highlight of question?.document?.highlights || []) {
    if (typeof highlight === 'string') candidates.push({ text: highlight, label: '答案線索', source: '文件標記' })
    if (highlight && typeof highlight === 'object') {
      const appliesToQuestion = !highlight.questionId && !highlight.questionIds
        || highlight.questionId === question.id
        || highlight.questionIds?.includes(question.id)
      if (appliesToQuestion && (highlight.text || highlight.quote)) {
        candidates.push({
          text: highlight.text || highlight.quote,
          label: highlight.label || '答案線索',
          source: '文件標記',
        })
      }
    }
  }

  const explanation = String(question?.explanation || '')
  const quotePattern = /[「“"]([^」”"]{4,180})[」”"]/g
  for (const match of explanation.matchAll(quotePattern)) {
    candidates.push({ text: match[1], label: '解析引用', source: '文件原文' })
  }
  return candidates
}

const locateEvidence = (question) => {
  const source = normalize(question?.passage)
  for (const candidate of evidenceCandidates(question)) {
    const text = normalize(candidate.text)
    if (text && source.toLocaleLowerCase().includes(text.toLocaleLowerCase())) {
      return { evidence: text, evidenceLabel: candidate.label, evidenceSource: candidate.source }
    }
  }
  return { evidence: '', evidenceLabel: '', evidenceSource: '' }
}

/** @param {{ question?: Record<string, any>, userAnswer?: string, correctAnswer?: string }} [options] */
export function createExplanationModel({ question = {}, userAnswer = '', correctAnswer } = {}) {
  const resolvedCorrectAnswer = correctAnswer || question.correctAnswer || question.answer || ''
  const base = {
    kind: question.part === 7 ? 'part7' : 'part5',
    part: question.part,
    questionId: question.id,
    explanation: question.explanation || '',
    correctAnswer: resolvedCorrectAnswer,
    userAnswer: userAnswer || '',
    isCorrect: Boolean(userAnswer && userAnswer === resolvedCorrectAnswer),
    choices: choiceComparisons(question, userAnswer, resolvedCorrectAnswer),
  }

  if (question.part === 7) return { ...base, ...locateEvidence(question) }

  return {
    ...base,
    sentence: sentenceMap(question.question),
    grammarPoint: CATEGORY_LABELS[question.category] || normalize(question.category).replaceAll('_', ' ') || '句意與用法',
    keywords: keywordMatches(question.question),
    tags: Array.isArray(question.tags) ? question.tags.slice(0, 4) : [],
  }
}

export { CATEGORY_LABELS }
