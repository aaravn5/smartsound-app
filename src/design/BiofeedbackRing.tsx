import { useEffect, useRef } from 'react'
import { css } from 'styled-system/css'
import { prefersReducedMotion } from './signal'
import type { PulseReading } from './SignalRing'

/**
 * BiofeedbackRing — the app's centerpiece (Part 5.A).
 *
 * The visible closed loop: it pulses ONCE per detected heartbeat from the live
 * rPPG signal, its stroke runs the `--ring-cool` → `--ring-warm` gradient, and
 * its outer glow brightens on every beat. As measured HR drops the pulse slows
 * and the gradient cools; as HR rises it warms and quickens. The outer trace is
 * the real audio spectrum when the engine is running, the inner ring is the real
 * pulse when the camera loop is on; idle it runs a labelled generative preview.
 * On mount (and on demand via `bootKey`) it assembles from a scattered pixel
 * field on the `--pixel-size` grid. `prefers-reduced-motion` → static gauge.
 */
export interface BiofeedbackRingProps {
  arousal: number
  getSpectrum?: () => Uint8Array | null
  getPulse?: () => PulseReading | null
  respirationBpm?: number
  heartBpm?: number
  size?: number
  /** Change this value to replay the pixel-assemble boot (e.g. on session start). */
  bootKey?: number
}

const COOL = [0x38, 0xbd, 0xf8]
const WARM = [0xa7, 0x8b, 0xfa]
const POINTS = 240
const PIXEL = 4 // matches --pixel-size

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const rgb = (t: number) => {
  const k = clamp01(t)
  return `rgb(${Math.round(lerp(COOL[0], WARM[0], k))},${Math.round(lerp(COOL[1], WARM[1], k))},${Math.round(lerp(COOL[2], WARM[2], k))})`
}
const rgba = (t: number, a: number) => {
  const k = clamp01(t)
  return `rgba(${Math.round(lerp(COOL[0], WARM[0], k))},${Math.round(lerp(COOL[1], WARM[1], k))},${Math.round(lerp(COOL[2], WARM[2], k))},${a})`
}
// deterministic per-point scatter so the pixel field is stable across frames
const scatterAt = (i: number) => ({
  a: Math.sin(i * 12.9898) * 43758.5453,
  b: Math.sin(i * 78.233) * 12345.678,
})

