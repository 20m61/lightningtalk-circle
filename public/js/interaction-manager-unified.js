/**
 * 統合インタラクション管理システム
 * すべてのイベントリスナーを統一管理し、競合を防ぐ
 */

class UnifiedInteractionManager {
  constructor() {
    this.eventMap = new Map(); // イベントハンドラーのマッピング
    this.debug = window.DEBUG_MODE || false; // デバッグモード
    this.initialized = false;
    this.conflictingScripts = [
      'main.js',
      'mobile-navigation.js',
      'ui-ux-integration.js',
      'responsive-navigation.js'
    ];

    // ログ関数を追加
    this.log = this.debug ? this.log.bind(console, '[UnifiedInteractionManager]') : () => {};

    this.log('初期化開始');
    this.init();
  }

  init() {
    if (this.initialized) return;

    // 既存のイベントリスナーをクリーンアップ
    this.cleanupConflictingListeners();

    // 統合イベントシステムを設定
    this.setupUnifiedEventSystem();

    // スクロール管理システムを統合
    this.setupScrollManagement();

    // モーダル管理システムを統合
    this.setupModalManagement();

    // モバイル対応を統合
    this.setupMobileInteractions();

    this.initialized = true;
    window.unifiedInteractionManager = this;

    this.log('初期化完了');
    if (this.debug) this.logStatus();
  }

  cleanupConflictingListeners() {
    this.log('[UnifiedInteractionManager] 競合するイベントリスナーをクリーンアップ');

    // グローバル変数の衝突を解決（重要な機能は除外）
    const conflictingGlobals = [
      'lightningTalkApp',
      'LightningTalkApp',
      'mobileNavigation',
      'closeVoteModal'
      // EventsManager、showAdminLogin等は保持
    ];

    conflictingGlobals.forEach(varName => {
      if (window[varName]) {
        this.log(`[UnifiedInteractionManager] ${varName} をクリーンアップ`);
        delete window[varName];
      }
    });

    // DOM要素から古いイベントリスナーを削除
    this.removeOldEventListeners();
  }

