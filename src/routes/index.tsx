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
import { WireSwarm } from '~/landing/WireSwarm'
import { useClickSound } from '~/lib/click-sound'
import { useEngine } from '~/lib/engine-context'

/**
 * Welcome — the bioluminescent laboratory at midnight.
 *
 * Abyssal Ink canvas (near-black with a green undertone), restrained white
 * single-weight type carved by size and tracking, mono instrument labels,
 * and one lime signal that lights only micro-surfaces. The Blender-rendered
 * specimens (cortex, pressing, tetra frame, pulse coil) float on the dark
 * field and BLUR under the pointer like objects slipping out of focal depth.
 * The wire swarm rides behind everything in bone-white — high contrast by
 * construction — and the hero PLAY button starts the real engine right here
 * on the page. Nav is a single glass pill at the viewport's center.
 */
export const Route = createFileRoute('/')({
  component: Welcome,
})

// Laboratory tokens: Abyssal Ink #222f30 · Bone #f7f7f5 · Lichen #c9cbbe ·
// Graphite #4d5757 · Bioluminescent Lime #cef79e — inline below; rationed.
const SANS = '"Hanken Grotesk Variable", "Inter Tight", Inter, system-ui, sans-serif'

const mono = css({
  m: '0',
  fontFamily: '"JetBrains Mono", "Roboto Mono", ui-monospace, monospace',
  fontSize: '13px',
  letterSpacing: '-0.02em',
  color: '#c9cbbe',
  textTransform: 'uppercase',
})

const limeDot = css({
  display: 'inline-block',
  w: '6px',
  h: '6px',
  borderRadius: '9999px',
  bg: '#cef79e',
  flexShrink: '0',
})

/** 40×40 lime arrow chip — the only place the accent fills a shape. */
const arrowChip = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '40px',
  h: '40px',
  borderRadius: '8px',
  bg: '#cef79e',
  color: '#222f30',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  flexShrink: '0',
  transition: 'filter 0.15s ease',
  _hover: { filter: 'brightness(1.06)' },
})

const ghostBtn = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  borderRadius: '8px',
  bg: 'transparent',
  border: '1px solid #4d5757',
  color: '#f7f7f5',
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: '13px',
  letterSpacing: '-0.02em',
  textTransform: 'uppercase',
  px: '4',
  py: '2.5',
  cursor: 'pointer',
  font: 'inherit',
  transition: 'border-color 0.15s ease, background 0.15s ease',
  _hover: { borderColor: '#c9cbbe', bg: '#ffffff0a' },
})

