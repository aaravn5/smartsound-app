import type { TargetState } from '~/engine/audio/types'

/**
 * Circadian/ultradian awareness (§7.5). Time of day biases the *suggested*
 * target; the loop still does the steering. Ultradian ~90–110 min cycles inform
 * suggested block length. This never overrides the user — it's a nudge.
 */
export interface CircadianSuggestion {
  state: TargetState
  label: string
  reason: string
}

export function suggestFor(date: Date): CircadianSuggestion {
  const h = date.getHours()
  if (h >= 22 || h < 5) return { state: 'sleep', label: 'Sleep', reason: 'late night' }
  if (h >= 20) return { state: 'winddown', label: 'Wind-down', reason: 'evening' }
  if (h >= 15 && h < 17) return { state: 'flow', label: 'Flow', reason: 'afternoon dip' }
  if (h >= 9 && h < 12) return { state: 'focus', label: 'Focus', reason: 'morning peak' }
  if (h >= 5 && h < 9) return { state: 'calm', label: 'Calm', reason: 'early morning' }
  return { state: 'focus', label: 'Focus', reason: 'daytime' }
}

/** Ultradian-informed block length in minutes for a given target. */
export function suggestedBlockMinutes(state: TargetState): number {
  switch (state) {
    case 'sleep': return 30
    case 'winddown': return 15
    case 'calm': return 20
    default: return 50 // a full ultradian work block
  }
}
