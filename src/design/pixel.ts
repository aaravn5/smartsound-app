import type { SystemStyleObject } from 'styled-system/types'

/**
 * Pixelation utilities (§1.3) — the shared material behind every pixel-assemble
 * / pixel-dissolve moment in the app and landing. `--pixel-size` (4px) is the
 * one grid every effect snaps to, so they all read as the same material.
 */

export interface PixelPoint {
  x: number
  y: number
}

export interface DrawPixelAssembleOptions {
  ctx: CanvasRenderingContext2D
  /** Target points the pixels converge onto, in canvas coordinates. */
  points: readonly PixelPoint[]
  /** 0 = fully scattered, 1 = fully assembled. */
  progress: number
  color: string
  /** Grid size in px — defaults to the shared 4px `--pixel-size`. */
  pixel?: number
  /** Max scatter distance (px) at progress 0. */
  scatter?: number
  /** Deterministic per-point noise in [0, 1); defaults to a stable hash. */
  seed?: (i: number) => number
}

/** Deterministic per-index scatter so a replayed assemble looks identical each time. */
const defaultSeed = (i: number): number => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return s - Math.floor(s)
}

/** Damped ease-out — matches `--ease-calm`-style settling, never linear. */
export function easePixel(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return 1 - Math.pow(1 - c, 3)
}

/**
 * Draw a pixel-assemble/dissolve frame for an arbitrary set of target points:
 * at `progress` 0 the points are scattered 4px squares, converging as
 * `progress` → 1. Reverse the progress input to play a dissolve instead.
 */
export function drawPixelAssemble(options: DrawPixelAssembleOptions): void {
  const { ctx, points, progress, color, pixel = 4, scatter = 140, seed = defaultSeed } = options
  const p = easePixel(progress)
  ctx.save()
  ctx.fillStyle = color
  for (let i = 0; i < points.length; i++) {
    const pt = points[i]
    const rx = (seed(i * 2) - 0.5) * 2
    const ry = (seed(i * 2 + 1) - 0.5) * 2
    const off = (1 - p) * scatter
    const x = pt.x + rx * off
    const y = pt.y + ry * off
    const gx = Math.round(x / pixel) * pixel
    const gy = Math.round(y / pixel) * pixel
    ctx.globalAlpha = 0.2 + 0.8 * p
    ctx.fillRect(gx - pixel / 2, gy - pixel / 2, pixel, pixel)
  }
  ctx.restore()
}

/** Fill an arbitrary w×h rect with a `pixel`-spaced grid of target points. */
export function pointsForRect(width: number, height: number, pixel = 4): PixelPoint[] {
  const points: PixelPoint[] = []
  for (let y = pixel / 2; y < height; y += pixel) {
    for (let x = pixel / 2; x < width; x += pixel) {
      points.push({ x, y })
    }
  }
  return points
}

/**
 * Panda style object for a faint 4px-grid depth texture — the shared
 * pixel-noise background used behind hero/session surfaces on pure black.
 * Spread into a `css()` call: `css({ ...pixelNoise, ... })`.
 */
export const pixelNoise: SystemStyleObject = {
  position: 'absolute',
  inset: '0',
  pointerEvents: 'none',
  opacity: '0.5',
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
  backgroundSize: 'var(--pixel-size) var(--pixel-size)',
  maskImage: 'radial-gradient(120% 80% at 50% 35%, #000 30%, transparent 80%)',
}
