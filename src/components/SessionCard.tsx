import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { CALM_SCRIM_CARD, VARIANT_IMAGE, type SceneVariant } from '~/design/Scene'
import type { TargetState } from '~/engine/audio/types'

/**
 * SessionCard — the Calm-style content card shared by Today's shelves and
 * Explore's library: the scene's nature photograph, CRISP and full-bleed
 * (object-fit cover, zero blur), with a bottom gradient scrim and a white
 * title sitting directly on the image. The whole tile is a single tap target
 * that opens the mapped engine state in the player. Always dark
 * (`ss-scene-dark`) in both themes — the photo is the surface.
 */

/** One nature scene per engine state — every state gets its OWN Higgsfield
 * photograph (no sharing): focus→ocean, flow→dusk hills, calm→forest,
 * winddown→dawn, sleep→aurora lake. */
export const STATE_SCENE: Record<TargetState, SceneVariant> = {
  focus: 'ocean',
  flow: 'dusk',
  calm: 'forest',
  winddown: 'dawn',
  sleep: 'aurora',
}

const cardShell = css({
  position: 'relative',
  display: 'block',
  width: '100%',
  borderRadius: 'card',
  overflow: 'hidden',
  border: 'none',
  padding: '0',
  margin: '0',
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  flexShrink: '0',
  // A dark base so the tile never flashes light while its photo loads.
  background: 'rgba(10, 18, 38, 1)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.09), 0 10px 30px rgba(3, 6, 18, 0.35)',
  scrollSnapAlign: 'start',
  animation: 'fadeUp token(durations.calm) token(easings.enter) both',
  transition: 'transform token(durations.quick) token(easings.calm)',
  _active: { transform: 'scale(0.975)' },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'none',
    _active: { transform: 'none' },
  },
})

const cardPhoto = css({
  position: 'absolute',
  inset: '0',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  pointerEvents: 'none',
})

const cardScrim = css({
  position: 'absolute',
  inset: '0',
  pointerEvents: 'none',
})

const cardLabel = css({
  position: 'absolute',
  insetX: '0',
  bottom: '0',
  px: '3.5',
  pb: '3',
  pt: '6',
})

export interface SessionCardProps {
  state: TargetState
  title: string
  meta: string
  height?: string
  delayMs?: number
  className?: string
}

export function SessionCard({
  state,
  title,
  meta,
  height = '172px',
  delayMs = 0,
  className,
}: SessionCardProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => void navigate({ to: '/app/player', search: { state } })}
      className={cx('ss-scene-dark', cardShell, className)}
      style={{ height, animationDelay: `${delayMs}ms` }}
    >
      <img
        aria-hidden
        alt=""
        loading="lazy"
        decoding="async"
        src={VARIANT_IMAGE[STATE_SCENE[state]]}
        className={cardPhoto}
      />
      <div aria-hidden className={cardScrim} style={{ background: CALM_SCRIM_CARD }} />
      <div className={cardLabel}>
        <p
          className={css({
            m: '0',
            fontSize: 'headline',
            fontWeight: '700',
            letterSpacing: '-0.01em',
            lineHeight: '1.2',
            color: 'rgba(255, 255, 255, 0.98)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          })}
        >
          {title}
        </p>
        <p
          className={`tabular ${css({
            m: '0',
            mt: '0.5',
            fontSize: 'caption',
            fontWeight: '500',
            letterSpacing: '0.02em',
            lineHeight: '1.35',
            color: 'rgba(235, 240, 252, 0.80)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          })}`}
        >
          {meta}
        </p>
      </div>
    </button>
  )
}

/** A full-bleed horizontal scroller — rail items bleed past the screen's side padding. */
export function Rail({ children }: { children: ReactNode }) {
  return (
    <div
      className={css({
        display: 'flex',
        gap: '3',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x proximity',
        pb: '1',
        mx: '-5',
        px: '5',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      })}
    >
      {children}
    </div>
  )
}
