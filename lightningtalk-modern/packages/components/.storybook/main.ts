import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true,
      },
    },
  ],
  
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  
  core: {
    disableTelemetry: true,
  },
  
  viteFinal: async (config) => {
    // WordPress Mock設定
    config.define = {
      ...config.define,
      'process.env.STORYBOOK': true,
      'process.env.WP_ENV': JSON.stringify('storybook'),
    };
    
    // WordPress外部依存のMock
    config.resolve!.alias = {
      ...config.resolve!.alias,
      '@wordpress/element': require.resolve('react'),
      '@wordpress/api-fetch': require.resolve('./mocks/wp-api-fetch.ts'),
    };
    
    return config;
  },
  
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
  
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
};

export default config;