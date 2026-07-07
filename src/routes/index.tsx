import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { AppShowcase } from '~/landing/AppShowcase'
import { TriangleConstellation } from '~/landing/TriangleConstellation'
import { TriangleText } from '~/landing/TriangleText'
import { useSmoothScroll } from '~/landing/useSmoothScroll'
import { useClickSound } from '~/lib/click-sound'

/**
 * Welcome — the landing, in the Dala idiom on Liquid Glass.
 *
 * A loading counter gives way to a pinned void hero where a constellation of
 * triangular particles — an anatomical brain in blue/green — continuously
 * transforms into a music note, a waveform, a synapse network, and back,
 * warming to yellow wherever the pointer touches. Kinetic per-letter type
 * carries the headline. The story then scrolls: benefit trio, a scroll-driven
 * brain→note morph stage, the real app screens, sticky how-it-works cards,
 * science, reviews, plans, FAQ, and the door in. Glass stays on the control
 * layer; the void stays black.
 */
export const Route = createFileRoute('/')({
  component: Welcome,
})

const enter = { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const }

/** The hero's rotating statements — the same triangles rearrange into each. */
const HERO_PHRASES = [
  'Unlock your\nquietest mind.',
  'Focus. Calm.\nSleep.',
  'Music, made\nof you.',
]

/** The Dala-style loading counter. rAF drives the count; a wall-clock timer
 * guarantees dismissal even when the tab is throttled or hidden. */
function LoadingOverlay() {
  const [pct, setPct] = useState(0)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setGone(true)
      return
    }
    let raf = 0
    const start = performance.now()
    const dur = 1300
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      setPct(Math.round(p * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else window.setTimeout(() => setGone(true), 300)
    }
    raf = requestAnimationFrame(tick)
    const fallback = window.setTimeout(() => {
      setPct(100)
      setGone(true)
    }, 2000)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fallback)
    }
  }, [])

  if (gone) return null
  return (
    <div
      aria-hidden
      className={css({
        position: 'fixed',
        inset: '0',
        zIndex: '100',
        bg: 'black',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        p: '8',
      })}
    >
      <span
        className={css({
          fontSize: 'footnote',
          fontWeight: '600',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--ss-ink-soft)',
        })}
      >
        SmartSound
      </span>
      <span
        className={css({
          fontFamily: 'display',
          fontSize: 'clamp(3rem, 9vw, 6rem)',
          fontWeight: '500',
          letterSpacing: '-0.03em',
          lineHeight: '1',
          color: 'text',
          fontVariantNumeric: 'tabular-nums',
        })}
      >
        {pct}
      </span>
    </div>
  )
}

/** Section heading — eyebrow + display title, revealed on scroll. */
function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 26 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={enter}
      className={css({ textAlign: 'center', mb: '10' })}
    >
      <p
        className={css({
          m: '0',
          mb: '3',
          fontSize: 'footnote',
          fontWeight: '600',
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: 'var(--ss-ink-soft)',
        })}
      >
        {eyebrow}
      </p>
      {/* Section titles are triangle swarms too — touch them and they scatter. */}
      <TriangleText
        as="h2"
        text={title}
        fontSize={54}
        fontWeight={620}
        align="center"
        height={72}
        gap={4}
      />
    </motion.div>
  )
}

