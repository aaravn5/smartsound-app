import { useEffect, useRef, useState, type ReactNode } from 'react'
import { css, cx } from 'styled-system/css'
import { useTheme } from '~/lib/theme'

/**
 * Scene — the ambient canvas, reskinned to the flat Desktop.fm world.
 *
 * The whole app is now one calming light-grey surface (#f1f2f3). The old
 * immersive layered sky (dark gradients, nature photos, film grain, deep
 * navy vignette + scrims) is gone: every surface here renders the flat light
 * canvas with, at most, a whisper of the single calming-blue accent. The
 * public API is unchanged so every caller keeps working — only the pixels
 * changed.
 */

export type SceneVariant = 'dusk' | 'aurora' | 'ocean' | 'dawn' | 'forest'

// ── the flat light canvas ────────────────────────────────────────────────────
const CANVAS_BASE = '#f1f2f3'
const CANVAS_DEEPER = '#eaebed'
const SIGNAL = '#5872e6'

/**
 * Legacy scene-photo path map — kept for API compatibility. Nothing renders
 * these anymore (the flat canvas has no photographs), but external callers may
 * still import the map.
 */
export const VARIANT_IMAGE: Record<SceneVariant, string> = {
  dusk: '/scenes/dusk.webp',
  aurora: '/scenes/aurora.webp',
  ocean: '/scenes/ocean.webp',
  dawn: '/scenes/dawn.webp',
  forest: '/scenes/forest.webp',
}

/** Legacy per-variant video map — empty; the flat canvas has no loops. */
export const VARIANT_VIDEO: Partial<Record<SceneVariant, string>> = {}

/** True when the OS asks for reduced motion. */
export function prefersStillScene(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// ~1200ms cross-fade, still used by LivingScene's variant swaps.
export const FADE_MS = 1200

/**
 * useCrossfade — keeps the previous value mounted beneath the incoming one for
 * `fadeMs`, so a value change reads as a calm cross-fade rather than a hard
 * cut. Retained unchanged for LivingScene.
 */
export function useCrossfade<T>(value: T, fadeMs = FADE_MS) {
  const [items, setItems] = useState<{ value: T; id: number }[]>([{ value, id: 0 }])
  const [fading, setFading] = useState<number | null>(null)
  const nextId = useRef(1)

  useEffect(() => {
    setItems((prev) => {
      if (prev[prev.length - 1]?.value === value) return prev
      const id = nextId.current++
      setFading(id)
      return [...prev.slice(-1), { value, id }]
    })
  }, [value])

  useEffect(() => {
    if (fading === null) return
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setFading(null)))
    const timer = window.setTimeout(() => {
      setItems((prev) => prev.slice(-1))
    }, fadeMs + 100)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [fading, fadeMs])

  return { items, fading }
}

// Film grain is retired on the flat canvas — GRAIN_URL is now a fully
// transparent tile so any lingering consumer paints nothing.
const GRAIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">' +
  '<rect width="100%" height="100%" fill="rgba(0,0,0,0)"/></svg>'
