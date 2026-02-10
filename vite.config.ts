import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to rewrite clean URLs to .html files in dev server
function htmlRewritePlugin() {
  return {
    name: 'html-rewrite',
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        const cleanUrls: Record<string, string> = {
          '/curriculum': '/curriculum.html',
        };
        if (req.url && cleanUrls[req.url.split('?')[0]]) {
          req.url = cleanUrls[req.url.split('?')[0]];
        }
        next();
      });
    },
  };
}

export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  plugins: [htmlRewritePlugin(), react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        curriculum: path.resolve(__dirname, 'curriculum.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});

