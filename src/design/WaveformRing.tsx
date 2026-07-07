import { useEffect, useRef } from 'react'
import { css } from 'styled-system/css'
import { STATE_BAND, BAND_TINT } from '~/components/vinyl/RecordDisc'
import { STATE_HZ, RING_LOBES, rippleHz, ringDisplacement } from '~/lib/ring-math'
import type { TargetState } from '~/engine/audio/types'

/**
 * WaveformRing — the hairline Starlight ring around the playing record,
 * radially rippled by a traveling sine at the record's band frequency
 * SCALED (band Hz / 10): Beta ripples at ~1.5 Hz, Delta at ~0.25 Hz. Crests
 * above the median are tinted to the band. Pure geometry lives in
 * lib/ring-math.ts; this component only rasterizes it.
 *
 * prefers-reduced-motion: one static draw at t=0 (a gently displaced ring,
 * not a moving one).
 */

const N_POINTS = 160

export function WaveformRing({
  state,
  size,
  discSize,
  running,
}: {
  state: TargetState
  size: number
  discSize: number
  running: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const liveRef = useRef({ state, running })
  liveRef.current = { state, running }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(size * dpr)
    canvas.height = Math.round(size * dpr)

    let raf = 0
    let disposed = false
    let amp = 3

    const draw = (tSec: number) => {
      const { state: st, running: run } = liveRef.current
      const hz = STATE_HZ[st]
      const tint = BAND_TINT[STATE_BAND[st]]
      const targetAmp = run ? 7 : 3
      amp += (targetAmp - amp) * 0.05
      const r0 = discSize / 2 + Math.max(16, size * 0.055)
      const c = size / 2

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)

      // Pass 1 — the full hairline ring, carbon on the light canvas.
      ctx.strokeStyle = 'rgba(17, 17, 17, 0.22)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i <= N_POINTS; i++) {
        const th = (i / N_POINTS) * Math.PI * 2
        const r = r0 + ringDisplacement(th, tSec, hz, amp)
        const X = c + Math.cos(th) * r
        const Y = c + Math.sin(th) * r
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()

      // Pass 2 — crests above half-amplitude, tinted to the band.
      ctx.strokeStyle = tint
      ctx.globalAlpha = run ? 0.9 : 0.55
      ctx.lineWidth = 1.6
      let inCrest = false
      ctx.beginPath()
      for (let i = 0; i <= N_POINTS; i++) {
        const th = (i / N_POINTS) * Math.PI * 2
        const disp = ringDisplacement(th, tSec, hz, amp)
        const r = r0 + disp
        const X = c + Math.cos(th) * r
        const Y = c + Math.sin(th) * r
        if (disp > amp * 0.5) {
          if (!inCrest) {
            ctx.moveTo(X, Y)
            inCrest = true
          } else {
            ctx.lineTo(X, Y)
          }
        } else {
          inCrest = false
        }
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    const frame = (t: number) => {
      if (disposed) return
      raf = requestAnimationFrame(frame)
      if (document.hidden) return
      draw(t / 1000)
    }

    if (reduced) {
      draw(0)
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
    }
  }, [size, discSize])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-waveform-ring
      data-ripple-hz={rippleHz(STATE_HZ[state])}
      data-ring-lobes={RING_LOBES}
      className={css({ display: 'block', pointerEvents: 'none' })}
      style={{ width: size, height: size }}
    />
  )
}
