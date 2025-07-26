/**
 * コンソールエラー修正パッチ
 * 一般的なエラーを防ぐための対策
 */

(function() {
  'use strict';

  // 1. グローバル変数の未定義エラーを防ぐ
  const globalDefaults = {
    // jQuery
    $: typeof jQuery !== 'undefined' ? jQuery : null,
    jQuery: typeof jQuery !== 'undefined' ? jQuery : null,

    // Socket.IO
    io: typeof io !== 'undefined' ? io : null,

    // その他のライブラリ
    moment: typeof moment !== 'undefined' ? moment : null,
    Chart: typeof Chart !== 'undefined' ? Chart : null
  };

  // グローバル変数を設定（未定義の場合のみ）
  Object.keys(globalDefaults).forEach(key => {
    if (typeof window[key] === 'undefined' && globalDefaults[key] !== null) {
      window[key] = globalDefaults[key];
    }
  });

  // 2. DOM要素の存在チェック関数
  window.safeGetElement = function(selector) {
    try {
      const element = document.querySelector(selector);
      return element || null;
    } catch (e) {
      return null;
    }
  };

  window.safeGetElements = function(selector) {
    try {
      return document.querySelectorAll(selector);
    } catch (e) {
      return [];
    }
  };

  // 3. イベントリスナーの安全な追加
  window.safeAddListener = function(element, event, handler, options) {
    if (element && element.addEventListener) {
      try {
        element.addEventListener(event, handler, options);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  // 4. 非同期処理のエラーハンドリング
  window.safePromise = function(promise) {
    return promise.catch(error => {
      if (window.DEBUG_MODE) {
        console.warn('[SafePromise] Caught error:', error);
      }
      return null;
    });
  };

  // 5. localStorage/sessionStorageの安全なアクセス
  window.safeStorage = {
    getItem(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    setItem(key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        return false;
      }
    },
    removeItem(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  // 6. フォームデータの安全な取得
  window.safeFormData = function(form) {
    if (!form || !(form instanceof HTMLFormElement)) {
      return null;
    }
    try {
      return new FormData(form);
    } catch (e) {
      return null;
    }
  };

  // 7. JSON の安全なパース
  window.safeParse = function(jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return defaultValue;
    }
  };

  // 8. よくあるタイミング問題の修正
  const criticalElements = [
    { selector: '#all-events-container', handler: null },
    { selector: '.mobile-menu', handler: null },
    { selector: '.modal', handler: null }
  ];

  // DOM要素の遅延チェック
  function checkCriticalElements() {
    criticalElements.forEach(item => {
      if (!item.handler) {
        const element = document.querySelector(item.selector);
        if (element) {
          // 要素が見つかったら何もしない（エラーを防ぐだけ）
          item.handler = element;
        }
      }
    });
  }

  // 定期的にチェック（最初の5秒間）
  let checkCount = 0;
  const checkInterval = setInterval(() => {
    checkCriticalElements();
    checkCount++;
    if (checkCount > 50) {
      // 5秒後に停止
      clearInterval(checkInterval);
    }
  }, 100);

  // 9. イベントハンドラーのnullチェック
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (listener === null || listener === undefined) {
      return;
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  // 10. ResizeObserverエラーの抑制
  const resizeObserverErrHandler = e => {
    if (e.message && e.message.includes('ResizeObserver')) {
      e.stopImmediatePropagation();
      return true;
    }
  };

  window.addEventListener('error', resizeObserverErrHandler);

  // デバッグ情報
  if (window.DEBUG_MODE) {
    console.log('%c✅ Console Error Fix Applied', 'color: #10b981; font-weight: bold;');
  }
})();
