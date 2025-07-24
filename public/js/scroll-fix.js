/**
 * スクロール問題修正スクリプト
 * 複数のモーダルやナビゲーションでoverflow制御が競合する問題を解決
 */

class ScrollManager {
  constructor() {
    this.lockCount = 0;
    this.scrollPosition = 0;
    this.init();
  }

  init() {
    // オリジナルのstyle.overflowセッターを保存
    const originalStyleDescriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'overflow');
    
    // カスタムセッターでラップ
    Object.defineProperty(document.body.style, 'overflow', {
      set: (value) => {
        console.log(`[ScrollManager] overflow設定試行: ${value}`);
        
        if (value === 'hidden') {
          this.lockScroll();
        } else if (value === '' || value === 'auto' || value === 'visible') {
          this.unlockScroll();
        }
        
        // オリジナルのセッターは呼ばない（ScrollManagerが管理）
      },
      get: () => {
        return this.lockCount > 0 ? 'hidden' : '';
      }
    });

    // ページ離脱時にスクロールロックを解除
    window.addEventListener('beforeunload', () => {
      this.forceUnlockScroll();
    });

    // モーダルクローズイベントを監視
    this.observeModalChanges();
  }

  lockScroll() {
    if (this.lockCount === 0) {
      // 初回ロック時の処理
      this.scrollPosition = window.scrollY;
      document.body.style.cssText += `
        position: fixed;
        top: -${this.scrollPosition}px;
        width: 100%;
        overflow-y: scroll;
      `;
      document.documentElement.style.scrollBehavior = 'auto';
    }
    this.lockCount++;
    console.log(`[ScrollManager] スクロールロック (count: ${this.lockCount})`);
  }

  unlockScroll() {
    if (this.lockCount > 0) {
      this.lockCount--;
      console.log(`[ScrollManager] スクロールアンロック試行 (count: ${this.lockCount})`);
      
      if (this.lockCount === 0) {
        // すべてのロックが解除された時の処理
        const scrollY = document.body.style.top;
        document.body.style.cssText = document.body.style.cssText
          .replace(/position:\s*fixed;?/gi, '')
          .replace(/top:\s*-?\d+px;?/gi, '')
          .replace(/width:\s*100%;?/gi, '')
          .replace(/overflow-y:\s*scroll;?/gi, '');
        
        document.documentElement.style.scrollBehavior = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
        console.log(`[ScrollManager] スクロール完全解除`);
      }
    }
  }

  forceUnlockScroll() {
    this.lockCount = 0;
    document.body.style.cssText = document.body.style.cssText
      .replace(/position:\s*fixed;?/gi, '')
      .replace(/top:\s*-?\d+px;?/gi, '')
      .replace(/width:\s*100%;?/gi, '')
      .replace(/overflow-y:\s*scroll;?/gi, '')
      .replace(/overflow:\s*hidden;?/gi, '');
    
    document.documentElement.style.scrollBehavior = '';
    console.log(`[ScrollManager] 強制スクロール解除`);
  }

  observeModalChanges() {
    // モーダルの存在を監視
    const observer = new MutationObserver((mutations) => {
      const hasModal = document.querySelector('.admin-modal, .modal, .event-modal');
      const hasMenu = document.querySelector('.mobile-menu--open, .nav-menu--open');
      
      if (!hasModal && !hasMenu && this.lockCount > 0) {
        console.log(`[ScrollManager] モーダル/メニューが検出されないため強制解除`);
        this.forceUnlockScroll();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }
}

// グローバルインスタンスを作成
window.scrollManager = new ScrollManager();

// デバッグ用コマンド
window.fixScroll = () => {
  window.scrollManager.forceUnlockScroll();
  console.log('スクロールを強制的に修正しました');
};

// 既存のモーダルクローズ処理にフックを追加
document.addEventListener('DOMContentLoaded', () => {
  // ESCキー処理の統一
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // すべてのモーダルを閉じる
      const modals = document.querySelectorAll('.admin-modal, .modal, .event-modal');
      modals.forEach(modal => {
        if (modal.classList.contains('admin-modal--open') || 
            modal.classList.contains('modal--open') ||
            modal.style.display !== 'none') {
          modal.remove();
        }
      });
      
      // メニューを閉じる
      const mobileMenus = document.querySelectorAll('.mobile-menu--open, .nav-menu--open');
      mobileMenus.forEach(menu => {
        menu.classList.remove('mobile-menu--open', 'nav-menu--open');
      });
      
      // スクロールを解除
      setTimeout(() => {
        window.scrollManager.forceUnlockScroll();
      }, 300);
    }
  });
});

console.log('[ScrollManager] 初期化完了');