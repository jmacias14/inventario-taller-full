import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    hmr: {
      host: 'localhost',
      port: 5173
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'rolling-twelve-purchased-labeled.trycloudflare.com'
    ]
  }
});
