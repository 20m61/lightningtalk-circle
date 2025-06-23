/**
 * AccessibilityProvider Component
 * アプリケーション全体のアクセシビリティ機能を提供するプロバイダー
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAccessibility, useScreenReaderAnnouncement } from '../hooks/useAccessibility';

interface AccessibilityContextType {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: number;
  screenReaderActive: boolean;
  keyboardNavigation: boolean;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  adjustFontSize: (delta: number) => void;
  resetFontSize: () => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: ReactNode;
  enableControls?: boolean;
}

export function AccessibilityProvider({ 
  children, 
  enableControls = true 
}: AccessibilityProviderProps) {
  const accessibility = useAccessibility();
  const { announce } = useScreenReaderAnnouncement();

  // CSS変数として設定を適用
  useEffect(() => {
    const root = document.documentElement;
    
    // フォントサイズの適用
    root.style.setProperty('--base-font-size', `${accessibility.fontSize}px`);
    
    // ハイコントラストモードの適用
    root.classList.toggle('high-contrast', accessibility.highContrast);
    
    // モーション設定の適用
    root.classList.toggle('reduce-motion', accessibility.reducedMotion);
    
    // キーボードナビゲーション状態の適用
    root.classList.toggle('keyboard-navigation', accessibility.keyboardNavigation);
    
    // スクリーンリーダー状態の適用
    root.classList.toggle('screen-reader-active', accessibility.screenReaderActive);
  }, [accessibility]);

  // 設定変更時の自動保存
  useEffect(() => {
    accessibility.savePreferences();
  }, [accessibility.highContrast, accessibility.reducedMotion, accessibility.fontSize]);

  const contextValue: AccessibilityContextType = {
    ...accessibility,
    announce
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      {enableControls && <AccessibilityControls />}
      <AccessibilityStyles />
    </AccessibilityContext.Provider>
  );
}

/**
 * アクセシビリティコンテキストを使用するフック
 */
export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
}

/**
 * アクセシビリティコントロールコンポーネント
 */
function AccessibilityControls() {
  const {
    highContrast,
    reducedMotion,
    fontSize,
    toggleHighContrast,
    toggleReducedMotion,
    adjustFontSize,
    resetFontSize,
    announce
  } = useAccessibilityContext();

  const handleContrastToggle = () => {
    toggleHighContrast();
    announce(
      highContrast ? 'ハイコントラストモードを無効にしました' : 'ハイコントラストモードを有効にしました'
    );
  };

  const handleMotionToggle = () => {
    toggleReducedMotion();
    announce(
      reducedMotion ? 'アニメーションを有効にしました' : 'アニメーションを無効にしました'
    );
  };

  const handleFontIncrease = () => {
    adjustFontSize(2);
    announce('文字サイズを大きくしました');
  };

  const handleFontDecrease = () => {
    adjustFontSize(-2);
    announce('文字サイズを小さくしました');
  };

  const handleFontReset = () => {
    resetFontSize();
    announce('文字サイズをリセットしました');
  };

  return (
    <div className="accessibility-controls" role="region" aria-label="アクセシビリティ設定">
      <div className="accessibility-controls-panel">
        <h3 className="accessibility-controls-title">アクセシビリティ設定</h3>
        
        <div className="accessibility-control-group">
          <button
            type="button"
            className={`accessibility-toggle ${highContrast ? 'active' : ''}`}
            onClick={handleContrastToggle}
            aria-pressed={highContrast}
            aria-label="ハイコントラストモード切り替え"
          >
            <span className="icon" aria-hidden="true">🌓</span>
            <span className="label">コントラスト</span>
          </button>
          
          <button
            type="button"
            className={`accessibility-toggle ${reducedMotion ? 'active' : ''}`}
            onClick={handleMotionToggle}
            aria-pressed={reducedMotion}
            aria-label="アニメーション制御"
          >
            <span className="icon" aria-hidden="true">🎭</span>
            <span className="label">アニメーション</span>
          </button>
        </div>
        
        <div className="font-size-controls">
          <span className="font-size-label">文字サイズ</span>
          <div className="font-size-buttons">
            <button
              type="button"
              className="font-size-btn"
              onClick={handleFontDecrease}
              aria-label="文字サイズを小さく"
              disabled={fontSize <= 12}
            >
              A-
            </button>
            <button
              type="button"
              className="font-size-btn"
              onClick={handleFontReset}
              aria-label="文字サイズをリセット"
            >
              A
            </button>
            <button
              type="button"
              className="font-size-btn"
              onClick={handleFontIncrease}
              aria-label="文字サイズを大きく"
              disabled={fontSize >= 24}
            >
              A+
            </button>
          </div>
          <span className="font-size-value" aria-live="polite">
            {fontSize}px
          </span>
        </div>
      </div>
      
      <AccessibilityControlsToggle />
    </div>
  );
}

/**
 * アクセシビリティコントロールの表示切り替えボタン
 */
function AccessibilityControlsToggle() {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleControls = () => {
    setIsOpen(!isOpen);
  };

  React.useEffect(() => {
    const panel = document.querySelector('.accessibility-controls-panel') as HTMLElement;
    if (panel) {
      panel.style.display = isOpen ? 'block' : 'none';
    }
  }, [isOpen]);

  return (
    <button
      type="button"
      className="accessibility-controls-toggle"
      onClick={toggleControls}
      aria-expanded={isOpen}
      aria-controls="accessibility-controls-panel"
      aria-label="アクセシビリティ設定パネル"
      title="アクセシビリティ設定"
    >
      <span className="icon" aria-hidden="true">
        {isOpen ? '✕' : '♿'}
      </span>
      <span className="sr-only">アクセシビリティ設定</span>
    </button>
  );
}

