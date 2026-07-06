import { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import * as Slider from '@radix-ui/react-slider'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { Scene, type SceneVariant } from '~/design/Scene'
import { STATE_SCENE } from '~/components/SessionCard'
import { useClickSound } from '~/lib/click-sound'
import { createAccount, hasAccount, isValidEmail, readAccount } from '~/lib/account'
import type { TargetState } from '~/engine/audio/types'
import {
  FEEL_SCALE,
  GOAL_OPTIONS,
  ONBOARDING_STEPS,
  feelLabel,
  hasOnboarded,
  isOnboardingStep,
  markOnboarded,
  onboarding,
  previousOnboardingStep,
  stepIndex,
  type OnboardingStep,
} from '~/lib/onboarding'

/**
 * Onboarding — the guided flow: welcome → auth → goal → when → ready, over
 * an immersive `Scene`. The AUTH step is the landing's listen gate target:
 * arriving with `?intent=play&state=X`, a created account routes straight
 * into the intended player state. Nothing else is a hard gate — Skip still
 * works everywhere, and browsing `/app` never requires an account.
 */

const VALID_STATES: readonly TargetState[] = ['focus', 'flow', 'calm', 'winddown', 'sleep']

interface OnboardingSearch {
  /** The gated action that sent the visitor here — only 'play' exists. */
  intent?: 'play'
  /** The engine state the intent should resume with. */
  state?: TargetState
}

export const Route = createFileRoute('/onboarding/$step')({
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
    intent: search.intent === 'play' ? 'play' : undefined,
    state:
      typeof search.state === 'string' && (VALID_STATES as readonly string[]).includes(search.state)
        ? (search.state as TargetState)
        : undefined,
  }),
  beforeLoad: ({ params, search }) => {
    if (!isOnboardingStep(params.step)) {
      throw redirect({ to: '/onboarding/$step', params: { step: 'welcome' }, search })
    }
    // Signed-in visitors don't need the flow: an intent goes straight to the
    // player; otherwise a finished device bounces to the app. An onboarded
    // visitor WITHOUT an account must still reach the auth step (the gate).
    if (hasAccount()) {
      if (search.intent === 'play') {
        throw redirect({ to: '/app/player', search: { state: search.state } })
      }
      if (hasOnboarded()) throw redirect({ to: '/app' })
    }
  },
  component: OnboardingScreen,
})

const enter = { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const }

function sceneFor(step: OnboardingStep): SceneVariant {
  if (step === 'auth') return 'dawn'
  if (step === 'goal') return 'aurora'
  if (step === 'when') return 'ocean'
  if (step === 'ready') return STATE_SCENE[onboarding.goal]
  return 'dusk'
}

// ── icons — SF-symbol-flavored strokes, matching the shell's icon language ──

const iconAttrs = {
  width: 26,
  height: 26,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)

/** scope — sustained attention. */
const FocusIcon = () => (
  <svg {...iconAttrs}>
    <circle cx="12" cy="12" r="8.4" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </svg>
)
/** ripples — settled ease. */
const CalmIcon = () => (
  <svg {...iconAttrs}>
    <path d="M3.5 9.5c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 5-1" />
    <path d="M3.5 15c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 5-1" />
  </svg>
)
/** crescent — letting go. */
const SleepIcon = () => (
  <svg {...iconAttrs}>
    <path d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2z" />
  </svg>
)
/** seated stillness — presence. */
const MeditateIcon = () => (
  <svg {...iconAttrs}>
    <circle cx="12" cy="7.4" r="2.6" />
    <path d="M4.5 18.5c1.6-3.4 4.2-5 7.5-5s5.9 1.6 7.5 5" />
    <path d="M3.2 15.8c2.6-.7 4.6.3 5.8 2M20.8 15.8c-2.6-.7-4.6.3-5.8 2" />
  </svg>
)

const GOAL_ICON: Record<TargetState, () => JSX.Element> = {
  focus: FocusIcon,
  flow: FocusIcon,
  calm: CalmIcon,
  winddown: MeditateIcon,
  sleep: SleepIcon,
}

// ── shared layout bits ──

const caption = css({
  m: '0',
  fontSize: 'footnote',
  fontWeight: '600',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'faint',
})

