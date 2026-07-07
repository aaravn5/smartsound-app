import type { TargetState } from '~/engine/audio/types'

/**
 * ring-math — the pure geometry of the player's waveform ring.
 *
 * The ring around the playing record is N points radially displaced by a
 * traveling sine; its ripple travels at the record's band frequency SCALED
 * (band Hz / 10 → a visible rate), so the design itself embodies the
 * taxonomy: Beta ripples at ~1.5 Hz, Delta barely breathes at ~0.25 Hz.
 * Pure functions here so the pacing is testable without a canvas.
 */

/** Band-target modulation rate per state — matches BAND_LABEL in the catalog. */
export const STATE_HZ: Record<TargetState, number> = {
  focus: 15,
  flow: 12,
  calm: 10,
  winddown: 6,
  sleep: 2.5,
}

/** Angular lobes around the ring — how many crests are visible at once. */
export const RING_LOBES = 9

/** Visible ripple rate: band Hz scaled down by 10. */
export function rippleHz(stateHz: number): number {
  return stateHz / 10
}

/**
 * Radial displacement of the ring point at angle `theta` (rad) at time
 * `tSec`, for a band running at `stateHz`, with crest amplitude `amp` px.
 */
export function ringDisplacement(
  theta: number,
  tSec: number,
  stateHz: number,
  amp: number,
  lobes: number = RING_LOBES,
): number {
  return amp * Math.sin(lobes * theta - 2 * Math.PI * rippleHz(stateHz) * tSec)
}
