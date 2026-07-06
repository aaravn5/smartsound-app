# PLAN — Quietpress vinyl revamp (branch calm-revamp)

The "quietpress record label" hero spec, transformed into SmartSound: the five
soundscape modes become vinyl pressings whose center labels are our five scene
photographs; the brand, tokens, honesty strings and engine stay SmartSound's.

## New landing `/` (one viewport, no scroll, always `ss-scene-dark`)

- **`src/landing/BoomerangVideoBg.tsx`** — self-hosted `/intro/hero-loop.mp4`
  (1920×1080 · 24fps · 8.04s · 193 frames). Three modes, decided once on mount:
  - *poster*: `prefers-reduced-motion` or `saveData` → first frame drawn to a
    canvas on `loadeddata`, no motion.
  - *native*: viewport < 768px or `deviceMemory <= 4` → plain `<video loop>`
    (seam accepted, zero capture memory).
  - *capture*: play once while grabbing ≤ 90 frames at 960×540 (skip alternate
    frames, `createImageBitmap` with canvas fallback); on `ended`, swap to a
    `<canvas>` ping-ponging the frames at 30fps. The live `<video>` is the
    visible background during capture (no flash). Pause all work on
    `document.hidden`; close bitmaps on unmount. Container: absolute inset-0,
    `scale(1.08)`, overflow hidden.
- **Time-of-day**: `src/lib/daypart.ts` — `daypart()` (morning 5–12 /
  afternoon 12–18 / evening 18–22 / night 22–5), per-daypart CSS `filter`
  grade on the media (morning none → night deep blue `brightness(.45)` +
  navy scrim), per-daypart headline/badge/greeting copy. Scrim gradient
  (bottom 40%+ plus a mid band for the headline) audited for AA via a new
  `scripts/hero-contrast-audit.mjs` (contrast-audit method, run over frames
  extracted from the video with ffmpeg — worst case = ungraded morning).
- **Liquid glass**: the spec's `.liquid-glass` CSS (::before gradient-border
  mask trick) + `fade-up` keyframes with `animation-fill-mode: backwards`
  added UNLAYERED to `src/index.css`; reused by header, badge, buttons,
  search, dropdowns, widget.
- **Header** (`src/landing/LandingHeader.tsx`, z20): SmartSound Fraunces
  wordmark · nav Library(/app) Science(/science) Contact(/contact)
  Legal(/privacy) · right side = Log in (glass) + Sign up (white pill) →
  `/onboarding/auth`, or when signed in a glass chip "Good {daypart}, {name}"
  with a sign-out menu. No cart (we are not a shop). Mobile: lucide Menu/X
  glass square + glass dropdown.
- **Hero** (z10): glass badge "{Tonight's press} · {circadian suggestion
  title}" (from `suggestFor`), Fraunces headline (daypart line, clamp
  2.5–4.5rem), honest subtext, CTAs (white pill "Browse the library" → /app;
  glass "Start listening" → gated), and the self-typing search
  (`src/landing/HeroSearch.tsx`): lucide Search icon, type/hold/delete
  placeholder loop (static "Search" under reduced motion), live-filters
  SOUNDSCAPES + SCENARIOS, Enter/click → gated play. Input rendered as text —
  no HTML sinks.
- **Record lazy-susan** (`src/landing/RecordCarousel.tsx`, bottom third):
  9 discs — 5 modes + 4 scenarios interleaved (ModeShelf's order; scenario
  discs are "pressing variants" of their state's artwork). Each is a CSS
  vinyl (`src/landing/VinylDisc.tsx`: radial groove gradients, conic specular,
  scene photo circular label — one DISTINCT landscape per mode, center hole).
  Discs orbit an ellipse (transform math in rAF on refs — ModeShelf's
  engineering), slow auto-spin, hover pauses, drag with 6px pointer-capture +
  momentum + click-suppression, snap-to-front with `navigator.vibrate?.(8)`,
  front disc scales up/straightens with Fraunces title + tabular band caption.
  Seeded per-disc tilt = the "shuffled library" fan. Click → gate. Reduced
  motion: static fanned scrollable row.
- **Now Playing widget** (`src/landing/NowPlayingWidget.tsx`, bottom-right,
  z20): renders only while `useEngine().status === 'running'`. Dark glass
  card: spinning mini vinyl (pauses when idle), title/band, elapsed (session
  start timestamp written by the player via `src/lib/session-meta.ts`), heart
  (persists `ss_favorites_v1` via `src/lib/favorites.ts`), prev/next =
  `selectState` cycle, card click → `/app/player`.

## Player — the revolving record

`app.player.tsx`: the orb becomes a spinning vinyl (disc ≈ 232px, current
scene photo label, 6s/rev, CSS animation paused when idle, none under reduced
motion). SignalRing stays mounted BEHIND/AROUND it (size ≈ 400 so the live
FFT trace is the halo just outside the rim), breathing glow kept, same
`handlePlayPause` on disc tap, play/pause glyph on the small frosted hub.
Engine wiring and `useEngine` API untouched.

## Auth (local-first, honest — no fake network auth)

- **`src/lib/account.ts`**: `ss_account_v1` {name,email,createdAt},
  `useAccount()` (useSyncExternalStore, cached snapshot), `signOut()`,
  try/catch around all storage.
- **Onboarding**: steps become `welcome → auth → goal → when → ready`.
  Auth step = "Create your account": validated name + email, Google/Apple
  buttons open an HONEST glass sheet ("connects when accounts sync ships —
  your account lives on this device for now"), legal line linking /terms +
  /privacy. Route gains `validateSearch { intent?: 'play', state? }`.
  - with `intent=play`: account created → `markOnboarded()` → straight to
    `/app/player?state=X`.
  - organic flow: auth → goal → when → ready → **Finish → `/`** (landing
    greets "Welcome, {name}" first visit, daypart greeting after).
  - beforeLoad: signed-in+onboarded users bounce to /app (or their intent's
    player state); everyone else may reach any step — the auth step must stay
    reachable for onboarded-but-signed-out visitors.
- **Gate**: record click / search play / "Start listening" without an account
  → `/onboarding/auth?intent=play&state=X`. Browsing `/app` stays open.
- Profile: Account group becomes real when signed in (name/email + working
  Sign out); add Privacy Policy / Terms links.

## Routes

- `/privacy`, `/terms` — honest editorial scene-dark pages (wellness-not-
  medical, camera on-device, localStorage-only, no accounts server yet).
- `/contact` — glass form; submit builds a `mailto:` from concatenated parts
  (address never rendered as text) and assigns `window.location.href`;
  confirmation copy + an "open mail app" anchor (also the test probe).
- `/science` — SciencePanel on a scene-dark page (the header's Science link).

## Constraints honored

Panda only (spec's Tailwind classes translated), self-hosted Fraunces (no
webfont CDN), `lucide-react` is the only new dep, engine/entitlements/click-
sound/theme internals untouched, ModeShelf + /app intact, no git commit,
preview on :8094 strictPort (killed at the end), playwright-cli session
`-s=vinyl` only, videos paused before headless screenshots.

## Verify loop

tsc+build clean → landing (bg, boomerang canvas-swap probe, header, typing
search two-sample, records fan) → gate flow (signed-out record click → auth →
create account → greeting; signed-in → player state) → player spin two-sample
transform probe + Attune present → /privacy /terms /contact (+/science) →
mobile 390/375 + desktop 1280, no h-scroll → regression (/app shelf drag,
session start/stop, recents, dev unlock, paywall, both themes, 0 console
errors on every touched route) → security pass (no external CDN in dist, no
rendered email, storage try/catch, no XSS sinks). Loop until clean.
