import { useSyncExternalStore } from 'react'

/**
 * theme.ts — light / dark mode for SmartSound.
 *
 * Daylight is SmartSound's native, minimal look; dark is the alternate.
 * The whole palette flips off a single `data-theme` attribute on <html>: every
 * Panda color token is a CSS var, and the light overrides live UNLAYERED in
 * src/index.css under `:root[data-theme='light']` (unlayered CSS beats Panda's
 * @layer tokens defaults). This module only owns the *state* — which theme is
 * active, persisting the choice, and stamping the attribute. An inline script
 * in index.html applies the stored choice before first paint so there is no
 * flash on load.
 */

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ss_theme'

const listeners = new Set<() => void>()

function readStored(): Theme | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

/** The active theme: explicit stored choice, else SmartSound's native light. */
export function currentTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return readStored() ?? 'light'
}

function apply(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }
}

export function setTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // preference simply won't persist
  }
  apply(theme)
  listeners.forEach((l) => l())
}

export function toggleTheme(): void {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark')
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React binding — re-renders on theme change, returns the active theme. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme, () => 'light')
}