/**
 * アクセシビリティ用スタイルコンポーネント
 */
function AccessibilityStyles() {
  React.useEffect(() => {
    // CSS変数の定義
    const style = document.createElement('style');
    style.id = 'accessibility-provider-styles';
    style.textContent = `
      :root {
        --base-font-size: 16px;
        --accessibility-z-index: 10000;
      }

      /* アクセシビリティコントロール */
      .accessibility-controls {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: var(--accessibility-z-index);
      }

      .accessibility-controls-toggle {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        transition: all 0.3s ease;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }

      .accessibility-controls-toggle:hover,
      .accessibility-controls-toggle:focus {
        background: rgba(0, 0, 0, 0.9);
        transform: scale(1.1);
      }

      .accessibility-controls-panel {
        display: none;
        position: absolute;
        top: 60px;
        right: 0;
        width: 280px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        padding: 1rem;
      }

      .accessibility-controls-title {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #333;
      }

      .accessibility-control-group {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .accessibility-toggle {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .accessibility-toggle:hover {
        border-color: #999;
        background: #f8f9fa;
      }

      .accessibility-toggle.active {
        border-color: #0066ff;
        background: #e6f2ff;
        color: #0066ff;
      }

      .accessibility-toggle .icon {
        font-size: 1.2rem;
      }

      .accessibility-toggle .label {
        font-size: 0.8rem;
        font-weight: 500;
      }

      .font-size-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 6px;
      }

      .font-size-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #666;
      }

      .font-size-buttons {
        display: flex;
        gap: 0.25rem;
        margin-left: auto;
      }

      .font-size-btn {
        width: 32px;
        height: 32px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: bold;
        transition: all 0.2s ease;
      }

      .font-size-btn:hover:not(:disabled) {
        border-color: #0066ff;
        background: #e6f2ff;
      }

      .font-size-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .font-size-value {
        font-size: 0.75rem;
        color: #666;
        min-width: 40px;
        text-align: right;
      }

      /* ベースフォントサイズの適用 */
      body {
        font-size: var(--base-font-size);
      }

      /* ハイコントラストモード */
      .high-contrast {
        filter: contrast(150%);
      }

      .high-contrast * {
        border-color: currentColor !important;
        text-shadow: none !important;
        box-shadow: none !important;
      }

      /* モーション削減 */
      .reduce-motion *,
      .reduce-motion *::before,
      .reduce-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }

      /* キーボードナビゲーション */
      .keyboard-navigation *:focus-visible {
        outline: 2px solid #0066ff !important;
        outline-offset: 2px !important;
      }

      /* スクリーンリーダー対応 */
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }

      /* モバイル対応 */
      @media (max-width: 768px) {
        .accessibility-controls {
          top: 10px;
          right: 10px;
        }

        .accessibility-controls-toggle {
          width: 44px;
          height: 44px;
          font-size: 1rem;
        }

        .accessibility-controls-panel {
          width: 260px;
          top: 54px;
        }
      }

      /* ダークモード対応 */
      @media (prefers-color-scheme: dark) {
        .accessibility-controls-panel {
          background: #1f2937;
          border-color: #374151;
          color: #e5e7eb;
        }

        .accessibility-controls-title {
          color: #e5e7eb;
        }

        .accessibility-toggle {
          background: #374151;
          border-color: #4b5563;
          color: #e5e7eb;
        }

        .accessibility-toggle:hover {
          background: #4b5563;
          border-color: #6b7280;
        }

        .accessibility-toggle.active {
          background: #1e3a8a;
          border-color: #3b82f6;
          color: #bfdbfe;
        }

        .font-size-controls {
          background: #374151;
        }

        .font-size-btn {
          background: #4b5563;
          border-color: #6b7280;
          color: #e5e7eb;
        }

        .font-size-btn:hover:not(:disabled) {
          background: #1e3a8a;
          border-color: #3b82f6;
        }
      }

      /* プリント時は非表示 */
      @media print {
        .accessibility-controls {
          display: none !important;
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('accessibility-provider-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  return null;
}

/**
 * スキップリンクコンポーネント
 */
export function SkipLinks() {
  return (
    <nav className="skip-links" aria-label="スキップリンク">
      <a href="#main-content" className="skip-link">
        メインコンテンツへスキップ
      </a>
      <a href="#navigation" className="skip-link">
        ナビゲーションへスキップ
      </a>
      <a href="#footer" className="skip-link">
        フッターへスキップ
      </a>
    </nav>
  );
}

/**
 * ライブリージョンコンポーネント
 */
interface LiveRegionProps {
  message: string | null;
  politeness?: 'polite' | 'assertive';
  className?: string;
}

export function LiveRegion({ 
  message, 
  politeness = 'polite', 
  className = 'sr-only' 
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={className}
    >
      {message}
    </div>
  );
}

/**
 * フォーカストラップコンポーネント
 */
interface FocusTrapProps {
  children: ReactNode;
  active: boolean;
  onEscape?: () => void;
}

export function FocusTrap({ children, active, onEscape }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      } else if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [active, onEscape]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}