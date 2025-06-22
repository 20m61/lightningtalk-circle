import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // WordPress環境変数
  define: {
    'process.env.WP_HOME': JSON.stringify('http://localhost:8080'),
    'process.env.WP_API_URL': JSON.stringify('http://localhost:8080/wp-json'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  
  // 開発サーバー設定
  server: {
    port: 3000,
    host: true,
    cors: true,
    
    // WordPress APIプロキシ
    proxy: {
      '^/wp-': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '^/wp-json': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // ビルド設定
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    
    rollupOptions: {
      // WordPress外部依存関係
      external: ['jquery', 'wp', 'lodash', '@wordpress/element'],
      output: {
        globals: {
          jquery: 'jQuery',
          wp: 'wp',
          lodash: '_',
          '@wordpress/element': 'wp.element',
        },
        // チャンク分割最適化
        manualChunks: {
          vendor: ['react', 'react-dom'],
          wordpress: ['@wordpress/api-fetch', '@wordpress/data'],
        },
      },
    },
    
    // CSS コード分割
    cssCodeSplit: true,
    
    // 本番最適化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  
  // パス解決
  resolve: {
    alias: {
      '@': resolve(__dirname, './packages'),
      '@components': resolve(__dirname, './packages/components/src'),
      '@theme': resolve(__dirname, './packages/theme/src'),
      '@admin': resolve(__dirname, './packages/admin-panel/src'),
      '@api': resolve(__dirname, './packages/api/src'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
  
  // CSS処理
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@theme/styles/variables.scss";
          @import "@theme/styles/mixins.scss";
        `,
      },
    },
    modules: {
      localsConvention: 'camelCase',
    },
  },
  
  // 最適化
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@wordpress/element'],
  },
  
  // 環境変数
  envPrefix: ['VITE_', 'WP_'],
});