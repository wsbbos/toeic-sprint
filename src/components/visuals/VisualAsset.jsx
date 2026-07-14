import { useState } from 'react'
import { getVisualAsset } from '../../assets/visuals/manifest.js'
import LearningVisual from './LearningVisual.jsx'
import '../../styles/visual-assets.css'

export default function VisualAsset({ name = 'empty', alt, priority, decorative = false, className = '', sizes = '(max-width: 640px) 180px, 280px' }) {
  const asset = getVisualAsset(name)
  const isPriority = priority ?? Boolean(asset.priority)
  const [state, setState] = useState('loading')

  if (state === 'error') {
    return (
      <span className={`visual-asset-shell is-error ${className}`.trim()} data-asset-state="error" data-testid="visual-asset" data-visual={asset.fallbackVariant}>
        <LearningVisual variant={asset.fallbackVariant} size="medium" decorative={decorative} label={alt || asset.alt} />
      </span>
    )
  }

  return (
    <span
      className={`visual-asset-shell is-${state} ${className}`.trim()}
      data-asset-state={state}
      data-testid="visual-asset"
      data-visual={asset.fallbackVariant}
      style={{ aspectRatio: `${asset.width} / ${asset.height}` }}
    >
      <span className="visual-asset-placeholder" aria-hidden="true" />
      <img
        alt={decorative ? '' : (alt || asset.alt)}
        aria-hidden={decorative || undefined}
        decoding="async"
        draggable="false"
        fetchPriority={isPriority ? 'high' : 'auto'}
        height={asset.height}
        loading={isPriority ? 'eager' : 'lazy'}
        onError={() => setState('error')}
        onLoad={() => setState('loaded')}
        sizes={sizes}
        src={asset.src}
        width={asset.width}
      />
    </span>
  )
}
