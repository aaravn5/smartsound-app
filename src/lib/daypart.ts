/**
 * daypart — the landing's time-of-day spine. The hero video is bright blue
 * daylight footage; SmartSound is a circadian product, so the landing must
 * not stay day-bright at midnight. One helper decides the part of day and
 * everything keys off it: the CSS grade on the video, the extra scrim tint,
 * the headline, the badge prefix and the greeting.
 */

export type Daypart = 'morning' | 'afternoon' | 'evening' | 'night'

export function daypart(date: Date = new Date()): Daypart {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 22) return 'evening'
  return 'night'
}

/** Two-line hero headline per daypart. */
export const DAYPART_HEADLINE: Record<Daypart, [string, string]> = {
  morning: ['records cut for', 'the waking mind.'],
  afternoon: ['records cut for', 'the deep worker.'],
  evening: ['records cut for', 'the calm listener.'],
  night: ['records cut for', 'the drifting off.'],
}

/** Badge prefix — "{press} · {tonight's suggested title}". */
export const DAYPART_PRESS: Record<Daypart, string> = {
  morning: 'This morning’s press',
  afternoon: 'This afternoon’s press',
  evening: 'This evening’s press',
  night: 'Tonight’s press',
}

export const DAYPART_GREETING: Record<Daypart, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  night: 'Good night',
}

/**
 * CSS filter grading the daylight footage toward the hour. Applied to the
 * boomerang media (video AND canvas — the filter sits on their shared
 * wrapper), always underneath the AA scrim gradient.
 */
export const DAYPART_GRADE: Record<Daypart, string> = {
  morning: 'none',
  afternoon: 'brightness(0.96) saturate(1.1) sepia(0.1) hue-rotate(-8deg)',
  evening: 'brightness(0.74) saturate(1.12) sepia(0.32) hue-rotate(-18deg) contrast(1.02)',
  night: 'brightness(0.45) saturate(0.62) hue-rotate(14deg) contrast(1.05)',
}

/**
 * Extra flat tint above the grade (below the text scrim) — the evening lean
 * toward amber dusk, the night lean into navy. Transparent in daylight.
 */
export const DAYPART_TINT: Record<Daypart, string> = {
  morning: 'transparent',
  afternoon: 'rgba(64, 44, 12, 0.08)',
  evening: 'rgba(38, 22, 42, 0.22)',
  night: 'rgba(6, 12, 34, 0.42)',
}
