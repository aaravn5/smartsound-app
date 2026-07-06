import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useReducedMotion } from 'motion/react'
import { css, cx } from 'styled-system/css'
import { LandingHeader } from '~/landing/LandingHeader'
import { LandingSearch } from '~/landing/LandingSearch'
import { NowPlayingWidget } from '~/landing/NowPlayingWidget'
import { StudyCanvas } from '~/landing/StudyCanvas'
import { PressingCarousel, PRESSINGS, pressingTint } from '~/landing/PressingCarousel'
import { RecordDisc } from '~/components/vinyl/RecordDisc'
import {
  HERO_SCROLL_VH,
  heroProgress,
  headlineOpacity,
  cueOpacity,
  act3Opacity,
  clamp01,
} from '~/landing/hero-math'
import { hasAccount } from '~/lib/account'
import { useClickSound } from '~/lib/click-sound'
import { usePageTitle } from '~/lib/page-title'
import { suggestFor } from '~/engine/circadian/model'
import type { TargetState } from '~/engine/audio/types'

/**
 * `/` — the three-act scroll-zoom hero. No video, no photos: a real-time
 * generative canvas. The page scrolls through a ~320vh container with a
 * position:sticky stage; scroll progress drives the camera timeline
 * (hero-math.ts):
 *
 *   Act I  — The Study: a dark room, desk in near-silhouette, one glowing
 *            screen, neural-drift particles, a whisper of EEG. Headline.
 *   Act II — The Zoom: the camera pushes INTO the screen across three
 *            parallax particle depths; the bezel becomes the viewport.
 *   Act III— The Pressings: inside the computer, the revolving rack of
 *            records (tonearm drop on play), CTAs, search, the pulse line.
 *
 * Browsing stays open (`/app` is one click away); LISTENING is the gate —
 * any play intent without an on-device account routes through
 * /onboarding/auth with the intent preserved.
 *
 * prefers-reduced-motion: no scroll-jack, no particles, no spin — a static
 * composed study + headline, then a normal-flow static record row + CTAs.
 */
export const Route = createFileRoute('/')({
  component: Landing,
})

/** Secondary pill — Ghost Blue @20%, Starlight text. */
const secondaryCtaCss = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minH: '50px',
  px: '7',
  borderRadius: 'pill',
  border: 'none',
  font: 'inherit',
  fontSize: 'bodyMd',
  fontWeight: '500',
  letterSpacing: '0.01em',
  background: 'rgba(205, 221, 255, 0.20)',
  color: 'starlight',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 300ms ease, transform 160ms ease',
  _hover: { background: 'rgba(205, 221, 255, 0.28)' },
  _active: { transform: 'scale(0.965)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
})

/** Primary pill — Mercury Blue bg, Pure White text. THE accent. */
const primaryCtaCss = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minH: '50px',
  px: '7',
  borderRadius: 'pill',
  border: 'none',
  font: 'inherit',
  fontSize: 'bodyMd',
  fontWeight: '500',
  letterSpacing: '0.01em',
  background: 'mercuryBlue',
  color: 'white',
  textDecoration: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 300ms ease, transform 160ms ease',
  _hover: { background: '#6377ee' },
  _active: { transform: 'scale(0.965)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
})

const footLinkCss = css({
  color: 'silver',
  textDecoration: 'none',
  _hover: { color: 'starlight', textDecoration: 'underline' },
})

const headlineCss = css({
  m: '0',
  fontFamily: 'display',
  fontWeight: '400',
  fontSize: 'clamp(2.6rem, 6.5vw, 4rem)',
  letterSpacing: '-0.02em',
  lineHeight: '1.1',
  color: 'starlight',
})

const sublineCss = css({
  m: '0',
  maxW: '30rem',
  fontSize: 'clamp(0.9375rem, 1.4vw, 1.0625rem)',
  lineHeight: '1.55',
  color: 'silver',
})

