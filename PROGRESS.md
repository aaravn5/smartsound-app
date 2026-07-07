# SmartSound — build progress

Branch: `landing-reskin-fable5`. Live (frontend): **http://2.25.76.220** (`/` landing, `/app` GOAT app, `/play` legacy).

## Done & verified (typecheck + build pass, 0 console errors, Playwright-checked, committed)
- **v1 (COMPLETE.md Part 5):** app reskin (`/play`) over the rPPG+audio engine + landing — built, deployed.
- **M1 Design System v2:** distinctive self-hosted-via-Fontshare faces (**Clash Display / General Sans / JetBrains Mono / Fraunces** — no basic fonts), richer OKLCH signal arc, pixel utilities (`pixel.ts`, `PixelDissolve`, `PixelSkeleton`), **touch + pointer** reactive pixel hook, pixel favicon.
- **M2 GOAT-format app shell:** Discover / Browse / Now / Insights / Me + glass bottom nav, editorial curated rails, pixel avatar, Free membership card. Landing CTA → `/app`. Onboarding gate.
- **M4 Paywall + free-cap UX:** GOAT-membership Free/Pro/Studio ($0 / $9.99mo·$79yr / $19.99mo·$179yr), monthly/annual with real savings, honest no-fake-purchase CTA, `/legal` stub, **20-min/1-session client-side daily cap** (17min warn → 20min stop → paywall) wired without touching the engine.
- **M6 Landing v2:** the neural mesh whose **brain-stem branches** to labeled sections (How-it-works / Science / **Pricing** / FAQ / Legal / Launch) with connectors + synapse pulses; new pricing + legal nodes; fixed a real sticky-positioning bug.
- **Onboarding v2:** goal → calibrate → consent → account (Apple/Google buttons, honest guest fallback) → ready; PixelDissolve transitions; one-time soft gate.
- **In-app pixelation pass:** PixelDissolve on the session screen, shell-wide pixel-noise texture, PixelSkeleton empty states (no spinners).
- **Backend scaffold (`server/`):** Hono + `node:sqlite` + `arctic` (Google/Apple OAuth) + `stripe` + usage metering; **server-authoritative Free cap**; every unset-secret endpoint returns 503 `not_configured`; `src/lib/api.ts` frontend client. Compiles + smoke-tested (`/api/me`→401, `/api/auth/google`→503, 6 tables migrated).
- **Security pass (audit + hardening):** parameterized SQL, signed httpOnly session, OAuth state/PKCE, Stripe raw-body webhook verify, IDOR-safe authz confirmed DONE-RIGHT. Fixed: prod fail-safe for `SESSION_SECRET`, rate limiting (auth/billing/session), Apple state-cookie SameSite, CSRF origin-check (webhook + OAuth-callback exempt), `secureHeaders`, capped `arousalSamples`. Verified live (429/403/headers).

## Blocked — needs the owner's account setup (drop into `server/.env`, then I wire + verify)
- **Google OAuth:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- **Apple Sign-in:** `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_REDIRECT_URI`
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTH/PRO_YEAR/STUDIO_MONTH/STUDIO_YEAR`
- Plus `SESSION_SECRET`, `PUBLIC_ORIGIN` (see `server/.env.example`).

## Next (once accounts exist)
1. Wire frontend `src/lib/api.ts` into onboarding (real sign-in), Now (server cap), Me (real plan), Insights (server data).
2. Run the backend service + reverse-proxy `/api/*` (caddy/nginx) + systemd for persistence (needs a system-service authorization).
3. End-to-end verify sign-in (both providers) + a Stripe test-mode purchase → Pro unlock.
4. Then **shayr** (product 2: Kalshi-for-stocks, virtual "shayrs") — its own spec + build, same protocol.

## Decisions
- Kept **Panda CSS** (not Tailwind) so app + landing share ONE system and the SAME GlassButton (see prior note).
- App = `/app` GOAT shell; `/play` kept as legacy standalone.
- `node:sqlite` instead of better-sqlite3 (no native toolchain in the build env) — swap is one file.
- All coding delegated to Sonnet subagents; orchestration + verification + commits by the lead. Higgsfield reserved (unused — hand-built everything, per the 10-credit budget).
