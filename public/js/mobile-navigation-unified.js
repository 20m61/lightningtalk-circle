/**
 * Unified Mobile Navigation Controller
 * モバイルナビゲーションの統合制御
 */

class UnifiedMobileNavigation {
  constructor() {
    this.isMenuOpen = false;
    this.toggle = null;
    this.menu = null;
    this.overlay = null;
    this.init();
  }

  init() {
    // DOM要素の取得
    this.toggle = document.querySelector('.mobile-menu-toggle');
    this.menu = document.querySelector('.mobile-menu');
    this.overlay = document.querySelector('.mobile-menu-overlay');

    if (!this.toggle || !this.menu || !this.overlay) {
      console.warn('Mobile navigation elements not found');
      return;
    }

    // イベントリスナーを設定
    this.setupEventListeners();

    // 初期状態を設定
    this.closeMenu();

    // タッチ最適化
    this.optimizeForTouch();

    console.log('Unified Mobile Navigation initialized');
  }

  setupEventListeners() {
    // ハンバーガーメニューのクリック
    this.toggle.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleMenu();
    });

    // オーバーレイのクリック
    this.overlay.addEventListener('click', e => {
      e.preventDefault();
      this.closeMenu();
    });

    // メニューリンクのクリック
    const menuLinks = this.menu.querySelectorAll('.mobile-menu__link');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        // 内部リンクの場合はメニューを閉じる
        if (link.getAttribute('href').startsWith('#')) {
          setTimeout(() => this.closeMenu(), 150);
        }
      });
    });

    // ESCキーでメニューを閉じる
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMenu();
      }
    });

    // 画面回転・リサイズ時の対応
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && this.isMenuOpen) {
        this.closeMenu();
      }
    });

    // スワイプジェスチャー
    this.setupSwipeGestures();
  }

  setupSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener(
      'touchstart',
      e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    document.addEventListener(
      'touchend',
      e => {
        if (!e.changedTouches) {return;}

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // 垂直方向の移動が大きい場合は無視
        if (Math.abs(diffY) > Math.abs(diffX)) {return;}

        // 左端からの右スワイプでメニューを開く
        if (diffX > 50 && touchStartX < 50 && !this.isMenuOpen) {
          this.openMenu();
        }

        // 右から左へのスワイプでメニューを閉じる
        if (diffX < -50 && this.isMenuOpen) {
          this.closeMenu();
        }
      },
      { passive: true }
    );
  }

  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    if (this.isMenuOpen) {return;}

    this.isMenuOpen = true;

    // スクロール固定
    if (window.scrollManager) {
      window.scrollManager.lock('mobile-menu');
    } else {
      document.body.style.overflow = 'hidden';
    }

    // メニューとオーバーレイを表示
    this.menu.classList.add('mobile-menu--active');
    this.overlay.classList.add('mobile-menu-overlay--active');
    this.toggle.classList.add('mobile-menu-toggle--active');

    // アクセシビリティ
    this.toggle.setAttribute('aria-expanded', 'true');
    this.menu.setAttribute('aria-hidden', 'false');

    // フォーカス管理
    setTimeout(() => {
      const firstLink = this.menu.querySelector('.mobile-menu__link');
      if (firstLink) {firstLink.focus();}
    }, 300);

    console.log('Mobile menu opened');
  }

  closeMenu() {
    if (!this.isMenuOpen) {return;}

    this.isMenuOpen = false;

    // スクロール解除
    if (window.scrollManager) {
      window.scrollManager.unlock('mobile-menu');
    } else {
      document.body.style.overflow = '';
    }

    // メニューとオーバーレイを非表示
    this.menu.classList.remove('mobile-menu--active');
    this.overlay.classList.remove('mobile-menu-overlay--active');
    this.toggle.classList.remove('mobile-menu-toggle--active');

    // アクセシビリティ
    this.toggle.setAttribute('aria-expanded', 'false');
    this.menu.setAttribute('aria-hidden', 'true');

    console.log('Mobile menu closed');
  }

  optimizeForTouch() {
    // タッチターゲットサイズの確保
    if (this.toggle) {
      const currentHeight = this.toggle.offsetHeight;
      if (currentHeight < 44) {
        this.toggle.style.minHeight = '44px';
      }
    }

    // タッチ遅延の除去
    this.toggle.style.touchAction = 'manipulation';

    // メニューリンクの最適化
    const menuLinks = this.menu.querySelectorAll('.mobile-menu__link');
    menuLinks.forEach(link => {
      link.style.touchAction = 'manipulation';
      link.style.minHeight = '44px';
    });
  }

  // 外部からメニューの状態を確認するメソッド
  isOpen() {
    return this.isMenuOpen;
  }

  // 強制的にメニューを閉じる（他のスクリプトから使用）
  forceClose() {
    this.closeMenu();
  }
}

// グローバルアクセス用
let unifiedMobileNav = null;

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    unifiedMobileNav = new UnifiedMobileNavigation();
    window.unifiedMobileNav = unifiedMobileNav;
  });
} else {
  unifiedMobileNav = new UnifiedMobileNavigation();
  window.unifiedMobileNav = unifiedMobileNav;
}

// 既存のモバイルナビ関数を無効化（競合防止）
window.addEventListener('load', () => {
  // 他のスクリプトのモバイルメニュー処理を無効化
  const existingHandlers = document.querySelectorAll('.mobile-menu-toggle');
  existingHandlers.forEach((handler, index) => {
    if (index > 0) {
      // 2番目以降のハンドラーを無効化
      handler.style.display = 'none';
    }
  });

  console.log('Mobile navigation conflicts resolved');
});

// デバッグ用関数
window.debugMobileMenu = function() {
  console.log('=== Mobile Menu Debug Info ===');
  console.log('Menu open:', unifiedMobileNav?.isOpen());
  console.log('Toggle element:', !!document.querySelector('.mobile-menu-toggle'));
  console.log('Menu element:', !!document.querySelector('.mobile-menu'));
  console.log('Overlay element:', !!document.querySelector('.mobile-menu-overlay'));
  console.log('Active classes:', {
    menu: document.querySelector('.mobile-menu')?.classList.toString(),
    overlay: document.querySelector('.mobile-menu-overlay')?.classList.toString(),
    toggle: document.querySelector('.mobile-menu-toggle')?.classList.toString()
  });
};
