# /goal — SmartSound Landing Page (Fable 5 build)

> Paste this whole block as a `/goal` command into the `claude-vps` session. Model: Fable 5. Builds on `UI-Design-Bible.md` (Endel/Oura/Calm/Liquid Glass tokens) already in the project — reuse those design tokens, don't reinvent them.

---

## /goal

Build a **SmartSound marketing landing page** — a luxurious, tasteful, dark, neuroacoustic-brand landing experience that sells the app and lets visitors launch straight into it. Stack: React + TypeScript, Tailwind, Framer Motion, Three.js/React Three Fiber for 3D, WebGL/shader work for the pixel hero. Reuse the design tokens and Liquid Glass recipe from `UI-Design-Bible.md`.

### 1. Hero section — Antimetal-style pixel animation
- Full-viewport hero on pure black (`--bg-base`). A **particle/pixel field** rendered in WebGL (Three.js `Points` or a fragment shader) that forms a loose grid of small glowing squares/dots.
- On load and on mouse-move, pixels **react and displace** in a fluid, physics-y way (like Antimetal's site) — nearby pixels repel/ripple from the cursor, settle back with spring easing.
- Pixels subtly shift color along the `--ring-cool` → `--ring-warm` gradient, tying the hero to the app's biofeedback ring identity.
- Headline (white, bold, tight) + subhead (muted grey) centered or left-aligned over the field; a primary **Liquid Glass CTA button** ("Launch SmartSound") that routes/links directly into the running app.
- Performance: cap particle count adaptively (fewer on mobile), pause animation when tab is hidden.

### 2. Sticky-scroll brain / brainstem section
- Directly below the hero: a **sticky-positioned 3D brain visualization** (React Three Fiber — low-poly or wireframe brain mesh, glowing neural connections pulsing along `--ring-cool`/`--ring-warm`) pinned to the viewport while the user scrolls.
- As the user scrolls, a **"brain stem" line** — a vertical glowing spine/path — extends downward from the brain, acting as the scroll's visual spine/timeline.
- Content sections (How it works, Features, Science, FAQ, etc.) are positioned **along the brain-stem path**, each represented as a node/branch off the stem.
- Each section **fades and slides in** (Framer Motion `whileInView`, staggered) as its node on the stem comes into view; the brain visual subtly reacts (a synapse lights up, a pulse travels down the stem) to mark the transition.
- Once the last section resolves, the brain un-sticks and scrolls away normally, or gently dissolves into pixels (bridge back to the hero motif).

### 3. Liquid Glass throughout
- Apply the Liquid Glass material (from the design bible tokens: `backdrop-blur-2xl`, `bg-white/[0.06]`, inset border, specular sheen) to: nav bar, CTA buttons, feature cards, FAQ accordion items.
- **Hover behavior:** on hover, glass panels get a **moving specular highlight** that follows the cursor position (mouse-tracked gradient), a slight lift (`translateY(-2px)`), and glow intensification — tasteful, not gimmicky. Keep transitions ~200-300ms, `--ease-calm`.
- Buttons: primary CTA has a gradient tint glass fill; secondary/ghost buttons are plain glass.

### 4. Pixelated elements (brand motif, used sparingly)
- Reuse the hero's pixel-field language as a recurring accent: pixelated app-icon/logo mark, pixel-dissolve transitions between major sections (e.g., content assembles from pixels as it scrolls into view, or the brain "dissolves" into pixels at hero boundary), pixel-noise texture faintly overlaid on dark backgrounds.
- Don't overuse — it's a signature accent (hero + transitions), not a texture slapped everywhere.

### 5. Sections to include (each a "branch" off the brain stem)
1. **Hero** (pixel field + CTA)
2. **How it works** — 3-step visual: camera reads rPPG heart rate → audio adapts in real time → ring visualizes the closed loop
3. **Live demo teaser** — an embedded or looping preview of the actual `BiofeedbackRing` component (pull the real component from the app, not a mockup)
4. **Science / credibility** — short, tasteful copy on neuroacoustic adaptation (no invented clinical claims — keep it honest/marketing-safe)
5. **FAQ** — Liquid Glass accordion, fades in per the brain-stem stagger pattern
6. **Final CTA / footer** — "Launch SmartSound" glass button again, social/contact links

### 6. App access
- The CTA(s) route into the actual running SmartSound app (same repo/deploy) — either as `/app` route in the same React app, or a prominent link to the deployed app URL. Confirm which routing setup exists in the current `smartsound` project before choosing; don't break the existing app build.

### 7. Tone & restraint
- Luxurious, tasteful, minimal — more Apple/Antimetal than flashy crypto-site. Generous whitespace, slow confident motion, no more than the accent gradient (`--ring-cool` → `--ring-warm`) as color. Every animation should feel calm and intentional, matching the "neuroacoustic calm" brand — nothing jittery or gimmicky.

### 8. Technical acceptance criteria
- 3D/WebGL hero and brain run at acceptable frame rate on a mid-range laptop; degrade gracefully (reduced particle count / static fallback) on low-end devices and reduced-motion preference (`prefers-reduced-motion` disables heavy animation).
- Fully responsive (mobile: brain-stem layout collapses to a simpler vertical fade-in scroll, hero pixel field reduced density).
- No console errors, production build passes, Lighthouse performance reasonable (hero/3D content lazy-loaded, not blocking first paint).
- Deploy and report the live URL.

### Deliverables
`LandingPage.tsx`, `PixelHero.tsx` (WebGL/shader hero), `BrainStemScroll.tsx` (sticky 3D brain + scroll spine), `GlassCard.tsx` / reuse `GlassButton.tsx` from the app, `FaqAccordion.tsx`, plus any Three.js scene/shader files. Wire the CTA to the live app route. Build, deploy, confirm no regressions to the existing SmartSound app, and report the URL.
