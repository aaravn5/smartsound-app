import { createFileRoute } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { Card } from '~/components/Card'
import { ArousalCurveChart, WeeklyMinutesChart } from '~/components/ProgressCharts'
import { useEngine } from '~/lib/engine-context'
import {
  MINUTES_GOAL,
  WEEK_SAMPLE,
  bestDay,
  streakDays,
  todayMinutes,
  totalMinutes,
  totalSessions,
} from '~/lib/sample-stats'

/**
 * Progress — the Listening Rings: concentric vinyl-groove circles in
 * monochrome Lead; completed listening brightens the grooves (Starlight at
 * rising opacity); ONE Mercury Blue stylus dot marks today. Stats are mono
 * callouts; the band mix is a low-saturation stacked bar in band tints.
 * No multicolor rings anywhere. Sample data stays honestly labeled; the
 * arousal curve stays wired to the real engine.
 */
export const Route = createFileRoute('/app/progress')({
  component: ProgressScreen,
})

const fadeUpCss = css({
  animation: 'fadeUp token(durations.calm) token(easings.enter) both',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
})

const sectionTitleCss = css({
  m: '0',
  fontFamily: 'display',
  fontWeight: '400',
  fontSize: 'headingSm',
  letterSpacing: '-0.01em',
  color: 'starlight',
})

const monoCalloutCss = css({
  m: '0',
  fontFamily: 'mono',
  fontSize: 'bodyMd',
  color: 'starlight',
})

const monoCaptionCss = css({
  m: '0',
  mt: '0.5',
  fontFamily: 'mono',
  fontSize: '0.6875rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'silver',
})

const sampleCaptionCss = css({
  m: '0',
  mt: '4',
  fontSize: 'caption',
  letterSpacing: '0.02em',
  textAlign: 'center',
  color: 'faint',
})

/**
 * ListeningRings — the vinyl-groove motif. `progress` (0..1 of the daily
 * minutes goal) decides how many grooves have been "cut": played grooves
 * brighten from Lead toward Starlight with rising opacity, unplayed grooves
 * stay faint Lead. One Mercury Blue stylus dot rides the current groove.
 */
