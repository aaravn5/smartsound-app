# SmartSound landing vs. Calm / brain.fm / Endel — design benchmark

**Branch audited:** `liquid-glass-restore`
**Date:** 2026-07-07
**Subject:** the `/` landing page (Liquid Glass era restore + Calm-clone structure + full Dala idiom: loading counter, kinetic per-letter type, constellation hero)

## Method

- **SmartSound**: `npm run build` (panda codegen → tsr generate → tsc -b → vite build) passed, exit 0. The built page was served via `vite preview` and driven headlessly; the full DOM was inspected (all 12 sections present in order; WebGL canvas mounts — three.js r169; scroll-linked captions present at pre-scroll opacity 0; sticky offsets and tints as authored).
- **brain.fm** and **endel.io**: live landing pages fetched 2026-07-07; every claim about them below is grounded in that captured content.
- **calm.com**: returned **403 to all fetch attempts** (bot protection). It is scored from its long-stable, publicly documented landing idiom (serene full-bleed nature hero, "Calm your mind. Change your life.", benefit trio, testimonials, single relentless CTA). Treat its column with extra salt.

> **Caveat (read before trusting any score):** this is a **heuristic expert design audit by one reviewer (an AI agent)**, not real-user testing, not an A/B test, and not a usability study. Scores are directional, intended to locate strengths and gaps — not ground truth. Where SmartSound loses, it says so.

## Scorecard (each dimension /5)

| # | Dimension | SmartSound | Calm | brain.fm | Endel |
|---|---|---|---|---|---|
| 1 | Hero first impression | **5** | 4 | 4 | 3 |
| 2 | Scroll & motion craft | **5** | 3 | 3 | 3 |
| 3 | Signature interactive element | **5** | 2 | 2 | 3 |
| 4 | Visual-system coherence | **5** | 4 | 3 | 4 |
| 5 | Typography | 4 | 4 | 3 | **4** |
| 6 | Content completeness | 4 | 4 | **5** | **5** |
| 7 | Social-proof authenticity | 2 | **5** | **5** | **5** |
| 8 | Honesty / claim hygiene | **5** | 3 | 4 | 4 |
| 9 | Product-truth preview | **5** | 4 | 3 | 4 |
| 10 | Conversion-path clarity | 4 | **5** | 4 | 4 |
| | **Total /50** | **44** | 38 | 36 | 39 |

## Rationale

1. **Hero first impression** — SmartSound opens Dala-style: a loading counter resolves into a pinned void where an anatomical triangle-particle brain (cortex folds, cerebellum, brainstem) continuously transforms into a music note, a waveform, and a synapse network under kinetic per-letter type — and warms to yellow where the pointer touches. Calm's nature hero is beautiful but passive; brain.fm's rotating "Music made for …" device is effective copy but static; Endel opens with plain text.
2. **Scroll & motion craft** — SmartSound pins the hero, pins a 320vh morph stage whose scroll *drives* the transformation, then stacks three glass cards with staggered sticky offsets. brain.fm and Endel scroll conventionally (carousels, fades); Calm barely animates.
3. **Signature interactive element** — the blue/green particle brain that scroll-morphs into a beamed music note, warming to yellow under the pointer, is the page's one unforgettable object (the Dala idiom). Endel's generative visuals appear only as static/video assets on its landing; Calm and brain.fm have no interactive centerpiece.
4. **Visual-system coherence** — one material (Liquid Glass) on the control layer, one scene-dark ground, one blue→green accent family with yellow reserved for touch. Calm is coherent but conventional; Endel is austerely coherent; brain.fm mixes several card styles, gradients and testimonial formats.
5. **Typography** — SmartSound and Calm/Endel all run a disciplined display-plus-system scale; brain.fm's headline device with rotating inserts costs it rhythm. No win claimed here.
6. **Content completeness** — brain.fm (science, ADHD program, NSF grant, deep FAQ) and Endel (per-platform sections, awards, whitepaper) carry more sheer substance. SmartSound now covers benefits, app detail, science, reviews, plans, FAQ, footer — full Calm structure — but has no equivalent of an NSF grant or Apple award to show. Honest 4.
7. **Social-proof authenticity** — the competitors' strongest suit: brain.fm shows named public tweets, Endel shows App Store review text and four platform awards, Calm cites millions of 5-star reviews. SmartSound has only clearly-labeled early-listener quotes. **This is SmartSound's biggest real gap, and no design trick closes it — only real users do.**
8. **Honesty / claim hygiene** — SmartSound states "not a medical device" in the footer, claims only what the engine measures, shows real in-app prices with no countdown timers. brain.fm and Endel have real science but salesier framing ("119% boost", "7x focus"); Calm's landing makes the vaguest claims of the four.
9. **Product-truth preview** — SmartSound's "Inside the app" panels are hand-drawn miniatures of screens the app actually ships (Fitness-style rings, glass player, HIG tab bar) — the landing and the product are the same design system, so the promise can't disappoint. Calm/Endel show real screenshots (good) of apps styled differently from their sites; brain.fm shows mostly copy.
10. **Conversion-path clarity** — Calm's single-minded CTA discipline still leads. SmartSound has a persistent glass-nav CTA, "Start free" under plans, and the closing door — clear, though the page offers more paths than Calm's one.

## Verdict

On **design craft** — hero concept, scroll choreography, interactive centerpiece, material coherence, and honesty of presentation — this landing **outscores all three references (44 vs 38/36/39)** in this heuristic audit. Where it genuinely does *not* win: **earned trust assets** (awards, press, named users, review volume) and **depth of published science** — those are content businesses accumulate, not layouts. If those matter for a launch, the next investment is real users and citable studies, not more pixels.

## Verification appendix

- Build: PASSED (panda codegen + tsr generate + tsc -b + vite build, exit 0).
- Headless DOM audit of the built page: nav, loader + kinetic hero over the auto-morphing constellation, benefits trio, morph stage (canvas `data-engine="three.js r169"` mounted, both captions present at opacity 0 pre-scroll, glass hint chip), app showcase (rings SVG, player card, tab bar), 3 sticky how-it-works cards (staggered `top: calc(0/3.5/7rem + 12vh)`, blue/green/yellow tints), science trio, reviews, plans (Free/$0, Pro/$9.99, Studio/$19.99 — matching `app.paywall.tsx`), 5-item FAQ, CTA, footer — all present in order.
- The `/` route no longer redirects onboarded visitors to `/app`; the landing always shows, with "Open the app" in the nav.
- Known limitation: headless capture freezes animation clocks, so the morph, hover-yellow and sticky choreography were verified structurally (DOM/geometry), not frame-by-frame — worth a 30-second real-browser pass.
