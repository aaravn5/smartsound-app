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
import { PhoneShowcase } from '~/landing/PhoneShowcase'
import { TriangleConstellation } from '~/landing/TriangleConstellation'
import { TriangleText } from '~/landing/TriangleText'
import { useSmoothScroll } from '~/landing/useSmoothScroll'
import { useClickSound } from '~/lib/click-sound'

/**
 * Welcome — the landing as one continuous swarm story.
 *
 * A single fixed WebGL canvas holds the whole narrative: a triangle-particle
 * brain (staged right of the headline) that the page's scroll transforms into
 * a rolling terrain, a weightless dust field, a lightbulb, a planet, a
 * synapse network and finally a closing ribbon — while HTML beats ride over
 * it. Larger loner triangles drift across the void the entire way. Headlines
 * are set in TriangleText, so even the type is a swarm that rearranges.
 * Wheel scrolling glides (lerped real scroll), touch stays native, and
 * reduced motion snaps everything.
 */
export const Route = createFileRoute('/')({
  component: Welcome,
})

const enter = { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const }
const BLUE = '#4aa8ff'
const GREEN = '#37c2a0'

/** The hero's rotating statements — the same triangles rearrange into each. */
const HERO_PHRASES = [
  'Unlock your\nquietest mind.',
  'Focus. Calm.\nSleep.',
  'Music, made\nof you.',
]

const signalPill = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'capsule',
  background: 'linear-gradient(135deg, #4aa8ff, #2fb89b)',
  color: 'white',
  fontWeight: '700',
  fontSize: 'footnote',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  px: '6',
  h: '46px',
  border: 'none',
  cursor: 'pointer',
  font: 'inherit',
  boxShadow: '0 6px 26px rgba(74, 168, 255, 0.38)',
  transition: 'filter 0.18s ease, transform 0.18s ease',
  _hover: { filter: 'brightness(1.12)' },
  _active: { transform: 'scale(0.97)' },
})

const eyebrowMint = css({
  m: '0',
  fontSize: 'footnote',
  fontWeight: '700',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#63e0c2',
})

/** The loading counter. rAF drives the count; a wall-clock timer guarantees
 * dismissal even when the tab is throttled or hidden. */
function LoadingOverlay({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setGone(true)
      onDone()
      return
    }
    let raf = 0
    const start = performance.now()
    const dur = 1300
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      setPct(Math.round(p * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else {
        onDone() // 100 reached — the page fades in beneath the counter
        window.setTimeout(() => setGone(true), 450)
      }
    }
    raf = requestAnimationFrame(tick)
    const fallback = window.setTimeout(() => {
      setPct(100)
      onDone()
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

/** Bare void navigation — logo left, spaced caps right, one violet pill. */
function VoidNav() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  const link = css({
    display: 'none',
    md: { display: 'inline' },
    fontSize: 'caption',
    fontWeight: '700',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ss-ink-body)',
    textDecoration: 'none',
    px: '3',
    _hover: { color: 'text' },
  })
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
        px: '6',
        py: '4',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.72), transparent)',
      })}
    >
      <a
        href="#top"
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '2.5',
          fontSize: 'headline',
          fontWeight: '700',
          letterSpacing: '-0.01em',
          color: 'text',
          textDecoration: 'none',
        })}
      >
        <span
          aria-hidden
          className={css({ display: 'inline-block', w: '13px', h: '12px' })}
          style={{
            background: `linear-gradient(135deg, ${BLUE}, ${GREEN})`,
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          }}
        />
        SmartSound
      </a>
      <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
        <a href="#engine" className={link}>Engine</a>
        <a href="#inside" className={link}>The app</a>
        <a href="#plans" className={link}>Plans</a>
        <button
          onClick={() => {
            playClick('primary')
            void navigate({ to: '/app' })
          }}
          className={cx(signalPill, css({ h: '38px', px: '5' }))}
        >
          Open the app
        </button>
      </div>
    </nav>
  )
}

/** Section heading — eyebrow + swarm title, revealed on scroll. */
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
      <p className={cx(eyebrowMint, css({ mb: '3', textAlign: 'center' }))}>{eyebrow}</p>
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

