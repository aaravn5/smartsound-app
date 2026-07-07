import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { hasAccount } from '~/lib/account'
import type { TargetState } from '~/engine/audio/types'

/**
 * THE listen gate, shared by every record click inside /app — identical to
 * the landing's: listening requires the on-device account, browsing never
 * does. Signed out, a play intent routes through /onboarding/auth with the
 * intent preserved; signed in, it goes straight to the player. `minutes`
 * presets the player's session length (timed pressings, Wind-down · 15).
 */
export function useGatedPlay() {
  const navigate = useNavigate()
  return useCallback(
    (state: TargetState, minutes?: number) => {
      if (hasAccount()) {
        void navigate({ to: '/app/player', search: { state, minutes } })
      } else {
        void navigate({
          to: '/onboarding/$step',
          params: { step: 'auth' },
          search: { intent: 'play', state },
        })
      }
    },
    [navigate],
  )
}
