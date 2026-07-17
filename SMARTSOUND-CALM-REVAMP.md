# SmartSound — full revamp: Apple Calm clone × Fitness rings × brain.fm (Liquid Glass, Apple HIG)

A **complete revamp** — nothing like the prior GOAT-dark build. SmartSound becomes essentially an
**Apple Calm clone in SmartSound's neuroacoustic format**: serene, immersive, luxurious, Apple-native
feeling. Keep the existing closed-loop **engine** (`src/engine/**`, `useEngine()`), replace everything
above it. Branch: `calm-revamp`.

## References (apply the installed skills — subagents READ these)
- **Apple Calm** (primary): immersive full-bleed nature/gradient scenes (dusk sky, aurora, deep water,
  rain), a **"Daily"** hero, serene minimal typography, soft floating controls over imagery, breathe
  bubble, sleep/meditation/focus sections, unhurried pacing.
- **Apple Fitness rings** (required component): the 3 concentric activity rings + the satisfying
  close-the-rings animation. Adapt to SmartSound: **Attune · Minutes · Streak** (or Sessions/Minutes/
  Calm-time) — a signature "SmartSound rings" progress object.
- **brain.fm**: functional-audio framing — modes **Focus · Relax · Sleep · Meditate**, science-backed
  copy (honest), a clean immersive player, timers.
- **Apple HIG + Liquid Glass**: read the installed skills — `apple-design`, `apple-design-materials`
  (**Liquid Glass** — use heavily: translucent layered frosted glass, specular highlights, depth,
  vibrancy), `apple-design-motion`, `apple-design-foundations`, `apple-design-interaction`, and the
  `hig-*` component skills. SF system type (`-apple-system`/SF Pro on web), HIG tab bar, spacing,
  controls, focus states, reduced-motion.

## Platforms
- **React (web)** — the buildable/deployable/verified app (Vite + Panda CSS + TanStack Router + motion).
- **SwiftUI (iOS)** — clean source under `ios/` (write-only here; no Xcode on this Linux VPS). Mirror
  the same structure/components (SmartSoundRings, LiquidGlass surfaces, the immersive player).

## New structure (completely different from before) — tabs
1. **Today** (Calm's "Daily"): time-aware immersive hero scene + a **"Daily Calm/Focus"** featured
   session (Begin), the **SmartSound rings** (today's Attune/Minutes/Streak), and a few recommended
   sessions. Serene, spacious.
2. **Explore** (Calm's library): categories — Focus · Relax · Sleep · Meditate · Soundscapes —
   immersive scene cards, each a session/soundscape mapped to the engine's states.
3. **Player** (immersive session): full-bleed animated gradient/scene, a soft central visual (the ring
   / a breathe bubble driven by the live loop), transport, timer, Attune (camera) toggle, Liquid Glass
   controls. The closed loop still runs underneath.
4. **Progress**: the **Fitness-style rings** big, weekly/monthly trends (dataviz-correct), streak,
   minutes, calm-time; honest (real/sample-labeled) data.
5. **Profile**: account (Apple/Google — reuse the `server/` scaffold), membership (keep Pro/Studio),
   settings, consent.

## Design system (Apple / Calm)
- Type: SF system stack (`-apple-system, "SF Pro Display", system-ui`), Calm-serene scale, generous
  line-height, minimal. (Distinct from the prior Clash Display.)
- Color: immersive gradient scenes as the canvas (dusk violet→indigo, aurora teal→green, deep-ocean
  blue, warm dawn); Liquid Glass surfaces on top; soft off-white ink; one calm accent per scene.
- **Liquid Glass** everywhere per `apple-design-materials`: translucent, blurred, layered, specular
  edge, vibrancy, depth shadows. This is the signature material.
- Motion: gentle, breathing, spring; the ring-close animation; scene cross-fades; reduced-motion.

## Milestones (each green + verified + committed; delegate to Sonnet/Fable, don't drop quality)
1. **Design system + Liquid Glass + SmartSoundRings** — Apple/Calm tokens, a real `LiquidGlass`
   surface component (per the skill), the `SmartSoundRings` Fitness-ring component (SVG, close
   animation), an immersive `Scene` gradient background component, `HIG` tab bar shell. Gate: build +
   a11y + 0 console errors.
2. **Today + Explore** — the Calm home + library over real engine states/catalog.
3. **Immersive Player** — the session screen wired to `useEngine()` (keep the loop), breathe/ring
   visual, Liquid Glass transport, Attune.
4. **Progress + Profile** — rings + trends; profile/account/membership (reuse `server/`).
5. **SwiftUI mirror** (`ios/`) — SmartSoundRings, LiquidGlass, Player, Today in SwiftUI (source).
6. **Polish + deploy** — reduced-motion, perf, 0 console errors; deploy; report URL.

## Bars
Luxurious, calm, Apple-native. Liquid Glass done right (not cheap blur). SmartSound rings feel like
Apple's. Honest (wellness tool, on-device camera, no fabricated data). Anti-slop. Keep the engine.
