import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  root: 'src',
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    manifest: true,
    
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.ts'),
        admin: resolve(__dirname, 'src/admin.ts'),
      },
      
      // WordPress外部依存
      external: ['jquery', 'wp', 'lodash'],
      output: {
        globals: {
          jquery: 'jQuery',
          wp: 'wp',
          lodash: '_',
        },
      },
    },
    
    // アセット設定
    assetsDir: 'assets',
    sourcemap: true,
  },
  
  server: {
    port: 3000,
    host: true,
    
    // WordPress プロキシ
    proxy: {
      '^/wp-': 'http://localhost:8080',
      '^/wp-json': 'http://localhost:8080',
    },
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, '../components/src'),
    },
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "./styles/variables.scss";
          @import "./styles/mixins.scss";
        `,
      },
    },
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@wordpress/element'],
  },
});