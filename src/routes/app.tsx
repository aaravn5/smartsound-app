import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import { TlxCheckIn } from '~/components/TlxCheckIn'

/**
 * AppShell — the GOAT-format app frame (Milestone 2). Full-bleed pure-black
 * canvas, an <Outlet/> for the five tabs, and a glass bottom tab bar that
 * lives in normal document flow (never overlaps page content, including the
 * Now tab's own transport bar). Safe-area aware for iOS home-indicator devices.
 */
export const Route = createFileRoute('/app')({
  component: AppShell,
})

interface Tab {
  to: string
  label: string
  icon: ReactNode
  exact?: boolean
}

const iconAttrs = {
  width: 21,
  height: 21,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const DiscoverIcon = () => (
  <svg {...iconAttrs} strokeLinejoin="round">
    <path d="M12 3l1.9 5.7L19.8 10.5 13.9 12.4 12 21l-1.9-8.6L4.2 10.5l5.9-1.8L12 3z" />
  </svg>
)
const BrowseIcon = () => (
  <svg {...iconAttrs}>
    <circle cx="10.5" cy="10.5" r="6.3" />
    <path d="M19.5 19.5l-4.6-4.6" />
  </svg>
)
const NowIcon = () => (
  <svg {...iconAttrs}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M7.4 12h2l1.4-3.6L13.2 15l1.3-3h2.1" />
  </svg>
)
const InsightsIcon = () => (
  <svg {...iconAttrs}>
    <path d="M5 19v-6.4M12 19V7.6M19 19v-9.8" />
  </svg>
)
const MeIcon = () => (
  <svg {...iconAttrs}>
    <circle cx="12" cy="8.2" r="3.3" />
    <path d="M5.1 20c1.2-3.9 3.9-5.8 6.9-5.8s5.7 1.9 6.9 5.8" />
  </svg>
)

const TABS: Tab[] = [
  { to: '/app', label: 'Discover', icon: <DiscoverIcon />, exact: true },
  { to: '/app/browse', label: 'Browse', icon: <BrowseIcon /> },
  { to: '/app/now', label: 'Now', icon: <NowIcon /> },
  { to: '/app/insights', label: 'Insights', icon: <InsightsIcon /> },
  { to: '/app/me', label: 'Me', icon: <MeIcon /> },
]

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isNow = pathname.startsWith('/app/now')

  return (
    <div
      className={css({
        display: 'grid',
        gridTemplateRows: '1fr auto',
        height: '100dvh',
        bg: 'bgBase',
        color: 'text',
        overflow: 'hidden',
      })}
    >
      <main className={css({ overflowY: isNow ? 'hidden' : 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' })}>
        {isNow ? (
          <div className={css({ height: '100%' })}>
            <Outlet />
          </div>
        ) : (
          <div className={css({ maxW: '1120px', mx: 'auto', px: { base: '5', md: '9' }, py: { base: '7', md: '10' } })}>
            <Outlet />
          </div>
        )}
      </main>

      <TabBar pathname={pathname} />
      <TlxCheckIn />
    </div>
  )
}

function TabBar({ pathname }: { pathname: string }) {
  const reduce = useReducedMotion()

  return (
    <nav
      aria-label="Primary"
      className={flex({
        justify: 'center',
        position: 'relative',
        zIndex: '20',
        borderTop: '1px solid token(colors.glassBorder)',
        bg: 'glassFill',
        px: '3',
        pt: '2',
        pb: 'calc(8px + env(safe-area-inset-bottom))',
      })}
      style={{ backdropFilter: 'blur(var(--glass-blur)) saturate(1.6)', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(1.6)' }}
    >
      <div className={flex({ w: 'full', maxW: '560px', justify: 'space-between', gap: '1' })}>
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={css({
                position: 'relative',
                display: 'flex',
                flexDir: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1',
                flex: '1',
                minH: '44px',
                py: '1.5',
                rounded: 'xl',
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                transition: 'background token(durations.instant)',
                _hover: { bg: 'rgba(255,255,255,0.045)' },
              })}
            >
              <span className={css({ color: active ? 'signal' : 'muted', transition: 'color token(durations.instant)', lineHeight: '0' })}>
                {tab.icon}
              </span>
              <span
                className={css({
                  fontFamily: 'mono',
                  fontSize: '2xs',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: active ? 'signal' : 'faint',
                  transition: 'color token(durations.instant)',
                })}
                style={{ fontSize: '9px' }}
              >
                {tab.label}
              </span>
              {active && (
                <motion.span
                  layoutId={reduce ? undefined : 'tab-dot'}
                  aria-hidden
                  className={css({
                    position: 'absolute',
                    bottom: '1px',
                    width: '3.5',
                    height: '3.5',
                    rounded: 'full',
                    bg: 'signal',
                    boxShadow: '0 0 8px token(colors.signal)',
                  })}
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
