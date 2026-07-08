import { Suspense, useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as THREE from 'three'
import { css, cx } from 'styled-system/css'
import {
  CountUp,
  CursorDot,
  FadeUp,
  Magnetic,
  Marquee,
  SplitReveal,
  useLenis,
} from '~/landing/craft'
import { PhoneShowcase } from '~/landing/PhoneShowcase'
import { WireSwarm } from '~/landing/WireSwarm'
import { useClickSound } from '~/lib/click-sound'

/**
 * Welcome — the award pass: one continuous shot from preloader to footer.
 *
 * A real-progress preloader wipes to a fluid serif hero; the outlined
 * wire-tetra swarm rides fixed behind everything, scrubbed by Lenis scroll
 * through four band tints (Beta → Alpha → Theta → Delta); every display
 * heading enters as masked line reveals; marquee, honest counters, section
 * index numbers and an oversized footer carry the editorial furniture.
 * Colors resolve to design.md tokens — this pass added craft, not colors.
 */
export const Route = createFileRoute('/')({
  component: Welcome,
})

// design.md tokens
const MERCURY = '#5266eb'
const SERIF = '"Instrument Serif", Georgia, serif'

const monoLabel = css({
  m: '0',
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: '12px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#c3c3cc',
})

const mercuryPill = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  borderRadius: '32px',
  bg: '#5266eb',
  color: 'white',
  fontWeight: '500',
  fontSize: '15px',
  px: '6',
  py: '4',
  border: 'none',
  cursor: 'pointer',
  font: 'inherit',
  transition: 'filter 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  _hover: { filter: 'brightness(1.12)' },
})

