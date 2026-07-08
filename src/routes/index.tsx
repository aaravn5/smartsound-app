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
 * Welcome — the floating museum of calm.
 *
 * A light Gallery Plate canvas hosts Blender-rendered artifacts (the record,
 * the wire tetra, the sleeve, the pulse coil) floating directly on the field
 * — no cards, no shadows — while the Dala/Auros craft carries the motion:
 * real-progress preloader, Lenis glide, scroll-scrubbed wire swarm in carbon,
 * masked line reveals, marquee, honest counters. One typeface at one weight
 * with negative tracking; one Voltage Lime action per screen; pills are the
 * only container shape. UI retreats, objects advance.
 */
export const Route = createFileRoute('/')({
  component: Welcome,
})

// Museum tokens: Gallery Plate #e5e7eb · Carbon · Chalk #f4f4f4 · Voltage
// Lime #e2ff70 — values inline below; the palette is rationed by rule.
const GROTESK = '"Hanken Grotesk Variable", Inter, system-ui, sans-serif'

const label = css({
  m: '0',
  fontSize: '12px',
  fontWeight: '500',
  letterSpacing: '-0.02em',
  color: '#000000',
})

const tag = css({
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '9999px',
  bg: '#f4f4f4',
  border: '1px solid #e5e7eb',
  px: '2.5',
  py: '1',
  fontSize: '12px',
  fontWeight: '500',
  letterSpacing: '-0.02em',
  color: '#000000',
})

const limePill = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  borderRadius: '9999px',
  bg: '#e2ff70',
  color: '#000000',
  fontSize: '14px',
  fontWeight: '500',
  letterSpacing: '-0.03em',
  px: '4',
  py: '2',
  border: 'none',
  cursor: 'pointer',
  font: 'inherit',
  transition: 'filter 0.15s ease',
  _hover: { filter: 'brightness(0.95)' },
})

const ghostPill = css({
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '9999px',
  bg: '#f4f4f4',
  border: '1px solid #e5e7eb',
  color: '#000000',
  fontSize: '14px',
  fontWeight: '500',
  letterSpacing: '-0.03em',
  px: '4',
  py: '2',
  cursor: 'pointer',
  font: 'inherit',
  transition: 'background 0.15s ease',
  _hover: { bg: '#dedede' },
})

const ghostLink = css({
  color: '#000000',
  fontSize: '14px',
  fontWeight: '500',
  letterSpacing: '-0.03em',
  textDecoration: 'none',
  borderRadius: '9999px',
  px: '2',
  py: '1',
  transition: 'background 0.12s ease',
  _hover: { bg: '#e2ff70' },
})

/** Preloader — Gallery Plate curtain, carbon counter, lime hairline, wipe.
 * Real progress (fonts + three's manager); once per session; reduced motion
 * never sees it; wall-clock failsafe. */
function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      sessionStorage.getItem('ss_museum') === '1'
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
      sessionStorage.setItem('ss_museum', '1')
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
      className={css({ position: 'fixed', inset: '0', zIndex: '100', bg: '#e5e7eb' })}
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
              fontSize: 'clamp(34px, 5vw, 64px)',
              fontWeight: '500',
              letterSpacing: '-0.04em',
              color: '#000000',
              animation: 'riseUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
            })}
          >
            SmartSound®
          </span>
        </span>
      </div>
      <div className={css({ position: 'absolute', bottom: '88px', insetX: '32px', h: '1px', bg: '#00000022' })}>
        <div className={css({ h: '100%', bg: '#e2ff70' })} style={{ width: `${pct}%`, transition: 'width 0.2s ease' }} />
      </div>
      <span
        className={cx(label, css({ position: 'absolute', bottom: '48px', left: '32px', fontSize: '14px' }))}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {String(pct).padStart(2, '0')}
      </span>
      <span className={cx(label, css({ position: 'absolute', bottom: '48px', right: '32px' }))}>
        Cutting today&rsquo;s press…
      </span>
    </div>
  )
}