/** Preloader — abyssal curtain, bone wordmark, lime hairline, wipe. */
function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      sessionStorage.getItem('ss_lab') === '1'
    ) {
      setGone(true)
      onDone()
      return
    }
    let assets = 0
    let fonts = 0
    let shown = 0
    let raf = 0
    let finished = false
    const start = performance.now()
    const prev = THREE.DefaultLoadingManager.onProgress
    THREE.DefaultLoadingManager.onProgress = (_u, loaded, total) => {
      assets = total > 0 ? loaded / total : 1
    }
    void document.fonts.ready.then(() => {
      fonts = 1
    })
    const assetGrace = window.setTimeout(() => {
      if (assets === 0) assets = 1
    }, 900)
    const finish = () => {
      if (finished) return
      finished = true
      sessionStorage.setItem('ss_lab', '1')
      window.setTimeout(() => {
        onDone()
        setLeaving(true)
        window.setTimeout(() => setGone(true), 850)
      }, 200)
    }
    const tick = (t: number) => {
      const real = fonts * 0.4 + assets * 0.6
      const floor = Math.min(1, (t - start) / 1400)
      shown += (Math.min(real, floor) * 100 - shown) * 0.12
      setPct(Math.round(shown))
      if (shown > 99.2) {
        setPct(100)
        finish()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
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
      className={css({ position: 'fixed', inset: '0', zIndex: '100', bg: '#222f30' })}
      style={{
        clipPath: leaving ? 'inset(0 0 100% 0)' : 'inset(0 0 0% 0)',
        transition: 'clip-path 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className={css({ position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
        <span className={css({ display: 'block', overflow: 'hidden' })}>
          <span
            className={css({
              display: 'block',
              fontSize: 'clamp(36px, 5.5vw, 72px)',
              fontWeight: '400',
              letterSpacing: '-0.02em',
              color: '#f7f7f5',
              animation: 'riseUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
            })}
          >
            SmartSound
          </span>
        </span>
      </div>
      <div className={css({ position: 'absolute', bottom: '88px', insetX: '32px', h: '1px', bg: '#4d5757' })}>
        <div className={css({ h: '100%', bg: '#cef79e' })} style={{ width: `${pct}%`, transition: 'width 0.2s ease' }} />
      </div>
      <span
        className={cx(mono, css({ position: 'absolute', bottom: '48px', left: '32px', fontSize: '14px', color: '#f7f7f5' }))}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {String(pct).padStart(2, '0')}
      </span>
      <span className={cx(mono, css({ position: 'absolute', bottom: '48px', right: '32px' }))}>
        Cutting tonight&rsquo;s press…
      </span>
    </div>
  )
}

/** The single glass pill nav, pinned at the viewport center — ever so
 * slightly liquid: translucent ink, faint blur, hairline. */
function CenterNav() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  const link = css({
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontSize: '13px',
    letterSpacing: '-0.02em',
    textTransform: 'uppercase',
    color: '#c9cbbe',
    textDecoration: 'none',
    px: '2',
    py: '1',
    borderRadius: '8px',
    transition: 'color 0.15s ease, background 0.15s ease',
    _hover: { color: '#222f30', bg: '#cef79e' },
  })
  return (
    <div
      className={css({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '50',
        pointerEvents: 'none',
      })}
    >
      <nav
        className={css({
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '3',
          borderRadius: '12px',
          border: '1px solid #4d575788',
          px: '4',
          py: '2',
          bg: 'rgba(34, 47, 48, 0.52)',
          backdropFilter: 'blur(14px) saturate(150%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
        })}
        style={{ WebkitBackdropFilter: 'blur(14px) saturate(150%)' }}
      >
        <span className={css({ fontSize: '15px', fontWeight: '400', letterSpacing: '-0.01em', color: '#f7f7f5' })}>
          SmartSound
        </span>
        <span aria-hidden className={limeDot} />
        <a href="#press" className={cx(link, css({ display: 'none', sm: { display: 'inline' } }))}>Press</a>
        <a href="#attune" className={cx(link, css({ display: 'none', sm: { display: 'inline' } }))}>Attune</a>
        <a href="#science" className={cx(link, css({ display: 'none', sm: { display: 'inline' } }))}>Science</a>
        <Magnetic>
          <button
            data-cursor="OPEN"
            onClick={() => {
              playClick('primary')
              void navigate({ to: '/app' })
            }}
            className={css({
              borderRadius: '8px',
              bg: '#cef79e',
              color: '#222f30',
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: '13px',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              px: '3.5',
              py: '2',
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              transition: 'filter 0.15s ease',
              _hover: { filter: 'brightness(1.06)' },
            })}
          >
            Open app
          </button>
        </Magnetic>
      </nav>
    </div>
  )
}

/** A specimen floating on the dark field — blurs under the pointer, like an
 * object drifting out of focal depth. */
function Specimen({
  src,
  alt,
  className,
  rotate = 0,
  cursor,
  tagText,
}: {
  src: string
  alt: string
  className?: string
  rotate?: number
  cursor?: string
  tagText?: string
}) {
  return (
    <div className={cx(css({ position: 'absolute', pointerEvents: 'none' }), className)}>
      <img
        src={src}
        alt={alt}
        data-cursor={cursor}
        draggable={false}
        className={css({
          w: '100%',
          h: 'auto',
          pointerEvents: 'auto',
          userSelect: 'none',
          transition: 'filter 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          _hover: { filter: 'blur(7px) brightness(1.05)', transform: 'scale(1.02)' },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none', _hover: { filter: 'none', transform: 'none' } },
        })}
        style={{ rotate: `${rotate}deg` }}
      />
      {tagText && (
        <span
          className={cx(
            mono,
            css({
              position: 'absolute',
              bottom: '2%',
              left: '4%',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2',
              pointerEvents: 'auto',
            }),
          )}
        >
          <span aria-hidden className={limeDot} />
          {tagText}
        </span>
      )}
    </div>
  )
}

