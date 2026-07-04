import { useEffect, useMemo, useRef, useState } from 'react'
import { css, cx } from 'styled-system/css'
import { useTheme } from '~/lib/theme'

/**
 * Scene — the immersive Calm ambient canvas.
 *
 * A full-bleed layered gradient sky (dusk · aurora · ocean · dawn), built from
 * several GPU-cheap depth cues so it reads as an atmosphere, not a flat CSS
 * gradient:
 *   1. base wash          — the sky gradient itself
 *   2. two mesh layers     — slow counter-drifting colour blooms (light)
 *   3. two cloud layers    — blurred organic blobs drifting independently
 *                            (texture) — a different silhouette than the
 *                            mesh's soft radial ellipses
 *   4. a top bloom          — a second, independently-drifting light source
 *   5. film grain           — a static SVG-turbulence tile, stepped not
 *                            tweened, so it never repaints continuously
 *   6. a two-part vignette  — a bottom legibility wash + a full radial edge
 *                            darken, so the frame reads as lit, not flat
 *
 * Everything animates `transform`/`opacity` only — nothing repaints per
 * frame, and blur is a static filter the compositor rasterizes once. When
 * the variant changes the previous sky lingers underneath and the new one
 * fades in — a calm cross-fade, no flash. `prefers-reduced-motion` freezes
 * every layer in place (a still, richly-textured frame, not a bare gradient).
 */

export type SceneVariant = 'dusk' | 'aurora' | 'ocean' | 'dawn' | 'forest'

/**
 * One Higgsfield nature photograph per scene variant — the interface itself,
 * Calm-style. Shown CRISP and full-bleed everywhere (home sky, content
 * cards, player); text legibility comes from scrims layered over the photo,
 * never from blurring it.
 */
export const VARIANT_IMAGE: Record<SceneVariant, string> = {
  dusk: '/scenes/dusk.webp',
  // aurora now has its own Higgsfield night-aurora lake shot (was borrowing dusk).
  aurora: '/scenes/aurora.webp',
  ocean: '/scenes/ocean.webp',
  dawn: '/scenes/dawn.webp',
  // Misty god-ray pine forest — the grounding scene for calm.
  forest: '/scenes/forest.webp',
}

interface SceneColors {
  base: string
  meshA: string
  meshB: string
  /** Organic blurred-blob "cloud" tints — the textured depth layer. */
  cloudA: string
  cloudB: string
  /** A soft top-of-frame light bloom — a second, independently-drifting light
   * source so the canvas reads as lit rather than a flat gradient. */
  bloom: string
}

