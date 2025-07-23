/**
 * Mobile-Optimized Components System
 * モバイルデバイス専用の最適化されたコンポーネントシステム
 */

class MobileComponentSystem {
  constructor() {
    this.components = new Map();
    this.activeComponents = new WeakMap();
    this.mobileBreakpoint = 768;
    this.touchTargetSize = 44; // iOS HIG推奨サイズ
    this.isMobile = window.innerWidth < this.mobileBreakpoint;

    this.init();
  }

  init() {
    // デバイス判定
    this.detectDevice();

    // コンポーネント登録
    this.registerMobileComponents();

    // レスポンシブリスナー
    this.setupResponsiveListeners();

    // パフォーマンス最適化
    this.setupPerformanceOptimizations();
  }

  /**
   * デバイス情報の詳細検出
   */
  detectDevice() {
    const { userAgent } = navigator;

    this.device = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(userAgent),
      hasNotch: this.detectNotch(),
      supportsSafeArea: CSS.supports('padding: env(safe-area-inset-top)'),
      supportsTouch: 'ontouchstart' in window,
      supportsVibration: 'vibrate' in navigator,
      pixelRatio: window.devicePixelRatio || 1,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }

  detectNotch() {
    // iPhone X以降のノッチ検出
    if (CSS.supports('padding: env(safe-area-inset-top)')) {
      const testDiv = document.createElement('div');
      testDiv.style.paddingTop = 'env(safe-area-inset-top)';
      document.body.appendChild(testDiv);
      const hasNotch = getComputedStyle(testDiv).paddingTop !== '0px';
      document.body.removeChild(testDiv);
      return hasNotch;
    }
    return false;
  }

  /**
   * モバイル専用コンポーネントの登録
   */
  registerMobileComponents() {
    // モバイルナビゲーション
    this.registerComponent('MobileNavigation', {
      render: this.createMobileNavigation.bind(this),
      styles: this.getMobileNavigationStyles(),
      interactions: this.setupMobileNavigationInteractions.bind(this)
    });

    // タッチ最適化ボタン
    this.registerComponent('TouchButton', {
      render: this.createTouchButton.bind(this),
      styles: this.getTouchButtonStyles(),
      interactions: this.setupTouchButtonInteractions.bind(this)
    });

    // スワイプカード
    this.registerComponent('SwipeCard', {
      render: this.createSwipeCard.bind(this),
      styles: this.getSwipeCardStyles(),
      interactions: this.setupSwipeCardInteractions.bind(this)
    });

    // プルリフレッシュ
    this.registerComponent('PullToRefresh', {
      render: this.createPullToRefresh.bind(this),
      styles: this.getPullToRefreshStyles(),
      interactions: this.setupPullToRefreshInteractions.bind(this)
    });

    // モバイルモーダル
    this.registerComponent('MobileModal', {
      render: this.createMobileModal.bind(this),
      styles: this.getMobileModalStyles(),
      interactions: this.setupMobileModalInteractions.bind(this)
    });

    // タッチスライダー
    this.registerComponent('TouchSlider', {
      render: this.createTouchSlider.bind(this),
      styles: this.getTouchSliderStyles(),
      interactions: this.setupTouchSliderInteractions.bind(this)
    });

    // アクションシート
    this.registerComponent('ActionSheet', {
      render: this.createActionSheet.bind(this),
      styles: this.getActionSheetStyles(),
      interactions: this.setupActionSheetInteractions.bind(this)
    });
  }

  /**
   * コンポーネント登録
   */
  registerComponent(name, config) {
    this.components.set(name, config);
  }

