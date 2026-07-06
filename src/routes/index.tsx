import { useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { BoomerangVideoBg } from '~/landing/BoomerangVideoBg'
import { LandingHeader } from '~/landing/LandingHeader'
import { HeroSearch } from '~/landing/HeroSearch'
import { RecordCarousel } from '~/landing/RecordCarousel'
import { NowPlayingWidget } from '~/landing/NowPlayingWidget'
import { hasAccount } from '~/lib/account'
import { DAYPART_GRADE, DAYPART_HEADLINE, DAYPART_PRESS, DAYPART_TINT, daypart } from '~/lib/daypart'
import { useClickSound } from '~/lib/click-sound'
import { usePageTitle } from '~/lib/page-title'
import { suggestFor } from '~/engine/circadian/model'
import { SOUNDSCAPES } from '~/lib/catalog'
import type { TargetState } from '~/engine/audio/types'

/**
 * `/` — the vinyl hero. SmartSound as a quiet record label: the boomerang
 * daylight loop graded to the hour behind a one-viewport pressing-room —
 * liquid-glass chrome, a Fraunces headline that shifts with the daypart,
 * the self-typing search, and the lazy-susan of records (the five modes +
 * scenario pressings, each labeled with its OWN landscape).
 *
 * Browsing stays open (`/app` is one click away); LISTENING is the gate —
 * any play intent without an on-device account routes through
 * /onboarding/auth with the intent preserved. No page scroll: the viewport
 * is the sleeve.
 */
export const Route = createFileRoute('/')({
  component: Landing,
})

const FRAUNCES = '"Fraunces", Georgia, "Times New Roman", serif'

/**
 * The legibility scrim over the graded footage — transparent enough to keep
 * the landscape alive, dark enough that every text zone (header, headline
 * band, caption/footer bottom 40%) clears WCAG AA for white ink in EVERY
 * daypart (the ungraded morning frame is the audited worst case — see
 * scripts/hero-contrast-audit.mjs).
 */
const HERO_SCRIM =
  'linear-gradient(to bottom, rgba(4, 8, 22, 0.68) 0%, rgba(4, 8, 22, 0.56) 16%, rgba(4, 8, 22, 0.56) 34%, rgba(4, 8, 22, 0.6) 52%, rgba(4, 8, 22, 0.68) 68%, rgba(4, 8, 22, 0.82) 84%, rgba(4, 8, 22, 0.92) 100%)'

const solidCtaCss = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minH: '50px',
  px: '7',
  borderRadius: 'capsule',
  border: 'none',
  font: 'inherit',
  fontSize: 'callout',
  fontWeight: '600',
  letterSpacing: '0.01em',
  background: 'rgba(246, 245, 250, 0.97)',
  color: 'rgba(14, 16, 26, 0.95)',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  boxShadow: '0 10px 32px rgba(2, 4, 12, 0.4)',
  transition: 'transform 180ms cubic-bezier(0.32, 0.72, 0, 1)',
  _hover: { transform: 'translateY(-1px)' },
  _active: { transform: 'scale(0.965)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _hover: { transform: 'none' }, _active: { transform: 'none' } },
})

const glassCtaCss = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minH: '50px',
  px: '7',
  borderRadius: 'capsule',
  border: 'none',
  font: 'inherit',
  fontSize: 'callout',
  fontWeight: '600',
  letterSpacing: '0.01em',
  color: 'rgba(255, 255, 255, 0.95)',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'transform 180ms cubic-bezier(0.32, 0.72, 0, 1)',
  _active: { transform: 'scale(0.965)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
})

const footLinkCss = css({
  color: 'rgba(235, 238, 250, 0.62)',
  textDecoration: 'none',
  _hover: { color: 'rgba(255,255,255,0.9)', textDecoration: 'underline' },
})

