/**
 * Typed fetch client for the SmartSound backend scaffold (`server/`, §5 of
 * SMARTSOUND-V2-GOAL.md). NOT wired into any screen yet — that's a later
 * milestone (§8, milestones 3–5): auth gating, replacing the localStorage
 * `useDailyUsage` stub in `entitlements.ts` with real server calls, and the
 * paywall/billing screens. This module only needs to compile and match the
 * server's route contracts (`server/src/routes/*`) so that wiring is a
 * drop-in later.
 *
 * Requests are same-origin (`/api/...`) — in production the reverse proxy
 * routes `/api/*` to the backend (see `server/README.md`); in dev, point
 * Vite's dev server proxy at `http://localhost:8787` or run both on the same
 * origin. Every request sends cookies (`credentials: 'include'`) since auth
 * is a signed httpOnly session cookie, not a bearer token.
 */

import type { Plan } from './entitlements'

const API_BASE = '/api'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

/** True when the failure was a `503 {error:'not_configured'}` — a secret hasn't been set yet, not a real error. */
export function isNotConfigured(err: unknown): err is ApiError & { body: { missing: string[] } } {
  return err instanceof ApiError && err.status === 503 && isRecord(err.body) && err.body.error === 'not_configured'
}

/** True when a session-start attempt hit the Free-tier daily cap (§4.3) — the caller should route to the paywall. */
export function isCapReached(err: unknown): boolean {
  return err instanceof ApiError && err.status === 402 && isRecord(err.body) && err.body.reason === 'cap'
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  const contentType = res.headers.get('content-type') ?? ''
  const body: unknown = contentType.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) throw new ApiError(res.status, body)
  return body as T
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Navigate the browser here (`window.location.href = loginUrl('google')`) to start the OAuth flow. */
export function loginUrl(provider: 'google' | 'apple'): string {
  return `${API_BASE}/auth/${provider}`
}

export function logout(): Promise<{ ok: true }> {
  return request('/auth/logout', { method: 'POST' })
}

// ---------------------------------------------------------------------------
// /api/me
// ---------------------------------------------------------------------------

export interface MeResponse {
  user: { id: string; email: string | null; provider: 'google' | 'apple'; createdAt: string }
  plan: Plan
  usage: { minutesToday: number; sessionsToday: number; capReached: boolean }
}

export function getMe(): Promise<MeResponse> {
  return request('/me')
}

// ---------------------------------------------------------------------------
// /api/usage, /api/session/*
// ---------------------------------------------------------------------------

export interface UsageResponse {
  minutesToday: number
  sessionsToday: number
}

export function getUsage(): Promise<UsageResponse> {
  return request('/usage')
}

export interface SessionStartResponse {
  sessionId: string
  startedAt: string
}

/** Throws `ApiError` (check `isCapReached`) when a Free-plan user has hit today's cap. */
export function startSession(state: string): Promise<SessionStartResponse> {
  return request('/session/start', { method: 'POST', body: JSON.stringify({ state }) })
}

export interface ArousalSamplePoint {
  /** Seconds since session start. */
  t: number
  /** 0..1 arousal index — only the derived scalar, never raw frames (§5 privacy). */
  arousal: number
}

export interface SessionEndInput {
  sessionId: string
  minutes: number
  arousalSamples?: ArousalSamplePoint[]
}

export interface SessionEndResponse {
  session: { id: string; state: string; startedAt: string; endedAt: string | null; minutes: number | null }
  usage: UsageResponse
}

export function endSession(input: SessionEndInput): Promise<SessionEndResponse> {
  return request('/session/end', { method: 'POST', body: JSON.stringify(input) })
}

// ---------------------------------------------------------------------------
// /api/insights
// ---------------------------------------------------------------------------

export interface InsightsResponse {
  streakDays: number
  weeklyMinutes: { date: string; minutes: number }[]
  timeInState: Record<string, number>
  recentSessions: {
    id: string
    state: string
    startedAt: string
    endedAt: string | null
    minutes: number | null
  }[]
  arousalCurve: ArousalSamplePoint[]
  /** True on Free plan — history was capped to the last 3 sessions (§4.1). */
  historyTruncated: boolean
}

export function getInsights(): Promise<InsightsResponse> {
  return request('/insights')
}

// ---------------------------------------------------------------------------
// /api/billing/*
// ---------------------------------------------------------------------------

export interface CheckoutInput {
  plan: Extract<Plan, 'pro' | 'studio'>
  interval: 'month' | 'year'
}

export interface CheckoutResponse {
  /** Redirect the browser here to complete Stripe Checkout. */
  url: string
}

export function billingCheckout(input: CheckoutInput): Promise<CheckoutResponse> {
  return request('/billing/checkout', { method: 'POST', body: JSON.stringify(input) })
}

export function billingPortal(): Promise<CheckoutResponse> {
  return request('/billing/portal', { method: 'POST' })
}

// ---------------------------------------------------------------------------
// /api/account/*
// ---------------------------------------------------------------------------

export function exportAccount(): Promise<unknown> {
  return request('/account/export')
}

export function deleteAccount(): Promise<{ ok: true }> {
  return request('/account/delete', { method: 'POST' })
}
