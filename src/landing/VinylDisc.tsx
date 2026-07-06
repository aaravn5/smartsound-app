import { css } from 'styled-system/css'

/**
 * VinylDisc — a pure-CSS pressed record. Grooves are a repeating radial
 * gradient over a near-black platter, the specular is a pair of opposing
 * conic wedges (the "light across the grooves" sheen), and the CENTER LABEL
 * is one of SmartSound's five landscape photographs in a circular mask —
 * crisp, no blur, one DISTINCT landscape per mode. A tiny spindle hole
 * finishes it. Entirely static markup: spinning is the parent's job
 * (`.vinyl-spin` / carousel transforms), so one disc costs nothing.
 */

export interface VinylDiscProps {
  /** The label artwork — a /scenes/*.webp landscape. */
  labelSrc: string
  size: number
  /** Label diameter as a fraction of the disc (default 0.38). */
  labelRatio?: number
}

const discCss = css({
  position: 'relative',
  borderRadius: 'full',
  flexShrink: '0',
  // Platter: subtle vinyl sheen gradient under the grooves.
  background:
    'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.055) 0px, rgba(255,255,255,0.0) 1px, rgba(0,0,0,0.14) 2px, rgba(255,255,255,0.0) 3px), radial-gradient(circle at 38% 32%, #1c1c24 0%, #101016 42%, #0b0b10 68%, #131318 88%, #060609 100%)',
  boxShadow:
    'inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 0 22px rgba(0,0,0,0.75), 0 18px 44px rgba(2, 4, 12, 0.55), 0 4px 14px rgba(2, 4, 12, 0.4)',
})

const sheenCss = css({
  position: 'absolute',
  inset: '0',
  borderRadius: 'full',
  pointerEvents: 'none',
  mixBlendMode: 'screen',
  background:
    'conic-gradient(from 218deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.13) 16deg, rgba(255,255,255,0.02) 40deg, transparent 70deg, transparent 176deg, rgba(255,255,255,0.09) 196deg, rgba(255,255,255,0.015) 222deg, transparent 250deg)',
})

const runoutCss = css({
  position: 'absolute',
  borderRadius: 'full',
  pointerEvents: 'none',
  border: '1px solid rgba(255,255,255,0.05)',
})

const labelCss = css({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  borderRadius: 'full',
  overflow: 'hidden',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22), 0 0 10px rgba(0,0,0,0.5)',
  // A dark base so the label never flashes light while its photo loads.
  background: 'rgba(10, 14, 28, 1)',
})

const labelImgCss = css({
  position: 'absolute',
  left: '0',
  top: '0',
  width: '100%',
  height: '100%',
  maxWidth: 'none',
  objectFit: 'cover',
  pointerEvents: 'none',
})

const holeCss = css({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  borderRadius: 'full',
  background: '#05050a',
  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.25)',
})

export function VinylDisc({ labelSrc, size, labelRatio = 0.38 }: VinylDiscProps) {
  const label = Math.round(size * labelRatio)
  const hole = Math.max(5, Math.round(size * 0.035))
  return (
    <span aria-hidden className={discCss} style={{ display: 'block', width: size, height: size }}>
      <span className={sheenCss} />
      {/* Run-out grooves — two faint rings between label and lead-out. */}
      <span className={runoutCss} style={{ inset: Math.round(size * 0.05) }} />
      <span className={runoutCss} style={{ inset: Math.round(size * 0.24) }} />
      <span className={labelCss} style={{ width: label, height: label }}>
        <img aria-hidden alt="" draggable={false} loading="eager" decoding="async" src={labelSrc} className={labelImgCss} />
      </span>
      <span className={holeCss} style={{ width: hole, height: hole }} />
    </span>
  )
}
