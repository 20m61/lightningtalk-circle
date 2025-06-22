import type { Preview } from '@storybook/react';
import { createWordPressMocks } from './mocks/wordpress-globals';

// WordPress グローバル変数のMock
Object.assign(globalThis, createWordPressMocks());

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      story: {
        inline: true,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#333333',
        },
        {
          name: 'wordpress',
          value: '#f0f0f1',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile1: {
          name: 'iPhone SE',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        mobile2: {
          name: 'iPhone 12 Pro',
          styles: {
            width: '390px',
            height: '844px',
          },
        },
        tablet: {
          name: 'iPad',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
      },
    },
  },
  
  argTypes: {
    // WordPress共通props
    className: {
      control: 'text',
      description: 'CSS class name for custom styling',
    },
    id: {
      control: 'text',
      description: 'Element ID',
    },
  },
  
  decorators: [
    (Story) => {
      // WordPress環境シミュレーション
      return (
        <div className="wp-admin" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;