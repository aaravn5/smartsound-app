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
          // Deep scene base — indigo-black, never pure black (dark = dimmed, not inverted).
          base: { value: 'oklch(0.145 0.03 275)' },
          baseDeep: { value: 'oklch(0.11 0.025 278)' },
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
          // SF system stack — SF is not licensed as a webfont; rely on the stack.
          display: {
            value:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif',
          },
          text: {
            value:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
          },
          // Rounded numerals for ring values and timers.
          rounded: {
            value:
              'ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          },
        },
        fontSizes: {
          // Serene HIG-derived scale.
          largeTitle: { value: '2.125rem' }, // 34
          title1: { value: '1.75rem' }, // 28
          title2: { value: '1.375rem' }, // 22
          title3: { value: '1.25rem' }, // 20
          headline: { value: '1.0625rem' }, // 17 semibold
          body: { value: '1.0625rem' }, // 17
          callout: { value: '1rem' }, // 16
          subhead: { value: '0.9375rem' }, // 15
          footnote: { value: '0.8125rem' }, // 13
          caption: { value: '0.75rem' }, // 12
          caption2: { value: '0.6875rem' }, // 11
        },
        radii: {
          control: { value: '14px' },
          card: { value: '26px' },
          sheet: { value: '32px' },
          capsule: { value: '9999px' },
        },
        durations: {
          quick: { value: '160ms' },
          gentle: { value: '420ms' },
          calm: { value: '700ms' },
          slow: { value: '1200ms' },
        },
        easings: {
          // Apple sheet/navigation curve — unhurried, decisive.
          calm: { value: 'cubic-bezier(0.32, 0.72, 0, 1)' },
          // Long gentle glide for reveals.
          glide: { value: 'cubic-bezier(0.22, 1, 0.36, 1)' },
          // Entrances (fade-up).
          enter: { value: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        },
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
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
          '50%': { transform: 'translate3d(1.5%, -1.5%, 0) scale(1.1)', opacity: '0.9' },
        },
      },
      semanticTokens: {
        colors: {
          bg: { value: '{colors.base}' },
          bgDeep: { value: '{colors.baseDeep}' },
          text: { value: '{colors.label}' },
          muted: { value: '{colors.secondaryLabel}' },
          faint: { value: '{colors.tertiaryLabel}' },
          ghost: { value: '{colors.quaternaryLabel}' },
          hairline: { value: '{colors.separator}' },
          // One calm accent per scene — the shell sets --scene-accent per tab.
          accent: { value: 'var(--scene-accent, {colors.scene.dusk})' },
          accentSoft: {
            value: 'color-mix(in oklab, var(--scene-accent, {colors.scene.dusk}) 24%, transparent)',
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
      // Scene accent — the shell overrides per active scene.
      '--scene-accent': '#A78BFA',
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
    // Numeric readouts (timers, ring values) must never jitter.
    '.tabular': {
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