export function BiofeedbackRing({
  arousal,
  getSpectrum,
  getPulse,
  respirationBpm = 7,
  heartBpm = 64,
  size = 440,
  bootKey = 0,
}: BiofeedbackRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const state = useRef({ arousal, respirationBpm, heartBpm, getSpectrum, getPulse })
  state.current = { arousal, respirationBpm, heartBpm, getSpectrum, getPulse }
  const bootAt = useRef(performance.now())

  // Replay the assemble whenever bootKey changes.
  useEffect(() => {
    bootAt.current = performance.now()
  }, [bootKey])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const baseR = size * 0.3

    // expanding shells emitted one per heartbeat (the Apple-biofeedback pulse)
    const shells: number[] = []
    let lastBeatPhase = 0

    const pulseShape = (phase: number) => {
      const p = ((phase % 1) + 1) % 1
      return Math.exp(-Math.pow((p - 0.05) / 0.05, 2)) + 0.35 * Math.exp(-Math.pow((p - 0.28) / 0.07, 2))
    }
    const generative = (angle: number, t: number, a: number) =>
      0.5 * Math.sin(6 * angle + t * 0.9) +
      0.28 * Math.sin(11 * angle - t * 1.3 + a * 3.2) +
      0.16 * Math.sin(19 * angle + t * 0.6) +
      0.08 * Math.sin(31 * angle - t * 1.9)
    const sampleSpectrum = (spec: Uint8Array, i: number) => {
      const usable = Math.min(spec.length, 512)
      const bin = Math.floor(Math.pow(i / POINTS, 1.7) * usable) + 1
      return (spec[Math.min(bin, usable - 1)] ?? 0) / 255
    }
    const easeCalm = (x: number) => 1 - Math.pow(1 - x, 3)

    const draw = (t: number) => {
      const s = state.current
      const spec = s.getSpectrum?.() ?? null
      const pulse = s.getPulse?.() ?? null
      const a = clamp01(s.arousal)
      const boot = clamp01((performance.now() - bootAt.current) / 1000)
      const bp = easeCalm(boot)

      const breath = Math.sin((t * s.respirationBpm) / 60 * Math.PI * 2) * (0.03 + 0.02 * (1 - a))
      // beat quickens with HR: use the live pulse phase, else HR-derived phase
      const beatPhase = pulse ? pulse.phase : (t * s.heartBpm) / 60
      if (beatPhase < lastBeatPhase) shells.push(t) // wrapped → new heartbeat
      lastBeatPhase = beatPhase
      while (shells.length > 5) shells.shift()
      const beat = pulseShape(beatPhase)
      const pulseConf = pulse ? pulse.confidence : 1

      let level = 0.4
      if (spec) {
        let sum = 0
        const n = Math.min(spec.length, 512)
        for (let i = 1; i < n; i++) sum += spec[i]
        level = sum / (n * 255)
      }
      const energy = spec ? 0.6 + 1.6 * level : 0.55 + 0.9 * a
      const amp = baseR * 0.17 * energy

      ctx.clearRect(0, 0, size, size)

      // ambient wash, brighter on each beat
      const wash = ctx.createRadialGradient(cx, cy, baseR * 0.1, cx, cy, baseR * 1.4)
      wash.addColorStop(0, rgba(a, 0.1 + 0.12 * beat + 0.08 * a))
      wash.addColorStop(1, rgba(a, 0))
      ctx.fillStyle = wash
      ctx.beginPath()
      ctx.arc(cx, cy, baseR * 1.4, 0, Math.PI * 2)
      ctx.fill()

      // expanding heartbeat shells
      for (const born of shells) {
        const age = t - born
        if (age > 1.2 || age < 0) continue
        const p = age / 1.2
        ctx.beginPath()
        ctx.arc(cx, cy, baseR * (0.92 + p * 0.62), 0, Math.PI * 2)
        ctx.strokeStyle = rgba(a, (1 - p) * (1 - p) * 0.32 * pulseConf)
        ctx.lineWidth = 1.4 * (1 - p) + 0.4
        ctx.stroke()
      }

      // outer trace — pixel-assemble during boot, smooth after
      const grad = ctx.createLinearGradient(cx - baseR, cy - baseR, cx + baseR, cy + baseR)
      grad.addColorStop(0, rgb(Math.max(0, a - 0.35)))
      grad.addColorStop(1, rgb(Math.min(1, a + 0.2)))

      if (bp < 1) {
        // scattered pixel field converging onto the ring (Part 5.A boot)
        for (let i = 0; i < POINTS; i++) {
          const angle = (i / POINTS) * Math.PI * 2 - Math.PI / 2
          const v = spec ? sampleSpectrum(spec, i) * 1.7 - 0.35 : generative(angle, t, a)
          const r = baseR * (1 + breath) + amp * v
          const sc = scatterAt(i)
          const off = (1 - bp) * baseR * 0.9
          const px = cx + Math.cos(angle) * r + (sc.a - Math.trunc(sc.a) - 0.5) * off * 2
          const py = cy + Math.sin(angle) * r + (sc.b - Math.trunc(sc.b) - 0.5) * off * 2
          const gx = Math.round(px / PIXEL) * PIXEL
          const gy = Math.round(py / PIXEL) * PIXEL
          ctx.fillStyle = rgba(a, 0.35 + 0.55 * bp)
          ctx.fillRect(gx - PIXEL / 2, gy - PIXEL / 2, PIXEL, PIXEL)
        }
      }
      // smooth stroke fades in as the pixels settle
      ctx.globalAlpha = bp
      ctx.beginPath()
      for (let i = 0; i <= POINTS; i++) {
        const angle = (i / POINTS) * Math.PI * 2 - Math.PI / 2
        const v = spec ? sampleSpectrum(spec, i) * 1.7 - 0.35 : generative(angle, t, a)
        const r = baseR * (1 + breath + beat * 0.045 * 0.4) + amp * v
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.6
      ctx.shadowColor = rgb(a)
      ctx.shadowBlur = 16 + 30 * beat // glow brightens on each beat
      ctx.stroke()
      ctx.shadowBlur = 0

      // inner pulse ring — the biometric half
      const innerR = baseR * (0.72 + breath * 0.5) + beat * baseR * 0.05
      ctx.beginPath()
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(a, 0.3 + 0.35 * pulseConf)
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1

      // faint gauge ticks — instrument, not decoration
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 1
      for (let g = 0; g < 4; g++) {
        const ang = (g / 4) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(ang) * baseR * 0.5, cy + Math.sin(ang) * baseR * 0.5)
        ctx.lineTo(cx + Math.cos(ang) * baseR * 1.22, cy + Math.sin(ang) * baseR * 1.22)
        ctx.stroke()
      }
    }

    let raf = 0
    if (prefersReducedMotion()) {
      bootAt.current = performance.now() - 2000 // skip assemble → static gauge
      draw(0)
    } else {
      const loop = () => {
        draw(performance.now() / 1000)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }
    return () => cancelAnimationFrame(raf)
  }, [size])

  return (
    <div className={css({ position: 'relative', display: 'grid', placeItems: 'center', width: '100%', height: '100%' })}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Biofeedback ring — pulses with your heartbeat, warming as your heart rate rises"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
