import { css, cx } from 'styled-system/css'
import PALETTES from './procedural-palettes.json'
import type { NatureSceneId } from '~/lib/nature-assets'

/**
 * ProceduralScene — the bottom of the nature asset ladder: a fully code-drawn,
 * animated landscape per mode family (no rendered assets at all), built to
 * look intentional rather than like a fallback. Four families across five
 * ids (winddown and sleep are dusk/deep-night variants of the lake family).
 *
 * GPU budget: every animated layer moves with transform-only keyframes that
 * already exist in the design system (sceneDriftA/B, cloudDriftA/B,
 * sceneBloom), blurs are static filters rasterized once, and there is no
 * per-frame JavaScript. Under prefers-reduced-motion everything freezes into
 * a still matte painting. Palettes live in procedural-palettes.json, shared
 * with scripts/contrast-audit.mjs so the audited colors are the rendered
 * colors.
 */

type Palette = (typeof PALETTES)[NatureSceneId]

// ── ridge silhouettes — hand-authored, angular (forest/canyon) + rolling
//    (meadow/lake shore) variants. viewBox 0 0 1200 240, drawn to be safely
//    clipped at the frame's bottom edge.
const ANGULAR_RIDGES = [
  'M0 140 L80 96 L180 122 L300 70 L430 118 L560 84 L700 120 L830 78 L960 112 L1080 88 L1200 116 L1200 240 L0 240 Z',
  'M0 160 L110 118 L240 150 L390 100 L540 146 L700 108 L860 148 L1010 116 L1200 142 L1200 240 L0 240 Z',
  'M0 186 L150 148 L330 176 L520 138 L720 172 L900 144 L1080 170 L1200 152 L1200 240 L0 240 Z',
]

const ROLLING_RIDGES = [
  'M0 132 Q 160 92 340 118 T 680 104 T 980 118 T 1200 100 L1200 240 L0 240 Z',
  'M0 158 Q 180 126 380 148 T 740 136 T 1200 146 L1200 240 L0 240 Z',
  'M0 188 Q 200 158 420 176 T 820 168 T 1200 176 L1200 240 L0 240 Z',
]

/** Deterministic jagged pine treeline (sin-hashed, no randomness). */
function buildTreeline(): string {
  const parts: string[] = ['M0 200']
  for (let x = 0; x <= 1200; x += 20) {
    const h = 152 + Math.round(Math.abs(Math.sin(x * 0.71) * 34 + Math.sin(x * 0.173) * 18))
    parts.push(`L${x} ${x % 40 === 0 ? h : 206}`)
  }
  parts.push('L1200 240 L0 240 Z')
  return parts.join(' ')
}
const TREELINE = buildTreeline()

/** Sparse deterministic star field (SVG data URI, static). */
const STARS_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200">' +
  [37, 91, 143, 201, 268, 302, 64, 176, 240, 118]
    .map((x, i) => {
      const y = 12 + ((x * 7 + i * 31) % 120)
      const r = i % 3 === 0 ? 1.1 : 0.7
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(226,232,255,${i % 2 ? 0.5 : 0.3})"/>`
    })
    .join('') +
  '</svg>'
const STARS_URL = `url("data:image/svg+xml,${encodeURIComponent(STARS_SVG)}")`

const layer = css({
  position: 'absolute',
  inset: '0',
  pointerEvents: 'none',
})

// Ridges overscan the frame (112%) so their slow drift never exposes edges.
const ridgeBox = css({
  position: 'absolute',
  left: '-6%',
  width: '112%',
  bottom: '0',
  pointerEvents: 'none',
  willChange: 'transform',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none !important' },
})

const mistBase = css({
  position: 'absolute',
  pointerEvents: 'none',
  borderRadius: '48% 52% 60% 40% / 44% 48% 52% 56%',
  filter: 'blur(58px)',
  mixBlendMode: 'screen',
  willChange: 'transform',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none !important' },
})

function Ridge({
  path,
  fill,
  height,
  animation,
}: {
  path: string
  fill: string
  height: string
  animation: string
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 240"
      preserveAspectRatio="none"
      className={ridgeBox}
      style={{ height, animation }}
    >
      <path d={path} fill={fill} />
    </svg>
  )
}

export interface ProceduralSceneProps {
  id: NatureSceneId
  className?: string
}

export function ProceduralScene({ id, className }: ProceduralSceneProps) {
  const p: Palette = PALETTES[id]
  const ridgePaths = id === 'calm' || id === 'winddown' || id === 'sleep' ? ROLLING_RIDGES : ANGULAR_RIDGES

  return (
    <div
      aria-hidden
      className={cx(css({ position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' }), className)}
      data-procedural-scene={id}
    >
      {/* Sky */}
      <div
        className={layer}
        style={{ background: `linear-gradient(to bottom, ${p.sky[0]} 0%, ${p.sky[1]} 52%, ${p.sky[2]} 100%)` }}
      />

      {/* Star field (deep-night lake only) */}
      {p.stars && (
        <div
          className={layer}
          style={{
            backgroundImage: STARS_URL,
            backgroundRepeat: 'repeat',
            backgroundSize: '320px 200px',
            height: '52%',
            opacity: 0.8,
          }}
        />
      )}

      {/* Horizon glow — the family's light source, breathing very slowly. */}
      <div
        className={cx(
          layer,
          css({
            mixBlendMode: 'screen',
            willChange: 'transform',
            animation: 'sceneBloom 30s ease-in-out infinite alternate',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none !important' },
          }),
        )}
        style={{ background: `radial-gradient(ellipse 74% 34% at 50% 58%, ${p.glow} 0%, transparent 70%)` }}
      />

      {/* Terrain — three parallax silhouette layers, far to near. */}
      <Ridge path={ridgePaths[0]} fill={p.ridges[0]} height="46%" animation="sceneDriftA 150s ease-in-out infinite alternate" />
      <Ridge path={ridgePaths[1]} fill={p.ridges[1]} height="36%" animation="sceneDriftB 110s ease-in-out infinite alternate-reverse" />
      {p.treeline && (
        <Ridge path={TREELINE} fill={p.ridges[1]} height="40%" animation="sceneDriftB 130s ease-in-out infinite alternate" />
      )}
      <Ridge path={ridgePaths[2]} fill={p.ridges[2]} height="27%" animation="sceneDriftA 90s ease-in-out infinite alternate-reverse" />

      {/* Water — lake/river families: a still band holding the sky's sheen. */}
      {p.water && (
        <div
          className={css({ position: 'absolute', insetX: '0', bottom: '0', height: '22%', pointerEvents: 'none' })}
          style={{
            background: `linear-gradient(to bottom, ${p.water.sheen} 0%, ${p.water.base} 34%, ${p.bottom} 100%)`,
          }}
        />
      )}

      {/* Drifting mist — two blurred, screen-blended banks. */}
      <div
        className={cx(mistBase, css({ animation: 'cloudDriftA 120s ease-in-out infinite alternate' }))}
        style={{ width: '72%', height: '34%', left: '-12%', bottom: '6%', background: `radial-gradient(circle, ${p.mist[0]} 0%, transparent 70%)` }}
      />
      <div
        className={cx(mistBase, css({ animation: 'cloudDriftB 150s ease-in-out infinite alternate-reverse' }))}
        style={{ width: '64%', height: '30%', right: '-10%', bottom: '14%', background: `radial-gradient(circle, ${p.mist[1]} 0%, transparent 68%)` }}
      />
    </div>
  )
}