  /**
   * モバイルナビゲーション作成
   */
  createMobileNavigation(options = {}) {
    const { items = [], position = 'bottom', style = 'tabs' } = options;

    const nav = document.createElement('nav');
    nav.className = `mobile-nav mobile-nav--${position} mobile-nav--${style}`;

    // Safe Area対応
    if (this.device.supportsSafeArea) {
      nav.style.paddingBottom = 'env(safe-area-inset-bottom)';
    }

    const navList = document.createElement('ul');
    navList.className = 'mobile-nav__list';

    items.forEach((item, index) => {
      const navItem = document.createElement('li');
      navItem.className = 'mobile-nav__item';

      const navLink = document.createElement('a');
      navLink.className = 'mobile-nav__link';
      navLink.href = item.href || '#';
      navLink.setAttribute('role', 'tab');
      navLink.setAttribute('aria-selected', item.active ? 'true' : 'false');

      // アイコン
      if (item.icon) {
        const icon = document.createElement('span');
        icon.className = `mobile-nav__icon ${item.icon}`;
        icon.setAttribute('aria-hidden', 'true');
        navLink.appendChild(icon);
      }

      // ラベル
      const label = document.createElement('span');
      label.className = 'mobile-nav__label';
      label.textContent = item.label;
      navLink.appendChild(label);

      // バッジ
      if (item.badge) {
        const badge = document.createElement('span');
        badge.className = 'mobile-nav__badge';
        badge.textContent = item.badge;
        badge.setAttribute('aria-label', `${item.badge} notifications`);
        navLink.appendChild(badge);
      }

      navItem.appendChild(navLink);
      navList.appendChild(navItem);
    });

    nav.appendChild(navList);
    return nav;
  }

  /**
   * タッチ最適化ボタン作成
   */
  createTouchButton(options = {}) {
    const {
      text = 'Button',
      variant = 'primary',
      size = 'medium',
      icon = null,
      disabled = false,
      fullWidth = false,
      haptic = true
    } = options;

    const button = document.createElement('button');
    button.className = `touch-btn touch-btn--${variant} touch-btn--${size}`;

    if (fullWidth) {
      button.classList.add('touch-btn--full-width');
    }

    if (disabled) {
      button.disabled = true;
      button.classList.add('touch-btn--disabled');
    }

    // 最小タッチターゲットサイズの保証
    button.style.minHeight = `${this.touchTargetSize}px`;
    button.style.minWidth = `${this.touchTargetSize}px`;

    // アイコン
    if (icon) {
      const iconElement = document.createElement('span');
      iconElement.className = `touch-btn__icon ${icon}`;
      iconElement.setAttribute('aria-hidden', 'true');
      button.appendChild(iconElement);
    }

    // テキスト
    const textElement = document.createElement('span');
    textElement.className = 'touch-btn__text';
    textElement.textContent = text;
    button.appendChild(textElement);

    // リップルエフェクト
    button.addEventListener(
      'touchstart',
      e => {
        this.createRippleEffect(button, e);

        // ハプティックフィードバック
        if (haptic && this.device.supportsVibration) {
          navigator.vibrate(10);
        }
      },
      { passive: true }
    );

    return button;
  }

  /**
   * スワイプカード作成
   */
  createSwipeCard(options = {}) {
    const { content = '', actions = [], swipeThreshold = 80, snapBack = true } = options;

    const card = document.createElement('div');
    card.className = 'swipe-card';

    // カードコンテンツ
    const cardContent = document.createElement('div');
    cardContent.className = 'swipe-card__content';
    cardContent.innerHTML = content;

    // アクションエリア
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'swipe-card__actions';

    actions.forEach(action => {
      const actionBtn = document.createElement('button');
      actionBtn.className = `swipe-card__action swipe-card__action--${action.type}`;
      actionBtn.textContent = action.label;
      actionBtn.onclick = action.handler;
      actionsContainer.appendChild(actionBtn);
    });

    card.appendChild(cardContent);
    card.appendChild(actionsContainer);

    // スワイプデータ
    this.activeComponents.set(card, {
      startX: 0,
      currentX: 0,
      isDragging: false,
      threshold: swipeThreshold,
      snapBack
    });

    return card;
  }

  /**
   * プルリフレッシュ作成
   */
  createPullToRefresh(options = {}) {
    const { onRefresh = () => {}, threshold = 60, maxPull = 120 } = options;

    const container = document.createElement('div');
    container.className = 'pull-to-refresh';

    const indicator = document.createElement('div');
    indicator.className = 'pull-to-refresh__indicator';

    const icon = document.createElement('div');
    icon.className = 'pull-to-refresh__icon';
    icon.innerHTML = '↓';

    const text = document.createElement('div');
    text.className = 'pull-to-refresh__text';
    text.textContent = 'Pull to refresh';

    indicator.appendChild(icon);
    indicator.appendChild(text);
    container.appendChild(indicator);

    // プルデータ
    this.activeComponents.set(container, {
      threshold,
      maxPull,
      onRefresh,
      isRefreshing: false
    });

    return container;
  }

