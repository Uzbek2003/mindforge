import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const LEGAL_ROUTE_MAP: Record<string, string> = {
  '/privacy': '/privacy.html',
  '/terms': '/terms.html',
  '/about': '/about.html',
  '/support': '/support.html',
}

function legalRoutesPlugin(): Plugin {
  return {
    name: 'legal-routes',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const target = LEGAL_ROUTE_MAP[req.url ?? '']
        if (target) req.url = target
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), legalRoutesPlugin()],
  base: process.env.BASE_PATH ?? '/',
})
