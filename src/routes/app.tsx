import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { flex, hstack, stack } from 'styled-system/patterns'
import { useEngine } from '~/lib/engine-context'
import { SignalRing } from '~/design/SignalRing'
import { Button } from '~/components/ui/Button'
import { Slider } from '~/components/ui/Slider'
import { TlxCheckIn } from '~/components/TlxCheckIn'
import { signalColor, arousalLabel, pct } from '~/lib/format'

export const Route = createFileRoute('/app')({
  component: AppShell,
})

const NAV = [
  { to: '/app/session', label: 'Session' },
  { to: '/app/library', label: 'Library' },
  { to: '/app/insights', label: 'Insights' },
  { to: '/app/settings', label: 'Settings' },
] as const

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className={css({
        fontFamily: 'display',
        fontSize: 'sm',
        fontWeight: '500',
        color: 'muted',
        px: '3',
        py: '2',
        rounded: 'lg',
        textDecoration: 'none',
        transition: 'color token(durations.instant), background token(durations.instant)',
        _hover: { color: 'text' },
        '&[data-status=active]': { color: 'text', bg: 'signalFaint' },
      })}
      activeProps={{ 'data-status': 'active' }}
    >
      {label}
    </Link>
  )
}

function AppShell() {
  return (
    <div className={css({ display: 'grid', gridTemplateRows: '1fr auto', height: '100dvh' })}>
      <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '232px 1fr' }, minHeight: 0 })}>
        {/* Left rail (desktop) */}
        <aside
          className={css({
            display: { base: 'none', md: 'flex' },
            flexDir: 'column',
            gap: '1',
            borderRight: '1px solid token(colors.hairline)',
            p: '5',
          })}
        >
          <Link to="/" className={hstack({ gap: '2.5', textDecoration: 'none', color: 'text', mb: '6' })}>
            <span className={css({ w: '2.5', h: '2.5', rounded: 'full', bg: 'signal', boxShadow: '0 0 12px token(colors.signal)' })} />
            <span className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'lg' })}>SmartSound</span>
          </Link>
          {NAV.map((n) => <NavLink key={n.to} {...n} />)}
        </aside>

        {/* Mobile top nav + scrollable content */}
        <div className={css({ display: 'flex', flexDir: 'column', minHeight: 0 })}>
          <nav
            className={hstack({
              gap: '1',
              display: { base: 'flex', md: 'none' },
              px: '4',
              py: '3',
              borderBottom: '1px solid token(colors.hairline)',
              overflowX: 'auto',
            })}
          >
            {NAV.map((n) => <NavLink key={n.to} {...n} />)}
          </nav>
          <main className={css({ overflowY: 'auto', flex: 1, px: { base: '5', md: '10' }, py: { base: '6', md: '8' } })}>
            <Outlet />
          </main>
        </div>
      </div>

      <NowPlaying />
      <TlxCheckIn />
    </div>
  )
}

function NowPlaying() {
  const { status, profile, params, arousal, reading, activeScenario, getSpectrum, getPulse, stop, setNeuralIntensity } = useEngine()
  const color = signalColor(arousal)

  if (status === 'idle') {
    return (
      <div
        className={flex({
          justify: 'space-between',
          align: 'center',
          borderTop: '1px solid token(colors.hairline)',
          px: { base: '5', md: '10' },
          py: '3',
          bg: 'panel',
        })}
      >
        <span className={css({ color: 'muted', fontSize: 'sm' })}>Nothing playing.</span>
        <Link to="/app/library">
          <Button size="sm" variant="outline">Open library</Button>
        </Link>
      </div>
    )
  }

  return (
    <div
      className={css({
        display: 'grid',
        gridTemplateColumns: { base: 'auto 1fr auto', md: '260px 1fr 260px' },
        alignItems: 'center',
        gap: '4',
        borderTop: '1px solid token(colors.hairline)',
        px: { base: '4', md: '8' },
        py: '3',
        bg: 'panel',
        backdropFilter: 'blur(16px)',
      })}
    >
      <div className={hstack({ gap: '3' })}>
        <div style={{ width: 44, height: 44 }}>
          <SignalRing arousal={arousal} color={color} getSpectrum={getSpectrum} getPulse={getPulse} size={44} />
        </div>
        <div className={stack({ gap: '0' })}>
          <span className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'sm' })}>
            {activeScenario ? activeScenario.name : profile.label}
          </span>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>
            {activeScenario ? `${activeScenario.phase} · ${arousalLabel(arousal)}` : arousalLabel(arousal)}
          </span>
        </div>
      </div>

      <div className={css({ display: { base: 'none', md: 'flex' }, flexDir: 'column', gap: '1.5', maxW: '360px', mx: 'auto', width: 'full' })}>
        <div className={flex({ justify: 'space-between' })}>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>NEURAL EFFECT</span>
          <span className={`tabular ${css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal' })}`}>{pct(params.neuralDepth)}%</span>
        </div>
        <Slider label="Neural effect intensity" value={params.neuralDepth} onValueChange={setNeuralIntensity} />
      </div>

      <div className={hstack({ gap: '4', justify: 'flex-end' })}>
        <span className={`tabular ${css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', display: { base: 'none', sm: 'block' } })}`}>
          {reading.active ? `${Math.round(reading.hr)} BPM` : `${Math.round(params.entrainmentHz)} Hz`}
        </span>
        <Button size="sm" variant="danger" onClick={() => void stop()}>Stop</Button>
      </div>
    </div>
  )
}
