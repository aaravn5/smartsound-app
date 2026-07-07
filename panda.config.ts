import { defineConfig } from '@pandacss/dev'

/**
 * SmartSound — Calm revamp design tokens (Apple HIG / Liquid Glass).
 *
 * The canvas is an immersive scene gradient (dusk · aurora · ocean · dawn);
 * everything above it is Liquid Glass — translucent, blurred, specular-edged.
 * Ink is a soft off-white label hierarchy per HIG semantic colors.
 *
 * Two living accents:
 *   --scene-accent  one calm accent per scene, set by the shell per tab.
 *   --signal        the biofeedback accent, driven every frame by the loop
 *                   (applySignal in src/design/signal.ts) — unchanged.
 */
export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets'],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  jsxFramework: 'react',
  outdir: 'styled-system',
  theme: {
    extend: {
      tokens: {
        colors: {
          // ── "Pressed at Night" palette (design.md — the single source of truth) ──
          deepSpace: { value: '#171721' }, // outermost page background
          midnightSlate: { value: '#1e1e2a' }, // section / card backgrounds
          graphite: { value: '#272735' }, // interactive surfaces, hover fills
          lead: { value: '#70707d' }, // borders, dividers, etched groove lines
          starlight: { value: '#ededf3' }, // primary text
          silver: { value: '#c3c3cc' }, // secondary text, captions
          mercuryBlue: { value: '#5266eb' }, // THE accent — primary CTAs, active dot, stylus
          ghostBlue: { value: '#cdddff' }, // secondary button bg @ ~20%, focus rings
          // Band tints — content-only palette (labels, waveforms, band-mix bars).
          band: {
            beta: { value: '#6f7ff0' },
            alpha: { value: '#5fb8c9' },
            theta: { value: '#b78fd6' },
            delta: { value: '#4a5a8a' },
          },
          // Deep scene base — legacy aliases, re-pointed at the Pressed-at-Night neutrals.
          base: { value: '#1e1e2a' },
          baseDeep: { value: '#171721' },
          // HIG-style label hierarchy — soft off-white ink with warmth.
          label: { value: 'rgba(248, 247, 252, 0.96)' },
          // Alphas tuned so body/caption text clears ~4.5:1 against the lightest
          // points of every scene gradient (verified via WCAG relative-luminance
          // contrast against dusk/aurora/ocean/dawn tops, not just the darkest floor).
          secondaryLabel: { value: 'rgba(235, 235, 248, 0.72)' },
          tertiaryLabel: { value: 'rgba(230, 230, 246, 0.60)' },
          quaternaryLabel: { value: 'rgba(228, 228, 246, 0.56)' },
          separator: { value: 'rgba(255, 255, 255, 0.10)' },
          // Scene accents — one calm accent per scene.
          scene: {
            dusk: { value: '#A78BFA' }, // soft violet
            aurora: { value: '#5EEAD4' }, // sea-glass teal
            ocean: { value: '#7DD3FC' }, // clear sky blue
            dawn: { value: '#FDBA74' }, // warm amber
          },
          // Ring gradient anchors — the SmartSound rings (Attune · Minutes · Streak).
          ring: {
            attuneFrom: { value: '#C4B5FD' },
            attuneTo: { value: '#8B5CF6' },
            minutesFrom: { value: '#6EE7B7' },
            minutesTo: { value: '#14B8A6' },
            streakFrom: { value: '#FDE68A' },
            streakTo: { value: '#FB923C' },
          },
          // Frosted glass — the Pressed-at-Night material for floating chrome
          // (bottom nav, overlays, toasts, sticky headers). Midnight-slate
          // tinted, paired with backdrop-filter saturate(180%) blur(20px)
          // and a 0.5px starlight hairline (see glassCss in components/Card).
          frost: {
            fill: { value: 'rgba(30, 30, 42, 0.72)' },
            stroke: { value: 'rgba(237, 237, 243, 0.10)' },
            fallback: { value: 'rgba(30, 30, 42, 0.97)' },
          },
          // Liquid Glass — translucent fills over the scene, per apple-design-materials.
          glass: {
            fill: { value: 'rgba(22, 26, 44, 0.40)' },
            fillStrong: { value: 'rgba(20, 24, 40, 0.58)' },
            fillSoft: { value: 'rgba(255, 255, 255, 0.07)' },
            stroke: { value: 'rgba(255, 255, 255, 0.13)' },
            strokeStrong: { value: 'rgba(255, 255, 255, 0.20)' },
            specular: { value: 'rgba(255, 255, 255, 0.18)' },
            fallback: { value: 'rgba(24, 28, 46, 0.94)' },
          },
        },
        gradients: {
          // Immersive scene washes — usable as backgroundImage token(...) on cards.
          duskSky: {
            value:
              'linear-gradient(172deg, #2B1E56 0%, #1E1B4B 34%, #151A3E 62%, #0E1230 100%)',
          },
          auroraSky: {
            value:
              'linear-gradient(168deg, #0B2E33 0%, #0F3D3E 30%, #11343F 58%, #0A1626 100%)',
          },
          oceanDepth: {
            value:
              'linear-gradient(174deg, #0C2A4D 0%, #0B2344 36%, #0A1B38 66%, #081226 100%)',
          },
          warmDawn: {
            value:
              'linear-gradient(170deg, #4A2B3F 0%, #3D2547 30%, #27204A 62%, #121430 100%)',
          },
        },
        fonts: {
          // Instrument Serif — LARGE display only (≥ ~30px): headlines, record
          // titles, greetings. Weight 400 is the whole family — never bold.
          // Small headings (≤ ~22px) use Hanken Grotesk 600 instead, so they
          // stay crisp (Instrument is a light, high-contrast display face).
          display: {
            value: '"Instrument Serif", Georgia, "Times New Roman", serif',
          },
          // Hanken Grotesk — UI, body, labels, nav, forms (400/500/600).
          text: {
            value:
              '"Hanken Grotesk Variable", "Hanken Grotesk", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
          },
          // JetBrains Mono — every number: Hz, min, %, BPM, dates, timers.
          mono: {
            value: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
          },
          // Legacy alias (timers/ring values) — numbers are mono in this world.
          rounded: {
            value: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
          },
        },
        fontSizes: {
          // design.md scale: display 64 / heading-lg 44 / heading 32 / heading-sm 21
          // / body 16 / body-sm 14 / caption 12.
          display: { value: '4rem' }, // 64
          headingLg: { value: '2.75rem' }, // 44
          heading: { value: '2rem' }, // 32
          headingSm: { value: '1.3125rem' }, // 21
          bodyMd: { value: '1rem' }, // 16
          bodySm: { value: '0.875rem' }, // 14
          // Legacy HIG names still referenced by older surfaces.
          largeTitle: { value: '2.125rem' }, // 34
          title1: { value: '1.75rem' }, // 28
          title2: { value: '1.375rem' }, // 22
          title3: { value: '1.25rem' }, // 20
          headline: { value: '1.0625rem' }, // 17 semibold
          body: { value: '1rem' }, // 16 — design.md body
          callout: { value: '1rem' }, // 16
          subhead: { value: '0.9375rem' }, // 15
          footnote: { value: '0.8125rem' }, // 13
          caption: { value: '0.75rem' }, // 12
          caption2: { value: '0.6875rem' }, // 11
        },
        radii: {
          control: { value: '14px' },
          // Cards & elevated surfaces — continuous/squircle feel (Apple).
          // Record SLEEVES stay 4px (real jackets); records stay circles.
          card: { value: '16px' },
          sleeve: { value: '4px' },
          sheet: { value: '32px' },
          capsule: { value: '9999px' },
          // Buttons & inputs — pill.
          pill: { value: '9999px' },
        },
        shadows: {
          // Apple/Calm SOFT depth — subtle, low-opacity, never harsh. Prefer
          // "brighten on hover"; these are for elevated cards & overlays only.
          soft: { value: '0 1px 2px rgba(0, 0, 0, 0.30), 0 8px 30px rgba(0, 0, 0, 0.22)' },
          overlay: { value: '0 2px 6px rgba(0, 0, 0, 0.32), 0 16px 48px rgba(0, 0, 0, 0.34)' },
        },
        durations: {
          quick: { value: '150ms' },
          gentle: { value: '420ms' },
          calm: { value: '700ms' },
          slow: { value: '1200ms' },
        },
        easings: {
          // Apple sheet/navigation curve — unhurried, decisive.
          calm: { value: 'cubic-bezier(0.32, 0.72, 0, 1)' },
          // Long gentle glide for reveals.
          glide: { value: 'cubic-bezier(0.22, 1, 0.36, 1)' },
          // Default UI ease — entrances, transitions (fade-up).
          enter: { value: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          // Tactile press/hover micro-interactions — a gentle spring overshoot.
          spring: { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
        },
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // Aurora blooms — two very slow, very subtle radial glows drifting in
        // page backgrounds (Calm/Endel). Transform + opacity only, GPU-cheap,
        // frozen entirely under prefers-reduced-motion.
        auroraDriftA: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '0.7' },
          '50%': { transform: 'translate3d(4%, 3%, 0) scale(1.12)', opacity: '1' },
        },
        auroraDriftB: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1.06)', opacity: '0.6' },
          '50%': { transform: 'translate3d(-4%, -2%, 0) scale(1)', opacity: '1' },
        },
        sceneDriftA: {
          '0%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(-3%, 2%, 0) scale(1.06)' },
          '100%': { transform: 'translate3d(2%, -2%, 0) scale(1.03)' },
        },
        sceneDriftB: {
          '0%': { transform: 'translate3d(0, 0, 0) scale(1.04)' },
          '50%': { transform: 'translate3d(3%, -2%, 0) scale(1)' },
          '100%': { transform: 'translate3d(-2%, 2%, 0) scale(1.07)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.045)', opacity: '1' },
        },
        // A slow independent top-light drift — gives scenes a second light
        // source so the canvas doesn't read as a flat gradient. transform +
        // opacity only, GPU-cheap.
        sceneBloom: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '0.55' },
          '50%': { transform: 'translate3d(2.5%, -3%, 0) scale(1.14)', opacity: '0.92' },
        },
        // Two independently-paced organic blob drifts — the "cloud/aurora
        // texture" depth layer. transform only (translate/rotate/scale),
        // blurred once by a static filter so the compositor never re-blurs
        // per frame.
        cloudDriftA: {
          '0%': { transform: 'translate3d(-4%, 2%, 0) rotate(0deg) scale(1)' },
          '50%': { transform: 'translate3d(3%, -3%, 0) rotate(6deg) scale(1.08)' },
          '100%': { transform: 'translate3d(-2%, 4%, 0) rotate(-4deg) scale(1.02)' },
        },
        cloudDriftB: {
          '0%': { transform: 'translate3d(3%, -2%, 0) rotate(0deg) scale(1.05)' },
          '50%': { transform: 'translate3d(-4%, 3%, 0) rotate(-5deg) scale(0.98)' },
          '100%': { transform: 'translate3d(2%, -4%, 0) rotate(4deg) scale(1.06)' },
        },
        // A slow, luxurious Ken-Burns drift for the nature-photo mood layer —
        // transform only (scale + translate), GPU-cheap, never repaints.
        sceneKenBurns: {
          '0%': { transform: 'scale(1.04) translate3d(-1%, -0.5%, 0)' },
          '100%': { transform: 'scale(1.14) translate3d(1%, 0.5%, 0)' },
        },
        // A coarse, stepped micro-jitter for the film-grain overlay — reads
        // as flicker without ever tweening (steps() = a handful of paints
        // over many seconds, not a per-frame cost).
        grainFlicker: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '20%': { transform: 'translate3d(-1.5%, 1%, 0)' },
          '40%': { transform: 'translate3d(1%, -1.5%, 0)' },
          '60%': { transform: 'translate3d(-1%, -1%, 0)' },
          '80%': { transform: 'translate3d(1.5%, 1%, 0)' },
        },
      },
      semanticTokens: {
        colors: {
          // Pressed at Night — ONE dark world. Semantic tokens point at the
          // design.md neutrals so the whole app lives in it.
          bg: { value: '{colors.midnightSlate}' },
          bgDeep: { value: '{colors.deepSpace}' },
          text: { value: '{colors.starlight}' },
          muted: { value: '{colors.silver}' },
          faint: { value: 'rgba(195, 195, 204, 0.62)' },
          ghost: { value: 'rgba(195, 195, 204, 0.45)' },
          hairline: { value: 'rgba(112, 112, 125, 0.28)' },
          // ONE accent for the whole app — Mercury Blue, primary actions only.
          accent: { value: '{colors.mercuryBlue}' },
          accentSoft: {
            value: 'color-mix(in oklab, #5266eb 24%, transparent)',
          },
          // The living biofeedback accent — driven by the loop, unchanged mechanism.
          signal: { value: 'var(--signal, {colors.scene.dusk})' },
          signalSoft: {
            value: 'color-mix(in oklab, var(--signal, {colors.scene.dusk}) 22%, transparent)',
          },
          signalFaint: {
            value: 'color-mix(in oklab, var(--signal, {colors.scene.dusk}) 9%, transparent)',
          },
        },
      },
    },
  },
  globalCss: {
    ':root': {
      colorScheme: 'dark',
      // The biofeedback accent — the loop overwrites this every frame.
      '--signal': 'oklch(0.72 0.14 285)',
      '--signal-glow': '0 0 48px color-mix(in oklab, var(--signal) 45%, transparent)',
      // ONE accent for every surface — Mercury Blue (no per-tab scene accents).
      '--scene-accent': '#5266eb',
      // Raw Liquid Glass vars for inline styles / canvas that can't read tokens.
      '--glass-fill': 'rgba(22, 26, 44, 0.40)',
      '--glass-stroke': 'rgba(255, 255, 255, 0.13)',
      '--glass-blur': '24px',
      // Gentle spring easings — CSS linear() where supported, calm bezier fallback.
      '--ease-calm': 'cubic-bezier(0.32, 0.72, 0, 1)',
      '--ease-glide': 'cubic-bezier(0.22, 1, 0.36, 1)',
      '--spring-smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      '--spring-smooth-duration': '600ms',
    },
    '@supports (animation-timing-function: linear(0, 1))': {
      ':root': {
        // ~500ms perceptual smooth spring (no bounce), per apple-design-motion.
        '--spring-smooth':
          'linear(0, 0.0037, 0.0142, 0.031, 0.0534, 0.0804, 0.1108, 0.1438, 0.1784, 0.2135, 0.2484, 0.3145, 0.3746, 0.4283, 0.4755, 0.5562, 0.6215, 0.6726, 0.7112, 0.7735, 0.8196, 0.854, 0.8793, 0.9185, 0.9458, 0.9647, 0.9779, 0.9921, 1)',
      },
    },
    'html, body, #root': {
      minHeight: '100dvh',
    },
    body: {
      bg: 'bgDeep',
      color: 'text',
      fontFamily: 'text',
      overflowX: 'hidden',
      fontSynthesis: 'none',
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    // Numeric readouts (timers, ring values) — mono ("this was measured") and
    // tabular so they never jitter. Every number in the app wears this class.
    '.tabular': {
      fontFamily: 'mono',
      fontVariantNumeric: 'tabular-nums',
      fontFeatureSettings: '"tnum" 1',
    },
    '::selection': {
      background: 'accentSoft',
    },
    ':focus-visible': {
      outline: '2px solid token(colors.accent)',
      outlineOffset: '2px',
      borderRadius: '4px',
    },
  },
})
