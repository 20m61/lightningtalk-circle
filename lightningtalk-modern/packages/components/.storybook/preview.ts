import type { Preview } from '@storybook/react';
import { createWordPressMocks } from './mocks/wordpress-globals';
import React from 'react';
import { themes } from '@storybook/theming';

// WordPress グローバル変数のMock
Object.assign(globalThis, createWordPressMocks());

// カスタムテーマ設定
export const lightningTalkTheme = {
  ...themes.light,
  brandTitle: 'Lightning Talk Circle UI',
  brandUrl: 'https://xn--6wym69a.com',
  brandImage: '/images/logo.svg',
  brandTarget: '_self',

  colorPrimary: '#FF6B35',
  colorSecondary: '#4ECDC4',

  // UI colors
  appBg: '#f8f9fa',
  appContentBg: '#ffffff',
  appBorderColor: '#e9ecef',
  appBorderRadius: 8,

  // Typography
  fontBase:
    '"M PLUS Rounded 1c", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontCode: '"Fira Code", "SF Mono", Monaco, monospace',

  // Toolbar colors
  barTextColor: '#495057',
  barSelectedColor: '#FF6B35',
  barBg: '#ffffff',

  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#ced4da',
  inputTextColor: '#212529',
  inputBorderRadius: 4
};

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          'Introduction',
          'Design System',
          ['Colors', 'Typography', 'Spacing', 'Icons', 'Animations'],
          'Components',
          ['Atoms', 'Molecules', 'Organisms', 'Templates'],
          'Lightning Talk Features',
          ['Events', 'Speakers', 'Talks', 'Interactive'],
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
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@300;400;500;700;900&family=Fira+Code:wght@400;600&display=swap');
        @import url('/css/design-tokens.css');
      
        /* グローバルデザインシステム */
        :root {
          /* 色の定義 - ライトニングトークのブランドカラー */
          --color-primary: #FF6B35;
          --color-primary-dark: #E85320;
          --color-primary-light: #FF8F5C;
          --color-secondary: #4ECDC4;
          --color-secondary-dark: #39B0A8;
          --color-secondary-light: #6FE3DB;
          
          /* セマンティックカラー */
          --color-success: #10B981;
          --color-warning: #F59E0B;
          --color-error: #EF4444;
          --color-info: #3B82F6;
          
          /* グレースケール */
          --color-gray-50: #F9FAFB;
          --color-gray-100: #F3F4F6;
          --color-gray-200: #E5E7EB;
          --color-gray-300: #D1D5DB;
          --color-gray-400: #9CA3AF;
          --color-gray-500: #6B7280;
          --color-gray-600: #4B5563;
          --color-gray-700: #374151;
          --color-gray-800: #1F2937;
          --color-gray-900: #111827;
          
          /* タイポグラフィ */
          --font-primary: "M PLUS Rounded 1c", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --font-mono: "Fira Code", "SF Mono", Monaco, monospace;
          
          /* フォントサイズ - Fluid Typography */
          --text-xs: clamp(0.75rem, 1.5vw, 0.875rem);
          --text-sm: clamp(0.875rem, 2vw, 1rem);
          --text-base: clamp(1rem, 2.5vw, 1.125rem);
          --text-lg: clamp(1.125rem, 3vw, 1.25rem);
          --text-xl: clamp(1.25rem, 3.5vw, 1.5rem);
          --text-2xl: clamp(1.5rem, 4vw, 1.875rem);
          --text-3xl: clamp(1.875rem, 5vw, 2.25rem);
          --text-4xl: clamp(2.25rem, 6vw, 3rem);
          --text-5xl: clamp(3rem, 8vw, 3.75rem);
          
          /* スペーシング - Fluid Spacing */
          --space-1: clamp(0.25rem, 1vw, 0.5rem);
          --space-2: clamp(0.5rem, 1.5vw, 0.75rem);
          --space-3: clamp(0.75rem, 2vw, 1rem);
          --space-4: clamp(1rem, 2.5vw, 1.5rem);
          --space-5: clamp(1.5rem, 3vw, 2rem);
          --space-6: clamp(2rem, 4vw, 3rem);
          --space-7: clamp(3rem, 5vw, 4rem);
          --space-8: clamp(4rem, 6vw, 5rem);
          
          /* シャドウ */
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          --shadow-glow: 0 0 30px rgba(78, 205, 196, 0.4);
          
          /* トランジション */
          --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
          --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
          --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
          --transition-bounce: 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
          
          /* ボーダー */
          --border-radius-sm: 0.25rem;
          --border-radius-md: 0.5rem;
          --border-radius-lg: 0.75rem;
          --border-radius-xl: 1rem;
          --border-radius-full: 9999px;
          
          /* Z-index層 */
          --z-base: 0;
          --z-dropdown: 100;
          --z-sticky: 200;
          --z-overlay: 300;
          --z-modal: 400;
          --z-popover: 500;
          --z-tooltip: 600;
          --z-notification: 700;
        }
        
        /* ダークモード対応 */
        [data-theme="dark"] {
          --color-gray-50: #111827;
          --color-gray-100: #1F2937;
          --color-gray-200: #374151;
          --color-gray-300: #4B5563;
          --color-gray-400: #6B7280;
          --color-gray-500: #9CA3AF;
          --color-gray-600: #D1D5DB;
          --color-gray-700: #E5E7EB;
          --color-gray-800: #F3F4F6;
          --color-gray-900: #F9FAFB;
        }
      
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
        
        /* インタラクティブな雷エフェクト */
        @keyframes lightning-strike {
          0% {
            opacity: 0;
            transform: translateY(-100%) scaleY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
          60% {
            opacity: 0.8;
            transform: translateY(0) scaleY(1) scaleX(1.1);
          }
          100% {
            opacity: 0;
            transform: translateY(100%) scaleY(0.5);
          }
        }
        
        .lightning-effect {
          position: absolute;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, 
            transparent 0%,
            rgba(255, 255, 255, 0.8) 20%,
            rgba(78, 205, 196, 1) 50%,
            rgba(255, 107, 53, 1) 80%,
            transparent 100%
          );
          filter: blur(1px);
          animation: lightning-strike 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          animation-delay: var(--delay, 0s);
        }
        
        /* パーティクルエフェクト */
        @keyframes particle-float {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .particle {
          position: fixed;
          pointer-events: none;
          opacity: 0;
          animation: particle-float linear infinite;
          animation-duration: var(--duration, 10s);
          animation-delay: var(--delay, 0s);
        }
        
        /* グラデーションアニメーション */
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .gradient-animated {
          background: linear-gradient(-45deg, #FF6B35, #4ECDC4, #F7931E, #0099CC);
          background-size: 400% 400%;
          animation: gradient-shift 15s ease infinite;
        }
        
        /* ホバーエフェクト集 */
        .hover-lift {
          transition: transform var(--transition-base), box-shadow var(--transition-base);
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }
        
        .hover-glow {
          transition: box-shadow var(--transition-base);
        }
        .hover-glow:hover {
          box-shadow: 0 0 20px rgba(78, 205, 196, 0.6);
        }
        
        .hover-scale {
          transition: transform var(--transition-base);
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }
        
        /* フォーカススタイル */
        .focus-ring {
          outline: none;
          position: relative;
        }
        .focus-ring:focus-visible::after {
          content: '';
          position: absolute;
          inset: -3px;
          border: 2px solid var(--color-secondary);
          border-radius: inherit;
          pointer-events: none;
        }
        
        /* タッチデバイス最適化 */
        @media (hover: none) and (pointer: coarse) {
          button, .clickable {
            min-height: 48px;
            min-width: 48px;
            -webkit-tap-highlight-color: transparent;
          }
          
          .hover-lift:active {
            transform: translateY(-2px);
          }
          
          .hover-scale:active {
            transform: scale(0.98);
          }
        }
        
        /* プリファレンスに基づく動き */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* 高コントラストモード対応 */
        @media (prefers-contrast: high) {
          .lightning-talk-component {
            --color-primary: #FF4500;
            --color-secondary: #00CED1;
          }
        }
        
        /* カスタムスクロールバー */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--color-gray-100);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-gray-400);
          border-radius: var(--border-radius-full);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-gray-500);
        }
        
        /* パフォーマンス最適化 */
        .gpu-accelerated {
          transform: translateZ(0);
          will-change: transform;
        }
        
        .lazy-animate {
          content-visibility: auto;
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
