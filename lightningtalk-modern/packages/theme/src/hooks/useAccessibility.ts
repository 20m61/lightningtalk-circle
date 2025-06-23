/**
 * useAccessibility Hook
 * Reactアプリケーション用のアクセシビリティフック
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface AccessibilityState {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: number;
  screenReaderActive: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityPreferences {
  highContrast?: boolean;
  reducedMotion?: boolean;
  fontSize?: number;
}

/**
 * アクセシビリティ状態管理フック
 */
export function useAccessibility(initialPreferences?: AccessibilityPreferences) {
  const [state, setState] = useState<AccessibilityState>(() => ({
    highContrast: initialPreferences?.highContrast ?? 
      (typeof window !== 'undefined' && window.matchMedia('(prefers-contrast: high)').matches),
    reducedMotion: initialPreferences?.reducedMotion ?? 
      (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    fontSize: initialPreferences?.fontSize ?? 16,
    screenReaderActive: false,
    keyboardNavigation: false
  }));

  // システム設定の監視
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, highContrast: e.matches }));
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    contrastQuery.addEventListener('change', handleContrastChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      contrastQuery.removeEventListener('change', handleContrastChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // キーボードナビゲーションの検出
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setState(prev => ({ ...prev, keyboardNavigation: true }));
      }
    };

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, keyboardNavigation: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // スクリーンリーダーの検出（簡易版）
  useEffect(() => {
    const checkScreenReader = () => {
      // 一般的なスクリーンリーダーの検出
      const userAgent = navigator.userAgent.toLowerCase();
      const screenReaderIndicators = [
        'nvda', 'jaws', 'dragon', 'narrator', 'voiceover'
      ];
      
      const hasScreenReader = screenReaderIndicators.some(indicator => 
        userAgent.includes(indicator)
      );

      setState(prev => ({ ...prev, screenReaderActive: hasScreenReader }));
    };

    checkScreenReader();
  }, []);

  // ローカルストレージからの設定復元
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('accessibility-preferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        setState(prev => ({ ...prev, ...preferences }));
      } catch (error) {
        console.warn('Failed to load accessibility preferences:', error);
      }
    }
  }, []);

  // 設定変更時の保存
  const savePreferences = useCallback(() => {
    if (typeof window === 'undefined') return;

    const preferences = {
      highContrast: state.highContrast,
      reducedMotion: state.reducedMotion,
      fontSize: state.fontSize
    };

    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
  }, [state]);

  // 設定更新関数
  const updatePreference = useCallback((key: keyof AccessibilityPreferences, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  // ハイコントラスト切り替え
  const toggleHighContrast = useCallback(() => {
    setState(prev => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  // モーション設定切り替え
  const toggleReducedMotion = useCallback(() => {
    setState(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  }, []);

  // フォントサイズ変更
  const adjustFontSize = useCallback((delta: number) => {
    setState(prev => {
      const newSize = Math.max(12, Math.min(24, prev.fontSize + delta));
      return { ...prev, fontSize: newSize };
    });
  }, []);

  // フォントサイズリセット
  const resetFontSize = useCallback(() => {
    setState(prev => ({ ...prev, fontSize: 16 }));
  }, []);

  return {
    ...state,
    updatePreference,
    toggleHighContrast,
    toggleReducedMotion,
    adjustFontSize,
    resetFontSize,
    savePreferences
  };
}

/**
 * フォーカス管理フック
 */
export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<Element | null>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // フォーカストラップ
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // 初期フォーカス
    if (firstFocusable) {
      firstFocusable.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  // フォーカス保存
  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement;
  }, []);

  // フォーカス復元
  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && typeof (previousFocusRef.current as HTMLElement).focus === 'function') {
      (previousFocusRef.current as HTMLElement).focus();
    }
  }, []);

  // フォーカス監視
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      setFocusedElement(e.target as Element);
    };

    const handleFocusOut = () => {
      setFocusedElement(null);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return {
    focusedElement,
    trapFocus,
    saveFocus,
    restoreFocus
  };
}

/**
 * ARIA属性管理フック
 */
