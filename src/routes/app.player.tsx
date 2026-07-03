import { createFileRoute } from '@tanstack/react-router'
import { GlassEmptyState, ScreenTitle } from '~/components/SereneScreen'
import type { TargetState } from '~/engine/audio/types'

const VALID_STATES: readonly TargetState[] = ['focus', 'flow', 'calm', 'winddown', 'sleep']

interface PlayerSearch {
  state?: TargetState
}

function isTargetState(value: unknown): value is TargetState {
  return typeof value === 'string' && (VALID_STATES as readonly string[]).includes(value)
}

/** Player — the immersive session screen, wired to the live loop in Milestone 3. */
export const Route = createFileRoute('/app/player')({
  validateSearch: (search: Record<string, unknown>): PlayerSearch => ({
    state: isTargetState(search.state) ? search.state : undefined,
  }),
  component: PlayerScreen,
})

const WaveIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 10.4v3.2M8 7.2v9.6M12 4.6v14.8M16 7.2v9.6M20 10.4v3.2" />
  </svg>
)

function PlayerScreen() {
  return (
    <>
      <ScreenTitle caption="Session" title="Player" />
      <GlassEmptyState
        icon={<WaveIcon />}
        title="Nothing playing yet"
        message="Begin a session from Today or Explore and it will unfold here — a living scene that breathes with your pulse."
      />
    </>
  )
}
