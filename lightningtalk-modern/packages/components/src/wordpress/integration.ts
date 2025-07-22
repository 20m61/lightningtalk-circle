/**
 * WordPress Integration Module - Lightning Talk Circle
 * WordPress統合とモダンコンポーネントシステムのブリッジ
 */

import { lightningTalkTokens } from '../tokens/unified-tokens';
import { generateWordPressCSS } from '../tokens/css-generator';

/**
 * WordPress Block Editor統合用の型定義
 */
export interface WordPressBlockProps {
  /** ブロックの一意識別子 */
  clientId?: string;
  
  /** ブロックの属性 */
  attributes?: Record<string, any>;
  
  /** ブロックが選択されているか */
  isSelected?: boolean;
  
  /** ブロックのクラス名 */
  className?: string;
  
  /** WordPress環境で使用するスタイル */
  style?: React.CSSProperties;
}

/**
 * WordPress Theme統合用の設定
 */
export interface WordPressThemeConfig {
  /** テーマ名 */
  themeName: string;
  
  /** テーマバージョン */
  version: string;
  
  /** 統合デザイントークンを使用するかどうか */
  useDesignTokens: boolean;
  
  /** Lightning Talk専用スタイルを有効にするかどうか */
  enableLightningEffects: boolean;
  
  /** カスタマイザー対応設定 */
  customizer: {
    primaryColor: string;
    secondaryColor: string;
    enableDarkMode: boolean;
  };
}

/**
 * WordPress統合用のCSS生成
 */
export function generateWordPressIntegrationCSS(): string {
  const baseCSS = generateWordPressCSS();
  
  const additionalCSS = `
/* Lightning Talk Circle - WordPress統合CSS */

/* Block Editor対応 */
.editor-styles-wrapper {
  --wp-admin-theme-color: var(--color-primary-500);
  --wp-admin-theme-color-darker-10: var(--color-primary-600);
  --wp-admin-theme-color-darker-20: var(--color-primary-700);
}

.editor-styles-wrapper .wp-block {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
}

/* Gutenberg Block Styles */
.wp-block-lightning-talk-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-5);
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-lg);
  border: none;
  cursor: pointer;
  transition: var(--transition-normal);
  text-decoration: none;
}

.wp-block-lightning-talk-button.is-style-primary {
  background: var(--color-primary-500);
  color: white;
}

.wp-block-lightning-talk-button.is-style-primary:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.wp-block-lightning-talk-button.is-style-lightning {
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500));
  color: white;
  position: relative;
  overflow: hidden;
}

.wp-block-lightning-talk-button.is-style-lightning:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--shadow-xl), var(--shadow-lightning-glow);
}

.wp-block-lightning-talk-button.is-style-lightning::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: conic-gradient(from 90deg, var(--color-primary-500), var(--color-secondary-500), var(--color-lightning-spark), var(--color-primary-500));
  border-radius: inherit;
  z-index: -1;
  animation: var(--animation-lightning-glow);
}

/* Lightning Talk Event Block */
.wp-block-lightning-talk-event {
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-6);
  background: var(--color-neutral-50);
  box-shadow: var(--shadow-sm);
}

.wp-block-lightning-talk-event .event-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-600);
  margin-bottom: var(--spacing-4);
}

.wp-block-lightning-talk-event .event-meta {
  display: flex;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.wp-block-lightning-talk-event .event-description {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-neutral-800);
}

/* Theme Customizer Live Preview */
.customize-preview-iframe .lightning-talk-component {
  transition: all 0.3s ease;
}

/* WordPress Admin Bar Integration */
#wpadminbar {
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-secondary-600)) !important;
}

#wpadminbar .ab-item {
  color: white !important;
}

#wpadminbar .ab-item:hover {
  background: var(--color-primary-700) !important;
}

/* Classic Editor対応 */
.mce-content-body {
  font-family: var(--font-family-primary) !important;
  font-size: var(--font-size-base) !important;
  line-height: var(--line-height-normal) !important;
}

.mce-content-body h1 {
  font-size: var(--font-size-4xl) !important;
  color: var(--color-primary-600) !important;
}

.mce-content-body h2 {
  font-size: var(--font-size-3xl) !important;
  color: var(--color-primary-600) !important;
}

.mce-content-body h3 {
  font-size: var(--font-size-2xl) !important;
  color: var(--color-primary-600) !important;
}

/* Comment Form Integration */
#commentform {
  --form-primary-color: var(--color-primary-500);
  --form-secondary-color: var(--color-secondary-500);
}

#commentform input,
#commentform textarea {
  font-family: var(--font-family-primary);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-3);
}

#commentform input:focus,
#commentform textarea:focus {
  border-color: var(--color-primary-500);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary-100);
}

#commentform .form-submit input {
  background: var(--color-primary-500);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-normal);
}

#commentform .form-submit input:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

/* Widget Integration */
.widget {
  font-family: var(--font-family-primary);
}

.widget-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-600);
  margin-bottom: var(--spacing-4);
}

.widget ul li {
  padding: var(--spacing-2) 0;
  border-bottom: 1px solid var(--color-neutral-200);
}

.widget ul li:last-child {
  border-bottom: none;
}

.widget ul li a {
  color: var(--color-neutral-700);
  text-decoration: none;
  transition: var(--transition-fast);
}

.widget ul li a:hover {
  color: var(--color-primary-600);
}

/* Menu Integration */
.menu {
  font-family: var(--font-family-primary);
}

.menu-item a {
  color: var(--color-neutral-700);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: var(--transition-fast);
}

.menu-item a:hover {
  color: var(--color-primary-600);
}

.current-menu-item a {
  color: var(--color-primary-600);
  font-weight: var(--font-weight-semibold);
}

/* Search Form */
.search-form {
  display: flex;
  gap: var(--spacing-2);
}

.search-form input[type="search"] {
  flex: 1;
  padding: var(--spacing-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--border-radius-md);
  font-family: var(--font-family-primary);
}

.search-form input[type="search"]:focus {
  border-color: var(--color-primary-500);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary-100);
}

.search-form button {
  background: var(--color-primary-500);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.search-form button:hover {
  background: var(--color-primary-600);
}

/* Pagination */
.page-numbers {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--border-radius-md);
  color: var(--color-neutral-700);
  text-decoration: none;
  transition: var(--transition-fast);
}

.page-numbers:hover {
  background: var(--color-primary-50);
  color: var(--color-primary-600);
  border-color: var(--color-primary-200);
}

.page-numbers.current {
  background: var(--color-primary-500);
  color: white;
  border-color: var(--color-primary-500);
}

/* Responsive Adjustments for WordPress */
@media (max-width: 768px) {
  .wp-block-lightning-talk-event .event-meta {
    flex-direction: column;
    gap: var(--spacing-2);
  }
  
  #commentform .form-submit input {
    width: 100%;
  }
}

/* Dark Mode Support for WordPress */
@media (prefers-color-scheme: dark) {
  .wp-block-lightning-talk-event {
    background: var(--color-neutral-800);
    border-color: var(--color-neutral-700);
  }
  
  .wp-block-lightning-talk-event .event-title {
    color: var(--color-primary-400);
  }
  
  .wp-block-lightning-talk-event .event-description {
    color: var(--color-neutral-200);
  }
  
  .widget {
    color: var(--color-neutral-200);
  }
  
  .widget-title {
    color: var(--color-primary-400);
  }
}
`;

  return `${baseCSS}\n${additionalCSS}`;
}

