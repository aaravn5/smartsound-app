# SmartSound — UI Design Bible & Master Build Prompt

> Ultra reference compiled from Mobbin design research (Endel, Oura, Calm) + biofeedback UI research (Apple Mindfulness, Lungy). Covers the design DNA of each reference app, extracted design tokens, and a copy-paste master prompt to build SmartSound's interface in **React + Liquid Glass** with an Apple-style biofeedback ring.
>
> **What SmartSound is:** a closed-loop neuroacoustic web app — adaptive audio ⟷ live rPPG heart rate (camera) ⟷ a pulsing ring that visualizes the loop.

---

## 0. TL;DR — the decision

**Primary reference: Endel.** It is the closest match to SmartSound — a neuroacoustic app that already adapts audio to heart rate, wraps each soundscape in a generative visual, and does it in a minimal, dark, single-focus UI.

Borrow the **biofeedback ring** pattern from **Apple Mindfulness**, the **live-signal responsiveness** from **Lungy**, the **score-ring data readout** from **Oura**, and the **immersive calm ambience** from **Calm**.

| Layer | Take from | Why |
|---|---|---|
| Overall canvas & mood | **Endel** | Proven neuroacoustic UI, audio tied to HR |
| The pulsing ring | **Apple Mindfulness / Breathe** | Gold-standard biofeedback ring |
| Ring reacts to live HR | **Lungy** | Makes the closed loop feel real |
| HR number / trend readout | **Oura** | Elegant biometric data without a dashboard |
| Optional ambient background | **Calm** | Serene depth when desired |

---

## 1. Reference research (from Mobbin, July 2026)

### 1.1 Endel — "Sounds, noise, calm, health"  ⭐ PRIMARY
- **Platform:** iOS, Android · **Category:** Health & Fitness, Music & Audio · **Rating:** 4.83
- **Captured screens:** onboarding (free tier); Home/focus-session screens are Pro-gated.
- **Design DNA (from actual screens):**
  - Pure **black `#000`** backgrounds, enormous negative space, fully monochrome.
  - **Thin white line-art** illustrations — concentric rings around a head profile, soundwave/DNA curves, the interlocking-knot logo mark.
  - **Centered headline** (white, ~28px, tight leading) + **muted grey subtext** (`rgba(255,255,255,0.5)`).
  - **Full-width dark "Continue" button** — rounded rectangle, low contrast, minimal.
  - The generative visual is the *only* color; everything else is restraint.
- **Flows present:** Onboarding, Home, Subscribing to premium, Privacy policy, Starting a focus session, Inviting friends.
- **Takeaway for SmartSound:** black canvas, one generative ring as the hero, hide all chrome except play/pause/timer.

### 1.2 Oura — "Simple, personal insights"
- **Platform:** iOS, Android · **Category:** Health & Fitness · **196 screens**
- **Design DNA:**
  - **Deep navy / indigo** backgrounds; onboarding uses **purple mountain gradients** + lifestyle photography.
  - **White pill primary buttons** ("Start") + **transparent outline secondary buttons** ("No Oura Ring yet?").
  - Hero element = **circular score-ring gauge** with a large number in the center (e.g. Readiness "90"), soft pastel accent per metric.
  - Clean data cards, generous spacing, restrained type.
- **Flows present:** Onboarding, Home, Sleep, Daily sleep data, Body clock, Daily readiness data.
- **Takeaway for SmartSound:** use the score-ring gauge language for the live HR readout; navy as an alt dark theme.

### 1.3 Calm — "Sleep, meditation, relaxation"
- **Platform:** iOS, Android, Web, Site · **Category:** Health & Fitness · **187 screens**
- **Design DNA:**
  - **Immersive scenic backgrounds** — soft blue mountain gradients, night sky, aurora purples.
  - **Soft, rounded, floating controls** over the imagery (circular icon buttons, low-contrast).
  - Script "Calm" wordmark; calm, photographic, depth-heavy.
- **Takeaway for SmartSound:** optional ambient gradient background behind the ring for a warmer, less clinical feel.

### 1.4 Apple Mindfulness / Breathe (research)
- The **animated breathing ring/flower** that expands and contracts is the canonical biofeedback visual — makes a physiological rhythm feel calming, not clinical.
- **Takeaway:** the SmartSound ring should breathe/pulse with the exact cadence of the measured signal.

### 1.5 Lungy (research)
- Interactive visuals that respond in **real time to the user's actual breathing/biosignal** — not a fixed loop.
- **Takeaway:** SmartSound's ring must be driven by the *live rPPG heart rate*, closing the loop visibly.

---

## 2. Extracted design tokens

