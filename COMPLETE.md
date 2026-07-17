# SmartSound — Complete Build Reference (single source of truth)

> Everything needed to build SmartSound fully, with zero prior context. If every other file/chat is lost, this one file is sufficient. Last consolidated: 2026-07-03.

---

## PART 1 — INFRASTRUCTURE

**VPS:** `root@2.25.76.220` · Ubuntu 24.04 · 31GB RAM · x86_64 · Node 22 + npm · Claude Code installed and logged into Claude Max (`aaravnaveen21@gmail.com`).

**Persistent session:** tmux session `claude`, working dir `/root/projects`, project at `/root/projects/smartsound`. Auto-restarts on VPS reboot via systemd unit `claude-tmux.service`.

**Access from Mac:** Terminal → `claude-vps` (a `~/.zshrc` function that SSHes in and attaches to the tmux session). If "command not found," run `source ~/.zshrc` once first. Full fallback command: `ssh -t root@2.25.76.220 'tmux attach -t claude'`.

**Detach / leave running unattended:** inside the session press `Ctrl-b` then `d`. The tmux session and any in-progress agent task keep running on the VPS regardless of the Mac being closed, asleep, or off. Reattach anytime with `claude-vps`. Nothing stops it except typing `/exit` or the VPS itself being shut down.

**Installed plugins (user scope, active on the VPS session):**
- `andrej-karpathy-skills` — coding discipline: Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution
- `superpowers` — brainstorming, subagent-driven dev w/ code review, systematic debugging, TDD, skill authoring
- `ruflo-core`, `ruflo-swarm`, `ruflo-rag-memory`, `ruflo-neural-trader` — agent swarm/coordination/memory tooling. **Caution:** never let neural-trader execute real trades or move funds — simulation only.
- `higgsfield` CLI + skills (`higgsfield-generate`, `higgsfield-soul-id`, `higgsfield-product-photoshoot`, `higgsfield-websites`, `higgsfield-marketplace-cards`) — authenticated as `aaravnaveen06@icloud.com`, workspace "Private" selected, **free plan, only 10 credits**. Use sparingly — not enough headroom for bulk asset generation.

**Models:**
- Orchestration/coordination chat (Mac, driving SSH/files): Sonnet 5 is sufficient.
- The actual SmartSound build (VPS session): **Fable 5** — best fit for dense creative/visual frontend work. Set with `/model claude-fable-5` inside the VPS session (a `/model` change in a Mac chat does NOT affect the VPS — they are fully separate sessions sharing only the account/subscription).
- Effort: set `/effort high` on the VPS session before running the build — this is a long, dense task.

---

## PART 2 — WHAT SMARTSOUND IS

A **closed-loop neuroacoustic web app**: a camera reads the user's heart rate in real time via rPPG (remote photoplethysmography — detecting pulse from subtle skin color changes on camera), the audio engine adapts its soundscape in real time based on that heart rate, and a biofeedback ring on screen visualizes the loop (ring pulse synced to heartbeat, color/speed shifting as heart rate changes). Status as of last build check: 10 milestones complete, typechecked, build passing.

---

## PART 3 — DESIGN RESEARCH (from Mobbin + supporting research)

Researched via Mobbin (logged-in session) and web research. All content below is original synthesis/notes, not reproduced text or images from any source.

**Endel** (primary reference) — neuroacoustic sound app, adapts audio to heart rate/time/weather/location in real time. Screens observed: pure black backgrounds, huge negative space, thin white line-art illustrations (concentric rings around a head profile, soundwave/DNA curve motifs, an interlocking-knot logo mark), centered white headline + muted grey subtext, full-width dark low-contrast "Continue" button. Fully monochrome except the generative visual itself.

**Oura** — health/sleep ring app. Screens observed: deep navy/indigo backgrounds, purple-mountain-gradient + lifestyle-photo onboarding, white pill primary buttons ("Start") + transparent outline secondary buttons, and its signature **circular score-ring gauge** with a large centered number (e.g. a readiness score) as the hero data pattern.