function ListeningRings({ size, progress, minutes }: { size: number; progress: number; minutes: number }) {
  const half = size / 2
  const ringCount = 14
  const rInner = size * 0.14
  const rOuter = size * 0.46
  const lit = Math.round(Math.min(1, Math.max(0, progress)) * ringCount)
  // The stylus tracks inward from the edge, like a record playing.
  const styluRing = Math.max(0, ringCount - lit)
  const rings = Array.from({ length: ringCount }, (_, i) => {
    // i = 0 outermost. Grooves already played: the outermost `lit` rings.
    const r = rOuter - (i * (rOuter - rInner)) / (ringCount - 1)
    const played = i < lit
    const t = lit > 0 ? i / Math.max(1, lit - 1) : 0
    const stroke = played
      ? `rgba(237, 237, 243, ${(0.28 + 0.5 * (1 - t)).toFixed(2)})`
      : 'rgba(112, 112, 125, 0.22)'
    return { r, stroke, width: played ? 1.4 : 1 }
  })
  const stylusR = rOuter - (Math.min(styluRing, ringCount - 1) * (rOuter - rInner)) / (ringCount - 1)
  const stylusAngle = -Math.PI / 3.2
  const sx = half + stylusR * Math.cos(stylusAngle)
  const sy = half + stylusR * Math.sin(stylusAngle)

  return (
    <div className={css({ position: 'relative', display: 'inline-block' })}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Listening rings — ${minutes} of ${MINUTES_GOAL} minutes today`}
      >
        {rings.map((ring, i) => (
          <circle
            key={i}
            cx={half}
            cy={half}
            r={ring.r}
            fill="none"
            stroke={ring.stroke}
            strokeWidth={ring.width}
          />
        ))}
        {/* The stylus — the single Mercury Blue mark for today. */}
        <circle cx={sx} cy={sy} r={3.5} fill="#5266eb" />
      </svg>
      <div
        className={css({
          position: 'absolute',
          inset: '0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        })}
      >
        <span className={cx('tabular', css({ fontSize: 'heading', lineHeight: '1', color: 'starlight' }))}>
          {minutes}
        </span>
        <span className={monoCaptionCss}>min today</span>
      </div>
    </div>
  )
}

/** Band mix — low-saturation stacked bar in the band tints + mono legend. */
const BAND_MIX = [
  { band: 'Beta', pct: 61, tint: '#6f7ff0' },
  { band: 'Theta', pct: 27, tint: '#b78fd6' },
  { band: 'Delta', pct: 12, tint: '#4a5a8a' },
]

function BandMixBar() {
  return (
    <div>
      <div
        className={css({
          display: 'flex',
          height: '8px',
          borderRadius: 'full',
          overflow: 'hidden',
          background: 'rgba(112, 112, 125, 0.14)',
        })}
        role="img"
        aria-label={`Band mix — ${BAND_MIX.map((b) => `${b.band} ${b.pct} percent`).join(', ')}`}
      >
        {BAND_MIX.map((b) => (
          <span key={b.band} style={{ width: `${b.pct}%`, background: b.tint, opacity: 0.5 }} />
        ))}
      </div>
      <p className={cx('tabular', css({ m: '0', mt: '2', fontSize: '0.75rem', letterSpacing: '0.04em', color: 'silver' }))}>
        {BAND_MIX.map((b) => `${b.band} ${b.pct}%`).join(' · ')}
      </p>
    </div>
  )
}

function ProgressScreen() {
  const { getArousalHistory, profile } = useEngine()

  return (
    <>
      <header className={cx(css({ mb: '7' }), fadeUpCss)}>
        <p
          className={css({
            m: '0',
            mb: '1.5',
            fontFamily: 'mono',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'silver',
          })}
        >
          Your practice
        </p>
        <h1
          className={css({
            m: '0',
            fontFamily: 'display',
            fontWeight: '400',
            fontSize: 'heading',
            letterSpacing: '-0.01em',
            lineHeight: '1.1',
            color: 'starlight',
          })}
        >
          Progress
        </h1>
      </header>

      {/* The Listening Rings — grooves cut by today's listening. */}
      <Card className={cx(css({ mb: '5' }), fadeUpCss)}>
        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            px: '6',
            py: '8',
          })}
        >
          <ListeningRings size={248} progress={todayMinutes / MINUTES_GOAL} minutes={todayMinutes} />

          {/* Mono callouts. */}
          <div
            className={css({
              display: 'flex',
              gap: '8',
              mt: '6',
              justifyContent: 'center',
            })}
          >
            <div className={css({ textAlign: 'center' })}>
              <p className={cx('tabular', monoCalloutCss)}>{todayMinutes} min</p>
              <p className={monoCaptionCss}>today</p>
            </div>
            <div className={css({ width: '1px', bg: 'hairline' })} />
            <div className={css({ textAlign: 'center' })}>
              <p className={cx('tabular', monoCalloutCss)}>{streakDays}-day</p>
              <p className={monoCaptionCss}>rhythm</p>
            </div>
          </div>

          <div className={css({ width: '100%', maxW: '320px', mt: '6' })}>
            <BandMixBar />
          </div>

          <p className={sampleCaptionCss}>Sample data — your sessions will appear here</p>
        </div>
      </Card>

      {/* This week. */}
      <Card className={cx(css({ mb: '5' }), fadeUpCss)} style={{ animationDelay: '80ms' }}>
        <div className={css({ px: '6', py: '6' })}>
          <h2 className={sectionTitleCss}>This week</h2>
          <p className={css({ m: '0', mb: '5', fontSize: 'bodySm', color: 'faint' })}>Minutes listened, by day</p>

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
              <span className={cx('tabular', css({ fontSize: 'heading', lineHeight: '1.15', color: 'starlight' }))}>
                {totalMinutes}
              </span>
              <span className={css({ fontSize: 'caption', color: 'faint' })}>total minutes</span>
            </div>
            <div className={css({ width: '1px', bg: 'hairline', flexShrink: '0' })} />
            <div className={css({ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2' })}>
              <span className={css({ fontSize: 'bodySm', color: 'muted' })}>
                <span className={cx('tabular', css({ color: 'starlight' }))}>{totalSessions}</span> sessions
              </span>
              <span className={css({ fontSize: 'bodySm', color: 'muted' })}>
                Best day <span className={css({ color: 'starlight' })}>{bestDay.label}</span>{' '}
                <span className="tabular">· {bestDay.minutes} min</span>
              </span>
            </div>
          </div>

          <p className={sampleCaptionCss}>Sample insights — your real history builds as you listen</p>
        </div>
      </Card>

      {/* Calm curve — real engine data, honestly empty until a session runs. */}
      <Card className={fadeUpCss} style={{ animationDelay: '160ms' }}>
        <div className={css({ px: '6', py: '6' })}>
          <h2 className={sectionTitleCss}>Calm curve</h2>
          <p className={css({ m: '0', mb: '5', fontSize: 'bodySm', color: 'faint' })}>
            Arousal against this session&rsquo;s target
          </p>
          <ArousalCurveChart samples={getArousalHistory()} target={profile.targetArousal} />
        </div>
      </Card>
    </>
  )
}
