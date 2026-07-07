# smartsound-server

Backend scaffold for SmartSound v2: Google/Apple OAuth, server-enforced usage
metering (the Free-tier 20-min/1-session daily cap), and Stripe billing
(§3, §4.3, §4.4, §5 of `SMARTSOUND-V2-GOAL.md`).

This is a **self-contained package** — its own `package.json`/`tsconfig.json` —
so none of its dependencies ever reach the SPA's Vite bundle. It's a scaffold:
it compiles cleanly and boots with zero configuration, and every route that
needs a real secret (Google/Apple/Stripe) returns `503 {error:'not_configured',
missing:[...]}` until you provide one. Nothing here talks to the live VPS or
deploys anything.

## Stack

- **Hono** — router/middleware, runs on `@hono/node-server`.
- **`node:sqlite`** (`DatabaseSync`) — not `better-sqlite3`. This build
  environment has no C/C++ toolchain (no `gcc`/`g++`/`make`), so
  `better-sqlite3`'s native addon can't compile here. Node's built-in
  `node:sqlite` needs no native build step and exposes an almost identical
  synchronous `prepare().run/get/all()` API, so `src/db.ts` is the only file
  that would need to change to swap back to `better-sqlite3` on a deploy
  target that has a compiler. See the comment at the top of `src/db.ts`.
- **zod** — request body validation.
- **stripe** — Checkout, Customer Portal, webhooks.
- **arctic** — Google + Apple OAuth clients (PKCE for Google).
- **hono/cookie** (`setSignedCookie`/`getSignedCookie`) — the httpOnly signed
  session cookie. The cookie holds only an opaque session id; the DB row is
  still the source of truth for expiry and revocation.

## Setup

```bash
cd server
npm install
cp .env.example .env
# fill in whichever secrets you have — see "Which secrets do what" below
npm run dev      # tsx watch, http://localhost:8787
```

`npm run build && npm start` for a compiled run. `npm run typecheck` runs
`tsc --noEmit` only.

The SQLite file is created (with migrations) on first boot at `DB_PATH`
(default `./data/smartsound.db`, git-ignored).

## Which secrets do what

| Group | Env keys | Unlocks |
|---|---|---|
| Core | `SESSION_SECRET`, `PUBLIC_ORIGIN`, `DB_PATH`, `PORT` | Everything — has safe localhost defaults, but **set `SESSION_SECRET` before any real deploy** (a boot-time warning fires if it's left at the insecure default). |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | `/api/auth/google`, `/api/auth/google/callback` |
| Apple | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_REDIRECT_URI` | `/api/auth/apple`, `/api/auth/apple/callback` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTH`, `STRIPE_PRICE_PRO_YEAR`, `STRIPE_PRICE_STUDIO_MONTH`, `STRIPE_PRICE_STUDIO_YEAR` | `/api/billing/checkout`, `/api/billing/portal`, `/api/billing/webhook` |

Everything else — `/api/me`, `/api/usage`, `/api/session/start`,
`/api/session/end`, `/api/insights`, `/api/account/export`,
`/api/account/delete`, `/api/auth/logout` — works with just Core configured,
since it only needs a session, not a third-party provider.

## Routes

```
GET  /api/health

GET  /api/auth/google              → redirect to Google
GET  /api/auth/google/callback
GET  /api/auth/apple               → redirect to Apple
POST /api/auth/apple/callback      (Apple posts here — response_mode=form_post)
POST /api/auth/logout

GET  /api/me                       → { user, plan, usage: { minutesToday, sessionsToday, capReached } }

GET  /api/usage                    → { minutesToday, sessionsToday }
POST /api/session/start            → 402 { error:'cap_reached', reason:'cap' } if Free cap hit
POST /api/session/end              → records minutes + arousal samples

GET  /api/insights                 → streak, weekly minutes, time-in-state, recent sessions, arousal curve

POST /api/billing/checkout         → { url } Stripe Checkout session
POST /api/billing/portal           → { url } Stripe Customer Portal session
POST /api/billing/webhook          → Stripe webhook receiver (raw body, signature-verified)

GET  /api/account/export           → full data export
POST /api/account/delete           → deletes the user + everything referencing them
```

`/api/me`, `/api/usage`, `/api/session/*`, `/api/insights`, `/api/billing/*`
(except `/webhook`), and `/api/account/*` all require a session (401 if
signed out).

## Free-tier cap enforcement (§4.3)

`FREE_DAILY_MIN = 20`, `FREE_DAILY_SESSIONS = 1` (`src/types.ts`). `POST
/api/session/start` checks `usage_daily` for the caller's local date and
returns `402 {reason:'cap'}` before creating a session if a Free-plan user
has already used their one session or 20 minutes today. This is enforced
server-side regardless of what the client sends — the frontend's
`src/lib/entitlements.ts` stub is UX-only and must eventually be replaced by
calls into this API (a later milestone; `src/lib/api.ts` in the SPA already
has the typed client for it).

## Production: reverse proxy + persistence

Build the SPA (`npm run build` at the repo root → `dist/`) and this server
(`npm run build` here → `dist/`), run the server as a small Node process, and
put a reverse proxy in front that serves the SPA's static files and forwards
`/api/*` to the Node process.

**Caddy** (`Caddyfile`):

```caddyfile
smartsound.example.com {
    root * /var/www/smartsound/dist
    file_server
    handle /api/* {
        reverse_proxy 127.0.0.1:8787
    }
    try_files {path} /index.html
}
```

**nginx**:

```nginx
server {
    listen 443 ssl http2;
    server_name smartsound.example.com;

    root /var/www/smartsound/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

**systemd**, for persistence across reboots/crashes (`/etc/systemd/system/smartsound-server.service`):

```ini
[Unit]
Description=SmartSound backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/smartsound/server
EnvironmentFile=/var/www/smartsound/server/.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=2
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now smartsound-server
```

Point `STRIPE_WEBHOOK_SECRET` at a webhook endpoint registered for
`https://smartsound.example.com/api/billing/webhook`, and `GOOGLE_REDIRECT_URI`
/ `APPLE_REDIRECT_URI` at the same host, before flipping real secrets in.

## What's stubbed / not wired yet

- **better-sqlite3 → node:sqlite fallback** (see Stack, above) — functionally
  complete, not a placeholder, just a different SQLite binding chosen because
  this sandbox has no C/C++ toolchain.
- **Frontend is not wired to this API yet.** `src/lib/api.ts` in the SPA is a
  typed fetch client for every route above, exported and type-checking, but
  not called from any screen — hooking screens up to it (replacing the
  `useDailyUsage` localStorage stub, gating auth, etc.) is a later milestone
  per the goal doc's own build order (§8, milestones 3–5).
- **No end-to-end OAuth/Stripe test** was possible here — there are no real
  Google/Apple/Stripe accounts in this environment. Every code path was
  verified to compile and to correctly 503 with the right `missing` keys when
  unconfigured (see the PASS/FAIL report in the task summary).
