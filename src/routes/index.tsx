import { useEffect, useRef, useState, type RefObject } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { CountUp, FadeUp, Magnetic, SplitReveal, useLenis } from '~/landing/craft'
import { TriangleConstellation } from '~/landing/TriangleConstellation'
import { useEngine } from '~/lib/engine-context'

/**
 * Welcome — quiet, white, and almost empty.
 *
 * One idea per screen, set in generous space: a headline, a line of body, at
 * most one action. The only ornament is the triangle constellation — and it is
 * never decoration: it holds the shape the current section is about (a brain,
 * a note, a waveform) and morphs between them as you scroll. Everything else
 * is ink on daylight. Reduced motion collapses the theater and keeps the words.
 */
export const Route = createFileRoute('/')({
  component: Welcome,
})

const BG = '#fbfbfd'
const INK = '#1d1d1f'
const MUTED = 'rgba(29, 29, 31, 0.60)'
const FAINT = 'rgba(29, 29, 31, 0.36)'
const HAIR = 'rgba(29, 29, 31, 0.09)'

// Deep sea-teals with a little navy — legible as ink on daylight, still
// unmistakably SmartSound. Pointer warmth stays the reserved yellow.
const DAYLIGHT_PALETTE = [
  '#0b7d74', '#0f9d92', '#0f9d92',
  '#17b3a6', '#17b3a6', '#2fd4c4',
  '#5ad0c5', '#1d3557', '#2c4a6e',
]
const HOVER_WARM = '#f0b429'

const wrap = css({
  maxW: '1080px',
  mx: 'auto',
  px: 'clamp(24px, 6vw, 64px)',
})

const display = css({
  m: '0',
  fontFamily: 'display',
  fontWeight: '600',
  letterSpacing: '-0.03em',
  lineHeight: '1.04',
  color: INK,
})

const body = css({
  m: '0',
  fontFamily: 'text',
  fontSize: 'clamp(17px, 1.4vw, 19px)',
  lineHeight: '1.6',
  color: MUTED,
  maxW: '34em',
})

const pillCta = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  bg: INK,
  color: '#ffffff',
  textDecoration: 'none',
  fontFamily: 'text',
  fontSize: '17px',
  fontWeight: '500',
  borderRadius: '9999px',
  px: '28px',
  py: '14px',
  border: 'none',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, background 0.2s ease',
  _hover: { bg: '#000000' },
  _focusVisible: { outline: '2px solid #0b7d74', outlineOffset: '3px' },
})

/** 0..1 progress through a tall section, written to a ref every scroll frame. */
function useSectionProgress(ref: RefObject<HTMLElement>) {
  const progressRef = useRef(0)
  useEffect(() => {
    const measure = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const span = rect.height - window.innerHeight
      if (span <= 0) return
      progressRef.current = Math.min(1, Math.max(0, -rect.top / span))
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [ref])
  return progressRef
}

// ── nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header
      className={css({
        position: 'fixed',
        top: '0',
        insetX: '0',
        zIndex: '40',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 'clamp(24px, 6vw, 64px)',
        height: '64px',
        bg: 'rgba(251, 251, 253, 0.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: `1px solid ${HAIR}`,
      })}
    >
      <span
        className={css({
          fontFamily: 'display',
          fontWeight: '600',
          fontSize: '17px',
          letterSpacing: '-0.02em',
          color: INK,
        })}
      >
        SmartSound
      </span>
      <Link
        to="/app"
        className={css({
          fontFamily: 'text',
          fontSize: '15px',
          fontWeight: '500',
          color: '#ffffff',
          bg: INK,
          textDecoration: 'none',
          borderRadius: '9999px',
          px: '18px',
          py: '8px',
          transition: 'background 0.2s ease',
          _hover: { bg: '#000000' },
          _focusVisible: { outline: '2px solid #0b7d74', outlineOffset: '3px' },
        })}
      >
        Open app
      </Link>
    </header>
  )
}

// ── hero ────────────────────────────────────────────────────────────────────

