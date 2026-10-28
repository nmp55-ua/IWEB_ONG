import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// Páginas en el servidor + islas de React. En desarrollo, /api se reenvía al back-end
// para que la cookie de sesión sea del mismo origen (plan-comun.md §1).
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), tailwind()],
  server: { port: 4321 },
  vite: {
    server: {
      proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: false } },
    },
  },
});
