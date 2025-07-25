/**
 * Modal System Controller
 * 統一されたモーダル管理システム
 */

class ModalSystem {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.focusTrap = null;
    this.previousFocus = null;
    this.init();
  }

  init() {
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
      }
    });

    // 背景クリックでモーダルを閉じる
    document.addEventListener('click', e => {
      if (e.target.classList.contains('modal-backdrop')) {
        this.close(this.activeModal);
      }
    });

    // 既存のモーダルを初期化
    this.initExistingModals();
  }

  initExistingModals() {
    document.querySelectorAll('[data-modal]').forEach(element => {
      const modalId = element.dataset.modal;
      this.register(modalId);
    });

    // トリガーの設定
    document.querySelectorAll('[data-modal-trigger]').forEach(trigger => {
      trigger.addEventListener('click', e => {
        e.preventDefault();
        const modalId = trigger.dataset.modalTrigger;
        this.open(modalId);
      });
    });

    // 閉じるボタンの設定
    document.querySelectorAll('[data-modal-close]').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        this.close(this.activeModal);
      });
    });
  }

  /**
   * モーダルを登録
   */
  register(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      if (window.DEBUG_MODE) {
        console.warn(`Modal with id "${modalId}" not found`);
      }
      return;
    }

    const defaultOptions = {
      closeOnBackdrop: true,
      closeOnEsc: true,
      focusTrap: true,
      returnFocus: true,
      onOpen: null,
      onClose: null,
      animated: true
    };

    this.modals.set(modalId, {
      element: modal,
      backdrop: this.createBackdrop(modalId),
      options: { ...defaultOptions, ...options }
    });

    // ARIA属性の設定
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('tabindex', '-1');
  }

  /**
   * バックドロップを作成
   */
  createBackdrop(modalId) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.dataset.modalBackdrop = modalId;
    document.body.appendChild(backdrop);
    return backdrop;
  }

  /**
   * モーダルを開く
   */
  async open(modalId, data = {}) {
    const modalConfig = this.modals.get(modalId);
    if (!modalConfig) {
      if (window.DEBUG_MODE) {
        console.warn(`Modal "${modalId}" is not registered`);
      }
      return;
    }

    // 既に開いているモーダルがある場合は閉じる
    if (this.activeModal) {
      await this.close(this.activeModal);
    }

    const { element: modal, backdrop, options } = modalConfig;

    // 現在のフォーカスを保存
    if (options.returnFocus) {
      this.previousFocus = document.activeElement;
    }

    // データをモーダルに渡す
    if (data && Object.keys(data).length > 0) {
      this.populateModal(modal, data);
    }

    // onOpenコールバック
    if (options.onOpen) {
      options.onOpen(modal, data);
    }

    // ボディのスクロールを無効化
    document.body.style.overflow = 'hidden';

    // モーダルとバックドロップを表示
    backdrop.classList.add('active');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    // アニメーション完了後の処理
    await this.waitForAnimation(modal);

    // フォーカストラップを設定
    if (options.focusTrap) {
      this.setupFocusTrap(modal);
    }

    // 最初のフォーカス可能要素にフォーカス
    const firstFocusable = this.getFocusableElements(modal)[0];
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      modal.focus();
    }

    this.activeModal = modalId;

    // カスタムイベントを発火
    modal.dispatchEvent(new CustomEvent('modal:opened', { detail: data }));
  }

  /**
   * モーダルを閉じる
   */
  async close(modalId) {
    if (!modalId) return;

    const modalConfig = this.modals.get(modalId);
    if (!modalConfig) return;

    const { element: modal, backdrop, options } = modalConfig;

    // onCloseコールバック
    if (options.onClose) {
      const shouldClose = options.onClose(modal);
      if (shouldClose === false) return;
    }

    // モーダルとバックドロップを非表示
    modal.classList.remove('active');
    backdrop.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

    // アニメーション完了後の処理
    await this.waitForAnimation(modal);

    // フォーカストラップを解除
    if (this.focusTrap) {
      this.focusTrap.deactivate();
      this.focusTrap = null;
    }

    // フォーカスを戻す
    if (options.returnFocus && this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }

    // ボディのスクロールを有効化
    document.body.style.overflow = '';

    this.activeModal = null;

    // カスタムイベントを発火
    modal.dispatchEvent(new CustomEvent('modal:closed'));
  }

  /**
   * モーダルにデータを設定
   */
  populateModal(modal, data) {
    Object.entries(data).forEach(([key, value]) => {
      const elements = modal.querySelectorAll(`[data-modal-content="${key}"]`);
      elements.forEach(element => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value = value;
        } else if (element.tagName === 'IMG') {
          element.src = value;
        } else {
          element.textContent = value;
        }
      });
    });
  }

  /**
   * フォーカストラップを設定
   */
  setupFocusTrap(modal) {
    if (typeof focusTrap === 'undefined') {
      // フォーカストラップライブラリが利用できない場合の簡易実装
      this.simpleFocusTrap(modal);
      return;
    }

    this.focusTrap = focusTrap.createFocusTrap(modal, {
      onActivate: () => modal.classList.add('is-active'),
      onDeactivate: () => modal.classList.remove('is-active'),
      clickOutsideDeactivates: false,
      escapeDeactivates: false
    });

    this.focusTrap.activate();
  }

  /**
   * 簡易フォーカストラップ
   */
  simpleFocusTrap(modal) {
    const focusableElements = this.getFocusableElements(modal);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    modal.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  /**
   * フォーカス可能な要素を取得
   */
  getFocusableElements(container) {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    return Array.from(container.querySelectorAll(focusableSelectors.join(','))).filter(element => {
      return element.offsetParent !== null && getComputedStyle(element).visibility !== 'hidden';
    });
  }

  /**
   * アニメーション完了を待つ
   */
  waitForAnimation(element) {
    return new Promise(resolve => {
      const duration = parseFloat(getComputedStyle(element).transitionDuration) * 1000;
      setTimeout(resolve, duration);
    });
  }

  /**
   * 確認ダイアログを表示
   */
  confirm(options) {
    const {
      title = '確認',
      message = '実行してもよろしいですか？',
      confirmText = 'OK',
      cancelText = 'キャンセル',
      type = 'warning'
    } = options;

    return new Promise(resolve => {
      // 確認ダイアログ用のモーダルを動的に作成
      const modalId = 'confirm-modal-' + Date.now();
      const modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal modal--confirm';
      modal.innerHTML = `
        <div class="modal__header">
          <h3 class="modal__title">${title}</h3>
        </div>
        <div class="modal__body">
          <div class="confirm-icon confirm-icon--${type}">
            ${this.getIconForType(type)}
          </div>
          <p>${message}</p>
        </div>
        <div class="modal__footer">
          <button class="btn btn--secondary" data-action="cancel">${cancelText}</button>
          <button class="btn btn--primary" data-action="confirm">${confirmText}</button>
        </div>
      `;

      document.body.appendChild(modal);
      this.register(modalId, {
        onClose: () => {
          modal.remove();
          this.modals.delete(modalId);
        }
      });

      // ボタンのイベントリスナー
      modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        this.close(modalId);
        resolve(true);
      });

      modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        this.close(modalId);
        resolve(false);
      });

      this.open(modalId);
    });
  }

  /**
   * タイプに応じたアイコンを取得
   */
  getIconForType(type) {
    const icons = {
      success: '✓',
      warning: '!',
      error: '✕',
      info: 'i'
    };
    return icons[type] || icons.info;
  }

  /**
   * ローディングモーダルを表示
   */
  showLoading(message = 'Loading...') {
    const modalId = 'loading-modal';
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal modal--loading';
      modal.innerHTML = `
        <div class="modal__body">
          <div class="modal-spinner"></div>
          <p class="mt-md">${message}</p>
        </div>
      `;
      document.body.appendChild(modal);
      this.register(modalId, {
        closeOnBackdrop: false,
        closeOnEsc: false
      });
    }

    this.open(modalId);
  }

  /**
   * ローディングモーダルを非表示
   */
  hideLoading() {
    this.close('loading-modal');
  }

  /**
   * モバイルでのスワイプ操作
   */
  enableSwipeToClose(modal) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handleTouchStart = e => {
      startY = e.touches[0].clientY;
      isDragging = true;
      modal.style.transition = 'none';
    };

    const handleTouchMove = e => {
      if (!isDragging) return;

      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0) {
        modal.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;

      isDragging = false;
      modal.style.transition = '';

      const deltaY = currentY - startY;
      if (deltaY > 100) {
        this.close(this.activeModal);
      } else {
        modal.style.transform = '';
      }
    };

    modal.addEventListener('touchstart', handleTouchStart, { passive: true });
    modal.addEventListener('touchmove', handleTouchMove, { passive: true });
    modal.addEventListener('touchend', handleTouchEnd);
  }
}

// グローバルインスタンスを作成
window.modalSystem = new ModalSystem();

// jQueryライクな便利メソッド
window.openModal = (modalId, data) => window.modalSystem.open(modalId, data);
window.closeModal = modalId => window.modalSystem.close(modalId);
window.confirmModal = options => window.modalSystem.confirm(options);
