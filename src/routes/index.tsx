import { useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { LandingHeader } from '~/landing/LandingHeader'
import { LandingSearch } from '~/landing/LandingSearch'
import { NowPlayingWidget } from '~/landing/NowPlayingWidget'
import { RecordHero } from '~/landing/RecordHero'
import { AppWindowCard } from '~/landing/AppWindowCard'
import { PRESSINGS, pressingTint } from '~/landing/PressingCarousel'
import { RecordDisc } from '~/components/vinyl/RecordDisc'
import { hasAccount } from '~/lib/account'
import { useClickSound } from '~/lib/click-sound'
import { usePageTitle } from '~/lib/page-title'
import { suggestFor } from '~/engine/circadian/model'
import type { TargetState } from '~/engine/audio/types'

/**
 * `/` — the landing, re-cut in the Desktop.fm idiom: a single 3D-rendered
 * object (a record) floating on the flat calming-grey canvas, with the macOS
 * app-window card + one carbon-black CTA anchored below it. No scroll-dive, no
 * photography, no gradients — the rendered disc and its blue laser lines are
 * the only colour on an otherwise achromatic, Apple-restrained page. Below the
 * hero: the statement line, the pressings as a clean record row, the offer.
 *
 * Browsing stays open (`/app` is one click away); LISTENING is the gate — any
 * play intent without an on-device account routes through /onboarding/auth
 * with the intent preserved.
 */
export const Route = createFileRoute('/')({
  component: Landing,
})

/** Secondary pill — subtle, hairline-defined, carbon text. */
const secondaryCtaCss = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minH: '48px',
  px: '7',
  borderRadius: 'pill',
  border: '1px solid',
  borderColor: 'lead',
  font: 'inherit',
  fontSize: 'bodyMd',
  fontWeight: '700',
  letterSpacing: '-0.01em',
  background: 'bg',
  color: 'text',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 300ms ease, transform 160ms ease',
  _hover: { background: 'graphite' },
  _active: { transform: 'scale(0.965)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
})

/** Primary pill — Carbon Black bg, white text. THE one filled CTA. */
const primaryCtaCss = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5',
  minH: '48px',
  px: '7',
  borderRadius: 'pill',
  border: 'none',
  font: 'inherit',
  fontSize: 'bodyMd',
  fontWeight: '800',
  letterSpacing: '-0.01em',
  background: 'accent',
  color: 'bg',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'opacity 300ms ease, transform 160ms ease',
  _hover: { opacity: '0.92' },
  _active: { transform: 'scale(0.965)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
})

const footLinkCss = css({
  color: 'silver',
  textDecoration: 'none',
  _hover: { color: 'text', textDecoration: 'underline' },
})

const headlineCss = css({
  m: '0',
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: 'clamp(2.4rem, 6vw, 3.5rem)',
  letterSpacing: '-0.036em',
  lineHeight: '1.05',
  color: 'text',
})

const sublineCss = css({
  m: '0',
  maxW: '32rem',
  fontSize: 'clamp(0.9375rem, 1.4vw, 1.125rem)',
  fontWeight: '500',
  lineHeight: '1.5',
  letterSpacing: '-0.011em',
  color: 'silver',
})

const pulseLineCss = css({
  m: '0',
  fontSize: 'bodyMd',
  fontWeight: '500',
  lineHeight: '1.5',
  textAlign: 'center',
  color: 'silver',
})

const PULSE_LINE = 'No wearable needed — your camera reads your pulse, on-device, always.'
const SUBLINE =
  'Neuroacoustic soundscapes pressed like rare vinyl — each mode tuned to your pulse. Focus, flow, calm, sleep.'

function Headline() {
  return (
    <h1 className={headlineCss}>
      <span className={css({ display: 'block' })}>records cut for</span>
      <span className={css({ display: 'block' })}>the waking mind.</span>
    </h1>
  )
}

