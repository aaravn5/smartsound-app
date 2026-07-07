# /goal — SmartSound v2: neuroscience-coded, GOAT-format, monetized, ship-ready (Fable 5, multi-day)

> Paste this whole file as a `/goal` in the VPS `claude` tmux session. Model: **Fable 5**,
> `/effort high`. It supersedes the v1 landing/app already built and deployed at
> **http://2.25.76.220** (branch `landing-reskin-fable5`) — keep the working audio + rPPG
> engine and the closed-loop, and **elevate everything else** to the bar below.
> Do not simplify to finish; this is a premium product meant to convert to paid.
> Stop only for a genuine blocker (missing secret / destructive action / an outward action
> needing the owner's explicit OK). Otherwise decide, build, verify, continue.

---

## ▶ Run unattended (VPS, detach)
```bash
ssh -t root@2.25.76.220 'tmux attach -t claude'   # or: claude-vps
/model claude-fable-5
/effort high
/goal   (paste this file)
# detach: Ctrl-b d   → close laptop. Reattach: claude-vps
```
`--dangerously-skip-permissions` for a fully unattended run; only on this VPS. Secrets live
in `/root/projects/smartsound/.env` (git-ignored) — NEVER commit them. If a required secret is
absent, emit one line `BLOCKED: need <NAME>` and continue with everything that doesn't need it.

---

## 0. The bar (what "good" means now)

Best-in-class, neuroscience-coded, tasteful. The reference **format** is the **GOAT app** —
its *design language*, not its commerce: confident editorial typography, generous macro-whitespace,
curated "drops"/collections on the home, clean product→detail hierarchy, refined filters, and a
premium membership surface. We wear that format over SmartSound's **dark neuroacoustic identity**:
pure-black canvas, the biofeedback ring, and a **pixelation motif that lives in BOTH the app and the
landing**. It must feel like a $20/mo product a designer would screenshot. **No vibecoded slop** —
every screen is deliberate; if a thing looks like a default Bootstrap/Inter/AI-gradient page, it's wrong.

Commercial goal: convert. Free is genuinely useful but **capped at one 20-minute session per day**;
Pro and Studio unlock the rest. Ship the paywall, auth, metering, and billing so revenue is real.

---

## 1. Design system — elevate (this is where "colors/fonts not good enough" gets fixed)

### 1.1 Typefaces — distinctive, self-hosted, NEVER basic
Ban Inter/Roboto/Open Sans/Arial and any generic serif. Self-host via `@font-face` (Fontshare/ITF
free-for-commercial licenses) — download into `public/fonts`, no CDN.
- **Display (headlines, hero, numerals):** **Clash Display** (or **Cabinet Grotesk**) — tight tracking
  (`-0.02..-0.04em`), weight-driven hierarchy, not giant sizes.
- **Body / UI:** **General Sans** (or **Satoshi**) — relaxed leading, 60–68ch measure.
- **Mono (data, HR, entrainment Hz, timers, section labels):** **JetBrains Mono** or **Geist Mono** —
  neuroscience-instrument feel; all live numerics are mono + `tabular-nums`.
- **Optional editorial serif accent** (science section pull-quotes only): **Fraunces** (optical, high
  contrast). Use sparingly — one or two moments, never body copy.

### 1.2 Color — richer, deliberate, neuroscience-coded (OKLCH)
Keep the pure-black canvas and the **living `--signal`** arc (arousal → color), but deepen it:
```
Canvas:      --bg-base #000000 · --bg-1 oklch(0.16 0.02 265) · --bg-2 oklch(0.21 0.02 265)
Ink:         --text oklch(0.96 0.01 265) · --muted oklch(0.70 0.015 265) · --faint oklch(0.55 0.015 265)
Lines:       --line oklch(0.30 0.015 265) · glass border rgba(255,255,255,0.10)
Signal arc (the ONLY accent, = arousal state, never decorative):
  winddown oklch(0.55 0.09 285)  → settled oklch(0.74 0.13 205)  →
  focus    oklch(0.70 0.17 265)  → elevated oklch(0.80 0.16 70)
  Refine the current flat cyan→violet toward these richer, higher-chroma anchors; add a
  narrow bloom halo token --signal-glow.
Bio-luminescence: a subtle vertical background gradient (bg-base → bg-1) + a faint
  --signal-tinted radial behind the ring/brain. No flat black voids on hero sections.
```
Rules (stitch-taste): max ONE accent (it's `--signal`); saturation stays disciplined; never a purple/blue
neon "AI" glow as decoration; semantic colors (success/limit-reached/error) are separate and muted, with
icon+label, never color-alone.

### 1.3 Pixelation — a real material, in app AND landing, on a 4px grid
`--pixel-size: 4px` everywhere. Uses:
- **App:** the ring's pixel-assemble boot (already built) PLUS: pixel-dissolve between screens/session
  start-stop; a faint pixel-noise depth texture on black; **pixelated avatar/plan badges**; a pixelated
  SmartSound wordmark mark; skeleton loaders that resolve from pixels (not spinners).
- **Landing:** the hero pixel field; pixel-dissolve section transitions; the brain rendered/edged with a
  pixel treatment; pixelated section labels.
- Consistency: every pixel effect snaps to the same 4px grid so they read as one material. Restraint is
  the luxury — signature accents, never wallpaper.

### 1.4 Motion
Spring physics (stiffness ~120, damping ~20), staggered reveals, `--ease-calm` cubic-bezier(0.22,1,0.36,1).
`:active` scale 0.96 on controls. Nothing appears from `scale(0)` — use `scale(0.96)+opacity`. Honor
`prefers-reduced-motion` fully (3D/particles → static; keep only opacity fades).

### 1.5 Touch + pointer reactivity (required everywhere pixels live)
Every pixel field (hero + any in-app pixel surface) responds to **both mouse move and touch move**
(`pointermove` covers both; also handle `touchmove` with `{passive:true}` and use the primary touch point).
Pixels displace from the finger/cursor with spring settle. On mobile the hero must react to drags.

---

## 2. GOAT-format information architecture (adapt the format, keep our identity)

Bottom tab nav (glass, 5 slots): **Discover · Browse · ▶ (Now) · Insights · Me**.

- **Discover (home, GOAT "drops" energy):** an editorial featured hero (a program/soundscape of the
  moment), then curated horizontal rails — "For your evening" (circadian), "Deep focus", "Sleep programs",
  "New soundscapes", "Because you settled fast last time". Cards are clean, image/gradient-forward,
  bold name + tiny mono meta (band · Hz · minutes). Personalized, calm, premium.
- **Browse:** search + filter chips (Goal, Time of day, Length, Intensity) + sort; a refined grid of
  soundscapes/scenarios. GOAT's clean browse, our content.
- **Now / Session:** the reskinned closed-loop instrument (v1 `/play`, elevated) — ring, HR readout,
  Neural depth, transport, Attune. Add **pixel-dissolve** on start/stop and the in-app pixel texture.
  A "session detail" page (GOAT product-detail analogue): large ring preview, entrainment spec, duration
  options, "Begin session", a science accordion, "More like this".
- **Insights:** streak ring, weekly minutes, the closed-loop arousal→target curve, time-in-state — all
  from REAL persisted sessions (dataviz-correct; sample only until data exists, clearly labeled).
- **Me:** profile (pixel avatar), streak, **membership card (Free/Pro/Studio)**, session history,
  settings (consent, reduced-motion, data export/delete, sign out).

Onboarding: goal pick → short calibration (optional 20s camera baseline + a 1-question self-report) →
consent (camera on-device, persistence) → account (Apple/Google) → first session. GOAT-clean, 4–5 steps.

---

## 3. Auth — Google + Apple OAuth (real)

- **Sign in with Apple** (web JS) and **Google OAuth 2.0** (GIS). Buttons use the official marks/wording,
  native-feeling, in the shared GlassButton family (respect brand guidelines for the provider marks).
- A small **backend** (see §5) issues an httpOnly session cookie; store `user{ id, provider, email,
  created }`. No passwords. Apple's private-relay email supported. Sign-out clears the session.
- Gate the app behind auth after onboarding; Discover teaser browsable signed-out, but starting a session
  requires an account (so metering + entitlements work).

---

## 4. Monetization — paywall, tiers, the 20-minute free cap (build it, don't mock it)

### 4.1 Tiers & features
| | **Free** | **Pro** | **Studio** |
|---|---|---|---|
| Price | $0 | **$9.99/mo · $79/yr** | **$19.99/mo · $179/yr** |
| Daily sessions | **1 / day, capped at 20 min** | Unlimited | Unlimited |
| Soundscapes | Core 3 | All 5 + seasonal | All + Studio-only programs |
| Closed-loop camera (rPPG) | ✓ | ✓ | ✓ + high-fidelity model |
| Insights history | Last 3 sessions | Full history + trends | Full + **data export** |
| Timed scenarios / programs | 1 | All | All + **custom multi-phase programs** |
| Audio fidelity | Standard | High | **Studio (max)** |
| Offline / background | — | ✓ | ✓ |
| Early access / new drops | — | ✓ | ✓✓ |
| Support | Community | Priority | Priority + |

7-day free trial on Pro/Studio. Annual is the hero (save ~34%). Copy is honest — no fake urgency, no
fake discounts, no invented testimonials.

### 4.2 Paywall screens (design them, GOAT-membership style)
- A **Pro paywall** and a **Studio paywall** (or one screen with a Free/Pro/Studio segmented switcher —
  design both; prefer the segmented switcher with the recommended tier pre-highlighted). Dark, editorial,
  Liquid Glass tier cards, the feature matrix as clean rows (checks are our signal color + label, never
  color-alone), a single primary CTA per tier, monthly/annual toggle, "Restore purchase", legal links.
- **Trigger points:** hitting the daily 20-min cap ("You've used today's free session — go Pro for
  unlimited"), tapping a locked soundscape/program, the Me → membership card, and end-of-session upsell
  when the loop worked well. Each trigger deep-links to the paywall with context.

### 4.3 Enforcement (real metering)
- Backend meters **minutes used today per user** (reset at local midnight). Free: block starting a new
  session once today's total ≥ 20 min or a session already ran; show the cap paywall. Never silently
  stop mid-session — warn at 17 min, hard-stop at 20 with a graceful pixel-dissolve to the paywall.
- Entitlements come from the subscription record (see §5). Client checks are UX; the **server is the
  source of truth** for caps and entitlements (never trust the client).

### 4.4 Billing
- **Stripe** (web) Checkout + Customer Portal + webhooks → subscription state in the DB. (If a native
  wrapper ships later, use RevenueCat; for the web app, Stripe.) Products/prices for Pro/Studio monthly+yearly.
- `BLOCKED: need STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / price IDs` if absent — build the full flow
  against test mode meanwhile.

---

## 5. Backend (new — required for auth, metering, billing, persistence)

The v1 app is a client-only Vite SPA; add a small backend on the VPS.
- **Stack:** Node + **Hono** (or Fastify) + **SQLite** (better-sqlite3) or Postgres; Zod-validated routes;
  served same-origin behind the site (reverse-proxy `/api/*`). Keep it lean.
- **Tables:** `users`, `sessions_auth`, `subscriptions`, `usage_daily(user, date, minutes, count)`,
  `session_logs`, `arousal_samples`.
- **Endpoints:** `/api/auth/{google,apple}/callback`, `/api/me`, `/api/usage`, `/api/session/start|end`
  (records minutes; enforces cap), `/api/insights`, `/api/billing/checkout|portal|webhook`,
  `/api/account/export|delete`.
- **Privacy:** only derived scalars persist (HR estimate, arousal index) — never raw video/frames.

---

## 6. Landing — the pixelated brain whose stem BRANCHES to every section

Elevate the v1 landing:
- **Pixelated brain** hero motif (the neural mesh, given a pixel/voxel treatment) with a **brain-stem**
  that runs down the page and **branches** — each branch terminates at a labeled node that IS a section:
  **How it works · The science · Pricing · FAQ · Terms/Privacy · Launch**. As you scroll, the relevant
  branch lights up (a synapse pulse travels the stem to that node) and the section fades/pixel-assembles in.
- Hero: touch/pointer-reactive **pixel field** (already built — extend to touch), refined headline in the
  new display face, one glass CTA → the app.
- **Pricing on the landing** mirrors §4.1 (Free/Pro/Studio) with CTAs into checkout/onboarding.
- Liquid Glass throughout with cursor-tracked specular; pixel-dissolve section transitions; honest science
  copy; a real FAQ and a real ToS/Privacy page (route `/legal`).
- Mobile: brain-stem collapses to a vertical fade sequence; pixel density reduced; still touch-reactive.

---

## 7. Higgsfield (sparingly — 10 free credits, authenticated as aaravnaveen06@icloud.com)

Hand-build shaders/geometry/CSS by default. Spend a credit ONLY where code can't: e.g. a single OG/social
share image, or one refined hero texture/brand mark. `higgsfield generate cost <model> …` before any job;
generate once, evaluate, don't spin variations. If credits run out, fall back to pure code — nothing here
requires Higgsfield.

---

## 8. Build order (milestones — each ends green, verified, committed, preview updated)

1. **Design system v2** — self-host the fonts, refine the OKLCH tokens, pixelation utilities, touch-reactive
   pixel hook. Gate: typecheck/build pass; a11y contrast ≥4.5:1 on the new palette.
2. **GOAT-format shell** — Discover/Browse/Now/Insights/Me + bottom nav + onboarding, over the existing
   engine. Gate: Playwright snapshots @390/@1280; axe zero serious; 0 console errors.
3. **Backend + Auth** — Hono service, Google + Apple OAuth, sessions, `/api/me`. Gate: e2e sign-in both providers.
4. **Metering + Paywall** — usage_daily, 20-min cap enforcement, Free/Pro/Studio paywall screens + triggers.
   Gate: e2e — hit cap → paywall; entitlements gate content.
5. **Billing** — Stripe checkout/portal/webhooks (test mode), subscription state. Gate: e2e test-mode purchase → Pro unlock.
6. **Landing v2** — branching brain-stem, pricing, legal, touch pixels. Gate: Lighthouse ≥95 desktop/≥85 mobile perf; 3D lazy.
7. **Insights (real data)** + **in-app pixelation pass** + polish (skeletons, empty/error states, copy pass).
8. **Ship** — cross-browser, reduced-motion, a11y AA, perf budgets; deploy; report URL(s).

Each milestone: `typecheck && lint && build && e2e && axe`, then drive both surfaces in real Chrome
(Playwright), screenshot mobile+desktop, look, confirm **0 console errors** and no regression. Keep
`PROGRESS.md`/`DECISIONS.md`; commit per green gate; run in a branch for whole-diff review.

---

## 9. Definition of Done (all true & verified)
- [ ] Distinctive self-hosted fonts (no Inter/basic/generic-serif); refined OKLCH palette; pixelation in
      app AND landing on the 4px grid; pixels react to mouse AND touch.
- [ ] GOAT-format app: Discover/Browse/Now/Insights/Me + onboarding, one coherent design system, one
      GlassButton, responsive 320→1440, safe-area aware.
- [ ] Google + Apple sign-in work end-to-end; server-issued sessions.
- [ ] Free capped at one 20-min session/day (server-enforced, graceful); Pro & Studio paywalls designed
      and functional; entitlements gate content; trigger points deep-link with context.
- [ ] Stripe subscriptions live (test mode ok to hand off): purchase → entitlement → unlock; portal; webhooks.
- [ ] Backend persists users, usage, subscriptions, session logs, arousal samples; export + delete real.
- [ ] Landing: pixelated brain with a branching stem to How-it-works/Science/Pricing/FAQ/Legal/Launch;
      pricing + real ToS/Privacy; touch-reactive; Liquid Glass; lazy 3D.
- [ ] WCAG 2.2 AA; `prefers-reduced-motion` graceful; perf budgets met; **0 console errors**; prod build passes.
- [ ] Deployed; live URL(s) reported; `README`/`PROGRESS`/`DECISIONS` complete.

## 10. Anti-slop taste bar (enforce on every screen)
No Inter/basic fonts, no emoji icons (crisp SVG only), no AI purple/blue neon glow as decoration, no
three-equal-cards rows, no centered-everything, no gradient-text on big headers, no fake data/urgency/
testimonials, no spinners where a skeleton belongs, no `rounded-full` on large cards, no vibecoded default
components. One accent (`--signal` = arousal). Every animation earns its place. Match GOAT's editorial
restraint, then exceed it in taste. When unsure, remove.

## 11. First action
Read `PROGRESS.md`/`DECISIONS.md`; inspect the v1 build (branch `landing-reskin-fable5`, engine in
`src/engine`, tokens in `panda.config.ts`, components in `src/components` + `src/landing`). Confirm what
exists, then start at the earliest unfinished milestone in §8. Build → verify → commit → update preview →
repeat until §9 is fully checked. Report the live URL(s).
```
NOTE: GOAT screens on Mobbin are behind a login wall — this spec synthesizes GOAT's known design
FORMAT (editorial marketplace: bold type, whitespace, curated drops, clean detail, membership). With a
Mobbin login, capture the real GOAT flows and refine §2/§6 against them; the format above is the target.
```