/**
 * WordPress Block Editor用のコンポーネントラッパー
 */
export function withWordPressBlock<T extends WordPressBlockProps>(
  Component: React.ComponentType<T>
) {
  return function WordPressBlockWrapper(props: T) {
    const { className, isSelected, ...rest } = props;
    
    const wrapperClassName = [
      'lightning-talk-wp-block',
      isSelected && 'is-selected',
      className
    ].filter(Boolean).join(' ');
    
    return React.createElement('div', {
      className: wrapperClassName,
      'data-block': Component.displayName || Component.name
    }, React.createElement(Component, rest as T));
  };
}

/**
 * WordPress Customizer用の色設定取得
 */
export function getWordPressCustomizerColors(): Record<string, string> {
  return {
    'lightning-primary': lightningTalkTokens.colors.primary[500],
    'lightning-secondary': lightningTalkTokens.colors.secondary[500],
    'lightning-spark': lightningTalkTokens.colors.lightning.spark,
    'lightning-electric': lightningTalkTokens.colors.lightning.electric,
    'success': lightningTalkTokens.colors.semantic.success[500],
    'warning': lightningTalkTokens.colors.semantic.warning[500],
    'error': lightningTalkTokens.colors.semantic.error[500],
    'info': lightningTalkTokens.colors.semantic.info[500]
  };
}

/**
 * WordPress REST API用のデータ変換
 */
export function transformForWordPressAPI(data: any): any {
  // WordPress REST APIの形式に合わせてデータを変換
  return {
    ...data,
    meta: {
      ...data.meta,
      lightning_talk_design_tokens: JSON.stringify(lightningTalkTokens)
    }
  };
}

export default {
  generateWordPressIntegrationCSS,
  withWordPressBlock,
  getWordPressCustomizerColors,
  transformForWordPressAPI
};