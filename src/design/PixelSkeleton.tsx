import { useEffect, useRef } from 'react'
import { css, cx } from 'styled-system/css'
import { drawPixelAssemble, pointsForRect } from './pixel'
import { prefersReducedMotion } from './signal'

export interface PixelSkeletonProps {
  /** Mono caption under the pixel field, e.g. "No matches yet". */
  label: string
  height?: number
  className?: string
}

/**
 * A pixel-style empty/loading placeholder (§1.3, §10) — a scatter of 4px
 * squares that settles partway and holds, never fully assembling (there is
 * nothing to resolve into yet). Used in place of a spinner wherever the app
 * has no data rather than an error: real material, not a generic loader.
 */
export function PixelSkeleton({ label, height = 84, className }: PixelSkeletonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = canvas?.parentElement
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = Math.max(1, Math.round(wrap.clientWidth))
    const h = height
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const points = pointsForRect(w, h, 4)
    const reduced = prefersReducedMotion()
    const start = performance.now()
    let raf = 0

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 700)
      ctx.clearRect(0, 0, w, h)
      drawPixelAssemble({
        ctx,
        points,
        progress: reduced ? 0.42 : 0.42 * t,
        color: 'rgba(255,255,255,0.32)',
        pixel: 4,
        scatter: 60,
      })
      if (t < 1 && !reduced) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [height])

  return (
    <div className={cx(css({ width: 'full' }), className)}>
      <canvas ref={canvasRef} aria-hidden className={css({ display: 'block', width: 'full' })} />
      <span
        className={css({
          display: 'block',
          mt: '2',
          textAlign: 'center',
          fontFamily: 'mono',
          fontSize: '2xs',
          color: 'faint',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        })}
      >
        {label}
      </span>
    </div>
  )
}
