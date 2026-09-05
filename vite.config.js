import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backendPort = process.env.BACKEND_PORT || 8001;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/agent': `http://127.0.0.1:${backendPort}`,
      '/health': `http://127.0.0.1:${backendPort}`,
      '/travel': `http://127.0.0.1:${backendPort}`,
      '/products': `http://127.0.0.1:${backendPort}`,
      '/speech': `http://127.0.0.1:${backendPort}`,
    },
  },
})
