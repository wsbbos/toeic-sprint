import '../../styles/visual-system.css'

import { LEARNING_VISUAL_LABELS, LEARNING_VISUAL_VARIANTS } from './visualConfig.js'

function HeroArtwork() {
  return <><path className="visual-paper" d="M44 28h66a8 8 0 0 1 8 8v86a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8V36a8 8 0 0 1 8-8Z" /><path className="visual-line" d="M52 51h45M52 68h34M52 86h25" /><path className="visual-accent-stroke" d="m53 109 14-13 13 7 22-28" /><path className="visual-accent-fill" d="m102 75-10 2 7 7Z" /><circle className="visual-soft-fill" cx="127" cy="47" r="22" /><path className="visual-main-stroke" d="m117 47 7 7 14-17" /></>
}

function PracticeArtwork() {
  return <><rect className="visual-paper" x="38" y="25" width="78" height="104" rx="9" /><path className="visual-line" d="M55 45h44" />{[65, 84, 103].map((y, index) => <g key={y}><circle className={index === 1 ? 'visual-accent-fill' : 'visual-soft-fill'} cx="57" cy={y} r="6" /><path className="visual-line" d={`M70 ${y}h29`} /></g>)}<circle className="visual-paper" cx="119" cy="108" r="25" /><path className="visual-main-stroke" d="M119 94v15l10 6" /><path className="visual-accent-stroke" d="M109 139h20" /></>
}

function ReadingArtwork() {
  return <><path className="visual-paper" d="M29 34h48a12 12 0 0 1 12 12v75H41a12 12 0 0 0-12 12V34Z" /><path className="visual-paper" d="M89 46a12 12 0 0 1 12-12h30v83h-30a12 12 0 0 0-12 12V46Z" /><path className="visual-line" d="M44 54h28M44 71h28M103 54h17M103 71h17" /><circle className="visual-soft-fill" cx="112" cy="105" r="21" /><circle className="visual-main-stroke" cx="108" cy="101" r="12" /><path className="visual-accent-stroke" d="m117 110 11 11" /></>
}

function ResultArtwork() {
  return <><circle className="visual-paper" cx="76" cy="78" r="49" /><path className="visual-soft-fill" d="M76 78V29a49 49 0 0 1 42 24Z" /><path className="visual-accent-fill" d="M76 78 118 53a49 49 0 0 1-9 63Z" /><circle className="visual-paper" cx="76" cy="78" r="25" /><path className="visual-main-stroke" d="m64 78 8 8 17-20" /><path className="visual-line" d="M127 119V92M140 119V77" /><path className="visual-accent-stroke" d="M116 119h31" /></>
}

function ReviewArtwork() {
  return <><rect className="visual-soft-fill" x="50" y="32" width="70" height="87" rx="8" transform="rotate(7 85 76)" /><rect className="visual-paper" x="37" y="28" width="70" height="87" rx="8" /><path className="visual-line" d="M52 48h38M52 65h27M52 82h34" /><path className="visual-accent-stroke" d="M39 127a50 50 0 0 0 83 0" /><path className="visual-accent-fill" d="m122 127-13-3 7 12Z" /></>
}

function FavoritesArtwork() {
  return <><rect className="visual-paper" x="43" y="26" width="76" height="104" rx="9" /><path className="visual-line" d="M58 48h45M58 67h32" /><path className="visual-accent-fill" d="M91 26h18v37l-9-7-9 7Z" /><path className="visual-soft-fill" d="M77 108c-15-9-22-16-22-25 0-12 15-17 22-7 7-10 22-5 22 7 0 9-7 16-22 25Z" /><path className="visual-main-stroke" d="M77 103c-12-8-17-13-17-20 0-7 10-10 17-1 7-9 17-6 17 1 0 7-5 12-17 20Z" /></>
}

function WeaknessArtwork() {
  return <><path className="visual-paper" d="M80 23 133 61l-20 62H47L27 61Z" /><path className="visual-line" d="M80 42 114 66l-13 38H59L46 66ZM80 23v100M27 61h106M47 123l66-62M133 61l-86 62" /><path className="visual-soft-fill" d="m80 48 28 22-14 31-35 4-13-37Z" /><circle className="visual-accent-fill" cx="94" cy="101" r="8" /><path className="visual-accent-stroke" d="m100 95 19-19" /></>
}

function EmptyArtwork() {
  return <><path className="visual-paper" d="M34 92h29l8 12h18l8-12h29l-9 32H43Z" /><path className="visual-line" d="M49 47h62M58 64h44" /><circle className="visual-soft-fill" cx="80" cy="56" r="31" /><path className="visual-main-stroke" d="M80 44v24M68 56h24" /><path className="visual-accent-stroke" d="M44 75h10M106 75h10" /></>
}

const ARTWORK = Object.freeze({
  empty: EmptyArtwork,
  favorites: FavoritesArtwork,
  hero: HeroArtwork,
  practice: PracticeArtwork,
  reading: ReadingArtwork,
  result: ResultArtwork,
  review: ReviewArtwork,
  weakness: WeaknessArtwork,
})

export default function LearningVisual({ variant = 'empty', label, decorative = false, size = 'medium', tone = 'default', className = '' }) {
  const resolvedVariant = LEARNING_VISUAL_VARIANTS.includes(variant) ? variant : 'empty'
  const Artwork = ARTWORK[resolvedVariant]
  const accessibilityProps = decorative
    ? { 'aria-hidden': true, role: 'presentation' }
    : { 'aria-label': label || LEARNING_VISUAL_LABELS[resolvedVariant], role: 'img' }

  return (
    <svg
      {...accessibilityProps}
      className={`learning-visual visual-size-${size} visual-tone-${tone} ${className}`.trim()}
      data-visual={resolvedVariant}
      focusable="false"
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
    >
      {!decorative && <title>{label || LEARNING_VISUAL_LABELS[resolvedVariant]}</title>}
      <circle className="visual-backdrop" cx="80" cy="80" r="70" />
      <Artwork />
    </svg>
  )
}
