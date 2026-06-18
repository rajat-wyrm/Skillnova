import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Standalone widget — no integration with the main SkillNova frontend.
// The output (dist/) is a single JS bundle + CSS that can be embedded
// anywhere via <script type="module" src="skillnova-chatbot.js">.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/widget.jsx',
      name: 'SkillNovaChatbot',
      fileName: () => 'skillnova-chatbot.js',
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
    port: 5174,
    host: true,
  },
});
