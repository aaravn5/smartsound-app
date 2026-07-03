import { lazy, Suspense, useCallback, useState, type ReactNode, type PointerEvent as RPointerEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { css } from 'styled-system/css'
import { flex, hstack, stack } from 'styled-system/patterns'
import { GlassButton } from '~/components/GlassButton'
import { BrainStemScroll } from './BrainStemScroll'

// three/R3F as async chunks — the headline + CTA paint immediately (Part 5.C).
const PixelHero = lazy(() => import('./PixelHero').then((m) => ({ default: m.PixelHero })))
import { FaqAccordion, type FaqItem } from './FaqAccordion'
import { BiofeedbackRing } from '~/design/BiofeedbackRing'
import { useEngine } from '~/lib/engine-context'

/**
 * LandingPage — sells SmartSound and launches into it (Part 5.B). Pixel hero,
 * a brain-stem scroll carrying the story nodes, the real BiofeedbackRing as the
 * live demo, honest science copy, a Liquid Glass FAQ, and a final CTA. Every
 * CTA routes into /play — the running app. One design system, one GlassButton.
 */
const easeCalm = [0.22, 1, 0.36, 1] as const

const FAQS: FaqItem[] = [
  { q: 'Do I need to wear anything?', a: 'No. SmartSound reads your pulse from your device’s front camera — no straps, watches, or chest belts. If you’d rather not use the camera, it runs a fixed soundscape instead.' },
  { q: 'Does my video get uploaded?', a: 'Never. Camera frames are processed entirely on-device to estimate heart rate; only that number is used. The raw video never leaves your browser.' },
  { q: 'Is this binaural beats?', a: 'No. SmartSound uses amplitude-modulation entrainment — an audible soundscape whose amplitude is gently modulated — not the binaural-beats approach that needs headphones and two detuned tones.' },
  { q: 'Is it a medical device?', a: 'No. SmartSound is a wellness tool. It doesn’t diagnose, treat, or measure anything clinically, and the heart-rate read is an estimate, not a diagnostic reading.' },
  { q: 'What if the camera can’t read me?', a: 'In low light or when no face is found, confidence drops and SmartSound falls back to a fixed soundscape and tells you — the loop simply opens rather than pretending.' },
]

function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal', letterSpacing: '0.18em', textTransform: 'uppercase' })}>
      {children}
    </span>
  )
}
function NodeTitle({ children }: { children: ReactNode }) {
  return <h2 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: { base: '2xl', md: '3xl' }, letterSpacing: '-0.02em', mt: '3', textWrap: 'balance' })}>{children}</h2>
}
function NodeBody({ children }: { children: ReactNode }) {
  return <p className={css({ color: 'muted', fontSize: 'md', lineHeight: '1.65', mt: '3', maxW: '54ch' })}>{children}</p>
}