function FooterLine() {
  return (
    <p
      className={css({
        m: '0',
        px: '5',
        py: '7',
        textAlign: 'center',
        fontSize: 'caption',
        fontWeight: '500',
        color: 'silver',
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
  )
}

function Landing() {
  // Re-asserted on mount so SPA back-navigation restores the title.
  usePageTitle('SmartSound — calm, tuned to your body')
  const navigate = useNavigate()
  const playClick = useClickSound()
  const suggestion = useMemo(() => suggestFor(new Date()), [])

  /** THE gate — listening requires the on-device account; browsing never does. */
  const gatedPlay = (state: TargetState, minutes?: number) => {
    if (hasAccount()) {
      void navigate({ to: '/app/player', search: { state, minutes } })
    } else {
      void navigate({
        to: '/onboarding/$step',
        params: { step: 'auth' },
        search: { intent: 'play', state },
      })
    }
  }

  const startListening = () => {
    playClick('primary')
    gatedPlay(suggestion.state)
  }

  return (
    <div className={css({ position: 'relative', bg: 'bgDeep', color: 'text' })}>
      <LandingHeader />

      {/* ── The hero — a record floating on the grey canvas, card below. ── */}
      <section
        className={css({
          position: 'relative',
          minHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          px: '5',
          pt: 'calc(env(safe-area-inset-top) + 40px)',
          pb: '10',
        })}
      >
        <RecordHero
          className={css({
            width: 'min(92vw, 560px)',
            height: 'min(56vh, 520px)',
            flexShrink: '0',
          })}
        />
        {/* 30px gap → the app-window card, anchored below the disc. */}
        <div className={css({ mt: '30px', flexShrink: '0' })}>
          <AppWindowCard cta="Start listening" onCta={startListening} />
        </div>
      </section>

      {/* ── The statement. ── */}
      <section
        className={css({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '4',
          px: '5',
          pt: '4',
          pb: '10',
        })}
      >
        <Headline />
        <p className={sublineCss}>{SUBLINE}</p>
      </section>

      {/* ── The pressings — every mode as a record. ── */}
      <section
        aria-label="The pressings — every mode as a record"
        role="group"
        className={css({ maxW: '1100px', mx: 'auto', px: '5', pb: '4' })}
      >
        <p
          className={cx(
            'tabular',
            css({
              m: '0',
              mb: '5',
              textAlign: 'center',
              fontSize: 'caption',
              fontWeight: '700',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'silver',
            }),
          )}
        >
          The pressings
        </p>
        <div
          className={css({
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: { base: 'flex-start', md: 'center' },
            gap: '6',
            overflowX: 'auto',
            pb: '3',
            WebkitOverflowScrolling: 'touch',
          })}
        >
          {PRESSINGS.map((item) => (
            <div key={item.id} className={css({ flexShrink: '0', textAlign: 'center', width: '132px' })}>
              <button
                type="button"
                onClick={() => gatedPlay(item.state, item.minutes)}
                aria-label={`${item.title} — ${item.meta}. Play`}
                className={css({
                  display: 'block',
                  p: '0',
                  m: '0',
                  mx: 'auto',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: 'full',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'transform 200ms ease',
                  _hover: { transform: 'translateY(-3px)' },
                  _focusVisible: { outline: '2px solid token(colors.accent)', outlineOffset: '4px' },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _hover: { transform: 'none' } },
                })}
                style={{ color: pressingTint(item) }}
              >
                <RecordDisc state={item.state} size={120} spinning="none" />
              </button>
              <p
                className={css({
                  m: '0',
                  mt: '3',
                  fontFamily: 'display',
                  fontWeight: '700',
                  fontSize: 'bodyMd',
                  letterSpacing: '-0.02em',
                  color: 'text',
                })}
              >
                {item.title}
              </p>
              <p className={cx('tabular', css({ m: '0', mt: '0.5', fontSize: 'caption2', letterSpacing: '0.06em', color: 'silver' }))}>
                {item.meta}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The offer — CTAs, search, the pulse line. ── */}
      <section
        className={css({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4',
          maxW: '520px',
          mx: 'auto',
          px: '5',
          pt: '6',
          pb: '12',
        })}
      >
        <div className={css({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: '3' })}>
          <Link to="/app" className={secondaryCtaCss} onClick={() => playClick('primary')}>
            Browse the library
          </Link>
          <button type="button" className={primaryCtaCss} onClick={startListening}>
            Start listening
            <span aria-hidden className={css({ fontWeight: '800' })}>
              ›
            </span>
          </button>
        </div>
        <LandingSearch onPlay={gatedPlay} className={css({ maxW: '430px' })} />
        <p className={pulseLineCss}>{PULSE_LINE}</p>
      </section>

      <FooterLine />
      <NowPlayingWidget />
    </div>
  )
}
