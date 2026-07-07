import { useEffect, useRef } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { NeuralNote } from '~/landing/NeuralNote'
import { useClickSound } from '~/lib/click-sound'
import { hasOnboarded } from '~/lib/onboarding'

/**
 * Welcome — the interactive landing, now a sticky-scroll story.
 *
 * Stage 1 pins the original spotlight hero: two Higgsfield renders of the SAME
 * ridge — barren rock (your mind under noise) and the identical ridge in bloom
 * (your mind with SmartSound) — revealed through a cursor-following spotlight.
 *
 * Stage 2 pins a Dala-style particle constellation: a blue/green BRAIN that
 * the visitor's scroll transforms into a beamed MUSIC NOTE, warming to yellow
 * wherever the pointer touches it.
 *
 * Stage 3 stacks Liquid Glass cards (how it works) that pile up as you scroll;
 * Stage 4 closes with the door in. Returning visitors skip straight to /app.
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (hasOnboarded()) throw redirect({ to: '/app' })
  },
  component: Welcome,
})

const BASE_IMAGE = '/intro/mind-before.webp'
const REVEAL_IMAGE = '/intro/mind-after.webp'
const SPOTLIGHT_R = 260

const enter = { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const }

function spotlightMask(x: number, y: number): string {
  return `radial-gradient(circle ${SPOTLIGHT_R}px at ${x}px ${y}px, rgb(0 0 0) 0%, rgb(0 0 0) 40%, rgb(0 0 0 / 0.75) 60%, rgb(0 0 0 / 0.4) 75%, rgb(0 0 0 / 0.12) 88%, transparent 100%)`
}

const heroImage = css({
  position: 'absolute',
  left: '0',
  top: '0',
  width: '100%',
  height: '100%',
  maxWidth: 'none',
  objectFit: 'cover',
  pointerEvents: 'none',
})

/** The reveal layer — the blooming ridge, visible only inside the soft
 * spotlight that trails the cursor. The mask is mutated directly on the DOM
 * node from a rAF loop (smoothed lerp), so nothing re-renders per frame. */
function RevealLayer({ reduceMotion }: { reduceMotion: boolean }) {
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = layerRef.current
    if (!el) return
    // Start with the spotlight parked off-center so the contrast is visible
    // before the first pointer move (especially on touch devices).
    const mouse = { x: window.innerWidth * 0.62, y: window.innerHeight * 0.42 }
    const smooth = { ...mouse }

    const apply = () => {
      const mask = spotlightMask(smooth.x, smooth.y)
      el.style.maskImage = mask
      el.style.webkitMaskImage = mask
    }
    apply()

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) {
        mouse.x = t.clientX
        mouse.y = t.clientY
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true })

    let raf = 0
    const tick = () => {
      const ease = reduceMotion ? 1 : 0.1
      smooth.x += (mouse.x - smooth.x) * ease
      smooth.y += (mouse.y - smooth.y) * ease
      apply()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchstart', onTouch)
      cancelAnimationFrame(raf)
    }
  }, [reduceMotion])

  return (
    <div
      ref={layerRef}
      aria-hidden
      className={css({
        position: 'absolute',
        inset: '0',
        zIndex: '2',
        pointerEvents: 'none',
      })}
      style={{ maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }}
    >
      <img aria-hidden alt="" decoding="async" src={REVEAL_IMAGE} className={heroImage} />
    </div>
  )
}

const overlayText = css({
  textShadow: 'var(--ss-text-glow)',
})