/** The floating central nav — the only persistent UI element. Chalk pill,
 * hairline border, wordmark + carbon pip + the one lime action. */
function FloatingNav() {
  const navigate = useNavigate()
  const playClick = useClickSound()
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
      <div
        className={css({
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '3',
          borderRadius: '9999px',
          bg: '#f4f4f4f2',
          border: '1px solid #e5e7eb',
          px: '4',
          py: '2',
          backdropFilter: 'blur(6px)',
        })}
      >
        <span className={css({ fontSize: '14px', fontWeight: '500', letterSpacing: '-0.034em', color: '#000000' })}>
          SmartSound®
        </span>
        <span aria-hidden className={css({ w: '10px', h: '10px', borderRadius: '9999px', bg: '#000000' })} />
        <a href="#catalogue" className={cx(ghostLink, css({ display: 'none', sm: { display: 'inline' } }))}>
          Catalogue
        </a>
        <a href="#attune" className={cx(ghostLink, css({ display: 'none', sm: { display: 'inline' } }))}>
          Attune
        </a>
        <Magnetic>
          <button
            data-cursor="OPEN"
            onClick={() => {
              playClick('primary')
              void navigate({ to: '/app' })
            }}
            className={limePill}
          >
            Open app <span aria-hidden>●</span>
          </button>
        </Magnetic>
      </div>
    </div>
  )
}

/** A museum artifact floating directly on the plate — no card, no shadow. */
function Artifact({
  src,
  alt,
  className,
  rotate = 0,
  cursor,
  tagText,
  tagPos,
}: {
  src: string
  alt: string
  className?: string
  rotate?: number
  cursor?: string
  tagText?: string
  tagPos?: 'tl' | 'br'
}) {
  return (
    <div className={cx(css({ position: 'absolute', pointerEvents: 'none' }), className)}>
      <img
        src={src}
        alt={alt}
        data-cursor={cursor}
        className={css({ w: '100%', h: 'auto', pointerEvents: 'auto', userSelect: 'none' })}
        style={{ transform: `rotate(${rotate}deg)` }}
        draggable={false}
      />
      {tagText && (
        <span
          className={cx(
            tag,
            css({ position: 'absolute', pointerEvents: 'auto' }),
            tagPos === 'br' ? css({ bottom: '4%', right: '2%' }) : css({ top: '4%', left: '2%' }),
          )}
        >
          {tagText}
        </span>
      )}
    </div>
  )
}

function Hero() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <section className={css({ position: 'relative', minHeight: '108vh', overflow: 'visible' })}>
      {/* The floating collection — objects overflow and overlap by design. */}
      <Artifact
        src="/assets/objects/record.webp"
        alt="A SmartSound pressing — vinyl with a lime label"
        className={css({ top: '4%', right: '-9%', w: 'min(52vw, 560px)', zIndex: '1' })}
        rotate={-12}
        cursor="PLAY"
        tagText="TONIGHT'S PRESS"
        tagPos="br"
      />
      <Artifact
        src="/assets/objects/tetra.webp"
        alt="Wire tetrahedron"
        className={css({ top: '52%', right: '18%', w: 'min(24vw, 240px)', zIndex: '1', display: 'none', md: { display: 'block' } })}
        rotate={14}
        cursor="DRAG"
        tagText="OBJECT 02"
      />
      <Artifact
        src="/assets/objects/coil.webp"
        alt="Pulse coil"
        className={css({ bottom: '-4%', left: '-4%', w: 'min(30vw, 300px)', zIndex: '1', display: 'none', sm: { display: 'block' } })}
        rotate={-6}
        cursor="ATTUNE"
        tagText="62 BPM"
        tagPos="br"
      />

      {/* Poster headline, compressed grotesque — left-anchored. */}
      <div className={css({ position: 'relative', zIndex: '2', pt: '14vh', px: '6', sm: { px: '10' }, maxW: '900px' })}>
        <p className={cx(label, css({ mb: '4' }))}>SMARTSOUND® — A LISTENING MUSEUM · EST. 2026</p>
        <SplitReveal
          as="h1"
          className={css({
            m: '0',
            fontSize: 'clamp(42px, 7.4vw, 108px)',
            fontWeight: '500',
            lineHeight: '0.98',
            letterSpacing: '-0.045em',
            color: '#000000',
          })}
        >
          Stop chasing calm. Start hearing it.
        </SplitReveal>
        <FadeUp className={css({ mt: '6', maxW: '420px' })}>
          <p className={css({ m: '0', fontSize: '16px', fontWeight: '500', lineHeight: '1.4', letterSpacing: '-0.03em', color: '#3a3a3f' })}>
            Every session is an object: a record pressed live from your pulse, played once,
            never repeated. The camera stays on your device.
          </p>
          <div className={css({ mt: '6', display: 'flex', alignItems: 'center', gap: '3' })}>
            <Magnetic>
              <button
                data-cursor="PLAY"
                onClick={() => {
                  playClick('primary')
                  void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
                }}
                className={limePill}
              >
                Start listening
              </button>
            </Magnetic>
            <span className={tag}>FREE · NO ACCOUNT</span>
          </div>
        </FadeUp>
      </div>
      <span
        aria-hidden
        className={cx(
          label,
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
        SCROLL ↓
      </span>
    </section>
  )
}

