import { useId } from 'react'
import { css, cx } from 'styled-system/css'
import { VARIANT_IMAGE } from '~/design/Scene'
import { STATE_SCENE } from '~/components/SessionCard'
import { BAND_LABEL } from '~/lib/catalog'
import type { TargetState } from '~/engine/audio/types'

/**
 * RecordDisc — the pressed record of the "Pressed at Night" world.
 *
 * Near-black (#101018) platter, concentric Lead grooves at 10–20% opacity,
 * a circular-masked, band-tinted label cut from the mode's scene photograph,
 * and the band + frequency etched around the label as circular mono caps
 * (SVG textPath). Idle spin 10s/rev, playing ~1.8s/rev, static under
 * reduced motion (see .record-spin-* in index.css).
 *
 * Band-tint technique: the label photo is desaturated/darkened via CSS
 * filter (saturate .35, brightness .8), then a solid band-tint layer sits
 * over it with `mix-blend-mode: color` — the photo keeps its luminance
 * structure while its hue collapses to the band. A faint multiply pass
 * deepens it toward the vinyl black. Photography therefore appears ONLY
 * inside the label, already tinted toward the band.
 */

export type BandKey = 'beta' | 'alpha' | 'theta' | 'delta'

/** State → band, read off the catalog's BAND_LABEL (focus→Beta, flow→Alpha–Beta
 * (tinted Alpha), calm→Alpha, winddown→Theta, sleep→Delta). */
export const STATE_BAND: Record<TargetState, BandKey> = {
  focus: 'beta',
  flow: 'alpha',
  calm: 'alpha',
  winddown: 'theta',
  sleep: 'delta',
}

export const BAND_TINT: Record<BandKey, string> = {
  beta: '#6f7ff0',
  alpha: '#5fb8c9',
  theta: '#b78fd6',
  delta: '#4a5a8a',
}

/** Etched circular caption — 'BETA · ~15 HZ'. */
export function capText(state: TargetState): string {
  return BAND_LABEL[state].toUpperCase()
}

// Panda gotcha: dynamic values don't compile — band tints live in a static
// band→class map, one literal css() per band.
const tintLayer: Record<BandKey, string> = {
  beta: css({ background: '#6f7ff0', mixBlendMode: 'color' }),
  alpha: css({ background: '#5fb8c9', mixBlendMode: 'color' }),
  theta: css({ background: '#b78fd6', mixBlendMode: 'color' }),
  delta: css({ background: '#4a5a8a', mixBlendMode: 'color' }),
}

const platterCss = css({
  position: 'relative',
  display: 'block',
  borderRadius: 'full',
  flexShrink: '0',
  // Near-black platter with concentric Lead grooves (10–20% opacity) —
  // elevation is light, not shadow: only an inset rim line, no drop shadow.
  background:
    'repeating-radial-gradient(circle at 50% 50%, rgba(112, 112, 125, 0.16) 0px, rgba(112, 112, 125, 0.16) 1px, rgba(16, 16, 24, 0) 1px, rgba(16, 16, 24, 0) 3px), radial-gradient(circle at 42% 36%, #16161f 0%, #101018 55%, #0c0c13 100%)',
  boxShadow: 'inset 0 0 0 1px rgba(112, 112, 125, 0.30)',
})

const runoutCss = css({
  position: 'absolute',
  borderRadius: 'full',
  pointerEvents: 'none',
  border: '1px solid rgba(112, 112, 125, 0.20)',
})

const labelCss = css({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  borderRadius: 'full',
  overflow: 'hidden',
  background: '#101018',
  boxShadow: 'inset 0 0 0 1px rgba(112, 112, 125, 0.35)',
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
  // Desaturate + dim so the band tint above owns the hue.
  filter: 'saturate(0.35) brightness(0.8)',
})

const overlayCss = css({ position: 'absolute', inset: '0', pointerEvents: 'none' })

const holeCss = css({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  borderRadius: 'full',
  background: '#0a0a10',
  boxShadow: '0 0 0 1px rgba(112, 112, 125, 0.45)',
})

const initialCss = css({
  position: 'absolute',
  inset: '0',
  display: 'grid',
  placeItems: 'center',
  fontFamily: 'display',
  fontWeight: '400',
  color: 'starlight',
  background: 'graphite',
})

export interface RecordDiscProps {
  state: TargetState
  size: number
  /** 'idle' 10s/rev · 'playing' 1.8s/rev · 'none' static. */
  spinning?: 'idle' | 'playing' | 'none'
  /** When set, the label carries this initial instead of scene art (Profile avatar). */
  initial?: string
  className?: string
}

export function RecordDisc({ state, size, spinning = 'idle', initial, className }: RecordDiscProps) {
  const uid = useId()
  const band = STATE_BAND[state]
  const label = Math.round(size * 0.44)
  const hole = Math.max(4, Math.round(size * 0.03))
  const spinClass =
    spinning === 'playing' ? 'record-spin-playing' : spinning === 'idle' ? 'record-spin-idle' : undefined

  // Etched circular caption path — a ring just outside the label edge.
  const half = size / 2
  const textR = label / 2 + Math.max(7, size * 0.045)
  const pathId = `rec-cap-${uid.replace(/[^a-zA-Z0-9_-]/g, '')}`

  return (
    <span
      aria-hidden
      className={cx(platterCss, spinClass, className)}
      style={{ width: size, height: size }}
    >
      {/* Run-out rings between label and lead-out. */}
      <span className={runoutCss} style={{ inset: Math.round(size * 0.055) }} />
      <span className={runoutCss} style={{ inset: Math.round(size * 0.16) }} />

      {/* The label — band-tinted scene art (or an initial) in a circular mask. */}
      <span className={labelCss} style={{ width: label, height: label }}>
        {initial ? (
          <span className={initialCss} style={{ fontSize: Math.round(label * 0.5) }}>
            {initial}
          </span>
        ) : (
          <>
            <img
              aria-hidden
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              src={VARIANT_IMAGE[STATE_SCENE[state]]}
              className={labelImgCss}
            />
            <span className={cx(overlayCss, tintLayer[band])} style={{ opacity: 0.8 }} />
            <span
              className={overlayCss}
              style={{ background: 'rgba(16, 16, 24, 0.28)', mixBlendMode: 'multiply' }}
            />
          </>
        )}
      </span>

      {/* Etched circular mono caps — 'BETA · ~15 HZ' around the label. */}
      {!initial && size >= 96 && (
        <svg
          className={css({ position: 'absolute', inset: '0', pointerEvents: 'none' })}
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
        >
          <defs>
            <path
              id={pathId}
              d={`M ${half} ${half - textR} a ${textR} ${textR} 0 1 1 -0.01 0`}
              fill="none"
            />
          </defs>
          <text
            fill="rgba(237, 237, 243, 0.52)"
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: Math.max(7, Math.round(size * 0.035)),
              letterSpacing: '0.22em',
            }}
          >
            <textPath href={`#${pathId}`} startOffset="2%">
              {capText(state)}
            </textPath>
          </text>
        </svg>
      )}

      <span className={holeCss} style={{ width: hole, height: hole }} />
    </span>
  )
}
