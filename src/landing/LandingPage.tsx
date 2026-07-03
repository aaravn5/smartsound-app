import { lazy, Suspense, useCallback, useMemo, useState, type ReactNode, type PointerEvent as RPointerEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { css } from 'styled-system/css'
import { flex, hstack, stack } from 'styled-system/patterns'
import { GlassButton } from '~/components/GlassButton'
import { BrainStemScroll, type BrainStemSection } from './BrainStemScroll'

// three/R3F as async chunks — the headline + CTA paint immediately (Part 5.C).
const PixelHero = lazy(() => import('./PixelHero').then((m) => ({ default: m.PixelHero })))
import { FaqAccordion, type FaqItem } from './FaqAccordion'
import { BiofeedbackRing } from '~/design/BiofeedbackRing'
import { useEngine } from '~/lib/engine-context'
import { hasOnboarded } from '~/lib/onboarding'

/**
 * LandingPage — sells SmartSound and launches into it (Part 5.B / v2 §6). Pixel
 * hero, a brain-stem scroll whose stem literally BRANCHES to every section (how
 * it works, the science, pricing, FAQ, legal, launch), the real BiofeedbackRing
 * as the live demo, honest science + pricing copy, a Liquid Glass FAQ, and a
 * final CTA. Every CTA routes into /app or the paywall — one design system,
 * one GlassButton.
 */
const easeCalm = [0.22, 1, 0.36, 1] as const

const FAQS: FaqItem[] = [
  { q: 'Do I need to wear anything?', a: 'No. SmartSound reads your pulse from your device’s front camera — no straps, watches, or chest belts. If you’d rather not use the camera, it runs a fixed soundscape instead.' },
  { q: 'Does my video get uploaded?', a: 'Never. Camera frames are processed entirely on-device to estimate heart rate; only that number is used. The raw video never leaves your browser.' },
  { q: 'Is this binaural beats?', a: 'No. SmartSound uses amplitude-modulation entrainment — an audible soundscape whose amplitude is gently modulated — not the binaural-beats approach that needs headphones and two detuned tones.' },
  { q: 'Is it a medical device?', a: 'No. SmartSound is a wellness tool. It doesn’t diagnose, treat, or measure anything clinically, and the heart-rate read is an estimate, not a diagnostic reading.' },
  { q: 'What if the camera can’t read me?', a: 'In low light or when no face is found, confidence drops and SmartSound falls back to a fixed soundscape and tells you — the loop simply opens rather than pretending.' },
]

/** Condensed pricing — mirrors the paywall's Free/Pro/Studio tiers (§4.1), editorial rows not equal cards. */
interface LandingTier {
  id: 'free' | 'pro' | 'studio'
  name: string
  blurb: string
  price: string
  priceSub?: string
  recommended?: boolean
}
const LANDING_TIERS: LandingTier[] = [
  { id: 'free', name: 'Free', blurb: 'One session a day, capped at 20 minutes — genuinely useful, not a trick.', price: '$0' },
  { id: 'pro', name: 'Pro', blurb: 'Unlimited sessions, all soundscapes, full insights history.', price: '$9.99', priceSub: '/mo · $79/yr', recommended: true },
  { id: 'studio', name: 'Studio', blurb: 'Custom multi-phase programs, data export, max audio fidelity.', price: '$19.99', priceSub: '/mo · $179/yr' },
]

function PricingBranch({ onFree, onPaid }: { onFree: () => void; onPaid: () => void }) {
  return (
    <div>
      <NodeTitle>Free to start, honest to scale</NodeTitle>
      <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.6', mt: '3', maxW: '40ch' })}>
        One genuinely useful free tier, two ways to go further. No fake discounts, no invented urgency.
      </p>
      <div className={stack({ gap: '3', mt: '6' })}>
        {LANDING_TIERS.map((tier) => (
          <div
            key={tier.id}
            className={flex({
              justify: 'space-between', align: 'center', gap: '4', wrap: 'wrap',
              p: tier.recommended ? '5' : '4', rounded: '2xl',
              bg: tier.recommended ? 'signalFaint' : 'transparent',
              border: tier.recommended ? '1px solid token(colors.signal)' : '1px solid token(colors.hairline)',
            })}
          >
            <div>
              <div className={hstack({ gap: '2' })}>
                <span className={css({ fontFamily: 'display', fontWeight: '600', fontSize: tier.recommended ? 'lg' : 'md' })}>{tier.name}</span>
                {tier.recommended && (
                  <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal', letterSpacing: '0.08em', textTransform: 'uppercase' })}>
                    Recommended
                  </span>
                )}
              </div>
              <p className={css({ color: 'muted', fontSize: 'xs', lineHeight: '1.45', mt: '1', maxW: '30ch' })}>{tier.blurb}</p>
            </div>
            <div className={flex({ align: 'center', gap: '3', flexShrink: '0' })}>
              <span className={`tabular ${css({ fontFamily: 'mono', fontSize: 'sm', color: 'text', whiteSpace: 'nowrap' })}`}>
                {tier.price}
                {tier.priceSub && <span className={css({ color: 'faint' })}>{tier.priceSub}</span>}
              </span>
              <GlassButton variant={tier.recommended ? 'primary' : 'pill'} size="sm" onClick={tier.id === 'free' ? onFree : onPaid}>
                {tier.id === 'free' ? 'Start free' : `Go ${tier.name}`}
              </GlassButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LegalBranch({ onOpen }: { onOpen: () => void }) {
  return (
    <div>
      <NodeTitle>Plain terms, real privacy</NodeTitle>
      <NodeBody>
        Camera frames process on-device and are never uploaded — only a derived heart-rate estimate is used. Full
        Terms of Service and Privacy Policy publish alongside billing; what's true today is documented now, not
        promised for later.
      </NodeBody>
      <div className={css({ mt: '5' })}>
        <GlassButton variant="pill" size="sm" onClick={onOpen}>Read Terms &amp; Privacy</GlassButton>
      </div>
    </div>
  )
}

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
  // New devices take one pass through onboarding (§2, §6.2) before landing in
  // the app; returning users (or storage that can't persist the flag) skip
  // straight there — non-fatal, never a hard gate.
  const launch = useCallback(
    () => void navigate(hasOnboarded() ? { to: '/app' } : { to: '/onboarding/$step', params: { step: 'goal' } }),
    [navigate],
  )
  const goPaywall = useCallback(() => void navigate({ to: '/app/paywall' }), [navigate])
  const goLegal = useCallback(() => void navigate({ to: '/legal' }), [navigate])

  const sections: BrainStemSection[] = useMemo(
    () => [
      {
        id: 'how-it-works',
        label: 'How it works',
        content: (
          <div>
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
            <div className={css({ textAlign: 'center', mt: '8' })}>
              <Kicker>Live demo</Kicker>
              <p className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'lg', mt: '2' })}>The ring, breathing</p>
              <div className={css({ mt: '6' })}><DemoRing /></div>
            </div>
          </div>
        ),
      },
      {
        id: 'science',
        label: 'The science',
        content: (
          <div>
            <NodeTitle>Established techniques, applied as a calm feedback loop</NodeTitle>
            <NodeBody>
              SmartSound stands on two well-studied ideas: remote photoplethysmography (reading pulse from a camera) and amplitude-modulation
              entrainment (a soundscape whose amplitude is gently modulated). It pairs them into a real-time loop that nudges you toward a chosen
              state. It is a wellness tool, not a medical device — it doesn’t diagnose or treat anything, and the heart-rate read is an estimate.
            </NodeBody>
          </div>
        ),
      },
      {
        id: 'pricing',
        label: 'Pricing',
        content: <PricingBranch onFree={launch} onPaid={goPaywall} />,
      },
      {
        id: 'faq',
        label: 'FAQ',
        content: (
          <div>
            <NodeTitle>Questions, answered honestly</NodeTitle>
            <div className={css({ mt: '6' })}>
              <FaqAccordion items={FAQS} />
            </div>
          </div>
        ),
      },
      {
        id: 'legal',
        label: 'Terms & Privacy',
        content: <LegalBranch onOpen={goLegal} />,
      },
      {
        id: 'launch',
        label: 'Launch',
        content: (
          <div className={stack({ gap: '6', align: 'center', textAlign: 'center' })}>
            <NodeTitle>Close the loop</NodeTitle>
            <NodeBody>Open the app, let it read your pulse, and hear the soundscape settle with you.</NodeBody>
            <GlassButton variant="primary" size="lg" onClick={launch}>Launch SmartSound</GlassButton>
          </div>
        ),
      },
    ],
    [launch, goPaywall, goLegal],
  )

  // no overflowX here — it would make overflowY compute to 'auto' (CSS spec), turning this
  // div into a scroll container distinct from the viewport and breaking descendant
  // position:sticky (the pinned brain mesh). Horizontal clipping is already global (body).
  return (
    <div className={css({ bg: 'bgBase', color: 'text' })}>
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

      {/* the brain-stem story — each section is a branch off the stem */}
      <BrainStemScroll sections={sections} />

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
