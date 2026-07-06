import { useEffect } from 'react'

/** Per-route document titles (audit 1.5) — SPA navigation must retitle. */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = title
  }, [title])
}