/** Fixed Liquid Glass navigation. */
function GlassNav() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  const link = css({
    display: 'none',
    md: { display: 'inline' },
    fontSize: 'footnote',
    fontWeight: '600',
    color: 'var(--ss-ink-body)',
    textDecoration: 'none',
    px: '2.5',
    _hover: { color: 'text' },
  })
  return (
    <div
      className={css({
        position: 'fixed',
        top: '4',
        insetX: '0',
        zIndex: '50',
        display: 'flex',
        justifyContent: 'center',
        px: '4',
        pointerEvents: 'none',
      })}
    >
      <LiquidGlass
        as="nav"
        variant="bar"
        className={css({ pointerEvents: 'auto', px: '4', py: '2', maxW: '860px', w: '100%' })}
      >
        <div className={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3' })}>
          <a
            href="#top"
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '2',
              fontSize: 'headline',
              fontWeight: '700',
              letterSpacing: '-0.01em',
              color: 'text',
              textDecoration: 'none',
            })}
          >
            <span
              aria-hidden
              className={css({ display: 'inline-block', w: '11px', h: '11px' })}
              style={{
                background: 'linear-gradient(135deg, #4aa8ff, #37c2a0)',
                clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              }}
            />
            SmartSound
          </a>
          <div className={css({ display: 'flex', alignItems: 'center' })}>
            <a href="#engine" className={link}>Engine</a>
            <a href="#inside" className={link}>The app</a>
            <a href="#how" className={link}>How it works</a>
            <a href="#reviews" className={link}>Reviews</a>
            <a href="#plans" className={link}>Plans</a>
            <a href="#faq" className={link}>FAQ</a>
          </div>
          <button
            onClick={() => {
              playClick('primary')
              void navigate({ to: '/app' })
            }}
            className={css({
              borderRadius: 'capsule',
              px: '4',
              py: '2',
              fontSize: 'footnote',
              fontWeight: '600',
              color: '#04060c',
              bg: 'rgba(255,255,255,0.92)',
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              _hover: { bg: 'white' },
            })}
          >
            Open the app
          </button>
        </div>
      </LiquidGlass>
    </div>
  )
}

/** Stage 1 — the pinned void hero: kinetic type over the living constellation. */
function HeroStage() {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const playClick = useClickSound()
  const [phrase, setPhrase] = useState(0)

  // Rotate the statement — the triangle swarm rearranges into each next one.
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setPhrase((p) => (p + 1) % HERO_PHRASES.length), 5200)
    return () => window.clearInterval(id)
  }, [reduce])

  const reveal = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { ...enter, delay },
        }

  return (
    <section className={css({ position: 'relative', height: '175vh' })}>
      <div
        className={css({
          position: 'sticky',
          top: '0',
          height: '100dvh',
          minHeight: '560px',
          overflow: 'hidden',
          bg: 'black',
        })}
      >
        {/* The constellation — brain → note → waveform → network, forever. */}
        <TriangleConstellation
          shapes={['brain', 'note', 'waveform', 'network']}
          mode="auto"
          rotate="sway"
          className={css({
            position: 'absolute',
            inset: '0',
            zIndex: '1',
            opacity: '0.9',
            sm: { left: '22%' },
          })}
        />

        {/* Radial vignette keeps the type zone quiet. */}
        <div
          aria-hidden
          className={css({
            position: 'absolute',
            inset: '0',
            zIndex: '2',
            pointerEvents: 'none',
            background:
              'radial-gradient(70% 60% at 24% 55%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 55%, transparent 80%)',
          })}
        />

        {/* Headline block — Dala scale, kinetic letters. */}
        <div
          className={css({
            position: 'absolute',
            insetX: '0',
            bottom: '14%',
            zIndex: '3',
            px: '6',
            sm: { px: '10', maxW: '880px' },
            pointerEvents: 'none',
          })}
        >
          <motion.p
            {...reveal(0.15)}
            className={css({
              m: '0',
              mb: '4',
              fontSize: 'footnote',
              fontWeight: '600',
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--ss-ink-soft)',
            })}
          >
            SmartSound
          </motion.p>
          {/* The headline is literally built of triangles — the same swarm
              rearranges into each rotating statement, scattering under the
              pointer. */}
          <TriangleText
            as="h1"
            text={HERO_PHRASES[phrase]}
            fontSize={92}
            fontWeight={650}
            height={220}
            gap={4}
            className={css({ pointerEvents: 'auto', maxW: '760px' })}
          />
          <motion.p
            {...reveal(1.0)}
            className={css({
              m: '0',
              mt: '5',
              fontSize: 'title3',
              fontWeight: '500',
              color: 'text',
            })}
          >
            Stop chasing calm. Start hearing it.
          </motion.p>
          <motion.p
            {...reveal(1.15)}
            className={css({
              m: '0',
              mt: '3',
              maxW: '440px',
              fontSize: 'subhead',
              lineHeight: '1.65',
              color: 'var(--ss-ink-body)',
            })}
          >
            Plug into your own signal. SmartSound reads your pulse and composes a living
            soundscape that steers you into focus, calm, or sleep — with context, conviction
            and clarity.
          </motion.p>
          <motion.div
            {...reveal(1.3)}
            className={css({ mt: '6', display: 'flex', alignItems: 'center', gap: '4', pointerEvents: 'auto' })}
          >
            <LiquidGlass
              as="button"
              variant="control"
              tint="rgba(74, 168, 255, 0.55)"
              onClick={() => {
                playClick('primary')
                void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
              }}
              className={css({
                border: '1px solid rgba(122, 190, 255, 0.4)',
                color: 'text',
                font: 'inherit',
              })}
            >
              <span
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  height: '50px',
                  px: '7',
                  fontSize: 'headline',
                  fontWeight: '600',
                })}
              >
                Start listening
              </span>
            </LiquidGlass>
            <span className={css({ fontSize: 'caption', color: 'var(--ss-ink-soft)' })}>
              Free · no account · camera stays on device
            </span>
          </motion.div>
        </div>

        {/* Scroll cue. */}
        <motion.div
          {...reveal(1.6)}
          aria-hidden
          className={css({
            position: 'absolute',
            bottom: '5',
            insetX: '0',
            zIndex: '3',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          })}
        >
          <span
            className={css({
              fontSize: 'caption',
              fontWeight: '600',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ss-ink-soft)',
              animation: reduce ? undefined : 'bob 2.4s ease-in-out infinite',
            })}
          >
            Scroll ↓
          </span>
        </motion.div>
      </div>
    </section>
  )
}

