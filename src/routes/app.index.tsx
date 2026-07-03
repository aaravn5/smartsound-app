import { useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { stack, flex } from 'styled-system/patterns'
import { GlassButton } from '~/components/GlassButton'
import { BiofeedbackRing } from '~/design/BiofeedbackRing'
import { PROFILES } from '~/engine/audio/profiles'
import type { TargetState } from '~/engine/audio/types'
import { BAND_LABEL, SOUNDSCAPES, SCENARIOS, type Soundscape, type Scenario } from '~/lib/catalog'
import { suggestFor, suggestedBlockMinutes } from '~/engine/circadian/model'
import { signalColor } from '~/lib/format'

/**
 * Discover — the GOAT-format home (Milestone 2). An editorial featured hero
 * (the circadian "session of the moment") over curated horizontal rails, all
 * built from real PROFILES/catalog data — no invented content.
 */
export const Route = createFileRoute('/app/')({
  component: DiscoverScreen,
})

function greeting(d: Date): string {
  const h = d.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

const RAIL_LABEL: Record<TargetState, string> = {
  focus: 'For your morning',
  flow: 'For the afternoon',
  calm: 'For right now',
  winddown: 'For your evening',
  sleep: 'For tonight',
}

interface RailItem {
  id: string
  title: string
  state: TargetState
  meta: string
}

const toRailItem = (x: Soundscape | Scenario): RailItem =>
  'minutes' in x
    ? { id: x.id, title: x.title, state: x.state, meta: `${x.minutes} MIN · ${x.band}` }
    : { id: x.id, title: x.title, state: x.state, meta: x.band }

function nearestSoundscapes(state: TargetState, count: number): Soundscape[] {
  const target = PROFILES[state].targetArousal
  return [...SOUNDSCAPES]
    .sort((a, b) => Math.abs(PROFILES[a.state].targetArousal - target) - Math.abs(PROFILES[b.state].targetArousal - target))
    .slice(0, count)
}

function buildRails(state: TargetState) {
  return {
    contextual: nearestSoundscapes(state, 3).map(toRailItem),
    focus: [
      ...SOUNDSCAPES.filter((s) => s.state === 'focus' || s.state === 'flow'),
      ...SCENARIOS.filter((s) => s.state === 'focus'),
    ].map(toRailItem),
    sleep: [
      ...SCENARIOS.filter((s) => s.state === 'winddown' || s.state === 'sleep'),
      ...SOUNDSCAPES.filter((s) => s.state === 'winddown' || s.state === 'sleep'),
    ].map(toRailItem),
    newDrops: SOUNDSCAPES.map(toRailItem),
  }
}

function DiscoverScreen() {
  const navigate = useNavigate()
  const now = useMemo(() => new Date(), [])
  const hello = greeting(now)
  const suggestion = useMemo(() => suggestFor(now), [now])
  const heroProfile = PROFILES[suggestion.state]
  const heroMinutes = suggestedBlockMinutes(suggestion.state)
  const rails = useMemo(() => buildRails(suggestion.state), [suggestion.state])

  const begin = (state: TargetState) => navigate({ to: '/app/now', search: { state } })

  return (
    <div className={stack({ gap: '10' })}>
      <header className={stack({ gap: '1' })}>
        <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.14em', textTransform: 'uppercase' })}>
          {hello}
        </span>
        <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: { base: '3xl', md: '4xl' }, letterSpacing: '-0.02em' })}>
          Discover
        </h1>
      </header>

      {/* Featured hero — session of the moment */}
      <section
        className={css({
          position: 'relative',
          overflow: 'hidden',
          rounded: '3xl',
          border: '1px solid token(colors.glassBorder)',
          bg: 'panel',
          display: 'grid',
          gridTemplateColumns: { base: '1fr', sm: '1fr auto' },
          alignItems: 'center',
          gap: '7',
          p: { base: '7', md: '10' },
        })}
        style={{
          backgroundImage: `radial-gradient(120% 140% at 100% -10%, color-mix(in oklab, ${signalColor(heroProfile.targetArousal)} 24%, transparent), transparent 62%)`,
        }}
      >
        <div className={stack({ gap: '3', align: 'flex-start' })}>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal', letterSpacing: '0.16em', textTransform: 'uppercase' })}>
            Session of the moment
          </span>
          <h2
            className={css({
              fontFamily: 'display',
              fontWeight: '600',
              fontSize: { base: '4xl', md: '5xl' },
              letterSpacing: '-0.02em',
              lineHeight: '1.02',
            })}
          >
            {heroProfile.label}
          </h2>
          <p className={css({ color: 'muted', fontSize: 'sm', maxW: '38ch', lineHeight: '1.5' })}>
            Suggested right now — {suggestion.reason}.
          </p>
          <span className={`tabular ${css({ fontFamily: 'mono', fontSize: 'xs', color: 'muted', letterSpacing: '0.06em' })}`}>
            {BAND_LABEL[suggestion.state]} · {heroMinutes} min
          </span>
          <div className={css({ pt: '3' })}>
            <GlassButton variant="primary" size="lg" onClick={() => begin(suggestion.state)}>
              Begin
            </GlassButton>
          </div>
        </div>
        <div className={css({ display: { base: 'none', sm: 'block' }, width: '200px', aspectRatio: '1', justifySelf: 'center' })}>
          <BiofeedbackRing arousal={heroProfile.targetArousal} size={200} />
        </div>
      </section>

      <Rail label={RAIL_LABEL[suggestion.state]} items={rails.contextual} onPick={begin} />
      <Rail label="Deep focus" items={rails.focus} onPick={begin} />
      <Rail label="Sleep programs" items={rails.sleep} onPick={begin} />
      <Rail label="New soundscapes" items={rails.newDrops} onPick={begin} />
    </div>
  )
}

function Rail({ label, items, onPick }: { label: string; items: RailItem[]; onPick: (state: TargetState) => void }) {
  return (
    <section className={stack({ gap: '3' })}>
      <h2 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'xl', letterSpacing: '-0.01em' })}>{label}</h2>
      <div
        className={flex({
          gap: '3',
          overflowX: 'auto',
          pb: '2',
        })}
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
      >
        {items.map((item) => (
          <RailCard key={`${label}-${item.id}`} item={item} onPick={onPick} />
        ))}
      </div>
    </section>
  )
}

function RailCard({ item, onPick }: { item: RailItem; onPick: (state: TargetState) => void }) {
  const accent = signalColor(PROFILES[item.state].targetArousal)
  return (
    <button
      onClick={() => onPick(item.state)}
      className={css({
        position: 'relative',
        flex: '0 0 auto',
        width: '168px',
        aspectRatio: '3/4',
        rounded: '2xl',
        overflow: 'hidden',
        border: '1px solid token(colors.hairline)',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDir: 'column',
        justifyContent: 'flex-end',
        p: '3.5',
        gap: '1',
        transition: 'transform 250ms token(easings.calm)',
        _hover: { transform: 'translateY(-3px)' },
        _active: { transform: 'scale(0.97)' },
      })}
      style={{ backgroundImage: `linear-gradient(165deg, color-mix(in oklab, ${accent} 46%, black) 0%, black 78%)`, scrollSnapAlign: 'start' }}
    >
      <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' })} style={{ fontSize: '9px' }}>
        {item.meta}
      </span>
      <span className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'md', lineHeight: '1.15' })}>{item.title}</span>
    </button>
  )
}