/** The PROMOTED honesty line — body size, not footer whisper (audit 1.5). */
const pulseLineCss = css({
  m: '0',
  fontSize: 'bodyMd',
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
      <span className={css({ display: 'block' })}>
        the <em className={css({ fontStyle: 'italic' })}>waking mind.</em>
      </span>
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
  const reduce = useReducedMotion()
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

  if (reduce) {
    return <ReducedLanding gatedPlay={gatedPlay} onStart={startListening} onBrowse={() => playClick('primary')} />
  }
  return <ScrollLanding gatedPlay={gatedPlay} onStart={startListening} onBrowse={() => playClick('primary')} />
}

interface LandingBodyProps {
  gatedPlay: (state: TargetState, minutes?: number) => void
  onStart: () => void
  onBrowse: () => void
}

// ── the moving hero — sticky stage + scroll-progress camera ────────────────

function ScrollLanding({ gatedPlay, onStart, onBrowse }: LandingBodyProps) {
  const heroRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const act3Ref = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const tintRef = useRef('#6f7ff0')

  useEffect(() => {
    let raf = 0
    let disposed = false
    const loop = () => {
      if (disposed) return
      raf = requestAnimationFrame(loop)
      const hero = heroRef.current
      if (!hero) return
      const rect = hero.getBoundingClientRect()
      const vh = window.innerHeight
      const p = heroProgress(-rect.top, 0, rect.height, vh)
      progressRef.current = p

      const headline = headlineRef.current
      if (headline) {
        headline.style.opacity = headlineOpacity(p).toFixed(3)
        headline.style.transform = `translateY(${(-90 * clamp01(p / 0.42)).toFixed(1)}px)`
      }
      const cue = cueRef.current
      if (cue) cue.style.opacity = cueOpacity(p).toFixed(3)
      const act3 = act3Ref.current
      if (act3) {
        const a = act3Opacity(p)
        act3.style.opacity = a.toFixed(3)
        const live = a > 0.15
        act3.style.pointerEvents = live ? 'auto' : 'none'
        // inert keeps the hidden acts out of the tab order.
        act3.toggleAttribute('inert', !live)
      }
    }
    raf = requestAnimationFrame(loop)
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className={css({ position: 'relative', bg: 'deepSpace', color: 'starlight' })}>
      <LandingHeader />

      {/* The three-act scroll container. */}
      <div ref={heroRef} data-hero-scroll className={css({ position: 'relative' })} style={{ height: `${HERO_SCROLL_VH}vh` }}>
        {/* The sticky viewport stage. */}
        <div
          className={css({
            position: 'sticky',
            top: '0',
            height: '100dvh',
            minHeight: '480px',
            overflow: 'hidden',
          })}
        >
          <StudyCanvas
            getProgress={() => progressRef.current}
            getTint={() => tintRef.current}
            reduced={false}
          />

          {/* Act I — headline over the study. */}
          <div
            ref={headlineRef}
            className={css({
              position: 'absolute',
              inset: '0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              textAlign: 'center',
              gap: '4',
              px: '5',
              pt: 'calc(env(safe-area-inset-top) + 16dvh)',
              pointerEvents: 'none',
            })}
          >
            <Headline />
            <p className={sublineCss}>{SUBLINE}</p>
          </div>

          {/* Scroll cue — thin line + caption pulsing at ~1 Hz. */}
          <div
            ref={cueRef}
            aria-hidden
            className={css({
              position: 'absolute',
              insetX: '0',
              bottom: 'calc(env(safe-area-inset-bottom) + 22px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2',
              pointerEvents: 'none',
            })}
          >
            <span className={cx('ss-cue-pulse', css({ display: 'block', width: '1px', height: '44px', background: 'starlight' }))} />
            <span
              className={cx(
                'ss-cue-pulse',
                'tabular',
                css({ fontSize: 'caption', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'silver' }),
              )}
            >
              scroll
            </span>
          </div>

          {/* Act III — inside the computer: the pressings + the offer. */}
          <div
            ref={act3Ref}
            data-act3
            className={css({
              position: 'absolute',
              inset: '0',
              display: 'flex',
              flexDirection: 'column',
              px: '5',
              pt: 'calc(env(safe-area-inset-top) + 82px)',
              pb: 'calc(env(safe-area-inset-bottom) + 18px)',
            })}
            style={{ opacity: 0, pointerEvents: 'none' }}
          >
            <p
              className={cx(
                'tabular',
                css({
                  m: '0',
                  textAlign: 'center',
                  fontSize: 'caption',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'silver',
                }),
              )}
            >
              The pressings
            </p>
            <div className={css({ flex: '1', minH: '150px', mt: '2', mb: '10' })}>
              <PressingCarousel
                onPlay={gatedPlay}
                onFocus={(_item, tint) => {
                  tintRef.current = tint
                }}
              />
            </div>

            <div
              className={css({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4',
                maxW: '520px',
                w: 'full',
                mx: 'auto',
              })}
            >
              <div className={css({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: '3' })}>
                <Link to="/app" className={secondaryCtaCss} onClick={onBrowse}>
                  Browse the library
                </Link>
                <button type="button" className={primaryCtaCss} onClick={onStart}>
                  Start listening
                </button>
              </div>
              <LandingSearch onPlay={gatedPlay} className={css({ maxW: '430px' })} />
              <p className={pulseLineCss}>{PULSE_LINE}</p>
            </div>
          </div>
        </div>
      </div>

      <FooterLine />
      <NowPlayingWidget />
    </div>
  )
}

// ── reduced motion — a static composed study, normal flow, no tricks ───────

function ReducedLanding({ gatedPlay, onStart, onBrowse }: LandingBodyProps) {
  return (
    <div className={css({ position: 'relative', bg: 'deepSpace', color: 'starlight' })}>
      <LandingHeader />

      {/* The study as a still + the headline. */}
      <section
        className={css({
          position: 'relative',
          minHeight: '86dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        })}
      >
        <div aria-hidden className={css({ position: 'absolute', inset: '0' })}>
          <StudyCanvas getProgress={() => 0} getTint={() => '#6f7ff0'} reduced />
        </div>
        <div
          className={css({
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '4',
            px: '5',
            pt: 'calc(env(safe-area-inset-top) + 64px)',
          })}
        >
          <Headline />
          <p className={sublineCss}>{SUBLINE}</p>
        </div>
      </section>

      {/* The pressings — a static row, fully reachable. */}
      <section
        aria-label="The pressings — every mode as a record"
        role="group"
        className={css({ maxW: '1200px', mx: 'auto', px: '5', pt: '10', pb: '4' })}
      >
        <div
          className={css({
            display: 'flex',
            alignItems: 'flex-start',
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
                  _focusVisible: { outline: '2px solid token(colors.ghostBlue)', outlineOffset: '4px' },
                })}
                style={{ color: pressingTint(item) }}
              >
                <RecordDisc state={item.state} size={120} spinning="none" />
              </button>
              <p
                className={css({
                  m: '0',
                  mt: '2.5',
                  fontFamily: 'display',
                  fontWeight: '400',
                  fontSize: 'bodyMd',
                  color: 'starlight',
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

      {/* CTAs + search + the pulse line. */}
      <section
        className={css({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4',
          maxW: '520px',
          mx: 'auto',
          px: '5',
          pb: '12',
        })}
      >
        <div className={css({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: '3' })}>
          <Link to="/app" className={secondaryCtaCss} onClick={onBrowse}>
            Browse the library
          </Link>
          <button type="button" className={primaryCtaCss} onClick={onStart}>
            Start listening
          </button>
        </div>
        <LandingSearch onPlay={gatedPlay} reduced className={css({ maxW: '430px' })} />
        <p className={pulseLineCss}>{PULSE_LINE}</p>
      </section>

      <FooterLine />
      <NowPlayingWidget />
    </div>
  )
}