  removeOldEventListeners() {
    // 重要な機能に影響しない特定の要素のイベントリスナーのみクリーンアップ
    const problematicSelectors = [
      '.mobile-menu-toggle',
      '.search-btn:not(.admin-search__btn)', // 管理画面の検索は除外
      '.modal-close'
      // 'form' は削除 - 他の機能に影響するため
    ];

    problematicSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // 重要な属性やデータを保持
        const attrs = Array.from(element.attributes);
        const newElement = element.cloneNode(true);

        // 属性を再設定
        attrs.forEach(attr => {
          newElement.setAttribute(attr.name, attr.value);
        });

        element.parentNode.replaceChild(newElement, element);
      });
    });

    this.log('[UnifiedInteractionManager] 限定的なイベントリスナーをクリーンアップ');
  }

  setupUnifiedEventSystem() {
    // イベントデリゲーションを使用した統一システム
    document.addEventListener('click', e => this.handleClick(e), true);
    document.addEventListener('touchstart', e => this.handleTouch(e), { passive: true });
    document.addEventListener('touchend', e => this.handleTouchEnd(e), { passive: true });
    document.addEventListener('keydown', e => this.handleKeydown(e));
    document.addEventListener('submit', e => this.handleSubmit(e));
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

    this.log('[UnifiedInteractionManager] 統合イベントシステム設定完了');
  }

  handleClick(e) {
    const target = e.target;
    const closest = selector => target.closest(selector);

    this.logEvent('click', target);

    // モバイルメニュートグル
    if (closest('.mobile-menu-toggle')) {
      e.preventDefault();
      e.stopPropagation();
      this.toggleMobileMenu();
      return;
    }

    // 検索ボタン
    if (closest('.search-btn')) {
      e.preventDefault();
      e.stopPropagation();
      this.handleSearch();
      return;
    }

    // モーダル閉じるボタン
    if (closest('.modal-close, .admin-modal__close')) {
      e.preventDefault();
      e.stopPropagation();
      this.closeModal();
      return;
    }

    // モーダルバックドロップ
    if (closest('.modal-backdrop, .mobile-menu-overlay')) {
      e.preventDefault();
      e.stopPropagation();
      this.closeModal();
      return;
    }

    // 管理画面のボタン
    if (closest('.admin-create-btn')) {
      e.preventDefault();
      e.stopPropagation();
      this.handleAdminCreate();
      return;
    }

    // リンクの基本処理（通常は通す）
    if (target.tagName === 'A' && target.href) {
      // 外部リンクの場合
      if (target.hostname !== window.location.hostname) {
        target.target = '_blank';
        target.rel = 'noopener noreferrer';
      }
    }
  }

  handleTouch(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchStartTime = Date.now();
  }

  handleTouchEnd(e) {
    if (!this.touchStartX) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - this.touchStartX;
    const diffY = touchEndY - this.touchStartY;
    const timeDiff = Date.now() - this.touchStartTime;

    // スワイプジェスチャーの検出
    if (Math.abs(diffX) > 50 && Math.abs(diffY) < 100 && timeDiff < 300) {
      if (diffX > 0 && this.touchStartX < 50) {
        // 左端からの右スワイプ → メニューを開く
        this.openMobileMenu();
      } else if (diffX < 0 && this.isMobileMenuOpen()) {
        // 右から左スワイプ → メニューを閉じる
        this.closeMobileMenu();
      }
    }

    this.touchStartX = null;
    this.touchStartY = null;
  }

  handleKeydown(e) {
    this.logEvent('keydown', e.target, e.key);

    // ESCキー
    if (e.key === 'Escape') {
      this.closeModal();
      this.closeMobileMenu();
      return;
    }

    // Ctrl/Cmd + ショートカット
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault();
          this.handleAdminCreate();
          break;
        case 'f':
          e.preventDefault();
          this.focusSearch();
          break;
        case '/':
          e.preventDefault();
          this.focusSearch();
          break;
      }
    }
  }

  handleSubmit(e) {
    const form = e.target;
    this.logEvent('submit', form);

    // 管理者ログインフォーム
    if (form.id === 'loginForm') {
      e.preventDefault();
      this.handleAdminLogin(form);
      return;
    }

    // 検索フォーム
    if (form.classList.contains('search-form')) {
      e.preventDefault();
      this.handleSearchSubmit(form);
      return;
    }
  }

  handleResize() {
    // モバイル⇔デスクトップ切り替え時の処理
    const isMobile = window.innerWidth < 768;
    document.body.classList.toggle('mobile-layout', isMobile);

    if (!isMobile && this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }

    this.logEvent('resize', document.body, `${window.innerWidth}x${window.innerHeight}`);
  }

  handleScroll() {
    // スクロール処理は ScrollManagerV2 に委譲
    if (window.scrollManager && window.scrollManager.handleScroll) {
      window.scrollManager.handleScroll();
    }
  }

  // モバイルメニュー管理
  toggleMobileMenu() {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    const menu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const toggle = document.querySelector('.mobile-menu-toggle');

    if (menu && overlay && toggle) {
      menu.classList.add('mobile-menu--active');
      overlay.classList.add('mobile-menu-overlay--active');
      toggle.classList.add('mobile-menu-toggle--active');

      // スクロールロック
      if (window.scrollManager) {
        window.scrollManager.lock('mobile-menu');
      }

      this.log('[UnifiedInteractionManager] モバイルメニュー開く');
    }
  }

  closeMobileMenu() {
    const menu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const toggle = document.querySelector('.mobile-menu-toggle');

    if (menu && overlay && toggle) {
      menu.classList.remove('mobile-menu--active');
      overlay.classList.remove('mobile-menu-overlay--active');
      toggle.classList.remove('mobile-menu-toggle--active');

      // スクロールアンロック
      if (window.scrollManager) {
        window.scrollManager.unlock('mobile-menu');
      }

      this.log('[UnifiedInteractionManager] モバイルメニュー閉じる');
    }
  }

  isMobileMenuOpen() {
    const menu = document.querySelector('.mobile-menu');
    return menu && menu.classList.contains('mobile-menu--active');
  }

  // 検索機能
  handleSearch() {
    const searchInput = document.querySelector('.search-input, .admin-search__input');
    if (searchInput) {
      const query = searchInput.value.trim();
      if (query) {
        this.performSearch(query);
      }
    }
    this.log('[UnifiedInteractionManager] 検索実行');
  }

  performSearch(query) {
    // 既存の検索マネージャーがあれば使用
    if (window.eventsManager && window.eventsManager.filters) {
      window.eventsManager.filters.search = query;
      window.eventsManager.renderAllEvents();
    } else {
      this.log(`[UnifiedInteractionManager] 検索: "${query}"`);
    }
  }

  focusSearch() {
    const searchInput = document.querySelector('.search-input, .admin-search__input');
    if (searchInput) {
      searchInput.focus();
    }
  }

  // モーダル管理
  closeModal() {
    // すべてのモーダルを閉じる
    const modals = document.querySelectorAll('.modal, .admin-modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
      modal.classList.remove('show', 'active');
    });

    // スクロールアンロック
    if (window.scrollManager) {
      window.scrollManager.unlock('modal');
    }

    this.log('[UnifiedInteractionManager] モーダル閉じる');
  }

  // 管理画面関連
  handleAdminCreate() {
    if (window.adminDashboard && window.adminDashboard.showCreateModal) {
      window.adminDashboard.showCreateModal();
    } else {
      this.log('[UnifiedInteractionManager] 管理画面の新規作成');
    }
  }

  showAdminLogin() {
    // 管理者ログインページへリダイレクト
    window.location.href = '/admin-login.html';
  }

  closeVoteModal() {
    const voteModal = document.getElementById('voteModal');
    if (voteModal) {
      voteModal.style.display = 'none';
      // スクロールアンロック
      if (window.scrollManager) {
        window.scrollManager.unlock('vote-modal');
      }
    }
    this.log('[UnifiedInteractionManager] 投票モーダル閉じる');
  }

  handleAdminLogin(form) {
    const email = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;

    // モック認証
    if (email === 'admin@lightningtalk.local' && password === 'ChangeThisPassword123!') {
      localStorage.setItem('authToken', 'mock-admin-token');
      window.location.href = '/admin.html';
    } else {
      alert('ログイン情報が正しくありません');
    }
  }

  // スクロール管理の統合
  setupScrollManagement() {
    // 既存のScrollManagerV2を使用
    if (!window.scrollManager) {
      console.warn('[UnifiedInteractionManager] ScrollManager not found');
    }
  }

  // モーダル管理の統合
  setupModalManagement() {
    // ESCキーでのモーダル閉じる処理を統合済み
  }

  // モバイル対応の統合
  setupMobileInteractions() {
    // タッチ操作の最適化
    const touchElements = document.querySelectorAll('button, a, [role="button"]');
    touchElements.forEach(element => {
      element.style.touchAction = 'manipulation';
    });
  }

  // デバッグ機能
  logEvent(type, target, detail = '') {
    if (!this.debug) return;

    const targetInfo = target.tagName
      ? `${target.tagName}${target.className ? '.' + target.className.split(' ')[0] : ''}`
      : target.toString();

    this.log(`[UnifiedInteractionManager] ${type}: ${targetInfo} ${detail}`);
  }

  logStatus() {
    this.log('[UnifiedInteractionManager] 状態:');
    this.log('- モバイルメニュー:', this.isMobileMenuOpen() ? '開' : '閉');
    this.log('- スクロールマネージャー:', window.scrollManager ? '有効' : '無効');
    this.log('- イベントマップサイズ:', this.eventMap.size);
  }

  // 外部から呼び出し可能なメソッド
  destroy() {
    this.initialized = false;
    this.log('[UnifiedInteractionManager] 破棄');
  }

  refresh() {
    this.destroy();
    this.init();
    this.log('[UnifiedInteractionManager] リフレッシュ');
  }
}

