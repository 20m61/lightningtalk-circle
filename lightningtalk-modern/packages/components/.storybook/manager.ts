/**
 * Lightning Talk Circle - Storybook Manager Configuration
 * Storybook UI設定とテーマ適用
 */

import { addons } from '@storybook/manager-api';
import lightningTalkTheme from '../../../../.storybook/lightning-talk-theme';

// Lightning Talk Circle テーマを適用
addons.setConfig({
  theme: lightningTalkTheme,

  // パネル設定
  panelPosition: 'bottom',

  // ナビゲーション設定
  sidebar: {
    showRoots: false,
    collapsedRoots: ['other']
  },

  // ツールバー設定
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false }
  },

  // Lightning Talk専用設定
  enableShortcuts: true,
  showPanel: true,
  selectedPanel: 'controls',
  initialActive: 'sidebar'
});
