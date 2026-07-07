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
          // ── "Desktop.fm" palette — near-monochrome, light, Apple-restraint. ──
          // Token NAMES are kept (so every existing usage cascades); VALUES flip
          // to a calming grey canvas + carbon-black ink + white card surfaces.
          deepSpace: { value: '#f1f2f3' }, // outermost page canvas (Canvas Mist)
          midnightSlate: { value: '#ffffff' }, // section / card surface (Pure White)
          graphite: { value: '#ededf0' }, // interactive surfaces, hover fills
          lead: { value: '#dddddd' }, // borders, dividers, etched groove lines (Pale Stone)
          starlight: { value: '#111111' }, // primary text (Carbon Black)
          silver: { value: '#5c5c63' }, // secondary text, captions
          mercuryBlue: { value: '#5872e6' }, // THE one color — calming blue: active dot, stylus, live accents
          ghostBlue: { value: '#dfe6ff' }, // secondary button bg @ ~20%, focus rings
          // Band tints — content-only palette (labels, waveforms, band-mix bars).
          // Shifted into one calm blue family so the page stays monochrome-blue.
          band: {
            beta: { value: '#5872e6' },
            alpha: { value: '#7a95e0' },
            theta: { value: '#9aa6d0' },
            delta: { value: '#3f4f86' },
          },
          // Deep canvas base — legacy aliases, re-pointed at the Desktop.fm neutrals.
          base: { value: '#ffffff' },
          baseDeep: { value: '#f1f2f3' },
          // HIG-style label hierarchy — carbon-black ink softening down the scale.
          label: { value: 'rgba(17, 17, 17, 0.96)' },
          // Alphas tuned so body/caption text clears AA+ (≥4.5:1) against the
          // #f1f2f3 canvas and the #ffffff card surface.
          secondaryLabel: { value: 'rgba(17, 17, 17, 0.62)' },
          tertiaryLabel: { value: 'rgba(17, 17, 17, 0.48)' },
          quaternaryLabel: { value: 'rgba(17, 17, 17, 0.40)' },
          separator: { value: 'rgba(17, 17, 17, 0.10)' },
          // Scene accents — all collapsed into the one calming blue (monochrome UI).
          scene: {
            dusk: { value: '#5872e6' },
            aurora: { value: '#6a86ea' },
            ocean: { value: '#5f7ce8' },
            dawn: { value: '#7d8fe0' },
          },
          // Ring gradient anchors — Attune · Minutes · Streak, as tonal blues.
          ring: {
            attuneFrom: { value: '#9fb2f2' },
            attuneTo: { value: '#5566d8' },
            minutesFrom: { value: '#a9c0ef' },
            minutesTo: { value: '#4f7fd8' },
            streakFrom: { value: '#c3cdf2' },
            streakTo: { value: '#6a7fe0' },
          },
          // Frosted glass — floating chrome (bottom nav, overlays, toasts, sticky
          // headers). Light frosted white, paired with backdrop-filter
          // saturate(180%) blur(20px) and a faint carbon hairline.
          frost: {
            fill: { value: 'rgba(255, 255, 255, 0.72)' },
            stroke: { value: 'rgba(17, 17, 17, 0.08)' },
            fallback: { value: 'rgba(255, 255, 255, 0.96)' },
          },
          // Liquid Glass — light translucent fills over the grey canvas.
          glass: {
            fill: { value: 'rgba(255, 255, 255, 0.55)' },
            fillStrong: { value: 'rgba(255, 255, 255, 0.70)' },
            fillSoft: { value: 'rgba(255, 255, 255, 0.50)' },
            stroke: { value: 'rgba(17, 17, 17, 0.08)' },
            strokeStrong: { value: 'rgba(17, 17, 17, 0.14)' },
            specular: { value: 'rgba(255, 255, 255, 0.80)' },
            fallback: { value: 'rgba(255, 255, 255, 0.94)' },
          },
        },
        gradients: {
          // Retired immersive washes — collapsed to the flat calming-grey canvas
          // (Desktop.fm is a single flat stage; any lingering usage renders grey).
          duskSky: {
            value: 'linear-gradient(172deg, #f4f5f7 0%, #eef0f2 100%)',
          },
          auroraSky: {
            value: 'linear-gradient(168deg, #f4f5f7 0%, #eef0f2 100%)',
          },
          oceanDepth: {
            value: 'linear-gradient(174deg, #f4f5f7 0%, #eef0f2 100%)',
          },
          warmDawn: {
            value: 'linear-gradient(170deg, #f4f5f7 0%, #eef0f2 100%)',
          },
        },
        fonts: {
          // Desktop.fm — the SYSTEM stack for everything. Headlines live at
          // weight 800, UI at 700, the smallest tags at 500 — never lighter.
          // Instrument Serif / Hanken Grotesk are dropped; `display` and `text`
          // both resolve to the native platform face (SF on Apple).
          display: {
            value:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
          },
          text: {
            value:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
          },
          // System mono — every number (Hz, min, %, BPM, dates, timers). At
          // weight 800 it reads as a stamped serial number, per Desktop.fm.
          mono: {
            value: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          },
          // Legacy alias (timers/ring values) — numbers are mono in this world.
          rounded: {
            value: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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
          control: { value: '12px' },
          // Cards & elevated surfaces — the largest radius in the Desktop.fm
          // system. Record SLEEVES stay 4px (real jackets); records stay circles.
          card: { value: '25px' },
          sleeve: { value: '4px' },
          sheet: { value: '32px' },
          capsule: { value: '9999px' },
          // Buttons & inputs — lozenge pill (Apple).
          pill: { value: '9999px' },
        },
        shadows: {
          // Desktop.fm SOFT elevation — the only depth on the page. Carbon-tinted,
          // very low opacity; the white card floats a hair above the grey canvas.
          soft: {
            value: '0 1px 3px rgba(17, 17, 17, 0.08), 0 4px 12px rgba(17, 17, 17, 0.06)',
          },
          overlay: {
            value: '0 2px 8px rgba(17, 17, 17, 0.10), 0 16px 40px rgba(17, 17, 17, 0.12)',
          },
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
          // Desktop.fm — ONE light world. Semantic tokens point at the
          // near-monochrome neutrals so the whole app lives on the grey canvas.
          bg: { value: '{colors.midnightSlate}' }, // white card surface
          bgDeep: { value: '{colors.deepSpace}' }, // grey page canvas
          text: { value: '{colors.starlight}' }, // carbon black
          muted: { value: '{colors.silver}' },
          faint: { value: 'rgba(17, 17, 17, 0.50)' },
          ghost: { value: 'rgba(17, 17, 17, 0.38)' },
          hairline: { value: 'rgba(17, 17, 17, 0.12)' },
          // The one FILLED action is Carbon Black — the page's single CTA.
          // Focus rings read from this too, keeping the UI strictly achromatic.
          accent: { value: '{colors.starlight}' },
          accentSoft: {
            value: 'color-mix(in oklab, #111111 8%, transparent)',
          },
          // The living biofeedback accent — driven by the loop, unchanged
          // mechanism, now a calming blue. This is the ONE color on the page.
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
      colorScheme: 'light',
      // The biofeedback accent — the loop overwrites this every frame with a
      // calming blue (see src/design/signal.ts). The one color on the page.
      '--signal': 'oklch(0.66 0.13 250)',
      '--signal-glow': '0 0 48px color-mix(in oklab, var(--signal) 45%, transparent)',
      // The live accent seed — calming blue (no per-tab scene accents).
      '--scene-accent': '#5872e6',
      // Raw Liquid Glass vars for inline styles / canvas that can't read tokens.
      '--glass-fill': 'rgba(255, 255, 255, 0.55)',
      '--glass-stroke': 'rgba(17, 17, 17, 0.08)',
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
