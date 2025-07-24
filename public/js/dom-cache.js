/**
 * DOM要素キャッシュシステム
 * 頻繁にアクセスされるDOM要素をキャッシュしてパフォーマンスを向上
 */

class DOMCache {
  constructor() {
    this.cache = new Map();
    this.initialized = false;
    this.debug = window.DEBUG_MODE || false;
  }

  init() {
    if (this.initialized) return;

    // よく使用される要素を事前キャッシュ
    this.preloadCommonElements();
    this.initialized = true;
  }

  preloadCommonElements() {
    const commonSelectors = [
      // ナビゲーション
      '.mobile-menu',
      '.mobile-menu-toggle',
      '.mobile-menu-overlay',

      // 検索
      '.search-form',
      '.search-input',
      '.search-btn',
      '.admin-search__input',

      // モーダル
      '#registerModal',
      '#voteModal',
      '.modal',
      '.modal-close',
      '.modal-backdrop',

      // イベント管理
      '#all-events-container',
      '.events-container',
      '.view-toggle-btn',
      '.filter-btn',
      '.pagination-btn',

      // 管理画面
      '.admin-create-btn',
      '#loginForm',

      // その他
      'body',
      'html'
    ];

    commonSelectors.forEach(selector => {
      this.get(selector);
    });

    if (this.debug) {
      console.log('[DOMCache] プリロード完了:', this.cache.size, '要素');
    }
  }

  get(selector, forceRefresh = false) {
    // キャッシュから取得
    if (!forceRefresh && this.cache.has(selector)) {
      return this.cache.get(selector);
    }

    // 新規取得
    const element = document.querySelector(selector);
    if (element) {
      this.cache.set(selector, element);
    }

    return element;
  }

  getAll(selector, forceRefresh = false) {
    const cacheKey = `all:${selector}`;

    if (!forceRefresh && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const elements = document.querySelectorAll(selector);
    this.cache.set(cacheKey, elements);

    return elements;
  }

  // 特定の要素を再取得
  refresh(selector) {
    if (selector) {
      this.cache.delete(selector);
      this.cache.delete(`all:${selector}`);
      return this.get(selector, true);
    }

    // 全キャッシュクリア
    this.cache.clear();
    this.preloadCommonElements();
  }

  // バッチDOM更新
  batchUpdate(updates) {
    requestAnimationFrame(() => {
      updates.forEach(update => {
        const element = this.get(update.selector);
        if (element && update.action) {
          update.action(element);
        }
      });
    });
  }

  // よく使う要素への直接アクセス
  get body() {
    return this.get('body');
  }

  get html() {
    return this.get('html');
  }

  get mobileMenu() {
    return this.get('.mobile-menu');
  }

  get mobileMenuToggle() {
    return this.get('.mobile-menu-toggle');
  }

  get mobileMenuOverlay() {
    return this.get('.mobile-menu-overlay');
  }

  get eventsContainer() {
    return this.get('#all-events-container');
  }
}

// グローバルインスタンス
window.domCache = new DOMCache();

// DOMContentLoadedで初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.domCache.init());
} else {
  window.domCache.init();
}
