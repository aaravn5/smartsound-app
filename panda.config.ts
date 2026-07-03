import { defineConfig } from '@pandacss/dev'

/**
 * SmartSound design tokens — the single source of truth (§5).
 *
 * The identity is a *scientific instrument that breathes*. The accent is NOT a
 * fixed brand color: `--signal` interpolates across an OKLCH arc bound to the
 * user's cognitive state (§5.2), updated live by the closed loop. Everything
 * that reads `signal` (ring, glows, focus rings) literally becomes the user's
 * state. This construction avoids the three default-AI palettes by design.
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
          // Base palette (§5.3) — near-navy graphite, never pure black.
          ink: { value: 'oklch(0.19 0.02 265)' },
          surface: { value: 'oklch(0.24 0.02 265)' },
          mist: { value: 'oklch(0.86 0.01 265)' },
          haze: { value: 'oklch(0.62 0.015 265)' },
          line: { value: 'oklch(0.34 0.015 265)' },
          // State-signal arc (§5.2) — the dynamic accent's anchor points.
          state: {
            settled: { value: 'oklch(0.72 0.11 195)' }, // deep cyan-teal
            focus: { value: 'oklch(0.68 0.15 275)' }, // indigo-violet
            elevated: { value: 'oklch(0.78 0.14 75)' }, // warm amber (never red)
            winddown: { value: 'oklch(0.55 0.06 285)' }, // dim slate-lavender
          },
          // Part 4 (COMPLETE.md) — pure-black canvas + ring gradient + Liquid Glass.
          black: { value: '#000000' },
          bgAlt: { value: '#0A0A0F' },
          ringCool: { value: '#38BDF8' }, // cyan — calm / low HR
          ringWarm: { value: '#A78BFA' }, // violet — elevated HR
          glassFill: { value: 'rgba(255,255,255,0.06)' },
          glassBorder: { value: 'rgba(255,255,255,0.12)' },
          glassHighlight: { value: 'rgba(255,255,255,0.20)' },
        },
        fonts: {
          // §5.4 — open fallbacks for the named commercial faces.
          display: { value: '"Space Grotesk", system-ui, sans-serif' },
          body: { value: '"DM Sans", system-ui, sans-serif' },
          mono: { value: '"JetBrains Mono", ui-monospace, monospace' },
        },
        fontSizes: {
          '2xs': { value: '0.6875rem' },
        },
        durations: {
          instant: { value: '120ms' },
          calm: { value: '420ms' },
          sweep: { value: '1200ms' },
        },
        easings: {
          // Damped, instrument-like — nothing snappy or bouncy.
          settle: { value: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
          calm: { value: 'cubic-bezier(0.22, 1, 0.36, 1)' }, // Part 4 --ease-calm
        },
      },
      semanticTokens: {
        colors: {
          bg: { value: '{colors.ink}' },
          panel: { value: '{colors.surface}' },
          text: { value: '{colors.mist}' },
          muted: { value: '{colors.haze}' },
          hairline: { value: '{colors.line}' },
          bgBase: { value: '{colors.black}' }, // pure-black canvas for the reskin + landing
          // The living accent. Defaults to focus until the loop sets --signal.
          signal: { value: 'var(--signal, {colors.state.focus})' },
          signalSoft: {
            value: 'color-mix(in oklab, var(--signal, {colors.state.focus}) 22%, transparent)',
          },
          signalFaint: {
            value: 'color-mix(in oklab, var(--signal, {colors.state.focus}) 9%, transparent)',
          },
        },
      },
    },
  },
  globalCss: {
    ':root': {
      '--signal': 'oklch(0.68 0.15 275)',
      colorScheme: 'dark',
      // Part 4 raw CSS vars — for shaders, canvas, and inline styles that can't read Panda tokens.
      '--bg-base': '#000000',
      '--bg-alt': '#0A0A0F',
      '--ring-cool': '#38BDF8',
      '--ring-warm': '#A78BFA',
      '--ring-glow': '0 0 60px rgba(120,170,255,0.45)',
      '--glass-fill': 'rgba(255,255,255,0.06)',
      '--glass-border': 'rgba(255,255,255,0.12)',
      '--glass-blur': '24px',
      '--glass-highlight': 'rgba(255,255,255,0.20)',
      '--glass-shadow': '0 8px 32px rgba(0,0,0,0.45)',
      '--pixel-size': '4px',
      '--ease-calm': 'cubic-bezier(0.22, 1, 0.36, 1)',
      '--fade-in': '800ms',
    },
    'html, body, #root': {
      minHeight: '100dvh',
    },
    body: {
      bg: 'bg',
      color: 'text',
      fontFamily: 'body',
      overflowX: 'hidden',
      fontSynthesis: 'none',
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    // Instrument readouts must never jitter (§5.4, §11).
    '.tabular': {
      fontVariantNumeric: 'tabular-nums',
      fontFeatureSettings: '"tnum" 1',
    },
    '::selection': {
      background: 'signalSoft',
    },
    ':focus-visible': {
      outline: '2px solid token(colors.signal)',
      outlineOffset: '2px',
    },
  },
})
