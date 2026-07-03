import { createFileRoute } from '@tanstack/react-router'
import { GlassEmptyState, ScreenTitle } from '~/components/SereneScreen'

/** Player — the immersive session screen, wired to the live loop in Milestone 3. */
export const Route = createFileRoute('/app/player')({
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