  /**
   * モバイルモーダル作成
   */
  createMobileModal(options = {}) {
    const {
      title = '',
      content = '',
      showClose = true,
      fullScreen = false,
      swipeToClose = true
    } = options;

    const modal = document.createElement('div');
    modal.className = `mobile-modal ${fullScreen ? 'mobile-modal--fullscreen' : ''}`;

    const modalContent = document.createElement('div');
    modalContent.className = 'mobile-modal__content';

    // ヘッダー
    if (title || showClose) {
      const header = document.createElement('div');
      header.className = 'mobile-modal__header';

      if (title) {
        const titleElement = document.createElement('h2');
        titleElement.className = 'mobile-modal__title';
        titleElement.textContent = title;
        header.appendChild(titleElement);
      }

      if (showClose) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'mobile-modal__close';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close modal');
        closeBtn.onclick = () => this.closeMobileModal(modal);
        header.appendChild(closeBtn);
      }

      modalContent.appendChild(header);
    }

    // コンテンツ
    const body = document.createElement('div');
    body.className = 'mobile-modal__body';
    body.innerHTML = content;
    modalContent.appendChild(body);

    modal.appendChild(modalContent);

    // スワイプで閉じる機能
    if (swipeToClose) {
      this.activeComponents.set(modal, {
        swipeToClose: true,
        startY: 0,
        currentY: 0
      });
    }

