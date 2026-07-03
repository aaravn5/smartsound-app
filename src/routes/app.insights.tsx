import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { stack, hstack, flex } from 'styled-system/patterns'
import { useEngine } from '~/lib/engine-context'
import { arousalToLch, lchToCss, prefersReducedMotion } from '~/design/signal'
import { PixelSkeleton } from '~/design/PixelSkeleton'
import { getCheckIns } from '~/lib/calibration'
import { pct } from '~/lib/format'

/**
 * Insights — real trends from real sessions (Milestone 2), GOAT editorial
 * restyle. Only in-memory data persists in this build (no backend yet, §5 of
 * the goal doc), so anything that would require cross-session history is a
 * clearly-labelled empty state rather than fabricated numbers.
 */
export const Route = createFileRoute('/app/insights')({
  component: InsightsScreen,
})

function InsightsScreen() {
  const { baseline, profile, status, getArousalHistory } = useEngine()
  const history = getArousalHistory()
  const minutesThisSession = history.length > 1 ? (history[history.length - 1].t - history[0].t) / 60_000 : 0

  return (
    <div className={stack({ gap: '9' })}>
      <header className={stack({ gap: '1' })}>
        <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: { base: '3xl', md: '4xl' }, letterSpacing: '-0.02em' })}>
          Insights
        </h1>
        <p className={css({ color: 'muted' })}>Honest trends from your real sessions. No vanity metrics.</p>
      </header>

      <div className={css({ display: 'grid', gridTemplateColumns: { base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: '3' })}>
        <Stat label="THIS SESSION" value={minutesThisSession > 0 ? minutesThisSession.toFixed(1) : '—'} unit="min" />
        <Stat label="SAMPLES LOGGED" value={history.length > 0 ? `${history.length}` : '—'} unit="pts" />
        <Stat label="CHECK-INS" value={`${getCheckIns().length}`} unit="total" />
      </div>

      <section className={stack({ gap: '3', p: { base: '5', md: '7' }, bg: 'panel', border: '1px solid token(colors.hairline)', rounded: '3xl' })}>
        <div className={flex({ justify: 'space-between', align: 'baseline', wrap: 'wrap', gap: '2' })}>
          <h2 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'lg' })}>Arousal vs. target — this session</h2>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>target: {profile.label}</span>
        </div>
        {history.length > 1 ? (
          <>
            <ArousalTrace getHistory={getArousalHistory} target={profile.targetArousal} live={status === 'running'} />
            <Adherence getHistory={getArousalHistory} target={profile.targetArousal} />
          </>
        ) : (
          <PixelSkeleton label="No session data yet — start a session to see your real arousal trace" height={120} />
        )}
      </section>

      <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '1fr 1fr' }, gap: '4' })}>
        <section className={stack({ gap: '3', p: '6', bg: 'panel', border: '1px solid token(colors.hairline)', rounded: '2xl' })}>
          <h2 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'lg' })}>Your baseline</h2>
          {baseline.captured ? (
            <div className={hstack({ gap: '6' })}>
              <Stat label="RESTING HR" value={`${Math.round(baseline.hr)}`} unit="bpm" />
              <Stat label="RESPIRATION" value={`${baseline.respiration.toFixed(1)}`} unit="br/min" />
              <Stat label="STEADINESS" value={`${pct(baseline.steadiness)}`} unit="%" />
            </div>
          ) : (
            <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.5' })}>
              Not captured yet. Run the camera baseline in onboarding, or enable Attune in a session — SmartSound reads every live value relative to your own resting numbers.
            </p>
          )}
        </section>

        <section className={stack({ gap: '3', p: '6', bg: 'panel', border: '1px solid token(colors.hairline)', rounded: '2xl' })}>
          <h2 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'lg' })}>Personal curve</h2>
          <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.5' })}>
            SmartSound learns your arousal-to-performance curve from NASA-TLX check-ins, so "focus" comes to mean <em>your</em> focus. This fills in as you run sessions and rate them — it does not assume a population average.
          </p>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>
            Check-ins recorded: <span className={css({ color: 'signal' })}>{getCheckIns().length}</span>
          </span>
        </section>
      </div>

      <section className={stack({ gap: '2', p: '6', border: '1px dashed token(colors.hairline)', rounded: '2xl' })}>
        <h2 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'md' })}>Streaks &amp; weekly minutes</h2>
        <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.5' })}>
          Cross-session history needs an account (coming with Sign in) — this build keeps arousal samples in memory for the current session only. Streaks and a weekly total will appear here once sessions persist across days.
        </p>
      </section>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className={stack({ gap: '0.5', p: '4', bg: 'panel', border: '1px solid token(colors.hairline)', rounded: 'xl' })}>
      <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>{label}</span>
      <div className={flex({ gap: '1', align: 'baseline' })}>
        <span className={`tabular ${css({ fontFamily: 'display', fontWeight: '600', fontSize: '2xl' })}`}>{value}</span>
        <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>{unit}</span>
      </div>
    </div>
  )
}

function ArousalTrace({ getHistory, target, live }: { getHistory: () => { t: number; a: number }[]; target: number; live: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = 840, H = 160
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const draw = () => {
      const hist = getHistory()
      ctx.clearRect(0, 0, W, H)
      const ty = H - target * H
      ctx.fillStyle = 'color-mix(in oklab, ' + lchToCss(arousalToLch(target)) + ' 12%, transparent)'
      ctx.fillRect(0, ty - 14, W, 28)
      ctx.strokeStyle = 'color-mix(in oklab, ' + lchToCss(arousalToLch(target)) + ' 50%, transparent)'
      ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke()
      ctx.setLineDash([])

      if (hist.length > 1) {
        const n = hist.length
        ctx.beginPath()
        for (let i = 0; i < n; i++) {
          const x = (i / (n - 1)) * W
          const y = H - hist[i].a * H
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = lchToCss(arousalToLch(hist[n - 1].a))
        ctx.lineWidth = 2
        ctx.stroke()
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.35)'
        ctx.font = '12px ui-monospace, monospace'
        ctx.fillText('No session data yet — start a session to see your real arousal trace.', 12, H / 2)
      }
    }

    draw()
    if (!live || prefersReducedMotion()) return
    const id = setInterval(draw, 500)
    return () => clearInterval(id)
  }, [getHistory, target, live])

  return <canvas ref={ref} className={css({ width: 'full', height: 'auto', rounded: 'lg' })} style={{ aspectRatio: '840 / 160' }} />
}

function Adherence({ getHistory, target }: { getHistory: () => { t: number; a: number }[]; target: number }) {
  const hist = getHistory()
  const adherence = useMemo(() => {
    if (hist.length < 4) return null
    const within = hist.filter((s) => Math.abs(s.a - target) <= 0.12).length
    return within / hist.length
  }, [hist, target])

  if (adherence == null) {
    return <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>Adherence appears once a session has run.</span>
  }
  return (
    <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>
      In-target adherence: <span className={css({ color: 'signal' })}>{pct(adherence)}%</span> of {hist.length} samples within ±0.12 of target.
    </span>
  )
}
