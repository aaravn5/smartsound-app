import type { CSSProperties, ReactNode } from 'react'
import { css, cx } from 'styled-system/css'

/**
 * Card — the Pressed-at-Night surface: Midnight Slate, 4px radius, Lead
 * hairline. Elevation is light, not shadow — interactive cards brighten to
 * Graphite on hover instead of lifting.
 */

const cardCss = css({
  background: 'midnightSlate',
  border: '1px solid',
  borderColor: 'hairline',
  borderRadius: '4px',
})

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className={cx(cardCss, className)} style={style}>
      {children}
    </div>
  )
}

/** design.md chip: Graphite bg, Silver text; active = Starlight + Lead border.
 * Never white-filled. Shared by Today's filters and The Library. */
export const chipCss = css({
  px: '4',
  py: '2',
  borderRadius: 'pill',
  border: '1px solid transparent',
  background: 'graphite',
  font: 'inherit',
  fontSize: 'bodySm',
  fontWeight: '500',
  color: 'silver',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 300ms cubic-bezier(0.16, 1, 0.3, 1), color 300ms ease, border-color 300ms ease',
  _hover: { background: '#2d2d3d' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
})

export const chipActiveCss = css({
  color: 'starlight',
  borderColor: 'lead',
})