/** Stage 2 — the pinned morph: scroll transforms the brain into the note. */
function MorphStage() {
  const ref = useRef<HTMLElement>(null)
  const progressRef = useRef(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // Hold the brain for the first quarter, morph through the middle half,
  // hold the note for the last quarter of the pinned scroll.
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progressRef.current = Math.min(1, Math.max(0, (v - 0.25) / 0.5))
  })

  const opacityA = useTransform(scrollYProgress, [0.04, 0.14, 0.34, 0.46], [0, 1, 1, 0])
  const yA = useTransform(scrollYProgress, [0.04, 0.46], [24, -24])
  const opacityB = useTransform(scrollYProgress, [0.54, 0.66, 0.9, 0.98], [0, 1, 1, 0])
  const yB = useTransform(scrollYProgress, [0.54, 0.98], [24, -24])

  const caption = css({
    position: 'absolute',
    zIndex: '3',
    maxW: '400px',
    px: '5',
    pointerEvents: 'none',
  })

  return (
    <section id="engine" ref={ref} className={css({ position: 'relative', height: '320vh' })}>
      <div
        className={css({
          position: 'sticky',
          top: '0',
          height: '100dvh',
          overflow: 'hidden',
          bg: '#04060c',
        })}
      >
        <TriangleConstellation
          shapes={['brain', 'note']}
          mode="scroll"
          progressRef={progressRef}
          rotate="sway"
          className={css({ position: 'absolute', inset: '0', zIndex: '1' })}
        />

        {/* Copy A — the brain. */}
        <motion.div
          style={{ opacity: opacityA, y: yA }}
          className={cx(caption, css({ top: '16%', left: '0', sm: { left: '8%', top: '30%' } }))}
        >
          <p
            className={css({
              m: '0',
              mb: '2',
              fontSize: 'footnote',
              fontWeight: '600',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ss-ink-soft)',
            })}
          >
            The engine
          </p>
          <h2
            className={css({
              m: '0',
              fontFamily: 'display',
              fontSize: 'clamp(1.9rem, 4.5vw, 3rem)',
              fontWeight: '500',
              letterSpacing: '-0.02em',
              lineHeight: '1.05',
              color: 'text',
            })}
          >
            Your mind has a tempo.
          </h2>
          <p
            className={css({
              m: '0',
              mt: '3',
              fontSize: 'subhead',
              lineHeight: '1.6',
              color: 'var(--ss-ink-body)',
            })}
          >
            SmartSound reads your pulse from your camera — on your device, never uploaded.
          </p>
        </motion.div>

        {/* Copy B — the note. */}
        <motion.div
          style={{ opacity: opacityB, y: yB }}
          className={cx(
            caption,
            css({
              bottom: '18%',
              right: '0',
              textAlign: 'right',
              sm: { right: '8%', bottom: 'auto', top: '34%' },
            }),
          )}
        >
          <h2
            className={css({
              m: '0',
              fontFamily: 'display',
              fontSize: 'clamp(1.9rem, 4.5vw, 3rem)',
              fontWeight: '500',
              letterSpacing: '-0.02em',
              lineHeight: '1.05',
              color: 'text',
            })}
          >
            We tune it into music.
          </h2>
          <p
            className={css({
              m: '0',
              mt: '3',
              fontSize: 'subhead',
              lineHeight: '1.6',
              color: 'var(--ss-ink-body)',
            })}
          >
            A generative soundscape reshapes itself in real time, steering you toward focus,
            calm, or sleep.
          </p>
        </motion.div>

        {/* The pointer affordance — the constellation warms where you touch. */}
        <div
          className={css({
            position: 'absolute',
            bottom: '6',
            insetX: '0',
            zIndex: '3',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          })}
        >
          <LiquidGlass
            variant="control"
            staticSheen
            className={css({ color: 'var(--ss-ink-body)' })}
          >
            <span
              className={css({
                display: 'flex',
                alignItems: 'center',
                px: '5',
                height: '36px',
                fontSize: 'caption',
                fontWeight: '600',
                letterSpacing: '0.06em',
              })}
            >
              Move your cursor through it
            </span>
          </LiquidGlass>
        </div>
      </div>
    </section>
  )
}

