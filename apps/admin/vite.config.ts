import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In production the admin is served at https://<site>/admin/ (Vercel Services,
// see the root vercel.json). Building into dist/admin keeps file paths aligned
// with URLs; local development stays at http://localhost:5173/.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/admin/' : '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  build: {
    outDir: 'dist/admin',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts'
          if (id.includes('node_modules/@supabase')) return 'supabase'
        },
      },
    },
  },
}))
