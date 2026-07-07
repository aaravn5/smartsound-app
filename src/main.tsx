import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { EngineProvider } from '~/lib/engine-context'
// Desktop.fm uses the native system stack for all UI and a system mono for
// numbers — no bundled webfonts (see panda.config.ts `fonts`).
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
