import type { Preview } from '@storybook/react';
import { createWordPressMocks } from './mocks/wordpress-globals';
import React from 'react';
import lightningTalkTheme from '../../../../.storybook/lightning-talk-theme';
import { generateFullCSS, generateStorybookThemeCSS } from '../src/tokens/css-generator';

// WordPress グローバル変数のMock
Object.assign(globalThis, createWordPressMocks());

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          'Introduction',
          'Design System',
          ['Design Tokens', 'Colors', 'Typography', 'Spacing', 'Icons', 'Animations'],
          'Components',
          ['Atoms', 'Molecules', 'Organisms', 'Templates'],
          'Lightning Talk Features',
          ['Events', 'Speakers', 'Talks', 'Interactive'],
          'WordPress Integration',
          ['Blocks', 'Theme', 'Admin'],
          'Accessibility',
          '*'
        ]
      }
    },
    layout: 'centered',
    docs: {
      theme: lightningTalkTheme,
      story: {
        inline: true
      }
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff'
        },
        {
          name: 'primary-50',
          value: '#fff7ed'
        },
        {
          name: 'lightning-gradient',
          value: 'linear-gradient(135deg, #ff6b35 0%, #4ecdc4 100%)'
        },
        {
          name: 'dark',
          value: '#171717'
        },
        {
          name: 'wordpress',
          value: '#f0f0f1'
        },
        {
          name: 'lightning-dark',
          value: 'linear-gradient(135deg, #c2410c 0%, #0e7490 100%)'
        }
      ]
    },
    viewport: {
      viewports: {
        mobileSmall: {
          name: 'Mobile Small (320px)',
          styles: {
            width: '320px',
            height: '568px'
          }
        },
        mobileMedium: {
          name: 'Mobile Medium (375px)',
          styles: {
            width: '375px',
            height: '667px'
          }
        },
        mobileLarge: {
          name: 'Mobile Large (414px)',
          styles: {
            width: '414px',
            height: '896px'
          }
        },
        tablet: {
          name: 'Tablet (768px)',
          styles: {
            width: '768px',
            height: '1024px'
          }
        },
        desktopSmall: {
          name: 'Desktop Small (1024px)',
          styles: {
            width: '1024px',
            height: '800px'
          }
        },
        desktopMedium: {
          name: 'Desktop Medium (1280px)',
          styles: {
            width: '1280px',
            height: '800px'
          }
        },
        desktopLarge: {
          name: 'Desktop Large (1440px)',
          styles: {
            width: '1440px',
            height: '900px'
          }
        },
        desktopXL: {
          name: 'Desktop XL (1920px)',
          styles: {
            width: '1920px',
            height: '1080px'
          }
        }
      }
    }
  },

  argTypes: {
    // WordPress共通props
    className: {
      control: 'text',
      description: 'CSS class name for custom styling'
    },
    id: {
      control: 'text',
      description: 'Element ID'
    }
  },

  decorators: [
    Story => {
      // 統合デザイントークンシステムからCSSを生成
      const designSystemCSS = generateFullCSS();
      const storybookThemeCSS = generateStorybookThemeCSS();
      
      const styleContent = `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=SF+Mono:wght@400;600&display=swap');
        
        ${designSystemCSS}
        ${storybookThemeCSS}
        
        /* Storybook専用補完スタイル */
        .lightning-talk-component {
          container-type: inline-size;
          font-family: var(--font-family-primary);
          font-size: var(--font-size-base);
        }
        
        /* WordPress環境シミュレーション */
        .wp-admin {
          --wp-primary-color: var(--color-primary-500);
          --wp-secondary-color: var(--color-secondary-500);
        }
        
        /* インタラクティブエフェクト */
        .storybook-interactive {
          transition: var(--transition-normal);
        }
        
        .storybook-interactive:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lightning-glow);
        }
        
        .storybook-interactive:active {
          animation: var(--animation-lightning-spark);
        }
      `;

      return React.createElement(
        'div',
        {
          className: 'wp-admin lightning-talk-component',
          style: {
            fontFamily: 'var(--font-family-primary)',
            position: 'relative',
            minHeight: '100vh',
            background: 'var(--color-neutral-50)',
            color: 'var(--color-neutral-900)'
          }
        },
        React.createElement('style', {
          dangerouslySetInnerHTML: { __html: styleContent }
        }),
        React.createElement(Story)
      );
    }
  ]
};

export default preview;
