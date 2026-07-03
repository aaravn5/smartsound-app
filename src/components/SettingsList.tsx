import { useState, type ReactNode } from 'react'
import { css } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'

/**
 * SettingsList — the HIG grouped-list idiom in Liquid Glass: a small
 * uppercase section caption over a card of rows, hairline dividers between
 * rows, a leading icon chip, a trailing value + chevron. Rows are honest
 * disclosures, not dead ends — tapping expands a short detail line in place
 * of navigating to a screen that doesn't exist yet.
 */

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={css({ color: 'faint', flexShrink: '0', transition: 'transform token(durations.quick) token(easings.calm)' })}
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={css({ mb: '6' })}>
      <h2
        className={css({
          m: '0',
          mb: '2',
          px: '1',
          fontSize: 'footnote',
          fontWeight: '600',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'faint',
        })}
      >
        {title}
      </h2>
      <LiquidGlass variant="card">{children}</LiquidGlass>
    </section>
  )
}

export interface SettingsRowProps {
  icon: ReactNode
  label: string
  value?: string
  detail: string
  last?: boolean
  /** Read-only rows governed by the OS (e.g. Reduce Motion) — shown with a
   * "System" badge instead of a chevron so they don't read as tappable/actionable. */
  systemControlled?: boolean
}

const rowDivider = css({ borderBottom: '1px solid', borderColor: 'hairline' })

const systemBadge = css({
  flexShrink: '0',
  fontSize: 'caption2',
  fontWeight: '600',
  letterSpacing: '0.02em',
  color: 'faint',
  bg: 'rgba(255,255,255,0.06)',
  border: '1px solid',
  borderColor: 'hairline',
  borderRadius: 'capsule',
  px: '2',
  py: '0.5',
})

export function SettingsRow({ icon, label, value, detail, last = false, systemControlled = false }: SettingsRowProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={last ? undefined : rowDivider}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '3',
          width: 'full',
          px: '4',
          py: '3.5',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',
          color: 'inherit',
          WebkitTapHighlightColor: 'transparent',
        })}
      >
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
          {icon}
        </span>
        <span className={css({ flex: '1', fontSize: 'subhead', fontWeight: '500', color: 'text' })}>{label}</span>
        {value && (
          <span className={css({ fontSize: 'subhead', color: 'faint' })}>{value}</span>
        )}
        {systemControlled ? <span className={systemBadge}>System</span> : <ChevronIcon open={open} />}
      </button>
      {open && (
        <div className={css({ px: '4', pb: '3.5' })} style={{ paddingLeft: '58px' }}>
          <p className={css({ m: '0', fontSize: 'footnote', lineHeight: '1.5', color: 'muted' })}>{detail}</p>
        </div>
      )}
    </div>
  )
}
