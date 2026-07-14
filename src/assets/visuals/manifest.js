const VISUAL_ROOT = '/assets/visuals'

export const VISUAL_ASSET_NAMES = Object.freeze([
  'hero',
  'practice',
  'result',
  'review',
  'favorites',
  'weakness',
  'empty',
])

export const VISUAL_ASSETS = Object.freeze({
  hero: { src: `${VISUAL_ROOT}/learning-hero.svg`, width: 320, height: 240, alt: 'TOEIC Sprint 學習進度插圖', fallbackVariant: 'hero', priority: true },
  practice: { src: `${VISUAL_ROOT}/practice-documents.svg`, width: 320, height: 240, alt: '商務文件閱讀與題目練習', fallbackVariant: 'practice' },
  result: { src: `${VISUAL_ROOT}/result-progress.svg`, width: 320, height: 240, alt: 'TOEIC 練習成果與進度', fallbackVariant: 'result' },
  review: { src: `${VISUAL_ROOT}/review-empty.svg`, width: 320, height: 240, alt: '錯題複習卡片', fallbackVariant: 'review' },
  favorites: { src: `${VISUAL_ROOT}/favorites-bookmark.svg`, width: 320, height: 240, alt: '收藏題目書籤', fallbackVariant: 'favorites' },
  weakness: { src: `${VISUAL_ROOT}/weakness-insights.svg`, width: 320, height: 240, alt: '弱點分析雷達圖', fallbackVariant: 'weakness' },
  empty: { src: `${VISUAL_ROOT}/empty-study.svg`, width: 320, height: 240, alt: '尚無學習資料', fallbackVariant: 'empty' },
})

export function getVisualAsset(name) {
  return VISUAL_ASSETS[name] || VISUAL_ASSETS.empty
}
