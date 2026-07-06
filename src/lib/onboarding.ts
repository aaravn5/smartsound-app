import type { TargetState } from '~/engine/audio/types'

/**
 * Cross-step draft + persistence flag for the onboarding flow (§2, §6.2):
 * goal pick → calibration → consent → account → first session.
 *
 * `hasOnboarded`/`markOnboarded` are UX only — same honesty policy as
 * entitlements.ts: never a security boundary, and they FAIL OPEN (never hard
 * gate) if storage is unavailable (private mode, quota, SSR). A new user is
 * routed through onboarding once; a returning user (or one whose browser
 * can't persist the flag) goes straight to the app.
 */
export type AccountChoice = 'guest' | 'apple' | 'google'

export interface OnboardingDraft {
  goal: TargetState
  /** Self-reported "how wired do you feel right now", 0..1. */
  wired: number
  consented: boolean
  account: AccountChoice | null
}

export const onboarding: OnboardingDraft = {
  goal: 'focus',
  wired: 0.5,
  consented: false,
  account: null,
}

/**
 * The guided goal-capture flow: welcome → auth → goal → when → ready.
 * `auth` is the local-first account step (name + email in localStorage —
 * see lib/account.ts): the landing's listen gate routes straight to it with
 * a play intent, and the organic flow passes through it after the welcome.
 * Browsing is never gated — Skip still works on every step.
 */
export const ONBOARDING_STEPS = ['welcome', 'auth', 'goal', 'when', 'ready'] as const
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

export function isOnboardingStep(value: string): value is OnboardingStep {
  return (ONBOARDING_STEPS as readonly string[]).includes(value)
}

export function stepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step)
}

export function nextOnboardingStep(step: OnboardingStep): OnboardingStep | null {
  return ONBOARDING_STEPS[stepIndex(step) + 1] ?? null
}

export function previousOnboardingStep(step: OnboardingStep): OnboardingStep | null {
  return ONBOARDING_STEPS[stepIndex(step) - 1] ?? null
}

/** The "goal" step's four large choices — what the session should tune toward. */
export interface GoalOption {
  state: TargetState
  label: string
  blurb: string
}

export const GOAL_OPTIONS: GoalOption[] = [
  { state: 'focus', label: 'Focus', blurb: 'Steady beta rhythms for sustained, single-task work.' },
  { state: 'calm', label: 'Calm', blurb: 'Alpha-paced ease for a settled, unhurried mind.' },
  { state: 'sleep', label: 'Sleep', blurb: 'Delta modulation that resolves toward letting go.' },
  { state: 'winddown', label: 'Meditate', blurb: 'Slow theta pacing for stillness and presence.' },
]

/** The "when" step's self-report — how wired the user feels right now. */
export interface FeelOption {
  value: number
  label: string
}

export const FEEL_SCALE: FeelOption[] = [
  { value: 0.1, label: 'Drained' },
  { value: 0.3, label: 'Relaxed' },
  { value: 0.5, label: 'Steady' },
  { value: 0.7, label: 'Alert' },
  { value: 0.9, label: 'Wired' },
]

/** Nearest labeled point on `FEEL_SCALE` for a raw 0..1 value. */
export function feelLabel(value: number): string {
  let nearest = FEEL_SCALE[0]
  let best = Infinity
  for (const option of FEEL_SCALE) {
    const d = Math.abs(option.value - value)
    if (d < best) {
      best = d
      nearest = option
    }
  }
  return nearest.label
}

const FLAG_KEY = 'ss_onboarded'

/** True once this device has completed (or explicitly finished) onboarding. */
export function hasOnboarded(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(FLAG_KEY) === '1'
  } catch {
    return true
  }
}

export function markOnboarded(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FLAG_KEY, '1')
  } catch {
    // storage unavailable — non-fatal, onboarding just reappears next visit
  }
}
