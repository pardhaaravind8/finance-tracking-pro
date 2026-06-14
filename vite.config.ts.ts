import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'https://deliver-blank-undertake-dude.trycloudflare.com',
        changeOrigin: true,
      },
    },
  },
})
