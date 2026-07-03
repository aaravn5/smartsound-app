import { Suspense, lazy, useRef, type ReactNode } from 'react'
import { motion, useScroll } from 'motion/react'
import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import { prefersReducedMotion } from '~/design/signal'

/**
 * BrainStemScroll — the landing's spine (Part 5.B / v2 §6). A sticky low-poly
 * neural mesh stays pinned behind a glowing brain-stem line that grows downward
 * with scroll. Every section is a literal BRANCH off that stem: on desktop it
 * alternates left/right, connected to the centre stem by a short glowing
 * horizontal line with a mono branch label at the junction. As a branch enters
 * view a synapse pulse (a small dot) travels the connector from the stem out
 * to the section, and the section card fades/slides in. On mobile the mesh and
 * branching drop away entirely — a single-column vertical fade sequence with
 * the label as an eyebrow. The mesh is a lazy chunk so three/R3F never block
 * first paint (Part 5.C).
 */
const BrainCanvas = lazy(() => import('./BrainCanvas'))

const easeCalm = [0.22, 1, 0.36, 1] as const

export interface BrainStemSection {
  id: string
  label: string
  content: ReactNode
}

const card = css({
  width: 'full',
  maxW: { base: 'full', md: '440px' },
  rounded: '3xl',
  bg: 'glassFill',
  border: '1px solid token(colors.glassBorder)',
  backdropFilter: 'blur(var(--glass-blur))',
  boxShadow: 'var(--glass-shadow), inset 0 1px 0 token(colors.glassHighlight)',
  p: { base: '0', md: '7' },
})

const junctionCol = css({
  width: '132px',
  flexShrink: '0',
  display: 'flex',
  flexDir: 'column',
  alignItems: 'center',
  pt: '7',
})

function BranchLabel({ children }: { children: ReactNode }) {
  return (
    <span
      className={css({
        fontFamily: 'mono',
        fontSize: '2xs',
        color: 'signal',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      })}
    >
      {children}
    </span>
  )
}

/** The short glowing line from the stem (column centre) out to the card edge, plus the synapse pulse dot. */
function Connector({ side, reduce }: { side: 'left' | 'right'; reduce: boolean }) {
  const dotFrom = '50%'
  const dotTo = side === 'left' ? '6%' : '94%'
  return (
    <div aria-hidden className={css({ position: 'relative', width: 'full', height: '10px', mt: '2.5' })}>
      <div
        className={css({
          position: 'absolute', top: '50%', width: '50%', height: '2px',
          bg: 'signal', opacity: '0.45',
          boxShadow: '0 0 10px color-mix(in oklab, var(--signal) 55%, transparent)',
        })}
        style={{ left: side === 'left' ? 0 : '50%', transform: 'translateY(-50%)' }}
      />
      {!reduce && (
        <motion.span
          initial={{ opacity: 0, left: dotFrom }}
          whileInView={{ opacity: [0, 1, 1, 0], left: [dotFrom, dotTo] }}
          viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
          transition={{ duration: 0.85, ease: easeCalm, times: [0, 0.12, 0.82, 1] }}
          style={{ position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)' }}
          className={css({
            width: '7px', height: '7px', rounded: 'full', bg: 'signal',
            boxShadow: '0 0 14px color-mix(in oklab, var(--signal) 85%, transparent)',
          })}
        />
      )}
    </div>
  )
}

function Branch({ section, side, reduce }: { section: BrainStemSection; side: 'left' | 'right'; reduce: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px -15% 0px' }}
      transition={{ duration: 0.75, ease: easeCalm }}
      className={css({ position: 'relative' })}
    >
      {/* desktop — the branch: card / junction+connector / (empty) alternating sides */}
      <div className={css({ display: { base: 'none', md: 'grid' }, gridTemplateColumns: '1fr 132px 1fr', alignItems: 'start' })}>
        <div className={flex({ justify: 'flex-end' })}>{side === 'left' && <div className={card}>{section.content}</div>}</div>
        <div className={junctionCol}>
          <BranchLabel>{section.label}</BranchLabel>
          <Connector side={side} reduce={reduce} />
        </div>
        <div className={flex({ justify: 'flex-start' })}>{side === 'right' && <div className={card}>{section.content}</div>}</div>
      </div>

      {/* mobile — collapsed vertical fade sequence, label as eyebrow, no mesh */}
      <div className={css({ display: { base: 'block', md: 'none' } })}>
        <BranchLabel>{section.label}</BranchLabel>
        <div className={css({ mt: '3' })}>{section.content}</div>
      </div>
    </motion.div>
  )
}

export function BrainStemScroll({ sections }: { sections: BrainStemSection[] }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = prefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

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

      {/* branches — each section is a node off the stem */}
      <div
        className={css({
          position: 'relative', zIndex: '1',
          maxW: { base: '640px', md: '1000px' }, mx: 'auto', px: '5',
          pt: { base: '16', md: '40vh' },
          display: 'flex', flexDir: 'column', gap: { base: '20', md: '32vh' },
          pb: '24',
        })}
      >
        {sections.map((section, i) => (
          <Branch key={section.id} section={section} side={i % 2 === 0 ? 'left' : 'right'} reduce={reduce} />
        ))}
      </div>
    </section>
  )
}
