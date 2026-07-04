import * as Switch from '@radix-ui/react-switch'
import { css } from 'styled-system/css'
import { useTheme, setTheme } from '~/lib/theme'
import { useClickSound } from '~/lib/click-sound'

/**
 * ThemeToggle — the Daylight switch, styled as a SmartSound settings row
 * (Liquid Glass idiom: leading icon chip, label + caption, a rounded Radix
 * switch). Dark is native; flipping this on brings the airy morning palette.
 *
 * A sun/moon glyph in the chip signals the *current* appearance; the switch
 * itself is ON when Daylight is active.
 */

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.6v2.3M12 19.1v2.3M21.4 12H19.1M4.9 12H2.6M18.7 5.3L17 7M7 17l-1.7 1.7M18.7 18.7L17 17M7 7L5.3 5.3" />
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4a8.3 8.3 0 1 0 10.5 10.5z" />
  </svg>
)

export function ThemeToggle() {
  const theme = useTheme()
  const isLight = theme === 'light'
  const playClick = useClickSound()

  return (
    <div className={css({ display: 'flex', alignItems: 'center', gap: '3', px: '4', py: '3.5' })}>
      <span
        aria-hidden
        className={css({
          display: 'grid',
          placeItems: 'center',
          width: '30px',
          height: '30px',
          borderRadius: 'full',
          color: 'accent',
          background: 'accentSoft',
          flexShrink: '0',
          lineHeight: '0',
        })}
      >
        {isLight ? <SunIcon /> : <MoonIcon />}
      </span>
      <div className={css({ flex: '1', minW: '0' })}>
        <p className={css({ m: '0', fontSize: 'subhead', fontWeight: '500', color: 'text' })}>
          Daylight
        </p>
        <p className={css({ m: '0', mt: '0.5', fontSize: 'caption', lineHeight: '1.4', color: 'faint' })}>
          {isLight ? 'A bright, airy morning theme' : 'Switch to the light morning theme'}
        </p>
      </div>
      <Switch.Root
        checked={isLight}
        onCheckedChange={(on) => {
          setTheme(on ? 'light' : 'dark')
          playClick('tap')
        }}
        aria-label="Daylight theme"
        className={css({
          position: 'relative',
          w: '51px',
          h: '31px',
          p: '0',
          borderRadius: 'capsule',
          border: 'none',
          cursor: 'pointer',
          flexShrink: '0',
          bg: 'var(--ss-control-track)',
          transition: 'background token(durations.quick) ease',
          WebkitTapHighlightColor: 'transparent',
          '&[data-state=checked]': { bg: 'accent' },
        })}
      >
        <Switch.Thumb
          className={css({
            display: 'block',
            w: '27px',
            h: '27px',
            borderRadius: 'full',
            bg: 'white',
            boxShadow: '0 2px 6px rgba(3,6,18,0.4)',
            transform: 'translateX(2px)',
            transition: 'transform token(durations.quick) token(easings.calm)',
            '&[data-state=checked]': { transform: 'translateX(22px)' },
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          })}
        />
      </Switch.Root>
    </div>
  )
}
