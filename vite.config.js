import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import tailwindcss from '@tailwindcss/vite';

const useSsl = process.env.VITE_SSL === 'true';

export default defineConfig({
  base: './', // Use relative paths for GitHub Pages
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0)
    port: 5173,
    allowedHosts: true,
    hmr: false // Prevent WebSocket handshake failures over remote tunnels
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true
  },
  plugins: [
    tailwindcss(),
    ...(useSsl ? [basicSsl()] : []),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'favicon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-assets/*'],
      manifest: {
        id: './',
        name: 'TokiLink for Seiko',
        short_name: 'TokiLink',
        description: 'Sync your Seiko Bluetooth clock from your browser.',
        theme_color: '#0a0e17',
        background_color: '#0a0e17',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'browser'],
        start_url: './',
        scope: './',
        categories: ['utilities', 'productivity'],
        icons: [
          {
            src: './pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: './pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: './pwa-assets/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: './pwa-assets/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: './pwa-assets/apple-splash-1080-2340.jpg',
            sizes: '1080x2340',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'TokiLink Mobile View'
          },
          {
            src: './pwa-assets/apple-splash-2048-1536.jpg',
            sizes: '2048x1536',
            type: 'image/jpeg',
            form_factor: 'wide',
            label: 'TokiLink Desktop Dashboard'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest,jpg,jpeg}'],
        navigateFallback: './index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === 'document' ||
              request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'image' ||
              request.destination === 'font',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'TokiLink-assets-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ]
});
