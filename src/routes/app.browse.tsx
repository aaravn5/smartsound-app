import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { stack, flex } from 'styled-system/patterns'
import { GlassButton } from '~/components/GlassButton'
import { PROFILES, TARGET_STATES } from '~/engine/audio/profiles'
import type { TargetState } from '~/engine/audio/types'
import { SOUNDSCAPES, SCENARIOS, type Soundscape, type Scenario } from '~/lib/catalog'
import { signalColor } from '~/lib/format'

/**
 * Browse — search + filter chips over the real catalog (Milestone 2). GOAT's
 * clean browse grid, our content: every soundscape and scenario, client-side
 * filtered — no fake data.
 */
export const Route = createFileRoute('/app/browse')({
  component: BrowseScreen,
})

type Item = { kind: 'soundscape'; data: Soundscape } | { kind: 'scenario'; data: Scenario }

const ALL: Item[] = [
  ...SOUNDSCAPES.map((data): Item => ({ kind: 'soundscape', data })),
  ...SCENARIOS.map((data): Item => ({ kind: 'scenario', data })),
]

const TIME_TAG: Record<TargetState, string> = {
  focus: 'Morning',
  flow: 'Afternoon',
  calm: 'Anytime',
  winddown: 'Evening',
  sleep: 'Night'
}

type LengthTag = 'Endless' | 'Short' | 'Medium' | 'Long'
const lengthOf = (item: Item): LengthTag => {
  if (item.kind === 'soundscape') return 'Endless'
  if (item.data.minutes < 20) return 'Short'
  if (item.data.minutes <= 40) return 'Medium'
  return 'Long'
}

type IntensityTag = 'Low' | 'Medium' | 'High'
const intensityOf = (item: Item): IntensityTag => {
  const a = PROFILES[item.data.state].targetArousal
  if (a < 0.35) return 'Low'
  if (a < 0.6) return 'Medium'
  return 'High'
}

const GOALS = TARGET_STATES.map((p) => p.label)
const TIMES = ['Morning', 'Afternoon', 'Evening', 'Night'] as const
const LENGTHS: LengthTag[] = ['Endless', 'Short', 'Medium', 'Long']
const INTENSITIES: IntensityTag[] = ['Low', 'Medium', 'High']

function ChipRow({
  label,
  options,
  active,
  onPick,
}: {
  label: string
  options: readonly string[]
  active: string | null
  onPick: (v: string | null) => void
}) {
  return (
    <div className={stack({ gap: '2' })}>
      <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'faint', letterSpacing: '0.1em', textTransform: 'uppercase' })}>
        {label}
      </span>
      <div className={flex({ gap: '2', wrap: 'wrap' })}>
        {options.map((opt) => (
          <GlassButton key={opt} variant="pill" size="sm" selected={active === opt} onClick={() => onPick(active === opt ? null : opt)}>
            {opt}
          </GlassButton>
        ))}
      </div>
    </div>
  )
}

function BrowseScreen() {
  const [query, setQuery] = useState('')
  const [goal, setGoal] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [length, setLength] = useState<string | null>(null)
  const [intensity, setIntensity] = useState<string | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALL.filter((item) => {
      const state = item.data.state
      const profile = PROFILES[state]
      if (q && !item.data.title.toLowerCase().includes(q) && !item.data.blurb.toLowerCase().includes(q)) return false
      if (goal && profile.label !== goal) return false
      if (time && TIME_TAG[state] !== time && TIME_TAG[state] !== 'Anytime') return false
      if (length && lengthOf(item) !== length) return false
      if (intensity && intensityOf(item) !== intensity) return false
      return true
    })
  }, [query, goal, time, length, intensity])

  return (
    <div className={stack({ gap: '8' })}>
      <header className={stack({ gap: '1' })}>
        <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: { base: '3xl', md: '4xl' }, letterSpacing: '-0.02em' })}>
          Browse
        </h1>
        <p className={css({ color: 'muted' })}>Every soundscape and scenario SmartSound offers.</p>
      </header>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search soundscapes and programs…"
        aria-label="Search"
        className={css({
          fontFamily: 'body',
          fontSize: 'md',
          color: 'text',
          bg: 'glassFill',
          border: '1px solid token(colors.glassBorder)',
          rounded: '2xl',
          px: '5',
          py: '3.5',
          width: 'full',
          outline: 'none',
          _placeholder: { color: 'faint' },
          _focus: { borderColor: 'signal' },
        })}
        style={{ backdropFilter: 'blur(var(--glass-blur))' }}
      />

      <div className={stack({ gap: '5' })}>
        <ChipRow label="Goal" options={GOALS} active={goal} onPick={setGoal} />
        <ChipRow label="Time of day" options={TIMES} active={time} onPick={setTime} />
        <ChipRow label="Length" options={LENGTHS} active={length} onPick={setLength} />
        <ChipRow label="Intensity" options={INTENSITIES} active={intensity} onPick={setIntensity} />
      </div>

      <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr', sm: 'repeat(2, 1fr)' }, gap: '4' })}>
        {results.map((item) => (
          <BrowseCard key={`${item.kind}-${item.data.id}`} item={item} />
        ))}
      </div>

      {results.length === 0 && (
        <p className={css({ color: 'muted', textAlign: 'center', py: '10' })}>No matches — try clearing a filter.</p>
      )}
    </div>
  )
}

function BrowseCard({ item }: { item: Item }) {
  const navigate = useNavigate()
  const { data } = item
  const accent = signalColor(PROFILES[data.state].targetArousal)
  const meta = item.kind === 'scenario' ? `${item.data.minutes} MIN · ${item.data.band}` : item.data.band
  const cta = item.kind === 'scenario' ? 'Start' : 'Play'

  return (
    <div
      className={stack({
        gap: '0',
        rounded: '2xl',
        overflow: 'hidden',
        border: '1px solid token(colors.hairline)',
        bg: 'panel',
      })}
    >
      <div className={css({ height: '84px' })} style={{ backgroundImage: `linear-gradient(120deg, color-mix(in oklab, ${accent} 55%, black), black)` }} />
      <div className={stack({ gap: '2', p: '5' })}>
        <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.06em' })}>{meta}</span>
        <h3 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'xl' })}>{data.title}</h3>
        <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.45' })}>{data.blurb}</p>
        <div className={flex({ justify: 'flex-end', pt: '2' })}>
          <GlassButton variant="primary" size="sm" onClick={() => navigate({ to: '/app/now', search: { state: data.state } })}>
            {cta}
          </GlassButton>
        </div>
      </div>
    </div>
  )
}
