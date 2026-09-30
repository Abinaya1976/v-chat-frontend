import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://v-chat-production-aba4.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://v-chat-production-aba4.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://v-chat-production-aba4.up.railway.app',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
