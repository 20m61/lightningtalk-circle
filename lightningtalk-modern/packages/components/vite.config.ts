import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Rollupオプションを調整してビルドエラーを回避
    rollupOptions: {
      onwarn(warning, warn) {
        // 特定の警告を無視
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.message?.includes('object is not extensible')) return;
        warn(warning);
      },
      // treeshakingの設定を調整
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    // minifyをesbuildに設定
    minify: 'esbuild',
    target: 'es2015',
    sourcemap: false
  },
  esbuild: {
    // 名前を保持してエラーを防ぐ
    keepNames: true,
    legalComments: 'none'
  },
  // optimizeDepsを調整
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@storybook/addon-docs'],
    // esbuildOptionsを追加
    esbuildOptions: {
      target: 'es2015'
    }
  }
});
