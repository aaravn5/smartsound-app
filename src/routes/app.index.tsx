import { createFileRoute } from '@tanstack/react-router'
import { GlassEmptyState, ScreenTitle } from '~/components/SereneScreen'

/** Today — the Calm "Daily" home. Real daily content lands in Milestone 2. */
export const Route = createFileRoute('/app/')({
  component: TodayScreen,
})

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function todayCaption(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

const SessionIcon = () => (
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
    <path d="M4 12h2.4l2-5.2 3.2 10.4 2.4-7.4 1.6 2.2H20" />
  </svg>
)

function TodayScreen() {
  return (
    <>
      <ScreenTitle caption={todayCaption()} title={greeting()} />
      <GlassEmptyState
        icon={<SessionIcon />}
        title="Your day, tuned"
        message="A daily session shaped around how you feel will greet you here — soundscapes that listen, and settle with you."
      />
    </>
  )
}
