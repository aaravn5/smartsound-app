import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Menu, X, LogOut } from 'lucide-react'
import { css, cx } from 'styled-system/css'
import { useAccount, signOut, shouldShowWelcome, markWelcomed } from '~/lib/account'
import { DAYPART_GREETING, daypart } from '~/lib/daypart'
import { useClickSound } from '~/lib/click-sound'

/**
 * LandingHeader — Pressed-at-Night chrome (design.md pills, no glass).
 *
 * Left: the Fraunces wordmark. Center (desktop): Library · Science ·
 * Contact · Legal as quiet Silver links that brighten to Starlight over a
 * Graphite pill. Right: signed out → "Log in" (secondary pill, Ghost Blue
 * @20%) + "Sign up" (primary pill, Mercury Blue — THE accent); signed in →
 * a Graphite pill with the daypart greeting ("Welcome, {name}" on the very
 * first visit after signup) and a tiny account menu with Sign out.
 * Fixed to the top so the nav survives the hero's three-act scroll.
 */

const NAV = [
  { label: 'Library', to: '/app' },
  { label: 'Science', to: '/science' },
  { label: 'Contact', to: '/contact' },
  { label: 'Legal', to: '/privacy' },
] as const

const navLinkCss = css({
  fontSize: 'bodySm',
  fontWeight: '500',
  letterSpacing: '0.01em',
  color: 'silver',
  textDecoration: 'none',
  px: '3',
  py: '2',
  borderRadius: 'pill',
  transition: 'color 300ms ease, background 300ms ease',
  _hover: { color: 'starlight', background: 'graphite' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
})

/** Secondary pill — Ghost Blue @ ~20%, Starlight text (design.md). */
const secondaryPillCss = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minH: '40px',
  px: '4.5',
  borderRadius: 'pill',
  border: 'none',
  font: 'inherit',
  fontSize: 'bodySm',
  fontWeight: '500',
  background: 'rgba(205, 221, 255, 0.20)',
  color: 'starlight',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 300ms ease, transform 160ms ease',
  _hover: { background: 'rgba(205, 221, 255, 0.28)' },
  _active: { transform: 'scale(0.96)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
})

/** Primary pill — Mercury Blue, Pure White text. The one accent. */
const primaryPillCss = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minH: '40px',
  px: '4.5',
  borderRadius: 'pill',
  border: 'none',
  font: 'inherit',
  fontSize: 'bodySm',
  fontWeight: '500',
  background: 'accent',
  color: 'white',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 300ms ease, transform 160ms ease',
  _hover: { background: '#2a2a2a' },
  _active: { transform: 'scale(0.96)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
})

const menuRowCss = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2.5',
  width: '100%',
  px: '4',
  py: '3',
  border: 'none',
  background: 'transparent',
  font: 'inherit',
  fontSize: 'bodySm',
  fontWeight: '500',
  color: 'starlight',
  textAlign: 'left',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  _hover: { background: 'graphite' },
})

const dropdownCss = css({
  border: '1px solid',
  borderColor: 'hairline',
  background: 'midnightSlate',
  borderRadius: '4px',
  overflow: 'hidden',
})

