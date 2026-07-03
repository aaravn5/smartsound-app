import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate, useParams, Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { css } from 'styled-system/css'
import { stack, hstack, flex } from 'styled-system/patterns'
import { useEngine } from '~/lib/engine-context'
import { GlassButton } from '~/components/GlassButton'
import { Slider } from '~/components/ui/Slider'
import { PixelDissolve } from '~/design/PixelDissolve'
import { pixelNoise } from '~/design/pixel'
import { onboarding, markOnboarded } from '~/lib/onboarding'
import { TARGET_STATES } from '~/engine/audio/profiles'
import type { TargetState } from '~/engine/audio/types'
import { arousalLabel, pct } from '~/lib/format'

/**
 * Onboarding — goal pick → calibration → consent → account → first session
 * (§2, §6.2). GOAT-clean, pure-black, editorial: five short steps, a mono
 * step-dot progress indicator, Back/Next, and a pixel-dissolve between steps
 * (§1.3) so the material shows up here too, not just the session screen.
 */
export const Route = createFileRoute('/onboarding/$step')({
  component: Onboarding,
})

const STEPS = ['goal', 'calibrate', 'consent', 'account', 'ready'] as const
type Step = (typeof STEPS)[number]

const BLURB: Record<TargetState, string> = {
  focus: 'Sharp, sustained attention for deep work.',
  flow: 'Loose, absorbed momentum — creative or physical.',
  calm: 'Settled and unhurried — read, think, breathe.',
  winddown: 'Easing off before rest, tension releasing.',
  sleep: 'Wind down toward delta and let go.',
}

const ATTUNE_SECONDS = 20

function AppleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 170 170" fill="currentColor" aria-hidden>
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.361 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.42-3.702 18.45-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.102-2.96 15.667-8.86 22.669-7.12 8.324-15.732 13.134-25.071 12.375a25.222 25.222 0 0 1-.188-3.07c0-7.778 3.386-16.102 9.399-22.908 3.002-3.446 6.82-6.311 11.45-8.597 4.62-2.253 8.99-3.499 13.1-3.71.12 1.083.17 2.166.17 3.24z" />
    </svg>
  )
}

function GoogleMark() {
  return (
    <span
      aria-hidden
      className={css({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', w: '5', h: '5', rounded: 'full', bg: 'mist', flexShrink: '0' })}
    >
      <svg width="13" height="13" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.02l7.73 6c4.51-4.18 7.09-10.36 7.09-17.49z" />
        <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.87.92 7.53 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    </span>
  )
}

function Progress({ idx }: { idx: number }) {
  return (
    <div className={hstack({ gap: '2', justify: 'center' })} role="status" aria-label={`Step ${idx + 1} of ${STEPS.length}`}>
      {STEPS.map((s, i) => (
        <span
          key={s}
          aria-hidden
          className={css({ h: '1', rounded: 'full', transition: 'all token(durations.calm)', bg: i <= idx ? 'signal' : 'hairline' })}
          style={{ width: i === idx ? 28 : 14 }}
        />
      ))}
    </div>
  )
}

function StepHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className={stack({ gap: '2', textAlign: 'center' })}
    >
      <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal', letterSpacing: '0.16em', textTransform: 'uppercase' })}>
        {eyebrow}
      </span>
      <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: { base: '3xl', md: '4xl' }, letterSpacing: '-0.02em', lineHeight: '1.05' })}>
        {title}
      </h1>
      {lede && <p className={css({ color: 'muted', maxW: '32rem', mx: 'auto', lineHeight: '1.55' })}>{lede}</p>}
    </motion.div>
  )
}

