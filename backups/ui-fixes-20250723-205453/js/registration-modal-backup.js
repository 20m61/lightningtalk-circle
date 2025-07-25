/**
 * Registration Modal Controller
 * 参加登録用モーダルの管理
 */

class RegistrationModal {
  constructor() {
    this.modalId = 'registration-modal';
    this.formId = 'registration-form';
    this.init();
  }

  init() {
    // モーダルHTMLを動的に生成
    this.createModal();

    // モーダルシステムに登録
    window.modalSystem.register(this.modalId, {
      onOpen: (modal, data) => this.onModalOpen(modal, data),
      onClose: () => this.onModalClose()
    });

    // 登録ボタンのイベントリスナー設定
    this.setupTriggers();

    // フォームの送信イベント設定
    this.setupFormHandlers();
  }

  createModal() {
    const modal = document.createElement('div');
    modal.id = this.modalId;
    modal.className = 'modal modal--form modal--medium';
    modal.innerHTML = `
      <div class="modal__header">
        <h2 class="modal__title">イベント参加登録</h2>
        <button class="modal__close" data-modal-close aria-label="閉じる">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal__body">
        <form id="${this.formId}" class="registration-form">
          <div class="form-group">
            <label for="reg-name">お名前 <span class="required">*</span></label>
            <input 
              type="text" 
              id="reg-name" 
              name="name" 
              required 
              placeholder="山田 太郎"
              autocomplete="name"
            >
          </div>

          <div class="form-group">
            <label for="reg-email">メールアドレス <span class="required">*</span></label>
            <input 
              type="email" 
              id="reg-email" 
              name="email" 
              required 
              placeholder="example@email.com"
              autocomplete="email"
            >
          </div>

          <div class="form-group">
            <label for="reg-attendance">参加形式 <span class="required">*</span></label>
            <select id="reg-attendance" name="attendance" required>
              <option value="">選択してください</option>
              <option value="onsite">会場参加</option>
              <option value="online">オンライン参加</option>
              <option value="hybrid">どちらでも可</option>
            </select>
          </div>

          <div class="form-group">
            <label for="reg-experience">ライトニングトーク経験</label>
            <select id="reg-experience" name="experience">
              <option value="">選択してください</option>
              <option value="none">経験なし</option>
              <option value="1-2">1-2回</option>
              <option value="3-5">3-5回</option>
              <option value="6+">6回以上</option>
            </select>
          </div>

          <div class="form-group">
            <label for="reg-talk-interest">発表希望</label>
            <div class="checkbox-group">
              <input 
                type="checkbox" 
                id="reg-talk-interest" 
                name="talkInterest"
                value="yes"
              >
              <label for="reg-talk-interest">ライトニングトークで発表したい</label>
            </div>
          </div>

          <div class="form-group" id="talk-topic-group" style="display: none;">
            <label for="reg-talk-topic">発表予定のトピック</label>
            <input 
              type="text" 
              id="reg-talk-topic" 
              name="talkTopic" 
              placeholder="例: Reactフックスの活用方法"
            >
          </div>

          <div class="form-group">
            <label for="reg-dietary">食事制限・アレルギー</label>
            <input 
              type="text" 
              id="reg-dietary" 
              name="dietary" 
              placeholder="例: ベジタリアン、卵アレルギー"
            >
          </div>

          <div class="form-group">
            <label for="reg-emergency-contact">緊急連絡先</label>
            <input 
              type="tel" 
              id="reg-emergency-contact" 
              name="emergencyContact" 
              placeholder="090-1234-5678"
              autocomplete="tel"
            >
          </div>

          <div class="form-group">
            <label for="reg-comments">その他コメント</label>
            <textarea 
              id="reg-comments" 
              name="comments" 
              rows="3" 
              placeholder="ご質問やご要望があればお書きください"
            ></textarea>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <input 
                type="checkbox" 
                id="reg-privacy" 
                name="privacy" 
                required
              >
              <label for="reg-privacy">
                <a href="/privacy" target="_blank">プライバシーポリシー</a>に同意します
                <span class="required">*</span>
              </label>
            </div>
          </div>

          <div class="form-error" id="form-error" style="display: none;"></div>
          <div class="form-success" id="form-success" style="display: none;"></div>
        </form>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn btn--secondary" data-modal-close>
          キャンセル
        </button>
        <button type="submit" form="${this.formId}" class="btn btn--primary">
          登録する
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  setupTriggers() {
    // 既存の登録ボタンをモーダルトリガーに変更
    document
      .querySelectorAll('[data-action="register-listener"], [data-action="register"]')
      .forEach(button => {
        button.removeAttribute('data-action');
        button.setAttribute('data-modal-trigger', this.modalId);

        // イベントIDがある場合は保持
        const eventId = button.dataset.eventId;
        if (eventId) {
          button.addEventListener('click', () => {
            this.currentEventId = eventId;
          });
        }
      });
  }

  setupFormHandlers() {
    const form = document.getElementById(this.formId);
    const talkInterestCheckbox = document.getElementById('reg-talk-interest');
    const talkTopicGroup = document.getElementById('talk-topic-group');

    // 発表希望チェックボックスの変更を監視
    talkInterestCheckbox.addEventListener('change', e => {
      talkTopicGroup.style.display = e.target.checked ? 'block' : 'none';
      if (!e.target.checked) {
        document.getElementById('reg-talk-topic').value = '';
      }
    });

    // フォーム送信処理
    form.addEventListener('submit', async e => {
      e.preventDefault();
      await this.handleSubmit(form);
    });
  }

  async handleSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // イベントIDを追加
    if (this.currentEventId) {
      data.eventId = this.currentEventId;
    }

    // エラー/成功メッセージをクリア
    this.clearMessages();

    // ローディング状態
    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '送信中...';

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        this.showSuccess('登録が完了しました！確認メールをお送りしました。');

        // フォームをリセット
        form.reset();

        // 2秒後にモーダルを閉じる
        setTimeout(() => {
          window.modalSystem.close(this.modalId);
        }, 2000);

        // カスタムイベントを発火
        window.dispatchEvent(
          new CustomEvent('registration:completed', {
            detail: { participant: result.participant, eventId: data.eventId }
          })
        );
      } else {
        throw new Error(result.error || '登録に失敗しました');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showError(error.message || 'エラーが発生しました。もう一度お試しください。');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  onModalOpen(modal, data) {
    // モーダルが開かれたときの処理
    if (data.eventId) {
      this.currentEventId = data.eventId;

      // イベント情報を取得して表示
      this.loadEventInfo(data.eventId);
    }

    // 最初の入力フィールドにフォーカス
    setTimeout(() => {
      const firstInput = modal.querySelector('input:not([type="checkbox"])');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  onModalClose() {
    // モーダルが閉じられたときの処理
    this.clearMessages();
    this.currentEventId = null;

    // フォームをリセット
    const form = document.getElementById(this.formId);
    if (form) {
      form.reset();
    }
  }

  async loadEventInfo(eventId) {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const event = await response.json();

        // モーダルタイトルを更新
        const modalTitle = document.querySelector(`#${this.modalId} .modal__title`);
        if (modalTitle) {
          modalTitle.textContent = `「${event.title}」への参加登録`;
        }
      }
    } catch (error) {
      console.error('Failed to load event info:', error);
    }
  }

  showError(message) {
    const errorElement = document.getElementById('form-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // エラー時にモーダルを振動させる
    const modal = document.getElementById(this.modalId);
    modal.classList.add('modal--shake');
    setTimeout(() => {
      modal.classList.remove('modal--shake');
    }, 300);
  }

  showSuccess(message) {
    const successElement = document.getElementById('form-success');
    successElement.textContent = message;
    successElement.style.display = 'block';
  }

  clearMessages() {
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
    gap: var(--spacing-sm);
  }

  .registration-form .checkbox-group input[type="checkbox"] {
    margin-top: 4px;
    width: auto;
    cursor: pointer;
  }

  .registration-form .checkbox-group label {
    margin-bottom: 0;
    cursor: pointer;
    user-select: none;
  }

  .form-error {
    background: rgba(231, 76, 60, 0.1);
    color: var(--color-error);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    margin-top: var(--spacing-md);
  }

  .form-success {
    background: rgba(39, 174, 96, 0.1);
    color: var(--color-success);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    margin-top: var(--spacing-md);
  }
`;
document.head.appendChild(style);

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  window.registrationModal = new RegistrationModal();
});
