import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Menu, X, LogOut } from 'lucide-react'
import { css, cx } from 'styled-system/css'
import { useAccount, signOut, shouldShowWelcome, markWelcomed } from '~/lib/account'
import { DAYPART_GREETING, daypart } from '~/lib/daypart'
import { useClickSound } from '~/lib/click-sound'

/**
 * LandingHeader — the quietpress chrome, rebranded SmartSound.
 *
 * Left: the Fraunces wordmark. Center (desktop): Library · Science ·
 * Contact · Legal. Right: signed out → "Log in" (glass) + "Sign up" (solid
 * white); signed in → a glass chip with the daypart greeting ("Welcome,
 * {name}" on the very first visit after signup) and a tiny account menu
 * with Sign out. No cart — SmartSound sells sessions, not merchandise, so
 * the template's shop affordance is honestly dropped. Mobile: a glass
 * square toggling a glass dropdown with the same links and actions.
 */

const FRAUNCES = '"Fraunces", Georgia, "Times New Roman", serif'

const NAV = [
  { label: 'Library', to: '/app' },
  { label: 'Science', to: '/science' },
  { label: 'Contact', to: '/contact' },
  { label: 'Legal', to: '/privacy' },
] as const

const navLinkCss = css({
  fontSize: 'subhead',
  fontWeight: '500',
  letterSpacing: '0.01em',
  color: 'rgba(255,255,255,0.82)',
  textDecoration: 'none',
  px: '3',
  py: '2',
  borderRadius: 'capsule',
  transition: 'color 160ms ease, background 160ms ease',
  _hover: { color: 'rgba(255,255,255,1)', background: 'rgba(255,255,255,0.08)' },
})

const glassPillCss = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minH: '40px',
  px: '4.5',
  borderRadius: 'capsule',
  border: 'none',
  font: 'inherit',
  fontSize: 'subhead',
  fontWeight: '600',
  color: 'rgba(255,255,255,0.94)',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'transform 160ms ease',
  _active: { transform: 'scale(0.96)' },
})

const solidPillCss = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minH: '40px',
  px: '4.5',
  borderRadius: 'capsule',
  border: 'none',
  font: 'inherit',
  fontSize: 'subhead',
  fontWeight: '600',
  background: 'rgba(246, 245, 250, 0.97)',
  color: 'rgba(14, 16, 26, 0.95)',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  boxShadow: '0 6px 22px rgba(2,4,12,0.35)',
  transition: 'transform 160ms ease',
  _active: { transform: 'scale(0.96)' },
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
  fontSize: 'body',
  fontWeight: '500',
  color: 'rgba(255,255,255,0.92)',
  textAlign: 'left',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  _hover: { background: 'rgba(255,255,255,0.08)' },
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
        position: 'absolute',
        insetX: '0',
        top: '0',
        zIndex: '20',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '3',
        px: 'clamp(16px, 4vw, 44px)',
        pt: 'calc(env(safe-area-inset-top) + 16px)',
      })}
    >
      {/* Wordmark. */}
      <Link
        to="/"
        aria-label="SmartSound — home"
        className={css({
          textDecoration: 'none',
          fontSize: 'clamp(1.25rem, 2.2vw, 1.5rem)',
          fontWeight: '600',
          letterSpacing: '-0.03em',
          color: 'rgba(248, 247, 252, 0.97)',
          textShadow: '0 1px 14px rgba(2,4,12,0.6)',
          whiteSpace: 'nowrap',
        })}
        style={{ fontFamily: FRAUNCES }}
      >
        SmartSound
      </Link>

      {/* Center nav — desktop only. */}
      <nav
        aria-label="Landing"
        className={cx(
          'liquid-glass',
          css({
            display: 'none',
            md: { display: 'flex' },
            alignItems: 'center',
            gap: '1',
            borderRadius: 'capsule',
            px: '2',
            py: '1',
          }),
        )}
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
          <div ref={accountWrapRef} className={css({ position: 'relative', display: 'none', sm: { display: 'block' } })}>
            <button
              type="button"
              onClick={() => {
                playClick('tap')
                setAccountOpen((o) => !o)
              }}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              className={cx('liquid-glass', glassPillCss)}
              data-greeting
            >
              <span style={{ fontFamily: FRAUNCES }} className={css({ fontWeight: '500', letterSpacing: '-0.01em' })}>
                {greeting}
              </span>
            </button>
            {accountOpen && (
              <div
                role="menu"
                className={cx(
                  'liquid-glass',
                  css({ position: 'absolute', right: '0', top: 'calc(100% + 8px)', minW: '200px', borderRadius: '16px', overflow: 'hidden', py: '1' }),
                )}
                // Inline: .liquid-glass (unlayered) would beat layered utilities.
                style={{ position: 'absolute' }}
              >
                <p className={css({ m: '0', px: '4', pt: '2.5', pb: '1.5', fontSize: 'caption', color: 'rgba(235,238,250,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
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
            <button type="button" onClick={toAuth} className={cx('liquid-glass', glassPillCss, css({ display: 'none', sm: { display: 'inline-flex' } }))}>
              Log in
            </button>
            <button type="button" onClick={toAuth} className={cx(solidPillCss, css({ display: 'none', sm: { display: 'inline-flex' } }))}>
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
          className={cx(
            'liquid-glass',
            css({
              display: 'grid',
              md: { display: 'none' },
              placeItems: 'center',
              w: '42px',
              h: '42px',
              borderRadius: '12px',
              border: 'none',
              color: 'rgba(255,255,255,0.92)',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }),
          )}
        >
          {menuOpen ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
        </button>
      </div>

      {/* Mobile dropdown. */}
      {menuOpen && (
        <div
          className={cx(
            'liquid-glass',
            css({
              position: 'absolute',
              right: '4',
              top: 'calc(env(safe-area-inset-top) + 68px)',
              zIndex: '25',
              minW: '230px',
              borderRadius: '18px',
              overflow: 'hidden',
              py: '1.5',
              md: { display: 'none' },
            }),
          )}
          // Inline: .liquid-glass (unlayered) would beat layered utilities.
          style={{ position: 'absolute' }}
        >
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={menuRowCss} onClick={() => setMenuOpen(false)}>
              {n.label}
            </Link>
          ))}
          <div aria-hidden className={css({ my: '1', borderTop: '1px solid rgba(255,255,255,0.12)' })} />
          {account ? (
            <>
              <p className={css({ m: '0', px: '4', py: '1.5', fontSize: 'caption', color: 'rgba(235,238,250,0.6)' })} style={{ fontFamily: FRAUNCES }} data-greeting>
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