const SCENES: Record<SceneVariant, SceneColors> = {
  dusk: {
    base: 'linear-gradient(172deg, #2B1E56 0%, #1E1B4B 34%, #151A3E 62%, #0E1230 100%)',
    meshA:
      'radial-gradient(ellipse 62% 48% at 22% 18%, rgba(139, 108, 246, 0.42) 0%, transparent 68%), radial-gradient(ellipse 55% 42% at 82% 8%, rgba(88, 60, 200, 0.38) 0%, transparent 66%)',
    meshB:
      'radial-gradient(ellipse 58% 46% at 74% 64%, rgba(64, 52, 168, 0.4) 0%, transparent 70%), radial-gradient(ellipse 46% 38% at 18% 86%, rgba(180, 130, 255, 0.16) 0%, transparent 64%)',
    cloudA: 'radial-gradient(circle, rgba(196, 181, 253, 0.16) 0%, transparent 72%)',
    cloudB: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 68%)',
    bloom: 'radial-gradient(ellipse 42% 30% at 50% 4%, rgba(210, 195, 255, 0.28) 0%, transparent 72%)',
  },
  aurora: {
    base: 'linear-gradient(168deg, #0B2E33 0%, #0F3D3E 30%, #11343F 58%, #0A1626 100%)',
    meshA:
      'radial-gradient(ellipse 64% 46% at 26% 14%, rgba(45, 212, 191, 0.34) 0%, transparent 66%), radial-gradient(ellipse 52% 40% at 80% 10%, rgba(52, 211, 153, 0.26) 0%, transparent 64%)',
    meshB:
      'radial-gradient(ellipse 60% 48% at 70% 62%, rgba(16, 128, 128, 0.38) 0%, transparent 70%), radial-gradient(ellipse 44% 36% at 14% 82%, rgba(110, 231, 183, 0.14) 0%, transparent 62%)',
    cloudA: 'radial-gradient(circle, rgba(110, 231, 183, 0.14) 0%, transparent 72%)',
    cloudB: 'radial-gradient(circle, rgba(255, 255, 255, 0.045) 0%, transparent 68%)',
    bloom: 'radial-gradient(ellipse 42% 30% at 50% 4%, rgba(180, 250, 235, 0.24) 0%, transparent 72%)',
  },
  ocean: {
    base: 'linear-gradient(174deg, #0C2A4D 0%, #0B2344 36%, #0A1B38 66%, #081226 100%)',
    meshA:
      'radial-gradient(ellipse 62% 46% at 24% 16%, rgba(56, 130, 220, 0.36) 0%, transparent 66%), radial-gradient(ellipse 54% 42% at 80% 8%, rgba(30, 90, 180, 0.34) 0%, transparent 64%)',
    meshB:
      'radial-gradient(ellipse 58% 48% at 72% 66%, rgba(24, 72, 140, 0.4) 0%, transparent 70%), radial-gradient(ellipse 46% 36% at 16% 84%, rgba(125, 211, 252, 0.12) 0%, transparent 62%)',
    cloudA: 'radial-gradient(circle, rgba(148, 197, 255, 0.14) 0%, transparent 72%)',
    cloudB: 'radial-gradient(circle, rgba(255, 255, 255, 0.045) 0%, transparent 68%)',
    bloom: 'radial-gradient(ellipse 42% 30% at 50% 4%, rgba(190, 225, 255, 0.26) 0%, transparent 72%)',
  },
  dawn: {
    base: 'linear-gradient(170deg, #4A2B3F 0%, #3D2547 30%, #27204A 62%, #121430 100%)',
    meshA:
      'radial-gradient(ellipse 62% 46% at 26% 16%, rgba(251, 146, 116, 0.30) 0%, transparent 66%), radial-gradient(ellipse 52% 40% at 78% 10%, rgba(240, 100, 120, 0.24) 0%, transparent 64%)',
    meshB:
      'radial-gradient(ellipse 58% 46% at 72% 62%, rgba(140, 80, 150, 0.34) 0%, transparent 70%), radial-gradient(ellipse 44% 36% at 16% 84%, rgba(253, 186, 116, 0.14) 0%, transparent 62%)',
    cloudA: 'radial-gradient(circle, rgba(253, 186, 116, 0.15) 0%, transparent 72%)',
    cloudB: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 68%)',
    bloom: 'radial-gradient(ellipse 42% 30% at 50% 4%, rgba(255, 214, 179, 0.26) 0%, transparent 72%)',
  },
  // Misty pine forest with warm god-rays — sage/teal greens, a soft sunlit
  // bloom from the top matching the photograph's light shafts.
  forest: {
    base: 'linear-gradient(172deg, #22332B 0%, #1B2E28 34%, #16282A 62%, #0C1A1C 100%)',
    meshA:
      'radial-gradient(ellipse 60% 48% at 44% 8%, rgba(196, 214, 168, 0.30) 0%, transparent 66%), radial-gradient(ellipse 50% 40% at 80% 14%, rgba(120, 180, 150, 0.22) 0%, transparent 64%)',
    meshB:
      'radial-gradient(ellipse 58% 46% at 66% 64%, rgba(52, 120, 96, 0.34) 0%, transparent 70%), radial-gradient(ellipse 44% 36% at 16% 84%, rgba(170, 205, 165, 0.12) 0%, transparent 62%)',
    cloudA: 'radial-gradient(circle, rgba(196, 224, 190, 0.14) 0%, transparent 72%)',
    cloudB: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 68%)',
    bloom: 'radial-gradient(ellipse 40% 32% at 52% 2%, rgba(238, 240, 210, 0.30) 0%, transparent 72%)',
  },
}

export const FADE_MS = 1400

