/**
 * Session cookie helpers.
 *
 * The cookie itself only ever holds the opaque `auth_sessions.id` — Hono's
 * `setSignedCookie`/`getSignedCookie` (HMAC-SHA256 under the hood, keyed by
 * `SESSION_SECRET`) guarantees the value can't be forged or tampered with in
 * transit, and the DB row is still the source of truth for expiry/revocation
 * (logout deletes the row, so a still-validly-signed cookie stops working).
 */

import type { Context } from 'hono'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import { env } from './env.js'
import { createAuthSession, deleteAuthSession, getAuthSession, getUserById } from './db.js'
import type { User } from './types.js'

export const SESSION_COOKIE = 'ss_session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function issueSession(c: Context, userId: string): Promise<void> {
  const { id } = createAuthSession(userId, SESSION_TTL_MS)
  await setSignedCookie(c, SESSION_COOKIE, id, env.SESSION_SECRET, {
    httpOnly: true,
    secure: env.PUBLIC_ORIGIN.startsWith('https://'),
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

/** Resolves the current request's session to a user, or `undefined` if signed out / expired / tampered. */
export async function currentUser(c: Context): Promise<User | undefined> {
  const sessionId = await getSignedCookie(c, env.SESSION_SECRET, SESSION_COOKIE)
  if (!sessionId) return undefined
  const session = getAuthSession(sessionId)
  if (!session) return undefined
  return getUserById(session.user_id)
}

export async function clearSession(c: Context): Promise<void> {
  const sessionId = await getSignedCookie(c, env.SESSION_SECRET, SESSION_COOKIE)
  if (sessionId) deleteAuthSession(sessionId)
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}
