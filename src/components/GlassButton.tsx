import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { css, cx } from 'styled-system/css'

/**
 * GlassButton — the ONE native-feeling control shared by the app and the landing
 * page (Part 5.A/B). Real <button> semantics, keyboard operable, ≥44px touch
 * target, visible focus ring (global :focus-visible → signal). Liquid Glass
 * material per Part 4: blur + 6% fill + inset border + top highlight + soft
 * shadow, a cursor-tracked specular highlight, and a sheen that sweeps on
 * hover/press. Press feedback is a spring scale (0.96), disabled under
 * prefers-reduced-motion.
 */
type Variant = 'primary' | 'ghost' | 'pill'
type Size = 'sm' | 'md' | 'lg'

// Motion overrides these handlers with its own signatures; omit the React ones.
type OmittedHandlers =
  | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragEnter' | 'onDragExit'
  | 'onDragLeave' | 'onDragOver' | 'onDrop'
  | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'

export interface GlassButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, OmittedHandlers> {
  variant?: Variant
  size?: Size
  /** For `pill` toggles — renders the active/selected state. */
  selected?: boolean
}

const base = css({
  position: 'relative',
  overflow: 'hidden',
  isolation: 'isolate',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  fontFamily: 'display',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  lineHeight: '1',
  color: 'text',
  cursor: 'pointer',
  userSelect: 'none',
  minH: '44px',
  minW: '44px',
  rounded: 'full',
  border: '1px solid token(colors.glassBorder)',
  bg: 'glassFill',
  backdropFilter: 'blur(var(--glass-blur)) saturate(1.6)',
  boxShadow: 'var(--glass-shadow), inset 0 1px 0 token(colors.glassHighlight)',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  '--spec': '0',
  transition:
    'transform 250ms token(easings.calm), box-shadow 250ms token(easings.calm), background 250ms token(easings.calm), border-color 250ms token(easings.calm)',
  // top-edge specular highlight
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '0',
    borderRadius: 'inherit',
    pointerEvents: 'none',
    background: 'linear-gradient(180deg, token(colors.glassHighlight), transparent 42%)',
    opacity: '0.7',
    zIndex: '0',
  },
  // sheen that sweeps across on hover/press
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '0',
    left: '-60%',
    width: '45%',
    height: '100%',
    background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.28), transparent)',
    transform: 'skewX(-18deg)',
    transition: 'left 650ms token(easings.calm)',
    pointerEvents: 'none',
    zIndex: '1',
  },
  '&:hover': { '--spec': '1', borderColor: 'rgba(255,255,255,0.22)' },
  '&:hover::after': { left: '130%' },
  '&:active::after': { left: '130%' },
  '&:disabled': { opacity: '0.4', cursor: 'default', pointerEvents: 'none' },
})

const specular = css({
  position: 'absolute',
  inset: '0',
  borderRadius: 'inherit',
  pointerEvents: 'none',
  zIndex: '0',
  opacity: 'var(--spec)',
  transition: 'opacity 250ms token(easings.calm)',
  background:
    'radial-gradient(200px circle at var(--mx, 50%) var(--my, 50%), token(colors.glassHighlight), transparent 60%)',
})

const content = css({ position: 'relative', zIndex: '2', display: 'inline-flex', alignItems: 'center', gap: '2' })

const sizes: Record<Size, string> = {
  sm: css({ px: '4', py: '2', fontSize: 'sm' }),
  md: css({ px: '5', py: '2.5', fontSize: 'md' }),
  lg: css({ px: '7', py: '3.5', fontSize: 'lg' }),
}

const variants: Record<Variant, string> = {
  primary: css({
    color: 'text',
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundImage:
      'linear-gradient(135deg, color-mix(in oklab, token(colors.ringCool) 34%, transparent), color-mix(in oklab, token(colors.ringWarm) 34%, transparent))',
    boxShadow: '0 8px 30px color-mix(in oklab, var(--signal) 38%, transparent), inset 0 1px 0 token(colors.glassHighlight)',
  }),
  ghost: css({ px: '0', width: '44px', color: 'muted', _hover: { color: 'text' } }),
  pill: css({ px: '4', py: '2', fontSize: 'sm', color: 'muted' }),
}

const pillSelected = css({
  color: 'bg',
  bg: 'signal',
  borderColor: 'signal',
  boxShadow: '0 6px 22px color-mix(in oklab, var(--signal) 40%, transparent)',
})

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { variant = 'primary', size = 'md', selected = false, className, children, onMouseMove, ...rest },
  ref,
) {
  const reduce = useReducedMotion()

  const track = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
    onMouseMove?.(e)
  }

  return (
    <motion.button
      ref={ref}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
      onMouseMove={track}
      className={cx(
        base,
        sizes[size],
        variant === 'pill' && selected ? cx(variants.pill, pillSelected) : variants[variant],
        className,
      )}
      {...rest}
    >
      <span aria-hidden className={specular} />
      <span className={content}>{children}</span>
    </motion.button>
  )
})