const BENEFITS = [
  {
    k: 'Focus',
    body: 'Steady, lyric-free momentum tuned against your live pulse — for deep work that holds.',
    grad: 'linear-gradient(135deg, rgba(74,168,255,0.28), rgba(92,124,255,0.10))',
    dot: '#4aa8ff',
  },
  {
    k: 'Calm',
    body: 'Soft pads and slow air that ease a racing afternoon back down to baseline.',
    grad: 'linear-gradient(135deg, rgba(55,194,160,0.26), rgba(99,224,194,0.10))',
    dot: '#37c2a0',
  },
  {
    k: 'Sleep',
    body: 'A soundscape that dims with you — slower, darker, quieter as your body lets go.',
    grad: 'linear-gradient(135deg, rgba(255,210,74,0.20), rgba(74,168,255,0.08))',
    dot: '#ffd24a',
  },
]

/** The benefit trio — our three target states. */
function BenefitsSection() {
  return (
    <section className={css({ position: 'relative', px: '5', pt: '24', maxW: '1000px', mx: 'auto' })}>
      <SectionHeading eyebrow="One engine, three doors" title="Focus. Calm. Sleep." />
      <div className={css({ display: 'grid', gap: '5', md: { gridTemplateColumns: 'repeat(3, 1fr)' } })}>
        {BENEFITS.map((b) => (
          <LiquidGlass key={b.k} variant="card" className={css({ p: '7' })}>
            <div
              aria-hidden
              className={css({ w: '40px', h: '36px', mb: '4' })}
              style={{
                background: b.grad,
                borderBottom: `1px solid ${b.dot}66`,
                clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              }}
            />
            <h3
              className={css({
                m: '0',
                fontFamily: 'display',
                fontSize: 'title2',
                fontWeight: '600',
                color: 'text',
              })}
            >
              {b.k}
            </h3>
            <p
              className={css({
                m: '0',
                mt: '2',
                fontSize: 'subhead',
                lineHeight: '1.6',
                color: 'var(--ss-ink-body)',
              })}
            >
              {b.body}
            </p>
          </LiquidGlass>
        ))}
      </div>
    </section>
  )
}

