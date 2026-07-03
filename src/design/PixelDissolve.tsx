import { useEffect, useRef, useState, type ReactNode } from 'react'
import { css, cx } from 'styled-system/css'
import { drawPixelAssemble, pointsForRect, type PixelPoint } from './pixel'
import { prefersReducedMotion } from './signal'

export interface PixelDissolveProps {
  children: ReactNode
  /**
   * Controls visibility. Omit to just play a one-shot dissolve-in on mount.
   * Toggle to `false` to play a dissolve-out; the caller keeps this component
   * mounted (a true DOM-unmount can't be animated once it leaves the tree).
   */
  show?: boolean
  /** Dissolve duration in ms (§1.4 motion is damped, never snappy). */
  duration?: number
  /** Curtain color — should match the surface behind/around the content. */
  color?: string
  /** Grid size in px — matches the shared `--pixel-size` (§1.3). */
  pixel?: number
  className?: string
}

/**
 * Wraps children in a pixel-assemble/dissolve transition (§1.3): a curtain of
 * 4px squares covers the content, then scatters away to reveal it on
 * entrance, and reassembles to hide it again on exit (`show={false}`).
 */
export function PixelDissolve({
  children,
  show = true,
  duration = 480,
  color = 'rgba(10, 10, 15, 1)',
  pixel = 4,
  className,
}: PixelDissolveProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const prevShow = useRef(show)
  const [rendered, setRendered] = useState(show)

  const play = (direction: 'in' | 'out', onDone?: () => void) => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    cancelAnimationFrame(rafRef.current)
    if (!wrap || !canvas) {
      onDone?.()
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      onDone?.()
      return
    }
    const rect = wrap.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    canvas.style.transition = 'none'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const points: PixelPoint[] = pointsForRect(w, h, pixel)

    if (prefersReducedMotion()) {
      ctx.clearRect(0, 0, w, h)
      canvas.style.opacity = '0'
      onDone?.()
      return
    }

    canvas.style.opacity = '1'
    const start = performance.now()
    // 'in': curtain starts fully assembled (covering), dissolves to scattered.
    // 'out': curtain starts scattered, assembles to fully cover.
    const from = direction === 'in' ? 1 : 0
    const to = direction === 'in' ? 0 : 1

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const coverage = from + (to - from) * t
      ctx.clearRect(0, 0, w, h)
      drawPixelAssemble({ ctx, points, progress: coverage, color, pixel })
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        if (direction === 'in') canvas.style.opacity = '0'
        onDone?.()
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  // Entrance: play once on mount when initially visible.
  useEffect(() => {
    if (show) play('in')
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Respond to controlled `show` transitions after mount.
  useEffect(() => {
    if (show === prevShow.current) return
    prevShow.current = show

    if (show) {
      setRendered(true)
      requestAnimationFrame(() => play('in'))
    } else {
      play('out', () => {
        setRendered(false)
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.style.transition = `opacity ${duration}ms var(--ease-calm, ease)`
        requestAnimationFrame(() => {
          canvas.style.opacity = '0'
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  return (
    <div ref={wrapRef} className={cx(css({ position: 'relative' }), className)}>
      {rendered ? children : null}
      <canvas
        ref={canvasRef}
        aria-hidden
        className={css({
          position: 'absolute',
          inset: '0',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: '0',
        })}
      />
    </div>
  )
}
