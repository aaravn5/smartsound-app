import { useEffect, useRef } from 'react'
import { css, cx } from 'styled-system/css'

/**
 * TriangleText — type set in nanobots.
 *
 * The string is rendered to an offscreen canvas, its ink pixels are sampled,
 * and a pool of tiny triangles flies in to assemble the glyphs. Change `text`
 * and the same triangles rearrange into the new words. The pointer scatters
 * nearby triangles and warms them to yellow; they drift home when it leaves.
 *
 * 2D canvas (no WebGL) — cheap enough to run several at once. The loop goes
 * fully idle (no rAF) once every particle is home and the pointer is away.
 * Reduced motion renders the assembled state statically. A visually-hidden
 * element keeps the text readable to assistive tech and search.
 */

interface Particle {
  x: number
  y: number
  tx: number
  ty: number
  vx: number
  vy: number
  size: number
  rot: number
  spin: number
  baseColor: string
  warm: number // 0..1 → yellow
  live: boolean
}

export interface TriangleTextProps {
  text: string
  className?: string
  /** Font size in CSS px at which glyphs are laid out (scales with container width). */
  fontSize?: number
  fontWeight?: number
  align?: 'left' | 'center'
  /** Sampling gap in px — smaller = denser, more triangles. */
  gap?: number
  /** Canvas height in CSS px; width follows the container. */
  height?: number
  /** Extra chance (0..1) a particle takes an accent color instead of ink. */
  accentRatio?: number
  as?: 'h1' | 'h2' | 'p' | 'div'
}

const INK = '#f4f7fb'
const ACCENTS = ['#4aa8ff', '#37c2a0', '#5c7cff', '#63e0c2']
const WARM: [number, number, number] = [255, 210, 74]

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif'

