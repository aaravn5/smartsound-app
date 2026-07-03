import { createFileRoute } from '@tanstack/react-router'
import { GlassEmptyState, ScreenTitle } from '~/components/SereneScreen'

/** Explore — the Calm library. Scene cards over engine states land in Milestone 2. */
export const Route = createFileRoute('/app/explore')({
  component: ExploreScreen,
})

const LibraryIcon = () => (
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
    <rect x="3.4" y="3.4" width="7.4" height="7.4" rx="2.2" />
    <rect x="13.2" y="3.4" width="7.4" height="7.4" rx="2.2" />
    <rect x="3.4" y="13.2" width="7.4" height="7.4" rx="2.2" />
    <rect x="13.2" y="13.2" width="7.4" height="7.4" rx="2.2" />
  </svg>
)

function ExploreScreen() {
  return (
    <>
      <ScreenTitle caption="Library" title="Explore" />
      <GlassEmptyState
        icon={<LibraryIcon />}
        title="Soundscapes for every state"
        message="Focus, relax, sleep, meditate — a library of immersive scenes mapped to the engine is on its way."
      />
    </>
  )
}
