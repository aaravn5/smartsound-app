import type { ReactNode } from 'react'
import { css } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'

/**
 * Serene screen scaffolding for the Calm shell — a large HIG title with an
 * unhurried entrance, and a Liquid Glass empty state used by the placeholder
 * tabs until their real content lands.
 */

export function ScreenTitle({ title, caption }: { title: string; caption?: string }) {
  return (
    <header
      className={css({
        mb: '7',
        animation: 'fadeUp token(durations.calm) token(easings.enter) both',
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      })}
    >
      {caption && (
        <p
          className={css({
            m: '0',
            mb: '1',
            fontSize: 'footnote',
            fontWeight: '600',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'faint',
            textShadow: 'var(--ss-text-glow)',
          })}
        >
          {caption}
        </p>
      )}
      <h1
        className={css({
          m: '0',
          fontFamily: 'display',
          fontSize: 'largeTitle',
          fontWeight: '500',
          letterSpacing: '-0.015em',
          lineHeight: '1.12',
          color: 'text',
          textShadow: 'var(--ss-text-glow)',
        })}
      >
        {title}
      </h1>
    </header>
  )
}

export function GlassEmptyState({
  icon,
  title,
  message,
}: {
  icon: ReactNode
  title: string
  message: string
}) {
  return (
    <LiquidGlass
      variant="card"
      className={css({
        animation: 'fadeUp token(durations.calm) token(easings.enter) 120ms both',
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      })}
    >
      <div
        className={css({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '3',
          px: '7',
          py: '12',
        })}
      >
        <span
          aria-hidden
          className={css({
            display: 'grid',
            placeItems: 'center',
            width: '56px',
            height: '56px',
            borderRadius: 'full',
            color: 'accent',
            background: 'accentSoft',
            lineHeight: '0',
            mb: '1',
          })}
        >
          {icon}
        </span>
        <h2
          className={css({
            m: '0',
            fontFamily: 'display',
            fontSize: 'title3',
            fontWeight: '600',
            letterSpacing: '-0.01em',
            color: 'text',
          })}
        >
          {title}
        </h2>
        <p
          className={css({
            m: '0',
            maxW: '34ch',
            fontSize: 'subhead',
            lineHeight: '1.55',
            color: 'muted',
          })}
        >
          {message}
        </p>
      </div>
    </LiquidGlass>
  )
}
