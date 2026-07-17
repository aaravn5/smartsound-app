# SmartSound — Master Build Doc (Fable 5 /goal)

> One consolidated file: session context + full design system + the complete build spec for both the **app UI** and the **landing page**. Paste the `/goal` block at the bottom into `claude-vps` (set `/model claude-fable-5` first).

---

## Part 1 — Session context (what's already set up)

- **VPS:** `root@2.25.76.220`, Ubuntu 24.04, Node 22, Claude Code installed, logged into your Claude Max subscription.
- **Persistent session:** tmux session `claude`, auto-restarts on reboot via systemd (`claude-tmux.service`). Access from your Mac with the shortcut `claude-vps`.
- **Plugins installed (user scope, active):**
  - `andrej-karpathy-skills` — coding discipline (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution)
  - `superpowers` — brainstorming, subagent-driven dev, TDD, systematic debugging, skill authoring
  - `ruflo-core`, `ruflo-swarm`, `ruflo-rag-memory`, `ruflo-neural-trader` — agent swarm/memory/trading tooling
  - `higgsfield` CLI + skills (`higgsfield-generate`, `higgsfield-soul-id`, `higgsfield-product-photoshoot`, `higgsfield-websites`, `higgsfield-marketplace-cards`) — AI image/video generation, available if the build wants generated visual assets
- **Project:** `/root/projects/smartsound` — a closed-loop neuroacoustic web app (adaptive audio ⟷ live rPPG heart rate via camera ⟷ a biofeedback ring visualizing the loop). Already has 10 milestones built, typechecked, and passing build as of last check.
- **Design research already done** (Mobbin, logged-in Chrome): studied real screens from **Endel** (primary reference — black canvas, thin white line-art, minimal single-focus UI), **Oura** (score-ring gauge, navy theme, white pill buttons), **Calm** (immersive gradient ambience, floating soft controls). Plus research on **Apple Mindfulness** (breathing ring pattern) and **Lungy** (live-signal-responsive visuals).

---

## Part 2 — Design tokens (carry into both app + landing page)

```css
:root {
  /* Canvas */
  --bg-base:        #000000;
  --bg-alt:         #0A0A0F;
  --bg-navy:        #0E1330;   /* Oura-style alt theme */

  /* Text */
  --text-primary:   #FFFFFF;
  --text-muted:     rgba(255,255,255,0.50);
  --text-faint:     rgba(255,255,255,0.30);

  /* Ring / accent gradient — the only real color, used everywhere for consistency */
  --ring-cool:      #38BDF8;   /* cyan — calm / low HR */
  --ring-warm:      #A78BFA;   /* violet — elevated HR */
  --ring-glow:      0 0 60px rgba(120,170,255,0.45);

  /* Liquid Glass material */
  --glass-fill:      rgba(255,255,255,0.06);
  --glass-border:    rgba(255,255,255,0.12);
  --glass-blur:      24px;
  --glass-highlight: rgba(255,255,255,0.20);
  --glass-shadow:    0 8px 32px rgba(0,0,0,0.45);

  /* Pixelation motif */
  --pixel-size:      4px;      /* base pixel/particle grid unit */
  --pixel-cool:      var(--ring-cool);
  --pixel-warm:      var(--ring-warm);

  /* Motion */
  --ease-calm:       cubic-bezier(0.22, 1, 0.36, 1);
  --fade-in:         800ms;
}
```

**Liquid Glass recipe:** `backdrop-blur-2xl` · `bg-white/[0.06]` · `1px inset border rgba(255,255,255,0.12)` · top-edge highlight · `shadow-[0_8px_32px_rgba(0,0,0,0.45)]` · `rounded-full` (buttons) / `rounded-3xl` (bars/cards) · cursor-tracked specular sheen on hover.

---

## Part 3 — 🎯 THE FULL /goal PROMPT

> Paste everything below the line into `claude-vps` as one `/goal` command.

---

### /goal

Build out **SmartSound** end-to-end across two connected surfaces — the **app itself** and a **marketing landing page** — sharing one luxurious, tasteful, dark neuroacoustic design system. Stack: React + TypeScript, Tailwind, Framer Motion, Three.js/React Three Fiber for 3D/WebGL. Reuse the design tokens above everywhere; do not introduce a second visual language.

## A. THE APP (reskin over existing rPPG + audio logic — do not rewrite the engine)

**Layout:** one full-bleed dark screen, no nav chrome, `--bg-base` background.

**`BiofeedbackRing.tsx`** — centerpiece SVG/canvas ring, pulses once per detected heartbeat from the live rPPG signal. Stroke gradient `--ring-cool` → `--ring-warm`, outer glow that brightens on each beat. As measured HR drops, slow the pulse + cool the gradient + mellow the soundscape; as HR rises, warm/quicken it — this is the visible closed loop.