/** Interactive teaser using the REAL ring — hover to steer arousal; idle it breathes. */
function DemoRing() {
  const { getSpectrum, getPulse } = useEngine()
  const [arousal, setArousal] = useState(0.5)
  const onMove = useCallback((e: RPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setArousal(Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)))
  }, [])
  return (
    <div
      onPointerMove={onMove}
      className={css({
        position: 'relative', width: 'min(360px, 78vw)', aspectRatio: '1', mx: 'auto', cursor: 'ns-resize',
        rounded: '3xl', bg: 'glassFill', border: '1px solid token(colors.glassBorder)',
        backdropFilter: 'blur(var(--glass-blur))', boxShadow: 'var(--glass-shadow)',
      })}
    >
      <BiofeedbackRing arousal={arousal} getSpectrum={getSpectrum} getPulse={getPulse} size={360} />
      <span className={css({ position: 'absolute', bottom: '4', left: '0', width: 'full', textAlign: 'center', fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.08em', pointerEvents: 'none' })}>
        MOVE TO STEER · IN THE APP IT TRACKS YOUR PULSE
      </span>
    </div>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const launch = useCallback(() => void navigate({ to: '/play' }), [navigate])

  return (
    <div className={css({ bg: 'bgBase', color: 'text', overflowX: 'hidden' })}>
      {/* nav */}
      <header
        className={flex({
          justify: 'space-between', align: 'center', position: 'sticky', top: '0', zIndex: '30',
          px: { base: '5', md: '8' }, py: '3', bg: 'glassFill', borderBottom: '1px solid token(colors.glassBorder)',
        })}
        style={{ backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)' }}
      >
        <div className={hstack({ gap: '2.5' })}>
          <span className={css({ w: '2', h: '2', rounded: 'full', bg: 'signal', boxShadow: '0 0 12px token(colors.signal)' })} />
          <span className={css({ fontFamily: 'display', fontWeight: '700', fontSize: 'lg', letterSpacing: '-0.01em' })}>SmartSound</span>
        </div>
        <GlassButton variant="primary" size="sm" onClick={launch}>Launch SmartSound</GlassButton>
      </header>

      {/* hero */}
      <section className={css({ position: 'relative', height: '100dvh', overflow: 'hidden' })}>
        <Suspense fallback={null}>
          <PixelHero />
        </Suspense>
        <div
          className={stack({
            gap: '6', align: 'center', justify: 'center', textAlign: 'center', height: 'full',
            position: 'relative', zIndex: '2', px: '5', pointerEvents: 'none',
          })}
        >
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: easeCalm }}
            className={css({ fontFamily: 'display', fontWeight: '700', fontSize: { base: '4xl', md: '6xl' }, letterSpacing: '-0.03em', lineHeight: '1.02', maxW: '16ch', textWrap: 'balance' })}
          >
            Sound that listens back
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.12, ease: easeCalm }}
            className={css({ color: 'muted', fontSize: { base: 'md', md: 'lg' }, lineHeight: '1.6', maxW: '52ch' })}
          >
            SmartSound reads your pulse through the camera and reshapes a generative soundscape in real time — a closed loop between your body and what you hear.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.24, ease: easeCalm }}
            className={css({ pointerEvents: 'auto' })}
          >
            <GlassButton variant="primary" size="lg" onClick={launch}>Launch SmartSound</GlassButton>
          </motion.div>
        </div>
      </section>

      {/* the brain-stem story */}
      <BrainStemScroll>
        <div>
          <Kicker>How it works</Kicker>
          <NodeTitle>A loop between your body and the sound</NodeTitle>
          <div className={stack({ gap: '5', mt: '6' })}>
            {[
              ['01', 'It reads your pulse', 'The front camera detects tiny colour changes in your skin (rPPG) to estimate heart rate — on device, video never leaves your browser.'],
              ['02', 'The sound adapts', 'A generative engine shifts entrainment, tempo and brightness toward your target state as your heart rate moves.'],
              ['03', 'You see the loop', 'The biofeedback ring pulses with your heartbeat and warms or cools with your heart rate, so the loop is visible, not hidden.'],
            ].map(([n, t, b]) => (
              <div key={n} className={flex({ gap: '4', align: 'flex-start', p: '5', rounded: '2xl', bg: 'glassFill', border: '1px solid token(colors.glassBorder)' })}>
                <span className={`tabular ${css({ fontFamily: 'mono', fontSize: 'sm', color: 'signal', pt: '0.5' })}`}>{n}</span>
                <div>
                  <h3 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'lg' })}>{t}</h3>
                  <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.55', mt: '1' })}>{b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className={css({ textAlign: 'center' })}>
            <Kicker>Live demo</Kicker>
            <NodeTitle>The ring, breathing</NodeTitle>
          </div>
          <div className={css({ mt: '8' })}><DemoRing /></div>
        </div>

        <div>
          <Kicker>The science, honestly</Kicker>
          <NodeTitle>Established techniques, applied as a calm feedback loop</NodeTitle>
          <NodeBody>
            SmartSound stands on two well-studied ideas: remote photoplethysmography (reading pulse from a camera) and amplitude-modulation
            entrainment (a soundscape whose amplitude is gently modulated). It pairs them into a real-time loop that nudges you toward a chosen
            state. It is a wellness tool, not a medical device — it doesn’t diagnose or treat anything, and the heart-rate read is an estimate.
          </NodeBody>
        </div>

        <div>
          <div className={css({ textAlign: 'center', mb: '8' })}>
            <Kicker>Questions</Kicker>
            <NodeTitle>The honest FAQ</NodeTitle>
          </div>
          <FaqAccordion items={FAQS} />
        </div>

        <div className={stack({ gap: '6', align: 'center', textAlign: 'center' })}>
          <NodeTitle>Close the loop</NodeTitle>
          <NodeBody>Open the app, let it read your pulse, and hear the soundscape settle with you.</NodeBody>
          <GlassButton variant="primary" size="lg" onClick={launch}>Launch SmartSound</GlassButton>
        </div>
      </BrainStemScroll>

      {/* footer */}
      <footer className={flex({ justify: 'space-between', align: 'center', wrap: 'wrap', gap: '3', px: { base: '5', md: '8' }, py: '8', borderTop: '1px solid token(colors.hairline)', position: 'relative', zIndex: '1' })}>
        <div className={hstack({ gap: '2.5' })}>
          <span className={css({ w: '2', h: '2', rounded: 'full', bg: 'signal' })} />
          <span className={css({ fontFamily: 'display', fontWeight: '600' })}>SmartSound</span>
        </div>
        <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.06em' })}>
          A wellness tool, not a medical device · processed on-device
        </span>
      </footer>
    </div>
  )
}