**Calm** — meditation/sleep app. Screens observed: immersive scenic gradient backgrounds (blue mountains, night sky, aurora purple), soft rounded floating icon-button controls over imagery, script wordmark.

**Apple Mindfulness/Breathe** (supporting research, not Mobbin) — the canonical expanding/contracting breathing-ring visual; the reference for making a physiological rhythm feel calming rather than clinical.

**Lungy** (supporting research) — interactive visuals that respond to the user's *actual live* breath/biosignal in real time rather than a fixed animation loop; the reference for genuine live-signal responsiveness.

**Synthesis / decision:** model SmartSound's ring on Endel's restraint + Apple's breathing-ring cadence + Lungy's live-signal responsiveness; borrow Oura's score-ring/readout language for the HR number; optionally borrow Calm's ambient gradient depth as a background option.

**Ruled out:** Headspace-style large illustrated content libraries (SmartSound is one adaptive session, not a catalog); generic breathing apps with a fixed non-live animation (misses the closed-loop point entirely).

---

## PART 4 — DESIGN TOKENS (single source of truth — use identically everywhere)

```css
:root {
  /* Canvas */
  --bg-base:        #000000;
  --bg-alt:         #0A0A0F;
  --bg-navy:        #0E1330;   /* Oura-style alt theme, optional */

  /* Text */
  --text-primary:   #FFFFFF;
  --text-muted:     rgba(255,255,255,0.50);
  --text-faint:     rgba(255,255,255,0.30);

  /* Accent gradient — the only real color in the whole product */
  --ring-cool:      #38BDF8;   /* cyan — calm / low heart rate */
  --ring-warm:      #A78BFA;   /* violet — elevated heart rate */
  --ring-glow:      0 0 60px rgba(120,170,255,0.45);

  /* Liquid Glass material */
  --glass-fill:      rgba(255,255,255,0.06);
  --glass-border:    rgba(255,255,255,0.12);
  --glass-blur:       24px;
  --glass-highlight: rgba(255,255,255,0.20);
  --glass-shadow:    0 8px 32px rgba(0,0,0,0.45);

  /* Pixelation motif */
  --pixel-size:      4px;

  /* Motion */
  --ease-calm:       cubic-bezier(0.22, 1, 0.36, 1);
  --fade-in:         800ms;
}
```

**Liquid Glass recipe:** `backdrop-blur-2xl` · `bg-white/[0.06]` fill · `1px inset border rgba(255,255,255,0.12)` · soft top-edge highlight · `shadow-[0_8px_32px_rgba(0,0,0,0.45)]` · `rounded-full` for buttons / `rounded-3xl` for bars & cards · a specular sheen that tracks the cursor and sweeps across on hover/press · ~250ms transitions on `--ease-calm`.

---

## PART 5 — THE FULL BUILD SPEC (paste as one `/goal` on the VPS session)

### /goal

Build out **SmartSound** end-to-end across two connected surfaces — the **app itself** and a **marketing landing page** — sharing one luxurious, tasteful, dark neuroacoustic design system defined in Part 4 above. Stack: React + TypeScript, Tailwind, Framer Motion, Three.js/React Three Fiber for 3D/WebGL. Reuse the design tokens everywhere; do not introduce a second visual language. This is a long, comprehensive build — take the time needed, expect it to run for hours across both surfaces. Do not shortcut, simplify, or ship a stripped-down version to finish faster; work through every section below fully.

#### A. The app (reskin over the existing rPPG + audio engine — do not rewrite that logic)

