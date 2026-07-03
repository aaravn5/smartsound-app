import { useEffect, useRef, useState } from 'react'
import { css, cx } from 'styled-system/css'

/**
 * Scene — the immersive Calm ambient canvas.
 *
 * A full-bleed layered gradient sky (dusk · aurora · ocean · dawn) with two
 * slow counter-drifting color-mesh layers. GPU-friendly: the drift animates
 * `transform` only on oversized layers; nothing repaints. When the variant
 * changes the previous sky lingers underneath and the new one fades in — a
 * calm cross-fade, no flash. `prefers-reduced-motion` renders a static sky.
 */

export type SceneVariant = 'dusk' | 'aurora' | 'ocean' | 'dawn'

interface SceneColors {
  base: string
  meshA: string
  meshB: string
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
    bloom: 'radial-gradient(ellipse 42% 30% at 50% 4%, rgba(210, 195, 255, 0.28) 0%, transparent 72%)',
  },
  aurora: {
    base: 'linear-gradient(168deg, #0B2E33 0%, #0F3D3E 30%, #11343F 58%, #0A1626 100%)',
    meshA:
      'radial-gradient(ellipse 64% 46% at 26% 14%, rgba(45, 212, 191, 0.34) 0%, transparent 66%), radial-gradient(ellipse 52% 40% at 80% 10%, rgba(52, 211, 153, 0.26) 0%, transparent 64%)',
    meshB:
      'radial-gradient(ellipse 60% 48% at 70% 62%, rgba(16, 128, 128, 0.38) 0%, transparent 70%), radial-gradient(ellipse 44% 36% at 14% 82%, rgba(110, 231, 183, 0.14) 0%, transparent 62%)',
    bloom: 'radial-gradient(ellipse 42% 30% at 50% 4%, rgba(180, 250, 235, 0.24) 0%, transparent 72%)',
  },
  ocean: {
    base: 'linear-gradient(174deg, #0C2A4D 0%, #0B2344 36%, #0A1B38 66%, #081226 100%)',
    meshA:
      'radial-gradient(ellipse 62% 46% at 24% 16%, rgba(56, 130, 220, 0.36) 0%, transparent 66%), radial-gradient(ellipse 54% 42% at 80% 8%, rgba(30, 90, 180, 0.34) 0%, transparent 64%)',
    meshB:
      'radial-gradient(ellipse 58% 48% at 72% 66%, rgba(24, 72, 140, 0.4) 0%, transparent 70%), radial-gradient(ellipse 46% 36% at 16% 84%, rgba(125, 211, 252, 0.12) 0%, transparent 62%)',
    bloom: 'radial-gradient(ellipse 42% 30% at 50% 4%, rgba(190, 225, 255, 0.26) 0%, transparent 72%)',
  },
  dawn: {
    base: 'linear-gradient(170deg, #4A2B3F 0%, #3D2547 30%, #27204A 62%, #121430 100%)',
    meshA:
      'radial-gradient(ellipse 62% 46% at 26% 16%, rgba(251, 146, 116, 0.30) 0%, transparent 66%), radial-gradient(ellipse 52% 40% at 78% 10%, rgba(240, 100, 120, 0.24) 0%, transparent 64%)',
    meshB:
      'radial-gradient(ellipse 58% 46% at 72% 62%, rgba(140, 80, 150, 0.34) 0%, transparent 70%), radial-gradient(ellipse 44% 36% at 16% 84%, rgba(253, 186, 116, 0.14) 0%, transparent 62%)',
    bloom: 'radial-gradient(ellipse 42% 30% at 50% 4%, rgba(255, 214, 179, 0.26) 0%, transparent 72%)',
  },
}

const FADE_MS = 1400

const layerBase = css({
  position: 'absolute',
  inset: '-18%',
  pointerEvents: 'none',
  willChange: 'transform',
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none !important',
  },
})

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
        backgroundImage: colors.base,
        opacity: entering ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
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
      {/* Second light source — a soft top bloom so the sky reads as lit, not flat. */}
      <div
        aria-hidden
        className={cx(
          layerBase,
          css({ animation: 'sceneBloom 26s ease-in-out infinite alternate' }),
        )}
        style={{ backgroundImage: colors.bloom, mixBlendMode: 'screen' }}
      />
    </div>
  )
}

export interface SceneProps {
  variant?: SceneVariant
  className?: string
}

export function Scene({ variant = 'dusk', className }: SceneProps) {
  // Cross-fade: keep the previous sky mounted beneath the incoming one.
  const [skies, setSkies] = useState<{ variant: SceneVariant; id: number }[]>([
    { variant, id: 0 },
  ])
  const [fading, setFading] = useState<number | null>(null)
  const nextId = useRef(1)

  useEffect(() => {
    setSkies((prev) => {
      if (prev[prev.length - 1]?.variant === variant) return prev
      const id = nextId.current++
      setFading(id)
      return [...prev.slice(-1), { variant, id }]
    })
  }, [variant])

  useEffect(() => {
    if (fading === null) return
    // Two rafs arm the opacity transition, then retire the old sky.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setFading(null)))
    const timer = window.setTimeout(() => {
      setSkies((prev) => prev.slice(-1))
    }, FADE_MS + 100)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [fading])

  return (
    <div
      aria-hidden
      className={cx(
        css({ position: 'absolute', inset: '0', overflow: 'hidden', zIndex: '0' }),
        className,
      )}
    >
      {skies.map((sky) => (
        <Sky key={sky.id} variant={sky.variant} entering={fading === sky.id} />
      ))}
      {/* Legibility vignette — content and glass float above a gently dimmed floor. */}
      <div
        className={css({
          position: 'absolute',
          inset: '0',
          pointerEvents: 'none',
          background:
            'linear-gradient(to bottom, rgba(5, 7, 18, 0.10) 0%, transparent 24%, transparent 58%, rgba(5, 7, 18, 0.42) 100%)',
        })}
      />
    </div>
  )
}
