import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// base: './' => percorsi relativi, così funziona sia su
// utente.github.io (root) sia su utente.github.io/repo (sottocartella).
// Il routing dell'app è già a hash (#dashboard…), ideale per GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
});