- Single full-bleed dark screen, no nav chrome, `--bg-base` background.
- **`BiofeedbackRing.tsx`** — centerpiece SVG/canvas ring, pulses once per detected heartbeat from the live rPPG signal. Stroke gradient `--ring-cool` → `--ring-warm`, outer glow brightens on each beat. As measured HR drops: slow the pulse, cool the gradient, mellow the soundscape. As HR rises: warm and quicken it. This is the visible closed loop — must be obviously tied to the live camera signal, not decorative.
- **`HeartRateReadout.tsx`** — below the ring: large HR number + `bpm` + trend arrow, low-opacity, letter-spaced, Oura-style restraint, no dashboard chrome.
- **`GlassButton.tsx`** — native-feeling controls, not generic web buttons: real `<button>` semantics, native-style press feedback (scale 0.96 + spring), visible focus rings, full keyboard operability, minimum 44px touch targets. Variants: `primary` (play — brighter glass + gradient tint), `ghost` (icon-only plain glass), `pill` (toggle). Liquid Glass material per Part 4, specular sheen sweep on hover/press.
- **Pixelation (restrained, used as a signature accent, not decoration everywhere):** boot/loading state where the ring assembles from a scattered pixel field into shape (~1s, `--ease-calm`); a brief pixel-dissolve transition on session start/stop instead of a hard cut; a faint, barely-visible pixel-noise texture over the black background for depth. Use the `--pixel-size` (4px) grid consistently so every pixel effect reads as one coherent material.
- Controls bar: single frosted Liquid Glass bar at the bottom — play/pause, session timer, soundscape toggle.
- **Acceptance:** ring visibly and correctly pulses in sync with live camera-detected heart rate; buttons feel native and tactile; pixel transitions are smooth and used sparingly; zero console errors; production build passes.

#### B. The landing page (new — sells the app, launches into it)

- **Hero:** full-viewport WebGL pixel/particle field (Three.js `Points` or a fragment shader) on `--bg-base`, forming a loose grid of small glowing squares. Reacts to cursor movement — nearby pixels displace/ripple with spring physics, settle back naturally. Color drifts along `--ring-cool` → `--ring-warm`. Headline + subhead over the field; primary Liquid Glass CTA ("Launch SmartSound") linking directly into the live app. Adaptive particle count for performance (fewer on mobile), pause when tab hidden, respect `prefers-reduced-motion`.
- **Sticky-scroll brain / brain-stem section:** below the hero, a sticky-pinned 3D brain (React Three Fiber, low-poly/wireframe mesh, glowing neural connections pulsing in the ring gradient) stays fixed in the viewport while a glowing "brain-stem" spine visually extends downward as the user scrolls. Content sections sit as nodes/branches off that stem and fade + slide in (`whileInView`, staggered) as their node scrolls into view, with a small synapse-pulse on the brain marking each transition. The brain releases/pixel-dissolves once the final section resolves.
- **Sections (in order):** Hero → How it works (3-step: camera reads heart rate → audio adapts in real time → ring visualizes the loop) → Live demo teaser (embed the real `BiofeedbackRing` component, not a mockup) → Science/credibility (honest marketing copy, no invented clinical claims) → FAQ (Liquid Glass accordion, same fade-in stagger pattern) → Final CTA/footer.
- **Liquid Glass throughout:** nav bar, CTA buttons, feature cards, FAQ accordion — per the Part 4 recipe, cursor-tracked specular highlight on hover, slight lift on hover.
- **Luxurious pixelation:** hero particle field is the anchor motif; reuse pixel-dissolve as the transition between major sections (content assembles from pixels as it scrolls into view); a pixelated version of the SmartSound mark as a recurring signature element. Keep it sparse and deliberate — restraint is the luxury, never noisy or overused.
- **Native buttons:** reuse the exact same `GlassButton` component family as the app — one consistent native-feeling button system across both surfaces, not a separate marketing-site style.
- **App access:** CTA(s) route into the actual running SmartSound app (confirm existing routing, e.g. an `/app` route, before wiring — do not break the current app build).

#### C. Shared acceptance criteria

- One coherent design system across app + landing page: same tokens, same button component, same pixel/glass language.
- Responsive: mobile collapses the brain-stem scroll into a simpler vertical fade-in sequence and reduces hero particle density.
- `prefers-reduced-motion` disables heavy 3D/particle animation with a graceful static fallback.
- No console errors; production build passes; reasonable performance (3D/hero content lazy-loaded, not blocking first paint).
- Use the Higgsfield CLI only sparingly if at all — only 10 free credits available — prefer hand-built shaders/geometry/CSS over generated assets unless a specific asset is clearly worth spending a credit on.
- Deploy both surfaces and report the live URL(s) when fully done.