// 初期化の実行
(() => {
  // 他のスクリプトの初期化を待つ
  const initializeUnified = () => {
    if (window.unifiedInteractionManager) {
      this.log('[UnifiedInteractionManager] 既に初期化済み');
      return;
    }

    // 重要なスクリプトの初期化を待つ
    const waitForCriticalScripts = () => {
      // EventsManagerの初期化を待つ
      if (typeof EventsManager !== 'undefined' && !window.eventsManager) {
        setTimeout(() => {
          // EventsManagerを初期化
          if (!window.eventsManager) {
            window.eventsManager = new EventsManager();
          }
        }, 100);
      }

      // 統合システムを初期化
      const manager = new UnifiedInteractionManager();

      // デバッグ用グローバル関数
      window.debugInteractions = () => manager.logStatus();
      window.refreshInteractions = () => manager.refresh();

      // 必要なグローバル関数を登録
      window.showAdminLogin = () => manager.showAdminLogin();
      window.closeVoteModal = () => manager.closeVoteModal();

      this.log('[UnifiedInteractionManager] 統合インタラクション管理システム開始');
    };

    // 少し遅延させて他のスクリプトの初期化を待つ
    setTimeout(waitForCriticalScripts, 200);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUnified);
  } else {
    initializeUnified();
  }
})();

// エラーハンドリング（エラーは常に表示）
window.addEventListener('error', e => {
  if (window.DEBUG_MODE) {
    console.error('[UnifiedInteractionManager] Error:', e.message, e.filename, e.lineno);
  }
});

window.addEventListener('unhandledrejection', e => {
  if (window.DEBUG_MODE) {
    console.error('[UnifiedInteractionManager] Unhandled Promise Rejection:', e.reason);
  }
});
