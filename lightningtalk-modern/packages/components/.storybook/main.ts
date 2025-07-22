import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'
  ],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    // '@storybook/addon-design-tokens',  // デザイントークン表示 - 未インストール
    '@storybook/addon-viewport',          // レスポンシブテスト
    '@storybook/addon-backgrounds',       // 背景テスト
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true
      }
    }
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {}
  },

  core: {
    disableTelemetry: true
  },

  viteFinal: async config => {
    // WordPress Mock設定
    config.define = {
      ...config.define,
      'process.env.STORYBOOK': true,
      'process.env.WP_ENV': JSON.stringify('storybook')
    };

    // WordPress外部依存のMock
    config.resolve!.alias = {
      ...config.resolve!.alias,
      '@wordpress/element': require.resolve('react'),
      '@wordpress/api-fetch': require.resolve('./mocks/wp-api-fetch.ts')
    };

    // Rollupビルドエラーを回避
    config.optimizeDeps = {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include || []),
        '@storybook/react',
        '@storybook/addon-essentials',
        '@storybook/addon-a11y',
        'react',
        'react-dom'
      ],
      exclude: [...(config.optimizeDeps?.exclude || []), '@storybook/addon-docs']
    };

    // Rollupビルド設定を更新してobject extensibleエラーを防ぐ
    config.build = {
      ...config.build,
      rollupOptions: {
        ...config.build?.rollupOptions,
        onwarn(warning, warn) {
          // 循環依存とobject extensibleエラーを無視
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          if (warning.message && warning.message.includes('object is not extensible')) return;
          warn(warning);
        },
        // Rollupのtreeshakingを調整してエラーを回避
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false
        }
      },
      // minify設定を調整
      minify: 'esbuild',
      target: 'es2020',
      // ソースマップを無効化してビルドエラーを回避
      sourcemap: false,
      // chunkSizeLimitを調整
      chunkSizeWarningLimit: 1000
    };

    // esbuildオプションを追加
    config.esbuild = {
      ...config.esbuild,
      keepNames: true,
      legalComments: 'none'
    };

    return config;
  },

  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation'
  },

  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: prop => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true)
    }
  }
};

export default config;
