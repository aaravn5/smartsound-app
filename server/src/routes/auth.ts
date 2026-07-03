/**
 * Google + Apple OAuth (§3 of the goal doc), via `arctic`.
 *
 * Flow (both providers): `/api/auth/:provider` sets a short-lived, httpOnly
 * `oauth_state` (+ `oauth_verifier` for Google's PKCE) cookie and redirects to
 * the provider. `/api/auth/:provider/callback` validates `state`, exchanges
 * the code, decodes the id token for `sub`/`email`, upserts the user, issues
 * a signed session cookie (see `session.ts`), and redirects back to the SPA.
 *
 * Both routes 503 with `{error:'not_configured', missing:[...]}` until real
 * credentials are set — see `.env.example` and `middleware/require-config.ts`.
 */

import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { Apple, Google, OAuth2RequestError, decodeIdToken, generateCodeVerifier, generateState } from 'arctic'
import { z } from 'zod'
import { appleConfig, env, googleConfig } from '../env.js'
import { requireConfig } from '../middleware/require-config.js'
import { upsertUser } from '../db.js'
import { issueSession, clearSession } from '../session.js'
import type { AppEnv } from '../hono-app.js'

export const authRoutes = new Hono<AppEnv>()

const STATE_COOKIE = 'oauth_state'
const VERIFIER_COOKIE = 'oauth_verifier'
const OAUTH_COOKIE_TTL_SEC = 10 * 60

/** Minimal shape we rely on from Google/Apple's OIDC id_token — everything else is ignored. */
const idTokenClaims = z.object({
  sub: z.string(),
  email: z.string().email().optional(),
})

function googleClient(): Google {
  const { clientId, clientSecret, redirectUri } = googleConfig()
  return new Google(clientId, clientSecret, redirectUri)
}

function appleClient(): Apple {
  const { clientId, teamId, keyId, privateKey, redirectUri } = appleConfig()
  return new Apple(clientId, teamId, keyId, new TextEncoder().encode(privateKey), redirectUri)
}

function frontendRedirect(path = '/'): string {
  return `${env.PUBLIC_ORIGIN}${path}`
}

// ---------------------------------------------------------------------------
// Google
// ---------------------------------------------------------------------------

authRoutes.get('/google', requireConfig('google'), async (c) => {
  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  setCookie(c, STATE_COOKIE, state, { httpOnly: true, path: '/', maxAge: OAUTH_COOKIE_TTL_SEC, sameSite: 'Lax' })
  setCookie(c, VERIFIER_COOKIE, codeVerifier, {
    httpOnly: true,
    path: '/',
    maxAge: OAUTH_COOKIE_TTL_SEC,
    sameSite: 'Lax',
  })
  const url = googleClient().createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email'])
  return c.redirect(url.toString())
})

authRoutes.get('/google/callback', requireConfig('google'), async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const storedState = getCookie(c, STATE_COOKIE)
  const codeVerifier = getCookie(c, VERIFIER_COOKIE)
  deleteCookie(c, STATE_COOKIE, { path: '/' })
  deleteCookie(c, VERIFIER_COOKIE, { path: '/' })

  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    return c.json({ error: 'invalid_oauth_state' }, 400)
  }

  try {
    const tokens = await googleClient().validateAuthorizationCode(code, codeVerifier)
    const claims = idTokenClaims.parse(decodeIdToken(tokens.idToken()))
    const user = upsertUser('google', claims.sub, claims.email ?? null)
    await issueSession(c, user.id)
    return c.redirect(frontendRedirect('/app'))
  } catch (err) {
    if (err instanceof OAuth2RequestError) {
      return c.json({ error: 'oauth_error', description: err.description }, 400)
    }
    return c.json({ error: 'oauth_error' }, 400)
  }
})

// ---------------------------------------------------------------------------
// Apple ("Sign in with Apple", web)
// ---------------------------------------------------------------------------

authRoutes.get('/apple', requireConfig('apple'), async (c) => {
  const state = generateState()
  setCookie(c, STATE_COOKIE, state, { httpOnly: true, path: '/', maxAge: OAUTH_COOKIE_TTL_SEC, sameSite: 'Lax' })
  const url = appleClient().createAuthorizationURL(state, ['name', 'email'])
  // Apple requires form_post response mode whenever scopes are requested.
  url.searchParams.set('response_mode', 'form_post')
  return c.redirect(url.toString())
})

/** Apple POSTs here (`response_mode=form_post`) with a `code`/`state` form body. */
authRoutes.post('/apple/callback', requireConfig('apple'), async (c) => {
  const body = await c.req.parseBody()
  const code = typeof body.code === 'string' ? body.code : undefined
  const state = typeof body.state === 'string' ? body.state : undefined
  const storedState = getCookie(c, STATE_COOKIE)
  deleteCookie(c, STATE_COOKIE, { path: '/' })

  if (!code || !state || !storedState || state !== storedState) {
    return c.json({ error: 'invalid_oauth_state' }, 400)
  }

  try {
    const tokens = await appleClient().validateAuthorizationCode(code)
    const claims = idTokenClaims.parse(decodeIdToken(tokens.idToken()))
    // On first consent only, Apple also posts a `user` field with name JSON — email is
    // already in the id token (real address, or a stable @privaterelay.appleid.com alias).
    const user = upsertUser('apple', claims.sub, claims.email ?? null)
    await issueSession(c, user.id)
    return c.redirect(frontendRedirect('/app'))
  } catch (err) {
    if (err instanceof OAuth2RequestError) {
      return c.json({ error: 'oauth_error', description: err.description }, 400)
    }
    return c.json({ error: 'oauth_error' }, 400)
  }
})

// ---------------------------------------------------------------------------
// Logout — always available, no secret required.
// ---------------------------------------------------------------------------

authRoutes.post('/logout', async (c) => {
  await clearSession(c)
  return c.json({ ok: true })
})
