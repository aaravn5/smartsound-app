import { createFileRoute } from '@tanstack/react-router'
import { SmartSoundScreen } from '~/components/SmartSoundScreen'

/** The app itself — a single full-bleed screen, outside the /app nav chrome (Part 5.A). */
export const Route = createFileRoute('/play')({
  component: SmartSoundScreen,
})
