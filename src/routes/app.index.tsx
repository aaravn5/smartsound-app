import { useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { css } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { LivingScene } from '~/design/LivingScene'
import { SmartSoundRings } from '~/design/SmartSoundRings'
import { useClickSound } from '~/lib/click-sound'
import { useMainScrollRef } from '~/lib/scroll-context'
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

/**
 * Today — the Calm "Daily" home. A sticky-scroll surface (Calm/Endel-style):
 * the immersive LivingScene hero pins in place while the day's content —
 * rhythm rings, the recommended rail — glides up over it on a Liquid Glass
 * shelf. The pinned scene answers scroll with a gentle parallax (drift, fade,
 * scale) so it reads as a real depth layer, not a background image; the
 * shelf's own sections reveal as they enter view, calm and unhurried.
 *
 * `useScroll` needs the actual scrolling ancestor — the shell's single
 * `<main>` (see `lib/scroll-context.tsx`), never the window, which never
 * scrolls in this shell. Under `prefers-reduced-motion` the hero is a plain,
 * static block in normal flow: no pin, no parallax, no scroll-linked reveal.
 */
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

// Scroll-linked reveal — a short, calm rise-and-fade as a section enters
// view. Disabled entirely under reduced motion (sections just render still).
const CALM_EASE = [0.16, 1, 0.3, 1] as const

function TodayScreen() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  const reduceMotion = useReducedMotion()
  const mainRef = useMainScrollRef()

  const stageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: stageRef,
    container: mainRef ?? undefined,
    offset: ['start start', 'end start'],
  })
  // Gentle parallax: the pinned scene drifts a little slower than the
  // content sliding over it, dims, and breathes outward — never a hard cut.
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 28])
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.06])
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.6, 0.32])
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

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

  const reveal = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '0px 0px -80px 0px' },
        transition: { duration: 0.7, ease: CALM_EASE },
      }

  return (
    <>
      <ScreenTitle caption={todayCaption()} title={greeting()} />

      {/* Sticky stage — the hero pins while the shelf below glides over it.
          Reduced motion collapses this back to a plain, non-sticky block. */}
      <div
        ref={stageRef}
        className={css({ position: 'relative', mb: '8' })}
        style={reduceMotion ? undefined : { height: 'calc(60vh + 220px)', minHeight: '600px' }}
      >
        <div
          className={css({
            borderRadius: 'card',
            overflow: 'hidden',
          })}
          style={
            reduceMotion
              ? { height: '392px' }
              : {
                  position: 'sticky',
                  top: 'calc(env(safe-area-inset-top) + 8px)',
                  height: '60vh',
                  minHeight: '380px',
                  maxHeight: '620px',
                }
          }
        >
          <motion.div
            aria-hidden
            className={css({ position: 'absolute', inset: '0' })}
            style={reduceMotion ? undefined : { y: sceneY, scale: sceneScale, opacity: sceneOpacity }}
          >
            <LivingScene variant={STATE_SCENE[suggestion.state]} />
          </motion.div>

          <motion.div
            className={css({
              position: 'relative',
              zIndex: '1',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              p: '5',
            })}
            style={reduceMotion ? undefined : { opacity: overlayOpacity }}
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
                onClick={() => {
                  playClick('primary')
                  void navigate({ to: '/app/player', search: { state: suggestion.state } })
                }}
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
          </motion.div>
        </div>
      </div>

      {/* The shelf — rings + rail glide up over the pinned scene as you scroll. */}
      <motion.section {...reveal}>
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
      </motion.section>

      <motion.section {...reveal} transition={reduceMotion ? undefined : { duration: 0.7, ease: CALM_EASE, delay: 0.08 }}>
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
                delayMs={reduceMotion ? 0 : 320 + i * 70}
              />
            </div>
          ))}
        </Rail>
      </motion.section>
    </>
  )
}