/** One-tap-to-sound: press play and a real Calm session starts, right here. */
function HeroPlay() {
  const { status, start, stop } = useEngine()
  const running = status === 'running'
  return (
    <div className={css({ display: 'flex', alignItems: 'center', gap: '14px' })}>
      <button
        type="button"
        aria-label={running ? 'Stop the sample' : 'Play a live sample'}
        onClick={() => {
          if (running) void stop()
          else void start('calm')
        }}
        className={css({
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          border: `1px solid ${HAIR}`,
          bg: '#ffffff',
          color: INK,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: '0',
          boxShadow: '0 1px 3px rgba(29, 29, 31, 0.08)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          _hover: { transform: 'scale(1.05)', boxShadow: '0 4px 14px rgba(29, 29, 31, 0.12)' },
          _focusVisible: { outline: '2px solid #0b7d74', outlineOffset: '3px' },
        })}
      >
        {running ? (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path
              d="M4.5 2.9a1 1 0 0 1 1.53-.85l8 5.1a1 1 0 0 1 0 1.7l-8 5.1a1 1 0 0 1-1.53-.85V2.9z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
      <span className={css({ fontFamily: 'text', fontSize: '15px', color: MUTED })}>
        {running ? 'Playing — a live Calm session' : 'Hear it. It plays right here.'}
      </span>
    </div>
  )
}

function Hero() {
  return (
    <section
      className={css({
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
      })}
    >
      {/* The brain, breathing quietly on the right — daylight teal ink. */}
      <TriangleConstellation
        shapes={['brain']}
        mode="static"
        rotate="sway"
        count={3000}
        size={0.062}
        cameraZ={6.6}
        particleOpacity={0.92}
        paletteOverride={DAYLIGHT_PALETTE}
        hoverColor={HOVER_WARM}
        stageOffsets={{ brain: 1.55 }}
        className={css({
          position: 'absolute',
          inset: '0',
          display: 'none',
          md: { display: 'block' },
        })}
      />
      <div className={`${wrap} ${css({ position: 'relative', zIndex: '1', width: '100%' })}`}>
        <div className={css({ maxW: '620px', display: 'grid', gap: '28px' })}>
          <h1 className={display} style={{ fontSize: 'clamp(46px, 7.4vw, 104px)' }}>
            <SplitReveal as="span" className={css({ display: 'block' })}>
              Calm,
            </SplitReveal>
            <SplitReveal as="span" className={css({ display: 'block' })} delay={0.08}>
              engineered.
            </SplitReveal>
          </h1>
          <p className={body}>
            SmartSound composes functional soundscapes that follow your nervous
            system — focus when you need it, rest when you don't.
          </p>
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '22px',
              flexWrap: 'wrap',
            })}
          >
            <Magnetic>
              <Link to="/app" className={pillCta}>
                Start free
              </Link>
            </Magnetic>
            <HeroPlay />
          </div>
        </div>
      </div>
      <span
        aria-hidden
        className={css({
          position: 'absolute',
          bottom: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'text',
          fontSize: '13px',
          letterSpacing: '0.08em',
          color: FAINT,
        })}
      >
        scroll
      </span>
    </section>
  )
}

// ── the morph journey — one object, three necessary shapes ─────────────────

const CHAPTERS = [
  {
    shape: 'It starts as your brain.',
    line: 'Every session begins from your state — the hour, your rhythm, what you ask of it.',
  },
  {
    shape: 'It becomes music.',
    line: 'The engine composes in real time. No loops, no playlists — sound written for this minute.',
  },
  {
    shape: 'It moves like a waveform.',
    line: 'A gentle pulse under the music nudges attention along, or lets it drift off.',
  },
] as const

