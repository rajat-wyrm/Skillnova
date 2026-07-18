import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// AIAssistant widget — builds to a single IIFE bundle that can be
// embedded into any HTML page, including the SkillNova app shell.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/widget.jsx',
      name: 'SkillNovaAIAssistant',
      fileName: () => 'aiassistant.js',
      formats: ['iife'],
    },
    rollupOptions: {
      external: [],
      output: { extend: true },
    },
    sourcemap: true,
    target: 'es2020',
  },
  server: {
    port: 5273,
    host: true,
    proxy: {
      // Proxy widget dev requests to the AIAssistant FastAPI backend.
      '/api/aiassistant': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
