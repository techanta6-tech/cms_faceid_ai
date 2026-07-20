import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './', // Thêm dòng này để build đúng đường dẫn assets dạng tương đối cho Electron
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/dist-electron/**', '**/dist/**']
      },
      proxy: {
        '^/HLS-PROXY/.*': {
          target: 'http://localhost:10090',
          changeOrigin: true,
          secure: false,
          ws: true,
          router: (req) => {
            const match = req.url.match(/^\/HLS-PROXY\/([^\/]+)/);
            if (match) {
              const target = match[1];
              return `http://${target}`;
            }
            return 'http://localhost:10090';
          },
          rewrite: (path) => {
            return path.replace(/^\/HLS-PROXY\/[^\/]+/, '');
          },
        }
      }
    },
  };
});
