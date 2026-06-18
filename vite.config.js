import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    strictPort: true,
    host: true,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:4000', ws: true, changeOrigin: true },
    },
  },
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    target: 'es2020',
    cssMinify: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('@dnd-kit')) return 'vendor-dnd';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('mdast')) return 'vendor-md';
            if (id.includes('date-fns')) return 'vendor-date';
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('socket.io-client')) return 'vendor-socket';
            return 'vendor';
          }
        },
      },
    },
  },
});
