import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Local dev only: forwards /api to the PHP backend (e.g. `php -S
    // localhost:8000 -t backend`) so the session/CSRF cookies stay
    // same-origin from the browser's perspective. Production serves the
    // built frontend and backend/api from the same Apache origin already
    // (docs/01-CMS-ARCHITECTURE.md), so no proxy is needed there.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Uploaded files (e.g. blog cover images) are served by the PHP
      // backend from uploads/ at the site root — same origin in production,
      // but a different port in local dev, so it needs the same proxy /api
      // gets above (see backend/config/uploads.php's uploads_public_base()).
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
