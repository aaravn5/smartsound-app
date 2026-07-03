import { createFileRoute } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { SmartSoundRings } from '~/design/SmartSoundRings'
import { ScreenTitle } from '~/components/SereneScreen'
import { ArousalCurveChart, WeeklyMinutesChart, type WeeklyDatum } from '~/components/ProgressCharts'
import { useEngine } from '~/lib/engine-context'

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

// Sample week — every derived number below (today's minutes, the streak, the
// weekly total/best-day) is computed from this array, never hand-typed twice.
const WEEK_SAMPLE: WeeklyDatum[] = [
  { label: 'Mon', minutes: 18 },
  { label: 'Tue', minutes: 32 },
  { label: 'Wed', minutes: 0 },
  { label: 'Thu', minutes: 41 },
  { label: 'Fri', minutes: 27 },
  { label: 'Sat', minutes: 35 },
  { label: 'Sun', minutes: 24 },
]
const WEEK_SESSIONS = [1, 2, 0, 2, 1, 2, 1]

const totalMinutes = WEEK_SAMPLE.reduce((sum, d) => sum + d.minutes, 0)
const totalSessions = WEEK_SESSIONS.reduce((sum, n) => sum + n, 0)
const bestDay = WEEK_SAMPLE.reduce((best, d) => (d.minutes > best.minutes ? d : best), WEEK_SAMPLE[0])
const todayMinutes = WEEK_SAMPLE[WEEK_SAMPLE.length - 1].minutes
const todaySessions = WEEK_SESSIONS[WEEK_SESSIONS.length - 1]

function currentStreak(): number {
  let streak = 0
  for (let i = WEEK_SAMPLE.length - 1; i >= 0; i--) {
    if (WEEK_SAMPLE[i].minutes <= 0) break
    streak++
  }
  return streak
}
const streakDays = currentStreak()

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
            attune={{ progress: todaySessions / 2, value: todaySessions, goal: 2 }}
            minutes={{ progress: todayMinutes / 40, value: todayMinutes, goal: 40 }}
            streak={{ progress: streakDays / 7, value: streakDays, goal: 7 }}
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
