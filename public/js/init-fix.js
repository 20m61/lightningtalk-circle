/**
 * 初期化エラー修正
 * グローバル関数と変数の定義を保証
 */

(function () {
  'use strict';

  // 必須グローバル関数の定義（見つからない場合のフォールバック）
  const requiredGlobals = {
    // モーダル関連
    showAdminLogin: function () {
      if (window.unifiedInteractionManager && window.unifiedInteractionManager.showAdminLogin) {
        window.unifiedInteractionManager.showAdminLogin();
      } else {
        window.location.href = '/admin-login.html';
      }
    },

    closeVoteModal: function () {
      if (window.unifiedInteractionManager && window.unifiedInteractionManager.closeVoteModal) {
        window.unifiedInteractionManager.closeVoteModal();
      } else {
        const voteModal = document.getElementById('voteModal');
        if (voteModal) {
          voteModal.style.display = 'none';
        }
      }
    },

    // スクロール修正
    fixScroll: function () {
      if (window.scrollManager && window.scrollManager.forceUnlock) {
        window.scrollManager.forceUnlock();
      } else {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.scrollTo(0, 0);
      }
    },

    // デバッグ関数
    debugInteractions: function () {
      console.log('=== Interaction Debug Info ===');
      console.log('UnifiedInteractionManager:', !!window.unifiedInteractionManager);
      console.log('ScrollManager:', !!window.scrollManager);
      console.log('EventsManager:', !!window.eventsManager);
      console.log('AdminDashboard:', !!window.adminDashboard);
    }
  };

  // グローバル関数を設定
  Object.keys(requiredGlobals).forEach(key => {
    if (typeof window[key] === 'undefined') {
      window[key] = requiredGlobals[key];
    }
  });

  // イベントリスナーの安全な追加
  function safeAddEventListener(element, event, handler, options) {
    if (element && element.addEventListener) {
      try {
        element.addEventListener(event, handler, options);
      } catch (e) {
        console.warn('Event listener error:', e);
      }
    }
  }

  // DOM要素の安全な取得
  function safeQuerySelector(selector) {
    try {
      return document.querySelector(selector);
    } catch (e) {
      console.warn('Selector error:', selector, e);
      return null;
    }
  }

  // 初期化チェーン
  const initializationChain = [
    {
      name: 'Debug Config',
      check: () => window.DEBUG_MODE !== undefined,
      init: () => {
        window.DEBUG_MODE = window.DEBUG_MODE || false;
      }
    },
    {
      name: 'DOM Cache',
      check: () => window.domCache !== undefined,
      init: () => {
        // DOM Cacheは自己初期化するので待つだけ
      }
    },
    {
      name: 'Scroll Manager',
      check: () => window.scrollManager !== undefined,
      init: () => {
        // Scroll Managerは自己初期化するので待つだけ
      }
    },
    {
      name: 'Events Manager',
      check: () => window.eventsManager !== undefined,
      init: () => {
        if (typeof EventsManager !== 'undefined' && !window.eventsManager) {
          try {
            window.eventsManager = new EventsManager();
          } catch (e) {
            console.warn('EventsManager initialization failed:', e);
          }
        }
      }
    }
  ];

  // 初期化実行
  function performInitialization() {
    let retryCount = 0;
    const maxRetries = 10;

    function tryInit() {
      let allInitialized = true;

      initializationChain.forEach(item => {
        if (!item.check()) {
          allInitialized = false;
          if (item.init) {
            item.init();
          }
        }
      });

      if (!allInitialized && retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryInit, 100);
      } else if (allInitialized) {
        if (window.DEBUG_MODE) {
          console.log('%c✅ 全システム初期化完了', 'color: #10b981; font-weight: bold;');
        }
      } else {
        console.warn('一部のシステムが初期化されませんでした');
      }
    }

    tryInit();
  }

  // Socket.IOの遅延読み込み対策
  window.ioLoadPromise = new Promise(resolve => {
    const checkIo = () => {
      if (typeof io !== 'undefined') {
        resolve(io);
      } else {
        setTimeout(checkIo, 100);
      }
    };
    checkIo();
  });

  // ユーティリティ関数をグローバル化
  window.safeAddEventListener = safeAddEventListener;
  window.safeQuerySelector = safeQuerySelector;

  // DOMContentLoaded時に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performInitialization);
  } else {
    performInitialization();
  }
})();