**Deliverables:** App — `SmartSoundScreen.tsx`, `BiofeedbackRing.tsx`, `GlassButton.tsx`, `HeartRateReadout.tsx`. Landing — `LandingPage.tsx`, `PixelHero.tsx`, `BrainStemScroll.tsx`, `FaqAccordion.tsx`, shared `GlassButton.tsx`, Three.js/shader files as needed. Shared — Tailwind config extending the Part 4 tokens.

---

## PART 6 — EXACT STEPS TO RUN THIS BUILD

1. On the Mac, open Terminal and run `claude-vps` (attaches to the persistent VPS session).
2. Run `/model claude-fable-5` (switches this VPS session to Fable 5).
3. Run `/effort high` if the command is available.
4. Run:
   ```
   /goal read COMPLETE.md in this project (Part 5 is the build spec) and build exactly what it specifies. Take the time needed — this may run for hours. Do not shortcut or simplify to finish faster.
   ```
   — or paste the full `/goal` block from Part 5 directly.
5. Once it's working, detach: `Ctrl-b` then `d`. Safe to close the laptop or walk away — it keeps running on the VPS.
6. Reattach anytime with `claude-vps` to check progress or see the final report and deploy URL(s).

---

## PART 7 — ⚠️ DANGEROUS PERMISSIONS / AUTO-RUN MODE (read before running an hours-long unattended build)

The VPS session has been observed running in **`auto mode on`** (also shown as `⏵⏵ accept edits on`) — this means Claude Code **auto-approves file edits and shell commands without asking first.** That's normally fine for routine coding, but for a long unattended build it means:

- It will run `npm install`, build commands, deploys, etc. **without pausing for your confirmation.**
- If it hits something genuinely destructive or unusual, Claude Code still shows a **"dangerous command" warning** for high-risk operations (e.g. `rm -rf`, force-push, dropping data, modifying system-level config) — but in auto mode these can still be waved through faster than you'd like if you're not watching.
- Since this build is meant to run **for hours while you're away**, you won't be there to review each dangerous-command prompt in real time.

**Before starting an hours-long unattended run:**
1. Check the current mode in the bottom status bar of the session (`⏵⏵ accept edits on` / `auto mode on` vs. a more conservative mode). Cycle modes with `Shift+Tab` if you want more control.
2. Recommended for this specific build: **auto mode is acceptable** for file edits and normal build/deploy commands (npm, git, build tools) since the task is scoped to the SmartSound project directory and non-destructive by design. But do **not** leave it running unattended if you've asked it to do anything involving: deleting data, modifying server/system config outside the project, touching production databases, or financial/trading actions (relevant given the `ruflo-neural-trader` plugin — that one should never execute real trades regardless of mode).
3. When you reattach after a long run, **review what actually happened** (`git log`, `git diff`, deploy history) before trusting the "done" report at face value — especially any shell commands it ran outside `npm`/`git`/standard build tooling.
4. If you want a safety net: before kicking off the goal, you can ask it to work in a **git branch** so the unattended run is easy to review/revert as a whole diff rather than trusting incremental auto-approved edits.

---

## PART 8 — HIGGSFIELD: WHAT IT'S FOR AND HOW TO USE IT HERE

**Status:** authenticated on the VPS as `aaravnaveen06@icloud.com`, workspace "Private" selected, **free plan — 10 credits only**.

**What the CLI can do** (`higgsfield` / `higgs` / `hf`):
- `generate` — create/cost/list/wait on image & video generation jobs
- `model list --video` / `model list` — see available generation models and params
- `workflow list` — pre-built generation workflows
- `soul-id` — train/manage a reusable subject reference ("Soul") for consistent generated characters/objects across images
- `product-photoshoot` — brand-quality image generation via mode-specific prompt enhancement (good fit if SmartSound ever wants polished marketing/hero photography)
- `marketing-studio` — Marketing Studio asset generation
- `marketplace-cards` — product card generation via backend prompt enhancement
- `website` — build/ship full-stack websites directly through Higgsfield's own pipeline (separate from the React landing page being hand-built per Part 5 — not needed for this project, listed for completeness)
- `voices` — text-to-speech / voice-change voice list
- `game` — deploy/publish browser games (not relevant here)
- `account` — check credits/plan/transactions (`higgsfield account status`)
- `upload` — upload media inputs for use in generation jobs

