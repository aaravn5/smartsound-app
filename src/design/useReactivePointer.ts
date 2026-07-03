import { useEffect, useRef, type MutableRefObject } from 'react'

export interface PointerCoords {
  x: number
  y: number
}

/**
 * Touch + pointer reactivity (§1.5) — normalized pointer position in [-1, 1]
 * on both axes, kept live by BOTH `pointermove` (mouse/pen) and `touchmove`
 * (the primary touch point), attached to `window` with `{ passive: true }`.
 * Every pixel field must react to finger drags on mobile, not just the mouse.
 *
 * Returns a ref rather than state: pixel fields read this every animation
 * frame (canvas/WebGL render loops), so updating it shouldn't trigger a
 * React re-render on every move.
 */
export function useReactivePointer(): MutableRefObject<PointerCoords> {
  const coords = useRef<PointerCoords>({ x: 0, y: 0 })

  useEffect(() => {
    const setFromClient = (clientX: number, clientY: number) => {
      coords.current = {
        x: (clientX / window.innerWidth) * 2 - 1,
        y: -((clientY / window.innerHeight) * 2 - 1),
      }
    }
    const onPointerMove = (e: PointerEvent) => setFromClient(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) setFromClient(touch.clientX, touch.clientY)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  return coords
}
