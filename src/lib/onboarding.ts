import type { TargetState } from '~/engine/audio/types'

/** Tiny cross-step store for the onboarding flow (§6.2). */
export const onboarding: { intent: TargetState } = { intent: 'focus' }
