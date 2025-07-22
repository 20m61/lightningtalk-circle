/**
 * CSS Custom Properties Generator
 * 統合デザイントークンからCSS変数を自動生成
 */

import { lightningTalkTokens } from './unified-tokens';
import type { ColorPalette } from './unified-tokens';

/**
 * 完全なCSS Custom Properties生成
 */
export function generateFullCSS(): string {
  const cssBlocks: string[] = [];

  // ルート変数定義
  cssBlocks.push(`:root {
  /* ========================================
     Lightning Talk Circle - Design Tokens
     ======================================== */`);

  // カラーシステム
  cssBlocks.push(`
  /* Primary Colors - Lightning Electric Orange */`);
  Object.entries(lightningTalkTokens.colors.primary).forEach(([key, value]) => {
    cssBlocks.push(`  --color-primary-${key}: ${value};`);
  });

  cssBlocks.push(`
  /* Secondary Colors - Lightning Electric Turquoise */`);
  Object.entries(lightningTalkTokens.colors.secondary).forEach(([key, value]) => {
    cssBlocks.push(`  --color-secondary-${key}: ${value};`);
  });

  cssBlocks.push(`
  /* Neutral Colors - Grayscale */`);
  Object.entries(lightningTalkTokens.colors.neutral).forEach(([key, value]) => {
    cssBlocks.push(`  --color-neutral-${key}: ${value};`);
  });

  cssBlocks.push(`
  /* Lightning Colors - Brand Specific */`);
  Object.entries(lightningTalkTokens.colors.lightning).forEach(([key, value]) => {
    cssBlocks.push(`  --color-lightning-${key}: ${value};`);
  });

  cssBlocks.push(`
  /* Semantic Colors */`);
  Object.entries(lightningTalkTokens.colors.semantic).forEach(([semanticType, palette]) => {
    Object.entries(palette).forEach(([key, value]) => {
      cssBlocks.push(`  --color-${semanticType}-${key}: ${value};`);
    });
  });

  // タイポグラフィシステム
  cssBlocks.push(`
  /* Typography - Fluid Typography System */`);
  
  cssBlocks.push(`
  /* Font Families */`);
  Object.entries(lightningTalkTokens.typography.fontFamily).forEach(([key, value]) => {
    cssBlocks.push(`  --font-family-${key}: ${value};`);
  });

  cssBlocks.push(`
  /* Font Sizes - Responsive with clamp() */`);
  Object.entries(lightningTalkTokens.typography.fontSize).forEach(([key, value]) => {
    cssBlocks.push(`  --font-size-${key}: ${value};`);
  });

  cssBlocks.push(`
  /* Font Weights */`);
  Object.entries(lightningTalkTokens.typography.fontWeight).forEach(([key, value]) => {
    cssBlocks.push(`  --font-weight-${key}: ${value};`);
  });

  cssBlocks.push(`
  /* Line Heights */`);
  Object.entries(lightningTalkTokens.typography.lineHeight).forEach(([key, value]) => {
    cssBlocks.push(`  --line-height-${key}: ${value};`);
  });

  cssBlocks.push(`
  /* Letter Spacing */`);
  Object.entries(lightningTalkTokens.typography.letterSpacing).forEach(([key, value]) => {
    cssBlocks.push(`  --letter-spacing-${key}: ${value};`);
  });

  // スペーシングシステム
  cssBlocks.push(`
  /* Spacing - 8px Base System */`);
  Object.entries(lightningTalkTokens.spacing).forEach(([key, value]) => {
    cssBlocks.push(`  --spacing-${key}: ${value};`);
  });

  // シャドウシステム
  cssBlocks.push(`
  /* Shadows - Elevation System */`);
  Object.entries(lightningTalkTokens.shadows).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssBlocks.push(`  --shadow-${key}: ${value};`);
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        cssBlocks.push(`  --shadow-${key}-${subKey}: ${subValue};`);
      });
    }
  });

  // Border Radius
  cssBlocks.push(`
  /* Border Radius */`);
  Object.entries(lightningTalkTokens.borderRadius).forEach(([key, value]) => {
    cssBlocks.push(`  --border-radius-${key}: ${value};`);
  });

  // Lightning専用アニメーション
  cssBlocks.push(`
  /* Lightning Animations */`);
  Object.entries(lightningTalkTokens.animations.lightning).forEach(([key, value]) => {
    cssBlocks.push(`  --animation-lightning-${key}: ${value};`);
  });

  cssBlocks.push(`
  /* Transitions */`);
  Object.entries(lightningTalkTokens.animations.transitions).forEach(([key, value]) => {
    cssBlocks.push(`  --transition-${key}: ${value};`);
  });

  // ブレイクポイント
  cssBlocks.push(`
  /* Breakpoints */`);
  cssBlocks.push(`  --breakpoint-mobile-small: ${lightningTalkTokens.breakpoints.mobile.small};`);
  cssBlocks.push(`  --breakpoint-mobile-medium: ${lightningTalkTokens.breakpoints.mobile.medium};`);
  cssBlocks.push(`  --breakpoint-mobile-large: ${lightningTalkTokens.breakpoints.mobile.large};`);
  cssBlocks.push(`  --breakpoint-tablet: ${lightningTalkTokens.breakpoints.tablet};`);
  cssBlocks.push(`  --breakpoint-desktop-small: ${lightningTalkTokens.breakpoints.desktop.small};`);
  cssBlocks.push(`  --breakpoint-desktop-medium: ${lightningTalkTokens.breakpoints.desktop.medium};`);
  cssBlocks.push(`  --breakpoint-desktop-large: ${lightningTalkTokens.breakpoints.desktop.large};`);
  cssBlocks.push(`  --breakpoint-desktop-xl: ${lightningTalkTokens.breakpoints.desktop.xl};`);

  cssBlocks.push(`}`);

  // キーフレームアニメーション定義
  cssBlocks.push(`
/* ========================================
   Lightning Talk Keyframe Animations
   ======================================== */`);
   
  Object.entries(lightningTalkTokens.animations.keyframes).forEach(([name, keyframe]) => {
    cssBlocks.push(`
@keyframes ${name} {
${keyframe}
}`);
  });

  // ユーティリティクラス
  cssBlocks.push(`
/* ========================================
   Lightning Talk Utility Classes
   ======================================== */`);

  // カラーユーティリティ
  cssBlocks.push(`
/* Text Colors */
.text-primary { color: var(--color-primary-500); }
.text-secondary { color: var(--color-secondary-500); }
.text-success { color: var(--color-success-500); }
.text-warning { color: var(--color-warning-500); }
.text-error { color: var(--color-error-500); }
.text-info { color: var(--color-info-500); }

/* Background Colors */
.bg-primary { background-color: var(--color-primary-500); }
.bg-secondary { background-color: var(--color-secondary-500); }
.bg-success { background-color: var(--color-success-500); }
.bg-warning { background-color: var(--color-warning-500); }
.bg-error { background-color: var(--color-error-500); }
.bg-info { background-color: var(--color-info-500); }`);

  // Lightning専用クラス
  cssBlocks.push(`
/* Lightning Talk Specific Classes */
.lightning-glow {
  animation: var(--animation-lightning-glow);
  box-shadow: var(--shadow-lightning-glow);
}

.lightning-pulse {
  animation: var(--animation-lightning-pulse);
}

.lightning-spark {
  animation: var(--animation-lightning-spark);
  box-shadow: var(--shadow-lightning-spark);
}

.lightning-electric {
  box-shadow: var(--shadow-lightning-electric);
}`);

  // レスポンシブ対応
  cssBlocks.push(`
/* ========================================
   Responsive Design
   ======================================== */
   
@media (max-width: 768px) {
  :root {
    /* Mobile Typography Adjustments */
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    
    /* Mobile Spacing Adjustments */
    --spacing-container: var(--spacing-4);
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    /* Respect user motion preferences */
    --animation-lightning-pulse: none;
    --animation-lightning-glow: none;
    --animation-lightning-spark: none;
    --transition-fast: none;
    --transition-normal: none;
    --transition-slow: none;
  }
  
  .lightning-glow,
  .lightning-pulse,
  .lightning-spark {
    animation: none;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark Mode Adjustments */
    --color-neutral-50: #0a0a0a;
    --color-neutral-100: #171717;
    --color-neutral-200: #262626;
    --color-neutral-800: #f5f5f5;
    --color-neutral-900: #fafafa;
  }
}`);

  return cssBlocks.join('\n');
}