export const GRAIN_URL = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`

// ── scrims ───────────────────────────────────────────────────────────────────
//
// The signature deep-navy legibility scrims are retired: on the flat light
// canvas there is no imagery to protect text from, and contrast comes from the
// (light) design tokens. These are now near-invisible light washes so every
// consumer degrades gracefully to "no scrim".
export const CALM_SCRIM_CANVAS =
  'linear-gradient(to bottom, rgba(241,242,243,0) 0%, rgba(234,235,237,0.28) 100%)'

export const CALM_SCRIM_PAGE =
  'linear-gradient(to bottom, rgba(241,242,243,0) 0%, rgba(234,235,237,0.22) 100%)'

export const CALM_SCRIM_CARD =
  'linear-gradient(to bottom, rgba(241,242,243,0) 60%, rgba(234,235,237,0.24) 100%)'

export type SceneScrim = 'canvas' | 'page' | 'card' | 'none'

const SCRIM_GRADIENT: Record<Exclude<SceneScrim, 'none'>, string> = {
  canvas: CALM_SCRIM_CANVAS,
  page: CALM_SCRIM_PAGE,
  card: CALM_SCRIM_CARD,
}

export interface NaturePhotoProps {
  variant: SceneVariant
  className?: string
}

const videoLayer = css({
  position: 'absolute',
  left: '0',
  top: '0',
  width: '100%',
  height: '100%',
  maxWidth: 'none',
  pointerEvents: 'none',
  objectFit: 'cover',
})

/** Ambient scene loop — retained for API compatibility (muted, looping,
 * paused when hidden). Nothing in the flat canvas mounts one. */
export function SceneVideo({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const onVisibility = () => {
      const v = ref.current
      if (!v) return
      if (document.hidden) v.pause()
      else void v.play().catch(() => undefined)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])
  return (
    <video
      ref={ref}
      aria-hidden
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      disablePictureInPicture
      className={cx(videoLayer, className)}
    />
  )
}

/**
 * NaturePhoto — was the crisp full-bleed landscape; now simply the flat
 * calming-grey canvas. No photograph, no procedural landscape, no Ken-Burns.
 * The signature is unchanged so every caller keeps rendering, just flat.
 */
export function NaturePhoto({ variant: _variant, className }: NaturePhotoProps): ReactNode {
  return (
    <div
      aria-hidden
      className={cx(
        css({ position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' }),
        className,
      )}
      style={{ background: CANVAS_BASE }}
    />
  )
}

/**
 * SceneLightWash — the airy off-white bloom. On the flat canvas it is simply
 * the light base plus a faint calming-blue glow at the top of frame. Renders
 * nothing outside light mode.
 */
export function SceneLightWash() {
  const light = useTheme() === 'light'
  if (!light) return null
  return (
    <div
      aria-hidden
      className={css({ position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '1' })}
      style={{
        background:
          `radial-gradient(ellipse 130% 74% at 50% -10%, color-mix(in oklab, ${SIGNAL} 14%, ${CANVAS_BASE}) 0%, ${CANVAS_BASE} 56%), ${CANVAS_BASE}`,
      }}
    />
  )
}

export interface SceneProps {
  variant?: SceneVariant
  className?: string
  /** Scrim shape — near-invisible light washes now; `none` opts out. */
  scrim?: SceneScrim
  /** Kept for API compatibility; the canvas is always the flat light world. */
  daylight?: boolean
}

export function Scene({ className, scrim = 'canvas' }: SceneProps) {
  return (
    <div
      aria-hidden
      className={cx(
        css({ position: 'absolute', inset: '0', overflow: 'hidden', zIndex: '0' }),
        className,
      )}
    >
      {/* The flat calming-grey canvas with a faint top calming-blue bloom. */}
      <div
        className={css({ position: 'absolute', inset: '0', pointerEvents: 'none' })}
        style={{
          background:
            `radial-gradient(ellipse 132% 72% at 50% -12%, color-mix(in oklab, ${SIGNAL} 10%, ${CANVAS_BASE}) 0%, ${CANVAS_BASE} 58%), ${CANVAS_BASE}`,
        }}
      />

      {/* A whisper of a deeper-grey grounding wash at the bottom. */}
      <div
        className={css({ position: 'absolute', inset: '0', pointerEvents: 'none' })}
        style={{
          background: `linear-gradient(to bottom, ${CANVAS_BASE}00 62%, ${CANVAS_DEEPER}40 100%)`,
        }}
      />

      {scrim !== 'none' && (
        <div
          aria-hidden
          className={css({ position: 'absolute', inset: '0', pointerEvents: 'none' })}
          style={{ background: SCRIM_GRADIENT[scrim] }}
        />
      )}
    </div>
  )
}
