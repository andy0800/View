// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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