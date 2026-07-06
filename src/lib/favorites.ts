import { useSyncExternalStore } from 'react'
import type { TargetState } from '~/engine/audio/types'

/**
 * Favorites — the Now Playing widget's heart, persisted locally under
 * `ss_favorites` (same storage honesty policy as recents: fails open, never
 * a boundary, no fabricated state).
 */

const KEY = 'ss_favorites'

const VALID: readonly TargetState[] = ['focus', 'flow', 'calm', 'winddown', 'sleep']

const listeners = new Set<() => void>()
let cache: TargetState[] | null = null

function load(): TargetState[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (s): s is TargetState => typeof s === 'string' && (VALID as readonly string[]).includes(s),
    )
  } catch {
    return []
  }
}

export function readFavorites(): TargetState[] {
  if (typeof window === 'undefined') return []
  if (cache === null) cache = load()
  return cache
}

export function isFavorite(state: TargetState): boolean {
  return readFavorites().includes(state)
}

export function toggleFavorite(state: TargetState): void {
  const current = readFavorites()
  const next = current.includes(state)
    ? current.filter((s) => s !== state)
    : [...current, state]
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage unavailable — the toggle still works for this page's lifetime
  }
  cache = next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** React binding for the heart toggle. */
export function useFavorites(): TargetState[] {
  return useSyncExternalStore(subscribe, readFavorites, () => [])
}