const navLink = css({
  position: 'relative',
  fontSize: '13px',
  fontWeight: '500',
  color: '#c3c3cc',
  textDecoration: 'none',
  pb: '1',
  _after: {
    content: '""',
    position: 'absolute',
    left: '0',
    bottom: '0',
    height: '1px',
    width: '100%',
    background: '#ededf3',
    transform: 'scaleX(0)',
    transformOrigin: 'right',
    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  _hover: { color: '#ededf3', _after: { transform: 'scaleX(1)', transformOrigin: 'left' } },
})

const bodyCopy = css({
  m: '0',
  fontSize: '16px',
  lineHeight: '1.65',
  color: '#c3c3cc',
})

const displayH2 = css({
  m: '0',
  fontFamily: '"Instrument Serif", Georgia, serif',
  fontSize: 'clamp(32px, 4.5vw, 64px)',
  fontWeight: '400',
  lineHeight: '1.08',
  letterSpacing: '-0.01em',
  color: '#ededf3',
})

/** The preloader — real progress (fonts + three's loading manager), a masked
 * wordmark, mono counter, Lead hairline filling Mercury, then a vertical
 * clip-path wipe. Once per session; reduced motion never sees it. */
function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      sessionStorage.getItem('ss_pressed') === '1'
    ) {
      setGone(true)
      onDone()
      return
    }
    let assets = 0 // three's loader share
    let fonts = 0
    let shown = 0
    let raf = 0
    let finished = false
    const start = performance.now()
    const MIN_MS = 1400

    const prev = THREE.DefaultLoadingManager.onProgress
    THREE.DefaultLoadingManager.onProgress = (_u, loaded, total) => {
      assets = total > 0 ? loaded / total : 1
    }
    void document.fonts.ready.then(() => {
      fonts = 1
    })
    // If no three assets ever enqueue, don't hold the door.
    const assetGrace = window.setTimeout(() => {
      if (assets === 0) assets = 1
    }, 900)

    const finish = () => {
      if (finished) return
      finished = true
      sessionStorage.setItem('ss_pressed', '1')
      window.setTimeout(() => {
        onDone()
        setLeaving(true)
        window.setTimeout(() => setGone(true), 850)
      }, 200)
    }

    const tick = (t: number) => {
      const real = fonts * 0.4 + assets * 0.6
      const floor = Math.min(1, (t - start) / MIN_MS) // pacing floor
      const target = Math.min(real, floor) * 100
      shown += (target - shown) * 0.12
      setPct(Math.round(shown))
      if (shown > 99.2) {
        setPct(100)
        finish()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // Wall-clock failsafe — never trap anyone behind the curtain.
    const failsafe = window.setTimeout(() => {
      setPct(100)
      finish()
    }, 5000)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(failsafe)
      window.clearTimeout(assetGrace)
      THREE.DefaultLoadingManager.onProgress = prev
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (gone) return null
  return (
    <div
      aria-hidden
      className={css({ position: 'fixed', inset: '0', zIndex: '100', bg: '#171721' })}
      style={{
        clipPath: leaving ? 'inset(0 0 100% 0)' : 'inset(0 0 0% 0)',
        transition: 'clip-path 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        className={css({
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <span className={css({ display: 'block', overflow: 'hidden' })}>
          <span
            className={css({
              display: 'block',
              fontSize: 'clamp(40px, 7vw, 96px)',
              fontWeight: '400',
              letterSpacing: '-0.01em',
              color: '#ededf3',
              animation: 'riseUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
            })}
            style={{ fontFamily: SERIF }}
          >
            SmartSound
          </span>
        </span>
      </div>
      <div className={css({ position: 'absolute', bottom: '88px', insetX: '32px', h: '1px', bg: '#70707d55' })}>
        <div
          className={css({ h: '100%', bg: '#5266eb', transition: 'width 0.2s ease' })}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cx(monoLabel, css({ position: 'absolute', bottom: '48px', left: '32px', fontSize: '14px', color: '#ededf3' }))}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {String(pct).padStart(2, '0')}
      </span>
      <span className={cx(monoLabel, css({ position: 'absolute', bottom: '48px', right: '32px' }))}>
        Cutting today&rsquo;s press…
      </span>
    </div>
  )
}

/** Thin nav — serif wordmark, underline-reveal links, one Mercury pill. */
function Nav() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <nav
      className={css({
        position: 'fixed',
        top: '0',
        insetX: '0',
        zIndex: '50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: '7',
        py: '5',
        background: 'linear-gradient(to bottom, rgba(23, 23, 33, 0.88), transparent)',
      })}
    >
      <a
        href="#top"
        className={css({ fontSize: '20px', color: '#ededf3', textDecoration: 'none' })}
        style={{ fontFamily: SERIF }}
      >
        SmartSound
      </a>
      <div className={css({ display: 'none', md: { display: 'flex' }, gap: '6', alignItems: 'center' })}>
        <a href="#press" className={navLink}>The press</a>
        <a href="#attune" className={navLink}>Attune</a>
        <a href="#science" className={navLink}>The science</a>
        <a href="#pricing" className={navLink}>Pricing</a>
      </div>
      <Magnetic>
        <button
          data-cursor="OPEN"
          onClick={() => {
            playClick('primary')
            void navigate({ to: '/app' })
          }}
          className={cx(mercuryPill, css({ py: '2.5', px: '5', fontSize: '13px' }))}
        >
          Open the app
        </button>
      </Magnetic>
    </nav>
  )
}

/** Mono section index label — `01 / THE PRESS`. */
function SectionIndex({ n, name }: { n: string; name: string }) {
  return (
    <p className={cx(monoLabel, css({ mb: '8' }))}>
      {n} / {name}
    </p>
  )
}

function Hero() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <section
      className={css({
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: '7',
        sm: { px: '12' },
      })}
    >
      {/* The Calm layer — a Mercury-tinted glow drifting like slow water. */}
      <div
        aria-hidden
        className={css({
          position: 'absolute',
          inset: '-20%',
          pointerEvents: 'none',
          background:
            'radial-gradient(45% 38% at 60% 45%, rgba(82, 102, 235, 0.06) 0%, transparent 70%)',
          animation: 'glowDrift 24s ease-in-out infinite',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        })}
      />
      <div className={css({ position: 'relative', maxW: '1100px' })}>
        <p className={cx(monoLabel, css({ mb: '6' }))}>Pressed at night · played by your pulse</p>
        <SplitReveal
          as="h1"
          className={css({
            m: '0',
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 'clamp(44px, 7vw, 110px)',
            fontWeight: '400',
            lineHeight: '1.05',
            letterSpacing: '-0.01em',
            color: '#ededf3',
          })}
        >
          Stop chasing calm. Start hearing it.
        </SplitReveal>
        <FadeUp className={css({ mt: '7', maxW: '460px' })}>
          <p className={cx(bodyCopy, css({ fontSize: '17px' }))}>
            SmartSound reads your pulse from your camera and presses a living record for the
            state you asked for — focus, calm, or sleep. On your device. Never uploaded.
          </p>
          <div className={css({ mt: '8', display: 'flex', alignItems: 'center', gap: '5' })}>
            <Magnetic>
              <button
                data-cursor="PLAY"
                onClick={() => {
                  playClick('primary')
                  void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
                }}
                className={mercuryPill}
              >
                Start listening
              </button>
            </Magnetic>
            <span className={monoLabel}>Free · no account</span>
          </div>
        </FadeUp>
      </div>
      {/* Scroll cue — 1 Hz. */}
      <span
        aria-hidden
        className={cx(
          monoLabel,
          css({
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'cuePulse 1s ease-in-out infinite',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }),
        )}
      >
        Scroll ↓
      </span>
    </section>
  )
}

