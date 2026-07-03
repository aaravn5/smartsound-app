import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { flex, stack, hstack } from 'styled-system/patterns'
import { SignalRing } from '~/design/SignalRing'
import {
  applySignal,
  arousalToLch,
  lchToCss,
  prefersReducedMotion,
} from '~/design/signal'

export const Route = createFileRoute('/')({
  component: Home,
})

const clamp = (n: number) => Math.min(1, Math.max(0, n))

function stateName(a: number): string {
  if (a < 0.25) return 'WIND-DOWN'
  if (a < 0.5) return 'SETTLED'
  if (a < 0.78) return 'FOCUS'
  return 'ELEVATED'
}

function Home() {
  const [arousal, setArousal] = useState(0.5)
  const [phase, setPhase] = useState<'idle' | 'attuning' | 'locked'>('idle')
  const raf = useRef(0)

  // The identity move: arousal → --signal, applied to the document so every
  // token that reads `signal` updates at once. One source of truth.
  useEffect(() => {
    applySignal(arousalToLch(arousal))
  }, [arousal])

  const color = lchToCss(arousalToLch(arousal))

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (phase === 'attuning') return
      const rect = e.currentTarget.getBoundingClientRect()
      const y = clamp((e.clientY - rect.top) / rect.height)
      setArousal(1 - y) // top of the ring = higher arousal
    },
    [phase],
  )

  const beginSession = useCallback(() => {
    if (prefersReducedMotion()) {
      setArousal(0.62)
      setPhase('locked')
      return
    }
    setPhase('attuning')
    const start = performance.now()
    const from = arousal
    const to = 0.62
    const dur = 1300
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setArousal(from + (to - from) * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else setPhase('locked')
    }
    raf.current = requestAnimationFrame(tick)
  }, [arousal])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return (
    <div className={css({ maxW: '1200px', mx: 'auto', px: { base: '5', md: '8' } })}>
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header
        className={flex({
          justify: 'space-between',
          align: 'center',
          py: '6',
        })}
      >
        <div className={hstack({ gap: '2.5' })}>
          <span
            aria-hidden
            className={css({
              w: '2.5',
              h: '2.5',
              rounded: 'full',
              bg: 'signal',
              boxShadow: '0 0 12px token(colors.signal)',
            })}
          />
          <span
            className={css({
              fontFamily: 'display',
              fontWeight: '600',
              fontSize: 'lg',
              letterSpacing: '-0.01em',
            })}
          >
            SmartSound
          </span>
        </div>
        <span
          className={css({
            fontFamily: 'mono',
            fontSize: '2xs',
            color: 'muted',
            letterSpacing: '0.08em',
            display: { base: 'none', sm: 'block' },
          })}
        >
          CLOSED-LOOP NEUROACOUSTICS
        </span>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: '1fr', lg: '1.05fr 0.95fr' },
          gap: { base: '10', lg: '6' },
          alignItems: 'center',
          pt: { base: '6', lg: '10' },
          pb: '16',
        })}
      >
        <div className={stack({ gap: '6', maxW: '34rem' })}>
          <p
            className={css({
              fontFamily: 'mono',
              fontSize: '2xs',
              color: 'signal',
              letterSpacing: '0.14em',
            })}
          >
            SENSE → STEER → LEARN
          </p>
          <h1
            className={css({
              fontFamily: 'display',
              fontWeight: '600',
              fontSize: { base: '4xl', md: '6xl' },
              lineHeight: '1.02',
              letterSpacing: '-0.02em',
              textWrap: 'balance',
            })}
          >
            The focus-audio engine that reads your body and{' '}
            <span className={css({ color: 'signal' })}>reshapes the sound</span> in
            real time.
          </h1>
          <p
            className={css({
              fontSize: { base: 'md', md: 'lg' },
              color: 'muted',
              lineHeight: '1.5',
              maxW: '30rem',
            })}
          >
            Using nothing but the camera you already have. SmartSound senses how
            settled you are, then steers a generative soundscape to move you into
            focus, calm, or sleep — and holds you there.
          </p>

          <div className={hstack({ gap: '3', flexWrap: 'wrap', mt: '1' })}>
            <Link
              to="/onboarding/$step"
              params={{ step: 'intent' }}
              className={css({
                fontFamily: 'display', fontWeight: '500', fontSize: 'sm',
                px: '5', py: '3', rounded: 'lg', color: 'bg', bg: 'signal',
                textDecoration: 'none',
                transition: 'filter token(durations.instant), transform token(durations.instant)',
                _hover: { filter: 'brightness(1.08)' },
                _active: { transform: 'translateY(1px)' },
              })}
            >
              Begin session
            </Link>
            <button
              type="button"
              onClick={beginSession}
              disabled={phase === 'attuning'}
              className={css({
                fontFamily: 'display', fontWeight: '500', fontSize: 'sm',
                px: '5', py: '3', rounded: 'lg', color: 'text',
                border: '1px solid token(colors.hairline)', cursor: 'pointer', bg: 'transparent',
                transition: 'border-color token(durations.instant)',
                _hover: { borderColor: 'signal' },
                _disabled: { opacity: 0.7, cursor: 'wait' },
              })}
            >
              {phase === 'attuning' ? 'Attuning…' : 'Preview calibration'}
            </button>
          </div>

          <p className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>
            Interactive preview — move across the ring to feel the color track your state.
          </p>
        </div>

        {/* The signature object. Its color IS the --signal token. */}
        <div className={flex({ justify: 'center' })} onPointerMove={onMove} style={{ touchAction: 'none' }}>
          <div className={css({ position: 'relative' })} style={{ width: 'min(440px, 80vw)', aspectRatio: '1' }}>
          <SignalRing arousal={arousal} color={color} />
          <div
            className={stack({
              gap: '0.5',
              align: 'center',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            })}
          >
            <span
              className={`tabular ${css({
                fontFamily: 'display',
                fontWeight: '600',
                fontSize: '2xl',
                color: 'signal',
                letterSpacing: '0.02em',
              })}`}
            >
              {stateName(arousal)}
            </span>
            <span
              className={css({
                fontFamily: 'mono',
                fontSize: '2xs',
                color: 'muted',
                letterSpacing: '0.1em',
              })}
            >
              {phase === 'attuning' ? 'finding your pulse' : 'generative preview'}
            </span>
          </div>
          </div>
        </div>
      </section>

      {/* ── The wedge: sense → steer → learn (§3) ────────────────── */}
      <section id="how" className={css({ py: '16', scrollMarginTop: '6' })}>
        <div className={stack({ gap: '10' })}>
          {WEDGE.map((w, i) => (
            <div
              key={w.title}
              className={css({
                display: 'grid',
                gridTemplateColumns: { base: '1fr', md: 'auto 1fr' },
                gap: { base: '3', md: '8' },
                alignItems: 'baseline',
                borderTop: '1px solid token(colors.hairline)',
                pt: '6',
              })}
            >
              <span
                className={`tabular ${css({
                  fontFamily: 'mono',
                  fontSize: 'sm',
                  color: 'signal',
                })}`}
              >
                {String(i + 1).padStart(2, '0')} / {w.tag}
              </span>
              <div className={stack({ gap: '2', maxW: '46rem' })}>
                <h2
                  className={css({
                    fontFamily: 'display',
                    fontWeight: '600',
                    fontSize: { base: '2xl', md: '3xl' },
                    letterSpacing: '-0.01em',
                  })}
                >
                  {w.title}
                </h2>
                <p className={css({ color: 'muted', fontSize: 'md', lineHeight: '1.55' })}>
                  {w.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Honest numbers + science framing (§2, §11) ───────────── */}
      <section
        className={css({
          py: '14',
          borderTop: '1px solid token(colors.hairline)',
          display: 'grid',
          gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
          gap: '10',
        })}
      >
        <div className={stack({ gap: '3' })}>
          <p className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.1em' })}>
            WHERE WE ARE
          </p>
          <p
            className={`tabular ${css({
              fontFamily: 'display',
              fontWeight: '600',
              fontSize: '5xl',
              letterSpacing: '-0.02em',
            })}`}
          >
            160+
          </p>
          <p className={css({ color: 'muted', fontSize: 'md' })}>
            people have run real sessions. One pitch, one win. No fabricated
            testimonials, no "trusted by thousands" — just where the work
            actually stands.
          </p>
        </div>
        <div className={stack({ gap: '3' })}>
          <p className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.1em' })}>
            THE HONEST SCIENCE
          </p>
          <p className={css({ color: 'text', fontSize: 'md', lineHeight: '1.55' })}>
            SmartSound uses rhythmic amplitude modulation designed to support
            focus — not binaural beats, and no headphones required. Effects are
            individual and work best as part of a broader focus practice.
            SmartSound is a wellness tool, not a medical device.
          </p>
        </div>
      </section>

      <footer
        className={flex({
          justify: 'space-between',
          align: 'center',
          py: '8',
          borderTop: '1px solid token(colors.hairline)',
          color: 'muted',
          fontFamily: 'mono',
          fontSize: '2xs',
        })}
      >
        <span>SmartSound © 2026</span>
        <span>Video never leaves your device.</span>
      </footer>
    </div>
  )
}

const WEDGE = [
  {
    tag: 'SENSE',
    title: 'Your camera reads how settled you are.',
    body: 'A local-only signal pulled from subtle skin-color changes in your front camera gives a live read on your pulse and steadiness. No wearable, no watch, no frame ever sent anywhere. This is the requirement every competitor still gates behind hardware.',
  },
  {
    tag: 'STEER',
    title: 'The sound moves you toward your target — then holds.',
    body: 'Set a state; SmartSound measures where you are against your own baseline and continuously reshapes tempo, layer density, brightness, and modulation depth to close the gap. A real control loop, not a manual slider — with a manual override that always wins.',
  },
  {
    tag: 'LEARN',
    title: 'It calibrates to your body, not an average.',
    body: 'Lightweight check-ins ground-truth the model to you, so "focus" comes to mean your focus — learning your personal arousal-to-performance curve instead of assuming a population average.',
  },
]
