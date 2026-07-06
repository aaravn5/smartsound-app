import { useEffect, useRef } from 'react'
import { css } from 'styled-system/css'
import { STATE_BAND, BAND_TINT, type BandKey } from '~/components/vinyl/RecordDisc'
import type { TargetState } from '~/engine/audio/types'

/**
 * BandField — the player's generative background: a very dark Deep Space
 * base with a slow particle drift in the record's band tint. Density and
 * speed are paced by the band (Delta slowest/dimmest → Beta fastest/
 * brightest) — the motion system itself demonstrates the taxonomy.
 *
 * Cheap by construction: ≤64 points in preallocated Float32Arrays, one 2D
 * canvas redrawn at ~30fps (frames are skipped, not re-timed), zero
 * per-frame allocations, paused entirely while the tab is hidden.
 * prefers-reduced-motion: a single static draw.
 */

interface FieldParams {
  count: number
  /** Drift speed in px/s at 1× scale. */
  speed: number
  alpha: number
}

const FIELD: Record<BandKey, FieldParams> = {
  beta: { count: 64, speed: 26, alpha: 0.5 },
  alpha: { count: 48, speed: 15, alpha: 0.4 },
  theta: { count: 36, speed: 8, alpha: 0.32 },
  delta: { count: 24, speed: 4, alpha: 0.24 },
}

const MAX_POINTS = 64

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function BandField({ state }: { state: TargetState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0
    let H = 0
    let dpr = 1
    let raf = 0
    let disposed = false
    let lastDraw = 0
    let lastT = 0

    const x = new Float32Array(MAX_POINTS)
    const y = new Float32Array(MAX_POINTS)
    const drift = new Float32Array(MAX_POINTS) // per-point speed multiplier
    const size = new Float32Array(MAX_POINTS)
    const tw = new Float32Array(MAX_POINTS)

    let seed = 41
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    for (let i = 0; i < MAX_POINTS; i++) {
      x[i] = rand()
      y[i] = rand()
      drift[i] = 0.5 + rand()
      size[i] = 0.8 + rand() * 1.6
      tw[i] = rand() * Math.PI * 2
    }

    // Tint glides between bands rather than snapping.
    let [tr, tg, tb] = hexToRgb(BAND_TINT[STATE_BAND[stateRef.current]])

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      W = Math.max(1, Math.round(rect.width))
      H = Math.max(1, Math.round(rect.height))
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
    }

    const draw = (t: number, dtMs: number) => {
      const band = STATE_BAND[stateRef.current]
      const prm = FIELD[band]
      const [ttr, ttg, ttb] = hexToRgb(BAND_TINT[band])
      const mix = Math.min(1, dtMs * 0.003)
      tr += (ttr - tr) * mix
      tg += (ttg - tg) * mix
      tb += (ttb - tb) * mix

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = `rgb(${tr | 0}, ${tg | 0}, ${tb | 0})`
      const dy = (prm.speed * dtMs) / 1000 / Math.max(1, H)
      for (let i = 0; i < prm.count; i++) {
        y[i] -= dy * drift[i]
        x[i] += dy * 0.18 * (drift[i] - 0.9)
        if (y[i] < -0.03) {
          y[i] += 1.06
          x[i] = (x[i] + 0.31) % 1
        }
        if (x[i] < -0.02) x[i] += 1.04
        else if (x[i] > 1.02) x[i] -= 1.04
        const twinkle = 0.55 + 0.45 * Math.sin(tw[i] + (t / 1000) * 0.9)
        ctx.globalAlpha = prm.alpha * twinkle
        ctx.beginPath()
        ctx.arc(x[i] * W, y[i] * H, size[i], 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const frame = (t: number) => {
      if (disposed) return
      raf = requestAnimationFrame(frame)
      if (document.hidden) {
        lastT = 0
        return
      }
      // ~30fps is plenty for a drift this slow — skip alternate frames.
      if (t - lastDraw < 31) return
      const dt = Math.min(100, lastT ? t - lastT : 33)
      lastDraw = t
      lastT = t
      draw(t, dt)
    }

    resize()
    const onResize = () => {
      resize()
      if (reduced) draw(0, 16)
    }
    window.addEventListener('resize', onResize)

    if (reduced) {
      draw(0, 16)
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-band-field={STATE_BAND[state]}
      className={css({
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      })}
    />
  )
}