/** Beat 1 — the hero: headline left, the brain owns the right half. */
function HeroBeat() {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const playClick = useClickSound()
  const [phrase, setPhrase] = useState(0)

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
    <section
      className={css({
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        px: '6',
        sm: { px: '10' },
      })}
    >
      <div className={css({ maxW: '640px', pt: '20' })}>
        <TriangleText
          as="h1"
          text={HERO_PHRASES[phrase]}
          fontSize={92}
          fontWeight={650}
          height={220}
          gap={4}
        />
        <motion.p {...reveal(0.5)} className={cx(eyebrowMint, css({ mt: '2' }))}>
          Stop chasing calm. Start hearing it.
        </motion.p>
        <motion.p
          {...reveal(0.65)}
          className={css({
            m: '0',
            mt: '4',
            maxW: '430px',
            fontSize: 'subhead',
            lineHeight: '1.7',
            color: 'var(--ss-ink-body)',
          })}
        >
          Plug into your own signal. SmartSound reads your pulse from your camera and composes
          a living soundscape that steers you into focus, calm, or sleep — on your device,
          never uploaded.
        </motion.p>
        <motion.div {...reveal(0.8)} className={css({ mt: '7' })}>
          <button
            onClick={() => {
              playClick('primary')
              void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
            }}
            className={signalPill}
          >
            Start listening
          </button>
        </motion.div>
      </div>
    </section>
  )
}

/** Beat 2 — narration: the brain spreads into terrain while two centered
 * statements carry the story. */