const title = css({
  m: '0',
  mt: '2',
  fontFamily: 'display',
  fontSize: 'clamp(1.9rem, 7vw, 2.6rem)',
  fontWeight: '700',
  letterSpacing: '-0.015em',
  lineHeight: '1.12',
  color: 'text',
  textAlign: 'center',
})

const subtitle = css({
  m: '0',
  mt: '3',
  maxW: '36ch',
  fontSize: 'body',
  lineHeight: '1.6',
  color: 'muted',
  textAlign: 'center',
})

function StepDots({ current }: { current: OnboardingStep }) {
  const idx = stepIndex(current)
  return (
    <div className={css({ display: 'flex', alignItems: 'center', gap: '1.5' })} aria-hidden>
      {ONBOARDING_STEPS.map((s, i) => (
        <span
          key={s}
          className={css({
            display: 'block',
            height: '6px',
            borderRadius: 'capsule',
            bg: i <= idx ? 'accent' : 'rgba(255,255,255,0.22)',
            transition:
              'width token(durations.gentle) token(easings.calm), background-color token(durations.gentle) ease',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          })}
          style={{ width: i === idx ? '20px' : '6px' }}
        />
      ))}
    </div>
  )
}

function PrimaryButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  const playClick = useClickSound()
  return (
    <LiquidGlass
      as="button"
      variant="control"
      tint="rgba(139, 108, 246, 0.6)"
      onClick={() => {
        playClick('primary')
        onClick()
      }}
      className={css({
        display: 'block',
        w: 'full',
        minH: '54px',
        border: 'none',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'rgba(196, 181, 253, 0.38)',
        color: 'text',
        font: 'inherit',
      })}
    >
      <span
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '54px',
          fontSize: 'headline',
          fontWeight: '600',
          letterSpacing: '0.01em',
        })}
      >
        {label}
      </span>
    </LiquidGlass>
  )
}