    return modal;
  }

  /**
   * アクションシート作成
   */
  createActionSheet(options = {}) {
    const { title = '', actions = [], cancelText = 'Cancel' } = options;

    const actionSheet = document.createElement('div');
    actionSheet.className = 'action-sheet';

    const content = document.createElement('div');
    content.className = 'action-sheet__content';

    // タイトル
    if (title) {
      const titleElement = document.createElement('div');
      titleElement.className = 'action-sheet__title';
      titleElement.textContent = title;
      content.appendChild(titleElement);
    }

    // アクション
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'action-sheet__actions';

    actions.forEach(action => {
      const actionBtn = document.createElement('button');
      actionBtn.className = `action-sheet__action ${action.destructive ? 'action-sheet__action--destructive' : ''}`;
      actionBtn.textContent = action.text;
      actionBtn.onclick = () => {
        if (action.handler) {
          action.handler();
        }
        this.closeActionSheet(actionSheet);
      };
      actionsContainer.appendChild(actionBtn);
    });

    // キャンセルボタン
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'action-sheet__cancel';
    cancelBtn.textContent = cancelText;
    cancelBtn.onclick = () => this.closeActionSheet(actionSheet);

    content.appendChild(actionsContainer);
    content.appendChild(cancelBtn);
    actionSheet.appendChild(content);

    return actionSheet;
  }

  /**
   * インタラクション設定群
   */
  setupMobileNavigationInteractions(nav) {
    const links = nav.querySelectorAll('.mobile-nav__link');

    links.forEach(link => {
      link.addEventListener(
        'touchstart',
        e => {
          // タッチフィードバック
          link.classList.add('mobile-nav__link--active');

          // ハプティックフィードバック
          if (this.device.supportsVibration) {
            navigator.vibrate(5);
          }
        },
        { passive: true }
      );

      link.addEventListener(
        'touchend',
        () => {
          link.classList.remove('mobile-nav__link--active');
        },
        { passive: true }
      );
    });
  }

  setupTouchButtonInteractions(button) {
    let touchStartTime;

    button.addEventListener(
      'touchstart',
      e => {
        touchStartTime = Date.now();
        button.classList.add('touch-btn--pressed');
      },
      { passive: true }
    );

    button.addEventListener(
      'touchend',
      e => {
        const touchDuration = Date.now() - touchStartTime;

        // 短時間タッチの場合はクリック処理
        if (touchDuration < 200) {
          button.classList.add('touch-btn--clicked');
          setTimeout(() => {
            button.classList.remove('touch-btn--clicked');
          }, 150);
        }

        button.classList.remove('touch-btn--pressed');
      },
      { passive: true }
    );
  }

  setupSwipeCardInteractions(card) {
    const cardData = this.activeComponents.get(card);

    card.addEventListener(
      'touchstart',
      e => {
        cardData.startX = e.touches[0].clientX;
        cardData.isDragging = true;
        card.classList.add('swipe-card--dragging');
      },
      { passive: true }
    );

    card.addEventListener(
      'touchmove',
      e => {
        if (!cardData.isDragging) {
          return;
        }

        cardData.currentX = e.touches[0].clientX - cardData.startX;
        const translateX = Math.max(-100, Math.min(0, cardData.currentX));

        card.style.transform = `translateX(${translateX}px)`;

        // アクション表示制御
        if (Math.abs(cardData.currentX) > cardData.threshold) {
          card.classList.add('swipe-card--action-visible');
        } else {
          card.classList.remove('swipe-card--action-visible');
        }
      },
      { passive: true }
    );

    card.addEventListener(
      'touchend',
      () => {
        cardData.isDragging = false;
        card.classList.remove('swipe-card--dragging');

        if (Math.abs(cardData.currentX) > cardData.threshold) {
          // アクション実行
          card.classList.add('swipe-card--swiped');
        } else if (cardData.snapBack) {
          // 元に戻す
          card.style.transform = 'translateX(0)';
          card.classList.remove('swipe-card--action-visible');
        }
      },
      { passive: true }
    );
  }

  setupPullToRefreshInteractions(container) {
    const refreshData = this.activeComponents.get(container);

    document.addEventListener(
      'touchstart',
      e => {
        if (window.scrollY === 0) {
          refreshData.startY = e.touches[0].clientY;
        }
      },
      { passive: true }
    );

    document.addEventListener('touchmove', e => {
      if (refreshData.startY && window.scrollY === 0) {
        const currentY = e.touches[0].clientY;
        const pullDistance = Math.min(refreshData.maxPull, currentY - refreshData.startY);

        if (pullDistance > 0) {
          e.preventDefault();
          container.style.transform = `translateY(${pullDistance}px)`;

          if (pullDistance > refreshData.threshold) {
            container.classList.add('pull-to-refresh--ready');
          } else {
            container.classList.remove('pull-to-refresh--ready');
          }
        }
      }
    });

    document.addEventListener(
      'touchend',
      () => {
        if (refreshData.startY) {
          const wasReady = container.classList.contains('pull-to-refresh--ready');

          container.style.transform = 'translateY(0)';
          container.classList.remove('pull-to-refresh--ready');

          if (wasReady && !refreshData.isRefreshing) {
            refreshData.isRefreshing = true;
            container.classList.add('pull-to-refresh--refreshing');

            refreshData.onRefresh().finally(() => {
              refreshData.isRefreshing = false;
              container.classList.remove('pull-to-refresh--refreshing');
            });
          }

          refreshData.startY = null;
        }
      },
      { passive: true }
    );
  }

  /**
   * リップルエフェクト作成
   */
  createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.touches[0].clientX - rect.left - size / 2;
    const y = event.touches[0].clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * レスポンシブリスナー設定
   */
  setupResponsiveListeners() {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < this.mobileBreakpoint;
      this.device.viewportWidth = window.innerWidth;
      this.device.viewportHeight = window.innerHeight;

      // コンポーネントの再調整
      this.adjustComponentsForViewport();
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.detectDevice();
        this.adjustComponentsForViewport();
      }, 100);
    });
  }

  /**
   * ビューポート調整
   */
  adjustComponentsForViewport() {
    // 動的フォントサイズ調整
    document.documentElement.style.fontSize = this.isMobile ? '14px' : '16px';

    // タッチターゲットサイズ調整
    const touchElements = document.querySelectorAll('.touch-optimized');
    touchElements.forEach(element => {
      element.style.minHeight = `${this.touchTargetSize}px`;
      element.style.minWidth = `${this.touchTargetSize}px`;
    });
  }

  /**
   * パフォーマンス最適化
   */
  setupPerformanceOptimizations() {
    // Intersection Observerによる遅延読み込み
    this.setupLazyLoading();

    // Passive event listenersの使用
    this.optimizeScrolling();

    // メモリ管理
    this.setupMemoryManagement();
  }

  setupLazyLoading() {
    const imageObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  optimizeScrolling() {
    let ticking = false;

    const optimizedScroll = () => {
      // スクロール処理
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(optimizedScroll);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  setupMemoryManagement() {
    // ページ離脱時のクリーンアップ
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  /**
   * スタイル定義群
   */
  getMobileNavigationStyles() {
    return `
      .mobile-nav {
        position: fixed;
        left: 0;
        right: 0;
        z-index: 1000;
        background: var(--color-background);
        border-top: 1px solid var(--color-border);
      }
      
      .mobile-nav--bottom {
        bottom: 0;
      }
      
      .mobile-nav__list {
        display: flex;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      
      .mobile-nav__item {
        flex: 1;
      }
      
      .mobile-nav__link {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 4px;
        text-decoration: none;
        color: var(--color-text-secondary);
        transition: color 0.2s ease;
        min-height: ${this.touchTargetSize}px;
        position: relative;
      }
      
      .mobile-nav__link--active {
        background: rgba(0, 0, 0, 0.1);
      }
      
      .mobile-nav__icon {
        font-size: 20px;
        margin-bottom: 2px;
      }
      
      .mobile-nav__label {
        font-size: 10px;
        line-height: 1;
      }
      
      .mobile-nav__badge {
        position: absolute;
        top: 4px;
        right: 50%;
        transform: translateX(50%);
        background: var(--color-error);
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 10px;
        min-width: 16px;
        text-align: center;
      }
    `;
  }

  getTouchButtonStyles() {
    return `
      .touch-btn {
        position: relative;
        border: none;
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        overflow: hidden;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        min-height: ${this.touchTargetSize}px;
        min-width: ${this.touchTargetSize}px;
      }
      
      .touch-btn--pressed {
        transform: scale(0.98);
      }
      
      .touch-btn--clicked {
        transform: scale(1.02);
      }
      
      .touch-btn--full-width {
        width: 100%;
      }
      
      .touch-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      }
      
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
  }

  getPullToRefreshStyles() {
    return `
      .pull-to-refresh {
        position: relative;
        overflow: hidden;
      }
      
      .pull-to-refresh__indicator {
        position: absolute;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--color-primary-500);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: top 0.3s ease;
        z-index: 10;
      }
      
      .pull-to-refresh__indicator--visible {
        top: 20px;
      }
      
      .pull-to-refresh__spinner {
        width: 20px;
        height: 20px;
        border: 2px solid white;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
  }

  getSwipeCardStyles() {
    return `
      .swipe-card {
        position: relative;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: transform 0.3s ease;
      }
      
      .swipe-card--dragging {
        transition: none;
      }
      
      .swipe-card__content {
        padding: 16px;
      }
      
      .swipe-card__actions {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        display: flex;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }
      
      .swipe-card--action-visible .swipe-card__actions {
        transform: translateX(0);
      }
      
      .swipe-card__action {
        padding: 0 20px;
        border: none;
        color: white;
        font-weight: 500;
        cursor: pointer;
      }
      
      .swipe-card__action--delete {
        background: var(--color-error);
      }
      
      .swipe-card__action--archive {
        background: var(--color-warning);
      }
    `;
  }

  getMobileModalStyles() {
    return `
      .mobile-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      
      .mobile-modal--visible {
        opacity: 1;
        visibility: visible;
      }
      
      .mobile-modal__content {
        background: white;
        border-radius: 12px;
        max-width: 90%;
        max-height: 90%;
        overflow-y: auto;
        position: relative;
        transform: scale(0.8);
        transition: transform 0.3s ease;
      }
      
      .mobile-modal--visible .mobile-modal__content {
        transform: scale(1);
      }
      
      .mobile-modal__header {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .mobile-modal__title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
      
      .mobile-modal__close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        color: #6b7280;
      }
      
      .mobile-modal__body {
        padding: 16px;
      }
      
      .mobile-modal__actions {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
    `;
  }

  getTouchSliderStyles() {
    return `
      .touch-slider {
        position: relative;
        overflow: hidden;
        touch-action: pan-x;
      }
      
      .touch-slider__track {
        display: flex;
        transition: transform 0.3s ease;
      }
      
      .touch-slider__slide {
        flex: 0 0 auto;
        width: 100%;
      }
      
      .touch-slider__dots {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 16px;
      }
      
      .touch-slider__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #d1d5db;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      
      .touch-slider__dot--active {
        background: var(--color-primary-500);
      }
      
      .touch-slider__nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      
      .touch-slider__nav:hover {
        background: rgba(255, 255, 255, 1);
      }
      
      .touch-slider__nav--prev {
        left: 10px;
      }
      
      .touch-slider__nav--next {
        right: 10px;
      }
      
      .touch-slider__nav--hidden {
        display: none;
      }
    `;
  }

  /**
   * タッチスライダー作成
   */
  createTouchSlider(options = {}) {
    const {
      slides = [],
      showDots = true,
      showNav = true,
      autoplay = false,
      autoplayInterval = 3000
    } = options;

    const slider = document.createElement('div');
    slider.className = 'touch-slider';

    const track = document.createElement('div');
    track.className = 'touch-slider__track';

    slides.forEach((slide, index) => {
      const slideElement = document.createElement('div');
      slideElement.className = 'touch-slider__slide';
      slideElement.innerHTML = slide;
      track.appendChild(slideElement);
    });

    slider.appendChild(track);

    if (showDots && slides.length > 1) {
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'touch-slider__dots';

      slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `touch-slider__dot ${index === 0 ? 'touch-slider__dot--active' : ''}`;
        dotsContainer.appendChild(dot);
      });

      slider.appendChild(dotsContainer);
    }

    if (showNav && slides.length > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'touch-slider__nav touch-slider__nav--prev';
      prevBtn.innerHTML = '‹';

      const nextBtn = document.createElement('button');
      nextBtn.className = 'touch-slider__nav touch-slider__nav--next';
      nextBtn.innerHTML = '›';

      slider.appendChild(prevBtn);
      slider.appendChild(nextBtn);
    }

    return slider;
  }

  /**
   * ActionSheetスタイル
   */
  getActionSheetStyles() {
    return `
      .action-sheet {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-radius: 12px 12px 0 0;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(100%);
        transition: transform 0.3s ease;
        z-index: 1000;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .action-sheet--visible {
        transform: translateY(0);
      }
      
      .action-sheet__header {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        text-align: center;
        position: relative;
      }
      
      .action-sheet__title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
      
      .action-sheet__close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
      }
      
      .action-sheet__content {
        padding: 16px;
      }
      
      .action-sheet__actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .action-sheet__action {
        padding: 16px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        border-radius: 8px;
        transition: background 0.2s ease;
      }
      
      .action-sheet__action:hover {
        background: #f3f4f6;
      }
      
      .action-sheet__action--destructive {
        color: #dc2626;
      }
    `;
  }

  /**
   * ActionSheetインタラクション設定
   */
  setupActionSheetInteractions(element) {
    const actionSheet = element;
    const closeBtn = actionSheet.querySelector('.action-sheet__close');
    const backdrop = document.createElement('div');
    backdrop.className = 'action-sheet-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    document.body.appendChild(backdrop);

    // アニメーション
    setTimeout(() => {
      actionSheet.classList.add('action-sheet--visible');
      backdrop.style.opacity = '1';
    }, 10);

    // 閉じるボタン
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeActionSheet(actionSheet, backdrop);
      });
    }

    // バックドロップクリック
    backdrop.addEventListener('click', () => {
      this.closeActionSheet(actionSheet, backdrop);
    });

    // アクションクリック
    const actions = actionSheet.querySelectorAll('.action-sheet__action');
    actions.forEach(action => {
      action.addEventListener('click', () => {
        this.closeActionSheet(actionSheet, backdrop);
      });
    });
  }

  /**
   * ユーティリティメソッド
   */
  closeActionSheet(actionSheet, backdrop) {
    actionSheet.classList.remove('action-sheet--visible');
    if (backdrop) {
      backdrop.style.opacity = '0';
    }
    setTimeout(() => {
      actionSheet.remove();
      if (backdrop) {
        backdrop.remove();
      }
    }, 300);
  }

  /**
   * コンポーネント作成メソッド
   */
  create(componentName, options = {}) {
    const component = this.components.get(componentName);
    if (!component) {
      console.error(`Mobile component '${componentName}' not found`);
      return null;
    }

    const element = component.render(options);

    // スタイル注入
    if (component.styles && !document.getElementById(`${componentName}-styles`)) {
      const style = document.createElement('style');
      style.id = `${componentName}-styles`;
      style.textContent = component.styles;
      document.head.appendChild(style);
    }

    // インタラクション設定
    if (component.interactions) {
      component.interactions(element);
    }

    return element;
  }

  /**
   * モバイルモーダルのインタラクション設定
   */
  setupMobileModalInteractions(element) {
    const modal = element;
    const closeBtn = modal.querySelector('.mobile-modal__close');
    const backdrop = modal.querySelector('.mobile-modal');

    // 閉じるボタンのクリック
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeMobileModal(modal);
      });
    }

    // バックドロップのクリック
    if (backdrop) {
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop) {
          this.closeMobileModal(modal);
        }
      });
    }

    // ESCキーでの閉じる
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('mobile-modal--visible')) {
        this.closeMobileModal(modal);
      }
    });
  }

  /**
   * モバイルモーダルを閉じる
   */
  closeMobileModal(modal) {
    modal.classList.remove('mobile-modal--visible');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }

  /**
   * タッチスライダーのインタラクション設定
   */
  setupTouchSliderInteractions(element) {
    const slider = element;
    const track = slider.querySelector('.touch-slider__track');
    const dots = slider.querySelectorAll('.touch-slider__dot');
    const prevBtn = slider.querySelector('.touch-slider__nav--prev');
    const nextBtn = slider.querySelector('.touch-slider__nav--next');

    let currentIndex = 0;
    let startX = 0;
    let isMoving = false;

    // タッチイベント
    track.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      isMoving = false;
    });

    track.addEventListener('touchmove', e => {
      if (!isMoving) {
        return;
      }
      e.preventDefault();
      const moveX = e.touches[0].clientX - startX;
      track.style.transform = `translateX(${-currentIndex * 100 + (moveX / slider.offsetWidth) * 100}%)`;
    });

    track.addEventListener('touchend', e => {
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;

      if (Math.abs(diffX) > 50) {
        if (diffX > 0 && currentIndex < dots.length - 1) {
          currentIndex++;
        } else if (diffX < 0 && currentIndex > 0) {
          currentIndex--;
        }
      }

      this.updateSliderPosition(slider, currentIndex);
      this.updateSliderDots(slider, currentIndex);
    });

    // ドットクリック
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentIndex = index;
        this.updateSliderPosition(slider, currentIndex);
        this.updateSliderDots(slider, currentIndex);
      });
    });

    // ナビゲーションボタン
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex--;
          this.updateSliderPosition(slider, currentIndex);
          this.updateSliderDots(slider, currentIndex);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentIndex < dots.length - 1) {
          currentIndex++;
          this.updateSliderPosition(slider, currentIndex);
          this.updateSliderDots(slider, currentIndex);
        }
      });
    }
  }

  /**
   * スライダーの位置を更新
   */
  updateSliderPosition(slider, index) {
    const track = slider.querySelector('.touch-slider__track');
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  /**
   * スライダーのドットを更新
   */
  updateSliderDots(slider, index) {
    const dots = slider.querySelectorAll('.touch-slider__dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('touch-slider__dot--active', i === index);
    });
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    this.activeComponents = new WeakMap();
    this.components.clear();
  }
}

