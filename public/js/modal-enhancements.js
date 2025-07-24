/**
 * Modal Enhancement System
 * モーダル強化システム - アクセシビリティとUX改善
 */

class ModalEnhancementSystem {
  constructor() {
    this.activeModal = null;
    this.previousFocus = null;
    this.focusableElements =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.isInitialized = false;

    this.init();
  }

  init() {
    if (this.isInitialized) return;

    this.setupEventListeners();
    this.enhanceExistingModals();
    this.isInitialized = true;

    console.log('✅ Modal Enhancement System initialized');
  }

  setupEventListeners() {
    // ESC キーでモーダル閉じる
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.activeModal) {
        this.closeModal(this.activeModal);
      }
    });

    // モーダル外クリックで閉じる（バブリング制御）
    document.addEventListener('click', e => {
      if (this.activeModal && e.target === this.activeModal) {
        this.closeModal(this.activeModal);
      }
    });

    // 既存のモーダル表示監視（初期化時のスタイル設定は無視）
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const modal = mutation.target;
          if (modal.classList.contains('modal') || modal.id.includes('modal')) {
            // display: none が設定されている場合は無視（初期化時など）
            if (modal.style.display === 'none') {
              return;
            }

            const isVisible =
              modal.style.display === 'block' ||
              modal.style.display === 'flex' ||
              (modal.style.display === '' && !modal.style.visibility?.includes('hidden'));

            if (isVisible && this.activeModal !== modal) {
              this.openModal(modal);
            } else if (!isVisible && this.activeModal === modal) {
              this.handleModalClose(modal);
            }
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style', 'class']
    });
  }

  enhanceExistingModals() {
    // 既存のモーダルを強化
    const modals = document.querySelectorAll('.modal, [id*="modal"], [id*="Modal"]');
    modals.forEach(modal => {
      this.enhanceModal(modal);
    });
  }

  enhanceModal(modal) {
    // ARIA属性の追加/強化
    if (!modal.getAttribute('role')) {
      modal.setAttribute('role', 'dialog');
    }
    modal.setAttribute('aria-modal', 'true');

    if (!modal.getAttribute('aria-labelledby')) {
      const heading = modal.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        if (!heading.id) {
          heading.id = `modal-title-${Date.now()}`;
        }
        modal.setAttribute('aria-labelledby', heading.id);
      }
    }

    // 閉じるボタンの強化
    let closeBtn = modal.querySelector('.close, .modal-close, [data-action="close"]');
    if (!closeBtn) {
      // 閉じるボタンが見つからない場合は作成
      closeBtn = this.createCloseButton();
      const modalContent = modal.querySelector('.modal-content, .modal-body');
      if (modalContent) {
        modalContent.appendChild(closeBtn);
      }
    }

    if (closeBtn) {
      closeBtn.setAttribute('aria-label', 'モーダルを閉じる');
      closeBtn.addEventListener('click', e => {
        e.preventDefault();
        this.closeModal(modal);
      });
    }

    // タブ順序の調整
    this.adjustTabOrder(modal);
  }

  createCloseButton() {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'モーダルを閉じる');
    closeBtn.setAttribute('type', 'button');

    // スタイルの適用
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'none',
      border: 'none',
      fontSize: '24px',
      color: '#666',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease'
    });

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.backgroundColor = '#f0f0f0';
      closeBtn.style.color = '#333';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.backgroundColor = 'transparent';
      closeBtn.style.color = '#666';
    });

    return closeBtn;
  }

  adjustTabOrder(modal) {
    // フォーカス可能な要素を取得
    const focusableElements = modal.querySelectorAll(this.focusableElements);

    focusableElements.forEach((element, index) => {
      // 最初と最後の要素にデータ属性を追加
      if (index === 0) {
        element.setAttribute('data-modal-first-focusable', 'true');
      }
      if (index === focusableElements.length - 1) {
        element.setAttribute('data-modal-last-focusable', 'true');
      }
    });
  }

  openModal(modal) {
    // 前のフォーカス要素を保存
    this.previousFocus = document.activeElement;
    this.activeModal = modal;

    // フォーカストラップの設定
    this.trapFocus(modal);

    // 最初のフォーカス可能要素にフォーカス
    const firstFocusable = modal.querySelector(this.focusableElements);
    if (firstFocusable) {
      setTimeout(() => {
        firstFocusable.focus();
      }, 100);
    }

    // アニメーション効果
    this.animateModalOpen(modal);

    // bodyのスクロール無効化
    document.body.style.overflow = 'hidden';

    console.log('🔓 Modal opened with accessibility enhancements');
  }

  closeModal(modal) {
    if (modal !== this.activeModal) return;

    // アニメーション効果
    this.animateModalClose(modal).then(() => {
      // モーダルを隠す
      modal.style.display = 'none';
      modal.style.visibility = 'hidden';
      modal.style.opacity = '0';
    });

    this.handleModalClose(modal);
  }

  handleModalClose(modal) {
    // フォーカス復元
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }

    // アクティブモーダルクリア
    if (this.activeModal === modal) {
      this.activeModal = null;
    }

    // bodyスクロール復元
    document.body.style.overflow = '';

    console.log('🔒 Modal closed and focus restored');
  }

  trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(this.focusableElements);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // 既存のフォーカストラップリスナーを除去
    modal.removeEventListener('keydown', modal._focusTrapListener);

    // 新しいフォーカストラップリスナー
    modal._focusTrapListener = e => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', modal._focusTrapListener);
  }

  animateModalOpen(modal) {
    // 既存の display: block の場合はアニメーション追加
    modal.style.opacity = '0';
    modal.style.visibility = 'visible';
    modal.style.display = 'block';

    const modalContent = modal.querySelector('.modal-content, .modal-dialog, .modal-body');
    if (modalContent) {
      modalContent.style.transform = 'translate(-50%, -50%) scale(0.9)';
      modalContent.style.opacity = '0';
    }

    // アニメーション実行
    requestAnimationFrame(() => {
      modal.style.opacity = '1';

      if (modalContent) {
        modalContent.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        modalContent.style.transform = 'translate(-50%, -50%) scale(1)';
        modalContent.style.opacity = '1';
      }
    });
  }

  animateModalClose(modal) {
    return new Promise(resolve => {
      const modalContent = modal.querySelector('.modal-content, .modal-dialog, .modal-body');

      modal.style.opacity = '0';

      if (modalContent) {
        modalContent.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        modalContent.style.transform = 'translate(-50%, -50%) scale(0.9)';
        modalContent.style.opacity = '0';
      }

      setTimeout(resolve, 300);
    });
  }

  // 外部API用メソッド
  enhance(modalElement) {
    this.enhanceModal(modalElement);
  }

  open(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (modal) {
      modal.style.display = 'block';
      this.openModal(modal);
    }
  }

  close(modalId) {
    const modal =
      typeof modalId === 'string' ? document.getElementById(modalId) : modalId || this.activeModal;
    if (modal) {
      this.closeModal(modal);
    }
  }

  isOpen() {
    return this.activeModal !== null;
  }

  getActiveModal() {
    return this.activeModal;
  }
}

// グローバルインスタンス作成
window.ModalEnhancementSystem = new ModalEnhancementSystem();

// 既存システムとの互換性
window.ModalEnhancer = window.ModalEnhancementSystem;