const CATALOGUE = [
  { n: '01', title: 'Deep Focus', band: 'BETA · ~15 Hz', tint: '#6f7ff0', year: '2026' },
  { n: '02', title: 'Open Calm', band: 'ALPHA · ~10 Hz', tint: '#5fb8c9', year: '2026' },
  { n: '03', title: 'Slow Drift', band: 'THETA · ~6 Hz', tint: '#b78fd6', year: '2026' },
  { n: '04', title: 'First Sleep', band: 'DELTA · ~2.5 Hz', tint: '#4a5a8a', year: '2026' },
]

/** The catalogue — full-width index rows on hairlines; hover fills Chalk. */
function Catalogue() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <section id="catalogue" className={css({ position: 'relative', px: '6', py: '24', sm: { px: '10' } })}>
      <p className={cx(label, css({ mb: '6' }))}>01 / THE CATALOGUE</p>
      <SplitReveal
        as="h2"
        className={css({
          m: '0',
          mb: '10',
          fontSize: 'clamp(30px, 4.4vw, 62px)',
          fontWeight: '500',
          lineHeight: '1.0',
          letterSpacing: '-0.04em',
          color: '#000000',
          maxW: '720px',
        })}
      >
        Four bands. Pressed nightly.
      </SplitReveal>
      <FadeUp>
        <div className={css({ borderTop: '1px solid #d3d6db' })}>
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
                borderBottom: '1px solid #d3d6db',
                py: '5',
                px: '2',
                cursor: 'pointer',
                font: 'inherit',
                transition: 'background 0.15s ease',
                _hover: { bg: '#f4f4f4' },
              })}
            >
              <span className={cx(label, css({ w: '28px' }))}>{c.n}</span>
              <span
                aria-hidden
                className={css({ w: '12px', h: '12px', borderRadius: '9999px', flexShrink: '0' })}
                style={{ background: c.tint }}
              />
              <span className={css({ flex: '1', fontSize: '18px', fontWeight: '500', letterSpacing: '-0.027em', color: '#000000' })}>
                {c.title}
              </span>
              <span className={cx(tag, css({ display: 'none', sm: { display: 'inline-flex' } }))}>{c.band}</span>
              <span className={cx(label, css({ fontSize: '14px' }))}>{c.year}</span>
            </button>
          ))}
        </div>
      </FadeUp>
    </section>
  )
}

