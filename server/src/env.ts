/**
 * Typed environment access + per-feature config gating.
 *
 * Nothing in this file throws at import time. Routes that need a secret group
 * (Google OAuth, Apple OAuth, Stripe) call `isConfigured(group)` / `missingKeys(group)`
 * and return a 503 `{ error: 'not_configured', missing: [...] }` instead of crashing
 * the process when the operator hasn't provided real secrets yet (see
 * `middleware/require-config.ts`). This lets the whole scaffold boot and serve
 * `/api/me`-style endpoints with sane "not configured" responses before any
 * OAuth/Stripe account exists.
 */

/** Secret groups, each gating one integration. Keys mirror `.env.example`. */
const CONFIG_GROUPS = {
  google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'],
  apple: ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY', 'APPLE_REDIRECT_URI'],
  stripe: [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_PRO_MONTH',
    'STRIPE_PRICE_PRO_YEAR',
    'STRIPE_PRICE_STUDIO_MONTH',
    'STRIPE_PRICE_STUDIO_YEAR',
  ],
} as const satisfies Record<string, readonly string[]>

export type ConfigGroup = keyof typeof CONFIG_GROUPS

/** Env keys required for a given integration group that are currently unset/empty. */
export function missingKeys(group: ConfigGroup): string[] {
  return CONFIG_GROUPS[group].filter((key) => !process.env[key]?.trim())
}

export function isConfigured(group: ConfigGroup): boolean {
  return missingKeys(group).length === 0
}

/** Core settings the server always needs — all have safe local-dev defaults. */
export const env = {
  PORT: Number.parseInt(process.env.PORT ?? '8787', 10),
  /** Signs the session cookie (Hono `setSignedCookie`/`getSignedCookie`). Rotate in prod. */
  SESSION_SECRET: process.env.SESSION_SECRET ?? 'dev-insecure-session-secret-change-me-before-prod',
  DB_PATH: process.env.DB_PATH ?? './data/smartsound.db',
  /** Origin the SPA is served from — used for CORS and OAuth/Stripe redirect defaults. */
  PUBLIC_ORIGIN: process.env.PUBLIC_ORIGIN ?? 'http://localhost:5173',
} as const

/** True in local dev when SESSION_SECRET hasn't been overridden — logged once at boot. */
export const usingInsecureSessionSecret = env.SESSION_SECRET === 'dev-insecure-session-secret-change-me-before-prod'

export function googleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
  }
}

export function appleConfig() {
  return {
    clientId: process.env.APPLE_CLIENT_ID ?? '',
    teamId: process.env.APPLE_TEAM_ID ?? '',
    keyId: process.env.APPLE_KEY_ID ?? '',
    // PEM PKCS8 private key. Supports literal newlines or `\n`-escaped (common in .env files).
    privateKey: (process.env.APPLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    redirectUri: process.env.APPLE_REDIRECT_URI ?? '',
  }
}

export function stripeConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    prices: {
      proMonth: process.env.STRIPE_PRICE_PRO_MONTH ?? '',
      proYear: process.env.STRIPE_PRICE_PRO_YEAR ?? '',
      studioMonth: process.env.STRIPE_PRICE_STUDIO_MONTH ?? '',
      studioYear: process.env.STRIPE_PRICE_STUDIO_YEAR ?? '',
    },
  }
}
