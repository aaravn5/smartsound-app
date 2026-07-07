import type { ReactNode } from 'react'
import { css, cx } from 'styled-system/css'

/**
 * AppWindowCard — the single elevated surface of the Desktop.fm hero: a macOS
 * window mockup framing the brand wordmark and the one black CTA. White card
 * on the grey canvas, 25px radius (the largest in the system), a title bar
 * with three traffic-light dots and a hairline divider, and a carbon-black
 * lozenge button with a trailing chevron. This is the page's only stacked
 * contrast moment — black on white on grey.
 */

const dot = (bg: string) =>
  css.raw({ width: '11px', height: '11px', borderRadius: 'full', background: bg })

export function AppWindowCard({
  wordmark = 'SmartSound',
  cta,
  onCta,
  className,
}: {
  wordmark?: string
  cta: string
  onCta: () => void
  className?: string
}) {
  return (
    <div
      className={cx(
        css({
          width: '224px',
          background: 'bg', // pure white card surface
          borderRadius: 'card', // 25px
          boxShadow: 'soft',
          p: '2.5', // 10px
          display: 'flex',
          flexDirection: 'column',
          gap: '3',
        }),
        className,
      )}
    >
      {/* Title bar — traffic lights + hairline divider. */}
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '1.5',
          pb: '2',
          borderBottom: '2px solid',
          borderColor: 'lead',
        })}
        aria-hidden
      >
        <span className={css(dot('#dddddd'))} />
        <span className={css(dot('#c9c9cd'))} />
        <span className={css(dot('#b4b4b4'))} />
      </div>

      {/* Brand wordmark — 28px, weight 800, tight tracking, carbon black. */}
      <div
        className={css({
          textAlign: 'center',
          fontSize: '28px',
          fontWeight: '800',
          letterSpacing: '-0.036em',
          lineHeight: '1.25',
          color: 'text',
          pt: '1',
        })}
      >
        {wordmark}
      </div>

      {/* The one CTA — carbon-black lozenge, white label, trailing chevron. */}
      <button
        type="button"
        onClick={onCta}
        className={css({
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5',
          width: 'full',
          py: '2.5',
          px: '5',
          borderRadius: 'pill', // lozenge
          border: 'none',
          background: 'accent', // Carbon Black — the single filled action
          color: 'bg', // white text
          fontSize: '12px',
          fontWeight: '800',
          letterSpacing: '0.02em',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          transition: 'transform 160ms ease, opacity 200ms ease',
          _hover: { opacity: '0.92' },
          _active: { transform: 'scale(0.97)' },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
        })}
      >
        {cta}
        <Chevron />
      </button>
    </div>
  )
}

/** Trailing › affordance — heavy system weight renders as a solid glyph. */
function Chevron(): ReactNode {
  return (
    <span className={css({ fontSize: '12px', fontWeight: '800', lineHeight: '1' })} aria-hidden>
      ›
    </span>
  )
}
