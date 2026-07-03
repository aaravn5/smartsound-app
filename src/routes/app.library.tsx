import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as Tabs from '@radix-ui/react-tabs'
import { css } from 'styled-system/css'
import { flex, stack, hstack } from 'styled-system/patterns'
import { useEngine } from '~/lib/engine-context'
import { Button } from '~/components/ui/Button'
import { SOUNDSCAPES, SCENARIOS, type Scenario, type Soundscape } from '~/lib/catalog'
import { PROFILES } from '~/engine/audio'
import { signalColor } from '~/lib/format'

export const Route = createFileRoute('/app/library')({
  component: LibraryScreen,
})

const tabTrigger = css({
  fontFamily: 'display', fontWeight: '500', fontSize: 'sm', color: 'muted',
  px: '4', py: '2', rounded: 'full', cursor: 'pointer', bg: 'transparent',
  border: '1px solid transparent',
  transition: 'all token(durations.instant)',
  _hover: { color: 'text' },
  '&[data-state=active]': { color: 'text', bg: 'signalFaint', borderColor: 'hairline' },
})

function LibraryScreen() {
  return (
    <div className={stack({ gap: '6', maxW: '1000px', mx: 'auto' })}>
      <div className={stack({ gap: '1' })}>
        <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: '3xl', letterSpacing: '-0.01em' })}>Library</h1>
        <p className={css({ color: 'muted' })}>Endless soundscapes that adapt, and timed scenarios with phases.</p>
      </div>

      <Tabs.Root defaultValue="soundscapes">
        <Tabs.List className={hstack({ gap: '2', mb: '5' })}>
          <Tabs.Trigger value="soundscapes" className={tabTrigger}>Soundscapes</Tabs.Trigger>
          <Tabs.Trigger value="scenarios" className={tabTrigger}>Scenarios</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="soundscapes">
          <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: '4' })}>
            {SOUNDSCAPES.map((s) => <SoundscapeCard key={s.id} scape={s} />)}
          </div>
        </Tabs.Content>

        <Tabs.Content value="scenarios">
          <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)' }, gap: '4' })}>
            {SCENARIOS.map((s) => <ScenarioCard key={s.id} scenario={s} />)}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

function CardShell({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div
      className={stack({
        gap: '3', p: '5', rounded: '2xl', border: '1px solid token(colors.hairline)',
        bg: 'panel', position: 'relative', overflow: 'hidden', minHeight: '180px',
        justify: 'space-between',
      })}
      style={{ boxShadow: `inset 0 1px 0 0 ${accent}22` }}
    >
      <span
        aria-hidden
        className={css({ position: 'absolute', top: '-40px', right: '-40px', w: '120px', h: '120px', rounded: 'full', filter: 'blur(30px)' })}
        style={{ background: `${accent}33` }}
      />
      {children}
    </div>
  )
}

function SoundscapeCard({ scape }: { scape: Soundscape }) {
  const { start } = useEngine()
  const navigate = useNavigate()
  const accent = signalColor(PROFILES[scape.state].targetArousal)
  const play = async () => { await start(scape.state); navigate({ to: '/app/session' }) }
  return (
    <CardShell accent={accent}>
      <div className={stack({ gap: '2' })}>
        <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.06em' })}>{scape.band}</span>
        <h3 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'xl' })}>{scape.title}</h3>
        <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.45' })}>{scape.blurb}</p>
      </div>
      <div className={flex({ justify: 'flex-end' })}>
        <Button size="sm" variant="primary" onClick={play}>Play</Button>
      </div>
    </CardShell>
  )
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const { startScenario } = useEngine()
  const navigate = useNavigate()
  const accent = signalColor(PROFILES[scenario.state].targetArousal)
  const start = async () => { await startScenario(scenario); navigate({ to: '/app/session' }) }
  return (
    <CardShell accent={accent}>
      <div className={stack({ gap: '2' })}>
        <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.06em' })}>
          {scenario.minutes} MIN · {scenario.band}
        </span>
        <h3 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'xl' })}>{scenario.title}</h3>
        <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.45' })}>{scenario.blurb}</p>
        <div className={hstack({ gap: '1.5', mt: '1' })}>
          {scenario.phases.map((p) => (
            <span key={p.name} className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', px: '2', py: '0.5', rounded: 'full', border: '1px solid token(colors.hairline)' })}>
              {p.name}
            </span>
          ))}
        </div>
      </div>
      <div className={flex({ justify: 'flex-end' })}>
        <Button size="sm" variant="primary" onClick={start}>Start</Button>
      </div>
    </CardShell>
  )
}