function MorphJourney() {
  const sectionRef = useRef<HTMLElement>(null)
  const progressRef = useSectionProgress(sectionRef)
  const [chapter, setChapter] = useState(0)

  // Captions swap only when the scrubbed shape actually changes.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const idx = Math.min(
        CHAPTERS.length - 1,
        Math.floor(progressRef.current * CHAPTERS.length),
      )
      setChapter((cur) => (cur === idx ? cur : idx))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef])

  return (
    <section
      ref={sectionRef}
      aria-label="How SmartSound works"
      className={css({ position: 'relative', height: '340vh' })}
    >
      <div
        className={css({
          position: 'sticky',
          top: '0',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
        })}
      >
        <TriangleConstellation
          shapes={['brain', 'note', 'waveform']}
          mode="scroll"
          progressRef={progressRef}
          rotate="sway"
          count={3600}
          size={0.06}
          cameraZ={6.4}
          particleOpacity={0.92}
          paletteOverride={DAYLIGHT_PALETTE}
          hoverColor={HOVER_WARM}
          className={css({ position: 'absolute', inset: '0' })}
        />
        <div
          className={`${wrap} ${css({
            position: 'relative',
            zIndex: '1',
            width: '100%',
            pb: 'clamp(48px, 9vh, 96px)',
          })}`}
        >
          <div aria-live="polite" className={css({ maxW: '520px', display: 'grid', gap: '12px' })}>
            <h2
              key={`h-${chapter}`}
              className={`${display} ${css({ animation: 'riseUp 0.6s ease both' })}`}
              style={{ fontSize: 'clamp(28px, 3.6vw, 44px)' }}
            >
              {CHAPTERS[chapter].shape}
            </h2>
            <p
              key={`p-${chapter}`}
              className={`${body} ${css({ animation: 'riseUp 0.6s 0.06s ease both' })}`}
            >
              {CHAPTERS[chapter].line}
            </p>
            <div className={css({ display: 'flex', gap: '8px', mt: '10px' })} aria-hidden>
              {CHAPTERS.map((_, i) => (
                <span
                  key={i}
                  className={css({
                    width: '28px',
                    height: '2px',
                    borderRadius: '1px',
                    transition: 'background 0.4s ease',
                  })}
                  style={{ background: i === chapter ? INK : HAIR }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── three states, one sentence each ─────────────────────────────────────────

const STATES = [
  {
    name: 'Focus',
    tint: '#6f7ff0',
    line: 'Beta-band sessions that hold attention through deep work.',
  },
  {
    name: 'Relax',
    tint: '#5fb8c9',
    line: 'Alpha warmth that lets your shoulders drop between things.',
  },
  {
    name: 'Sleep',
    tint: '#b78fd6',
    line: 'Theta descents that hand you over to the night, gently.',
  },
] as const

function States() {
  return (
    <section className={css({ py: 'clamp(120px, 18vh, 220px)' })}>
      <div className={wrap}>
        <FadeUp>
          <h2 className={display} style={{ fontSize: 'clamp(32px, 4.6vw, 56px)', maxWidth: '14em' }}>
            Three states. One instrument.
          </h2>
        </FadeUp>
        <div
          className={css({
            display: 'grid',
            gap: 'clamp(40px, 6vw, 72px)',
            gridTemplateColumns: '1fr',
            md: { gridTemplateColumns: 'repeat(3, 1fr)' },
            mt: 'clamp(56px, 8vh, 96px)',
          })}
        >
          {STATES.map((s, i) => (
            <FadeUp key={s.name} delay={0.1 + i * 0.08}>
              <div className={css({ display: 'grid', gap: '14px' })}>
                <span
                  aria-hidden
                  className={css({ width: '10px', height: '10px', borderRadius: '50%' })}
                  style={{ background: s.tint }}
                />
                <h3 className={display} style={{ fontSize: '24px' }}>
                  {s.name}
                </h3>
                <p className={body} style={{ fontSize: '16px' }}>
                  {s.line}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── the promise, in three numbers ───────────────────────────────────────────

function Science() {
  return (
    <section
      className={css({ py: 'clamp(120px, 18vh, 220px)', borderTop: `1px solid ${HAIR}` })}
    >
      <div className={wrap}>
        <FadeUp>
          <p className={body} style={{ maxWidth: '38em' }}>
            Designed with the auditory-stimulation research on neural
            phase-locking — and honest about what that means: gentle help,
            not a miracle multiplier.
          </p>
        </FadeUp>
        <div
          className={css({
            display: 'grid',
            gap: 'clamp(40px, 6vw, 72px)',
            gridTemplateColumns: '1fr',
            sm: { gridTemplateColumns: 'repeat(3, 1fr)' },
            mt: 'clamp(48px, 7vh, 80px)',
          })}
        >
          {[
            {
              value: '4 bands',
              label: 'Beta · Alpha · Theta · Delta, each tuned to a state',
            },
            { value: '100%', label: 'composed in real time — nothing is a loop' },
            { value: '0 accounts', label: 'needed to press play; your sessions stay on-device' },
          ].map((stat, i) => (
            <FadeUp key={stat.label} delay={0.1 + i * 0.08}>
              <div className={css({ display: 'grid', gap: '8px' })}>
                <span className={display} style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>
                  <CountUp value={stat.value} />
                </span>
                <p className={body} style={{ fontSize: '15px' }}>
                  {stat.label}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── close ───────────────────────────────────────────────────────────────────

function Close() {
  return (
    <section
      className={css({
        py: 'clamp(140px, 22vh, 260px)',
        borderTop: `1px solid ${HAIR}`,
        textAlign: 'center',
      })}
    >
      <div className={wrap}>
        <FadeUp>
          <h2 className={display} style={{ fontSize: 'clamp(36px, 5.4vw, 72px)' }}>
            Free to begin.
          </h2>
        </FadeUp>
        <FadeUp delay={0.12}>
          <p className={`${body} ${css({ mx: 'auto', mt: '20px' })}`}>
            No card, no trial clock. Press play tonight; upgrade only if it earns it.
          </p>
        </FadeUp>
        <FadeUp delay={0.2}>
          <div className={css({ mt: '36px', display: 'flex', justifyContent: 'center' })}>
            <Magnetic>
              <Link to="/app" className={pillCta}>
                Open SmartSound
              </Link>
            </Magnetic>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className={css({ borderTop: `1px solid ${HAIR}`, py: '32px' })}>
      <div
        className={`${wrap} ${css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        })}`}
      >
        <span className={css({ fontFamily: 'text', fontSize: '13px', color: FAINT })}>
          © 2026 SmartSound
        </span>
        <Link
          to="/app"
          className={css({
            fontFamily: 'text',
            fontSize: '13px',
            color: MUTED,
            textDecoration: 'none',
            _hover: { color: INK },
          })}
        >
          Open app →
        </Link>
      </div>
    </footer>
  )
}

// ── page ────────────────────────────────────────────────────────────────────

function Welcome() {
  useLenis()
  return (
    <div
      className={css({ minHeight: '100vh' })}
      style={{ background: BG, color: INK, colorScheme: 'light' }}
    >
      <Nav />
      <main>
        <Hero />
        <MorphJourney />
        <States />
        <Science />
        <Close />
      </main>
      <Footer />
    </div>
  )
}
