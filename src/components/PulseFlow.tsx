import { useEffect, useRef, useState } from 'react'
import { css, cx } from 'styled-system/css'
import { Card } from '~/components/Card'
import { STATE_BAND, BAND_TINT } from '~/components/vinyl/RecordDisc'
import type { CaptureStatus } from '~/engine/biometric/capture'
import type { BiometricReading } from '~/engine/biometric/types'
import type { PulseReading } from '~/design/SignalRing'
import type { TargetState } from '~/engine/audio/types'

/**
 * PulseFlow — "Tune to your pulse", the differentiator, made a first-class
 * affordance (audit 1.5/2.4). A pill near the disc opens the flow: the
 * EXISTING engine Attune pipeline (startAttune/stopAttune/getPulse — engine
 * internals untouched) feeds a live pulse trace that draws itself left →
 * right (1px Starlight polyline, systolic peaks in the band tint), the BPM
 * resolves in mono, and the copy stays honest. A declined or missing camera
 * degrades gracefully — 'Tuned by time of day instead' — and never nags.
 */

/** A PPG-shaped beat: systolic spike + dicrotic bump, from the pulse phase. */
export function pulseShape(phase: number): number {
  const p = phase - Math.floor(phase)
  const g = (c: number, w: number) => Math.exp(-((p - c) * (p - c)) / w)
  return g(0.15, 0.0032) + 0.42 * g(0.4, 0.013)
}

const TRACE_SECONDS = 24
const TRACE_FPS = 30
const TRACE_LEN = TRACE_SECONDS * TRACE_FPS

function statusLine(bioStatus: CaptureStatus): string {
  switch (bioStatus) {
    case 'requesting':
      return 'Requesting camera access…'
    case 'active':
      return 'On-device pulse detection — nothing leaves your device'
    case 'denied':
    case 'nocamera':
    case 'error':
      return 'Tuned by time of day instead — no camera, no problem.'
    default:
      return 'Uses your front camera, on-device only'
  }
}

const pillCss = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  minH: '40px',
  px: '4.5',
  borderRadius: 'pill',
  border: '1px solid transparent',
  font: 'inherit',
  fontSize: 'bodySm',
  fontWeight: '500',
  background: 'rgba(205, 221, 255, 0.16)',
  color: 'starlight',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 300ms ease, border-color 300ms ease',
  _hover: { background: 'rgba(205, 221, 255, 0.24)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
})

export interface PulseFlowProps {
  state: TargetState
  bioStatus: CaptureStatus
  reading: BiometricReading
  getPulse: () => PulseReading | null
  startAttune: () => Promise<CaptureStatus>
  stopAttune: () => void
}

export function PulseFlow({ state, bioStatus, reading, getPulse, startAttune, stopAttune }: PulseFlowProps) {
  const [open, setOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const band = STATE_BAND[state]
  const tint = BAND_TINT[band]

  const toggle = () => {
    setOpen((v) => {
      const next = !v
      if (next) void startAttune()
      else stopAttune()
      return next
    })
  }

  // The live trace — a circular buffer of beat-shaped samples, drawn
  // left→right until the window fills, then scrolling.
  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)

    const buf = new Float32Array(TRACE_LEN)
    let filled = 0
    let raf = 0
    let disposed = false
    let lastSample = 0

    const frame = (t: number) => {
      if (disposed) return
      raf = requestAnimationFrame(frame)
      if (t - lastSample < 1000 / TRACE_FPS) return
      lastSample = t

      const pulse = getPulse()
      const v = pulse ? pulseShape(pulse.phase) : 0
      if (filled < TRACE_LEN) {
        buf[filled++] = v
      } else {
        buf.copyWithin(0, 1)
        buf[TRACE_LEN - 1] = v
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const base = H * 0.78
      const amp = H * 0.62

      // Pass 1 — the 1px Starlight polyline.
      ctx.strokeStyle = 'rgba(237, 237, 243, 0.85)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i < filled; i++) {
        const X = (i / (TRACE_LEN - 1)) * W
        const Y = base - buf[i] * amp
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()

      // Pass 2 — systolic peaks in the band tint.
      ctx.strokeStyle = tint
      ctx.lineWidth = 1.6
      let inPeak = false
      ctx.beginPath()
      for (let i = 0; i < filled; i++) {
        if (buf[i] > 0.55) {
          const X = (i / (TRACE_LEN - 1)) * W
          const Y = base - buf[i] * amp
          if (!inPeak) {
            ctx.moveTo(X, Y)
            inPeak = true
          } else {
            ctx.lineTo(X, Y)
          }
        } else {
          inPeak = false
        }
      }
      ctx.stroke()
    }

    raf = requestAnimationFrame(frame)
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
    }
  }, [open, getPulse, tint])

  const live = reading.active && reading.hr > 0
  const bpm = Math.round(reading.hr)
  const degraded = bioStatus === 'denied' || bioStatus === 'nocamera' || bioStatus === 'error'

  return (
    <div className={css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3', w: 'full' })}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        data-testid="tune-pulse"
        className={cx(pillCss, open ? css({ borderColor: 'lead' }) : undefined)}
      >
        <span
          aria-hidden
          className={css({ w: '6px', h: '6px', borderRadius: 'full', flexShrink: '0' })}
          style={{ background: tint }}
        />
        Tune to your pulse
      </button>

      {open && (
        <Card className={css({ w: 'full', maxW: '430px' })}>
          <div className={css({ px: '4', py: '4' })}>
            {degraded ? (
              <>
                <p
                  data-testid="pulse-degraded"
                  className={css({ m: '0', fontSize: 'bodySm', lineHeight: '1.5', color: 'starlight' })}
                >
                  Tuned by time of day instead — no camera, no problem.
                </p>
                <p className={css({ m: '0', mt: '1.5', fontSize: 'caption', lineHeight: '1.5', color: 'silver' })}>
                  When you do allow it: frames are analyzed right here on your device and never
                  uploaded — the camera stays on your device.
                </p>
              </>
            ) : (
              <>
                <canvas
                  ref={canvasRef}
                  data-testid="pulse-trace"
                  aria-label="Live pulse trace"
                  role="img"
                  className={css({ display: 'block', w: 'full', h: '64px' })}
                />
                <div className={css({ display: 'flex', alignItems: 'baseline', gap: '3', mt: '3' })}>
                  <span
                    className={cx(
                      'tabular',
                      css({ fontSize: 'headingSm', color: 'starlight', minW: '84px' }),
                    )}
                    data-testid="pulse-bpm"
                  >
                    {live ? `${bpm} BPM` : '— BPM'}
                  </span>
                  <span className={css({ fontSize: 'caption', color: 'silver' })}>{statusLine(bioStatus)}</span>
                </div>
                {live && (
                  <p className={css({ m: '0', mt: '2', fontSize: 'bodySm', lineHeight: '1.5', color: 'silver' })}>
                    Pressed for you — tempo matched to {bpm} BPM. Nothing left your device.
                  </p>
                )}
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
