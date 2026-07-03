import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'node:path'

// TanStackRouterVite must run before the React plugin so the generated
// route tree is present when React compiles.
export default defineConfig({
  // '/' for a custom domain (smartsound.live) or a user/org Pages site; set
  // VITE_BASE=/smartsound-app/ if serving from a project-pages subpath.
  base: process.env.VITE_BASE ?? '/',
  plugins: [TanStackRouterVite(), react()],
  // Dev is fronted by a public tunnel (loca.lt / trycloudflare) so the camera
  // works over HTTPS; allow those foreign Host headers through.
  server: {
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      'styled-system': path.resolve(__dirname, './styled-system'),
    },
  },
})