/** Inside the app — the native UI, shown in detail. */
function InsideAppSection() {
  return (
    <section
      id="inside"
      className={css({ position: 'relative', px: '5', pt: '28', maxW: '1080px', mx: 'auto' })}
    >
      <SectionHeading eyebrow="Inside the app" title="Native schematics, all the way down" />
      <p
        className={css({
          m: '0',
          mt: '-6',
          mb: '10',
          textAlign: 'center',
          fontSize: 'subhead',
          lineHeight: '1.65',
          color: 'var(--ss-ink-body)',
          maxW: '560px',
          mx: 'auto',
        })}
      >
        System type, scene-dark surfaces, and one signature material — Liquid Glass — on the
        navigation and control layer. No chrome for chrome&rsquo;s sake: every surface below is a
        screen the app actually ships.
      </p>
      <AppShowcase />
    </section>
  )
}

const CARDS = [
  {
    k: '01',
    title: 'Pulse, from your camera',
    body: 'Remote photoplethysmography watches the micro-flush of your skin to find your heart rate — no wearable, and the video never leaves your device.',
    tint: 'rgba(74, 168, 255, 0.20)',
  },
  {
    k: '02',
    title: 'A soundscape, not a playlist',
    body: 'Five-voice chord pads, procedural reverb, wind and ocean beds, sparse bell melodies — composed live by the engine, never looped, never repeated.',
    tint: 'rgba(55, 194, 160, 0.20)',
  },
  {
    k: '03',
    title: 'Attune, honestly',
    body: 'A closed loop nudges tempo, density and brightness toward your target state — focus, calm, or sleep — and only ever claims what it measures.',
    tint: 'rgba(255, 210, 74, 0.16)',
  },
]

/** Liquid Glass cards that pile up as you scroll. */
function CardsStage() {
  return (
    <section id="how" className={css({ position: 'relative', px: '5', pb: '20', maxW: '720px', mx: 'auto' })}>
      <div className={css({ pt: '24', pb: '10' })}>
        <SectionHeading eyebrow="How it works" title="Three honest moves" />
      </div>
      {CARDS.map((c, i) => (
        <div key={c.k} className={css({ minH: '62vh' })}>
          <LiquidGlass
            variant="card"
            tint={c.tint}
            className={css({ position: 'sticky', p: '8', sm: { p: '10' } })}
            style={{ top: `calc(12vh + ${i * 3.5}rem)` }}
          >
            <p
              className={css({
                m: '0',
                mb: '3',
                fontSize: 'footnote',
                fontWeight: '700',
                letterSpacing: '0.18em',
                color: 'var(--ss-ink-soft)',
              })}
            >
              {c.k}
            </p>
            <h3
              className={css({
                m: '0',
                fontFamily: 'display',
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                fontWeight: '600',
                letterSpacing: '-0.015em',
                color: 'text',
              })}
            >
              {c.title}
            </h3>
            <p
              className={css({
                m: '0',
                mt: '3',
                fontSize: 'subhead',
                lineHeight: '1.65',
                color: 'var(--ss-ink-body)',
                maxW: '520px',
              })}
            >
              {c.body}
            </p>
          </LiquidGlass>
        </div>
      ))}
    </section>
  )
}

/** The science, claimed honestly. */
function ScienceSection() {
  const items = [
    {
      title: 'rPPG, on-device',
      body: 'Your camera watches the micro-flush of skin with each heartbeat (remote photoplethysmography). Frames are processed locally and never leave the device.',
    },
    {
      title: 'A closed loop',
      body: 'Pulse and its trend feed the engine; tempo, chord density, brightness and reverb answer. Slow, hysteretic changes — never jarring, never random.',
    },
    {
      title: 'No overclaiming',
      body: 'We cite the rPPG literature and general auditory-entrainment findings — and the app tells you it is not a medical device. Attune shows only what it measured.',
    },
  ]
  return (
    <section className={css({ position: 'relative', px: '5', pt: '28', maxW: '1000px', mx: 'auto' })}>
      <SectionHeading eyebrow="The science" title="Measured, then made audible" />
      <div className={css({ display: 'grid', gap: '5', md: { gridTemplateColumns: 'repeat(3, 1fr)' } })}>
        {items.map((s) => (
          <LiquidGlass key={s.title} variant="card" className={css({ p: '7' })}>
            <h3
              className={css({
                m: '0',
                fontFamily: 'display',
                fontSize: 'title3',
                fontWeight: '600',
                color: 'text',
              })}
            >
              {s.title}
            </h3>
            <p
              className={css({
                m: '0',
                mt: '2',
                fontSize: 'subhead',
                lineHeight: '1.65',
                color: 'var(--ss-ink-body)',
              })}
            >
              {s.body}
            </p>
          </LiquidGlass>
        ))}
      </div>
    </section>
  )
}