function Landing() {
  // The landing keeps its title — re-asserted here so SPA back-navigation
  // from a retitled /app route restores it.
  usePageTitle('SmartSound — calm, tuned to your body')
  const navigate = useNavigate()
  const playClick = useClickSound()

  // Daypart is read once per mount — a visit straddling a boundary simply
  // re-grades on the next load; no per-minute reactivity needed.
  const dp = useMemo(() => daypart(), [])
  const suggestion = useMemo(() => suggestFor(new Date()), [])
  const pressTitle = SOUNDSCAPES.find((s) => s.state === suggestion.state)?.title ?? suggestion.label
  const [headA, headB] = DAYPART_HEADLINE[dp]

  /** THE gate — listening requires the on-device account; browsing never does. */
  const gatedPlay = (state: TargetState) => {
    if (hasAccount()) {
      void navigate({ to: '/app/player', search: { state } })
    } else {
      void navigate({
        to: '/onboarding/$step',
        params: { step: 'auth' },
        search: { intent: 'play', state },
      })
    }
  }

  return (
    <div
      className={cx(
        'ss-scene-dark',
        css({
          position: 'relative',
          height: '100dvh',
          minHeight: '540px',
          overflow: 'hidden',
          bg: 'black',
          color: 'text',
        }),
      )}
    >
      {/* The graded boomerang footage. */}
      <BoomerangVideoBg grade={DAYPART_GRADE[dp]} />

      {/* Daypart tint (evening amber lean, night navy) under the AA scrim. */}
      <div
        aria-hidden
        className={css({ position: 'absolute', inset: '0', zIndex: '1', pointerEvents: 'none' })}
        style={{ background: DAYPART_TINT[dp] }}
      />
      <div
        aria-hidden
        className={css({ position: 'absolute', inset: '0', zIndex: '1', pointerEvents: 'none' })}
        style={{ background: HERO_SCRIM }}
      />

      <LandingHeader />

      {/* Hero column + the records. */}
      <div
        className={css({
          position: 'absolute',
          inset: '0',
          zIndex: '10',
          display: 'flex',
          flexDirection: 'column',
        })}
      >
        <div
          className={css({
            flex: '1',
            minH: '0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: '5',
            pt: 'calc(env(safe-area-inset-top) + clamp(56px, 9dvh, 92px))',
            gap: 'clamp(10px, 1.8dvh, 18px)',
          })}
        >
          {/* Badge — the current pressing, from the circadian engine. */}
          <p
            className={cx(
              'liquid-glass',
              'fade-up',
              'fade-up-d1',
              'tabular',
              css({
                m: '0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2',
                borderRadius: 'capsule',
                px: '4',
                py: '2',
                fontSize: 'footnote',
                fontWeight: '600',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(240, 242, 252, 0.88)',
              }),
            )}
          >
            <span aria-hidden className={css({ w: '6px', h: '6px', borderRadius: 'full', background: 'rgba(167, 139, 250, 0.95)', boxShadow: '0 0 10px rgba(167,139,250,0.8)' })} />
            {DAYPART_PRESS[dp]} · {pressTitle}
          </p>

          <h1
            className={cx(
              'fade-up',
              'fade-up-d2',
              css({
                m: '0',
                fontSize: 'clamp(2.5rem, 6.4vw, 4.5rem)',
                fontWeight: '500',
                letterSpacing: '-0.03em',
                lineHeight: '1.1',
                color: 'rgba(255, 255, 255, 0.98)',
                textShadow: '0 2px 24px rgba(2, 4, 12, 0.55)',
              }),
            )}
            style={{ fontFamily: FRAUNCES }}
          >
            <span className={css({ display: 'block' })}>{headA}</span>
            <span className={css({ display: 'block', fontStyle: 'italic' })}>{headB}</span>
          </h1>

          <p
            className={cx(
              'fade-up',
              'fade-up-d3',
              css({
                m: '0',
                maxW: '28rem',
                fontSize: 'clamp(0.9375rem, 1.4vw, 1.0625rem)',
                lineHeight: '1.55',
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: '0 1px 14px rgba(2, 4, 12, 0.55)',
              }),
            )}
          >
            Neuroacoustic soundscapes pressed like rare vinyl — each mode tuned to your pulse.
            Focus, flow, calm, sleep.
          </p>

          <div className={cx('fade-up', 'fade-up-d4', css({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: '3', mt: '1' }))}>
            <Link to="/app" className={solidCtaCss} onClick={() => playClick('primary')}>
              Browse the library
            </Link>
            <button
              type="button"
              className={cx('liquid-glass', glassCtaCss)}
              onClick={() => {
                playClick('primary')
                gatedPlay(suggestion.state)
              }}
            >
              Start listening
            </button>
          </div>

          <div className={cx('fade-up', 'fade-up-d5', css({ width: 'min(430px, 100%)', mt: '1' }))}>
            <HeroSearch onPlay={gatedPlay} />
          </div>
        </div>

        {/* The record lazy-susan — the bottom third. */}
        <div className={css({ flexShrink: '0', height: 'clamp(185px, 29dvh, 300px)', pb: 'env(safe-area-inset-bottom)' })}>
          <RecordCarousel onOpen={gatedPlay} />
        </div>
      </div>

      {/* Footer microline — honest, tiny, desktop corners. */}
      <p
        className={css({
          display: 'none',
          md: { display: 'block' },
          position: 'absolute',
          left: 'clamp(16px, 4vw, 44px)',
          bottom: 'calc(env(safe-area-inset-bottom) + 14px)',
          zIndex: '20',
          m: '0',
          fontSize: 'caption',
          color: 'rgba(235, 238, 250, 0.62)',
          textShadow: '0 1px 8px rgba(2,4,12,0.6)',
        })}
      >
        Free to explore · The camera stays on your device ·{' '}
        <Link to="/privacy" className={footLinkCss}>
          Privacy
        </Link>{' '}
        ·{' '}
        <Link to="/terms" className={footLinkCss}>
          Terms
        </Link>
      </p>

      <NowPlayingWidget />
    </div>
  )
}
