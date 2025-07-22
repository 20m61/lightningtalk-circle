/**
 * Lightning Talk Circle - Storybook Theme Configuration
 * ⚡ Lightning Talk専用Storybookテーマ
 */

import { create } from '@storybook/theming/create';

const lightningTalkTheme = create({
  base: 'light',

  // Brand Identity
  brandTitle: '⚡ Lightning Talk Circle Design System',
  brandUrl: 'https://xn--6wym69a.com',
  brandImage: '/icons/logo-storybook.svg',
  brandTarget: '_self',

  // Lightning Talk Brand Colors
  colorPrimary: '#ff6b35', // Lightning Electric Orange
  colorSecondary: '#4ecdc4', // Lightning Electric Turquoise

  // UI Colors
  appBg: '#fff7ed', // Primary 50
  appContentBg: '#ffffff',
  appBorderColor: '#fed7aa', // Primary 200
  appBorderRadius: 8,

  // Typography
  fontBase: '"Noto Sans JP", "Yu Gothic", "Helvetica Neue", Arial, sans-serif',
  fontCode: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',

  // Text colors
  textColor: '#171717', // Neutral 900
  textInverseColor: '#fafafa', // Neutral 50
  textMutedColor: '#737373', // Neutral 500

  // Toolbar default and active colors
  barTextColor: '#404040', // Neutral 700
  barSelectedColor: '#ff6b35', // Primary 500
  barBg: '#f0fdfc', // Secondary 50

  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#d4d4d4', // Neutral 300
  inputTextColor: '#171717', // Neutral 900
  inputBorderRadius: 6,

  // Button colors
  buttonBg: '#ff6b35', // Primary 500
  buttonBorder: '#ea580c', // Primary 600
  buttonTextColor: '#ffffff',

  // Special Lightning Talk styling
  addonNotesTheme: {
    background: 'linear-gradient(135deg, #fff7ed 0%, #f0fdfc 100%)',
    borderColor: '#fed7aa'
  }
});

export default lightningTalkTheme;