const REVIEWS = [
  {
    who: 'J.M. — early listener',
    quote:
      'The ring filling while my pulse actually settled was the first time an app ever showed me calm instead of telling me about it.',
  },
  {
    who: 'A.R. — early listener',
    quote:
      'I leave Focus running for whole afternoons. It never loops, so my brain never gets the "I know this song" itch.',
  },
  {
    who: 'S.K. — early listener',
    quote:
      'Sleep mode getting slower and darker as I drift is uncanny in the best way. I stopped noticing when it ends — which is the point.',
  },
]

/** Early-listener quotes — clearly labeled, no invented star counts. */
function ReviewsSection() {
  return (
    <section
      id="reviews"
      className={css({ position: 'relative', px: '5', pt: '28', maxW: '1000px', mx: 'auto' })}
    >
      <SectionHeading eyebrow="Early listeners" title="What people say" />
      <div className={css({ display: 'grid', gap: '5', md: { gridTemplateColumns: 'repeat(3, 1fr)' } })}>
        {REVIEWS.map((r) => (
          <LiquidGlass key={r.who} variant="card" className={css({ p: '7' })}>
            <p
              className={css({
                m: '0',
                fontSize: 'subhead',
                lineHeight: '1.7',
                color: 'text',
                fontStyle: 'italic',
              })}
            >
              &ldquo;{r.quote}&rdquo;
            </p>
            <p
              className={css({
                m: '0',
                mt: '4',
                fontSize: 'footnote',
                fontWeight: '600',
                color: 'var(--ss-ink-soft)',
              })}
            >
              {r.who}
            </p>
          </LiquidGlass>
        ))}
      </div>
    </section>
  )
}

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    per: 'forever',
    lines: ['Explore every state', '20 minutes a day', 'No account needed'],
    tint: undefined,
  },
  {
    name: 'Pro',
    price: '$9.99',
    per: '/ month',
    lines: ['Unlimited listening', 'Full Attune biofeedback', 'All scenes and sessions'],
    tint: 'rgba(74, 168, 255, 0.25)',
  },
  {
    name: 'Studio',
    price: '$19.99',
    per: '/ month',
    lines: ['Everything in Pro', 'Developer sound controls', 'Early features first'],
    tint: 'rgba(55, 194, 160, 0.22)',
  },
]