/** Pulse trace — carbon hairline, drawn on entry. */
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
        ref={ref}
        d="M0 46 H150 L166 40 L180 12 L194 66 L208 42 H300 L316 38 L330 10 L344 68 L358 44 H470 L486 40 L500 14 L514 64 L528 44 H600"
        fill="none"
        stroke="#000000"
        strokeWidth="1.3"
      />
    </svg>
  )
}

function Attune() {
  return (
    <section id="attune" className={css({ position: 'relative', px: '6', py: '24', sm: { px: '10' } })}>
      <p className={cx(label, css({ mb: '6' }))}>02 / ATTUNE</p>
      <div className={css({ display: 'flex', gap: '12', alignItems: 'center', flexWrap: 'wrap' })}>
        <div className={css({ flex: '1', minW: '300px', maxW: '640px' })}>
          <SplitReveal
            as="h2"
            className={css({
              m: '0',
              fontSize: 'clamp(30px, 4.4vw, 62px)',
              fontWeight: '500',
              lineHeight: '1.0',
              letterSpacing: '-0.04em',
              color: '#000000',
            })}
          >
            The stylus is your heartbeat.
          </SplitReveal>
          <FadeUp className={css({ mt: '6', maxW: '420px' })}>
            <p className={css({ m: '0', fontSize: '16px', fontWeight: '500', lineHeight: '1.4', letterSpacing: '-0.03em', color: '#3a3a3f' })}>
              Attune reads the micro-flush of your skin through the camera — remote
              photoplethysmography — and lets your pulse steer tempo, density and brightness.
              Processed on your device. Never uploaded.
            </p>
            <div className={css({ mt: '7' })}>
              <PulseTrace />
              <p className={cx(label, css({ mt: '2' }))}>62 BPM · LIVE · ON-DEVICE</p>
            </div>
          </FadeUp>
        </div>
        {/* The product floats as an object — no frame, no card. */}
        <FadeUp delay={0.3}>
          <div style={{ transform: 'rotate(4deg)' }} data-cursor="OPEN">
            <PhoneShowcase />
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

const NUMBERS = [
  { v: '4', label: 'BRAINWAVE BANDS' },
  { v: '15 Hz → 2.5 Hz', label: 'BETA DOWN TO DELTA' },
  { v: '0', label: 'DATA LEAVES YOUR DEVICE' },
  { v: '20 min', label: 'FREE, DAILY' },
]

const PLANS = [
  { n: '01', name: 'Free', price: '$0 forever', lines: 'Every state · 20 min a day · no account' },
  { n: '02', name: 'Pro', price: '$9.99 / month', lines: 'Unlimited · full Attune · all scenes' },
  { n: '03', name: 'Studio', price: '$19.99 / month', lines: 'Everything in Pro · sound controls' },
]

function ScienceAndPricing() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <section className={css({ position: 'relative', px: '6', py: '24', sm: { px: '10' } })}>
      <p className={cx(label, css({ mb: '6' }))}>03 / THE SCIENCE</p>
      <FadeUp
        className={css({
          display: 'grid',
          gap: '8',
          gridTemplateColumns: 'repeat(2, 1fr)',
          md: { gridTemplateColumns: 'repeat(4, 1fr)' },
          mb: '20',
        })}
      >
        {NUMBERS.map((n) => (
          <div key={n.label}>
            <CountUp
              value={n.v}
              className={css({
                display: 'block',
                fontSize: 'clamp(28px, 3.4vw, 48px)',
                fontWeight: '500',
                letterSpacing: '-0.04em',
                color: '#000000',
              })}
            />
            <span className={cx(label, css({ mt: '1', display: 'block', fontSize: '11px', color: '#55555c' }))}>
              {n.label}
            </span>
          </div>
        ))}
      </FadeUp>

      <p className={cx(label, css({ mb: '6' }))}>04 / PRICING</p>
      <FadeUp>
        <div className={css({ borderTop: '1px solid #d3d6db', maxW: '860px' })}>
          {PLANS.map((p) => (
            <div
              key={p.n}
              className={css({
                display: 'flex',
                alignItems: 'baseline',
                gap: '4',
                borderBottom: '1px solid #d3d6db',
                py: '5',
                px: '2',
                transition: 'background 0.15s ease',
                _hover: { bg: '#f4f4f4' },
              })}
            >
              <span className={cx(label, css({ w: '28px' }))}>{p.n}</span>
              <span className={css({ w: '90px', fontSize: '18px', fontWeight: '500', letterSpacing: '-0.027em', color: '#000000' })}>
                {p.name}
              </span>
              <span className={cx(label, css({ flex: '1', fontSize: '14px', color: '#55555c' }))}>{p.lines}</span>
              <span className={css({ fontSize: '14px', fontWeight: '500', letterSpacing: '-0.03em', color: '#000000' })}>
                {p.price}
              </span>
            </div>
          ))}
        </div>
        <div className={css({ mt: '8', display: 'flex', alignItems: 'center', gap: '3' })}>
          <Magnetic>
            <button
              data-cursor="PLAY"
              onClick={() => {
                playClick('primary')
                void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
              }}
              className={ghostPill}
            >
              Start free
            </button>
          </Magnetic>
          <span className={cx(label, css({ color: '#55555c' }))}>REAL PRICES · CANCEL ANYTIME</span>
        </div>
      </FadeUp>
    </section>
  )
}

