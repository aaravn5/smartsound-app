import { createFileRoute } from '@tanstack/react-router'
import { GlassEmptyState, ScreenTitle } from '~/components/SereneScreen'

/** Profile — account, membership, and settings arrive in Milestone 4. */
export const Route = createFileRoute('/app/profile')({
  component: ProfileScreen,
})

const PersonIcon = () => (
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
    <circle cx="12" cy="8.4" r="3.4" />
    <path d="M4.8 20c1.4-4 4.1-6 7.2-6s5.8 2 7.2 6" />
  </svg>
)

function ProfileScreen() {
  return (
    <>
      <ScreenTitle caption="You" title="Profile" />
      <GlassEmptyState
        icon={<PersonIcon />}
        title="Make it yours"
        message="Your account, membership, and quiet preferences will live here — including full control of the on-device camera."
      />
    </>
  )
}