**`HeartRateReadout.tsx`** — below the ring: large HR number + `bpm` + trend arrow, low-opacity, letter-spaced, Oura-style restraint (no dashboard chrome).

**Native buttons (`GlassButton.tsx`)** — build these as **real native-feeling controls**, not web-generic buttons:
- Use native platform affordances: proper `<button>` semantics, native press states, haptics-style micro-feedback (scale 0.96 + spring on press, like iOS), native focus rings, full keyboard operability, correct touch target sizes (min 44px) for mobile/PWA use.
- Variants: `primary` (play — brighter glass, gradient tint), `ghost` (icon-only plain glass), `pill` (toggle).
- Liquid Glass material per the recipe above; specular sheen sweep on hover/press.

**Pixelation in the app (luxurious, not gimmicky):**
- App boot/loading state: the ring **assembles from pixels** — small squares converge from a scattered field into the ring shape over ~1s, `--ease-calm`.
- Session start/stop: a brief **pixel-dissolve transition** (ring or screen dissolves into its pixel grid and reforms) rather than a hard cut.
- A faint, near-invisible **pixel-noise texture** overlaid on the black background for depth (never distracting).
- Use `--pixel-size` (4px grid) consistently so all pixel effects feel like one coherent material, not several different effects.

**Controls bar:** single frosted Liquid Glass bar at the bottom — play/pause, session timer, soundscape toggle.

**Acceptance:** dark single screen, ring pulses in sync with live camera HR, glass buttons feel native and tactile, pixel transitions are smooth and rare (accents, not decoration everywhere), no console errors, production build passes.

## B. THE LANDING PAGE (new — sells the app, launches into it)

**Hero — Antimetal-style pixel field:** full-viewport WebGL particle/pixel grid on `--bg-base`. Pixels ripple/displace from cursor movement with spring physics, settle back naturally. Color drifts along `--ring-cool` → `--ring-warm`. Headline + subhead over the field; primary Liquid Glass CTA ("Launch SmartSound") linking straight into the live app. Adaptive particle count for perf; pause when tab hidden; respect `prefers-reduced-motion`.

**Sticky-scroll brain / brain-stem section:** below the hero, a sticky-pinned 3D brain (React Three Fiber, low-poly/wireframe, glowing neural connections in the ring gradient) stays in view while a **glowing brain-stem spine** extends downward as the user scrolls. Content sections — How it works, Live demo (embed the real `BiofeedbackRing` component), Science/credibility, **FAQ**, final CTA — sit as nodes/branches off the stem and **fade + slide in** (`whileInView`, staggered) as their node comes into view, with a small synapse-pulse on the brain marking each transition. Brain un-pins or pixel-dissolves once the last section resolves.

**Liquid Glass throughout:** nav bar, CTA buttons, feature cards, FAQ accordion — glass recipe above, cursor-tracked specular highlight on hover, slight lift on hover, ~250ms `--ease-calm` transitions.

**Luxurious pixelation on the landing page:** hero particle field is the anchor; reuse pixel-dissolve as the transition **between** major sections (content assembles from pixels as it scrolls into view); a pixelated version of the SmartSound mark as a recurring signature. Restraint is the luxury — sparse, deliberate, never noisy.

**Native buttons on landing page:** same `GlassButton` component family as the app — consistent native feel (real press states, proper semantics, correct touch targets) across both surfaces, not a separate marketing-site button style.

**Sections:** Hero → How it works → Live demo teaser (real component, not a mockup) → Science/credibility (honest, no invented clinical claims) → FAQ (glass accordion) → Final CTA/footer.

**App access:** CTA(s) route into the actual running SmartSound app — confirm existing routing (e.g. `/app`) before wiring; don't break the current app build.

## C. Shared acceptance criteria

- One coherent design system across app + landing page — same tokens, same button component, same pixel/glass language.
- Responsive: mobile collapses the brain-stem scroll to a simpler vertical fade-in sequence, reduces hero particle density.
- `prefers-reduced-motion` disables heavy 3D/particle animation with a graceful static fallback.
- No console errors, production build passes, reasonable Lighthouse performance (3D/hero content lazy-loaded, not blocking first paint).
- Deploy both surfaces and report the live URL(s).

### Deliverables
App: `SmartSoundScreen.tsx`, `BiofeedbackRing.tsx`, `GlassButton.tsx`, `HeartRateReadout.tsx`.
Landing: `LandingPage.tsx`, `PixelHero.tsx`, `BrainStemScroll.tsx`, `FaqAccordion.tsx`, shared `GlassButton.tsx`, Three.js/shader files as needed.
Shared: Tailwind config extending the tokens in Part 2.

---

*Compiled from the full session: VPS setup → plugin installs → Mobbin design research (Endel/Oura/Calm) → this consolidated build spec.*
