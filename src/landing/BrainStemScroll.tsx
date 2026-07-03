import { Children, Suspense, lazy, useRef, type ReactNode } from 'react'
import { motion, useScroll } from 'motion/react'
import { css } from 'styled-system/css'
import { prefersReducedMotion } from '~/design/signal'

/**
 * BrainStemScroll — the landing's spine (Part 5.B). A sticky low-poly neural
 * mesh stays pinned while a glowing brain-stem line grows downward with scroll;
 * each child renders as a node/branch off the stem that fades and slides in as
 * it enters view, with a synapse dot marking it. On mobile the 3D mesh drops
 * away and it becomes a simple vertical fade-in sequence. The mesh is a lazy
 * chunk so three/R3F never block first paint (Part 5.C).
 */
const BrainCanvas = lazy(() => import('./BrainCanvas'))

const easeCalm = [0.22, 1, 0.36, 1] as const

export function BrainStemScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = prefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const items = Children.toArray(children)

  return (
    <section ref={ref} className={css({ position: 'relative' })}>
      {/* pinned neural mesh (desktop) */}
      <div
        className={css({
          display: { base: 'none', md: 'block' },
          position: 'sticky',
          top: '0',
          height: '100dvh',
          zIndex: '0',
          pointerEvents: 'none',
        })}
      >
        <Suspense fallback={null}>
          <BrainCanvas />
        </Suspense>
        {/* the glowing brain-stem: a track + a fill that grows with scroll */}
        <div
          className={css({
            position: 'absolute', top: '52%', bottom: '0', left: '50%',
            width: '2px', transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, token(colors.glassBorder), transparent)',
          })}
        >
          <motion.div
            style={{ scaleY: reduce ? 1 : scrollYProgress, transformOrigin: 'top' }}
            className={css({
              position: 'absolute', inset: '0',
              background: 'linear-gradient(180deg, token(colors.ringCool), token(colors.ringWarm))',
              boxShadow: '0 0 12px color-mix(in oklab, var(--signal) 60%, transparent)',
            })}
          />
        </div>
      </div>

      {/* nodes — each child is a branch off the stem */}
      <div
        className={css({
          position: 'relative', zIndex: '1',
          maxW: '720px', mx: 'auto', px: '5',
          pt: { base: '16', md: '40vh' },
          display: 'flex', flexDir: 'column', gap: { base: '24', md: '38vh' },
          pb: '24',
        })}
      >
        {items.map((child, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: reduce ? 0 : 44 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15% 0px -15% 0px' }}
            transition={{ duration: 0.75, ease: easeCalm }}
            className={css({ position: 'relative' })}
          >
            {/* synapse dot on the stem (desktop) */}
            <span
              aria-hidden
              className={css({
                display: { base: 'none', md: 'block' },
                position: 'absolute', left: '50%', top: '-6px', transform: 'translateX(-50%)',
                width: '10px', height: '10px', rounded: 'full', bg: 'signal',
                boxShadow: '0 0 16px color-mix(in oklab, var(--signal) 80%, transparent)',
              })}
            />
            {child}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
