/**
 * Admin Interactions Enhancement
 * 管理画面のインタラクション改善
 */

class AdminInteractions {
  constructor() {
    this.init();
  }

  init() {
    this.enhanceEventCards();
    this.setupKeyboardShortcuts();
    this.addLoadingStates();
    this.setupTooltips();
    this.improveFormValidation();
  }

  // イベントカードのインタラクション強化
  enhanceEventCards() {
    // カードのホバーエフェクト強化
    document.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.admin-event-card');
      if (card) {
        this.addCardHoverEffect(card);
      }
    });

    // ダブルクリックで編集
    document.addEventListener('dblclick', (e) => {
      const card = e.target.closest('.admin-event-card');
      if (card) {
        const editBtn = card.querySelector('[data-action="edit"]');
        if (editBtn) editBtn.click();
      }
    });

    // スワイプ操作（モバイル）
    if ('ontouchstart' in window) {
      this.setupSwipeActions();
    }
  }

  // カードホバーエフェクト
  addCardHoverEffect(card) {
    if (!card.dataset.enhanced) {
      card.dataset.enhanced = 'true';
      
      // アクションボタンの表示アニメーション
      const actions = card.querySelector('.admin-event-card__actions');
      if (actions) {
        actions.style.transition = 'opacity 0.3s ease';
      }
    }
  }

  // キーボードショートカット
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + N: 新規作成
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const createBtn = document.querySelector('.admin-create-btn');
        if (createBtn) createBtn.click();
      }

      // Ctrl/Cmd + S: 保存（モーダル内）
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const modal = document.querySelector('.admin-modal');
        if (modal && modal.style.display !== 'none') {
          e.preventDefault();
          const saveBtn = modal.querySelector('.btn-primary');
          if (saveBtn) saveBtn.click();
        }
      }

      // ESC: モーダルを閉じる
      if (e.key === 'Escape') {
        const modal = document.querySelector('.admin-modal');
        if (modal && modal.style.display !== 'none') {
          const closeBtn = modal.querySelector('.admin-modal__close');
          if (closeBtn) closeBtn.click();
        }
      }

      // /: 検索フォーカス
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const searchInput = document.querySelector('.admin-search__input');
        if (searchInput && document.activeElement !== searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    });
  }

  // ローディング状態の改善
  addLoadingStates() {
    // ボタンのローディング状態
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn');
      if (btn && !btn.disabled) {
        const originalText = btn.textContent;
        const isSmall = btn.classList.contains('btn-sm');
        
        // データ操作系のボタンのみ
        if (btn.dataset.action || btn.type === 'submit') {
          btn.disabled = true;
          btn.innerHTML = `
            <span class="loading-spinner ${isSmall ? 'loading-spinner--sm' : ''}"></span>
            ${isSmall ? '' : '処理中...'}
          `;
          
          // 元に戻すための処理
          setTimeout(() => {
            if (btn.disabled) {
              btn.disabled = false;
              btn.textContent = originalText;
            }
          }, 3000);
        }
      }
    });

    // スタイルを追加
    this.addLoadingStyles();
  }

  // ローディングスタイルを追加
  addLoadingStyles() {
    if (!document.getElementById('admin-interaction-styles')) {
      const style = document.createElement('style');
      style.id = 'admin-interaction-styles';
      style.textContent = `
        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }
        
        .loading-spinner--sm {
          width: 12px;
          height: 12px;
          margin-right: 4px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .btn:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        
        /* ツールチップ */
        .tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1000;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .tooltip.show {
          opacity: 1;
        }
        
        /* フォームバリデーション */
        .form-input-error {
          border-color: #dc2626 !important;
          animation: shake 0.3s;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .form-error-message {
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 0.25rem;
          display: none;
        }
        
        .form-error-message.show {
          display: block;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ツールチップの設定
  setupTooltips() {
    const tooltips = [
      { selector: '.admin-create-btn', text: '新規イベント作成 (Ctrl+N)' },
      { selector: '.admin-search__input', text: '検索 (/)' },
      { selector: '.admin-event-menu', text: 'その他のオプション' },
      { selector: '.btn[data-action="edit"]', text: '編集（ダブルクリックでも可）' },
      { selector: '.btn[data-action="delete"]', text: '削除' }
    ];

    tooltips.forEach(({ selector, text }) => {
      document.querySelectorAll(selector).forEach(el => {
        let tooltip = null;

        el.addEventListener('mouseenter', () => {
          tooltip = this.showTooltip(el, text);
        });

        el.addEventListener('mouseleave', () => {
          if (tooltip) {
            tooltip.classList.remove('show');
            setTimeout(() => tooltip.remove(), 200);
          }
        });
      });
    });
  }

  // ツールチップ表示
  showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.bottom + 8 + 'px';

    setTimeout(() => tooltip.classList.add('show'), 10);
    return tooltip;
  }

  // フォームバリデーションの改善
  improveFormValidation() {
    document.addEventListener('input', (e) => {
      const input = e.target;
      if (input.classList.contains('admin-form__input') || 
          input.classList.contains('admin-form__textarea')) {
        this.validateField(input);
      }
    });

    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.classList.contains('admin-form')) {
        const isValid = this.validateForm(form);
        if (!isValid) {
          e.preventDefault();
        }
      }
    });
  }

  // フィールドバリデーション
  validateField(field) {
    let isValid = true;
    let errorMessage = '';

    // 必須チェック
    if (field.required && !field.value.trim()) {
      isValid = false;
      errorMessage = 'この項目は必須です';
    }

    // メールチェック
    if (field.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        isValid = false;
        errorMessage = '有効なメールアドレスを入力してください';
      }
    }

    // 日付チェック
    if (field.type === 'datetime-local' && field.value) {
      const date = new Date(field.value);
      if (date < new Date()) {
        isValid = false;
        errorMessage = '過去の日時は選択できません';
      }
    }

    // エラー表示
    this.showFieldError(field, isValid, errorMessage);
    return isValid;
  }

  // フィールドエラー表示
  showFieldError(field, isValid, message) {
    const wrapper = field.closest('.admin-form__group');
    if (!wrapper) return;

    let errorEl = wrapper.querySelector('.form-error-message');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'form-error-message';
      wrapper.appendChild(errorEl);
    }

    if (!isValid) {
      field.classList.add('form-input-error');
      errorEl.textContent = message;
      errorEl.classList.add('show');
    } else {
      field.classList.remove('form-input-error');
      errorEl.classList.remove('show');
    }
  }

  // フォーム全体のバリデーション
  validateForm(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    let isValid = true;

    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  // スワイプアクション（モバイル）
  setupSwipeActions() {
    let startX = 0;
    let currentCard = null;

    document.addEventListener('touchstart', (e) => {
      const card = e.target.closest('.admin-event-card');
      if (card) {
        startX = e.touches[0].clientX;
        currentCard = card;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (!currentCard) return;
      
      const currentX = e.touches[0].clientX;
      const diff = startX - currentX;
      
      if (Math.abs(diff) > 50) {
        e.preventDefault();
        currentCard.style.transform = `translateX(${-diff}px)`;
      }
    });

    document.addEventListener('touchend', (e) => {
      if (!currentCard) return;
      
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      
      if (diff > 100) {
        // 左スワイプ - アクション表示
        currentCard.classList.add('show-actions');
      } else {
        currentCard.style.transform = '';
      }
      
      currentCard = null;
    });
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  new AdminInteractions();
});