**How it fits into THIS build:** the Part 5 spec explicitly says to use Higgsfield **only sparingly, if at all** — hand-built shaders/geometry/CSS should be the default for the pixel hero, the 3D brain, and the Liquid Glass material, since those are things code can produce well and for free. Reserve Higgsfield credits (all 10 of them) for something code genuinely can't do well, e.g.:
- A single polished hero/reference **photograph or texture** for the landing page (via `product-photoshoot` or `marketing-studio`) if the pixel-field hero wants a background photo underneath it.
- A one-off **brand mark / favicon** generation if needed.

**Budget discipline:** check cost before generating — `higgsfield generate cost <model> ...` (or the equivalent cost-preview flag) before running any job, since 10 credits disappears fast. Do not generate multiple variations "to compare" — that's how 10 credits vanishes on one asset. Pick a strong prompt, generate once, evaluate, and only regenerate if it's unusable.

**If credits run out mid-build:** that's fine — nothing in the Part 5 spec strictly requires Higgsfield. Fall back to pure code (procedural gradients, CSS noise textures, Three.js primitives) for everything.

---

## PART 9 — STEPS TO SHIP (from finished build → live)

Run these in order once the `/goal` build reports itself done:

1. **Review before trusting "done."** In the VPS session (or via `git log` / `git diff` over SSH), check what actually changed — especially anything outside standard `npm`/`git`/build-tool commands (see Part 7 on auto-run mode).
2. **Run the app locally on the VPS to sanity-check:**
   ```
   cd /root/projects/smartsound
   npm run build
   ```
   Confirm the production build completes with no errors. Check `PORTS.md` in the project for which port the dev/preview server binds to if you want to test with the camera before shipping.
3. **Verify the core loop actually works**, not just that it compiles: open the deployed/preview URL, grant camera access, confirm the rPPG heart-rate read updates, confirm the `BiofeedbackRing` visibly pulses in sync, confirm audio adapts as heart rate changes.
4. **Check the landing page separately:** hero pixel field renders and reacts to cursor, sticky-scroll brain/brain-stem section pins and releases correctly, FAQ and other sections fade in on scroll, the "Launch SmartSound" CTA correctly routes into the live app.
5. **Check responsiveness and the reduced-motion fallback:** resize/test on a mobile viewport, and test with `prefers-reduced-motion` enabled (OS accessibility setting) to confirm heavy 3D/particle animation gracefully degrades instead of breaking.
6. **Deploy.** The build spec (Part 5) already instructs the agent to deploy and report live URL(s) as part of "done" — confirm it actually did this (check for a reported URL, e.g. a GitHub Pages / Vercel / similar link, matching what was seen in earlier SmartSound deploy activity in this project).
7. **Smoke-test the live URL(s)** from an actual browser (not just curl) — load both the landing page and the app route, repeat the checks in steps 3–5 against the live deployment, not just a local preview.
8. **Confirm HTTPS and that the domain/URL is what you expect** before sharing it anywhere.
9. **Only after all of the above pass:** consider the ship complete. If anything fails, reattach (`claude-vps`) and describe the specific failure — don't re-run the entire multi-hour `/goal` from scratch for a small fix; ask for a targeted fix instead.

---

## PART 10 — RECOVERY / IF THIS CHAT OR ANY FILE IS LOST

This file is saved in two places and needs nothing else to fully rebuild the plan:
- **Mac:** `~/SmartSound-COMPLETE.md`
- **VPS:** `/root/projects/smartsound/COMPLETE.md`

If it's ever missing from one location, copy it from the other:
```
scp ~/SmartSound-COMPLETE.md root@2.25.76.220:/root/projects/smartsound/COMPLETE.md
```
or the reverse:
```
scp root@2.25.76.220:/root/projects/smartsound/COMPLETE.md ~/SmartSound-COMPLETE.md
```
