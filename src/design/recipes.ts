import { cva } from 'styled-system/css'

/** Buttons — instrument-plain, signal-accented (§5.6). */
export const button = cva({
  base: {
    fontFamily: 'display',
    fontWeight: '500',
    fontSize: 'sm',
    rounded: 'xl',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2',
    transition: 'transform token(durations.instant), filter token(durations.instant), border-color token(durations.instant), background token(durations.instant)',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    _active: { transform: 'translateY(1px)' },
    _disabled: { opacity: 0.5, cursor: 'not-allowed', _active: { transform: 'none' } },
  },
  variants: {
    variant: {
      primary: { bg: 'signal', color: 'bg', _hover: { filter: 'brightness(1.08)' } },
      outline: {
        color: 'text',
        border: '1px solid token(colors.hairline)',
        _hover: { borderColor: 'signal' },
      },
      ghost: { color: 'muted', _hover: { color: 'text', bg: 'signalFaint' } },
      danger: {
        color: 'state.elevated',
        border: '1px solid color-mix(in oklab, token(colors.state.elevated) 40%, transparent)',
        _hover: { bg: 'color-mix(in oklab, token(colors.state.elevated) 12%, transparent)' },
      },
    },
    size: {
      sm: { px: '3', py: '2', fontSize: '2xs' },
      md: { px: '5', py: '3' },
      lg: { px: '6', py: '3.5', fontSize: 'md' },
      icon: { p: '2.5', rounded: 'full' },
    },
  },
  defaultVariants: { variant: 'outline', size: 'md' },
})

/** Raised panels — the instrument's material (§5.1). */
export const panel = cva({
  base: {
    bg: 'panel',
    border: '1px solid token(colors.hairline)',
    rounded: '2xl',
    backdropFilter: 'blur(12px)',
  },
  variants: {
    pad: {
      sm: { p: '4' },
      md: { p: '6' },
      lg: { p: '8' },
    },
  },
  defaultVariants: { pad: 'md' },
})