const SLEEVES = [
  {
    band: 'BETA · ~15 Hz',
    tint: '#6f7ff0',
    title: 'Deep Focus',
    body: 'Steady, lyric-free momentum cut against your live pulse — a side that holds as long as the work does.',
  },
  {
    band: 'ALPHA · ~10 Hz',
    tint: '#5fb8c9',
    title: 'Open Calm',
    body: 'Soft pads and slow air that ease a racing afternoon back down to baseline.',
  },
  {
    band: 'DELTA · ~2.5 Hz',
    tint: '#4a5a8a',
    title: 'First Sleep',
    body: 'A pressing that dims with you — slower, darker, quieter as your body lets go.',
  },
]

function ThePress() {
  return (
    <section id="press" className={css({ position: 'relative', px: '7', py: '32', maxW: '1100px', mx: 'auto' })}>
      <SectionIndex n="01" name="The press" />
      <SplitReveal as="h2" className={cx(displayH2, css({ maxW: '760px' }))}>
        Every session is a record, pressed for tonight only.
      </SplitReveal>
      <FadeUp
        className={css({
          mt: '12',
          display: 'grid',
          gap: '6',
          md: { gridTemplateColumns: 'repeat(3, 1fr)' },
        })}
      >
        {SLEEVES.map((s) => (
          <div
            key={s.title}
            data-cursor="PLAY"
            className={css({
              bg: '#1e1e2a',
              borderRadius: '4px',
              p: '7',
              overflow: 'hidden',
              transition: 'background 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              _hover: { bg: '#262633' },
            })}
          >
            {/* The record peeking from the sleeve. */}
            <div aria-hidden className={css({ position: 'relative', h: '120px', mb: '6' })}>
              <div
                className={css({
                  position: 'absolute',
                  top: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  w: '180px',
                  h: '180px',
                  borderRadius: 'full',
                  bg: '#101018',
                  border: '1px solid #70707d33',
                })}
                style={{
                  backgroundImage:
                    'repeating-radial-gradient(circle at 50% 50%, transparent 0 3px, rgba(112, 112, 125, 0.14) 3px 4px)',
                }}
              >
                <span
                  className={css({
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    w: '56px',
                    h: '56px',
                    borderRadius: 'full',
                  })}
                  style={{ background: s.tint }}
                />
              </div>
            </div>
            <p className={cx(monoLabel, css({ fontSize: '10px' }))} style={{ color: s.tint }}>
              {s.band}
            </p>
            <h3 className={css({ m: '0', mt: '2', fontSize: '20px', fontWeight: '600', color: '#ededf3' })}>
              {s.title}
            </h3>
            <p className={cx(bodyCopy, css({ mt: '2', fontSize: '15px' }))}>{s.body}</p>
          </div>
        ))}
      </FadeUp>
    </section>
  )
}

/** The pulse trace — a hairline polyline in Alpha tint that draws itself on
 * entry, mono BPM readout beneath. */
