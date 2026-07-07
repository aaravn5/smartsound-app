import type { CSSProperties, ReactNode } from 'react'
import { css, cx } from 'styled-system/css'

/**
 * Card — the Pressed-at-Night surface, evolved: Midnight Slate, continuous
 * 16px corners, a 0.5px starlight hairline, and Apple/Calm-style SOFT depth
 * (a low-opacity two-layer shadow — never harsh). Interactive cards still
 * brighten toward Graphite on hover; elevation stays mostly light.
 *
 * `glass` — the frosted variant for cards floating over live content (the
 * player's generative field): frost fill + backdrop blur instead of a solid.
 */

const cardCss = css({
  background: 'midnightSlate',
  border: '0.5px solid',
  borderColor: 'frost.stroke',
  borderRadius: 'card',
  boxShadow: 'soft',
})

export function Card({
  children,
  className,
  style,
  glass = false,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  glass?: boolean
}) {
  return (
    <div className={cx(glass ? glassCss : cardCss, css({ borderRadius: 'card' }), className)} style={style}>
      {children}
    </div>
  )
}

/**
 * glassCss — the frosted-glass material (Apple materials · Calm depth).
 * For the bottom nav, floating/overlay surfaces, toasts, sticky headers and
 * anything hovering over live content. Pair with a radius; the fill carries
 * its own 0.5px hairline. Degrades to a near-opaque slate where
 * backdrop-filter is unsupported or transparency is reduced. The blur pair
 * itself lives in `.ss-frost` (index.css — Panda typings lack the -webkit
 * prefix), composed here so consumers only ever reach for glassCss.
 */
export const glassCss = cx(
  css({
    background: 'frost.fill',
    border: '0.5px solid',
    borderColor: 'frost.stroke',
    boxShadow: 'soft',
    '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
      background: 'frost.fallback',
    },
    '@media (prefers-reduced-transparency: reduce)': {
      background: 'frost.fallback',
    },
  }),
  'ss-frost',
)

/** design.md chip: Graphite bg, Silver text; active = Starlight + Lead border.
 * Never white-filled. Shared by Today's filters and The Library. */
export const chipCss = css({
  px: '4',
  py: '2',
  borderRadius: 'pill',
  border: '0.5px solid transparent',
  background: 'graphite',
  font: 'inherit',
  fontSize: 'bodySm',
  fontWeight: '500',
  color: 'silver',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition:
    'background 300ms cubic-bezier(0.16, 1, 0.3, 1), color 300ms ease, border-color 300ms ease, transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  _hover: { background: '#2d2d3d' },
  _active: { transform: 'scale(0.96)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
})

export const chipActiveCss = css({
  color: 'starlight',
  borderColor: 'lead',
})

/**
 * AuroraBackdrop — the soft ethereal page glow (Calm/Endel): two faint
 * radial blooms (mercury-tinted, ≤6% opacity) drifting VERY slowly over the
 * Deep Space base. Purely decorative; frozen under prefers-reduced-motion.
 * Parent needs position: relative/fixed; content should sit above zIndex 0.
 */
const auroraLayerCss = css({
  position: 'absolute',
  inset: '-20%',
  pointerEvents: 'none',
  willChange: 'transform, opacity',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
})

export function AuroraBackdrop() {
  return (
    <div aria-hidden className={css({ position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' })}>
      <div
        className={cx(
          auroraLayerCss,
          css({
            background:
              'radial-gradient(ellipse 46% 34% at 24% 12%, rgba(82, 102, 235, 0.06) 0%, transparent 70%)',
            animation: 'auroraDriftA 46s ease-in-out infinite',
          }),
        )}
      />
      <div
        className={cx(
          auroraLayerCss,
          css({
            background:
              'radial-gradient(ellipse 40% 30% at 78% 82%, rgba(205, 221, 255, 0.045) 0%, transparent 70%)',
            animation: 'auroraDriftB 58s ease-in-out infinite',
          }),
        )}
      />
    </div>
  )
}
