import { css } from 'styled-system/css'
import type { ArousalSample } from '~/lib/engine-context'

/**
 * Progress charts — dataviz-correct, single-hue-accent, honest.
 *
 * WeeklyMinutesChart: 7 bars, 4px rounded tops, a recessive baseline, today
 * emphasized with a direct label (everyone else gets a hover title, never a
 * number on every bar), tabular labels throughout.
 *
 * ArousalCurveChart: the real per-session arousal trace against the
 * profile's target — a thin 2px line, a soft single-hue area fill, a
 * recessive dashed target reference, and a direct last-point label. Renders
 * an honest composed empty state when no session has run yet this session.
 */

export interface WeeklyDatum {
  label: string
  minutes: number
}

const CHART_H = 128

const barColumn = css({
  flex: '1',
  minW: '0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-end',
  height: 'full',
})

const barValueToday = css({
  display: 'block',
  height: '15px',
  mb: '1',
  fontSize: 'caption2',
  fontWeight: '700',
  color: 'text',
  lineHeight: '15px',
})

const barValueGhost = css({ display: 'block', height: '15px', mb: '1' })

const bar = css({
  width: 'full',
  borderRadius: '4px 4px 0 0',
  transition: 'height token(durations.calm) token(easings.glide)',
})

const dayLabelToday = css({
  flex: '1',
  textAlign: 'center',
  fontSize: 'caption2',
  fontWeight: '700',
  color: 'text',
})

const dayLabelPast = css({
  flex: '1',
  textAlign: 'center',
  fontSize: 'caption2',
  fontWeight: '600',
  color: 'faint',
})

export function WeeklyMinutesChart({ data }: { data: WeeklyDatum[] }) {
  const todayIndex = data.length - 1
  const max = Math.max(...data.map((d) => d.minutes), 1)
  const niceMax = Math.max(10, Math.ceil(max / 10) * 10)

  return (
    <div
      role="img"
      aria-label={`Minutes practised this week — ${data
        .map((d, i) => `${d.label}${i === todayIndex ? ' (today)' : ''}: ${d.minutes} minutes`)
        .join(', ')}`}
    >
      <div className={css({ display: 'flex', alignItems: 'flex-end', gap: '2.5', height: `${CHART_H}px` })}>
        {data.map((d, i) => {
          const isToday = i === todayIndex
          const pct = Math.max(3, Math.round((d.minutes / niceMax) * 100))
          return (
            <div key={d.label} className={barColumn}>
              <span className={isToday ? `tabular ${barValueToday}` : barValueGhost} aria-hidden={!isToday}>
                {isToday ? d.minutes : ''}
              </span>
              <div
                title={`${d.label} — ${d.minutes} min`}
                className={bar}
                style={{
                  height: `${pct}%`,
                  background: isToday
                    ? 'linear-gradient(180deg, var(--scene-accent), color-mix(in oklab, var(--scene-accent) 62%, black))'
                    : 'color-mix(in oklab, var(--scene-accent) 32%, rgba(255,255,255,0.05))',
                }}
              />
            </div>
          )
        })}
      </div>
      <div
        className={css({
          display: 'flex',
          gap: '2.5',
          mt: '2',
          pt: '2',
          borderTop: '1px solid',
          borderColor: 'hairline',
        })}
      >
        {data.map((d, i) => (
          <span key={d.label} className={i === todayIndex ? dayLabelToday : dayLabelPast}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

const WaveIcon = () => (
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
    <path d="M2.5 13c1.8 0 1.8-4 3.6-4s1.8 4 3.6 4 1.8-4 3.6-4 1.8 4 3.6 4 1.8-4 3.6-4 1.8 4 3.6 4" />
  </svg>
)

export function ArousalCurveChart({ samples, target }: { samples: ArousalSample[]; target: number }) {
  if (samples.length < 2) {
    return (
      <div
        className={css({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3',
          px: '6',
          py: '9',
          textAlign: 'center',
        })}
      >
        <span
          aria-hidden
          className={css({
            display: 'grid',
            placeItems: 'center',
            width: '48px',
            height: '48px',
            borderRadius: 'full',
            color: 'accent',
            background: 'accentSoft',
          })}
        >
          <WaveIcon />
        </span>
        <p className={css({ m: '0', fontSize: 'subhead', color: 'muted', maxW: '30ch' })}>
          Your calm curve appears after a session.
        </p>
      </div>
    )
  }

  const W = 300
  const H = 118
  const padTop = 16
  const padBottom = 22
  const plotW = W - 40

  const t0 = samples[0].t
  const t1 = samples[samples.length - 1].t
  const span = Math.max(1, t1 - t0)

  const x = (t: number) => ((t - t0) / span) * plotW
  const y = (a: number) => padTop + (1 - clamp01(a)) * (H - padTop - padBottom)

  const linePath = samples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(s.t).toFixed(1)} ${y(s.a).toFixed(1)}`).join(' ')
  const baseY = H - padBottom
  const areaPath = `${linePath} L ${x(t1).toFixed(1)} ${baseY} L ${x(t0).toFixed(1)} ${baseY} Z`

  const first = samples[0]
  const last = samples[samples.length - 1]
  const elapsedMin = Math.max(0, Math.round((t1 - t0) / 60000))
  const targetY = y(target)

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label={`Arousal curve from ${Math.round(first.a * 100)} percent to ${Math.round(last.a * 100)} percent across ${elapsedMin} minutes, target ${Math.round(target * 100)} percent`}
      >
        <defs>
          <linearGradient id="calmCurveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--scene-accent)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--scene-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* recessive baseline */}
        <line x1="0" y1={baseY} x2={plotW} y2={baseY} stroke="var(--ss-control-track)" strokeWidth="1" />

        {/* target reference — recessive, dashed */}
        <line x1="0" y1={targetY} x2={plotW} y2={targetY} stroke="var(--ss-line-strong)" strokeWidth="1" strokeDasharray="3 4" />
        <text x="0" y={targetY - 5} fontSize="8.5" fill="var(--ss-ink-soft)" style={{ fontVariantNumeric: 'tabular-nums' }}>
          Target · {Math.round(target * 100)}%
        </text>

        <path d={areaPath} fill="url(#calmCurveFill)" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--scene-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* direct last-point label */}
        <circle cx={x(last.t)} cy={y(last.a)} r="3.5" fill="var(--scene-accent)" />
        <text
          x={x(last.t) + 7}
          y={y(last.a) + 3.5}
          fontSize="10"
          fontWeight="700"
          fill="var(--scene-accent)"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {Math.round(last.a * 100)}%
        </text>
      </svg>
      <div className={css({ display: 'flex', justifyContent: 'space-between', mt: '1' })}>
        <span className={`tabular ${css({ fontSize: 'caption2', color: 'faint' })}`}>Start · {Math.round(first.a * 100)}%</span>
        <span className={`tabular ${css({ fontSize: 'caption2', color: 'faint' })}`}>{elapsedMin} min elapsed</span>
      </div>
    </div>
  )
}