/**
 * useCrossfade — keeps the previous value mounted beneath the incoming one
 * for `fadeMs`, so a value change (scene variant, nature photo) reads as a
 * calm cross-fade rather than a hard cut. Shared by `Scene`'s gradient sky
 * and `LivingScene`'s nature-photo layer.
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

// A single tileable film-grain texture — an SVG-turbulence noise square,
// generated once and reused everywhere. No network request, no per-frame
// cost: the browser rasterizes it once and only ever translates it.
const GRAIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">' +
  '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>' +
  '<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0"/></filter>' +
  '<rect width="100%" height="100%" filter="url(#n)"/></svg>'
export const GRAIN_URL = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`

const layerBase = css({
  position: 'absolute',
  inset: '-18%',
  pointerEvents: 'none',
  willChange: 'transform',
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none !important',
  },
})

// The "cloud" depth layer — blurred organic blobs, a different silhouette
// than the mesh's soft ellipses so the sky reads as textured, not just lit.
// `filter: blur()` is a static filter (never re-blurred per frame); only
// `transform` animates, so the compositor treats it as a cheap moving layer.
const cloudBase = css({
  position: 'absolute',
  pointerEvents: 'none',
  willChange: 'transform',
  mixBlendMode: 'screen',
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none !important',
  },
})

// ── the nature photograph — crisp, full-bleed, Calm-style ──────────────────
//
// The photo IS the interface now: zero blur, object-fit cover, a slow
// Ken-Burns drift (transform only, GPU cheap; static under reduced motion).
// Legibility is the scrims' job (below), never the photo's.
const photoLayer = css({
  position: 'absolute',
  // Explicit box, NOT `inset` shorthands: an absolutely-positioned replaced
  // element with only left+right set is over-constrained and keeps its
  // intrinsic width — the photo then fails to cover the frame. left/top +
  // width/height pins it deterministically, with 12% overscan as Ken-Burns
  // headroom so the drift never exposes an edge.
  left: '-6%',
  top: '-6%',
  width: '112%',
  height: '112%',
  // Panda's reset caps img at max-inline-size 100% — lift it or the 112%
  // overscan silently clamps and the photo stops short of the right edge.
  maxWidth: 'none',
  pointerEvents: 'none',
  objectFit: 'cover',
  willChange: 'transform',
  filter: 'saturate(1.06)',
  animation: 'sceneKenBurns 74s ease-in-out infinite alternate',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none !important' },
})

// ── Calm's signature scrims ─────────────────────────────────────────────────
//
// A vertical gradient from (near-)transparent into deep navy: white text sits
// on the dark end while the photo stays clearly visible everywhere else.
// `canvas` — immersive surfaces (player, hero): lightest mid-band, deep
//            bottom third. `page` — browsable tabs where arbitrary text
//            scrolls over the photo: a steadier base dim. `card` — tiles:
//            bottom-only.
export const CALM_SCRIM_CANVAS =
  'linear-gradient(to bottom, rgba(6, 16, 38, 0.55) 0%, rgba(6, 16, 38, 0.28) 18%, rgba(6, 16, 38, 0.18) 40%, rgba(6, 16, 38, 0.28) 58%, rgba(6, 16, 38, 0.62) 78%, rgba(6, 16, 38, 0.88) 100%)'

export const CALM_SCRIM_PAGE =
  'linear-gradient(to bottom, rgba(6, 16, 38, 0.60) 0%, rgba(6, 16, 38, 0.44) 20%, rgba(6, 16, 38, 0.42) 55%, rgba(6, 16, 38, 0.66) 78%, rgba(6, 16, 38, 0.90) 100%)'

export const CALM_SCRIM_CARD =
  'linear-gradient(to bottom, rgba(6, 16, 38, 0.14) 0%, rgba(6, 16, 38, 0) 26%, rgba(6, 16, 38, 0) 44%, rgba(6, 16, 38, 0.54) 72%, rgba(6, 16, 38, 0.88) 100%)'

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

/** The crisp nature-photo layer, shared by `Scene`'s sky and `LivingScene`'s
 * 3D world so both surfaces carry the same clearly-visible landscape. */