// グローバルに公開
window.MobileComponentSystem = new MobileComponentSystem();

// 使用例
/*
// モバイルナビゲーション
const nav = window.MobileComponentSystem.create('MobileNavigation', {
  items: [
    { label: 'Home', icon: 'home-icon', href: '/', active: true },
    { label: 'Events', icon: 'event-icon', href: '/events', badge: '3' },
    { label: 'Profile', icon: 'user-icon', href: '/profile' }
  ]
});
document.body.appendChild(nav);

// タッチボタン
const button = window.MobileComponentSystem.create('TouchButton', {
  text: 'Submit',
  variant: 'primary',
  size: 'large',
  icon: 'check-icon',
  haptic: true
});

// スワイプカード
const card = window.MobileComponentSystem.create('SwipeCard', {
  content: '<h3>Swipe me</h3><p>Swipe left for actions</p>',
  actions: [
    { type: 'delete', label: 'Delete', handler: () => console.log('Deleted') },
    { type: 'archive', label: 'Archive', handler: () => console.log('Archived') }
  ]
});

// アクションシート
const actionSheet = window.MobileComponentSystem.create('ActionSheet', {
  title: 'Choose an action',
  actions: [
    { text: 'Edit', handler: () => console.log('Edit') },
    { text: 'Share', handler: () => console.log('Share') },
    { text: 'Delete', destructive: true, handler: () => console.log('Delete') }
  ]
});
*/
