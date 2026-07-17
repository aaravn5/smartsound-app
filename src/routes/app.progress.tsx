import { createFileRoute } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { SmartSoundRings } from '~/design/SmartSoundRings'
import { ScreenTitle } from '~/components/SereneScreen'
import { ArousalCurveChart, WeeklyMinutesChart } from '~/components/ProgressCharts'
import { useEngine } from '~/lib/engine-context'
import {
  ATTUNE_GOAL,
  MINUTES_GOAL,
  STREAK_GOAL,
  WEEK_SAMPLE,
  bestDay,
  streakDays,
  todayMinutes,
  todaySessions,
  totalMinutes,
  totalSessions,
} from '~/lib/sample-stats'

/**
 * Progress — the SmartSound rings, a weekly minutes chart, a this-week
 * summary, and the real per-session arousal curve. The rings, chart, and
 * summary are clearly-labeled sample data (Milestone 4 doesn't yet persist
 * real session history); the arousal curve is real the moment a session has
 * run this app session, honestly empty otherwise.
 */
export const Route = createFileRoute('/app/progress')({
  component: ProgressScreen,
})

const cardAnim = css({
  animation: 'fadeUp token(durations.calm) token(easings.enter) both',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
})

const sectionTitle = css({
  m: '0',
  mb: '0.5',
  fontFamily: 'display',
  fontSize: 'title3',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'text',
})

const sampleCaption = css({
  m: '0',
  mt: '4',
  fontSize: 'caption',
  fontWeight: '500',
  letterSpacing: '0.02em',
  textAlign: 'center',
  color: 'faint',
})

function ProgressScreen() {
  const { getArousalHistory, profile } = useEngine()

  return (
    <>
      <ScreenTitle caption="Your practice" title="Progress" />

      <LiquidGlass variant="card" className={cx(css({ mb: '5' }), cardAnim)} style={{ animationDelay: '0ms' }}>
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
            attune={{ progress: todaySessions / ATTUNE_GOAL, value: todaySessions, goal: ATTUNE_GOAL }}
            minutes={{ progress: todayMinutes / MINUTES_GOAL, value: todayMinutes, goal: MINUTES_GOAL }}
            streak={{ progress: streakDays / STREAK_GOAL, value: streakDays, goal: STREAK_GOAL }}
            center={{ value: String(todayMinutes), label: 'min today' }}
          />
          <p className={sampleCaption} style={{ marginTop: 0 }}>
            Sample data — your sessions will appear here
          </p>
        </div>
      </LiquidGlass>

      <LiquidGlass variant="card" className={cx(css({ mb: '5' }), cardAnim)} style={{ animationDelay: '80ms' }}>
        <div className={css({ px: '6', py: '7' })}>
          <h2 className={sectionTitle}>This week</h2>
          <p className={css({ m: '0', mb: '5', fontSize: 'footnote', color: 'faint' })}>Minutes practised, by day</p>

          <WeeklyMinutesChart data={WEEK_SAMPLE} />

          <div
            className={css({
              display: 'flex',
              alignItems: 'stretch',
              gap: '5',
              mt: '6',
              pt: '5',
              borderTop: '1px solid',
              borderColor: 'hairline',
            })}
          >
            <div className={css({ display: 'flex', flexDirection: 'column', gap: '0.5' })}>
              <span className={`tabular ${css({ fontFamily: 'rounded', fontSize: 'title1', fontWeight: '700', color: 'text' })}`}>
                {totalMinutes}
              </span>
              <span className={css({ fontSize: 'caption', color: 'faint' })}>total minutes</span>
            </div>
            <div className={css({ width: '1px', bg: 'hairline', flexShrink: '0' })} />
            <div className={css({ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2' })}>
              <span className={css({ fontSize: 'footnote', color: 'muted' })}>
                <span className={`tabular ${css({ fontWeight: '700', color: 'text' })}`}>{totalSessions}</span> sessions
              </span>
              <span className={css({ fontSize: 'footnote', color: 'muted' })}>
                Best day <span className={css({ fontWeight: '700', color: 'text' })}>{bestDay.label}</span>{' '}
                <span className="tabular">· {bestDay.minutes} min</span>
              </span>
            </div>
          </div>

          <p className={sampleCaption}>Sample insights — your real history builds as you practise</p>
        </div>
      </LiquidGlass>

      <LiquidGlass variant="card" className={cardAnim} style={{ animationDelay: '160ms' }}>
        <div className={css({ px: '6', py: '7' })}>
          <h2 className={sectionTitle}>Calm curve</h2>
          <p className={css({ m: '0', mb: '5', fontSize: 'footnote', color: 'faint' })}>
            Arousal against this session&rsquo;s target
          </p>
          <ArousalCurveChart samples={getArousalHistory()} target={profile.targetArousal} />
        </div>
      </LiquidGlass>
    </>
  )
}