export function useAria() {
  const generateId = useCallback((prefix: string = 'aria') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const createAriaLabel = useCallback((text: string, element?: string) => {
    if (element) {
      return `${text} ${element}`;
    }
    return text;
  }, []);

  const createAriaDescription = useCallback((mainText: string, additionalInfo?: string) => {
    return additionalInfo ? `${mainText}. ${additionalInfo}` : mainText;
  }, []);

  return {
    generateId,
    createAriaLabel,
    createAriaDescription
  };
}

/**
 * スクリーンリーダー通知フック
 */
export function useScreenReaderAnnouncement() {
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // アナウンサー要素の作成
    const announcerElement = document.createElement('div');
    announcerElement.id = 'react-screen-reader-announcer';
    announcerElement.setAttribute('aria-live', 'polite');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.className = 'sr-only';
    document.body.appendChild(announcerElement);
    
    setAnnouncer(announcerElement);

    return () => {
      if (document.body.contains(announcerElement)) {
        document.body.removeChild(announcerElement);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      // メッセージをクリア
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }, [announcer]);

  return { announce };
}

/**
 * キーボードショートカットフック
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const modifiers = {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey
      };

      // ショートカットキーの組み合わせをチェック
      Object.entries(shortcuts).forEach(([shortcut, handler]) => {
        const parts = shortcut.toLowerCase().split('+');
        const targetKey = parts[parts.length - 1];
        const requiredModifiers = parts.slice(0, -1);

        if (key === targetKey) {
          const modifierMatch = requiredModifiers.every(mod => {
            switch (mod) {
              case 'ctrl': return modifiers.ctrl;
              case 'alt': return modifiers.alt;
              case 'shift': return modifiers.shift;
              case 'meta': return modifiers.meta;
              default: return false;
            }
          });

          if (modifierMatch) {
            e.preventDefault();
            handler();
          }
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

/**
 * フォーム検証用アクセシビリティフック
 */
export function useFormAccessibility() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { announce } = useScreenReaderAnnouncement();

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    announce(`エラー: ${error}`, 'assertive');
  }, [announce]);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getFieldProps = useCallback((fieldName: string) => {
    const hasError = errors[fieldName];
    return {
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-describedby': hasError ? `${fieldName}-error` : undefined
    };
  }, [errors]);

  const getErrorProps = useCallback((fieldName: string) => {
    const error = errors[fieldName];
    return error ? {
      id: `${fieldName}-error`,
      role: 'alert',
      children: error
    } : null;
  }, [errors]);

  return {
    errors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    getFieldProps,
    getErrorProps
  };
}

/**
 * モーダル用アクセシビリティフック
 */
export function useModalAccessibility(isOpen: boolean) {
  const { trapFocus, saveFocus, restoreFocus } = useFocusManagement();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      saveFocus();
      
      // body のスクロールを無効化
      document.body.style.overflow = 'hidden';
      
      // フォーカストラップの設定
      if (modalRef.current) {
        const cleanup = trapFocus(modalRef.current);
        return cleanup;
      }
    } else {
      // モーダルが閉じたらフォーカスを復元
      restoreFocus();
      document.body.style.overflow = '';
    }
  }, [isOpen, trapFocus, saveFocus, restoreFocus]);

  // Escapeキーでモーダルを閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        restoreFocus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, restoreFocus]);

  const modalProps = {
    ref: modalRef,
    role: 'dialog',
    'aria-modal': 'true' as const,
    tabIndex: -1
  };

  return { modalProps };
}

/**
 * ページタイトル管理フック
 */
export function usePageTitle(title?: string, suffix?: string) {
  const { announce } = useScreenReaderAnnouncement();

  useEffect(() => {
    if (title) {
      const fullTitle = suffix ? `${title} - ${suffix}` : title;
      document.title = fullTitle;
      
      // ページタイトル変更をアナウンス
      announce(`ページが変更されました: ${title}`);
    }
  }, [title, suffix, announce]);
}

/**
 * ライブリージョン管理フック
 */
export function useLiveRegion(
  message: string | null, 
  politeness: 'polite' | 'assertive' = 'polite'
) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (regionRef.current && message) {
      regionRef.current.textContent = message;
    }
  }, [message]);

  const liveRegionProps = {
    ref: regionRef,
    'aria-live': politeness,
    'aria-atomic': 'true' as const,
    className: 'sr-only'
  };

  return { liveRegionProps };
}