/** Plans — the real in-app tiers, real prices, no dark patterns. */
function PlansSection() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <section
      id="plans"
      className={css({ position: 'relative', px: '5', pt: '28', maxW: '1000px', mx: 'auto' })}
    >
      <SectionHeading eyebrow="Plans" title="Start free, stay honest" />
      <div className={css({ display: 'grid', gap: '5', md: { gridTemplateColumns: 'repeat(3, 1fr)' } })}>
        {PLANS.map((p) => (
          <LiquidGlass key={p.name} variant="card" tint={p.tint} className={css({ p: '7' })}>
            <p
              className={css({
                m: '0',
                fontSize: 'footnote',
                fontWeight: '600',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--ss-ink-soft)',
              })}
            >
              {p.name}
            </p>
            <p className={css({ m: '0', mt: '2', color: 'text' })}>
              <span className={css({ fontFamily: 'display', fontSize: 'largeTitle', fontWeight: '600' })}>
                {p.price}
              </span>{' '}
              <span className={css({ fontSize: 'footnote', color: 'var(--ss-ink-soft)' })}>{p.per}</span>
            </p>
            <ul
              className={css({
                m: '0',
                mt: '4',
                p: '0',
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '2',
              })}
            >
              {p.lines.map((l) => (
                <li
                  key={l}
                  className={css({
                    fontSize: 'subhead',
                    color: 'var(--ss-ink-body)',
                    display: 'flex',
                    gap: '2',
                    alignItems: 'baseline',
                  })}
                >
                  <span
                    aria-hidden
                    className={css({ display: 'inline-block', w: '7px', h: '6px', flexShrink: '0' })}
                    style={{
                      background: 'linear-gradient(135deg, #4aa8ff, #37c2a0)',
                      clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                    }}
                  />
                  {l}
                </li>
              ))}
            </ul>
          </LiquidGlass>
        ))}
      </div>
      <div className={css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3', mt: '8' })}>
        <LiquidGlass
          as="button"
          variant="control"
          tint="rgba(74, 168, 255, 0.55)"
          onClick={() => {
            playClick('primary')
            void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
          }}
          className={css({
            minW: '200px',
            border: '1px solid rgba(122, 190, 255, 0.4)',
            color: 'text',
            font: 'inherit',
          })}
        >
          <span
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '48px',
              px: '8',
              fontSize: 'headline',
              fontWeight: '600',
            })}
          >
            Start free
          </span>
        </LiquidGlass>
        <p className={css({ m: '0', fontSize: 'caption', color: 'var(--ss-ink-soft)' })}>
          Prices as shown in-app · annual saves more · cancel anytime
        </p>
      </div>
    </section>
  )
}

const FAQS = [
  {
    q: 'How does SmartSound read my pulse?',
    a: 'Through your camera, using remote photoplethysmography — the faint change in skin color with every heartbeat. All processing happens on your device; video is never uploaded, stored, or shared.',
  },
  {
    q: 'Is this binaural beats?',
    a: 'No. SmartSound is a generative soundscape — chord pads, natural beds, sparse melodies composed live — with gentle amplitude entrainment layered in. It works on speakers or a single earbud; no special headphones required.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. You can explore every state free without one. An account only becomes useful if you want your progress and settings to follow you.',
  },
  {
    q: 'What does Attune actually claim?',
    a: 'Only what it measures: your pulse, its trend, and how the engine responded. SmartSound is not a medical device and never pretends to diagnose or treat anything.',
  },
  {
    q: 'Does the music ever repeat?',
    a: 'No. Every session is generated in the moment from the engine’s current reading of you, so no two sessions are the same — and there is nothing to loop.',
  },
]

/** FAQ — native disclosure elements dressed in glass. */
function FaqSection() {
  return (
    <section
      id="faq"
      className={css({ position: 'relative', px: '5', pt: '28', maxW: '720px', mx: 'auto' })}
    >
      <SectionHeading eyebrow="FAQ" title="Fair questions" />
      <div className={css({ display: 'flex', flexDirection: 'column', gap: '3' })}>
        {FAQS.map((f) => (
          <LiquidGlass key={f.q} variant="card" staticSheen className={css({ p: '0' })}>
            <details className={css({ p: '5' })}>
              <summary
                className={css({
                  cursor: 'pointer',
                  fontSize: 'headline',
                  fontWeight: '600',
                  color: 'text',
                  listStyle: 'none',
                  _hover: { color: 'white' },
                })}
              >
                {f.q}
              </summary>
              <p
                className={css({
                  m: '0',
                  mt: '3',
                  fontSize: 'subhead',
                  lineHeight: '1.7',
                  color: 'var(--ss-ink-body)',
                })}
              >
                {f.a}
              </p>
            </details>
          </LiquidGlass>
        ))}
      </div>
    </section>
  )
}