function OnboardingScreen() {
  const rawStep = Route.useParams().step
  const current: OnboardingStep = isOnboardingStep(rawStep) ? rawStep : 'welcome'
  const search = Route.useSearch()
  const navigate = useNavigate()
  const reduce = useReducedMotion()

  const reveal = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { ...enter, delay },
        }

  const goStep = (step: OnboardingStep) =>
    void navigate({ to: '/onboarding/$step', params: { step }, search })

  const finish = (to: 'app' | 'player' | 'home') => {
    markOnboarded()
    if (to === 'player') {
      void navigate({ to: '/app/player', search: { state: onboarding.goal } })
    } else if (to === 'home') {
      // The flow ends back on the landing, which now greets by name.
      void navigate({ to: '/' })
    } else {
      void navigate({ to: '/app' })
    }
  }

  const prevStep = previousOnboardingStep(current)

  return (
    <div
      className={css({
        position: 'relative',
        minHeight: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        color: 'text',
        bg: 'bgDeep',
      })}
    >
      <Scene variant={sceneFor(current)} />

      <header
        className={css({
          position: 'relative',
          zIndex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '5',
          pt: 'calc(env(safe-area-inset-top) + 20px)',
          pb: '2',
        })}
      >
        <div className={css({ width: '40px' })}>
          {prevStep && (
            <LiquidGlass
              as="button"
              variant="control"
              aria-label="Back"
              onClick={() => goStep(prevStep)}
              className={css({
                w: '40px',
                h: '40px',
                border: 'none',
                display: 'grid',
                placeItems: 'center',
                color: 'text',
              })}
            >
              <BackIcon />
            </LiquidGlass>
          )}
        </div>
        <StepDots current={current} />
        <div className={css({ width: '40px', display: 'flex', justifyContent: 'flex-end' })}>
          {current !== 'ready' && (
            <button
              type="button"
              onClick={() => finish('app')}
              className={css({
                appearance: 'none',
                border: 'none',
                bg: 'transparent',
                color: 'faint',
                fontSize: 'footnote',
                fontWeight: '600',
                cursor: 'pointer',
                px: '1',
                py: '2',
                WebkitTapHighlightColor: 'transparent',
              })}
            >
              Skip
            </button>
          )}
        </div>
      </header>

      <main
        className={css({
          position: 'relative',
          zIndex: '1',
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          px: '6',
          py: '5',
        })}
      >
        <div className={css({ w: 'full', maxW: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center' })}>
          {current === 'welcome' && <WelcomeStep reveal={reveal} />}
          {current === 'auth' && (
            <AuthStep
              reveal={reveal}
              intentState={search.intent === 'play' ? (search.state ?? onboarding.goal) : null}
              onDone={(destination) => {
                if (destination === 'player') {
                  markOnboarded()
                  void navigate({
                    to: '/app/player',
                    search: { state: search.state ?? onboarding.goal },
                  })
                } else if (destination === 'home') {
                  void navigate({ to: '/' })
                } else {
                  goStep('goal')
                }
              }}
            />
          )}
          {current === 'goal' && <GoalStep reveal={reveal} />}
          {current === 'when' && <WhenStep reveal={reveal} />}
          {current === 'ready' && <ReadyStep reveal={reveal} />}
        </div>
      </main>

      <footer
        className={css({
          position: 'relative',
          zIndex: '1',
          px: '6',
          pb: 'calc(env(safe-area-inset-bottom) + 28px)',
          pt: '2',
        })}
      >
        <div className={css({ w: 'full', maxW: '520px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: '3' })}>
          {current === 'welcome' && <PrimaryButton label="Continue" onClick={() => goStep('auth')} />}
          {current === 'goal' && <PrimaryButton label="Continue" onClick={() => goStep('when')} />}
          {current === 'when' && <PrimaryButton label="Continue" onClick={() => goStep('ready')} />}
          {current === 'ready' && (
            <>
              <PrimaryButton label="Finish" onClick={() => finish('home')} />
              <button
                type="button"
                onClick={() => finish('app')}
                className={css({
                  appearance: 'none',
                  border: 'none',
                  bg: 'transparent',
                  color: 'faint',
                  fontSize: 'footnote',
                  fontWeight: '500',
                  cursor: 'pointer',
                  py: '1',
                  WebkitTapHighlightColor: 'transparent',
                })}
              >
                Take me to the library instead
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}

// ── steps ──

type Reveal = (delay: number) => Record<string, unknown>

function WelcomeStep({ reveal }: { reveal: Reveal }) {
  return (
    <>
      <motion.p {...reveal(0.05)} className={caption}>
        Before we begin
      </motion.p>
      <motion.h1 {...reveal(0.18)} className={title}>
        A couple of quiet
        <br />
        questions, first
      </motion.h1>
      <motion.p {...reveal(0.34)} className={subtitle}>
        What you want more of, and how you're feeling right now — so your first session opens
        already tuned to you.
      </motion.p>
    </>
  )
}

// ── auth — the local-first account step ─────────────────────────────────────

const fieldLabelCss = css({
  display: 'block',
  mb: '1.5',
  fontSize: 'footnote',
  fontWeight: '600',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'faint',
  textAlign: 'left',
})

const fieldInputCss = css({
  display: 'block',
  w: 'full',
  h: '50px',
  px: '3.5',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 'control',
  background: 'rgba(255,255,255,0.07)',
  font: 'inherit',
  fontSize: 'body',
  color: 'text',
  outline: 'none',
  transition: 'border-color token(durations.quick) ease, background token(durations.quick) ease',
  _focus: { borderColor: 'accent', background: 'rgba(255,255,255,0.1)' },
  _placeholder: { color: 'ghost' },
})

const oauthBtnCss = css({
  flex: '1',
  border: 'none',
  font: 'inherit',
  color: 'text',
  cursor: 'pointer',
})

const errorCss = css({
  m: '0',
  mt: '1.5',
  fontSize: 'caption',
  fontWeight: '500',
  color: '#FCA5A5',
  textAlign: 'left',
})

function AuthStep({
  reveal,
  intentState,
  onDone,
}: {
  reveal: Reveal
  /** Non-null when a gated play sent the visitor here — names the mode. */
  intentState: TargetState | null
  onDone: (destination: 'player' | 'home' | 'next') => void
}) {
  const playClick = useClickSound()
  const existing = readAccount()
  const [name, setName] = useState(existing?.name ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [sheet, setSheet] = useState<'google' | 'apple' | null>(null)

  const intentTitle = intentState
    ? GOAL_OPTIONS.find((g) => g.state === intentState)?.label ??
      intentState.charAt(0).toUpperCase() + intentState.slice(1)
    : null

  const destination = (): 'player' | 'home' | 'next' => {
    if (intentState) return 'player'
    if (hasOnboarded()) return 'home'
    return 'next'
  }

  const submit = () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const nameOk = trimmedName.length >= 2
    const emailOk = isValidEmail(trimmedEmail)
    setNameError(nameOk ? null : 'Tell us what to call you (2+ characters).')
    setEmailError(emailOk ? null : 'That doesn’t look like an email address.')
    if (!nameOk || !emailOk) return
    playClick('primary')
    createAccount(trimmedName, trimmedEmail)
    onDone(destination())
  }

  if (existing) {
    // Already signed in (e.g. back navigation) — nothing to create.
    return (
      <>
        <motion.p {...reveal(0.02)} className={caption}>
          Your account
        </motion.p>
        <motion.h1 {...reveal(0.1)} className={title}>
          You’re signed in,
          <br />
          {existing.name}
        </motion.h1>
        <motion.p {...reveal(0.2)} className={subtitle}>
          Your account lives on this device. Continue whenever you’re ready.
        </motion.p>
        <motion.div {...reveal(0.3)} className={css({ w: 'full', mt: '7' })}>
          <PrimaryButton label="Continue" onClick={() => onDone(destination())} />
        </motion.div>
      </>
    )
  }

  return (
    <>
      <motion.p {...reveal(0.02)} className={caption}>
        Your account
      </motion.p>
      <motion.h1 {...reveal(0.1)} className={title}>
        Create your
        <br />
        account
      </motion.h1>
      <motion.p {...reveal(0.2)} className={subtitle}>
        {intentTitle
          ? `One quick step before your first ${intentTitle} session — listening is tied to an account.`
          : 'A name and an email — stored on this device, nowhere else.'}
      </motion.p>

      <motion.div {...reveal(0.3)} className={css({ w: 'full', mt: '7' })}>
        <LiquidGlass variant="card" staticSheen>
          <form
            className={css({ px: '5', py: '5', display: 'flex', flexDirection: 'column', gap: '4' })}
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <div>
              <label htmlFor="ss-auth-name" className={fieldLabelCss}>
                Name
              </label>
              <input
                id="ss-auth-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
                className={fieldInputCss}
                aria-invalid={nameError != null}
              />
              {nameError && <p className={errorCss}>{nameError}</p>}
            </div>
            <div>
              <label htmlFor="ss-auth-email" className={fieldLabelCss}>
                Email
              </label>
              <input
                id="ss-auth-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={fieldInputCss}
                aria-invalid={emailError != null}
              />
              {emailError && <p className={errorCss}>{emailError}</p>}
            </div>
            <button type="submit" className={css({ display: 'none' })} aria-hidden tabIndex={-1} />
          </form>
        </LiquidGlass>

        <div className={css({ display: 'flex', gap: '3', mt: '4' })}>
          {(['google', 'apple'] as const).map((provider) => (
            <LiquidGlass
              key={provider}
              as="button"
              variant="control"
              staticSheen
              onClick={() => {
                playClick('tap')
                setSheet(provider)
              }}
              className={oauthBtnCss}
            >
              <span className={css({ display: 'flex', alignItems: 'center', justifyContent: 'center', h: '48px', px: '3', fontSize: 'subhead', fontWeight: '600' })}>
                {provider === 'google' ? 'Continue with Google' : 'Continue with Apple'}
              </span>
            </LiquidGlass>
          ))}
        </div>

        <div className={css({ mt: '5' })}>
          <PrimaryButton label={intentTitle ? `Create account & play ${intentTitle}` : 'Continue'} onClick={submit} />
        </div>

        <p className={css({ m: '0', mt: '3.5', fontSize: 'caption', lineHeight: '1.5', color: 'faint', textAlign: 'center' })}>
          By continuing you agree to our{' '}
          <Link to="/terms" className={css({ color: 'muted', textDecoration: 'underline' })}>
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className={css({ color: 'muted', textDecoration: 'underline' })}>
            Privacy Policy
          </Link>
          . Your account lives on this device — there’s no server yet.
        </p>
      </motion.div>

      {/* Honest provider sheet — no fake OAuth redirect, ever. */}
      {sheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={sheet === 'google' ? 'Google sign-in' : 'Apple sign-in'}
          className={css({ position: 'fixed', inset: '0', zIndex: '50', display: 'flex', alignItems: 'center', justifyContent: 'center', p: '5' })}
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setSheet(null)}
            className={css({ position: 'absolute', inset: '0', border: 'none', background: 'rgba(3, 6, 16, 0.6)', cursor: 'pointer' })}
          />
          <LiquidGlass variant="sheet" className={css({ position: 'relative', w: 'full', maxW: '380px' })}>
            <div className={css({ px: '6', py: '6', textAlign: 'center' })}>
              <p className={css({ m: '0', fontSize: 'title3', fontWeight: '700', color: 'text' })}>
                {sheet === 'google' ? 'Google sign-in' : 'Apple sign-in'}
              </p>
              <p className={css({ m: '0', mt: '3', fontSize: 'subhead', lineHeight: '1.55', color: 'muted' })}>
                {sheet === 'google' ? 'Google' : 'Apple'} sign-in connects when accounts sync ships —
                your account lives on this device for now.
              </p>
              <div className={css({ mt: '5' })}>
                <PrimaryButton
                  label="Continue with email"
                  onClick={() => setSheet(null)}
                />
              </div>
            </div>
          </LiquidGlass>
        </div>
      )}
    </>
  )
}

function GoalStep({ reveal }: { reveal: Reveal }) {
  const [selected, setSelected] = useState<TargetState>(onboarding.goal)

  const choose = (state: TargetState) => {
    setSelected(state)
    onboarding.goal = state
  }

  return (
    <>
      <motion.p {...reveal(0.02)} className={caption}>
        Your goal
      </motion.p>
      <motion.h1 {...reveal(0.1)} className={title}>
        What do you want
        <br />
        more of?
      </motion.h1>
      <motion.p {...reveal(0.2)} className={subtitle}>
        We'll tune your first session around it.
      </motion.p>

      <motion.div
        {...reveal(0.32)}
        className={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '3',
          w: 'full',
          mt: '7',
        })}
        role="radiogroup"
        aria-label="What do you want more of?"
      >
        {GOAL_OPTIONS.map((option) => {
          const Icon = GOAL_ICON[option.state]
          const isSelected = selected === option.state
          return (
            <LiquidGlass
              key={option.state}
              as="button"
              variant="card"
              role="radio"
              aria-checked={isSelected}
              tint={isSelected ? 'rgba(167, 139, 250, 0.5)' : undefined}
              onClick={() => choose(option.state)}
              staticSheen
              className={cx(
                css({
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition:
                    'transform var(--spring-smooth-duration) var(--spring-smooth), border-color token(durations.gentle) ease',
                  _active: { transform: 'scale(0.975)' },
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                    _active: { transform: 'none' },
                  },
                }),
              )}
              style={{
                borderColor: isSelected ? 'rgba(196, 181, 253, 0.55)' : undefined,
              }}
            >
              <div className={css({ position: 'relative', px: '4', py: '4', minH: '148px', display: 'flex', flexDirection: 'column' })}>
                {isSelected && (
                  <span
                    aria-hidden
                    className={css({
                      position: 'absolute',
                      top: '3',
                      right: '3',
                      width: '20px',
                      height: '20px',
                      borderRadius: 'full',
                      bg: 'accent',
                      color: 'bgDeep',
                      display: 'grid',
                      placeItems: 'center',
                    })}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                )}
                <span className={css({ color: 'accent', mb: '3' })}>
                  <Icon />
                </span>
                <span
                  className={css({
                    fontSize: 'headline',
                    fontWeight: '700',
                    letterSpacing: '-0.01em',
                    color: 'text',
                    mb: '1',
                  })}
                >
                  {option.label}
                </span>
                <span className={css({ fontSize: 'caption', lineHeight: '1.4', color: 'faint' })}>
                  {option.blurb}
                </span>
              </div>
            </LiquidGlass>
          )
        })}
      </motion.div>
    </>
  )
}

function WhenStep({ reveal }: { reveal: Reveal }) {
  const [wired, setWired] = useState(onboarding.wired)

  return (
    <>
      <motion.p {...reveal(0.02)} className={caption}>
        Right now
      </motion.p>
      <motion.h1 {...reveal(0.1)} className={title}>
        How do you feel
        <br />
        in this moment?
      </motion.h1>
      <motion.p {...reveal(0.2)} className={subtitle}>
        This helps us meet you where you are.
      </motion.p>

      <motion.div {...reveal(0.32)} className={css({ w: 'full', mt: '8' })}>
        <LiquidGlass variant="card">
          <div className={css({ px: '5', py: '6' })}>
            <p
              className={css({
                m: '0',
                mb: '5',
                textAlign: 'center',
                fontSize: 'title2',
                fontWeight: '700',
                letterSpacing: '-0.01em',
                color: 'text',
              })}
            >
              {feelLabel(wired)}
            </p>
            <Slider.Root
              className={css({
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                w: 'full',
                h: '44px',
                touchAction: 'none',
              })}
              min={0}
              max={1}
              step={0.01}
              value={[wired]}
              onValueChange={(v) => {
                const next = v[0] ?? wired
                setWired(next)
                onboarding.wired = next
              }}
            >
              <Slider.Track
                className={css({
                  position: 'relative',
                  flex: '1',
                  h: '5px',
                  borderRadius: 'capsule',
                  bg: 'rgba(255,255,255,0.14)',
                })}
              >
                <Slider.Range
                  className={css({ position: 'absolute', h: 'full', borderRadius: 'capsule' })}
                  style={{ background: 'var(--scene-accent, var(--signal))' }}
                />
              </Slider.Track>
              <Slider.Thumb
                aria-label="How wired do you feel right now"
                className={css({
                  display: 'block',
                  w: '28px',
                  h: '28px',
                  borderRadius: 'full',
                  bg: 'white',
                  boxShadow: '0 2px 8px rgba(3,6,18,0.4)',
                  cursor: 'pointer',
                  transition: 'transform var(--spring-smooth-duration) var(--spring-smooth)',
                  _active: { transform: 'scale(1.15)' },
                  _focusVisible: { outline: '2px solid token(colors.accent)', outlineOffset: '2px' },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                })}
              />
            </Slider.Root>
            <div className={css({ display: 'flex', justifyContent: 'space-between', mt: '3' })}>
              <span className={css({ fontSize: 'caption', color: 'ghost' })}>
                {FEEL_SCALE[0].label}
              </span>
              <span className={css({ fontSize: 'caption', color: 'ghost' })}>
                {FEEL_SCALE[FEEL_SCALE.length - 1].label}
              </span>
            </div>
          </div>
        </LiquidGlass>
      </motion.div>
    </>
  )
}

function ReadyStep({ reveal }: { reveal: Reveal }) {
  const goal = GOAL_OPTIONS.find((g) => g.state === onboarding.goal) ?? GOAL_OPTIONS[0]
  const Icon = GOAL_ICON[goal.state]
  const reduce = useReducedMotion()

  const badgeReveal = reduce
    ? {}
    : {
        initial: { opacity: 0, scale: 0.7 },
        animate: { opacity: 1, scale: 1 },
        transition: { type: 'spring' as const, stiffness: 210, damping: 20, delay: 0.05 },
      }

  return (
    <>
      <motion.div
        {...badgeReveal}
        className={css({
          display: 'grid',
          placeItems: 'center',
          width: '96px',
          height: '96px',
          borderRadius: 'full',
          mb: '6',
        })}
      >
        <LiquidGlass
          variant="control"
          tint="rgba(167, 139, 250, 0.55)"
          className={css({ width: '96px', height: '96px', borderRadius: 'full', display: 'grid', placeItems: 'center', color: 'accent' })}
        >
          <Icon />
        </LiquidGlass>
      </motion.div>
      <motion.p {...reveal(0.2)} className={caption}>
        You're set
      </motion.p>
      <motion.h1 {...reveal(0.3)} className={title}>
        Ready when
        <br />
        you are
      </motion.h1>
      <motion.p {...reveal(0.42)} className={subtitle}>
        Your first press is {goal.label} — tuned for feeling{' '}
        {feelLabel(onboarding.wired).toLowerCase()} right now. Find it on the shelf whenever
        you&rsquo;re ready.
      </motion.p>
    </>
  )
}