function PulseTrace() {
  const ref = useRef<SVGPathElement>(null)
  useEffect(() => {
    const path = ref.current
    if (!path) return
    const len = path.getTotalLength()
    path.style.strokeDasharray = `${len}`
    path.style.strokeDashoffset = `${len}`
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        path.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(0.16, 1, 0.3, 1)'
        path.style.strokeDashoffset = '0'
      },
      { rootMargin: '-80px' },
    )
    io.observe(path)
    return () => io.disconnect()
  }, [])
  return (
    <svg viewBox="0 0 600 80" className={css({ w: '100%', maxW: '520px', h: 'auto' })} aria-hidden>
      <path
        ref={ref}
        d="M0 46 H150 L166 40 L180 12 L194 66 L208 42 H300 L316 38 L330 10 L344 68 L358 44 H470 L486 40 L500 14 L514 64 L528 44 H600"
        fill="none"
        stroke="#5fb8c9"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function Attune() {
  return (
    <section id="attune" className={css({ position: 'relative', px: '7', py: '32', maxW: '1100px', mx: 'auto' })}>
      <SectionIndex n="02" name="Attune" />
      <div className={css({ display: 'flex', gap: '12', alignItems: 'center', flexWrap: 'wrap' })}>
        <div className={css({ flex: '1', minW: '300px' })}>
          <SplitReveal as="h2" className={displayH2}>
            The stylus is your heartbeat.
          </SplitReveal>
          <FadeUp className={css({ mt: '7', maxW: '440px' })}>
            <p className={bodyCopy}>
              Attune watches the micro-flush of your skin through the camera — remote
              photoplethysmography — and lets your pulse steer tempo, density and brightness.
              Frames are processed on your device and never leave it.
            </p>
            <div className={css({ mt: '8' })}>
              <PulseTrace />
              <p className={cx(monoLabel, css({ mt: '3' }))}>62 BPM · live · on-device</p>
            </div>
          </FadeUp>
        </div>
        <FadeUp delay={0.3}>
          <PhoneShowcase />
        </FadeUp>
      </div>
    </section>
  )
}

const NUMBERS = [
  { v: '4', label: 'brainwave bands' },
  { v: '15 Hz → 2.5 Hz', label: 'Beta down to Delta' },
  { v: '0', label: 'data leaves your device' },
  { v: '20 min', label: 'free, daily' },
]

function TheScience() {
  return (
    <section id="science" className={css({ position: 'relative', px: '7', py: '32', maxW: '1100px', mx: 'auto' })}>
      <SectionIndex n="03" name="The science" />
      <SplitReveal as="h2" className={cx(displayH2, css({ maxW: '820px' }))}>
        Measured first. Made audible second.
      </SplitReveal>
      <FadeUp className={css({ mt: '7', maxW: '520px' })}>
        <p className={bodyCopy}>
          The engine cites the rPPG literature and general auditory-entrainment findings — and
          claims nothing else. Attune shows only what it measured. SmartSound is not a medical
          device.
        </p>
      </FadeUp>
      <FadeUp
        delay={0.25}
        className={css({
          mt: '14',
          display: 'grid',
          gap: '10',
          gridTemplateColumns: 'repeat(2, 1fr)',
          md: { gridTemplateColumns: 'repeat(4, 1fr)' },
        })}
      >
        {NUMBERS.map((n) => (
          <div key={n.label}>
            <CountUp
              value={n.v}
              className={css({
                display: 'block',
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 'clamp(26px, 3.2vw, 44px)',
                color: '#ededf3',
                letterSpacing: '-0.02em',
              })}
            />
            <span className={cx(monoLabel, css({ mt: '2', display: 'block', fontSize: '11px' }))}>
              {n.label}
            </span>
          </div>
        ))}
      </FadeUp>
    </section>
  )
}

const PLANS = [
  { name: 'Free', price: '$0', per: 'forever', lines: ['Every state', '20 minutes a day', 'No account'] },
  { name: 'Pro', price: '$9.99', per: '/ month', lines: ['Unlimited listening', 'Full Attune', 'All scenes'] },
  { name: 'Studio', price: '$19.99', per: '/ month', lines: ['Everything in Pro', 'Sound controls', 'Early features'] },
]

function Pricing() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <section id="pricing" className={css({ position: 'relative', px: '7', py: '32', maxW: '1100px', mx: 'auto' })}>
      <SectionIndex n="04" name="Pricing" />
      <SplitReveal as="h2" className={displayH2}>
        Start free. Stay honest.
      </SplitReveal>
      <FadeUp className={css({ mt: '12', display: 'grid', gap: '6', md: { gridTemplateColumns: 'repeat(3, 1fr)' } })}>
        {PLANS.map((p, i) => (
          <div
            key={p.name}
            className={css({ bg: '#1e1e2a', borderRadius: '4px', p: '7' })}
            style={i === 1 ? { outline: `1px solid ${MERCURY}66` } : undefined}
          >
            <p className={monoLabel}>{p.name}</p>
            <p className={css({ m: '0', mt: '3', color: '#ededf3' })}>
              <span className={css({ fontSize: '40px' })} style={{ fontFamily: SERIF }}>
                {p.price}
              </span>{' '}
              <span className={cx(monoLabel, css({ display: 'inline' }))}>{p.per}</span>
            </p>
            <ul
              className={css({
                m: '0',
                mt: '5',
                p: '0',
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '2',
                fontSize: '15px',
                color: '#c3c3cc',
              })}
            >
              {p.lines.map((l) => (
                <li key={l}>— {l}</li>
              ))}
            </ul>
          </div>
        ))}
      </FadeUp>
      <FadeUp delay={0.2} className={css({ mt: '10', display: 'flex', alignItems: 'center', gap: '5' })}>
        <Magnetic>
          <button
            data-cursor="PLAY"
            onClick={() => {
              playClick('primary')
              void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
            }}
            className={mercuryPill}
          >
            Start free
          </button>
        </Magnetic>
        <span className={monoLabel}>Real prices · cancel anytime</span>
      </FadeUp>
    </section>
  )
}

