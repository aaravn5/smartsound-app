# Desktop.fm — record-pressed minimalism for SmartSound

**Date:** 2026-07-07
**Branch:** worktree-desktop-fm-record
**Status:** approved to build ("build this out and ship it")

## Goal

Replace the "Pressed at Night" dark design system across **every** SmartSound
route with a near-monochrome, light, Apple-product-page aesthetic modeled on
Desktop.fm — but the hero object is a **vinyl record** (not a CD), and the app's
living `--signal` biofeedback accent survives as *the one color*, recolored to a
calming blue gradient. The sound engine, biometric loop, player controls, and
all UX flows are **functionally unchanged** — reskin only.

## Decisions (locked)

1. **Scope:** replace everywhere. All routes adopt the new look.
2. **Color:** achromatic UI (carbon black on calming grey), `--signal` is the
   only color, recolored to **cool calming blue → soft periwinkle** gradient.
   It drives the record's crossing laser lines, the signal ring, and focus glows.
3. **Hero:** a fresh `@react-three/fiber` 3D scene — matte-black record, chrome
   outer rim, dark center hub + spindle, concentric groove speculars, floating
   at a slight tilt on the grey canvas, with two thin crossing laser lines in the
   calming-blue signal gradient. Below it, the macOS app-window card + one black
   lozenge CTA.

## Token system (Desktop.fm)

| Role | Value |
|------|-------|
| Canvas | `#f1f2f3` (flat calming grey — retire scene gradients/photos/grain) |
| Canvas deep | `#eaebed` |
| Card surface | `#ffffff` |
| Ink primary | `#111111` (carbon black) |
| Ink secondary | `#2d2d2d` (graphite) |
| Hairline | `#dddddd` (pale stone) |
| Muted | `#b4b4b4` (silver mist) |
| Accent / CTA | `#111111` (carbon black — the one filled button) |
| Signal (the one color) | calming blue gradient via `--signal` |

- **Radii:** card `25px`, button `20px` (lozenge), window-chrome `13px`,
  default `1.5px` (sharp). Record sleeves stay their real-jacket radius.
- **Shadow (card elevation):** `0 1px 3px rgba(17,17,17,.08), 0 4px 12px rgba(17,17,17,.06)`.
- **Fonts:** system stack `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
  at weights **700/800** (500 for the smallest tags). Numbers keep a **system mono**
  (`ui-monospace, 'SF Mono', Menlo`) at 800 = "stamped serial." Instrument Serif,
  Hanken Grotesk, JetBrains Mono are dropped from the app UI (emails unchanged).
- **Type scale:** caption 12 / body-sm 16 / body 18 / heading 28, line-height
  locked 1.25, heading tracking -0.036em.

## Implementation phases

1. **Token layer** — rewrite `panda.config.ts` tokens (colors, fonts, radii,
   shadows) + `src/index.css` so the light Desktop.fm palette is the **default**
   (flip default from dark → light). Semantic tokens (`bg`, `text`, `accent`,
   `card`…) re-point; cascade carries most routes for free.
2. **Signal recolor** — narrow `STATE_ANCHORS` in `src/design/signal.ts` to a
   calming blue hue range (low-mid chroma), and `signalColor()` in `lib/format.ts`.
3. **Retire immersive scene** — flatten `Scene`, `LivingScene`, `LivingSceneCanvas`,
   `BandField`, `ProceduralScene`, and `app.tsx`'s aurora blooms to the flat grey
   canvas (keep signal-driven pulse where cheap; drop nature photos/film grain).
4. **Primitives** — white `25px` card + elevation shadow in `Card.tsx`/`LiquidGlass.tsx`;
   add a shared **carbon-black lozenge button** recipe with trailing `›`.
5. **3D record hero** — new R3F scene + macOS app-window card; replace `MacBookHero`
   on the landing (both scroll + reduced branches). Restyle the vinyl components
   (`RecordDisc`, `VinylDisc`, `RecordSleeve`) to matte-black-on-grey with chrome rim.
6. **Per-route pass** — drop serif → system heavy weights; recolor inline hex
   hardcodes (§4 of inventory) to the monochrome + blue-signal palette; restyle
   Radix slider/switch/tabs.
7. **Verify** — `npm run typecheck`, `npm run build`, `npm run contrast:audit`,
   run the app and screenshot the landing + a couple of routes.
8. **Ship** — commit, push, open draft PR.

## Non-goals

- No change to the audio engine, biometric DSP, closed loop, or any UX flow.
- Emails keep their own theme (`src/emails/theme.ts`) — out of scope.
- No new routes or features. Reskin only.
