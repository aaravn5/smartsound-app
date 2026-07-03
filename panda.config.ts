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
          // Base palette (§1.2) — deep graphite, richer + higher-chroma than v1.
          ink: { value: 'oklch(0.16 0.02 265)' },
          surface: { value: 'oklch(0.21 0.02 265)' },
          mist: { value: 'oklch(0.96 0.01 265)' },
          haze: { value: 'oklch(0.70 0.015 265)' },
          dim: { value: 'oklch(0.55 0.015 265)' },
          line: { value: 'oklch(0.30 0.015 265)' },
          // State-signal arc (§1.2) — the dynamic accent's anchor points.
          state: {
            winddown: { value: 'oklch(0.55 0.09 285)' }, // slate-lavender
            settled: { value: 'oklch(0.74 0.13 205)' }, // deep cyan-teal
            focus: { value: 'oklch(0.70 0.17 265)' }, // indigo-violet
            elevated: { value: 'oklch(0.80 0.16 70)' }, // warm amber (never red)
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
          // §1.1 — distinctive display/body/mono faces via Fontshare, no basic faces.
          display: { value: '"Clash Display", system-ui, sans-serif' },
          body: { value: '"General Sans", system-ui, sans-serif' },
          mono: { value: '"JetBrains Mono", ui-monospace, monospace' },
          serif: { value: '"Fraunces", Georgia, serif' },
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
          faint: { value: '{colors.dim}' },
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
      // §1.2 signal arc — defaults to the focus anchor until the loop sets --signal.
      '--signal': 'oklch(0.70 0.17 265)',
      // Narrow bloom halo bound to the live signal color (§1.2).
      '--signal-glow': '0 0 48px color-mix(in oklab, var(--signal) 55%, transparent)',
      colorScheme: 'dark',
      // Part 4 raw CSS vars — for shaders, canvas, and inline styles that can't read Panda tokens.
      '--bg-base': '#000000',
      '--bg-1': 'oklch(0.16 0.02 265)',
      '--bg-2': 'oklch(0.21 0.02 265)',
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
