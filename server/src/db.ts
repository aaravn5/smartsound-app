/**
 * Persistence layer.
 *
 * Uses Node's built-in `node:sqlite` (stable since Node 22.5, still flagged
 * "experimental" by the type defs) rather than `better-sqlite3`. Reason: this
 * environment has no C/C++ toolchain (no gcc/g++/make), so `better-sqlite3`'s
 * native addon cannot compile here. `node:sqlite`'s `DatabaseSync` ships as
 * part of Node itself (no native build step) and exposes a synchronous API
 * that is nearly a drop-in match for `better-sqlite3` (`prepare().run/get/all`),
 * so swapping back is a small, isolated change if a future deploy target
 * prefers it — everything outside this file talks to the small helper API
 * below, never to `DatabaseSync` directly.
 *
 * Schema covers §5 of the goal doc: users, auth_sessions, subscriptions,
 * usage_daily, session_logs, arousal_samples. Only derived scalars are ever
 * persisted for biometrics (arousal index) — never raw video/frames.
 */

import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { env } from './env.js'
import type { ArousalSample, Plan, SessionLog, Subscription, SubscriptionStatus, UsageDaily, User } from './types.js'

const dbPath = env.DB_PATH === ':memory:' ? ':memory:' : resolve(process.cwd(), env.DB_PATH)
if (dbPath !== ':memory:') {
  mkdirSync(dirname(dbPath), { recursive: true })
}

export const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA foreign_keys = ON;')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  provider     TEXT NOT NULL,
  provider_id  TEXT NOT NULL,
  email        TEXT,
  created_at   TEXT NOT NULL,
  UNIQUE(provider, provider_id)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL DEFAULT 'free',
  status               TEXT NOT NULL DEFAULT 'inactive',
  stripe_customer_id   TEXT,
  stripe_sub_id        TEXT,
  current_period_end   TEXT
);

CREATE TABLE IF NOT EXISTS usage_daily (
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date      TEXT NOT NULL,
  minutes   REAL NOT NULL DEFAULT 0,
  sessions  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS session_logs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state       TEXT NOT NULL,
  started_at  TEXT NOT NULL,
  ended_at    TEXT,
  minutes     REAL
);
CREATE INDEX IF NOT EXISTS idx_session_logs_user ON session_logs(user_id);

