import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { css, cx } from 'styled-system/css'
import { FADE_MS, GRAIN_URL, NaturePhoto, Scene, SceneLightWash, useCrossfade, type SceneVariant } from './Scene'

/**
 * LivingScene — the interactive 3D ambient canvas (Today hero + Player sky).
 *
 * A lazily-loaded R3F world per scene variant: a gradient-and-cloud sky
 * shader, a slowly morphing liquid-glass orb, and drifting light dust — calm
 * nature, unhurried and cinematic. This wrapper stays three-free so first
 * paint is never blocked:
 *   · no WebGL / context lost  → the existing `Scene` gradient
 *   · while the chunk loads    → the existing `Scene` gradient (cross-covers)
 *   · reduced motion           → a rich static 3D frame (no drift, no pulses)
 *
 * Touch pulse — ON POINTER/TOUCH DOWN ONLY, never ambient: a press anywhere
 * over the scene's frame queues a color ripple in the current `--signal`
 * color, which the sky shader expands and fades from the touch point. The
 * listener sits on `window` so pulses still fire through the content layers
 * stacked above the sky; a bounds check scopes it to this scene's frame.
 */

export interface PulseRequest {
  /** Touch point, 0..1 across the scene frame — GL uv space (y up). */
  x: number
  y: number
  /** Ripple color — raw sRGB components, 0..1. */
  r: number
  g: number
  b: number
}

export interface PulseQueue {
  pending: PulseRequest[]
}

const LivingSceneCanvas = lazy(() =>
  import('./LivingSceneCanvas').then((m) => ({ default: m.LivingSceneCanvas })),
)

// ── capability probes ───────────────────────────────────────────────────────

let webglSupport: boolean | null = null

function hasWebgl(): boolean {
  if (webglSupport != null) return webglSupport
  try {
    const probe = document.createElement('canvas')
    webglSupport = Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'))
  } catch {
    webglSupport = false
  }
  return webglSupport
}

function useReducedMotionFlag(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// ── the pulse color: live --signal, parsed oklch → sRGB ─────────────────────

const ACCENT: Record<SceneVariant, string> = {
  dusk: '#A78BFA',
  aurora: '#5EEAD4',
  ocean: '#7DD3FC',
  dawn: '#FDBA74',
  forest: '#9AD1A8',
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function gammaEncode(channel: number): number {
  const c = Math.min(1, Math.max(0, channel))
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

/** oklch(L C H) → sRGB — the standard OKLab→LMS→linear-sRGB pipeline. */
function parseOklch(raw: string): [number, number, number] | null {
  const match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(raw)
  if (!match) return null
  const L = parseFloat(match[1])
  const C = parseFloat(match[2])
  const H = (parseFloat(match[3]) * Math.PI) / 180
  const a = C * Math.cos(H)
  const b = C * Math.sin(H)
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3)
  return [
    gammaEncode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    gammaEncode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    gammaEncode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

function signalRgb(variant: SceneVariant): [number, number, number] {
  if (typeof window !== 'undefined') {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--signal')
    const parsed = parseOklch(raw)
    if (parsed) return parsed
  }
  return hexToRgb(ACCENT[variant])
}

// The WebGL sky/orb/dust canvas — dropped a shade under fully opaque so the
// nature-photo mood layer behind it stays faintly visible, adding luxurious
// depth without ever compromising the orb/cloud legibility above.
const livingCanvas = css({ opacity: '0.92' })

// ── component ───────────────────────────────────────────────────────────────

export interface LivingSceneProps {
  variant?: SceneVariant
  className?: string
}

export function LivingScene({ variant = 'dusk', className }: LivingSceneProps) {
  const reduced = useReducedMotionFlag()
  const [lost, setLost] = useState(false)
  const supported = useMemo(() => typeof window !== 'undefined' && hasWebgl(), [])
  const rootRef = useRef<HTMLDivElement>(null)
  const queueRef = useRef<PulseQueue>({ pending: [] })
  const grainStyle = useMemo(() => ({ backgroundImage: GRAIN_URL }), [])
  // Cross-fade: the nature photo swaps per variant same as Scene's gradient
  // sky, even though the 3D canvas itself never remounts.
  const { items: photos, fading } = useCrossfade(variant)

  // Touch pulse — pointer/touch down only. Under reduced motion the frame is
  // static, so pulses are skipped rather than half-animated.
  useEffect(() => {
    if (!supported || lost || reduced) return
    const push = (clientX: number, clientY: number) => {
      const el = rootRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (
        rect.width === 0 ||
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      )
        return
      const [r, g, b] = signalRgb(variant)
      const pending = queueRef.current.pending
      pending.push({
        x: (clientX - rect.left) / rect.width,
        y: 1 - (clientY - rect.top) / rect.height,
        r,
        g,
        b,
      })
      if (pending.length > 8) pending.shift()
    }
    if (typeof window.PointerEvent !== 'undefined') {
      const onDown = (e: PointerEvent) => push(e.clientX, e.clientY)
      window.addEventListener('pointerdown', onDown, { passive: true })
      return () => window.removeEventListener('pointerdown', onDown)
    }
    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) push(touch.clientX, touch.clientY)
    }
    window.addEventListener('touchstart', onTouch, { passive: true })
    return () => window.removeEventListener('touchstart', onTouch)
  }, [supported, lost, reduced, variant])

  if (!supported || lost) return <Scene variant={variant} className={className} />

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cx(
        css({
          position: 'absolute',
          inset: '0',
          overflow: 'hidden',
          zIndex: '0',
          // The sky is scenery — input flows to the content layers above; the
          // pulse listener observes presses from `window` instead.
          pointerEvents: 'none',
        }),
        className,
      )}
    >
      {/* Nature-photo mood layer — sits behind the WebGL sky. The canvas
          above is drawn a shade under fully opaque (see `livingCanvas`
          below) so this depth layer bleeds through while the shader sky,
          clouds and orb remain the dominant, fully legible surface. */}
      {photos.map((photo) => (
        <div
          key={photo.id}
          className={css({ position: 'absolute', inset: '0' })}
          style={{
            opacity: fading === photo.id ? 0 : 1,
            transition: `opacity ${FADE_MS}ms ease`,
          }}
        >
          <NaturePhoto variant={photo.value} />
        </div>
      ))}

      <Suspense fallback={<Scene variant={variant} />}>
        <LivingSceneCanvas
          variant={variant}
          reducedMotion={reduced}
          pulses={queueRef.current}
          onContextLost={() => setLost(true)}
          className={livingCanvas}
        />
      </Suspense>

      {/* Film grain — the same static noise tile as Scene, so 3D and gradient
          surfaces share one photographic texture. */}
      <div
        aria-hidden
        className={css({
          position: 'absolute',
          inset: '-6%',
          pointerEvents: 'none',
          opacity: '0.05',
          mixBlendMode: 'overlay',
          backgroundRepeat: 'repeat',
          backgroundSize: '180px 180px',
          willChange: 'transform',
          animation: 'grainFlicker 9s steps(9) infinite',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none !important' },
        })}
        style={grainStyle}
      />

      {/* Legibility wash — content and glass float above a gently dimmed floor. */}
      <div
        className={css({
          position: 'absolute',
          inset: '0',
          pointerEvents: 'none',
          background:
            'linear-gradient(to bottom, rgba(5, 7, 18, 0.10) 0%, transparent 24%, transparent 58%, rgba(5, 7, 18, 0.42) 100%)',
        })}
      />

      {/* Daylight — washes the dark 3D sky to the airy morning canvas. */}
      <SceneLightWash />
    </div>
  )
}
