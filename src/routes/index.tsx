import { useEffect, useRef } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { useClickSound } from '~/lib/click-sound'
import { hasOnboarded } from '~/lib/onboarding'

/**
 * Welcome — the interactive landing. A full-screen dark hero built on two
 * Higgsfield renders of the SAME ridge: barren rock (your mind under noise)
 * and the identical ridge in bloom (your mind with SmartSound). A soft
 * cursor-following spotlight reveals the "with" state through a radial mask —
 * an interactive before/after demonstration, no claims beyond the metaphor.
 *
 * Returning visitors (onboarded flag) skip straight to /app. The spotlight
 * follows mouse and touch; under reduced motion it still works (snaps, no
 * easing, no slow zoom). Always dark (`ss-scene-dark`) in both themes.
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

function Welcome() {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const playClick = useClickSound()

  const reveal = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { ...enter, delay },
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

      {/* Legibility scrim — the renders are mostly black; this only steadies
          the top and bottom text zones. */}
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
          className={css({
            m: '0',
            mb: '3',
            fontSize: 'footnote',
            fontWeight: '600',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--ss-ink-soft)',
            textShadow: 'var(--ss-text-glow)',
          })}
        >
          SmartSound
        </motion.p>
        <motion.h1
          {...reveal(0.25)}
          className={css({
            m: '0',
            fontFamily: 'display',
            fontSize: 'clamp(2.6rem, 8.5vw, 4.5rem)',
            fontWeight: '700',
            letterSpacing: '-0.03em',
            lineHeight: '0.98',
            color: 'text',
            textShadow: 'var(--ss-text-glow)',
          })}
        >
          <span className={css({ display: 'block', fontStyle: 'italic', fontWeight: '500' })}>
            Same mind,
          </span>
          <span className={css({ display: 'block', mt: '1' })}>different state</span>
        </motion.h1>
        <motion.p
          {...reveal(0.45)}
          className={css({
            m: '0',
            mt: '4',
            fontSize: 'subhead',
            fontWeight: '500',
            color: 'var(--ss-ink-body)',
            textShadow: 'var(--ss-text-glow)',
          })}
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
          className={css({
            m: '0',
            fontSize: 'footnote',
            lineHeight: '1.6',
            color: 'var(--ss-ink-body)',
            textShadow: 'var(--ss-text-glow)',
          })}
        >
          The dark ridge is a day of noise. Under the light, the same ground is in bloom —
          neuroacoustic soundscapes that listen to your pulse and steer you toward focus, rest,
          or sleep.
        </p>
      </motion.div>

      {/* Bottom-right — the door in. */}
      <motion.div
        {...reveal(0.85)}
        className={css({
          position: 'absolute',
          bottom: '10',
          left: '5',
          right: '5',
          zIndex: '4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '4',
          sm: { left: 'auto', right: '10', bottom: '14', maxW: '280px' },
        })}
      >
        <p
          className={css({
            m: '0',
            fontSize: 'footnote',
            lineHeight: '1.6',
            color: 'var(--ss-ink-body)',
            textShadow: 'var(--ss-text-glow)',
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
        <p className={css({ m: '0', fontSize: 'caption', color: 'var(--ss-ink-soft)', textShadow: 'var(--ss-text-glow)' })}>
          Free to explore. The camera stays on your device.
        </p>
      </motion.div>
    </div>
  )
}
