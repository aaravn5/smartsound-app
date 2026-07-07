import { css, cx } from 'styled-system/css'
import type { NatureSceneId } from '~/lib/nature-assets'

/**
 * ProceduralScene — was the fully code-drawn dark landscape (ridges, treeline,
 * water, drifting mist, star field). On the flat Desktop.fm canvas there is no
 * landscape: this now renders the plain calming light-grey surface with a
 * whisper of the single calming-blue accent, matching every other scene layer.
 *
 * The public API (`id`, `className`) and the `data-procedural-scene` hook are
 * unchanged so callers and tests keep working.
 */

const CANVAS_BASE = '#f1f2f3'
const SIGNAL = '#5872e6'

export interface ProceduralSceneProps {
  id: NatureSceneId
  className?: string
}

export function ProceduralScene({ id, className }: ProceduralSceneProps) {
  return (
    <div
      aria-hidden
      className={cx(css({ position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' }), className)}
      data-procedural-scene={id}
      style={{
        background:
          `radial-gradient(ellipse 130% 72% at 50% -10%, color-mix(in oklab, ${SIGNAL} 10%, ${CANVAS_BASE}) 0%, ${CANVAS_BASE} 58%), ${CANVAS_BASE}`,
      }}
    />
  )
}
