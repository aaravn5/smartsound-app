import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { css } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { Scene, type SceneVariant } from '~/design/Scene'
import { useClickSound } from '~/lib/click-sound'
import { ensureDevPlan } from '~/lib/dev-access'
import { MainScrollContext } from '~/lib/scroll-context'

/**
 * AppShell — the Calm-native frame. An immersive Scene sky fills the frame,
 * content scrolls above it, and a floating Liquid Glass HIG tab bar carries
 * the five sections: Today · Explore · Player · Progress · Profile.
 * Each tab keys its own scene + calm accent; the sky cross-fades between tabs.
 */
export const Route = createFileRoute('/app')({
  component: AppShell,
})

interface Tab {
  to: string
  label: string
  icon: ReactNode
  exact?: boolean
  scene: SceneVariant
  accent: string
}

const iconAttrs = {
  width: 23,
  height: 23,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
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
/** safari-style compass needle. */
const ExploreIcon = () => (
  <svg {...iconAttrs}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M15.4 8.6l-2 4.8-4.8 2 2-4.8 4.8-2z" />
  </svg>
)
/** play within the session circle. */
const PlayerIcon = () => (
  <svg {...iconAttrs}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M10.2 8.9l5 3.1-5 3.1V8.9z" fill="currentColor" stroke="none" />
  </svg>
)
/** the rings themselves. */
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
  { to: '/app', label: 'Today', icon: <TodayIcon />, exact: true, scene: 'dusk', accent: '#A78BFA' },
  { to: '/app/explore', label: 'Explore', icon: <ExploreIcon />, scene: 'aurora', accent: '#5EEAD4' },
  { to: '/app/player', label: 'Player', icon: <PlayerIcon />, scene: 'ocean', accent: '#7DD3FC' },
  { to: '/app/progress', label: 'Progress', icon: <ProgressIcon />, scene: 'dawn', accent: '#FDBA74' },
  { to: '/app/profile', label: 'Profile', icon: <ProfileIcon />, scene: 'dusk', accent: '#A78BFA' },
]

function activeTab(pathname: string): Tab {
  return (
    TABS.find((tab) => (tab.exact ? pathname === tab.to : pathname.startsWith(tab.to))) ?? TABS[0]
  )
}

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const tab = activeTab(pathname)
  const mainRef = useRef<HTMLElement>(null)

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
      style={
        {
          // Panda resolves token vars at :root, so re-declare them here where
          // the per-tab scene accent is known — they then inherit downward.
          '--scene-accent': tab.accent,
          '--colors-accent': tab.accent,
          '--colors-accent-soft': `color-mix(in oklab, ${tab.accent} 24%, transparent)`,
        } as CSSProperties
      }
    >
      {/* `page` scrim — a steadier base dim so browsable text stays legible
          while the landscape remains clearly visible behind it. */}
      <Scene variant={tab.scene} scrim="page" />

      <main
        ref={mainRef}
        className={css({
          position: 'absolute',
          inset: '0',
          zIndex: '1',
          // The scrollable viewport itself stops short of the floating tab
          // bar's footprint (offset 14px + ~60px bar height + safe area, with
          // a buffer) — so content can never render *behind* the bar, on
          // first paint or otherwise, regardless of viewport height.
          bottom: 'calc(env(safe-area-inset-bottom) + 96px)',
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
            pb: '8',
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
    <div
      className={css({
        position: 'fixed',
        left: '0',
        right: '0',
        bottom: 'calc(env(safe-area-inset-bottom) + 14px)',
        zIndex: '20',
        display: 'flex',
        justifyContent: 'center',
        px: '4',
        pointerEvents: 'none',
      })}
    >
      <LiquidGlass
        as="nav"
        variant="bar"
        aria-label="Primary"
        className={css({ pointerEvents: 'auto', w: 'full', maxW: '420px' })}
      >
        <div className={css({ display: 'flex', px: '2', py: '1.5' })}>
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
                  minH: '48px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5',
                  borderRadius: 'capsule',
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  transition: 'transform token(durations.quick) token(easings.calm)',
                  _active: { transform: 'scale(0.94)' },
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                    _active: { transform: 'none' },
                  },
                })}
              >
                <span
                  className={css({
                    lineHeight: '0',
                    transition: 'color token(durations.gentle) ease',
                  })}
                  style={{ color: active ? 'var(--scene-accent)' : 'var(--ss-ink-dim)' }}
                >
                  {tab.icon}
                </span>
                <span
                  className={css({
                    fontSize: '10px',
                    fontWeight: active ? '600' : '500',
                    letterSpacing: '0.01em',
                    transition: 'color token(durations.gentle) ease',
                  })}
                  style={{ color: active ? 'var(--scene-accent)' : 'var(--ss-ink-dim)' }}
                >
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </LiquidGlass>
    </div>
  )
}
