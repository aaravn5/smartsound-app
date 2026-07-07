import { useEffect, useRef } from 'react'
import { css, cx } from 'styled-system/css'

/**
 * TriangleSpectrum — the player's pixelated wavelength.
 *
 * A row of stacked triangle "pixels" across the bottom of the scene, each
 * column driven by the REAL frequency spectrum (`getSpectrum()`, Uint8Array)
 * while a session runs. Columns rise and fall as stacks of small triangles —
 * the audio literally drawn in the app's particle glyph. When the engine is
 * idle a slow generative swell keeps the surface alive without pretending to
 * be signal (it reads as a preview, not a measurement). Reduced motion holds
 * a quiet static stack.
 */

const COLS = 48
const CELL = 12 // triangle cell size (CSS px)
const PALETTE = ['#4aa8ff', '#5c7cff', '#37c2a0', '#63e0c2', '#7bd4ff']

export function TriangleSpectrum({
  getSpectrum,
  running,
  className,
}: {
  getSpectrum: () => Uint8Array | null
  running: boolean
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const levels = useRef(new Float32Array(COLS))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const fit = () => {
      const r = canvas.parentElement!.getBoundingClientRect()
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      canvas.style.width = `${r.width}px`
      canvas.style.height = `${r.height}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(canvas.parentElement!)

    let raf = 0
    const draw = (t: number) => {
      const W = canvas.width / dpr
      const H = canvas.height / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      const spectrum = running ? getSpectrum() : null
      const lv = levels.current
      const maxStack = Math.floor(H / (CELL * 0.72)) - 1
      const colW = W / COLS

      for (let c = 0; c < COLS; c++) {
        let target: number
        if (spectrum && spectrum.length > 0) {
          // Log-ish bin mapping so lows don't dominate every column.
          const idx = Math.min(spectrum.length - 1, Math.floor(Math.pow(c / COLS, 1.6) * spectrum.length * 0.72))
          target = spectrum[idx] / 255
        } else {
          // Idle preview — a slow, obviously-synthetic swell.
          target = 0.12 + 0.1 * Math.sin(t / 900 + c * 0.42) * Math.sin(t / 1400 + c * 0.13)
          target = Math.max(0.06, target)
        }
        // Fast attack, slow decay — the way audio meters feel right.
        lv[c] += (target - lv[c]) * (target > lv[c] ? 0.5 : 0.08)

        const stack = Math.max(1, Math.round(lv[c] * maxStack))
        const cx0 = c * colW + colW / 2
        for (let s = 0; s < stack; s++) {
          const y = H - 4 - s * CELL * 0.72
          const fade = 1 - (s / maxStack) * 0.55
          const col = PALETTE[(c + s) % PALETTE.length]
          const up = s % 2 === 0
          const half = CELL / 2 - 1
          ctx.beginPath()
          if (up) {
            ctx.moveTo(cx0, y - half)
            ctx.lineTo(cx0 + half, y + half * 0.7)
            ctx.lineTo(cx0 - half, y + half * 0.7)
          } else {
            ctx.moveTo(cx0, y + half * 0.7)
            ctx.lineTo(cx0 + half, y - half)
            ctx.lineTo(cx0 - half, y - half)
          }
          ctx.closePath()
          ctx.globalAlpha = 0.28 * fade + lv[c] * 0.5 * fade
          ctx.fillStyle = col
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [getSpectrum, running])

  return (
    <div aria-hidden className={cx(css({ pointerEvents: 'none' }), className)}>
      <canvas ref={canvasRef} className={css({ display: 'block' })} />
    </div>
  )
}
