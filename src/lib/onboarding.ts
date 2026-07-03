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
