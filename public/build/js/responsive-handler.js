/**
 * Lightning Talk Circle - Responsive Handler
 * レスポンシブ機能の動的制御とモバイル最適化
 */

class ResponsiveHandler {
  constructor() {
    this.breakpoints = {
      mobile: 375,
      mobileLarge: 414,
      tablet: 768,
      desktop: 1024,
      desktopLarge: 1440
    };

    this.currentBreakpoint = this.getBreakpoint();
    this.isMobile = window.innerWidth < this.breakpoints.tablet;
    this.isTablet =
      window.innerWidth >= this.breakpoints.tablet && window.innerWidth < this.breakpoints.desktop;
    this.isDesktop = window.innerWidth >= this.breakpoints.desktop;

    this.init();
  }

  init() {
    // 初期化処理
    this.setupEventListeners();
    this.setupMobileNavigation();
    this.setupTouchGestures();
    this.optimizeImages();
    this.handleOrientationChange();
    this.setupViewportHeight();
    this.initializeResponsiveTables();
    this.setupModalResponsive();
  }

  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // リサイズイベント（デバウンス付き）
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.handleResize();
      }, 250);
    });

    // Orientation Change
    window.addEventListener('orientationchange', () => {
      this.handleOrientationChange();
    });

    // タッチイベント最適化
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
  }

  /**
   * 現在のブレークポイントを取得
   */
  getBreakpoint() {
    const width = window.innerWidth;

    if (width < this.breakpoints.mobile) {
      return 'mobile-small';
    }
    if (width < this.breakpoints.mobileLarge) {
      return 'mobile';
    }
    if (width < this.breakpoints.tablet) {
      return 'mobile-large';
    }
    if (width < this.breakpoints.desktop) {
      return 'tablet';
    }
    if (width < this.breakpoints.desktopLarge) {
      return 'desktop';
    }
    return 'desktop-large';
  }

  /**
   * リサイズハンドラー
   */
  handleResize() {
    const newBreakpoint = this.getBreakpoint();
    const wasMobile = this.isMobile;

    this.currentBreakpoint = newBreakpoint;
    this.isMobile = window.innerWidth < this.breakpoints.tablet;
    this.isTablet =
      window.innerWidth >= this.breakpoints.tablet && window.innerWidth < this.breakpoints.desktop;
    this.isDesktop = window.innerWidth >= this.breakpoints.desktop;

    // ブレークポイントが変わった場合
    if (wasMobile !== this.isMobile) {
      this.handleBreakpointChange();
    }

    // ビューポート高さの更新
    this.setupViewportHeight();

    // カスタムイベントを発火
    window.dispatchEvent(
      new CustomEvent('breakpointChange', {
        detail: {
          breakpoint: this.currentBreakpoint,
          isMobile: this.isMobile,
          isTablet: this.isTablet,
          isDesktop: this.isDesktop
        }
      })
    );
  }

  /**
   * ブレークポイント変更時の処理
   */
  handleBreakpointChange() {
    if (this.isMobile) {
      this.enableMobileOptimizations();
    } else {
      this.disableMobileOptimizations();
    }
  }

  /**
   * モバイルナビゲーションの設定
   */
  setupMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('nav ul');
    const navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);

    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        navOverlay.classList.toggle('active');
        document.body.classList.toggle('nav-open');
      });

      // オーバーレイクリックで閉じる
      navOverlay.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.classList.remove('nav-open');
      });

      // ESCキーで閉じる
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
          navToggle.click();
        }
      });
    }
  }

  /**
   * タッチジェスチャーの設定
   */
  setupTouchGestures() {
    this.touchStartX = null;
    this.touchStartY = null;
    this.touchEndX = null;
    this.touchEndY = null;
  }

  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  handleTouchMove(e) {
    if (!this.touchStartX || !this.touchStartY) {
      return;
    }

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = this.touchStartX - currentX;
    const diffY = this.touchStartY - currentY;

    // スワイプ処理（必要に応じて実装）
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // 水平スワイプ
      if (diffX > 50) {
        // 左スワイプ
        this.handleSwipeLeft();
      } else if (diffX < -50) {
        // 右スワイプ
        this.handleSwipeRight();
      }
    }
  }

  handleTouchEnd(e) {
    this.touchStartX = null;
    this.touchStartY = null;
  }

  handleSwipeLeft() {
    // 左スワイプ時の処理
    const event = new CustomEvent('swipeLeft');
    window.dispatchEvent(event);
  }

  handleSwipeRight() {
    // 右スワイプ時の処理
    const event = new CustomEvent('swipeRight');
    window.dispatchEvent(event);
  }

  /**
   * 画像の最適化
   */
  optimizeImages() {
    // Lazy Loading
    if ('loading' in HTMLImageElement.prototype) {
      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => {
        img.src = img.dataset.src;
        img.loading = 'lazy';
      });
    } else {
      // Intersection Observer fallback
      this.setupLazyLoading();
    }

    // レスポンシブ画像の設定
    this.setupResponsiveImages();
  }

  /**
   * 遅延読み込みの設定
   */
  setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  /**
   * レスポンシブ画像の設定
   */
  setupResponsiveImages() {
    const images = document.querySelectorAll('img[data-srcset]');

    images.forEach(img => {
      // デバイスピクセル比を考慮
      const dpr = window.devicePixelRatio || 1;
      const width = img.clientWidth * dpr;

      // srcsetの設定
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
      }

      // sizesの設定
      if (img.dataset.sizes) {
        img.sizes = img.dataset.sizes;
      } else {
        // デフォルトのsizes設定
        img.sizes = '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw';
      }
    });
  }

  /**
   * Orientation Change の処理
   */
  handleOrientationChange() {
    const orientation = window.orientation || 0;
    const isLandscape = Math.abs(orientation) === 90;

    document.body.classList.toggle('landscape', isLandscape);
    document.body.classList.toggle('portrait', !isLandscape);

    // ビューポート高さの再計算
    setTimeout(() => {
      this.setupViewportHeight();
    }, 100);
  }

  /**
   * ビューポート高さの設定（iOS Safari対策）
   */
  setupViewportHeight() {
    // CSS変数でビューポート高さを設定
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // 100vhの代わりに使用: height: calc(var(--vh, 1vh) * 100);
  }

  /**
   * レスポンシブテーブルの初期化
   */
  initializeResponsiveTables() {
    const tables = document.querySelectorAll('.table-responsive table');

    tables.forEach(table => {
      // テーブルのモバイル表示用データを生成
      this.createMobileTable(table);
    });
  }

  /**
   * モバイル用テーブルの作成
   */
  createMobileTable(table) {
    const mobileContainer = document.createElement('div');
    mobileContainer.className = 'table-mobile';

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
      const mobileRow = document.createElement('div');
      mobileRow.className = 'table-row';

      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        const mobileCell = document.createElement('div');
        mobileCell.className = 'table-cell';
        mobileCell.innerHTML = `
          <span class="cell-label">${headers[index]}:</span>
          <span class="cell-value">${cell.innerHTML}</span>
        `;
        mobileRow.appendChild(mobileCell);
      });

      mobileContainer.appendChild(mobileRow);
    });

    // テーブルの後に挿入
    table.parentNode.insertBefore(mobileContainer, table.nextSibling);
  }

  /**
   * モーダルのレスポンシブ設定
   */
  setupModalResponsive() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
      // モバイルでフルスクリーン化
      if (this.isMobile) {
        modal.classList.add('modal-fullscreen-mobile');
      }

      // スワイプでモーダルを閉じる
      let startY = 0;

      modal.addEventListener('touchstart', e => {
        startY = e.touches[0].clientY;
      });

      modal.addEventListener('touchmove', e => {
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        // 下方向に100px以上スワイプで閉じる
        if (diff > 100) {
          const closeBtn = modal.querySelector('.modal-close');
          if (closeBtn) {
            closeBtn.click();
          }
        }
      });
    });
  }

  /**
   * モバイル最適化の有効化
   */
  enableMobileOptimizations() {
    // タッチ最適化
    document.body.classList.add('touch-optimized');

    // FastClickの代替（タッチ遅延の除去）
    this.removeTouchDelay();

    // モバイル用フォント調整
    this.adjustMobileFonts();

    // モバイル用パフォーマンス最適化
    this.enableMobilePerformance();
  }

  /**
   * モバイル最適化の無効化
   */
  disableMobileOptimizations() {
    document.body.classList.remove('touch-optimized');
  }

  /**
   * タッチ遅延の除去
   */
  removeTouchDelay() {
    const tapElements = document.querySelectorAll('a, button, input, select, textarea, .clickable');

    tapElements.forEach(element => {
      element.addEventListener('touchstart', function () {
        this.classList.add('touch-active');
      });

      element.addEventListener('touchend', function () {
        this.classList.remove('touch-active');
      });
    });
  }

  /**
   * モバイルフォントの調整
   */
  adjustMobileFonts() {
    // システムフォントを優先
    if (this.isMobile) {
      document.documentElement.style.setProperty(
        '--font-family',
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      );
    }
  }

  /**
   * モバイルパフォーマンスの最適化
   */
  enableMobilePerformance() {
    // アニメーションの簡略化
    if (this.isMobile && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduce-motion');
    }

    // 不要な要素の非表示
    if (this.isMobile) {
      document.querySelectorAll('.desktop-only').forEach(el => {
        el.style.display = 'none';
      });
    }
  }

  /**
   * デバイス情報の取得
   */
  getDeviceInfo() {
    return {
      breakpoint: this.currentBreakpoint,
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isDesktop: this.isDesktop,
      isTouch: 'ontouchstart' in window,
      pixelRatio: window.devicePixelRatio || 1,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      orientation: window.orientation || 0
    };
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  window.responsiveHandler = new ResponsiveHandler();
});

// エクスポート（ES6モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveHandler;
}