```css
/* ---- SmartSound design tokens ---- */
:root {
  /* Canvas (Endel-first, Oura alt) */
  --bg-base:        #000000;   /* pure black canvas */
  --bg-alt:         #0A0A0F;   /* near-black radial */
  --bg-navy:        #0E1330;   /* Oura-style alt theme */

  /* Text */
  --text-primary:   #FFFFFF;
  --text-muted:     rgba(255,255,255,0.50);
  --text-faint:     rgba(255,255,255,0.30);

  /* Ring gradient (the only real color) */
  --ring-cool:      #38BDF8;   /* cyan — low/calm HR */
  --ring-warm:      #A78BFA;   /* violet — higher HR */
  --ring-glow:      0 0 60px rgba(120,170,255,0.45);

  /* Liquid Glass material */
  --glass-fill:     rgba(255,255,255,0.06);
  --glass-border:   rgba(255,255,255,0.12);
  --glass-blur:     24px;
  --glass-highlight: rgba(255,255,255,0.20);
  --glass-shadow:   0 8px 32px rgba(0,0,0,0.45);

  /* Motion */
  --ease-calm:      cubic-bezier(0.22, 1, 0.36, 1);
  --fade-in:        800ms;
}
```

### Liquid Glass recipe (Tailwind-ish)
```
backdrop-blur-2xl
bg-white/[0.06]
border border-white/[0.12]
shadow-[0_8px_32px_rgba(0,0,0,0.45)]
rounded-full            /* buttons */  |  rounded-3xl  /* bars/cards */
+ top inset highlight (pseudo-element gradient)
+ specular sheen sweep on hover/press
```

---

## 3. 🎯 MASTER BUILD PROMPT (copy-paste to a coder / VPS Claude)

> **Build the SmartSound interface as a single-screen React app in the Endel visual language, with an Apple-style biofeedback ring and Apple's Liquid Glass material. Reuse the existing rPPG heart-rate hook and audio engine — this is a UI reskin over the closed-loop logic, not a rewrite.**
>
> **Stack:** React + TypeScript, Tailwind CSS, Framer Motion (animation), SVG/Canvas for the ring.
>
> **Visual language (from Endel):**
> - Pure black `#000` background, generous negative space, fully monochrome except the ring.
> - Typography centered: headline white ~28px tight leading; subtext `rgba(255,255,255,0.5)`. Thin white line-art icons only.
> - Everything fades in over ~800ms with `cubic-bezier(0.22,1,0.36,1)`. No menus, tabs, or dashboards up front.
>
> **Centerpiece — `BiofeedbackRing.tsx` (SVG or canvas):**
> - A ring centered on screen that **pulses once per detected heartbeat**, driven by the live rPPG heart-rate value.
> - Stroke = gradient from `--ring-cool` (#38BDF8) to `--ring-warm` (#A78BFA), with an outer glow (`filter: blur`) that brightens on each beat.
> - **Closed-loop behavior:** as measured HR drops, slow the pulse and shift the gradient cooler (more blue) + mellow the soundscape; as HR rises, warm it. This visually confirms the loop is working (Apple-Mindfulness cadence + Lungy live-response).
> - Optional: subtle animated grain / radial ambient gradient behind the ring (Calm-style) as a toggle.
>
> **HR readout — `HeartRateReadout.tsx` (Oura score-ring language):**
> - Below the ring: large number + `bpm` + trend arrow (e.g. `68 ↓`), low opacity, letter-spaced, no card chrome.
>
> **Controls — Liquid Glass bar at the bottom:**
> - A single frosted-glass control bar: play/pause (primary), session timer, soundscape toggle.
> - Material: `backdrop-blur-2xl`, `bg-white/[0.06]`, `1px inset border rgba(255,255,255,0.12)`, top-edge highlight, drop shadow, capsule/`rounded-3xl` shapes, faint specular sheen that sweeps on hover/press.
>
> **Reusable `<GlassButton>`:**
> - Variants: `primary` (play — brighter glass + gradient tint), `ghost` (icon-only plain glass), `pill` (toggle).
> - States: default / hover (sheen sweeps, glow intensifies) / active (scale 0.96, inner shadow) / disabled (opacity 40%).
> - Framer Motion spring on press; fully keyboard-accessible with `aria-label`s and a visible focus ring.
>
> **Deliverables:** `SmartSoundScreen.tsx`, `BiofeedbackRing.tsx`, `GlassButton.tsx`, `HeartRateReadout.tsx`, plus Tailwind config extending the design tokens above. Wire to the existing HR + audio hooks. Then run the build and deploy; report the deploy URL.
>
> **Acceptance:** dark single screen, ring pulses in sync with live camera HR, glass controls legible over black, everything fades in calmly, no console errors, production build passes.

---

## 4. Deliberately ruled out
- **Headspace / heavy illustrated content libraries** — SmartSound is one adaptive session, not a catalog.
- **Generic breathing apps with a fixed expanding ball** — they ignore the *live* biosignal, missing the whole closed-loop point.

## 5. Notes / limitations
- Mobbin has **no source code** — it is screenshots + recorded flows only. Design DNA above is extracted from visible (free-tier) screens; Home/player screens for most apps are behind Mobbin Pro ($10/mo) and were not purchased.
- All colors/tokens here are a synthesized recommendation, not copied assets.
