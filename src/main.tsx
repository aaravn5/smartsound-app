import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { EngineProvider } from '~/lib/engine-context'
// Self-hosted faces via @fontsource (no CDN). Instrument Serif: large
// display & record titles only (400 is the whole family — never bold; italic
// for the poetic register). Hanken Grotesk (variable): UI/body/labels at
// 400/500/600. JetBrains Mono: every number (Hz, min, %, BPM).
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource/jetbrains-mono/400.css'
import './index.css'
// The landing's hyperrealistic CSS MacBook — unlayered material styles.
import './landing/macbook.css'

const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <EngineProvider>
      <RouterProvider router={router} />
    </EngineProvider>
  </StrictMode>,
)
