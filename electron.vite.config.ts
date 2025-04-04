// electron.vite.config.ts
import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [react()],
    // server: {
    //   middlewareMode: true, // Enable middleware mode
    //   configureServer: (server) => {
    //     server.middlewares.use((req, res, next) => {
    //       if (req.url?.endsWith('.wasm')) {
    //         res.setHeader('Content-Type', 'application/wasm');
    //       }
    //       next();
    //     });
    //   },
    // },
  },
});
