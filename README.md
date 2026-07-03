# SmartSound

A closed-loop neuroacoustic instrument: it senses your physiological state
through the front camera (local-only) and reshapes a generative soundscape in
real time to steer you toward a target cognitive state.

This repo is being built against the master brief in the §-numbered spec, in the
milestone sequence of §12. **No vibecoded slop** (§0) is the operating contract.

## Run

```bash
npm install       # note: Park UI is deferred — see PORTS.md
npm run dev       # vite dev server (regenerates routes + panda tokens)
npm run build     # panda codegen → route gen → tsc → vite build
npm run typecheck # panda codegen → route gen → tsc
```

## Stack (§4.1)

React + TypeScript · TanStack Router · Panda CSS (design tokens) · Motion One ·
Web Audio API (engine) · MediaPipe FaceMesh + custom rPPG DSP (biometrics).

## Milestone status (§12)

- [x] **M1 — Foundation + design system.** Vite/React/TS, TanStack Router, the
      full §5 Panda token system, marketing hero with the interactive ring.
- [x] **M2 — Audio engine.** Web Audio graph (`engine/audio`): detuned chord
      pads, pink-noise bed, procedural bass pulse, sparse scheduled percussion,
      one phase-locked entrainment LFO doing AM across layers, comp→limiter
      master. Endless (no loop-obvious) per state profile.
- [x] **M3 — Signal ring driven by real FFT.** `SignalRing` consumes live
      analyser bins (and real pulse when attuned); generative preview only idle.
- [x] **M4 — rPPG pipeline (local-only).** `engine/biometric`: camera capture →
      forehead/cheek ROI → POS projection → bandpass/FFT HR, respiration,
      steadiness, confidence, baseline. No frame ever leaves the device.
- [x] **M5 — Closed loop.** `engine/loop`: damped, rate-limited controller
      steering tempo/density/brightness/entrainment toward target; safety rail,
      confidence gating, manual-override window on the neural slider.
- [x] **M6 — Screens.** Onboarding (intent → camera baseline-read → calibrate),
      Session instrument, Spotify-style Library (Radix Tabs + bento) & now-
      playing bar, Insights (live real trace), Settings. Apple-calm materials.
- [x] **M7 — Circadian + Scenarios + NASA-TLX.** Time-of-day suggestion,
      phased scenario runner (initial/middle/end; sleep → delta), TLX check-in
      feeding the loop's calibration offset.
- [x] **M8 — React Email + Resend.** Five templates in `emails/`, verified to
      render (`npm run emails`). `sendEmail` throws without `RESEND_API_KEY`
      rather than faking a send.
- [x] **M9 — Port pass.** Nothing to port — authored natively in Panda; zero
      Tailwind `className` strings in `src/`. See `PORTS.md`.
- [x] **M10 — Critique.** See "Verified vs. needs-a-browser" below.

## Verified vs. needs-a-browser

Verified headlessly: `npm run typecheck` and `npm run build` pass; all six
routes serve 200; the token system materializes in the emitted CSS; all five
emails render to valid HTML; no Tailwind strings, no frame upload in the rPPG
path. **Needs a real browser + camera to observe** (can't be driven headlessly
here): actual audio playback, live camera rPPG numbers, and the ring's motion.
The Web Audio graph, POS DSP, and closed loop are implemented for real — run
`npm run dev` and open a session to exercise them.

## Known deviations & honest edges

- Park UI deferred (needs `bun`); controls use Radix + Panda. See `PORTS.md`.
- rPPG ROI is centered boxes, not MediaPipe FaceMesh (offline/light). DSP is real.
- The ring's canvas gridlines use a literal 5%-white hairline (a neutral render
  detail, not a design color) — the one hex in the UI layer.

## The signature: `--signal`

The accent is not a fixed brand color. `--signal` is a single OKLCH value bound
to cognitive state (§5.2), updated live. Everything reading the `signal` token —
ring, glows, focus rings — literally becomes the user's state. See
`src/design/signal.ts`. At M1 the driving scalar comes from an interactive
preview; from M5 it comes from the biometric closed loop.
