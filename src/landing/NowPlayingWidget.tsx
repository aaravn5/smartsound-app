import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Heart, SkipBack, SkipForward } from 'lucide-react'
import { css, cx } from 'styled-system/css'
import { VARIANT_IMAGE } from '~/design/Scene'
import { STATE_SCENE } from '~/components/SessionCard'
import { useEngine } from '~/lib/engine-context'
import { useClickSound } from '~/lib/click-sound'
import { useFavorites, toggleFavorite } from '~/lib/favorites'
import { readSessionStartedAt } from '~/lib/session-meta'
import { BAND_LABEL, SOUNDSCAPES } from '~/lib/catalog'
import { TARGET_STATES } from '~/engine/audio/profiles'
import { VinylDisc } from './VinylDisc'

/**
 * NowPlayingWidget — the landing's corner turntable. Rendered ONLY while
 * the engine actually has a running session (real `useEngine()` state —
 * never a fabricated demo). A dark liquid-glass card: the current mode's
 * landscape label on a spinning mini vinyl, title + band, true elapsed time
 * (session start stamped by the player), a heart persisted to
 * `ss_favorites`, and prev/next that cycle the engine state exactly like
 * the player's transport. Clicking the card opens the player.
 */

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const iconBtnCss = css({
  display: 'grid',
  placeItems: 'center',
  w: '34px',
  h: '34px',
  border: 'none',
  borderRadius: 'full',
  background: 'rgba(255,255,255,0.07)',
  color: 'rgba(255,255,255,0.9)',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 160ms ease, transform 160ms ease',
  _hover: { background: 'rgba(255,255,255,0.14)' },
  _active: { transform: 'scale(0.92)' },
})

export function NowPlayingWidget() {
  const { status, profile, selectState } = useEngine()
  const navigate = useNavigate()
  const playClick = useClickSound()
  const favorites = useFavorites()
  const running = status === 'running'

  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!running) return
    const startedAt = readSessionStartedAt() ?? Date.now()
    const tick = () => setElapsed(Date.now() - startedAt)
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [running])

  if (!running) return null

  const state = profile.key
  const title = SOUNDSCAPES.find((s) => s.state === state)?.title ?? profile.label
  const isFav = favorites.includes(state)

  const cycle = (dir: 1 | -1) => {
    playClick('tap')
    const idx = TARGET_STATES.findIndex((p) => p.key === state)
    const next = TARGET_STATES[(idx + dir + TARGET_STATES.length) % TARGET_STATES.length]
    selectState(next.key)
  }

  return (
    <aside
      data-now-playing
      className={cx(
        'liquid-glass',
        css({
          position: 'absolute',
          right: 'clamp(12px, 3vw, 32px)',
          bottom: 'calc(env(safe-area-inset-bottom) + clamp(12px, 3dvh, 28px))',
          zIndex: '20',
          borderRadius: '20px',
          width: 'min(320px, calc(100vw - 24px))',
        }),
      )}
      aria-label={`Now playing — ${title}`}
      // Inline: the unlayered .liquid-glass sets position:relative, which
      // outranks Panda's layered utilities — inline style outranks both.
      style={{ position: 'absolute' }}
    >
      <div className={css({ display: 'flex', alignItems: 'center', gap: '3', p: '3' })}>
        <button
          type="button"
          onClick={() => {
            playClick('tap')
            void navigate({ to: '/app/player' })
          }}
          aria-label={`Open the player — ${title}, ${formatElapsed(elapsed)} elapsed`}
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '3',
            flex: '1',
            minW: '0',
            p: '0',
            border: 'none',
            background: 'transparent',
            font: 'inherit',
            color: 'inherit',
            textAlign: 'left',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          })}
        >
          <span className={css({ display: 'block', flexShrink: '0' })}>
            <span className="vinyl-spin" style={{ display: 'block', animationPlayState: running ? 'running' : 'paused' }}>
              <VinylDisc labelSrc={VARIANT_IMAGE[STATE_SCENE[state]]} size={54} labelRatio={0.42} />
            </span>
          </span>
          <span className={css({ flex: '1', minW: '0' })}>
            <span className={css({ display: 'block', fontSize: 'subhead', fontWeight: '600', color: 'rgba(255,255,255,0.96)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
              {title}
            </span>
            <span className={cx('tabular', css({ display: 'block', mt: '0.5', fontSize: 'caption', color: 'rgba(235,238,250,0.68)' }))}>
              {BAND_LABEL[state]} · {formatElapsed(elapsed)}
            </span>
          </span>
        </button>

        <div className={css({ display: 'flex', alignItems: 'center', gap: '1.5', flexShrink: '0' })}>
          <button
            type="button"
            onClick={() => {
              playClick('tap')
              toggleFavorite(state)
            }}
            aria-label={isFav ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
            aria-pressed={isFav}
            className={iconBtnCss}
            style={{ color: isFav ? '#FB7185' : undefined }}
          >
            <Heart size={16} strokeWidth={2} fill={isFav ? 'currentColor' : 'none'} aria-hidden />
          </button>
          <button type="button" onClick={() => cycle(-1)} aria-label="Previous state" className={iconBtnCss}>
            <SkipBack size={15} strokeWidth={2} aria-hidden />
          </button>
          <button type="button" onClick={() => cycle(1)} aria-label="Next state" className={iconBtnCss}>
            <SkipForward size={15} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  )
}
