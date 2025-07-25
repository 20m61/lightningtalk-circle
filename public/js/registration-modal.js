/**
 * Registration Modal Controller
 * 参加登録用モーダルの管理
 */

(function () {
  'use strict';

  class RegistrationModal {
    constructor() {
      this.modalId = 'registration-modal';
      this.formId = 'registration-form';
      this.init();
    }

    init() {
      this.setupEventListeners();
      this.initializeForm();
    }

    setupEventListeners() {
      // 登録ボタンのクリックイベント
      const registerBtns = document.querySelectorAll('.register-btn, #register-btn');
      registerBtns.forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          this.openModal();
        });
      });

      // モーダルの閉じるボタン
      const modal = document.getElementById(this.modalId);
      if (modal) {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => this.closeModal());
        }

        // 背景クリックで閉じる
        modal.addEventListener('click', e => {
          if (e.target === modal) {
            this.closeModal();
          }
        });
      }

      // フォームのサブミット
      const form = document.getElementById(this.formId);
      if (form) {
        form.addEventListener('submit', e => this.handleSubmit(e));
      }

      // キーボードイベント
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.isModalOpen()) {
          this.closeModal();
        }
      });
    }

    initializeForm() {
      // 参加方法のラジオボタン変更時の処理
      const participationInputs = document.querySelectorAll('input[name="participation"]');
      participationInputs.forEach(input => {
        input.addEventListener('change', e => {
          this.toggleLocationField(e.target.value);
        });
      });
    }

    openModal() {
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // フォーカス管理
        setTimeout(() => {
          const firstInput = modal.querySelector('input:not([type="hidden"])');
          if (firstInput) {
            firstInput.focus();
          }
        }, 100);

        // イベントをディスパッチ
        window.dispatchEvent(
          new CustomEvent('modalOpened', {
            detail: { modalId: this.modalId }
          })
        );
      }
    }

    closeModal() {
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';

        // フォームをリセット
        this.resetForm();

        // イベントをディスパッチ
        window.dispatchEvent(
          new CustomEvent('modalClosed', {
            detail: { modalId: this.modalId }
          })
        );
      }
    }

    isModalOpen() {
      const modal = document.getElementById(this.modalId);
      return modal && modal.style.display === 'flex';
    }

    toggleLocationField(participationType) {
      const locationGroup = document.querySelector('.location-group');
      if (locationGroup) {
        const input = locationGroup.querySelector('input');
        if (participationType === 'venue') {
          locationGroup.style.display = 'block';
          if (input) {
            input.required = true;
          }
        } else {
          locationGroup.style.display = 'none';
          if (input) {
            input.required = false;
          }
        }
      }
    }

    async handleSubmit(e) {
      e.preventDefault();

      const form = e.target;
      const submitBtn = form.querySelector('button[type="submit"]');

      // バリデーション
      if (!this.validateForm(form)) {
        return;
      }

      // ボタンを無効化
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中...';
      }

      // フォームデータを収集
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        // APIエンドポイントへ送信
        const response = await fetch('/api/participants/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
          this.showSuccess('登録が完了しました！確認メールをお送りしました。');
          setTimeout(() => {
            this.closeModal();
          }, 3000);
        } else {
          throw new Error(result.message || '登録に失敗しました');
        }
      } catch (error) {
        console.error('Registration error:', error);
        this.showError(error.message || 'エラーが発生しました。もう一度お試しください。');
      } finally {
        // ボタンを有効化
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '登録する';
        }
      }
    }

    validateForm(form) {
      // HTML5バリデーションを使用
      if (!form.checkValidity()) {
        form.reportValidity();
        return false;
      }

      // カスタムバリデーション
      const email = form.querySelector('input[name="email"]').value;
      if (!this.validateEmail(email)) {
        this.showError('有効なメールアドレスを入力してください');
        return false;
      }

      // プライバシーポリシーの同意確認
      const privacyCheckbox = form.querySelector('input[name="privacy"]');
      if (privacyCheckbox && !privacyCheckbox.checked) {
        this.showError('プライバシーポリシーに同意してください');
        return false;
      }

      return true;
    }

    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }

    showSuccess(message) {
      const successEl = document.getElementById('form-success');
      const errorEl = document.getElementById('form-error');

      if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
      }

      if (errorEl) {
        errorEl.style.display = 'none';
      }
    }

    showError(message) {
      const errorEl = document.getElementById('form-error');
      const successEl = document.getElementById('form-success');

      if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
      }

      if (successEl) {
        successEl.style.display = 'none';
      }
    }

    resetForm() {
      const form = document.getElementById(this.formId);
      if (form) {
        form.reset();
        // 参加方法フィールドをリセット
        this.toggleLocationField('online');
      }

      // メッセージを非表示
      document.getElementById('form-error').style.display = 'none';
      document.getElementById('form-success').style.display = 'none';
    }
  }

  // スタイルを追加
  const style = document.createElement('style');
  style.textContent = `
  .registration-form .form-group {
    margin-bottom: var(--spacing-lg);
  }

  .registration-form .required {
    color: var(--color-error);
    margin-left: 4px;
  }

  .registration-form .checkbox-group {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .registration-form .checkbox-group input[type="checkbox"] {
    margin-top: 4px;
    flex-shrink: 0;
  }

  .registration-form .checkbox-group label {
    flex: 1;
    line-height: 1.5;
  }

  .location-group {
    display: none;
  }

  .form-message {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    display: none;
  }

  .form-message.success {
    background-color: var(--color-success-light);
    color: var(--color-success);
    border: 1px solid var(--color-success);
  }

  .form-message.error {
    background-color: var(--color-error-light);
    color: var(--color-error);
    border: 1px solid var(--color-error);
  }

  /* アクセシビリティ向上 */
  .registration-form input:focus,
  .registration-form select:focus,
  .registration-form textarea:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .registration-form input[aria-invalid="true"],
  .registration-form select[aria-invalid="true"] {
    border-color: var(--color-error);
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .registration-form .form-group {
      margin-bottom: var(--spacing-md);
    }
  }
`;
  document.head.appendChild(style);

  // 初期化
  document.addEventListener('DOMContentLoaded', () => {
    window.registrationModal = new RegistrationModal();
  });
})(); // IIFE終了
