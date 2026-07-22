import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['socket.io-client']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large vendor libraries into separate chunks
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation-vendor': ['framer-motion', 'gsap'],
          'charts-vendor': ['recharts', 'chart.js', 'react-chartjs-2'],
          'utils-vendor': ['axios', 'dayjs', 'date-fns'],
          'socket-vendor': ['socket.io-client']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});