CREATE TABLE IF NOT EXISTS arousal_samples (
  session_id  TEXT NOT NULL REFERENCES session_logs(id) ON DELETE CASCADE,
  t           REAL NOT NULL,
  arousal     REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_arousal_samples_session ON arousal_samples(session_id);
`)

// ---------------------------------------------------------------------------
// Small typed helpers. Everything else in the server talks to these, not to
// `db.prepare(...)` directly, so the storage engine stays swappable.
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString()
}

/** Local YYYY-MM-DD — usage resets at local midnight (matches the frontend stub's convention). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function upsertUser(provider: 'google' | 'apple', providerId: string, email: string | null): User {
  const existing = db
    .prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?')
    .get(provider, providerId) as User | undefined
  if (existing) {
    if (email && email !== existing.email) {
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, existing.id)
      return { ...existing, email }
    }
    return existing
  }
  const id = randomUUID()
  const created_at = nowIso()
  db.prepare('INSERT INTO users (id, provider, provider_id, email, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id,
    provider,
    providerId,
    email,
    created_at,
  )
  db.prepare(
    'INSERT INTO subscriptions (user_id, plan, status) VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING',
  ).run(id, 'free', 'inactive')
  return { id, provider, provider_id: providerId, email, created_at }
}

export function getUserById(id: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined
}

export function createAuthSession(userId: string, ttlMs: number): { id: string; expiresAt: string } {
  const id = randomUUID()
  const expiresAt = new Date(Date.now() + ttlMs).toISOString()
  db.prepare('INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expiresAt)
  return { id, expiresAt }
}

export function getAuthSession(id: string): { id: string; user_id: string; expires_at: string } | undefined {
  const row = db.prepare('SELECT * FROM auth_sessions WHERE id = ?').get(id) as
    | { id: string; user_id: string; expires_at: string }
    | undefined
  if (!row) return undefined
  if (new Date(row.expires_at).getTime() < Date.now()) {
    deleteAuthSession(id)
    return undefined
  }
  return row
}

export function deleteAuthSession(id: string): void {
  db.prepare('DELETE FROM auth_sessions WHERE id = ?').run(id)
}

export function deleteAuthSessionsForUser(userId: string): void {
  db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId)
}

export function getSubscription(userId: string): Subscription {
  const row = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId) as Subscription | undefined
  return row ?? { user_id: userId, plan: 'free', status: 'inactive', stripe_customer_id: null, stripe_sub_id: null, current_period_end: null }
}

export function upsertSubscriptionByStripeCustomer(
  stripeCustomerId: string,
  patch: Partial<Pick<Subscription, 'plan' | 'status' | 'stripe_sub_id' | 'current_period_end'>>,
): void {
  const row = db.prepare('SELECT user_id FROM subscriptions WHERE stripe_customer_id = ?').get(stripeCustomerId) as
    | { user_id: string }
    | undefined
  if (!row) return // webhook arrived for a customer we don't recognize yet — ignore, nothing to link to
  const current = getSubscription(row.user_id)
  const next = { ...current, ...patch }
  db.prepare(
    'UPDATE subscriptions SET plan = ?, status = ?, stripe_sub_id = ?, current_period_end = ? WHERE user_id = ?',
  ).run(next.plan, next.status, next.stripe_sub_id, next.current_period_end, row.user_id)
}

export function attachStripeCustomer(userId: string, stripeCustomerId: string): void {
  db.prepare('UPDATE subscriptions SET stripe_customer_id = ? WHERE user_id = ?').run(stripeCustomerId, userId)
}

export function setSubscriptionPlan(userId: string, plan: Plan, status: SubscriptionStatus): void {
  db.prepare('UPDATE subscriptions SET plan = ?, status = ? WHERE user_id = ?').run(plan, status, userId)
}

export function getUsageToday(userId: string, date = localDateKey()): UsageDaily {
  const row = db.prepare('SELECT * FROM usage_daily WHERE user_id = ? AND date = ?').get(userId, date) as
    | UsageDaily
    | undefined
  return row ?? { user_id: userId, date, minutes: 0, sessions: 0 }
}

export function recordSessionStart(userId: string, date = localDateKey()): UsageDaily {
  db.prepare(
    `INSERT INTO usage_daily (user_id, date, minutes, sessions) VALUES (?, ?, 0, 1)
     ON CONFLICT(user_id, date) DO UPDATE SET sessions = sessions + 1`,
  ).run(userId, date)
  return getUsageToday(userId, date)
}

export function addUsageMinutes(userId: string, minutes: number, date = localDateKey()): UsageDaily {
  db.prepare(
    `INSERT INTO usage_daily (user_id, date, minutes, sessions) VALUES (?, ?, ?, 0)
     ON CONFLICT(user_id, date) DO UPDATE SET minutes = minutes + excluded.minutes`,
  ).run(userId, date, minutes)
  return getUsageToday(userId, date)
}

export function createSessionLog(userId: string, state: string): SessionLog {
  const id = randomUUID()
  const started_at = nowIso()
  db.prepare('INSERT INTO session_logs (id, user_id, state, started_at) VALUES (?, ?, ?, ?)').run(
    id,
    userId,
    state,
    started_at,
  )
  return { id, user_id: userId, state, started_at, ended_at: null, minutes: null }
}

export function endSessionLog(id: string, userId: string, minutes: number): SessionLog | undefined {
  const ended_at = nowIso()
  db.prepare('UPDATE session_logs SET ended_at = ?, minutes = ? WHERE id = ? AND user_id = ?').run(
    ended_at,
    minutes,
    id,
    userId,
  )
  return db.prepare('SELECT * FROM session_logs WHERE id = ?').get(id) as SessionLog | undefined
}

export function getSessionLog(id: string, userId: string): SessionLog | undefined {
  return db.prepare('SELECT * FROM session_logs WHERE id = ? AND user_id = ?').get(id, userId) as
    | SessionLog
    | undefined
}

export function insertArousalSamples(sessionId: string, samples: readonly { t: number; arousal: number }[]): void {
  if (samples.length === 0) return
  const stmt = db.prepare('INSERT INTO arousal_samples (session_id, t, arousal) VALUES (?, ?, ?)')
  db.exec('BEGIN')
  try {
    for (const s of samples) stmt.run(sessionId, s.t, s.arousal)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export function listSessionLogs(userId: string, limit = 50): SessionLog[] {
  return db
    .prepare('SELECT * FROM session_logs WHERE user_id = ? ORDER BY started_at DESC LIMIT ?')
    .all(userId, limit) as unknown as SessionLog[]
}

export function listArousalSamples(sessionId: string): ArousalSample[] {
  return db.prepare('SELECT * FROM arousal_samples WHERE session_id = ? ORDER BY t ASC').all(sessionId) as unknown as ArousalSample[]
}

export function listUsageRange(userId: string, sinceDate: string): UsageDaily[] {
  return db
    .prepare('SELECT * FROM usage_daily WHERE user_id = ? AND date >= ? ORDER BY date ASC')
    .all(userId, sinceDate) as unknown as UsageDaily[]
}

/** Full account export (§4.1 Studio export / §5 account/export) — every row this user owns. */
export function exportUserData(userId: string) {
  const user = getUserById(userId)
  const subscription = getSubscription(userId)
  const usage = db.prepare('SELECT * FROM usage_daily WHERE user_id = ? ORDER BY date ASC').all(userId) as unknown as UsageDaily[]
  const sessions = listSessionLogs(userId, 100000)
  const arousal = sessions.flatMap((s) => listArousalSamples(s.id))
  return { user, subscription, usage, sessions, arousal }
}

/** Deletes the user and everything referencing them (cascades via FKs). */
export function deleteUserData(userId: string): void {
  db.prepare('DELETE FROM users WHERE id = ?').run(userId)
}
