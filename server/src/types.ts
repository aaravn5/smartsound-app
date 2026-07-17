/** Shared domain types. `Plan` mirrors the frontend's `src/lib/entitlements.ts`. */

export type Plan = 'free' | 'pro' | 'studio'

export type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled'

/** Free tier limits (§4.1/§4.3 of the goal doc) — the server is the source of truth. */
export const FREE_DAILY_MIN = 20
export const FREE_DAILY_SESSIONS = 1

export interface User {
  id: string
  provider: 'google' | 'apple'
  provider_id: string
  email: string | null
  created_at: string
}

export interface Subscription {
  user_id: string
  plan: Plan
  status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_sub_id: string | null
  current_period_end: string | null
}

export interface UsageDaily {
  user_id: string
  date: string
  minutes: number
  sessions: number
}

export type SessionState = 'winddown' | 'settled' | 'focus' | 'elevated' | 'calm' | 'flow' | 'sleep'

export interface SessionLog {
  id: string
  user_id: string
  state: string
  started_at: string
  ended_at: string | null
  minutes: number | null
}

export interface ArousalSample {
  session_id: string
  t: number
  arousal: number
}
