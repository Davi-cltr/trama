import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg'],
      manifest: {
        name: 'Trama',
        short_name: 'Trama',
        description: 'O caderno compartilhado de quem cuida da criança.',
        lang: 'pt-BR',
        theme_color: '#1C2238',
        background_color: '#E9ECF0',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'icone.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        // Só o app fica em cache; respostas do Supabase nunca.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [],
      },
    }),
  ],
});
