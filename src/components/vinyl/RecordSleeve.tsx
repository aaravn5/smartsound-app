import type { ReactNode } from 'react'
import { css, cx } from 'styled-system/css'
import { VARIANT_IMAGE } from '~/design/Scene'
import { STATE_SCENE } from '~/components/SessionCard'
import { RecordDisc, STATE_BAND, type BandKey } from '~/components/vinyl/RecordDisc'
import type { TargetState } from '~/engine/audio/types'

/**
 * RecordSleeve — a square, 4px-radius Midnight Slate jacket holding a
 * band-tinted print of the mode's scene photo (same tint technique as the
 * disc label: desaturated photo + band color-blend overlay). Fraunces title,
 * mono caps metadata ('BETA · ~15 HZ · 25 MIN'). On hover the jacket
 * brightens to Graphite and the record peeks 8px out of the jacket edge —
 * elevation as light and motion, never shadow.
 */

// Static band→class map (Panda: no dynamic values in css()).
const tintLayer: Record<BandKey, string> = {
  beta: css({ background: '#5872e6', mixBlendMode: 'color' }),
  alpha: css({ background: '#5fb8c9', mixBlendMode: 'color' }),
  theta: css({ background: '#b78fd6', mixBlendMode: 'color' }),
  delta: css({ background: '#4a5a8a', mixBlendMode: 'color' }),
}

const shellCss = css({
  display: 'block',
  width: '100%',
  p: '0',
  m: '0',
  border: 'none',
  background: 'transparent',
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  scrollSnapAlign: 'start',
  _hover: {
    '& [data-part=jacket]': { background: 'graphite' },
    '& [data-part=disc]': { transform: 'translate(8px, -50%)' },
  },
  _focusVisible: { outline: '2px solid token(colors.ghostBlue)', outlineOffset: '3px', borderRadius: '4px' },
})

const jacketZoneCss = css({
  position: 'relative',
  display: 'block',
  width: '100%',
  aspectRatio: '1',
})

const discWrapCss = css({
  position: 'absolute',
  top: '50%',
  right: '0',
  zIndex: '0',
  transform: 'translate(0, -50%)',
  transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
})

const jacketCss = css({
  position: 'absolute',
  inset: '0',
  zIndex: '1',
  borderRadius: '4px',
  background: 'midnightSlate',
  boxShadow: 'inset 0 0 0 1px token(colors.hairline)',
  transition: 'background 300ms cubic-bezier(0.16, 1, 0.3, 1)',
  overflow: 'hidden',
  p: '10px',
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
})

const artCss = css({
  position: 'relative',
  display: 'block',
  width: '100%',
  height: '100%',
  borderRadius: '2px',
  overflow: 'hidden',
  background: '#101018',
})

const artImgCss = css({
  position: 'absolute',
  left: '0',
  top: '0',
  width: '100%',
  height: '100%',
  maxWidth: 'none',
  objectFit: 'cover',
  pointerEvents: 'none',
  filter: 'saturate(0.35) brightness(0.8)',
})

const overlayCss = css({ position: 'absolute', inset: '0', pointerEvents: 'none' })

// Sleeve titles sit at ~16px — below the serif's display floor, so they wear
// Hanken 600 (crisp); the serif carries the featured/player record titles.
const titleCss = css({
  m: '0',
  mt: '2.5',
  fontWeight: '600',
  fontSize: '1rem',
  lineHeight: '1.3',
  letterSpacing: '-0.01em',
  color: 'starlight',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

const metaCss = css({
  m: '0',
  mt: '1',
  fontFamily: 'mono',
  fontSize: '0.6875rem',
  letterSpacing: '0.06em',
  lineHeight: '1.5',
  color: 'silver',
})

/** Tiny etched waveform — one row of the band's frequency, Lead hairline. */
export function BandWaveform({ state, width = 72, height = 14 }: { state: TargetState; width?: number; height?: number }) {
  const band = STATE_BAND[state]
  const cycles: Record<BandKey, number> = { beta: 8, alpha: 5.5, theta: 3.5, delta: 2 }
  const n = cycles[band]
  const mid = height / 2
  const amp = height * 0.34
  const steps = 64
  let d = `M 0 ${mid.toFixed(1)}`
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * width
    const y = mid - Math.sin((i / steps) * Math.PI * 2 * n) * amp
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return (
    <svg aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={css({ display: 'block', mt: '1.5' })}>
      <path d={d} fill="none" stroke="rgba(112, 112, 125, 0.55)" strokeWidth="1" />
    </svg>
  )
}

export interface RecordSleeveProps {
  state: TargetState
  title: string
  /** Mono caps metadata — e.g. 'BETA · ~15 HZ · 25 MIN'. */
  meta: string
  onClick: () => void
  /** Etched band-frequency waveform under the metadata (The Library). */
  waveform?: boolean
  /** Extra footer content — e.g. the Wind-down duration selector. */
  children?: ReactNode
  className?: string
}

export function RecordSleeve({ state, title, meta, onClick, waveform, children, className }: RecordSleeveProps) {
  return (
    <div className={className}>
      <button type="button" onClick={onClick} className={shellCss} aria-label={`${title} — ${meta}`}>
        <span className={jacketZoneCss}>
          {/* The record behind the jacket — peeks out 8px on hover. */}
          <span data-part="disc" className={discWrapCss}>
            <RecordDisc state={state} size={120} spinning="none" />
          </span>
          <span data-part="jacket" className={jacketCss}>
            <span className={artCss}>
              <img
                aria-hidden
                alt=""
                draggable={false}
                loading="lazy"
                decoding="async"
                src={VARIANT_IMAGE[STATE_SCENE[state]]}
                className={artImgCss}
              />
              <span className={cx(overlayCss, tintLayer[STATE_BAND[state]])} style={{ opacity: 0.8 }} />
              <span
                className={overlayCss}
                style={{ background: 'rgba(16, 16, 24, 0.24)', mixBlendMode: 'multiply' }}
              />
            </span>
          </span>
        </span>
        <span className={css({ display: 'block' })}>
          <span className={cx(titleCss, css({ display: 'block' }))}>{title}</span>
          <span className={cx('tabular', metaCss, css({ display: 'block' }))}>{meta}</span>
          {waveform && <BandWaveform state={state} />}
        </span>
      </button>
      {children}
    </div>
  )
}