/** The one moment of darkness — the inverse Carbon band. */
function InverseFooter() {
  return (
    <footer className={css({ position: 'relative', bg: '#000000', color: '#ffffff', px: '6', py: '16', sm: { px: '10' } })}>
      <p
        className={css({
          m: '0',
          fontSize: 'clamp(48px, 10vw, 150px)',
          fontWeight: '500',
          lineHeight: '0.95',
          letterSpacing: '-0.05em',
          color: '#ffffff',
        })}
      >
        SmartSound®
      </p>
      <div className={css({ mt: '10', display: 'flex', flexWrap: 'wrap', gap: '3' })}>
        {['Catalogue', 'Attune', 'The science', 'Pricing', 'Top'].map((l, i) => (
          <a
            key={l}
            href={['#catalogue', '#attune', '#catalogue', '#catalogue', '#top'][i]}
            className={css({
              borderRadius: '9999px',
              border: '1px solid #ffffff33',
              px: '3.5',
              py: '1.5',
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '-0.03em',
              color: '#ffffff',
              textDecoration: 'none',
              transition: 'background 0.15s ease, color 0.15s ease',
              _hover: { bg: '#e2ff70', color: '#000000', borderColor: '#e2ff70' },
            })}
          >
            {l}
          </a>
        ))}
      </div>
      <div className={css({ mt: '10', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '3' })}>
        <span className={cx(label, css({ color: '#ffffff99' }))}>PRESSED AT NIGHT · 2026</span>
        <span className={cx(label, css({ color: '#ffffff99' }))}>
          THE CAMERA STAYS ON YOUR DEVICE · NOT A MEDICAL DEVICE
        </span>
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
    <div
      id="top"
      className={css({ position: 'relative', bg: '#e5e7eb', color: '#000000' })}
      style={{ fontFamily: GROTESK }}
    >
      <Preloader onDone={() => setReady(true)} />
      <CursorDot />
      <FloatingNav />

      {/* The scroll-scrubbed carbon swarm — the Dala layer on the plate. */}
      <div className={css({ transition: 'opacity 1s ease' })} style={{ opacity: ready ? 0.5 : 0 }}>
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
            fontWeight: '500',
            letterSpacing: '-0.027em',
            color: '#00000066',
            borderColor: '#d3d6db',
          })}
          text="BETA · ~15 Hz — ALPHA · ~10 Hz — THETA · ~6 Hz — DELTA · ~2.5 Hz — "
        />
        <Catalogue />
        <Attune />
        <ScienceAndPricing />
        <InverseFooter />
      </div>
    </div>
  )
}