/** The hero PLAY control — starts the real engine on this page. */
function IntroPlay() {
  const playClick = useClickSound()
  const { status, start, stop } = useEngine()
  const running = status === 'running'
  return (
    <div className={css({ display: 'flex', alignItems: 'center', gap: '4' })}>
      <Magnetic>
        <button
          data-cursor={running ? 'STOP' : 'PLAY'}
          aria-label={running ? 'Stop the session' : 'Play a calm session here'}
          onClick={() => {
            playClick('primary')
            if (running) void stop()
            else void start('calm')
          }}
          className={cx(arrowChip, css({ w: '56px', h: '56px' }))}
        >
          {running ? (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <rect x="6.5" y="5.5" width="4" height="13" rx="1.3" fill="#222f30" />
              <rect x="13.5" y="5.5" width="4" height="13" rx="1.3" fill="#222f30" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
              <path d="M8.5 5.9a1 1 0 0 1 1.52-.85l9.6 6.1a1 1 0 0 1 0 1.7l-9.6 6.1a1 1 0 0 1-1.52-.85V5.9z" fill="#222f30" />
            </svg>
          )}
        </button>
      </Magnetic>
      <div>
        <p className={cx(mono, css({ color: '#f7f7f5' }))}>{running ? 'Live · Calm · playing here' : 'Press play — it plays right here'}</p>
        <p className={cx(mono, css({ mt: '1', fontSize: '12px' }))}>No account · 20 min free daily</p>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className={css({ position: 'relative', minHeight: '112vh' })}>
      {/* Specimens — hyperreal Blender renders on the dark field. */}
      <Specimen
        src="/assets/objects/brain.webp"
        alt="Rendered cortex specimen"
        className={css({ top: '2%', right: '-6%', w: 'min(46vw, 520px)', zIndex: '1' })}
        rotate={-8}
        cursor="THE CORTEX"
        tagText="Specimen 01 · The cortex"
      />
      <Specimen
        src="/assets/objects/record.webp"
        alt="Tonight's pressing — glossy vinyl with a lime label"
        className={css({ bottom: '-6%', left: '-5%', w: 'min(42vw, 470px)', zIndex: '1', display: 'none', sm: { display: 'block' } })}
        rotate={6}
        cursor="PLAY"
        tagText="Specimen 02 · Tonight's press"
      />
      <Specimen
        src="/assets/objects/tetra.webp"
        alt="Wire tetrahedron"
        className={css({ top: '58%', right: '20%', w: 'min(20vw, 210px)', zIndex: '1', display: 'none', md: { display: 'block' } })}
        rotate={12}
        cursor="DRAG"
      />

      <div className={css({ position: 'relative', zIndex: '2', maxW: '1200px', mx: 'auto', px: '6', pt: '13vh', sm: { px: '10' } })}>
        <p className={cx(mono, css({ mb: '5', display: 'inline-flex', alignItems: 'center', gap: '2' }))}>
          <span aria-hidden className={limeDot} />
          SmartSound — Neuroacoustic press · est. 2026
        </p>
        <SplitReveal
          as="h1"
          className={css({
            m: '0',
            fontSize: 'clamp(52px, 9.8vw, 158px)',
            fontWeight: '400',
            lineHeight: '1.0',
            letterSpacing: '-0.03em',
            color: '#f7f7f5',
            maxW: '1100px',
          })}
        >
          Stop chasing calm. Start hearing it.
        </SplitReveal>
        <FadeUp className={css({ mt: '10', maxW: '460px' })}>
          <p className={css({ m: '0', fontSize: '19px', fontWeight: '400', lineHeight: '1.3', letterSpacing: '-0.001em', color: '#c9cbbe' })}>
            Every session is pressed live from your pulse — a record cut for tonight only,
            played once, never repeated. The camera stays on your device.
          </p>
          <div className={css({ mt: '8' })}>
            <IntroPlay />
          </div>
        </FadeUp>
      </div>
      <span
        aria-hidden
        className={cx(
          mono,
          css({
            position: 'absolute',
            bottom: '24px',
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

/** Section counter pill — the table-of-contents voice. */
function Counter({ n, name }: { n: string; name: string }) {
  return (
    <p
      className={cx(
        mono,
        css({
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2',
          border: '1px solid #4d5757',
          borderRadius: '9999px',
          px: '3',
          py: '1.5',
          mb: '8',
        }),
      )}
    >
      {n} / {name}
    </p>
  )
}

const CATALOGUE = [
  { n: '01', title: 'Deep Focus', band: 'Beta · ~15 Hz', year: '2026' },
  { n: '02', title: 'Open Calm', band: 'Alpha · ~10 Hz', year: '2026' },
  { n: '03', title: 'Slow Drift', band: 'Theta · ~6 Hz', year: '2026' },
  { n: '04', title: 'First Sleep', band: 'Delta · ~2.5 Hz', year: '2026' },
]

function ThePress() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <section id="press" className={css({ position: 'relative', maxW: '1200px', mx: 'auto', px: '6', py: '28', sm: { px: '10' } })}>
      <Counter n="01" name="The press" />
      <SplitReveal
        as="h2"
        className={css({
          m: '0',
          mb: '12',
          fontSize: 'clamp(34px, 5.4vw, 75px)',
          fontWeight: '400',
          lineHeight: '1.1',
          letterSpacing: '-0.02em',
          color: '#f7f7f5',
          maxW: '820px',
        })}
      >
        Four bands. Pressed nightly.
      </SplitReveal>
      <FadeUp>
        <div className={css({ borderTop: '1px solid #4d5757' })}>
          {CATALOGUE.map((c) => (
            <button
              key={c.n}
              data-cursor="PLAY"
              onClick={() => {
                playClick('tap')
                void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
              }}
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '4',
                w: '100%',
                textAlign: 'left',
                bg: 'transparent',
                border: 'none',
                borderBottom: '1px solid #4d5757',
                py: '5',
                px: '2',
                cursor: 'pointer',
                font: 'inherit',
                transition: 'background 0.15s ease',
                _hover: { bg: '#ffffff0a' },
              })}
            >
              <span className={cx(mono, css({ w: '30px' }))}>{c.n}</span>
              <span aria-hidden className={limeDot} />
              <span className={css({ flex: '1', fontSize: '22px', fontWeight: '400', letterSpacing: '-0.006em', color: '#f7f7f5' })}>
                {c.title}
              </span>
              <span className={cx(mono, css({ display: 'none', sm: { display: 'inline' } }))}>{c.band}</span>
              <span className={mono}>{c.year}</span>
              <span className={arrowChip} aria-hidden>
                ↗
              </span>
            </button>
          ))}
        </div>
      </FadeUp>
    </section>
  )
}

/** The pulse trace — bone hairline with lime systolic peaks, drawn on entry. */
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
    <svg viewBox="0 0 600 80" className={css({ w: '100%', maxW: '480px', h: 'auto' })} aria-hidden>
      <path
        d="M166 40 L180 12 L194 66 M316 38 L330 10 L344 68 M486 40 L500 14 L514 64"
        fill="none"
        stroke="#cef79e"
        strokeWidth="1.6"
        opacity="0.9"
      />
      <path
        ref={ref}
        d="M0 46 H150 L166 40 L180 12 L194 66 L208 42 H300 L316 38 L330 10 L344 68 L358 44 H470 L486 40 L500 14 L514 64 L528 44 H600"
        fill="none"
        stroke="#f7f7f5"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function Attune() {
  return (
    <section id="attune" className={css({ position: 'relative', maxW: '1200px', mx: 'auto', px: '6', py: '28', sm: { px: '10' } })}>
      <Counter n="02" name="Attune" />
      <div className={css({ display: 'flex', gap: '14', alignItems: 'flex-start', flexWrap: 'wrap' })}>
        <div className={css({ flex: '1', minW: '300px', maxW: '680px' })}>
          <SplitReveal
            as="h2"
            className={css({
              m: '0',
              fontSize: 'clamp(34px, 5.4vw, 75px)',
              fontWeight: '400',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              color: '#f7f7f5',
            })}
          >
            The stylus is your heartbeat.
          </SplitReveal>
          <FadeUp className={css({ mt: '7', maxW: '440px' })}>
            <p className={css({ m: '0', fontSize: '18px', fontWeight: '400', lineHeight: '1.3', letterSpacing: '-0.001em', color: '#c9cbbe' })}>
              Attune reads the micro-flush of your skin through the camera — remote
              photoplethysmography — and lets your pulse steer tempo, density and brightness.
              Processed on your device. Never uploaded.
            </p>
            <div className={css({ mt: '8' })}>
              <PulseTrace />
              <p className={cx(mono, css({ mt: '2', display: 'inline-flex', alignItems: 'center', gap: '2' }))}>
                <span aria-hidden className={limeDot} />
                62 BPM · live · on-device
              </p>
            </div>
          </FadeUp>
        </div>
        <FadeUp delay={0.3} className={css({ position: 'relative' })}>
          <Specimen
            src="/assets/objects/coil.webp"
            alt="Pulse coil specimen"
            className={css({ position: 'relative!', w: 'min(60vw, 380px)' })}
            rotate={-4}
            cursor="ATTUNE"
            tagText="Specimen 03 · Pulse coil"
          />
        </FadeUp>
      </div>
    </section>
  )
}

const NUMBERS = [
  { v: '4', label: 'Brainwave bands' },
  { v: '15 Hz → 2.5 Hz', label: 'Beta down to Delta' },
  { v: '0', label: 'Data leaves your device' },
  { v: '20 min', label: 'Free, daily' },
]

/** The light flip — Bone White band, white card, counters in ink. */
function TheScience() {
  return (
    <section id="science" className={css({ position: 'relative', bg: '#f7f7f5', py: '28' })}>
      <div className={css({ maxW: '1200px', mx: 'auto', px: '6', sm: { px: '10' } })}>
        <p
          className={cx(
            mono,
            css({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2',
              border: '1px solid #c9cbbe',
              borderRadius: '9999px',
              px: '3',
              py: '1.5',
              mb: '8',
              color: '#4d5757',
            }),
          )}
        >
          03 / The science
        </p>
        <SplitReveal
          as="h2"
          className={css({
            m: '0',
            fontSize: 'clamp(34px, 5.4vw, 75px)',
            fontWeight: '400',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            color: '#222f30',
            maxW: '860px',
          })}
        >
          Measured first. Made audible second.
        </SplitReveal>
        <FadeUp className={css({ mt: '10' })}>
          <div className={css({ bg: '#ffffff', borderRadius: '20px', p: '10', border: '1px solid #c9cbbe' })}>
            <p className={css({ m: '0', mb: '10', maxW: '560px', fontSize: '18px', lineHeight: '1.3', color: '#4d5757' })}>
              The engine cites the rPPG literature and general auditory-entrainment findings —
              and claims nothing else. Attune shows only what it measured. SmartSound is not a
              medical device.
            </p>
            <div className={css({ display: 'grid', gap: '8', gridTemplateColumns: 'repeat(2, 1fr)', md: { gridTemplateColumns: 'repeat(4, 1fr)' } })}>
              {NUMBERS.map((n) => (
                <div key={n.label}>
                  <CountUp
                    value={n.v}
                    className={css({
                      display: 'block',
                      fontSize: 'clamp(30px, 3.6vw, 52px)',
                      fontWeight: '400',
                      letterSpacing: '-0.02em',
                      color: '#222f30',
                    })}
                  />
                  <span className={cx(mono, css({ mt: '1', display: 'inline-flex', alignItems: 'center', gap: '2', fontSize: '12px', color: '#4d5757' }))}>
                    <span aria-hidden className={limeDot} />
                    {n.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

const PLANS = [
  { n: '01', name: 'Free', price: '$0 forever', lines: 'Every state · 20 min a day · no account' },
  { n: '02', name: 'Pro', price: '$9.99 / month', lines: 'Unlimited · full Attune · all scenes' },
  { n: '03', name: 'Studio', price: '$19.99 / month', lines: 'Everything in Pro · sound controls' },
]

function Pricing() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <section id="pricing" className={css({ position: 'relative', maxW: '1200px', mx: 'auto', px: '6', py: '28', sm: { px: '10' } })}>
      <Counter n="04" name="Pricing" />
      <SplitReveal
        as="h2"
        className={css({
          m: '0',
          mb: '12',
          fontSize: 'clamp(34px, 5.4vw, 75px)',
          fontWeight: '400',
          lineHeight: '1.1',
          letterSpacing: '-0.02em',
          color: '#f7f7f5',
        })}
      >
        Start free. Stay honest.
      </SplitReveal>
      <FadeUp>
        <div className={css({ borderTop: '1px solid #4d5757', maxW: '900px' })}>
          {PLANS.map((p) => (
            <div
              key={p.n}
              className={css({
                display: 'flex',
                alignItems: 'baseline',
                gap: '4',
                borderBottom: '1px solid #4d5757',
                py: '5',
                px: '2',
                transition: 'background 0.15s ease',
                _hover: { bg: '#ffffff0a' },
              })}
            >
              <span className={cx(mono, css({ w: '30px' }))}>{p.n}</span>
              <span className={css({ w: '92px', fontSize: '22px', fontWeight: '400', letterSpacing: '-0.006em', color: '#f7f7f5' })}>
                {p.name}
              </span>
              <span className={cx(mono, css({ flex: '1', textTransform: 'none' }))}>{p.lines}</span>
              <span className={css({ fontSize: '16px', fontWeight: '400', color: '#f7f7f5' })}>{p.price}</span>
            </div>
          ))}
        </div>
        <div className={css({ mt: '8', display: 'flex', alignItems: 'center', gap: '4' })}>
          <Magnetic>
            <button
              data-cursor="PLAY"
              onClick={() => {
                playClick('primary')
                void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
              }}
              className={ghostBtn}
            >
              Start free <span aria-hidden>→</span>
            </button>
          </Magnetic>
          <span className={mono}>Real prices · cancel anytime</span>
        </div>
      </FadeUp>
    </section>
  )
}

/** Footer — the absolute-dark closure. */
function Footer() {
  return (
    <footer className={css({ position: 'relative', bg: '#000000', px: '6', py: '20', sm: { px: '10' } })}>
      <div className={css({ maxW: '1200px', mx: 'auto' })}>
        <p
          className={css({
            m: '0',
            fontSize: 'clamp(52px, 11vw, 158px)',
            fontWeight: '400',
            lineHeight: '1',
            letterSpacing: '-0.03em',
            color: '#f7f7f5',
          })}
        >
          SmartSound.
        </p>
        <div className={css({ mt: '12', display: 'flex', flexWrap: 'wrap', gap: '5' })}>
          {[
            ['Press', '#press'],
            ['Attune', '#attune'],
            ['Science', '#science'],
            ['Pricing', '#pricing'],
            ['Top', '#top'],
          ].map(([l, href]) => (
            <a
              key={l}
              href={href}
              className={cx(
                mono,
                css({
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                  _hover: { color: '#cef79e' },
                }),
              )}
            >
              {l}
            </a>
          ))}
        </div>
        <div className={css({ mt: '10', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '3' })}>
          <span className={cx(mono, css({ color: '#4d5757' }))}>Pressed at night · 2026</span>
          <span className={cx(mono, css({ color: '#4d5757' }))}>
            The camera stays on your device · not a medical device
          </span>
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
    <div id="top" className={css({ position: 'relative', bg: '#222f30', color: '#f7f7f5' })} style={{ fontFamily: SANS }}>
      <Preloader onDone={() => setReady(true)} />
      <CursorDot />
      <CenterNav />

      {/* The bone-white wire swarm — high contrast on the abyssal field. */}
      <div className={css({ transition: 'opacity 1s ease' })} style={{ opacity: ready ? 0.85 : 0 }}>
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
          className={css({
            fontSize: '18px',
            fontWeight: '400',
            letterSpacing: '-0.006em',
            color: '#c9cbbe99',
            borderColor: '#4d5757',
          })}
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