/**
 * Storybook用テーマCSS生成
 */
export function generateStorybookThemeCSS(): string {
  return `
/* Lightning Talk Circle - Storybook Theme */
.sb-show-main {
  background: linear-gradient(135deg, #fff7ed 0%, #f0fdfc 100%);
}

.sidebar-container {
  background: var(--color-primary-50) !important;
  border-right: 1px solid var(--color-primary-200) !important;
}

.sidebar-item[data-selected="true"] {
  background: var(--color-primary-500) !important;
  color: white !important;
}

/* Lightning Talk Branding */
.sb-bar .sb-brand {
  background: linear-gradient(45deg, var(--color-primary-500), var(--color-secondary-500));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: var(--font-weight-bold);
}
`;
}

/**
 * WordPress統合CSS生成
 */
export function generateWordPressCSS(): string {
  return `
/* Lightning Talk Circle - WordPress Integration */

/* Block Editor Variables */
.wp-block {
  --wp-primary-color: var(--color-primary-500);
  --wp-secondary-color: var(--color-secondary-500);
}

/* Lightning Talk Button Styles for WordPress */
.wp-block-button .wp-block-button__link.is-style-lightning {
  background: linear-gradient(45deg, var(--color-primary-500), var(--color-secondary-500));
  border: none;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lightning-glow);
  transition: var(--transition-bounce);
}

.wp-block-button .wp-block-button__link.is-style-lightning:hover {
  animation: var(--animation-lightning-pulse);
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl), var(--shadow-lightning-glow);
}

/* WordPress Admin Styling */
.wp-admin {
  --adminColorScheme-primary: var(--color-primary-500);
  --adminColorScheme-secondary: var(--color-secondary-500);
}
`;
}

export default {
  generateFullCSS,
  generateStorybookThemeCSS, 
  generateWordPressCSS
};