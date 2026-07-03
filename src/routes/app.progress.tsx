import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { SmartSoundRings } from '~/design/SmartSoundRings'
import { ScreenTitle } from '~/components/SereneScreen'

/**
 * Progress — the SmartSound rings, big. Weekly trends and real session data
 * land in Milestone 4; until then the rings show clearly-labeled sample data.
 */
export const Route = createFileRoute('/app/progress')({
  component: ProgressScreen,
})

function ProgressScreen() {
  return (
    <>
      <ScreenTitle caption="Your practice" title="Progress" />

      <LiquidGlass
        variant="card"
        className={css({
          animation: 'fadeUp token(durations.calm) token(easings.enter) 120ms both',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        })}
      >
        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6',
            px: '6',
            py: '9',
          })}
        >
          <SmartSoundRings
            size={272}
            attune={{ progress: 0.68, value: 2, goal: 3 }}
            minutes={{ progress: 0.6, value: 24, goal: 40 }}
            streak={{ progress: 1, value: 5, goal: 5 }}
            center={{ value: '24', label: 'min today' }}
          />
          <p
            className={css({
              m: '0',
              fontSize: 'caption',
              fontWeight: '500',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textAlign: 'center',
              color: 'faint',
            })}
          >
            Sample data — your sessions will appear here
          </p>
        </div>
      </LiquidGlass>
    </>
  )
}
