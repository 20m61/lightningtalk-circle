/**
 * インタラクション改善スクリプト
 * デバイス別の操作性向上とバグ修正
 */

class InteractionManager {
  constructor() {
    this.device = this.detectDevice();
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.init();
  }

  detectDevice() {
    const width = window.innerWidth;
    if (width >= 1024) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
  }

  init() {
    // デバイス別の初期化
    this.setupCommonInteractions();
    
    switch (this.device) {
      case 'desktop':
        this.setupDesktopInteractions();
        break;
      case 'tablet':
        this.setupTabletInteractions();
        break;
      case 'mobile':
        this.setupMobileInteractions();
        break;
    }

    // リサイズ時の再初期化
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newDevice = this.detectDevice();
        if (newDevice !== this.device) {
          this.device = newDevice;
          this.init();
        }
      }, 250);
    });
  }

  setupCommonInteractions() {
    // フォーカス管理の改善
    this.improveFocusManagement();
    
    // スクロール問題の修正
    this.fixScrollIssues();
    
    // フォーム操作の改善
    this.improveFormInteractions();
    
    // モーダル操作の統一
    this.unifyModalBehavior();
  }

  setupDesktopInteractions() {
    // キーボードショートカットの拡張
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K: 検索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.admin-search__input, .search-input, input[type="search"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      
      // Alt + 1-9: クイックナビゲーション
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        const navItems = document.querySelectorAll('.nav-link, .admin-nav__link');
        if (navItems[index]) {
          navItems[index].click();
        }
      }
    });

    // ツールチップの改善
    this.enhanceTooltips();
    
    // ドラッグ操作の改善
    this.enhanceDragOperations();
  }

  setupTabletInteractions() {
    // タッチ遅延の除去
    this.removeTouchDelay();
    
    // スワイプジェスチャーの追加
    this.addSwipeGestures();
    
    // 画面回転時の調整
    this.handleOrientationChange();
  }

  setupMobileInteractions() {
    // タッチ遅延の除去
    this.removeTouchDelay();
    
    // プルダウンリフレッシュの防止
    this.preventPullToRefresh();
    
    // ボトムナビゲーションの改善
    this.improveBottomNavigation();
    
    // ソフトキーボード対応
    this.handleSoftKeyboard();
  }

  improveFocusManagement() {
    // フォーカストラップの実装
    const trapFocus = (element) => {
      const focusableElements = element.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      element.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      });
    };

    // モーダルが開いたときにフォーカストラップを適用
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.classList && (node.classList.contains('admin-modal') || node.classList.contains('modal'))) {
            trapFocus(node);
            // 最初のフォーカス可能要素にフォーカス
            const firstInput = node.querySelector('input, button');
            if (firstInput) firstInput.focus();
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  fixScrollIssues() {
    // overscroll-behaviorの設定
    document.documentElement.style.overscrollBehavior = 'none';
    
    // モーダル内のスクロール改善
    document.addEventListener('wheel', (e) => {
      const modal = e.target.closest('.admin-modal__body, .modal-body');
      if (modal) {
        const { scrollTop, scrollHeight, clientHeight } = modal;
        const isTop = scrollTop === 0;
        const isBottom = scrollTop + clientHeight >= scrollHeight - 1;
        
        if ((isTop && e.deltaY < 0) || (isBottom && e.deltaY > 0)) {
          e.preventDefault();
        }
      }
    }, { passive: false });
  }

  improveFormInteractions() {
    // オートコンプリートの改善
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      // Enterキーでの送信制御
      form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const target = e.target;
          if (target.tagName === 'TEXTAREA') {
            return; // テキストエリアでは改行を許可
          }
          
          // 次のフィールドへフォーカス
          const inputs = Array.from(form.querySelectorAll('input, select, textarea, button'));
          const currentIndex = inputs.indexOf(target);
          if (currentIndex < inputs.length - 1 && target.tagName !== 'BUTTON') {
            e.preventDefault();
            inputs[currentIndex + 1].focus();
          }
        }
      });
    });

    // リアルタイムバリデーションの改善
    this.improveValidation();
  }

  improveValidation() {
    const inputs = document.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
      let hasInteracted = false;
      
      input.addEventListener('blur', () => {
        hasInteracted = true;
        this.validateField(input);
      });
      
      input.addEventListener('input', () => {
        if (hasInteracted) {
          this.validateField(input);
        }
      });
    });
  }

  validateField(field) {
    const isValid = field.checkValidity();
    field.classList.toggle('error', !isValid && field.value.length > 0);
    field.classList.toggle('success', isValid && field.value.length > 0);
    
    // エラーメッセージの表示
    let errorEl = field.nextElementSibling;
    if (!errorEl || !errorEl.classList.contains('field-error')) {
      errorEl = document.createElement('span');
      errorEl.classList.add('field-error');
      field.parentNode.insertBefore(errorEl, field.nextSibling);
    }
    
    errorEl.textContent = isValid ? '' : field.validationMessage;
    errorEl.style.display = isValid ? 'none' : 'block';
  }

  unifyModalBehavior() {
    // 背景クリックで閉じる
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('admin-modal__backdrop') || 
          e.target.classList.contains('modal-backdrop')) {
        const modal = e.target.closest('.admin-modal, .modal');
        if (modal) {
          modal.classList.remove('admin-modal--open', 'modal--open');
          setTimeout(() => modal.remove(), 300);
        }
      }
    });
  }

  removeTouchDelay() {
    // touch-actionでタップ遅延を除去
    const style = document.createElement('style');
    style.textContent = `
      * {
        touch-action: manipulation;
      }
      .scrollable {
        touch-action: pan-y;
      }
    `;
    document.head.appendChild(style);
  }

  addSwipeGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      
      // 左スワイプでメニューを開く
      if (diff < -50 && touchStartX < 50) {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        if (menuToggle) menuToggle.click();
      }
      
      // 右スワイプでメニューを閉じる
      if (diff > 50) {
        const openMenu = document.querySelector('.mobile-menu--open');
        if (openMenu) {
          openMenu.classList.remove('mobile-menu--open');
        }
      }
    }, { passive: true });
  }

  handleOrientationChange() {
    window.addEventListener('orientationchange', () => {
      // ビューポートの再計算
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // レイアウトの調整
      setTimeout(() => {
        window.scrollTo(0, window.scrollY);
      }, 300);
    });
  }

  preventPullToRefresh() {
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const touchDiff = touchY - touchStartY;
      
      if (window.scrollY === 0 && touchDiff > 0 && e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  improveBottomNavigation() {
    // ビューポートの高さを考慮
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    // スクロール時のナビゲーション表示制御
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    const updateNavVisibility = () => {
      const currentScrollY = window.scrollY;
      const bottomNav = document.querySelector('.bottom-nav, .mobile-bottom-nav');
      
      if (bottomNav) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          bottomNav.style.transform = 'translateY(100%)';
        } else {
          bottomNav.style.transform = 'translateY(0)';
        }
      }
      
      lastScrollY = currentScrollY;
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateNavVisibility);
        ticking = true;
      }
    }, { passive: true });
  }

  handleSoftKeyboard() {
    const inputs = document.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        // フォーカス時にビューポートを調整
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      });
    });
    
    // iOS対策
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      document.addEventListener('focusout', () => {
        window.scrollTo(0, 0);
      });
    }
  }

  enhanceTooltips() {
    const elementsWithTitle = document.querySelectorAll('[title]');
    
    elementsWithTitle.forEach(element => {
      const titleText = element.getAttribute('title');
      element.removeAttribute('title');
      
      let tooltip;
      
      element.addEventListener('mouseenter', () => {
        tooltip = document.createElement('div');
        tooltip.classList.add('custom-tooltip');
        tooltip.textContent = titleText;
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
      });
      
      element.addEventListener('mouseleave', () => {
        if (tooltip) {
          tooltip.remove();
        }
      });
    });
  }

  enhanceDragOperations() {
    // ドラッグ可能な要素の改善
    const draggables = document.querySelectorAll('[draggable="true"]');
    
    draggables.forEach(draggable => {
      draggable.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        draggable.classList.add('dragging');
      });
      
      draggable.addEventListener('dragend', () => {
        draggable.classList.remove('dragging');
      });
    });
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  window.interactionManager = new InteractionManager();
  console.log('[InteractionManager] 初期化完了');
});

// スタイルの追加
const style = document.createElement('style');
style.textContent = `
  /* フィールドバリデーション */
  .field-error {
    color: #dc2626;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    display: none;
  }
  
  input.error, textarea.error {
    border-color: #dc2626 !important;
  }
  
  input.success, textarea.success {
    border-color: #10b981 !important;
  }
  
  /* カスタムツールチップ */
  .custom-tooltip {
    position: fixed;
    background: #1f2937;
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    z-index: 9999;
    pointer-events: none;
    transform: translate(-50%, -100%);
    white-space: nowrap;
    opacity: 0;
    animation: fadeIn 0.2s ease-in-out forwards;
  }
  
  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
  
  /* ドラッグ中のスタイル */
  .dragging {
    opacity: 0.5;
    cursor: move;
  }
  
  /* モバイルビューポート対応 */
  .mobile-viewport {
    min-height: calc(var(--vh, 1vh) * 100);
  }
`;
document.head.appendChild(style);