export function TriangleText({
  text,
  className,
  fontSize = 72,
  fontWeight = 600,
  align = 'left',
  gap = 5,
  height = 96,
  accentRatio = 0.14,
  as: Tag = 'div',
}: TriangleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const pool = useRef<Particle[]>([])
  const pointer = useRef({ x: -1e5, y: -1e5, active: false })
  const running = useRef(false)
  const rafId = useRef(0)
  const reduce = useRef(false)

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // (Re)target the particle pool whenever text or container size changes.
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const dpr = Math.min(2, window.devicePixelRatio || 1)

    const layout = () => {
      const W = Math.max(10, wrap.clientWidth)
      const H = height
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`

      // Draw the string offscreen and sample its ink.
      const off = document.createElement('canvas')
      off.width = Math.round(W)
      off.height = H
      const octx = off.getContext('2d', { willReadFrequently: true })!
      octx.clearRect(0, 0, W, H)
      // Shrink to fit: measure, then scale the font down if the line overflows.
      const lines = text.split('\n')
      let fs = fontSize
      octx.font = `${fontWeight} ${fs}px ${FONT_STACK}`
      const widest = Math.max(...lines.map((l) => octx.measureText(l).width))
      if (widest > W - 8) fs = Math.max(18, Math.floor(fs * ((W - 8) / widest)))
      octx.font = `${fontWeight} ${fs}px ${FONT_STACK}`
      octx.textBaseline = 'middle'
      octx.fillStyle = '#fff'
      const lineH = fs * 1.06
      const totalH = lineH * lines.length
      lines.forEach((line, li) => {
        const lw = octx.measureText(line).width
        const x = align === 'center' ? (W - lw) / 2 : 2
        const y = H / 2 - totalH / 2 + lineH * (li + 0.5)
        octx.fillText(line, x, y)
      })

      const img = octx.getImageData(0, 0, off.width, off.height).data
      const targets: [number, number][] = []
      for (let y = 0; y < off.height; y += gap) {
        for (let x = 0; x < off.width; x += gap) {
          if (img[(y * off.width + x) * 4 + 3] > 140) {
            targets.push([x + (Math.random() - 0.5) * 1.4, y + (Math.random() - 0.5) * 1.4])
          }
        }
      }

      // Grow the pool if needed; recycle in place so live triangles REARRANGE.
      const p = pool.current
      while (p.length < targets.length) {
        p.push({
          x: Math.random() * W,
          y: Math.random() * H + (Math.random() < 0.5 ? -H : H), // fly in from above/below
          tx: 0,
          ty: 0,
          vx: 0,
          vy: 0,
          size: 1.6 + Math.random() * 1.9,
          rot: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.12,
          baseColor: Math.random() < accentRatio ? ACCENTS[(Math.random() * ACCENTS.length) | 0] : INK,
          warm: 0,
          live: true,
        })
      }
      for (let i = 0; i < p.length; i++) {
        if (i < targets.length) {
          p[i].tx = targets[i][0]
          p[i].ty = targets[i][1]
          p[i].live = true
        } else {
          // Surplus triangles drift off and fade instead of popping.
          p[i].tx = p[i].x + (Math.random() - 0.5) * 160
          p[i].ty = p[i].y + (Math.random() < 0.5 ? -1 : 1) * (H * 0.9)
          p[i].live = false
        }
      }
      wake()
    }

    const ctx = canvas.getContext('2d')!

    const step = () => {
      const W = canvas.width / dpr
      const H = canvas.height / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const pt = pointer.current
      const snap = reduce.current
      let settled = true
      for (const q of pool.current) {
        if (!q.live && Math.abs(q.ty - q.y) < 2) continue
        if (snap) {
          q.x = q.tx
          q.y = q.ty
          q.warm = 0
        } else {
          // Spring home.
          q.vx += (q.tx - q.x) * 0.016
          q.vy += (q.ty - q.y) * 0.016
          // Pointer scatter + warmth.
          if (pt.active) {
            const dx = q.x - pt.x
            const dy = q.y - pt.y
            const d2 = dx * dx + dy * dy
            const R = 64
            if (d2 < R * R && d2 > 0.01) {
              const d = Math.sqrt(d2)
              const f = ((R - d) / R) * 1.9
              q.vx += (dx / d) * f
              q.vy += (dy / d) * f
              q.warm = Math.min(1, q.warm + 0.25)
            }
          }
          q.vx *= 0.86
          q.vy *= 0.86
          q.x += q.vx
          q.y += q.vy
          q.rot += q.spin * (Math.abs(q.vx) + Math.abs(q.vy) > 0.3 ? 1 : 0.12)
          q.warm = Math.max(0, q.warm - 0.02)
          if (
            settled &&
            (Math.abs(q.tx - q.x) > 0.4 || Math.abs(q.ty - q.y) > 0.4 || q.warm > 0.01)
          ) {
            settled = false
          }
        }
        // Draw the triangle.
        const [br, bg, bb] = hexToRgb(q.baseColor)
        const r = Math.round(br + (WARM[0] - br) * q.warm)
        const g = Math.round(bg + (WARM[1] - bg) * q.warm)
        const b = Math.round(bb + (WARM[2] - bb) * q.warm)
        ctx.save()
        ctx.translate(q.x, q.y)
        ctx.rotate(q.rot)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${q.live ? 0.94 : 0.35})`
        const s = q.size
        ctx.beginPath()
        ctx.moveTo(0, -s)
        ctx.lineTo(s * 0.9, s * 0.75)
        ctx.lineTo(-s * 0.9, s * 0.75)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      if (settled && !pointer.current.active) {
        running.current = false // fully idle — no rAF until woken
        return
      }
      rafId.current = requestAnimationFrame(step)
    }

    const wake = () => {
      if (running.current) return
      running.current = true
      rafId.current = requestAnimationFrame(step)
    }

    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(wrap)

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      pointer.current.x = e.clientX - r.left
      pointer.current.y = e.clientY - r.top
      pointer.current.active = true
      wake()
    }
    const onLeave = () => {
      pointer.current.active = false
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)

    return () => {
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(rafId.current)
      running.current = false
    }
  }, [text, fontSize, fontWeight, align, gap, height, accentRatio])

  return (
    <Tag className={cx(css({ position: 'relative', m: '0' }), className)}>
      <span
        className={css({
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        })}
      >
        {text.replace('\n', ' ')}
      </span>
      <div ref={wrapRef} aria-hidden className={css({ w: '100%' })} style={{ height }}>
        <canvas ref={canvasRef} className={css({ display: 'block' })} />
      </div>
    </Tag>
  )
}
