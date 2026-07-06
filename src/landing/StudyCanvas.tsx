import { useEffect, useRef } from 'react'
import { css } from 'styled-system/css'
import {
  heroZoomT,
  roomOpacity,
  act3Opacity,
  clamp01,
} from '~/landing/hero-math'

/**
 * StudyCanvas — the landing hero's real-time generative scene. No video, no
 * photos: a 2D canvas drawing (Act I) a dark study — desk in near-silhouette,
 * a glowing computer screen as the only bright object (Starlight at low
 * opacity with a #5266eb cast), neural-drift particles joined by hairline
 * synapse lines pulsing at ~1 Hz, and a barely-visible EEG waveform crossing
 * the lower third — then (Act II) a camera push INTO the screen across three
 * parallax particle depths, and (Act III) the inside-the-computer particle
 * field tinted by the focused record's band.
 *
 * Architecture: one canvas, one rAF. The camera is a zoom about the screen's
 * center; room geometry rides a ctx transform at depth 1.0 while particles
 * are projected per-point at depths 0.72 / 1.0 / 1.38 (the parallax). All
 * particle state lives in preallocated Float32Arrays — no per-frame
 * allocations beyond two cached gradients rebuilt only on resize.
 *
 * `reduced` (prefers-reduced-motion) draws ONE static Act-I composition
 * (no particles, no animation) and only redraws on resize.
 */

const DEEP_SPACE = '#171721'
const MIDNIGHT = '#1e1e2a'
const GRAPHITE = '#272735'
const STARLIGHT_RGB = '237, 237, 243'
const MERCURY_RGB = '82, 102, 235'

const MAX_PARTICLES = 104
/** Parallax depths — back, mid, near. */
const DEPTHS = [0.72, 1.0, 1.38] as const

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export interface StudyCanvasProps {
  /** Live scroll progress 0..1 — read inside the rAF, never via React. */
  getProgress: () => number
  /** Focused record's band tint (hex) for the Act III particle field. */
  getTint: () => string
  reduced: boolean
}