function Onboarding() {
  const { step: rawStep } = useParams({ from: '/onboarding/$step' })
  const step = (STEPS as readonly string[]).includes(rawStep) ? (rawStep as Step) : 'goal'
  const idx = STEPS.indexOf(step)
  const navigate = useNavigate()
  const { reading, bioStatus, startAttune, stopAttune, captureBaseline } = useEngine()

  const [goal, setGoal] = useState<TargetState>(onboarding.goal)
  const [wired, setWired] = useState(onboarding.wired)
  const [connecting, setConnecting] = useState<'apple' | 'google' | null>(null)
  const [connectMsg, setConnectMsg] = useState(false)
  const connectTimer = useRef<number[]>([])

  const goStep = useCallback((s: Step) => navigate({ to: '/onboarding/$step', params: { step: s } }), [navigate])

  // Camera loop only runs while the calibrate step is on screen.
  useEffect(() => {
    if (step !== 'calibrate' && bioStatus === 'active') stopAttune()
  }, [step, bioStatus, stopAttune])

  useEffect(() => () => {
    connectTimer.current.forEach((id) => window.clearTimeout(id))
  }, [])

  const pickGoal = useCallback((s: TargetState) => {
    setGoal(s)
    onboarding.goal = s
    goStep('calibrate')
  }, [goStep])

  const attuned = bioStatus === 'active'
  const [attuneSecs, setAttuneSecs] = useState(ATTUNE_SECONDS)

  useEffect(() => {
    if (!attuned) { setAttuneSecs(ATTUNE_SECONDS); return }
    if (attuneSecs <= 0) { captureBaseline(); stopAttune(); return }
    const id = window.setTimeout(() => setAttuneSecs((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [attuned, attuneSecs, captureBaseline, stopAttune])

  const toggleAttune = useCallback(() => {
    if (attuned) stopAttune()
    else void startAttune()
  }, [attuned, startAttune, stopAttune])

  const confirmCalibration = useCallback(() => {
    onboarding.wired = wired
    goStep('consent')
  }, [wired, goStep])

  const setConsent = useCallback((accepted: boolean) => {
    onboarding.consented = accepted
    goStep('account')
  }, [goStep])

  const chooseProvider = useCallback((provider: 'apple' | 'google') => {
    setConnecting(provider)
    const t1 = window.setTimeout(() => setConnectMsg(true), 500)
    const t2 = window.setTimeout(() => {
      onboarding.account = 'guest'
      goStep('ready')
    }, 1500)
    connectTimer.current.push(t1, t2)
  }, [goStep])

  const chooseGuest = useCallback(() => {
    onboarding.account = 'guest'
    goStep('ready')
  }, [goStep])

  const begin = useCallback(async () => {
    markOnboarded()
    await navigate({ to: '/app/now', search: { state: onboarding.goal } })
  }, [navigate])

  const exploreInstead = useCallback(async () => {
    markOnboarded()
    await navigate({ to: '/app' })
  }, [navigate])

  return (
    <div className={css({ position: 'relative', minHeight: '100dvh', bg: 'bgBase', overflow: 'hidden' })}>
      <div aria-hidden className={css({ ...pixelNoise, position: 'fixed' })} />
      <div className={flex({ direction: 'column', minHeight: '100dvh', position: 'relative', zIndex: '1' })}>
        <header className={stack({ gap: '5', px: '5', pt: 'calc(20px + env(safe-area-inset-top))' })}>
          <div className={flex({ justify: 'space-between', align: 'center' })}>
            {idx > 0 && step !== 'ready' ? (
              <button
                onClick={() => goStep(STEPS[idx - 1])}
                aria-label="Back"
                className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', bg: 'transparent' })}
              >
                ← Back
              </button>
            ) : (
              <span className={css({ w: '10' })} />
            )}
            <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'faint', letterSpacing: '0.1em' })}>
              {idx + 1} / {STEPS.length}
            </span>
          </div>
          <Progress idx={idx} />
        </header>

        <main className={flex({ flex: '1', direction: 'column', align: 'center', justify: 'center', px: '5', py: '8' })}>
          <PixelDissolve key={step} duration={520} color="#000000" className={css({ width: 'full', maxW: '560px' })}>
            <div className={stack({ gap: '8', width: 'full' })}>
              {step === 'goal' && (
                <>
                  <StepHead eyebrow="Step one" title="What are you here for?" lede="Pick the state you want right now. You can change it any time in a session." />
                  <div className={stack({ gap: '3' })}>
                    {TARGET_STATES.map((s) => {
                      const selected = goal === s.key
                      return (
                        <GlassButton
                          key={s.key}
                          variant="pill"
                          selected={selected}
                          onClick={() => pickGoal(s.key as TargetState)}
                          aria-pressed={selected}
                          className={css({ width: 'full', justifyContent: 'flex-start', textAlign: 'left', px: '6', py: '5', rounded: '2xl' })}
                        >
                          <span className={stack({ gap: '0.5', align: 'flex-start', width: 'full' })}>
                            <span className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'lg' })}>{s.label}</span>
                            <span className={css({ fontFamily: 'body', fontSize: 'sm', opacity: '0.85' })}>{BLURB[s.key as TargetState]}</span>
                          </span>
                        </GlassButton>
                      )
                    })}
                  </div>
                </>
              )}

              {step === 'calibrate' && (
                <>
                  <StepHead eyebrow="Step two" title="A quick calibration" lede="One question, then an optional 20-second camera read — both skippable." />

                  <div className={stack({ gap: '3' })}>
                    <div className={flex({ justify: 'space-between' })}>
                      <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.08em', textTransform: 'uppercase' })}>
                        How wired do you feel right now?
                      </span>
                      <span className={`tabular ${css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal' })}`}>{arousalLabel(wired)}</span>
                    </div>
                    <Slider label="How wired do you feel right now?" value={wired} onValueChange={setWired} />
                    <div className={flex({ justify: 'space-between' })}>
                      <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'faint' })}>Wound down</span>
                      <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'faint' })}>Elevated</span>
                    </div>
                  </div>

                  <div className={stack({ gap: '3', p: '5', bg: 'panel', border: '1px solid token(colors.hairline)', rounded: '2xl' })}>
                    <div className={flex({ justify: 'space-between', align: 'center' })}>
                      <span className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'md' })}>Attune with camera</span>
                      <GlassButton variant={attuned ? 'pill' : 'ghost'} selected={attuned} size="sm" onClick={toggleAttune}
                        aria-label={attuned ? 'Stop camera attune' : 'Start camera attune'}>
                        {attuned ? `${attuneSecs}s` : 'Start'}
                      </GlassButton>
                    </div>
                    <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.5' })}>
                      Reads your pulse from the camera, on-device, for 20 seconds to set a resting baseline. Nothing is uploaded. Fully optional.
                    </p>
                    {attuned && (
                      <span className={`tabular ${css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal' })}`}>
                        {reading.active ? `${Math.round(reading.hr)} BPM · ${pct(reading.confidence)}% confidence` : 'Finding your pulse…'}
                      </span>
                    )}
                    {(bioStatus === 'denied' || bioStatus === 'nocamera' || bioStatus === 'error') && (
                      <span className={css({ color: 'state.elevated', fontSize: 'xs' })}>
                        {bioStatus === 'denied' ? 'Camera access declined — the slider above still works.' : 'No camera available — the slider above still works.'}
                      </span>
                    )}
                  </div>

                  <div className={flex({ justify: 'center' })}>
                    <GlassButton variant="primary" size="lg" onClick={confirmCalibration}>Continue</GlassButton>
                  </div>
                </>
              )}

              {step === 'consent' && (
                <>
                  <StepHead eyebrow="Step three" title="Your camera, your device" />
                  <div className={stack({ gap: '3', p: '6', bg: 'panel', border: '1px solid token(colors.hairline)', rounded: '2xl' })}>
                    <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.6' })}>
                      When you attune, SmartSound reads your pulse from your camera feed entirely on this device. Video frames are processed in memory and never leave your browser, never get uploaded, and are never stored.
                    </p>
                    <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.6' })}>
                      Session data — arousal readings, check-ins, minutes played — is used only to tune SmartSound to you. You can clear it any time from Settings.
                    </p>
                  </div>
                  <div className={stack({ gap: '3', align: 'center' })}>
                    <GlassButton variant="primary" size="lg" onClick={() => setConsent(true)}>Got it — continue</GlassButton>
                    <button
                      onClick={() => setConsent(false)}
                      className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', bg: 'transparent' })}
                    >
                      Skip
                    </button>
                  </div>
                </>
              )}

              {step === 'account' && (
                <>
                  <StepHead eyebrow="Step four" title="Save your progress" lede="Optional — you can always add an account later from Settings." />
                  <div className={stack({ gap: '3' })}>
                    <GlassButton
                      variant="ghost"
                      disabled={connecting !== null}
                      onClick={() => chooseProvider('apple')}
                      className={css({ width: 'full', color: 'text', px: '6', py: '4', rounded: '2xl', bg: 'black', border: '1px solid rgba(255,255,255,0.16)' })}
                    >
                      <span className={hstack({ gap: '2.5', justify: 'center', width: 'full' })}>
                        <AppleMark />
                        <span className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'sm' })}>
                          {connecting === 'apple' ? 'Connecting…' : 'Continue with Apple'}
                        </span>
                      </span>
                    </GlassButton>
                    <GlassButton
                      variant="ghost"
                      disabled={connecting !== null}
                      onClick={() => chooseProvider('google')}
                      className={css({ width: 'full', color: 'text', px: '6', py: '4', rounded: '2xl' })}
                    >
                      <span className={hstack({ gap: '2.5', justify: 'center', width: 'full' })}>
                        <GoogleMark />
                        <span className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'sm' })}>
                          {connecting === 'google' ? 'Connecting…' : 'Continue with Google'}
                        </span>
                      </span>
                    </GlassButton>
                  </div>

                  {connectMsg && (
                    <p role="status" className={css({ color: 'muted', fontSize: 'xs', textAlign: 'center', lineHeight: '1.5' })}>
                      Sign-in connects shortly — continuing as guest for now.
                    </p>
                  )}

                  <div className={flex({ justify: 'center' })}>
                    <button
                      onClick={chooseGuest}
                      disabled={connecting !== null}
                      className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', bg: 'transparent' })}
                    >
                      Continue as guest
                    </button>
                  </div>
                </>
              )}

              {step === 'ready' && (
                <>
                  <StepHead
                    eyebrow="You're set"
                    title={`Ready for ${TARGET_STATES.find((s) => s.key === goal)?.label ?? 'Focus'}`}
                    lede="SmartSound will tune to this the moment you begin. Every setting here can change inside a session."
                  />
                  <div className={stack({ gap: '4', align: 'center' })}>
                    <GlassButton variant="primary" size="lg" onClick={begin}>Begin your first session</GlassButton>
                    <button
                      onClick={exploreInstead}
                      className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', bg: 'transparent' })}
                    >
                      Or explore Discover first
                    </button>
                  </div>
                </>
              )}
            </div>
          </PixelDissolve>
        </main>

        {step === 'goal' && (
          <div className={flex({ justify: 'center', pb: '6' })}>
            <Link to="/" className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'faint', letterSpacing: '0.08em', textTransform: 'uppercase' })}>
              Back to SmartSound
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
