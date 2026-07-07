import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { css } from 'styled-system/css'
import { AuroraBackdrop } from '~/components/Card'
import { useClickSound } from '~/lib/click-sound'
import { ensureDevPlan } from '~/lib/dev-access'
import { MainScrollContext } from '~/lib/scroll-context'

/**
 * AppShell — the "Pressed at Night" frame. ONE dark world: a Deep Space
 * canvas with two barely-there aurora blooms drifting beneath the content
 * (Calm/Endel — never photographic), content scrolling above it, and a
 * frosted-glass bottom nav (Apple material: frost fill + backdrop blur +
 * 0.5px starlight hairline). One accent for all five tabs — the active item
 * turns Starlight and carries a 4px Mercury Blue dot.
 */
export const Route = createFileRoute('/app')({
  component: AppShell,
})

/** The nav bar's footprint — the scrollport stops above it. */
export const NAV_HEIGHT = 58

interface Tab {
  to: string
  label: string
  icon: ReactNode
  exact?: boolean
  title: string
}

const iconAttrs = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/** sun.max — the day begins here. */
const TodayIcon = () => (
  <svg {...iconAttrs}>
    <circle cx="12" cy="12" r="4.1" />
    <path d="M12 2.8v2.2M12 19v2.2M21.2 12H19M5 12H2.8M18.5 5.5L17 7M7 17l-1.5 1.5M18.5 18.5L17 17M7 7L5.5 5.5" />
  </svg>
)
/** a crate of records — The Library. */
const LibraryIcon = () => (
  <svg {...iconAttrs}>
    <rect x="3.4" y="5" width="17.2" height="15" rx="1.4" />
    <path d="M7.4 5v15M11.2 5v15M15 5l3.4 15" />
  </svg>
)
/** the record itself. */
const PlayerIcon = () => (
  <svg {...iconAttrs}>
    <circle cx="12" cy="12" r="8.8" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M12 3.2v2M12 18.8v2" opacity="0" />
  </svg>
)
/** concentric grooves — the Listening Rings. */
const ProgressIcon = () => (
  <svg {...iconAttrs}>
    <path d="M12 3.2a8.8 8.8 0 1 1-6.2 2.6" />
    <path d="M12 6.4a5.6 5.6 0 1 1-4 1.7" />
    <circle cx="12" cy="12" r="2.3" />
  </svg>
)
/** person.crop.circle. */
const ProfileIcon = () => (
  <svg {...iconAttrs}>
    <circle cx="12" cy="12" r="8.8" />
    <circle cx="12" cy="9.7" r="2.9" />
    <path d="M6.4 18.3c1.3-2.6 3.3-3.9 5.6-3.9s4.3 1.3 5.6 3.9" />
  </svg>
)

const TABS: Tab[] = [
  { to: '/app', label: 'Today', icon: <TodayIcon />, exact: true, title: 'Today — SmartSound' },
  { to: '/app/explore', label: 'Library', icon: <LibraryIcon />, title: 'The Library — SmartSound' },
  { to: '/app/player', label: 'Player', icon: <PlayerIcon />, title: 'Player — SmartSound' },
  { to: '/app/progress', label: 'Progress', icon: <ProgressIcon />, title: 'Progress — SmartSound' },
  { to: '/app/profile', label: 'Profile', icon: <ProfileIcon />, title: 'Profile — SmartSound' },
]

/** Per-route document titles (audit 1.5) — every /app route gets its own. */
function routeTitle(pathname: string): string {
  if (pathname.startsWith('/app/paywall')) return 'Plans — SmartSound'
  const tab = TABS.find((t) => (t.exact ? pathname === t.to : pathname !== '/app' && pathname.startsWith(t.to)))
  return tab?.title ?? 'Today — SmartSound'
}

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    document.title = routeTitle(pathname)
  }, [pathname])

  // Developer access: keep the elevated plan alive across the local-midnight
  // rollover (the entitlements stub's fresh record resets plan to 'free').
  useEffect(() => {
    ensureDevPlan()
    const id = window.setInterval(ensureDevPlan, 60_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div
      className={css({
        position: 'relative',
        height: '100dvh',
        overflow: 'hidden',
        color: 'text',
        bg: 'bgDeep',
      })}
    >
      {/* Soft ethereal glow — beneath everything, ignorable, reduced-motion safe. */}
      <AuroraBackdrop />
      <main
        ref={mainRef}
        className={css({
          position: 'absolute',
          inset: '0',
          zIndex: '1',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        })}
      >
        <div
          className={css({
            maxW: '640px',
            mx: 'auto',
            px: '5',
            pt: 'calc(env(safe-area-inset-top) + 28px)',
            // Content scrolls BENEATH the frosted nav (that's what makes the
            // glass read as glass); the padding keeps the last element clear.
            pb: 'calc(env(safe-area-inset-bottom) + 58px + 40px)',
          })}
        >
          <MainScrollContext.Provider value={mainRef}>
            <Outlet />
          </MainScrollContext.Provider>
        </div>
      </main>

      <TabBar pathname={pathname} />
    </div>
  )
}

function TabBar({ pathname }: { pathname: string }) {
  const playClick = useClickSound()
  return (
    <nav
      aria-label="Primary"
      // .ss-frost carries the backdrop blur pair (index.css).
      className={`ss-frost ${css({
        position: 'fixed',
        left: '0',
        right: '0',
        bottom: '0',
        zIndex: '20',
        // Frosted glass — the nav floats over content, Apple-material style.
        background: 'frost.fill',
        borderTop: '0.5px solid',
        borderColor: 'frost.stroke',
        paddingBottom: 'env(safe-area-inset-bottom)',
        '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
          background: 'frost.fallback',
        },
        '@media (prefers-reduced-transparency: reduce)': {
          background: 'frost.fallback',
        },
      })}`}
    >
      <div className={css({ display: 'flex', maxW: '520px', mx: 'auto', px: '2' })}>
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              onClick={() => playClick('tap')}
              className={css({
                flex: '1',
                minH: '57px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                color: 'silver',
                transition: 'color 300ms ease',
                '&[aria-current=page]': { color: 'starlight' },
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              })}
            >
              <span className={css({ lineHeight: '0' })}>{tab.icon}</span>
              <span
                className={css({
                  fontSize: '10px',
                  fontWeight: '500',
                  letterSpacing: '0.04em',
                })}
              >
                {tab.label}
              </span>
              {/* The 4px Mercury Blue dot — the single accent in the chrome. */}
              <span
                aria-hidden
                className={css({
                  width: '4px',
                  height: '4px',
                  borderRadius: 'full',
                  background: 'mercuryBlue',
                  transition: 'opacity 300ms ease',
                })}
                style={{ opacity: active ? 1 : 0 }}
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
