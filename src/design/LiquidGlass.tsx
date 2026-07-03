import {
  useCallback,
  useRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useReducedMotion } from 'motion/react'
import { css, cva, cx } from 'styled-system/css'

/**
 * LiquidGlass — the signature material (per apple-design-materials).
 *
 * A layered translucent surface, not a cheap blur:
 *   1. frosted fill        — translucent tint over `backdrop-filter: blur() saturate()`
 *   2. specular highlight  — a bright top-edge inset line + a radial sheen (`::before`)
 *                            whose origin follows the pointer on fine-pointer devices
 *   3. inner glow          — faint interior luminance so the slab reads as lit glass
 *   4. depth shadow        — layered drop + tight grounding shadows
 *
 * Glass belongs to the navigation/control layer — never stack glass on glass.
 * Falls back to a near-opaque fill when `backdrop-filter` is unsupported and
 * under `prefers-reduced-transparency`; the pointer sheen respects
 * `prefers-reduced-motion`.
 */

const surface = cva({
  base: {
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'glass.stroke',
    // Frosted fill + optional tint layer (transparent unless --lg-tint is set).
    backgroundColor: 'glass.fill',
    backgroundImage:
      'linear-gradient(to bottom, color-mix(in oklab, var(--lg-tint, transparent) 58%, transparent), color-mix(in oklab, var(--lg-tint, transparent) 34%, transparent))',
    '--lg-bf': 'blur(var(--lg-blur, 24px)) saturate(165%) brightness(0.98)',
    backdropFilter: 'var(--lg-bf)',
    // Specular top edge + grounding depth.
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.035), 0 16px 48px rgba(3, 6, 18, 0.42), 0 2px 10px rgba(3, 6, 18, 0.28)',
    // Radial sheen — origin tracked by --lg-mx/--lg-my (pointer) on fine pointers.
    _before: {
      content: '""',
      position: 'absolute',
      inset: '0',
      borderRadius: 'inherit',
      pointerEvents: 'none',
      zIndex: '1',
      background:
        'radial-gradient(120% 65% at var(--lg-mx, 28%) var(--lg-my, 0%), rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 42%, transparent 68%)',
    },
    // Subtle inner glow — the glass slab is faintly lit from within.
    _after: {
      content: '""',
      position: 'absolute',
      inset: '0',
      borderRadius: 'inherit',
      pointerEvents: 'none',
      zIndex: '1',
      boxShadow: 'inset 0 0 32px rgba(255,255,255,0.045)',
    },
    // Solid fallback where backdrop-filter never lands.
    '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
      backgroundColor: 'glass.fallback',
    },
    '@media (prefers-reduced-transparency: reduce)': {
      backgroundColor: 'glass.fallback',
      '--lg-bf': 'none',
    },
  },
  variants: {
    variant: {
      // Floating content surface — hero cards, empty states.
      card: {
        borderRadius: 'card',
        '--lg-blur': '24px',
      },
      // Chrome — the HIG tab bar / toolbars. Slightly stronger fill, capsule.
      bar: {
        borderRadius: 'capsule',
        backgroundColor: 'glass.fillStrong',
        '--lg-blur': '28px',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(255,255,255,0.03), 0 12px 40px rgba(3, 6, 18, 0.5), 0 2px 8px rgba(3, 6, 18, 0.32)',
      },
      // Small interactive control — capsule buttons, chips.
      control: {
        borderRadius: 'capsule',
        backgroundColor: 'glass.fillSoft',
        borderColor: 'glass.strokeStrong',
        '--lg-blur': '16px',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 20px rgba(3, 6, 18, 0.35), 0 1px 4px rgba(3, 6, 18, 0.25)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition:
          'transform var(--spring-smooth-duration) var(--spring-smooth), background-color token(durations.quick) ease, border-color token(durations.quick) ease',
        _hover: {
          backgroundColor: 'rgba(255,255,255,0.11)',
          borderColor: 'rgba(255,255,255,0.28)',
        },
        _active: { transform: 'scale(0.965)' },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          _active: { transform: 'none' },
        },
      },
      // Large modal surface — sheets. Thickest glass, heaviest grounding.
      sheet: {
        borderRadius: 'sheet',
        backgroundColor: 'glass.fillStrong',
        '--lg-blur': '32px',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(255,255,255,0.03), 0 32px 80px rgba(3, 6, 18, 0.55), 0 4px 16px rgba(3, 6, 18, 0.35)',
      },
    },
  },
  defaultVariants: { variant: 'card' },
})

export type LiquidGlassVariant = 'card' | 'bar' | 'control' | 'sheet'

export interface LiquidGlassProps extends HTMLAttributes<HTMLElement> {
  variant?: LiquidGlassVariant
  /** Render element — div by default; use 'nav', 'section', 'button'… */
  as?: ElementType
  /** Optional tint (one tinted element per group — primary actions only). */
  tint?: string
  /** Disable the pointer-tracked specular sheen. */
  staticSheen?: boolean
}

export function LiquidGlass({
  variant = 'card',
  as: Tag = 'div',
  tint,
  staticSheen = false,
  className,
  style,
  onPointerMove,
  onPointerLeave,
  children,
  ...rest
}: LiquidGlassProps) {
  const frame = useRef(0)
  const reduceMotion = useReducedMotion()
  const sheenLive = !staticSheen && !reduceMotion

  const handleMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      onPointerMove?.(e)
      if (!sheenLive || e.pointerType !== 'mouse') return
      const el = e.currentTarget
      const { clientX, clientY } = e
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return
        el.style.setProperty('--lg-mx', `${(((clientX - r.left) / r.width) * 100).toFixed(2)}%`)
        el.style.setProperty('--lg-my', `${(((clientY - r.top) / r.height) * 100).toFixed(2)}%`)
      })
    },
    [onPointerMove, sheenLive],
  )

  const handleLeave = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      onPointerLeave?.(e)
      if (!sheenLive) return
      cancelAnimationFrame(frame.current)
      e.currentTarget.style.removeProperty('--lg-mx')
      e.currentTarget.style.removeProperty('--lg-my')
    },
    [onPointerLeave, sheenLive],
  )

  // Safari < 18 only understands the prefixed backdrop-filter.
  const baseStyle: CSSProperties = {
    WebkitBackdropFilter: 'var(--lg-bf)',
    ...(tint ? ({ '--lg-tint': tint } as CSSProperties) : undefined),
  }

  return (
    <Tag
      className={cx(surface({ variant }), className)}
      style={{ ...baseStyle, ...style }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...rest}
    >
      {/* Content sits above the sheen layers. */}
      <div className={css({ position: 'relative', zIndex: '2', height: '100%' })}>{children}</div>
    </Tag>
  )
}