export function LandingHeader() {
  const account = useAccount()
  const navigate = useNavigate()
  const playClick = useClickSound()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountWrapRef = useRef<HTMLDivElement>(null)

  // One-time "Welcome, {name}" → daypart greeting on later visits.
  const [welcome] = useState(shouldShowWelcome)
  useEffect(() => {
    if (welcome) markWelcomed()
  }, [welcome])

  useEffect(() => {
    if (!accountOpen) return
    const onDown = (e: PointerEvent) => {
      if (!accountWrapRef.current?.contains(e.target as Node)) setAccountOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [accountOpen])

  const greeting = account
    ? welcome
      ? `Welcome, ${account.name}`
      : `${DAYPART_GREETING[daypart()]}, ${account.name}`
    : ''

  const handleSignOut = () => {
    playClick('tap')
    signOut()
    setAccountOpen(false)
    setMenuOpen(false)
  }

  const toAuth = () => {
    playClick('tap')
    setMenuOpen(false)
    void navigate({ to: '/onboarding/$step', params: { step: 'auth' } })
  }

  return (
    <header
      className={css({
        position: 'fixed',
        insetX: '0',
        top: '0',
        zIndex: '50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '3',
        px: 'clamp(16px, 4vw, 44px)',
        pt: 'calc(env(safe-area-inset-top) + 14px)',
        pb: '2',
      })}
    >
      {/* Wordmark. */}
      <Link
        to="/"
        aria-label="SmartSound — home"
        className={css({
          textDecoration: 'none',
          fontFamily: 'display',
          fontSize: 'clamp(1.25rem, 2.2vw, 1.5rem)',
          fontWeight: '700',
          letterSpacing: '-0.03em',
          color: 'starlight',
          whiteSpace: 'nowrap',
        })}
      >
        SmartSound
      </Link>

      {/* Center nav — desktop only. */}
      <nav
        aria-label="Landing"
        className={css({
          display: 'none',
          md: { display: 'flex' },
          alignItems: 'center',
          gap: '1',
          borderRadius: 'pill',
          border: '1px solid',
          borderColor: 'hairline',
          background: 'rgba(255, 255, 255, 0.72)',
          px: '2',
          py: '1',
        })}
      >
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className={navLinkCss} onClick={() => playClick('tap')}>
            {n.label}
          </Link>
        ))}
      </nav>

      {/* Right side. */}
      <div className={css({ display: 'flex', alignItems: 'center', gap: '2.5' })}>
        {account ? (
          <div
            ref={accountWrapRef}
            className={css({ position: 'relative', display: 'none', sm: { display: 'block' } })}
          >
            <button
              type="button"
              onClick={() => {
                playClick('tap')
                setAccountOpen((o) => !o)
              }}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              className={cx(
                secondaryPillCss,
                css({ background: 'graphite', _hover: { background: '#e2e2e6' } }),
              )}
              data-greeting
            >
              <span
                className={css({ fontFamily: 'display', fontWeight: '600', letterSpacing: '-0.01em' })}
              >
                {greeting}
              </span>
            </button>
            {accountOpen && (
              <div
                role="menu"
                className={cx(
                  dropdownCss,
                  css({ position: 'absolute', right: '0', top: 'calc(100% + 8px)', minW: '200px', py: '1' }),
                )}
              >
                <p
                  className={css({
                    m: '0',
                    px: '4',
                    pt: '2.5',
                    pb: '1.5',
                    fontSize: 'caption',
                    color: 'silver',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  })}
                >
                  {account.email} · on this device
                </p>
                <button type="button" role="menuitem" onClick={handleSignOut} className={menuRowCss}>
                  <LogOut size={16} strokeWidth={2} aria-hidden />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={toAuth}
              className={cx(secondaryPillCss, css({ display: 'none', sm: { display: 'inline-flex' } }))}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={toAuth}
              className={cx(primaryPillCss, css({ display: 'none', sm: { display: 'inline-flex' } }))}
            >
              Sign up
            </button>
          </>
        )}

        {/* Mobile menu toggle. */}
        <button
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => {
            playClick('tap')
            setMenuOpen((o) => !o)
          }}
          className={css({
            display: 'grid',
            md: { display: 'none' },
            placeItems: 'center',
            w: '42px',
            h: '42px',
            borderRadius: 'pill',
            border: '1px solid',
            borderColor: 'hairline',
            background: 'graphite',
            color: 'starlight',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          })}
        >
          {menuOpen ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
        </button>
      </div>

      {/* Mobile dropdown. */}
      {menuOpen && (
        <div
          className={cx(
            dropdownCss,
            css({
              position: 'absolute',
              right: '4',
              top: 'calc(env(safe-area-inset-top) + 68px)',
              zIndex: '55',
              minW: '230px',
              py: '1.5',
              md: { display: 'none' },
            }),
          )}
        >
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={menuRowCss} onClick={() => setMenuOpen(false)}>
              {n.label}
            </Link>
          ))}
          <div aria-hidden className={css({ my: '1', borderTop: '1px solid', borderColor: 'hairline' })} />
          {account ? (
            <>
              <p
                className={css({
                  m: '0',
                  px: '4',
                  py: '1.5',
                  fontFamily: 'display',
                  fontWeight: '600',
                  fontSize: 'caption',
                  color: 'silver',
                })}
                data-greeting
              >
                {greeting}
              </p>
              <button type="button" onClick={handleSignOut} className={menuRowCss}>
                <LogOut size={16} strokeWidth={2} aria-hidden />
                Sign out
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={toAuth} className={menuRowCss}>
                Log in
              </button>
              <button type="button" onClick={toAuth} className={menuRowCss}>
                Sign up
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
