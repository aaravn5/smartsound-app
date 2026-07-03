/**
 * sample-stats — the ONE source for the sample practice data shown before
 * real session history exists (Milestone 4 doesn't yet persist it). Today
 * (`app.index.tsx`) and Progress (`app.progress.tsx`) both read from this
 * module so their "today" numbers — attune, minutes, streak — always agree.
 */

export interface WeeklyDatum {
  label: string
  minutes: number
}

/** A sample week, oldest first, ending in "today". */
export const WEEK_SAMPLE: WeeklyDatum[] = [
  { label: 'Mon', minutes: 18 },
  { label: 'Tue', minutes: 32 },
  { label: 'Wed', minutes: 0 },
  { label: 'Thu', minutes: 41 },
  { label: 'Fri', minutes: 27 },
  { label: 'Sat', minutes: 35 },
  { label: 'Sun', minutes: 24 },
]

/** Attune (camera-presence) sessions per day, aligned with WEEK_SAMPLE. */
export const WEEK_SESSIONS = [1, 2, 0, 2, 1, 2, 1]

// Daily goals — shared so the rings on both screens read the same targets.
export const ATTUNE_GOAL = 2
export const MINUTES_GOAL = 40
export const STREAK_GOAL = 7

export const totalMinutes = WEEK_SAMPLE.reduce((sum, d) => sum + d.minutes, 0)
export const totalSessions = WEEK_SESSIONS.reduce((sum, n) => sum + n, 0)
export const bestDay = WEEK_SAMPLE.reduce((best, d) => (d.minutes > best.minutes ? d : best), WEEK_SAMPLE[0])

export const todayMinutes = WEEK_SAMPLE[WEEK_SAMPLE.length - 1].minutes
export const todaySessions = WEEK_SESSIONS[WEEK_SESSIONS.length - 1]

function currentStreak(): number {
  let streak = 0
  for (let i = WEEK_SAMPLE.length - 1; i >= 0; i--) {
    if (WEEK_SAMPLE[i].minutes <= 0) break
    streak++
  }
  return streak
}

export const streakDays = currentStreak()
