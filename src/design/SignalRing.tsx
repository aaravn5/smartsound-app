import { useEffect, useRef } from 'react'
import { css } from 'styled-system/css'
import { prefersReducedMotion } from './signal'

/**
 * The signal ring — SmartSound's signature object (§1, §5.5).
 *
 * Its geometry is the audio spectrum (outer trace) overlaid with the pulse
 * (inner ring), breathing at the respiration rate. When `getSpectrum` returns
 * live FFT bins (engine running, M3) the outer trace is REAL audio; when
 * `getPulse` returns a live rPPG reading (M4) the inner ring is the REAL pulse.
 * With neither (idle), it runs a labeled generative preview — real trig each
 * frame, never a gif. `prefers-reduced-motion` degrades to a static gauge.
 */
export interface PulseReading {
  /** 0..1 position within the current cardiac cycle. */
  phase: number
  bpm: number
  /** 0..1 signal confidence; low confidence softens the trace. */
  confidence: number
}

export interface SignalRingProps {
  arousal: number
  color: string
  /** Live FFT bins from the audio engine (0..255), or null when idle. */
  getSpectrum?: () => Uint8Array | null
  /** Live rPPG pulse, or null when the camera loop isn't running. */
  getPulse?: () => PulseReading | null
  respirationBpm?: number
  heartBpm?: number
  size?: number
}

const POINTS = 220

export function SignalRing({
  arousal,
  color,
  getSpectrum,
  getPulse,
  respirationBpm = 7,
  heartBpm = 64,
  size = 440,
}: SignalRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const state = useRef({ arousal, color, respirationBpm, heartBpm, getSpectrum, getPulse })
  state.current = { arousal, color, respirationBpm, heartBpm, getSpectrum, getPulse }

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

    const pulseShape = (phase: number) => {
      const p = ((phase % 1) + 1) % 1
      const systole = Math.exp(-Math.pow((p - 0.05) / 0.05, 2))
      const dicrotic = 0.35 * Math.exp(-Math.pow((p - 0.28) / 0.07, 2))
      return systole + dicrotic
    }

    const generative = (angle: number, t: number, a: number) =>
      0.5 * Math.sin(6 * angle + t * 0.9) +
      0.28 * Math.sin(11 * angle - t * 1.3 + a * 3.2) +
      0.16 * Math.sin(19 * angle + t * 0.6) +
      0.08 * Math.sin(31 * angle - t * 1.9)

    // Log-spaced FFT bin sampling — musical energy lives in the low bins.
    const sampleSpectrum = (spec: Uint8Array, i: number) => {
      const usable = Math.min(spec.length, 512)
      const frac = i / POINTS
      const bin = Math.floor(Math.pow(frac, 1.7) * usable) + 1
      return (spec[Math.min(bin, usable - 1)] ?? 0) / 255
    }

    const drawRing = (t: number) => {
      const s = state.current
      const spec = s.getSpectrum?.() ?? null
      const pulse = s.getPulse?.() ?? null
      const a = s.arousal
      const sig = s.color

      const breath = Math.sin((t * s.respirationBpm) / 60 * Math.PI * 2) * (0.03 + 0.02 * (1 - a))
      const beatPhase = pulse ? pulse.phase : (t * s.heartBpm) / 60
      const beat = pulseShape(beatPhase) * 0.05
      const pulseConf = pulse ? pulse.confidence : 1
      let level = 0.4
      if (spec) {
        const n = Math.min(spec.length, 512)
        let sum = 0
        for (let i = 1; i < n; i++) sum += spec[i]
        level = sum / (n * 255)
      }
      const energy = spec ? 0.6 + 1.6 * level : 0.55 + 0.9 * a
      const amp = baseR * 0.17 * energy

      ctx.clearRect(0, 0, size, size)

      const wash = ctx.createRadialGradient(cx, cy, baseR * 0.1, cx, cy, baseR * 1.3)
      wash.addColorStop(0, withAlpha(sig, 0.12 + 0.1 * a))
      wash.addColorStop(1, withAlpha(sig, 0))
      ctx.fillStyle = wash
      ctx.beginPath()
      ctx.arc(cx, cy, baseR * 1.3, 0, Math.PI * 2)
      ctx.fill()

      // Outer spectrum trace.
      ctx.beginPath()
      for (let i = 0; i <= POINTS; i++) {
        const angle = (i / POINTS) * Math.PI * 2 - Math.PI / 2
        const v = spec ? sampleSpectrum(spec, i) * 1.7 - 0.35 : generative(angle, t, a)
        const r = baseR * (1 + breath + beat * 0.4) + amp * v
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = sig
      ctx.lineWidth = 1.5
      ctx.shadowColor = sig
      ctx.shadowBlur = 18 + 22 * a
      ctx.stroke()
      ctx.shadowBlur = 0

      // Inner pulse ring — the biometric half.
      const innerR = baseR * (0.72 + breath * 0.5) + beat * baseR
      ctx.beginPath()
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
      ctx.strokeStyle = withAlpha(sig, 0.3 + 0.35 * pulseConf)
      ctx.lineWidth = 1
      ctx.stroke()

      // Gauge markings — instrument, not decoration.
      ctx.strokeStyle = withAlpha('#ffffff', 0.05)
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
      drawRing(0)
    } else {
      const loop = () => {
        drawRing(performance.now() / 1000)
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
        aria-label="Signal ring — the audio spectrum overlaid with your pulse"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

function withAlpha(color: string, alpha: number): string {
  const pct = Math.round(Math.min(1, Math.max(0, alpha)) * 100)
  return `color-mix(in oklab, ${color} ${pct}%, transparent)`
}
