import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '~/landing/LandingPage'

/** The marketing landing page (Part 5.B). Launches into /play. */
export const Route = createFileRoute('/')({
  component: LandingPage,
})
