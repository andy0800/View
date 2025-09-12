// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/viewapp-backend\.onrender\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /\.(mp4|webm|avi)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'video-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          }
        ]
      },
      includeAssets: ['View logo.png'],
      manifest: {
        name: 'View',
        short_name: 'View',
        description: 'View - Advertiser and Viewer Platform',
        theme_color: 'transparent',
        background_color: 'transparent',
        display: 'standalone',
        icons: [
          {
            src: 'View logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'View logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000
  },
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Uploads stay on backend
      '/uploads': {
        target: 'http://localhost:4001',
        changeOrigin: true
      },
      // Proxy auth & API calls to backend
      '/auth': {
        target: 'http://localhost:4001',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true
      }
    }
  }
});