function NarrationBeat() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const oA = useTransform(scrollYProgress, [0.22, 0.32, 0.45, 0.55], [0, 1, 1, 0])
  const oB = useTransform(scrollYProgress, [0.55, 0.65, 0.8, 0.9], [0, 1, 1, 0])

  const statement = css({
    position: 'absolute',
    insetX: '0',
    textAlign: 'center',
    px: '6',
    mx: 'auto',
    maxW: '820px',
    fontFamily: 'display',
    fontSize: 'clamp(1.5rem, 3.4vw, 2.4rem)',
    fontWeight: '500',
    letterSpacing: '-0.015em',
    lineHeight: '1.3',
    color: 'text',
  })

  return (
    <section id="engine" ref={ref} className={css({ position: 'relative', height: '230vh' })}>
      <div
        className={css({
          position: 'sticky',
          top: '0',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <motion.p style={{ opacity: oA }} className={statement}>
          This is your mind under noise. A day shattered into a thousand pings, tabs, and
          half-finished thoughts.
        </motion.p>
        <motion.p style={{ opacity: oB }} className={statement}>
          Attention doesn&rsquo;t come back on its own. The right sound, tuned to your pulse,
          brings it back.
        </motion.p>
      </div>
    </section>
  )
}

/** Beat 3 — the swarm rests as weightless dust. */
function DustBeat() {
  return <section aria-hidden className={css({ height: '80vh' })} />
}

/** Beat 4 — the lightbulb, copy on the right. */
function BulbBeat() {
  const reduce = useReducedMotion()
  return (
    <section className={css({ position: 'relative', height: '170vh' })}>
      <div
        className={css({
          position: 'sticky',
          top: '0',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: '6',
          sm: { px: '10' },
        })}
      >
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 30 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-120px' }}
          transition={enter}
          className={css({ maxW: '420px' })}
        >
          <TriangleText as="h2" text={'Spark quieter\nmoments.'} fontSize={56} fontWeight={630} height={140} gap={4} />
          <p
            className={css({
              m: '0',
              mt: '4',
              fontSize: 'subhead',
              lineHeight: '1.7',
              color: 'var(--ss-ink-body)',
            })}
          >
            SmartSound is your real-time engine for changing state. It watches the micro-flush
            of your skin for your heartbeat, then answers with sound — tempo, density and
            brightness easing you toward where you asked to go.
          </p>
          <p
            className={css({
              m: '0',
              mt: '3',
              fontSize: 'subhead',
              lineHeight: '1.7',
              color: 'var(--ss-ink-body)',
            })}
          >
            No playlists, no loops, no guesswork. Just ask it for focus, calm, or sleep, and
            let the loop do the steering.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/** Beat 5 — the planet, headline anchored bottom-left. */
function GlobeBeat() {
  const reduce = useReducedMotion()
  return (
    <section className={css({ position: 'relative', height: '170vh' })}>
      <div
        className={css({
          position: 'sticky',
          top: '0',
          height: '100vh',
          display: 'flex',
          alignItems: 'flex-end',
          px: '6',
          pb: '16',
          sm: { px: '10' },
        })}
      >
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 30 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-120px' }}
          transition={enter}
          className={css({ maxW: '460px' })}
        >
          <TriangleText as="h2" text={'Calm, for\nevery mind.'} fontSize={56} fontWeight={630} height={140} gap={4} />
          <p
            className={css({
              m: '0',
              mt: '4',
              fontSize: 'subhead',
              lineHeight: '1.7',
              color: 'var(--ss-ink-body)',
            })}
          >
            Our mission is to make deep rest and deep work ordinary — not a retreat, a
            subscription of promises, or a lucky day, but something your own body can be
            steered toward, anywhere, in two minutes.
          </p>
        </motion.div>
      </div>
    </section>
  )
}


/** Beat 5.5 — the swarm's pixels assemble into the phone, and the real
 * player fades in over them: pixels becoming product. */
function PhoneBeat() {
  const reduce = useReducedMotion()
  return (
    <section className={css({ position: 'relative', height: '170vh' })}>
      <div
        className={css({
          position: 'sticky',
          top: '0',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10',
          px: '6',
          flexWrap: 'wrap',
        })}
      >
        <motion.div
          initial={reduce ? undefined : { opacity: 0, scale: 0.94 }}
          whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
        >
          <PhoneShowcase />
        </motion.div>
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 30 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-120px' }}
          transition={enter}
          className={css({ maxW: '360px' })}
        >
          <TriangleText as="h2" text={'Pixels become\nthe player.'} fontSize={52} fontWeight={630} height={132} gap={4} />
          <p
            className={css({
              m: '0',
              mt: '4',
              fontSize: 'subhead',
              lineHeight: '1.7',
              color: 'var(--ss-ink-body)',
            })}
          >
            The same swarm that carried the story assembles into the phone in your pocket —
            the session title, the triangular wavelength breathing with the engine, and one
            perfectly centered play.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/** Beat 6 — the product, shown honestly. */
function InsideBeat() {
  return (
    <section
      id="inside"
      className={css({ position: 'relative', px: '5', pt: '20', pb: '10', maxW: '1080px', mx: 'auto' })}
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
        System type, void-dark surfaces, and one signature material — Liquid Glass — on the
        control layer. Every panel below is a screen the app actually ships.
      </p>
      <AppShowcase />
    </section>
  )
}

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    per: 'forever',
    lines: ['Explore every state', '20 minutes a day', 'No account needed'],
  },
  {
    name: 'Pro',
    price: '$9.99',
    per: '/ month',
    lines: ['Unlimited listening', 'Full Attune biofeedback', 'All scenes and sessions'],
  },
  {
    name: 'Studio',
    price: '$19.99',
    per: '/ month',
    lines: ['Everything in Pro', 'Developer sound controls', 'Early features first'],
  },
]

/** Beat 7 — plans: the real tiers, real prices, no dark patterns. */
function PlansBeat() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <section
      id="plans"
      className={css({ position: 'relative', px: '5', pt: '20', maxW: '1000px', mx: 'auto' })}
    >
      <SectionHeading eyebrow="Plans" title="Start free, stay honest" />
      <div className={css({ display: 'grid', gap: '5', md: { gridTemplateColumns: 'repeat(3, 1fr)' } })}>
        {PLANS.map((p, i) => (
          <LiquidGlass
            key={p.name}
            variant="card"
            tint={i === 1 ? 'rgba(74, 168, 255, 0.30)' : undefined}
            className={css({ p: '7' })}
          >
            <p className={eyebrowMint}>{p.name}</p>
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
                      background: `linear-gradient(135deg, ${BLUE}, ${GREEN})`,
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
        <button
          onClick={() => {
            playClick('primary')
            void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
          }}
          className={signalPill}
        >
          Start free
        </button>
        <p className={css({ m: '0', fontSize: 'caption', color: 'var(--ss-ink-soft)' })}>
          Prices as shown in-app · annual saves more · cancel anytime
        </p>
      </div>
    </section>
  )
}

/** Beat 8 — the closing statement over the ribbon, then a one-row footer. */
function ClosingBeat() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <section
      className={css({
        position: 'relative',
        minHeight: '96vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: '5',
        gap: '6',
      })}
    >
      <TriangleText
        as="h2"
        text={'Your body has the answer.\nAsk SmartSound to play it.'}
        fontSize={58}
        fontWeight={630}
        align="center"
        height={150}
        gap={4}
        className={css({ w: '100%', maxW: '880px' })}
      />
      <button
        onClick={() => {
          playClick('primary')
          void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
        }}
        className={signalPill}
      >
        Start listening
      </button>
      <p className={css({ m: '0', fontSize: 'caption', color: 'var(--ss-ink-soft)' })}>
        Free to explore · no account · the camera stays on your device
      </p>
    </section>
  )
}

function FooterRow() {
  const a = css({
    fontSize: 'caption',
    fontWeight: '600',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--ss-ink-body)',
    textDecoration: 'none',
    px: '2.5',
    _hover: { color: 'text' },
  })
  return (
    <footer
      className={css({
        position: 'relative',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4',
        px: '6',
        py: '6',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      })}
    >
      <p className={css({ m: '0', fontSize: 'caption', color: 'var(--ss-ink-soft)' })}>
        © 2026 SmartSound. Not a medical device.
      </p>
      <div>
        <a className={a} href="#engine">Engine</a>
        <a className={a} href="#inside">The app</a>
        <a className={a} href="#plans">Plans</a>
        <a className={a} href="#top">Top</a>
      </div>
    </footer>
  )
}

function Welcome() {
  // The screen-glide scroll feel — wheel input lerps the real scroll position.
  useSmoothScroll()
  // The page fades in only once the counter reaches 100.
  const [ready, setReady] = useState(false)

  // One swarm, one story: overall page progress drives the shape timeline.
  const progressRef = useRef(0)
  const { scrollYProgress } = useScroll()
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progressRef.current = v
  })

  return (
    <div
      id="top"
      className={cx('ss-scene-dark', css({ position: 'relative', bg: 'black', color: 'text' }))}
    >
      <LoadingOverlay onDone={() => setReady(true)} />
      <VoidNav />

      {/* THE canvas — fixed behind everything; scroll morphs it through
          brain → terrain → dust (held) → bulb → globe (held) → network →
          ribbon, with loner triangles drifting throughout. */}
      <TriangleConstellation
        shapes={['brain', 'dome', 'dust', 'bulb', 'bulb', 'globe', 'phone', 'phone', 'network', 'ribbon']}
        mode="scroll"
        progressRef={progressRef}
        rotate="sway"
        count={6400}
        size={0.075}
        ambient={110}
        stageOffsets={{ brain: 1.7 }}
        className={css({ position: 'fixed', inset: '0', zIndex: '0', transition: 'opacity 1.1s ease' })}
        style={{ opacity: ready ? 1 : 0 }}
      />

      <div
        className={css({ position: 'relative', zIndex: '1', transition: 'opacity 1.1s ease, transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)' })}
        style={{ opacity: ready ? 1 : 0, transform: ready ? 'none' : 'translateY(18px)' }}
      >
        <HeroBeat />
        <NarrationBeat />
        <DustBeat />
        <BulbBeat />
        <GlobeBeat />
        <PhoneBeat />
        <InsideBeat />
        <PlansBeat />
        <ClosingBeat />
        <FooterRow />
      </div>
    </div>
  )
}
