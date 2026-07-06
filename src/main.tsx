import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { EngineProvider } from '~/lib/engine-context'
// Self-hosted faces via @fontsource (no CDN). Fraunces: all display &
// headlines (400 is the signature). Inter: UI/body — replaces every
// -apple-system fallback. JetBrains Mono: every number (Hz, min, %, BPM).
import '@fontsource/fraunces/400.css'
import '@fontsource/fraunces/400-italic.css'
import '@fontsource/fraunces/600.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/jetbrains-mono/400.css'
import './index.css'

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