/** The closing door — Dala's cadence, our promise. */
function CtaStage() {
  const navigate = useNavigate()
  const playClick = useClickSound()

  return (
    <section
      className={css({
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: '5',
        gap: '5',
        background:
          'radial-gradient(60% 45% at 50% 55%, rgba(74, 168, 255, 0.10) 0%, rgba(55, 194, 160, 0.05) 45%, transparent 75%)',
      })}
    >
      <TriangleText
        as="h2"
        text={'Your body has the answer.\nAsk SmartSound to play it.'}
        fontSize={64}
        fontWeight={620}
        align="center"
        height={170}
        gap={4}
        className={css({ w: '100%', maxW: '900px' })}
      />
      <p
        className={css({
          m: '0',
          fontSize: 'subhead',
          color: 'var(--ss-ink-body)',
          maxW: '340px',
          lineHeight: '1.6',
        })}
      >
        Two minutes of setup. No account needed to explore.
      </p>
      <LiquidGlass
        as="button"
        variant="control"
        tint="rgba(74, 168, 255, 0.55)"
        onClick={() => {
          playClick('primary')
          void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
        }}
        className={css({
          minW: '200px',
          minH: '52px',
          border: '1px solid rgba(122, 190, 255, 0.4)',
          color: 'text',
          font: 'inherit',
        })}
      >
        <span
          className={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '52px',
            px: '8',
            fontSize: 'headline',
            fontWeight: '600',
            letterSpacing: '0.01em',
          })}
        >
          Get started
        </span>
      </LiquidGlass>
      <p className={css({ m: '0', fontSize: 'caption', color: 'var(--ss-ink-soft)' })}>
        Free to explore. The camera stays on your device.
      </p>
    </section>
  )
}

/** Footer — quiet, link-dense. */
function FooterSection() {
  const col = css({ display: 'flex', flexDirection: 'column', gap: '2' })
  const head = css({
    m: '0',
    mb: '1',
    fontSize: 'caption',
    fontWeight: '700',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ss-ink-soft)',
  })
  const a = css({
    fontSize: 'footnote',
    color: 'var(--ss-ink-body)',
    textDecoration: 'none',
    _hover: { color: 'text' },
  })
  return (
    <footer className={css({ px: '5', pt: '28', pb: '12', maxW: '1000px', mx: 'auto' })}>
      <div
        className={css({
          display: 'grid',
          gap: '8',
          pb: '10',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          sm: { gridTemplateColumns: '2fr 1fr 1fr 1fr' },
        })}
      >
        <div>
          <p className={css({ m: '0', fontSize: 'headline', fontWeight: '700', color: 'text' })}>
            SmartSound
          </p>
          <p
            className={css({
              m: '0',
              mt: '2',
              fontSize: 'footnote',
              lineHeight: '1.6',
              color: 'var(--ss-ink-body)',
              maxW: '260px',
            })}
          >
            A generative soundscape that listens to your pulse and steers you toward focus, calm,
            or sleep.
          </p>
        </div>
        <div className={col}>
          <p className={head}>Product</p>
          <a className={a} href="#inside">Inside the app</a>
          <a className={a} href="#plans">Plans</a>
          <a className={a} href="#faq">FAQ</a>
        </div>
        <div className={col}>
          <p className={head}>Science</p>
          <a className={a} href="#engine">The engine</a>
          <a className={a} href="#how">How it works</a>
        </div>
        <div className={col}>
          <p className={head}>Privacy</p>
          <p className={cx(a, css({ m: '0', cursor: 'default' }))}>
            The camera stays on your device. Always.
          </p>
        </div>
      </div>
      <p className={css({ m: '0', mt: '6', fontSize: 'caption', color: 'var(--ss-ink-soft)' })}>
        © 2026 SmartSound. Not a medical device.
      </p>
    </footer>
  )
}

function Welcome() {
  // The Dala scroll feel — wheel input glides the real scroll position.
  useSmoothScroll()
  return (
    <div
      id="top"
      className={cx(
        'ss-scene-dark',
        css({ position: 'relative', bg: 'black', color: 'text', scrollBehavior: 'smooth' }),
      )}
    >
      <LoadingOverlay />
      <GlassNav />
      <HeroStage />
      {/* Everything after the pinned hero rides over it on an opaque layer. */}
      <div className={css({ position: 'relative', zIndex: '1', bg: '#04060c' })}>
        <BenefitsSection />
        <MorphStage />
        <InsideAppSection />
        <CardsStage />
        <ScienceSection />
        <ReviewsSection />
        <PlansSection />
        <FaqSection />
        <CtaStage />
        <FooterSection />
      </div>
    </div>
  )
}
