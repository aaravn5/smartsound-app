import { useEffect, useState } from 'react'
import { css } from 'styled-system/css'
import { stack, hstack, flex } from 'styled-system/patterns'
import { useEngine } from '~/lib/engine-context'
import { recordCheckIn, type LoadRating } from '~/lib/calibration'
import { Button } from '~/components/ui/Button'

/**
 * NASA-TLX-lite check-in (§3, §9.2). Appears once a little into a running
 * session, asks a single two-tap question about perceived load, and feeds the
 * loop's calibration. Real input, real effect — never a fake prompt.
 */
const APPEAR_AFTER_MS = 25_000

const OPTIONS: { rating: LoadRating; label: string }[] = [
  { rating: 'light', label: 'Too easy' },
  { rating: 'right', label: 'Just right' },
  { rating: 'hard', label: 'Too hard' },
]

export function TlxCheckIn() {
  const { status, profile } = useEngine()
  const [visible, setVisible] = useState(false)
  const [answeredSession, setAnsweredSession] = useState(false)

  useEffect(() => {
    if (status !== 'running') {
      setVisible(false)
      setAnsweredSession(false)
      return
    }
    if (answeredSession) return
    const id = setTimeout(() => setVisible(true), APPEAR_AFTER_MS)
    return () => clearTimeout(id)
  }, [status, answeredSession])

  if (!visible) return null

  const answer = (rating: LoadRating) => {
    recordCheckIn(profile.key, rating)
    setVisible(false)
    setAnsweredSession(true)
  }

  return (
    <div
      className={css({
        position: 'fixed',
        left: '50%',
        bottom: '92px',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: 'min(420px, 92vw)',
      })}
    >
      <div className={stack({ gap: '3', p: '5', bg: 'panel', border: '1px solid token(colors.hairline)', rounded: '2xl', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' })}>
        <div className={flex({ justify: 'space-between', align: 'baseline' })}>
          <span className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'md' })}>How did that stretch feel?</span>
          <button onClick={() => { setVisible(false); setAnsweredSession(true) }} className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', cursor: 'pointer', bg: 'transparent' })}>
            skip
          </button>
        </div>
        <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.45' })}>
          A two-tap check so SmartSound learns your {profile.label.toLowerCase()} — not an average.
        </p>
        <div className={hstack({ gap: '2' })}>
          {OPTIONS.map((o) => (
            <Button key={o.rating} variant="outline" size="sm" onClick={() => answer(o.rating)} className={css({ flex: 1 })}>
              {o.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
