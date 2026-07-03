import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { Scene, type SceneVariant } from '~/design/Scene'
import type { TargetState } from '~/engine/audio/types'

/**
 * SessionCard — the small immersive Scene tile shared by Today's rails and
 * Explore's library: full-bleed gradient imagery with a Liquid Glass label
 * chip floating near the bottom edge. The whole tile is a single tap target
 * that starts the mapped engine state in the player.
 */

/** One calm Scene per engine state — the visual vocabulary Today + Explore share. */
export const STATE_SCENE: Record<TargetState, SceneVariant> = {
  focus: 'ocean',
  flow: 'aurora',
  calm: 'dusk',
  winddown: 'dawn',
  sleep: 'dusk',
}

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
      className={cx(
        css({
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
          scrollSnapAlign: 'start',
          animation: 'fadeUp token(durations.calm) token(easings.enter) both',
          transition: 'transform token(durations.quick) token(easings.calm)',
          _active: { transform: 'scale(0.975)' },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            transition: 'none',
            _active: { transform: 'none' },
          },
        }),
        className,
      )}
      style={{ height, animationDelay: `${delayMs}ms` }}
    >
      <Scene variant={STATE_SCENE[state]} />
      <div
        className={css({
          position: 'absolute',
          insetX: '3',
          bottom: '3',
          zIndex: '1',
        })}
      >
        <LiquidGlass variant="card" staticSheen>
          <div className={css({ px: '3', py: '2.5' })}>
            <p
              className={css({
                m: '0',
                fontSize: 'headline',
                fontWeight: '700',
                letterSpacing: '-0.01em',
                lineHeight: '1.2',
                color: 'text',
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
                mt: '1',
                fontSize: 'caption2',
                fontWeight: '500',
                letterSpacing: '0.02em',
                lineHeight: '1.35',
                color: 'faint',
                lineClamp: '2',
              })}`}
            >
              {meta}
            </p>
          </div>
        </LiquidGlass>
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
