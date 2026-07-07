# SmartSound vs. Apple Calm / brain.fm — Benchmark & Verification Report

**Branch audited:** `calm-revamp` (working tree clean, not modified by this audit)
**Date:** 2026-07-03
**Method:** `npm run build` + `vite preview` on `127.0.0.1:4210`, driven headlessly via `playwright-cli` at two viewports (390×844 mobile, 1280×900 desktop) across all six routes.

> **Caveat (read before trusting any score below):** Deliverable B is a **heuristic expert design audit** performed by one reviewer (an AI agent) against general, publicly-known design patterns of Apple Calm and brain.fm, informed only by this codebase's shipped UI, its screenshots, and its own design docs. It is **not real-user testing, not an A/B test, not a usability study, and not a guarantee of market success or of matching either app's actual current (2026) UI pixel-for-pixel**. Scores are directional and intended to prioritize follow-up work, not to be treated as ground truth.

---

## Deliverable A — Verification loop

### Build

`npm run build` (panda codegen → tsr generate → tsc -b → vite build) **PASSED**, exit 0. Tail of output:

```
✓ 518 modules transformed.
dist/index.html                  0.75 kB │ gzip:   0.43 kB
dist/assets/index-DXapjEms.css  36.70 kB │ gzip:  10.42 kB
dist/assets/index-BVD-H7x3.js  453.82 kB │ gzip: 145.91 kB
✓ built in 2.68s
```

### Method notes

For every (route, viewport) pair: navigated with `playwright-cli goto`, cleared and re-read the console log, evaluated `document.documentElement.scrollWidth > window.innerWidth` for overflow, took a viewport screenshot, and inspected network requests for 4xx/5xx. Console was **0 errors / 0 warnings** and overflow was **false (delta 0)** on **every one of the 12 pairs** — those two columns are omitted from the per-cell reasons below since they never varied; only overlap/layout findings are called out.

Two apparent overlaps seen in first-pass screenshots (the Today "Recommended" rail and the Progress weekly bar chart both appeared to visually touch the tab bar) were **investigated and disproved**: `raw getBoundingClientRect()` ignores ancestor `overflow` clipping, so a bar/card can report `bottom > tabBarTop` while actually being invisibly clipped by `<main>`'s `overflow-y: auto` box (which stops 96px above the viewport bottom by design, see `src/routes/app.tsx` lines 115–127). This was confirmed by intersecting each element's rect with all overflow-clipping ancestors, and independently by `document.elementFromPoint()` hit-testing at the disputed coordinates — in both cases the tab bar, not the card content, is what actually paints there. Those two are recorded as **PASS**.

One overlap **was confirmed real** by the same two independent methods (ancestor-intersection *and* `elementFromPoint` hit-testing landing directly on the underlying control, not the tab bar): the Player screen's "Neural depth" slider.

### Pass/Fail matrix

| Route | 390×844 (mobile) | 1280×900 (desktop) |
|---|---|---|
| `/` | PASS | PASS |
| `/app` (Today) | PASS | PASS |
| `/app/explore` | PASS | PASS |
| `/app/player?state=calm` | **FAIL** — Neural depth slider thumb pokes out below/beside the floating tab bar on first paint | **FAIL** — "Neural depth 38%" card and slider render partially behind/below the tab bar on first paint |
| `/app/progress` | PASS (see note above — initial screenshot suggested overlap; disproved by hit-testing) | PASS (same) |
| `/app/profile` | PASS | PASS |

### Root cause of the confirmed Player-screen FAIL

`src/routes/app.player.tsx` line 202 renders the whole screen inside its own `position: fixed; inset: 0` wrapper, instead of composing inside `AppShell`'s `<main>` (`src/routes/app.tsx`, `bottom: calc(env(safe-area-inset-bottom) + 96px)`, `overflow-y: auto`). A `position: fixed` descendant is not constrained by an ancestor's box unless that ancestor establishes a containing block (via `transform`/`filter`/`backdrop-filter`/`contain`) — `<main>` (`position: absolute`) does not, so the player's own scroll area is sized to the **full viewport**, not the tab-bar-safe area the rest of the shell reserves. The player route does add its own `pb: calc(env(safe-area-inset-bottom) + 140px)` trailing padding (line 223), which is more generous than the shell default, but that only pads the *end* of scroll content — it does not stop the "Neural depth" slider (~line 479–522) and "Attune" row (~line 541+), which fall naturally in that vertical band on first paint (`scrollTop = 0`), from landing directly under/beside the tab bar. Confirmed via `elementFromPoint(161, 835)` (mobile) and `elementFromPoint(640, 895)` (desktop) both directly hitting the slider thumb / Attune panel rather than the tab bar or background.

