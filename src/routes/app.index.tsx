import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { Scene } from '~/design/Scene'
import { SmartSoundRings } from '~/design/SmartSoundRings'
import { ScreenTitle } from '~/components/SereneScreen'
import { Rail, SessionCard, STATE_SCENE } from '~/components/SessionCard'
import { suggestFor, suggestedBlockMinutes } from '~/engine/circadian/model'
import { SOUNDSCAPES, SCENARIOS } from '~/lib/catalog'
import {
  ATTUNE_GOAL,
  MINUTES_GOAL,
  STREAK_GOAL,
  streakDays,
  todayMinutes,
  todaySessions,
} from '~/lib/sample-stats'

/** Today — the Calm "Daily" home: a featured session, today's rings, a rail. */
export const Route = createFileRoute('/app/')({
  component: TodayScreen,
})

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function todayCaption(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

function dayPart(hour: number): string {
  if (hour < 5) return 'Night'
  if (hour < 12) return 'Morning'
  if (hour < 18) return 'Afternoon'
  return 'Evening'
}

// Shared entrance: a class carrying the fade-up animation; each caller sets its
// own `animationDelay` inline so the stagger reads left-to-right / top-to-bottom.
const fadeUp = css({
  animation: 'fadeUp token(durations.calm) token(easings.enter) both',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
})

const ArrowIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
)

const ChevronIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M9 5l7 7-7 7" />
  </svg>
)

function TodayScreen() {
  const navigate = useNavigate()
  const now = new Date()
  const suggestion = suggestFor(now)
  const daily = SOUNDSCAPES.find((s) => s.state === suggestion.state) ?? SOUNDSCAPES[0]
  const dailyMinutes = suggestedBlockMinutes(suggestion.state)

  // Recommended rail — the four timed scenarios, today's suggested state surfaced first.
  const recommended = [...SCENARIOS].sort((a, b) => {
    const aMatch = a.state === suggestion.state ? 0 : 1
    const bMatch = b.state === suggestion.state ? 0 : 1
    return aMatch - bMatch
  })

  return (
    <>
      <ScreenTitle caption={todayCaption()} title={greeting()} />

      {/* Featured "Daily" session hero */}
      <section
        className={fadeUp}
        style={{ animationDelay: '40ms' }}
      >
        <div
          className={css({
            position: 'relative',
            borderRadius: 'card',
            overflow: 'hidden',
            height: '392px',
            mb: '7',
          })}
        >
          <Scene variant={STATE_SCENE[suggestion.state]} />
          <div
            className={css({
              position: 'relative',
              zIndex: '1',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              p: '5',
            })}
          >
            <p
              className={css({
                m: '0',
                mb: '2',
                fontSize: 'footnote',
                fontWeight: '600',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(235,235,248,0.72)',
              })}
            >
              {dayPart(now.getHours())} · Daily session
            </p>
            <h2
              className={css({
                m: '0',
                fontFamily: 'display',
                fontSize: 'title1',
                fontWeight: '700',
                letterSpacing: '-0.01em',
                lineHeight: '1.15',
                color: 'text',
              })}
            >
              {daily.title}
            </h2>
            <p
              className={css({
                m: '0',
                mt: '2',
                maxW: '32ch',
                fontSize: 'subhead',
                lineHeight: '1.5',
                color: 'rgba(235,235,248,0.84)',
              })}
            >
              {daily.blurb}
            </p>
            <div className={css({ display: 'flex', alignItems: 'center', gap: '4', mt: '5' })}>
              <LiquidGlass
                as="button"
                variant="control"
                staticSheen
                onClick={() =>
                  void navigate({ to: '/app/player', search: { state: suggestion.state } })
                }
                className={css({ border: 'none', font: 'inherit', color: 'text' })}
              >
                <span
                  className={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5',
                    px: '5',
                    py: '2.5',
                    fontSize: 'callout',
                    fontWeight: '600',
                  })}
                >
                  Begin
                  <ArrowIcon />
                </span>
              </LiquidGlass>
              <span
                className={`tabular ${css({
                  fontSize: 'caption',
                  fontWeight: '500',
                  letterSpacing: '0.02em',
                  color: 'rgba(235,235,248,0.62)',
                })}`}
              >
                {daily.band} · {dailyMinutes} min
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Today's rings summary */}
      <section className={fadeUp} style={{ animationDelay: '160ms' }}>
        <LiquidGlass
          as="button"
          variant="card"
          onClick={() => void navigate({ to: '/app/progress' })}
          className={css({
            display: 'block',
            width: '100%',
            border: 'none',
            font: 'inherit',
            color: 'inherit',
            textAlign: 'left',
            cursor: 'pointer',
            mb: '8',
          })}
        >
          <div className={css({ display: 'flex', alignItems: 'center', gap: '5', px: '5', py: '5' })}>
            <SmartSoundRings
              variant="compact"
              size={92}
              attune={{ progress: todaySessions / ATTUNE_GOAL, value: todaySessions, goal: ATTUNE_GOAL }}
              minutes={{ progress: todayMinutes / MINUTES_GOAL, value: todayMinutes, goal: MINUTES_GOAL }}
              streak={{ progress: streakDays / STREAK_GOAL, value: streakDays, goal: STREAK_GOAL }}
            />
            <div className={css({ flex: '1', minW: '0' })}>
              <p className={css({ m: '0', fontSize: 'headline', fontWeight: '600', color: 'text' })}>
                Today&rsquo;s rhythm
              </p>
              <p
                className={`tabular ${css({
                  m: '0',
                  mt: '1',
                  fontSize: 'footnote',
                  color: 'muted',
                })}`}
              >
                Attune {todaySessions}/{ATTUNE_GOAL} · {todayMinutes}/{MINUTES_GOAL} min · {streakDays}-day streak
              </p>
              <p
                className={css({
                  m: '0',
                  mt: '0.5',
                  fontSize: 'caption2',
                  fontWeight: '500',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  color: 'faint',
                })}
              >
                Sample data
              </p>
            </div>
            <span aria-hidden className={css({ color: 'faint', lineHeight: '0' })}>
              <ChevronIcon />
            </span>
          </div>
        </LiquidGlass>
      </section>

      {/* Recommended rail */}
      <section className={fadeUp} style={{ animationDelay: '260ms' }}>
        <h2
          className={css({
            m: '0',
            mb: '3',
            fontFamily: 'display',
            fontSize: 'title3',
            fontWeight: '600',
            letterSpacing: '-0.01em',
            color: 'text',
          })}
        >
          Recommended for now
        </h2>
        <Rail>
          {recommended.map((scenario, i) => (
            <div key={scenario.id} className={css({ width: '196px', flexShrink: '0' })}>
              <SessionCard
                state={scenario.state}
                title={scenario.title.split(' · ')[0]}
                meta={`${scenario.band} · ${scenario.minutes} min`}
                height="172px"
                delayMs={320 + i * 70}
              />
            </div>
          ))}
        </Rail>
      </section>
    </>
  )
}
