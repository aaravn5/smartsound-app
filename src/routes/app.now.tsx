import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { css } from 'styled-system/css'
import { SmartSoundScreen } from '~/components/SmartSoundScreen'
import { useEngine } from '~/lib/engine-context'
import type { TargetState } from '~/engine/audio/types'

/** Now — the closed-loop instrument (Milestone 2 tab). Deep-links via ?state=. */
const VALID_STATES: readonly TargetState[] = ['focus', 'flow', 'calm', 'winddown', 'sleep']

interface NowSearch {
  state?: TargetState
}

export const Route = createFileRoute('/app/now')({
  validateSearch: (search: Record<string, unknown>): NowSearch => {
    const s = search.state
    return typeof s === 'string' && (VALID_STATES as readonly string[]).includes(s) ? { state: s as TargetState } : {}
  },
  component: NowScreen,
})

function NowScreen() {
  const { state } = Route.useSearch()
  const { status, start, selectState } = useEngine()
  const appliedFor = useRef<TargetState | null>(null)

  useEffect(() => {
    if (!state || appliedFor.current === state) return
    appliedFor.current = state
    if (status === 'running') selectState(state)
    else void start(state)
  }, [state, status, start, selectState])

  return (
    <div className={css({ height: '100%' })}>
      <SmartSoundScreen />
    </div>
  )
}