/** Stage 1 — the spotlight ridge, pinned while the story scrolls over it. */
function HeroStage() {
  const reduce = useReducedMotion()

  const reveal = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { ...enter, delay },
        }

  return (
    <section className={css({ position: 'relative', height: '170vh' })}>
      <div
        className={css({
          position: 'sticky',
          top: '0',
          height: '100dvh',
          minHeight: '540px',
          overflow: 'hidden',
          bg: 'black',
        })}
      >
        {/* Base — the barren ridge: the mind under noise. Slow settle-zoom. */}
        <motion.div
          aria-hidden
          className={css({ position: 'absolute', inset: '0', zIndex: '1' })}
          initial={reduce ? undefined : { scale: 1.1 }}
          animate={reduce ? undefined : { scale: 1 }}
          transition={reduce ? undefined : { duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <img aria-hidden alt="" decoding="async" src={BASE_IMAGE} className={heroImage} />
        </motion.div>

        {/* Spotlight reveal — the same ridge in bloom: the mind with SmartSound. */}
        <RevealLayer reduceMotion={Boolean(reduce)} />

        {/* Legibility scrim — steadies the top and bottom text zones. */}
        <div
          aria-hidden
          className={css({
            position: 'absolute',
            inset: '0',
            zIndex: '3',
            pointerEvents: 'none',
            background:
              'linear-gradient(to bottom, rgba(2, 4, 10, 0.6) 0%, rgba(2, 4, 10, 0) 26%, rgba(2, 4, 10, 0) 62%, rgba(2, 4, 10, 0.72) 100%)',
          })}
        />

        {/* Heading — centered over the scene. */}
        <div
          className={css({
            position: 'absolute',
            top: '13%',
            insetX: '0',
            zIndex: '4',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            px: '5',
            pointerEvents: 'none',
          })}
        >
          <motion.p
            {...reveal(0.1)}
            className={cx(
              overlayText,
              css({
                m: '0',
                mb: '3',
                fontSize: 'footnote',
                fontWeight: '600',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--ss-ink-soft)',
              }),
            )}
          >
            SmartSound
          </motion.p>
          <motion.h1
            {...reveal(0.25)}
            className={cx(
              overlayText,
              css({
                m: '0',
                fontFamily: 'display',
                fontSize: 'clamp(2.6rem, 8.5vw, 4.5rem)',
                fontWeight: '700',
                letterSpacing: '-0.03em',
                lineHeight: '0.98',
                color: 'text',
              }),
            )}
          >
            <span className={css({ display: 'block', fontStyle: 'italic', fontWeight: '500' })}>
              Same mind,
            </span>
            <span className={css({ display: 'block', mt: '1' })}>different state</span>
          </motion.h1>
          <motion.p
            {...reveal(0.45)}
            className={cx(
              overlayText,
              css({
                m: '0',
                mt: '4',
                fontSize: 'subhead',
                fontWeight: '500',
                color: 'var(--ss-ink-body)',
              }),
            )}
          >
            Move the light — that&rsquo;s you, with SmartSound.
          </motion.p>
        </div>

        {/* Bottom-left — the metaphor, spelled out honestly. */}
        <motion.div
          {...reveal(0.7)}
          className={css({
            display: 'none',
            sm: { display: 'block' },
            position: 'absolute',
            bottom: '14',
            left: '10',
            zIndex: '4',
            maxW: '270px',
            pointerEvents: 'none',
          })}
        >
          <p
            className={cx(
              overlayText,
              css({ m: '0', fontSize: 'footnote', lineHeight: '1.6', color: 'var(--ss-ink-body)' }),
            )}
          >
            The dark ridge is a day of noise. Under the light, the same ground is in bloom —
            neuroacoustic soundscapes that listen to your pulse and steer you toward focus, rest,
            or sleep.
          </p>
        </motion.div>

        {/* Bottom-center — the scroll cue into the story. */}
        <motion.div
          {...reveal(0.9)}
          aria-hidden
          className={css({
            position: 'absolute',
            bottom: '6',
            insetX: '0',
            zIndex: '4',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          })}
        >
          <span
            className={cx(
              overlayText,
              css({
                fontSize: 'caption',
                fontWeight: '600',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--ss-ink-soft)',
                animation: reduce ? undefined : 'bob 2.4s ease-in-out infinite',
              }),
            )}
          >
            Scroll ↓
          </span>
        </motion.div>
      </div>
    </section>
  )
}

/** Stage 2 — the pinned constellation: scroll morphs brain → music note. */
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
    <section ref={ref} className={css({ position: 'relative', height: '320vh' })}>
      <div
        className={css({
          position: 'sticky',
          top: '0',
          height: '100dvh',
          overflow: 'hidden',
          bg: '#04060c',
        })}
      >
        <NeuralNote
          progressRef={progressRef}
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
              fontWeight: '700',
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
              fontWeight: '700',
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

/** Stage 3 — Liquid Glass cards that pile up as you scroll. */
function CardsStage() {
  return (
    <section className={css({ position: 'relative', px: '5', pb: '20', maxW: '720px', mx: 'auto' })}>
      <div className={css({ pt: '24', pb: '10', textAlign: 'center' })}>
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
          How it works
        </p>
        <h2
          className={css({
            m: '0',
            fontFamily: 'display',
            fontSize: 'clamp(1.9rem, 4.5vw, 3rem)',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            color: 'text',
          })}
        >
          Three honest moves
        </h2>
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
                fontWeight: '700',
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

/** Stage 4 — the door in. */
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
      <h2
        className={css({
          m: '0',
          fontFamily: 'display',
          fontSize: 'clamp(2.2rem, 6.5vw, 4rem)',
          fontWeight: '700',
          letterSpacing: '-0.03em',
          lineHeight: '1',
          color: 'text',
        })}
      >
        Same mind,
        <br />
        different state.
      </h2>
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
        tint="rgba(139, 108, 246, 0.6)"
        onClick={() => {
          playClick('primary')
          void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })
        }}
        className={css({
          minW: '200px',
          minH: '52px',
          border: '1px solid rgba(196, 181, 253, 0.38)',
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

function Welcome() {
  return (
    <div
      className={cx(
        'ss-scene-dark',
        css({ position: 'relative', bg: 'black', color: 'text' }),
      )}
    >
      <HeroStage />
      <MorphStage />
      <CardsStage />
      <CtaStage />
    </div>
  )
}
