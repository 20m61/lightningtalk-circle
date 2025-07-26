/**
 * Console Verification Script
 * 本番環境でのコンソールログクリーンアップを検証
 */

(function() {
  'use strict';

  // 検証開始メッセージ
  if (window.DEBUG_MODE) {
    console.log('%c🔍 Console Verification Starting...', 'color: #3b82f6; font-weight: bold;');
  }

  // 本番環境でのDEBUG_MODEチェック
  const isDevelopment =
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.includes('dev');

  if (!isDevelopment && window.DEBUG_MODE) {
    console.warn('⚠️ DEBUG_MODE is enabled in production environment');
  }

  // グローバル関数の存在確認
  const requiredGlobals = [
    'getConsoleErrors',
    'clearConsoleErrors',
    'safeAddEventListener',
    'safeQuerySelector',
    'safeFetch',
    'apiRequest'
  ];

  const missingGlobals = requiredGlobals.filter(func => typeof window[func] === 'undefined');

  if (missingGlobals.length > 0) {
    if (window.DEBUG_MODE) {
      console.warn('Missing global functions:', missingGlobals);
    }
  } else if (window.DEBUG_MODE) {
    console.log('✅ All required global functions are available');
  }

  // 主要なシステムコンポーネントの確認
  const systemComponents = [
    { name: 'UnifiedInteractionManager', check: () => window.unifiedInteractionManager },
    { name: 'ScrollManager', check: () => window.scrollManager },
    { name: 'EventsManager', check: () => window.eventsManager },
    { name: 'ModalSystem', check: () => window.modalSystem },
    { name: 'WebSocketManager', check: () => window.getWebSocketManager }
  ];

  let componentsReady = 0;
  const maxWaitTime = 5000; // 5秒
  const checkInterval = 100;
  let waitTime = 0;

  function checkSystemComponents() {
    const readyComponents = [];
    const notReadyComponents = [];

    systemComponents.forEach(component => {
      if (component.check()) {
        readyComponents.push(component.name);
      } else {
        notReadyComponents.push(component.name);
      }
    });

    if (window.DEBUG_MODE) {
      if (readyComponents.length > componentsReady) {
        console.log(
          `✅ ${readyComponents.length}/${systemComponents.length} system components ready`
        );
        componentsReady = readyComponents.length;
      }
    }

    if (notReadyComponents.length === 0) {
      if (window.DEBUG_MODE) {
        console.log(
          '%c🎉 All system components initialized successfully!',
          'color: #10b981; font-weight: bold;'
        );
      }
      return true;
    }

    waitTime += checkInterval;
    if (waitTime >= maxWaitTime) {
      if (window.DEBUG_MODE) {
        console.warn('⏰ Some components not ready after 5 seconds:', notReadyComponents);
      }
      return true;
    }

    return false;
  }

  // 初回チェック
  if (!checkSystemComponents()) {
    const componentCheckInterval = setInterval(() => {
      if (checkSystemComponents()) {
        clearInterval(componentCheckInterval);
      }
    }, checkInterval);
  }

  // エラーカウンターの初期化
  let errorCount = 0;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // エラーカウント（開発環境のみ）
  if (isDevelopment) {
    console.error = function(...args) {
      errorCount++;
      return originalConsoleError.apply(console, args);
    };

    console.warn = function(...args) {
      // ResizeObserverやDOMエラーは除外
      const message = args.join(' ');
      if (
        !message.includes('ResizeObserver') &&
        !message.includes('DevTools') &&
        !message.includes('404') &&
        !message.includes('Not Found')
      ) {
        errorCount++;
      }
      return originalConsoleWarn.apply(console, args);
    };

    // 5秒後にエラー統計を表示
    setTimeout(() => {
      if (errorCount === 0) {
        console.log('%c✅ No console errors detected!', 'color: #10b981; font-weight: bold;');
      } else {
        console.log(
          `%c⚠️ ${errorCount} console error(s) detected`,
          'color: #f59e0b; font-weight: bold;'
        );
        console.log('Run getConsoleErrors() to see details');
      }
    }, 5000);
  }

  // 検証完了メッセージ
  if (window.DEBUG_MODE) {
    console.log('%c✅ Console Verification Setup Complete', 'color: #10b981; font-weight: bold;');
  }
})();