**Fix:** give `app.player.tsx`'s root scroll container the same bottom-inset treatment as `AppShell`'s `<main>` (or simply nest the player inside it instead of re-declaring its own `position: fixed; inset: 0`), so its content is clipped/padded the same way every other tab already is.

### Evidence

Screenshots for all 12 (route, viewport) pairs were captured to `/tmp/ss-shots/` during this audit (ephemeral, not part of the repo).

---

## Deliverable B — Competitive benchmark scorecard vs. Apple Calm / brain.fm

Sources reviewed: `src/routes/index.tsx`, `src/routes/app.tsx`, `src/routes/app.index.tsx`, `src/routes/app.explore.tsx`, `src/routes/app.player.tsx`, `src/routes/app.progress.tsx`, `src/routes/app.profile.tsx`, `src/design/LiquidGlass.tsx`, `src/design/Scene.tsx`, `src/components/SereneScreen.tsx`, `panda.config.ts` (type scale/tokens), plus all captured screenshots from Deliverable A. `UI-Design-Bible.md` was read for stated intent only, not used to inflate scores — the shipped UI was scored, not the aspiration doc.

| # | Dimension | Score /5 | Rationale (grounded in code/UI) | Highest-value fix |
|---|---|---|---|---|
| 1 | Onboarding/welcome | 3 | `src/routes/index.tsx` is a single, well-animated screen (staggered fade-ups, dusk `Scene`, one honest privacy line: "Free to explore. The camera stays on your device.") with one CTA straight into `/app`. No goal-setting, no personalization, no permission-priming before the Player's camera-based Attune feature is later offered. Calm's onboarding is a multi-step guided flow; brain.fm leads with science-forward framing before the app. | Add 1–2 short steps (intent/goal capture, and priming the camera permission ask) between landing and `/app`. |
| 2 | Home ("Daily") editorial quality | 4 | `src/routes/app.index.tsx` genuinely mirrors Calm's "Daily" pattern: daypart-aware greeting, a full-bleed hero card with scene imagery, contextual copy ("Evening · Daily session" / "Wind-down"), a rings summary, and a "Recommended for now" rail. Close structural parity with Calm's home. | Vary hero imagery per session beyond the four procedural `Scene` gradients (see #3) so consecutive visits don't feel visually identical. |
| 3 | Immersive scene/imagery depth | 3 | `src/design/Scene.tsx` layers a base gradient with two slow counter-drifting radial-gradient "mesh" layers plus a top bloom, cross-fading between four named skies (dusk/aurora/ocean/dawn). Technically tasteful and GPU-cheap, but it is **entirely CSS gradients** — no photographic depth, parallax, grain, or particles — reading closer to Endel's flat-abstract minimalism than Calm's photographic mountain/aurora imagery. | Add one depth cue (film-grain/noise overlay, subtle parallax on scroll, or a light particle layer) to break the "linear-gradient" flatness. |
| 4 | The player (now-playing + music feel) | 2 | `src/routes/app.player.tsx` has real substance — signal ring, timer, transport, a "Neural depth" intensity slider (brain.fm-style adaptive control), an honestly-labeled camera "Attune" toggle — but this is the screen with the **confirmed, verified layout bug** from Deliverable A: its controls visibly collide with the tab bar on first paint at both viewports. A now-playing screen that visually breaks on load outweighs its otherwise-good bones. | Fix the `position: fixed; inset: 0` containing-block bug (Deliverable A root cause) — this single fix would likely move this score to a 4. |
| 5 | Motion serenity/pacing | 5 | Consistent `fadeUp` entrance choreography with staggered per-element delays (40ms/160ms/260ms in `app.index.tsx`, similar patterns in `app.profile.tsx`, `app.progress.tsx`), spring-based tap feedback in `LiquidGlass`, and `prefers-reduced-motion` guards applied everywhere motion is used (`Scene.tsx`, `LiquidGlass.tsx`, `SereneScreen.tsx`, every route). This is the strongest-executed dimension in the app. | None critical; could vary easing curves per element type for a slightly less uniform feel. |
| 6 | Liquid Glass material quality | 5 | `src/design/LiquidGlass.tsx` implements a genuinely layered material: frosted fill + `backdrop-filter: blur() saturate() brightness()`, a pointer-tracked radial specular sheen (`--lg-mx/--lg-my`), an inner glow, layered drop shadows, an explicit `@supports not (backdrop-filter)` fallback, and a `prefers-reduced-transparency` fallback. This is unusually thorough for a solo/small build and matches Apple's real Liquid Glass spec closely. | The component's own comment warns "never stack glass on glass" — the floating tab bar sits over glass content cards in places (e.g. Today's hero card); worth a visual pass to confirm no double-glass moments occur when scrolled to certain positions. |
| 7 | Typography/hierarchy | 4 | `panda.config.ts` defines a disciplined HIG-derived type scale (`largeTitle`, `title1–3`, `headline`, `subhead`, `footnote`, `caption`/`caption2`) built on the SF system font stack, used consistently across every route's `ScreenTitle`/section headers, plus a `tabular` class for aligned numerals (`app.profile.tsx`, `app.progress.tsx`). Disciplined and consistent, but generic — it reads as "a well-built HIG app," not as a distinct brand voice the way Calm's custom script wordmark does. | Introduce one distinctive display/brand typographic moment (e.g., a custom wordmark treatment on the landing screen) rather than relying solely on the system stack throughout. |
| 8 | Accessibility | 4 | Icon-only controls carry `aria-label`s throughout (`app.tsx` tab bar, `app.player.tsx` dismiss button, `app.explore.tsx` search), `aria-current`/`aria-expanded`/`aria-checked` are used correctly, the intensity control is a real Radix slider (`role="slider"`, `aria-label="Neural depth"`), and both `prefers-reduced-motion` *and* `prefers-reduced-transparency` are respected system-wide — genuinely above-average coverage. `app.explore.tsx`'s search input has an explicit `_focusVisible` outline. | Audit color contrast of the `faint`/`muted`/`ghost` text tokens (e.g. `rgba(235,235,248,0.52)` captions) against the gradient `Scene` backgrounds, and confirm `LiquidGlass`'s `surface()` recipe has an explicit `_focusVisible` state for keyboard users on every control, not just the one hand-added on the search input. |
| 9 | Empty-state grace | 4 | A dedicated `GlassEmptyState` component exists (`src/components/SereneScreen.tsx`). Sample/placeholder data is explicitly and honestly labeled rather than presented as real ("Sample data — your sessions will appear here" and "Sample insights — your real history builds as you practise" in `app.progress.tsx`), and `app.explore.tsx`'s search has a graceful "Nothing matches…" state with a suggestion. | Confirm `GlassEmptyState` is actually wired into a real first-run/zero-session condition (e.g. before any session has ever been played) — from the routes read, the "sample data" captions currently substitute for it rather than the component being invoked directly. |
| 10 | Honesty (no fake/misleading claims, no dark patterns) | 5 | Consistently honest copy throughout: landing states "The camera stays on your device"; `app.profile.tsx` discloses "Attunement analyzes your camera feed fully on-device… Frames are never uploaded or stored," "Sign-in coming — exploring as guest," and "Pro is coming soon — checkout isn't live on this build yet" rather than faking a working paywall; Export/Delete-data rows plainly state the features aren't built yet. No fake urgency, no forced signup, no dark-pattern upsell observed. | None needed for honesty itself; consider surfacing the Free plan's 20-min/day cap before "Begin" on the landing screen for maximal pre-commitment transparency. |

### Overall score: **39 / 50**

### Market-readiness verdict

SmartSound is not a student project — the `LiquidGlass` material system, the `Scene` cross-fade engine, and the motion/reduced-motion discipline are genuinely sophisticated engineering that holds up next to Calm's polish in isolation. But it is not shippable next to Calm today: the single most important screen (the Player) has a **verified, reproducible first-paint layout bug** where a core control visibly collides with primary navigation, the onboarding is one screen deep against Calm's guided multi-step flow, and the "immersive scene" — Calm's signature — is currently pure CSS gradients rather than the photographic/textured depth Calm is known for. This reads as a strong, technically-credible prototype with real craft in its design system, held back from parity by a handful of concrete, fixable gaps rather than a fundamental design-quality deficit.

### Top 5 gaps to close before it could rival Calm (ranked by impact)

1. **Fix the Player-screen tab-bar overlap** (`src/routes/app.player.tsx` line 202) — a verified, reproducible bug on the app's most-used screen, at both viewports; undermines trust in the whole product regardless of how polished everything else is.
2. **Deepen onboarding past one screen** — add a short goal/intent step and prime the camera permission ask before the user is dropped into `/app`, closer to Calm's guided first-run.
3. **Move `Scene` from flat CSS gradients toward real photographic/textured depth** — this is Calm's single most recognizable design signature, and SmartSound's current version reads as abstract/generative (Endel-like) rather than Calm-like.
4. **Close the accessibility loop on contrast and focus rings** — verify `faint`/`muted`/`ghost` text tokens meet contrast minimums against the gradient skies, and make sure every `LiquidGlass` control (not just the search input) has a visible keyboard focus state.
5. **Give the brand a distinct typographic signature** — the SF-only HIG type scale is disciplined but generic; a custom wordmark/display treatment would move SmartSound from "well-built Apple-style app" toward a recognizable brand the way Calm's script logotype does.
