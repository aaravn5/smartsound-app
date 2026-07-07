import { useSyncExternalStore } from 'react'

/**
 * Local-first account — honest by design. There is NO auth server or OAuth
 * infrastructure yet, so an "account" is a name + email stored in THIS
 * browser's localStorage (`ss_account_v1`) and nothing else: no network
 * call, no session token, no sync. Like entitlements.ts this is UX, not a
 * security boundary, and it fails open — if storage is unavailable the app
 * simply treats the visitor as signed out.
 *
 * The listen gate (landing records, search play, Start listening) checks
 * `hasAccount()`; browsing the library never does.
 */

export interface Account {
  name: string
  email: string
  createdAt: number
}

const KEY = 'ss_account_v1'
/** One-shot "Welcome, {name}" flag — after the first landing greeting the
 * header falls back to the daypart greeting. */
const WELCOMED_KEY = 'ss_welcomed_v1'

const listeners = new Set<() => void>()

/** Cached snapshot — useSyncExternalStore needs referential stability. */
let cache: Account | null = null
let cacheLoaded = false

function load(): Account | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Account).name === 'string' &&
      typeof (parsed as Account).email === 'string' &&
      (parsed as Account).name.trim().length > 0
    ) {
      return {
        name: (parsed as Account).name,
        email: (parsed as Account).email,
        createdAt: typeof (parsed as Account).createdAt === 'number' ? (parsed as Account).createdAt : 0,
      }
    }
    return null
  } catch {
    return null
  }
}

export function readAccount(): Account | null {
  if (typeof window === 'undefined') return null
  if (!cacheLoaded) {
    cache = load()
    cacheLoaded = true
  }
  return cache
}

export function hasAccount(): boolean {
  return readAccount() !== null
}

function notify(): void {
  listeners.forEach((l) => l())
}

/** Create (or replace) the on-device account. Returns false when storage is
 * unavailable — callers should still proceed gracefully. */
export function createAccount(name: string, email: string): boolean {
  const account: Account = { name: name.trim(), email: email.trim(), createdAt: Date.now() }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(account))
  } catch {
    return false
  }
  cache = account
  cacheLoaded = true
  notify()
  return true
}

export function signOut(): void {
  try {
    window.localStorage.removeItem(KEY)
    window.localStorage.removeItem(WELCOMED_KEY)
  } catch {
    // storage unavailable — the in-memory state still signs out
  }
  cache = null
  cacheLoaded = true
  notify()
}

/** True until the first landing render after account creation — drives the
 * one-time "Welcome, {name}" greeting. */
export function shouldShowWelcome(): boolean {
  if (!hasAccount()) return false
  try {
    return window.localStorage.getItem(WELCOMED_KEY) !== '1'
  } catch {
    return false
  }
}

export function markWelcomed(): void {
  try {
    window.localStorage.setItem(WELCOMED_KEY, '1')
  } catch {
    // non-fatal — the welcome line just shows again next visit
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Basic shape check — enough to catch typos, no network verification (none
 * exists; pretending otherwise would be dishonest). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/** React binding — re-renders on account changes across the whole app. */
export function useAccount(): Account | null {
  return useSyncExternalStore(subscribe, readAccount, () => null)
}