function Footer() {
  return (
    <footer className={css({ position: 'relative', bg: '#14141d', pt: '24', pb: '10', px: '7' })}>
      <div className={css({ maxW: '1100px', mx: 'auto' })}>
        <p
          className={css({
            m: '0',
            fontSize: 'clamp(64px, 12vw, 190px)',
            fontWeight: '400',
            lineHeight: '1',
            letterSpacing: '-0.02em',
            color: '#ededf3',
          })}
          style={{ fontFamily: SERIF }}
        >
          SmartSound
        </p>
        <div
          className={css({
            mt: '14',
            display: 'grid',
            gap: '8',
            pb: '12',
            borderBottom: '1px solid #70707d33',
            sm: { gridTemplateColumns: 'repeat(3, 1fr)' },
          })}
        >
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '2.5', alignItems: 'flex-start' })}>
            <a href="#press" className={navLink}>The press</a>
            <a href="#attune" className={navLink}>Attune</a>
          </div>
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '2.5', alignItems: 'flex-start' })}>
            <a href="#science" className={navLink}>The science</a>
            <a href="#pricing" className={navLink}>Pricing</a>
          </div>
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '2.5', alignItems: 'flex-start' })}>
            <a href="#top" className={navLink}>Top</a>
          </div>
        </div>
        <div className={css({ mt: '6', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '4' })}>
          <span className={monoLabel}>Pressed at night · 2026</span>
          <span className={monoLabel}>The camera stays on your device. Not a medical device.</span>
        </div>
      </div>
    </footer>
  )
}

function Welcome() {
  const [ready, setReady] = useState(false)
  const progressRef = useRef(0)
  useLenis((p) => {
    progressRef.current = p
  })

  return (
    <div id="top" className={css({ position: 'relative', bg: '#171721', color: '#ededf3' })}>
      <Preloader onDone={() => setReady(true)} />
      <CursorDot />
      <Nav />

      {/* The outlined swarm — a fixed continuous companion behind everything. */}
      <div className={css({ transition: 'opacity 1s ease' })} style={{ opacity: ready ? 1 : 0 }}>
        <Suspense fallback={null}>
          <WireSwarm progressRef={progressRef} />
        </Suspense>
      </div>

      <div
        className={css({ position: 'relative', zIndex: '1', transition: 'opacity 0.9s ease' })}
        style={{ opacity: ready ? 1 : 0 }}
      >
        <Hero />
        <Marquee
          className={css({ fontStyle: 'italic', fontSize: '22px', color: '#70707d99', fontFamily: '"Instrument Serif", Georgia, serif' })}
          text="BETA · ~15 Hz — ALPHA · ~10 Hz — THETA · ~6 Hz — DELTA · ~2.5 Hz — "
        />
        <ThePress />
        <Attune />
        <TheScience />
        <Pricing />
        <Footer />
      </div>
    </div>
  )
}
