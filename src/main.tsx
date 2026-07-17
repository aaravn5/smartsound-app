import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { EngineProvider } from '~/lib/engine-context'
import '@fontsource/instrument-serif'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource/jetbrains-mono'
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
