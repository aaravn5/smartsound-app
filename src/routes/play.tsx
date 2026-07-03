import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { SmartSoundScreen } from '~/components/SmartSoundScreen'

/** The original single full-bleed screen, kept outside the /app nav chrome for direct access (Part 5.A). */
export const Route = createFileRoute('/play')({
  component: () => (
    <div className={css({ height: '100dvh' })}>
      <SmartSoundScreen />
    </div>
  ),
})
