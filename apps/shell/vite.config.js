import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@heis/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@heis/core': path.resolve(__dirname, '../../packages/core/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              id.includes('zustand')
            ) {
              return 'vendor';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
          if (id.includes('/pages/botica/')) {
            return 'mod-botica';
          }
          if (id.includes('/pages/ferreteria/')) {
            return 'mod-ferreteria';
          }
          if (id.includes('/pages/hospedaje/')) {
            return 'mod-hospedaje';
          }
          if (id.includes('/pages/restaurante/') || id.includes('/packages/restaurante/')) {
            return 'mod-restaurante';
          }
        },
      },
    },
  },
});
