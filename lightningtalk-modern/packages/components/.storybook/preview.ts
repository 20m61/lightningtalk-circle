import type { Preview } from '@storybook/react';
import { createWordPressMocks } from './mocks/wordpress-globals';
import React from 'react';

// WordPress グローバル変数のMock
Object.assign(globalThis, createWordPressMocks());

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    docs: {
      story: {
        inline: true
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
          name: 'lightning-gradient',
          value: 'linear-gradient(135deg, #FF6B35 0%, #4ECDC4 100%)'
        },
        {
          name: 'dark',
          value: '#1f2937'
        },
        {
          name: 'wordpress',
          value: '#f0f0f1'
        },
        {
          name: 'lightning-dark',
          value: 'linear-gradient(135deg, #C2410C 0%, #0F766E 100%)'
        }
      ]
    },
    viewport: {
      viewports: {
        mobile1: {
          name: 'iPhone SE',
          styles: {
            width: '375px',
            height: '667px'
          }
        },
        mobile2: {
          name: 'iPhone 12 Pro',
          styles: {
            width: '390px',
            height: '844px'
          }
        },
        tablet: {
          name: 'iPad',
          styles: {
            width: '768px',
            height: '1024px'
          }
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px'
          }
        },
        ultrawide: {
          name: 'Ultrawide',
          styles: {
            width: '1920px',
            height: '1080px'
          }
        },
        mobile3: {
          name: 'Galaxy S21',
          styles: {
            width: '384px',
            height: '854px'
          }
        },
        tablet2: {
          name: 'iPad Pro',
          styles: {
            width: '1024px',
            height: '1366px'
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
      // WordPress環境シミュレーション + Lightning Talk Design System
      const styleContent = `
        @import url('/css/design-tokens.css');
      
        .lightning-talk-component {
          --font-size-base: clamp(1rem, 2.5vw, 1.125rem);
          --space-component: clamp(0.5rem, 2vw, 1rem);
          container-type: inline-size;
        }
        
        /* Storybook特有のスタイル調整 */
        .lightning-effect::before {
          pointer-events: none;
        }
        
        .glow-on-hover:hover {
          box-shadow: 0 0 30px rgba(78, 205, 196, 0.4);
          transition: box-shadow 300ms ease-out;
        }
        
        .scale-on-hover:hover {
          transform: scale(1.02);
          transition: transform 200ms ease-out;
        }
        
        .bounce-on-click:active {
          animation: talk-bounce 200ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes talk-bounce {
          0% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        
        .celebration-trigger.celebrating {
          animation: celebration 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes celebration {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .wiggle-on-error {
          animation: shake 300ms ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
        }
        
        .loading-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        /* レスポンシブ表示制御 */
        .mobile-only { display: block; }
        .tablet-only, .desktop-only { display: none; }
        
        @media (min-width: 768px) {
          .mobile-only { display: none; }
          .tablet-only { display: block; }
        }
        
        @media (min-width: 1024px) {
          .tablet-only { display: none; }
          .desktop-only { display: block; }
        }
        
        /* タッチデバイス最適化 */
        @media (hover: none) and (pointer: coarse) {
          button {
            min-height: 48px;
            min-width: 48px;
          }
        }
      `;

      return React.createElement(
        'div',
        {
          className: 'wp-admin lightning-talk-component',
          style: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            position: 'relative',
            minHeight: '100vh'
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
