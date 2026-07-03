import { css } from 'styled-system/css'
import { stack, flex } from 'styled-system/patterns'

/**
 * HeartRateReadout — the HR number below the ring (Part 5.A). Large tabular
 * figure + `bpm` + a trend arrow, low-opacity and letter-spaced, Oura-style
 * restraint with no dashboard chrome. Purely presentational; the screen feeds it
 * live values from the engine.
 */
export interface HeartRateReadoutProps {
  bpm: number | null
  active: boolean
  trend?: 'up' | 'down' | 'steady'
  /** Optional caption under the number, e.g. confidence or "camera off". */
  caption?: string
}

const arrow = { up: '↑', down: '↓', steady: '·' } as const

export function HeartRateReadout({ bpm, active, trend = 'steady', caption }: HeartRateReadoutProps) {
  return (
    <div className={stack({ gap: '1', align: 'center' })} role="status" aria-live="polite">
      <div className={flex({ gap: '2', align: 'baseline', justify: 'center' })}>
        <span
          className={`tabular ${css({
            fontFamily: 'display',
            fontWeight: '300',
            fontSize: '5xl',
            lineHeight: '1',
            color: 'text',
            letterSpacing: '0.01em',
          })}`}
        >
          {active && bpm != null ? Math.round(bpm) : '—'}
        </span>
        <span className={css({ fontFamily: 'mono', fontSize: 'sm', color: 'muted', letterSpacing: '0.14em' })}>bpm</span>
        {active && (
          <span
            aria-hidden
            className={css({ fontFamily: 'display', fontSize: 'lg', color: 'muted', width: '1ch', textAlign: 'center' })}
          >
            {arrow[trend]}
          </span>
        )}
      </div>
      <span
        className={css({
          fontFamily: 'mono',
          fontSize: '2xs',
          color: 'muted',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          opacity: '0.75',
        })}
      >
        {caption ?? (active ? 'live pulse' : 'camera off')}
      </span>
    </div>
  )
}