export function StudyCanvas({ getProgress, getTint, reduced }: StudyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const propsRef = useRef({ getProgress, getTint })
  propsRef.current = { getProgress, getTint }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let dpr = 1
    let raf = 0
    let disposed = false

    // Screen (the monitor) geometry in world px — set on resize.
    let sw = 0
    let sh = 0
    let fx = 0
    let fy = 0
    let deskY = 0
    let zoomNeeded = 5
    let screenGrad: CanvasGradient | null = null
    let haloGrad: CanvasGradient | null = null

    // ── particles — preallocated, normalized world coords (fractions of W/H) ──
    const px = new Float32Array(MAX_PARTICLES)
    const py = new Float32Array(MAX_PARTICLES)
    const pd = new Uint8Array(MAX_PARTICLES) // depth index 0..2
    const tw = new Float32Array(MAX_PARTICLES) // twinkle phase
    const vx = new Float32Array(MAX_PARTICLES)
    const vy = new Float32Array(MAX_PARTICLES)
    // Per-frame projected screen positions (reused).
    const sx = new Float32Array(MAX_PARTICLES)
    const sy = new Float32Array(MAX_PARTICLES)
    let drawCount = MAX_PARTICLES

    // Deterministic scatter so reloads compose the same study.
    let seed = 7
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    for (let i = 0; i < MAX_PARTICLES; i++) {
      px[i] = rand() * 1.3 - 0.15
      py[i] = rand() * 1.2 - 0.1
      pd[i] = i % 3
      tw[i] = rand() * Math.PI * 2
      vx[i] = (rand() - 0.5) * 0.006
      vy[i] = (rand() - 0.5) * 0.005
    }

    // Act III tint, lerped so band changes glide instead of snapping.
    let tr = 237
    let tg = 237
    let tb = 243

    let prevZoom = 1
    let lastT = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      W = Math.max(1, Math.round(rect.width))
      H = Math.max(1, Math.round(rect.height))
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)

      sw = Math.max(150, 0.24 * W)
      sh = 0.62 * sw
      fx = 0.5 * W
      fy = 0.44 * H
      deskY = fy + sh / 2 + 0.055 * H
      zoomNeeded = 1.15 * Math.max(W / sw, H / sh)
      drawCount = Math.max(44, Math.min(MAX_PARTICLES, Math.round((W * H) / 16000)))

      // World-space gradients — cached; the ctx transform scales them.
      screenGrad = ctx.createLinearGradient(0, fy - sh / 2, 0, fy + sh / 2)
      screenGrad.addColorStop(0, `rgba(${STARLIGHT_RGB}, 0.82)`)
      screenGrad.addColorStop(0.55, `rgba(205, 221, 255, 0.62)`)
      screenGrad.addColorStop(1, `rgba(${MERCURY_RGB}, 0.38)`)
      haloGrad = ctx.createRadialGradient(fx, fy, sw * 0.12, fx, fy, sw * 1.5)
      haloGrad.addColorStop(0, `rgba(${MERCURY_RGB}, 0.20)`)
      haloGrad.addColorStop(0.5, `rgba(${MERCURY_RGB}, 0.07)`)
      haloGrad.addColorStop(1, 'rgba(82, 102, 235, 0)')
    }

    /** The study — room, desk, monitor — drawn in world px under a camera transform. */
    const drawRoom = (z: number, camX: number, camY: number, alpha: number, t: number) => {
      if (alpha <= 0.002) return
      ctx.save()
      ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (W / 2 - camX * z), dpr * (H / 2 - camY * z))
      ctx.globalAlpha = alpha

      // Wall wash — barely-there vertical grade so the room reads as a room.
      ctx.fillStyle = MIDNIGHT
      ctx.globalAlpha = alpha * 0.32
      ctx.fillRect(-0.3 * W, deskY, 1.6 * W, H)
      ctx.globalAlpha = alpha

      // Light spill from the screen — the only bright thing in the study.
      if (haloGrad) {
        ctx.fillStyle = haloGrad
        ctx.fillRect(fx - sw * 1.6, fy - sw * 1.6, sw * 3.2, sw * 3.2)
      }

      // Desk slab + legs — near-silhouette geometry.
      ctx.fillStyle = MIDNIGHT
      ctx.fillRect(0.16 * W, deskY, 0.68 * W, Math.max(6, 0.012 * H))
      ctx.fillStyle = '#1a1a26'
      ctx.fillRect(0.2 * W, deskY, Math.max(4, 0.008 * W), 0.3 * H)
      ctx.fillRect(0.78 * W, deskY, Math.max(4, 0.008 * W), 0.3 * H)

      // A leaning record sleeve and a mug — the pressing studio at rest.
      ctx.fillStyle = GRAPHITE
      const slv = sw * 0.34
      ctx.save()
      ctx.translate(fx - sw * 0.92, deskY)
      ctx.rotate(-0.09)
      ctx.fillRect(-slv / 2, -slv, slv, slv)
      ctx.restore()
      const mugW = sw * 0.09
      ctx.fillRect(fx + sw * 0.78, deskY - mugW * 1.2, mugW, mugW * 1.2)
      ctx.strokeStyle = GRAPHITE
      ctx.lineWidth = Math.max(1.5, sw * 0.014)
      ctx.beginPath()
      ctx.arc(fx + sw * 0.78 + mugW, deskY - mugW * 0.62, mugW * 0.42, -Math.PI / 2, Math.PI / 2)
      ctx.stroke()

      // Monitor — stand, bezel, then the glowing screen.
      ctx.fillStyle = '#20202c'
      ctx.fillRect(fx - sw * 0.05, fy + sh / 2, sw * 0.1, deskY - (fy + sh / 2))
      ctx.fillRect(fx - sw * 0.16, deskY - Math.max(3, 0.006 * H), sw * 0.32, Math.max(3, 0.006 * H))
      const bez = Math.max(4, sw * 0.035)
      ctx.fillStyle = '#0d0d15'
      ctx.beginPath()
      ctx.roundRect(fx - sw / 2 - bez, fy - sh / 2 - bez, sw + bez * 2, sh + bez * 2, bez * 1.6)
      ctx.fill()
      ctx.strokeStyle = GRAPHITE
      ctx.lineWidth = Math.max(1, sw * 0.008)
      ctx.stroke()

      if (screenGrad) {
        ctx.fillStyle = screenGrad
        ctx.fillRect(fx - sw / 2, fy - sh / 2, sw, sh)
      }
      // On the screen: a session in progress — a dark disc + a level line.
      ctx.fillStyle = 'rgba(23, 23, 33, 0.66)'
      ctx.beginPath()
      ctx.arc(fx - sw * 0.24, fy, sh * 0.26, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(23, 23, 33, 0.55)'
      ctx.lineWidth = Math.max(1, sh * 0.02)
      ctx.beginPath()
      const wx0 = fx - sw * 0.02
      for (let k = 0; k <= 24; k++) {
        const wx = wx0 + (k / 24) * sw * 0.42
        const wy = fy + Math.sin(k * 0.9 + t * 0.0012) * sh * 0.1
        if (k === 0) ctx.moveTo(wx, wy)
        else ctx.lineTo(wx, wy)
      }
      ctx.stroke()

      ctx.restore()
    }

    /** The EEG trace crossing the lower third — hairline, patient. */
    const drawEeg = (z: number, camX: number, camY: number, alpha: number, t: number) => {
      if (alpha <= 0.002) return
      ctx.save()
      ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (W / 2 - camX * z), dpr * (H / 2 - camY * z))
      ctx.globalAlpha = alpha * 0.14
      ctx.strokeStyle = `rgb(${STARLIGHT_RGB})`
      ctx.lineWidth = 1
      const y0 = 0.8 * H
      const amp = 0.014 * H
      ctx.beginPath()
      for (let k = 0; k <= 110; k++) {
        const x = (k / 110) * 1.2 * W - 0.1 * W
        const ph = k * 0.55 - t * 0.0011
        const y = y0 + Math.sin(ph) * amp + Math.sin(ph * 0.23 + 1.7) * amp * 1.6
        if (k === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.restore()
    }

    const frame = (t: number) => {
      if (disposed) return
      raf = requestAnimationFrame(frame)
      if (document.hidden) return
      const dt = Math.min(64, lastT ? t - lastT : 16.7)
      lastT = t

      const { getProgress: gp, getTint: gt } = propsRef.current
      const p = gp()
      const zt = heroZoomT(p)
      const z = 1 + zt * (zoomNeeded - 1)
      const camT = clamp01(((z - 1) / (zoomNeeded - 1)) * 1.7)
      const camX = W / 2 + (fx - W / 2) * camT
      const camY = H / 2 + (fy - H / 2) * camT
      const dz = Math.max(0, z - prevZoom)
      prevZoom = z

      const room = roomOpacity(p)
      const inside = act3Opacity(p)
      const pulse = 0.62 + 0.38 * Math.sin((t / 1000) * Math.PI * 2) // ~1 Hz

      // Act III tint glide.
      const [ttr, ttg, ttb] = hexToRgb(gt())
      const lerp = Math.min(1, dt * 0.004)
      tr += (ttr - tr) * lerp
      tg += (ttg - tg) * lerp
      tb += (ttb - tb) * lerp

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalAlpha = 1
      ctx.fillStyle = DEEP_SPACE
      ctx.fillRect(0, 0, W, H)

      drawEeg(z, camX, camY, room, t)
      drawRoom(z, camX, camY, room, t)

      // ── particles: drift, project, streak, link ─────────────────────────
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const insideMix = inside // 0 study → 1 pressing hall
      const n = drawCount
      const drift = dt * 0.001 * (1 - 0.6 * insideMix)
      for (let i = 0; i < n; i++) {
        px[i] += vx[i] * drift
        py[i] += vy[i] * drift
        if (px[i] < -0.2) px[i] += 1.4
        else if (px[i] > 1.2) px[i] -= 1.4
        if (py[i] < -0.15) py[i] += 1.3
        else if (py[i] > 1.15) py[i] -= 1.3
        const zd = 1 + (z - 1) * DEPTHS[pd[i]]
        const cx = W / 2 + (fx - W / 2) * camT
        const cy = H / 2 + (fy - H / 2) * camT
        sx[i] = W / 2 + (px[i] * W - cx) * zd
        sy[i] = H / 2 + (py[i] * H - cy) * zd
      }

      // Synapse hairlines — study register only (fade out through the zoom).
      const linkAlpha = (1 - insideMix) * room
      if (linkAlpha > 0.01) {
        const r = 0.085 * W
        const r2 = r * r
        ctx.strokeStyle = `rgb(${STARLIGHT_RGB})`
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i < n; i++) {
          if (sx[i] < -60 || sx[i] > W + 60 || sy[i] < -60 || sy[i] > H + 60) continue
          for (let j = i + 1; j < n; j++) {
            const dx = (px[i] - px[j]) * W
            const dy = (py[i] - py[j]) * H
            const d2 = dx * dx + dy * dy
            if (d2 < r2) {
              ctx.moveTo(sx[i], sy[i])
              ctx.lineTo(sx[j], sy[j])
            }
          }
        }
        ctx.globalAlpha = 0.05 + 0.05 * pulse * linkAlpha
        ctx.stroke()
      }

      // Points (with Act II streaks along the zoom direction).
      const streakK = Math.min(70, dz * 34)
      for (let i = 0; i < n; i++) {
        if (insideMix > 0 && i % 2 === 1 && insideMix > 0.5) continue // low density inside
        const X = sx[i]
        const Y = sy[i]
        if (X < -80 || X > W + 80 || Y < -80 || Y > H + 80) continue
        const depth = DEPTHS[pd[i]]
        const twinkle = 0.55 + 0.45 * Math.sin(tw[i] + (t / 1000) * Math.PI * 2)
        const aStudy = (0.22 + 0.3 * twinkle * pulse) * Math.max(room, 0.25)
        const aInside = 0.16 + 0.4 * twinkle
        ctx.globalAlpha = aStudy * (1 - insideMix) + aInside * insideMix
        if (insideMix > 0.02) {
          ctx.fillStyle = `rgb(${tr | 0}, ${tg | 0}, ${tb | 0})`
        } else {
          ctx.fillStyle = `rgb(${STARLIGHT_RGB})`
        }
        const sz = (pd[i] === 2 ? 1.9 : pd[i] === 1 ? 1.4 : 1.0) * (1 + insideMix * 0.4)
        if (streakK > 1.5 && insideMix < 0.9) {
          const ddx = X - W / 2
          const ddy = Y - H / 2
          const dist = Math.max(24, Math.hypot(ddx, ddy))
          const len = streakK * depth * (dist / (0.5 * Math.max(W, H)))
          ctx.strokeStyle = ctx.fillStyle
          ctx.lineWidth = sz
          ctx.beginPath()
          ctx.moveTo(X, Y)
          ctx.lineTo(X + (ddx / dist) * len, Y + (ddy / dist) * len)
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.arc(X, Y, sz, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Inside the machine: faint synapse links in the band tint, sparser.
      if (insideMix > 0.05) {
        const r = 0.11 * W
        const r2 = r * r
        ctx.strokeStyle = `rgb(${tr | 0}, ${tg | 0}, ${tb | 0})`
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i < n; i += 2) {
          for (let j = i + 2; j < n; j += 2) {
            const dx = (px[i] - px[j]) * W
            const dy = (py[i] - py[j]) * H
            if (dx * dx + dy * dy < r2) {
              ctx.moveTo(sx[i], sy[i])
              ctx.lineTo(sx[j], sy[j])
            }
          }
        }
        ctx.globalAlpha = (0.04 + 0.04 * pulse) * insideMix
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    /** Reduced motion: ONE static Act-I still — no particles, no animation. */
    const drawStatic = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = DEEP_SPACE
      ctx.fillRect(0, 0, W, H)
      drawEeg(1, W / 2, H / 2, 1, 0)
      drawRoom(1, W / 2, H / 2, 1, 0)
      ctx.globalAlpha = 1
    }

    resize()
    const onResize = () => {
      resize()
      if (reduced) drawStatic()
    }
    window.addEventListener('resize', onResize)

    if (reduced) {
      drawStatic()
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [reduced])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-hero-canvas
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