export function NaturePhoto({ variant, className }: NaturePhotoProps) {
  return (
    <div
      aria-hidden
      className={cx(
        css({ position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' }),
        className,
      )}
    >
      <img aria-hidden alt="" loading="lazy" decoding="async" src={VARIANT_IMAGE[variant]} className={photoLayer} />
    </div>
  )
}

function Sky({ variant, entering }: { variant: SceneVariant; entering: boolean }) {
  const colors = SCENES[variant]
  return (
    <div
      aria-hidden
      className={css({
        position: 'absolute',
        inset: '0',
        overflow: 'hidden',
      })}
      style={{
        opacity: entering ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
      {/* The landscape itself — crisp, full-bleed, clearly visible. */}
      <NaturePhoto variant={variant} />

      {/* A whisper of living atmosphere over the photo — the old gradient
          sky at very low opacity so the frame still breathes, without ever
          obscuring the landscape. */}
      <div aria-hidden className={css({ position: 'absolute', inset: '0', opacity: '0.22', pointerEvents: 'none' })}>
        <div
          className={cx(
            layerBase,
            css({ animation: 'sceneDriftA 70s ease-in-out infinite alternate' }),
          )}
          style={{ backgroundImage: colors.meshA }}
        />
        <div
          className={cx(
            layerBase,
            css({ animation: 'sceneDriftB 90s ease-in-out infinite alternate-reverse' }),
          )}
          style={{ backgroundImage: colors.meshB }}
        />
        <div
          aria-hidden
          className={cx(
            cloudBase,
            css({
              width: '78%',
              height: '58%',
              top: '-14%',
              left: '-18%',
              borderRadius: '42% 58% 63% 37% / 41% 46% 54% 59%',
              filter: 'blur(64px)',
              animation: 'cloudDriftA 130s ease-in-out infinite alternate',
            }),
          )}
          style={{ backgroundImage: colors.cloudA }}
        />
        <div
          aria-hidden
          className={cx(
            layerBase,
            css({ animation: 'sceneBloom 26s ease-in-out infinite alternate' }),
          )}
          style={{ backgroundImage: colors.bloom, mixBlendMode: 'screen' }}
        />
      </div>
    </div>
  )
}

/**
 * SceneLightWash — the Daylight overlay. The immersive scenes are painted for
 * the dark canvas (deep indigo/ocean gradients); under Daylight this full-bleed
 * wash floats above them and blooms the airy off-white canvas, keeping only a
 * faint ghost of the living motion plus a soft accent glow at the top. Renders
 * nothing in dark mode. Shared by both `Scene` (CSS sky) and `LivingScene` (3D).
 */
export function SceneLightWash() {
  const light = useTheme() === 'light'
  if (!light) return null
  return (
    <div
      aria-hidden
      className={css({ position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '1' })}
      style={{
        opacity: 0.9,
        background:
          'radial-gradient(ellipse 130% 74% at 50% -10%, color-mix(in oklab, var(--scene-accent) 22%, var(--colors-base)) 0%, var(--colors-base) 54%), var(--colors-base)',
      }}
    />
  )
}

export interface SceneProps {
  variant?: SceneVariant
  className?: string
  /** Scrim shape: `canvas` for full-page surfaces (soft top wash + deep
   * bottom third), `card` for tiles (bottom-only), `none` to opt out. */
  scrim?: SceneScrim
  /** Whether the Daylight (light-theme) wash may render. Immersive,
   * always-dark surfaces (player, hero card, tiles) pass false. */
  daylight?: boolean
}

export function Scene({ variant = 'dusk', className, scrim = 'canvas', daylight = true }: SceneProps) {
  // Cross-fade: keep the previous sky mounted beneath the incoming one.
  const { items: skies, fading } = useCrossfade(variant)
  // Grain is scene-agnostic — computed once, reused across every variant.
  const grainStyle = useMemo(
    () => ({ backgroundImage: GRAIN_URL }),
    [],
  )

  return (
    <div
      aria-hidden
      className={cx(
        css({ position: 'absolute', inset: '0', overflow: 'hidden', zIndex: '0' }),
        className,
      )}
    >
      {skies.map((sky) => (
        <Sky key={sky.id} variant={sky.value} entering={fading === sky.id} />
      ))}

      {/* Film grain — a static noise tile, stepped (not tweened) so it never
          repaints continuously; breaks up the gradient's smoothness so the
          scene reads as photographic texture rather than flat CSS. */}
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

      {/* Soft edge vignette — a light photographic frame, never a blackout. */}
      <div
        className={css({
          position: 'absolute',
          inset: '0',
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 128% 88% at 50% 40%, transparent 60%, rgba(4, 6, 16, 0.22) 100%)',
        })}
      />

      {/* Calm's signature scrim — transparent over the landscape, deep navy
          where the text lives. This is what protects contrast, not blur. */}
      {scrim !== 'none' && (
        <div
          aria-hidden
          className={css({ position: 'absolute', inset: '0', pointerEvents: 'none' })}
          style={{ background: SCRIM_GRADIENT[scrim] }}
        />
      )}

      {/* Daylight — washes the dark sky to the airy morning canvas (browsable
          chrome only; immersive scene surfaces opt out and stay dark). */}
      {daylight && <SceneLightWash />}
    </div>
  )
}
