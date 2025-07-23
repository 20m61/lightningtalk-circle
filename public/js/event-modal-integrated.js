/**
 * Event Modal Integration
 * 既存のイベントモーダルを新しいモーダルシステムに統合
 */

class EventModalIntegrated {
  constructor() {
    this.modalId = 'event-detail-modal-new';
    this.init();
  }

  init() {
    // モーダルHTMLを作成
    this.createModal();

    // モーダルシステムに登録
    if (window.modalSystem) {
      window.modalSystem.register(this.modalId, {
        onOpen: (modal, data) => this.onModalOpen(modal, data),
        onClose: () => this.onModalClose(),
        animated: true
      });
    }

    // イベントカードのクリックイベントを設定
    this.setupEventTriggers();
  }

  createModal() {
    const modal = document.createElement('div');
    modal.id = this.modalId;
    modal.className = 'modal modal--large modal--event';
    modal.innerHTML = `
      <div class="modal__header">
        <h2 class="modal__title" id="event-modal-title">イベント詳細</h2>
        <button class="modal__close" data-modal-close aria-label="閉じる">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal__body">
        <!-- イベントヘッダー -->
        <div class="event-modal-header">
          <div class="event-modal-badge" data-field="status">
            <span class="badge badge--upcoming">開催予定</span>
          </div>
          <h1 class="event-modal-title" data-field="title"></h1>
          <p class="event-modal-description" data-field="description"></p>
        </div>

        <!-- イベント基本情報 -->
        <div class="event-modal-info">
          <div class="info-grid">
            <div class="info-item">
              <svg class="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <div>
                <span class="info-label">開催日時</span>
                <span class="info-value" data-field="datetime"></span>
              </div>
            </div>

            <div class="info-item">
              <svg class="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <div>
                <span class="info-label">開催場所</span>
                <span class="info-value" data-field="location"></span>
              </div>
            </div>

            <div class="info-item">
              <svg class="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <div>
                <span class="info-label">参加人数</span>
                <span class="info-value">
                  <span data-field="participants">0</span> / <span data-field="capacity">50</span>名
                </span>
              </div>
            </div>

            <div class="info-item">
              <svg class="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <div>
                <span class="info-label">参加費</span>
                <span class="info-value" data-field="fee">無料</span>
              </div>
            </div>
          </div>
        </div>

        <!-- アジェンダ -->
        <div class="event-modal-section">
          <h3 class="section-title">📋 アジェンダ</h3>
          <div class="agenda-list" data-field="agenda">
            <div class="agenda-item">
              <span class="agenda-time">19:00-19:10</span>
              <span class="agenda-content">開場・受付</span>
            </div>
          </div>
        </div>

        <!-- 対象者 -->
        <div class="event-modal-section">
          <h3 class="section-title">👥 対象者</h3>
          <ul class="target-list" data-field="targetAudience">
            <li>ライトニングトークに興味がある方</li>
          </ul>
        </div>

        <!-- 持ち物 -->
        <div class="event-modal-section">
          <h3 class="section-title">🎒 持ち物</h3>
          <ul class="items-list" data-field="requirements">
            <li>名刺（任意）</li>
          </ul>
        </div>

        <!-- 緊急連絡先 -->
        <div class="event-modal-contact">
          <div class="contact-header">
            <svg class="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>緊急連絡先</span>
          </div>
          <a href="tel:" class="contact-link" data-field="emergencyContact">
            <span data-field="emergencyContactDisplay">-</span>
          </a>
        </div>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn btn--secondary" data-modal-close>
          閉じる
        </button>
        <button type="button" class="btn btn--primary" data-action="register">
          参加登録
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  setupEventTriggers() {
    // イベントカードのクリックを監視
    document.addEventListener('click', e => {
      const eventCard = e.target.closest('.event-card');
      if (eventCard && eventCard.dataset.eventId) {
        e.preventDefault();
        this.showEventDetail(eventCard.dataset.eventId);
      }

      // 詳細ボタンのクリック
      const detailButton = e.target.closest('[data-action="view-details"]');
      if (detailButton && detailButton.dataset.eventId) {
        e.preventDefault();
        this.showEventDetail(detailButton.dataset.eventId);
      }
    });
  }

  async showEventDetail(eventId) {
    try {
      // イベントデータを取得
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) throw new Error('Event not found');

      const event = await response.json();

      // モーダルを開く
      if (window.modalSystem) {
        window.modalSystem.open(this.modalId, event);
      }
    } catch (error) {
      console.error('Failed to load event:', error);
      this.showError('イベント情報の取得に失敗しました');
    }
  }

  onModalOpen(modal, event) {
    if (!event) return;

    // タイトル設定
    this.setFieldValue('title', event.title);
    this.setFieldValue('description', event.description);

    // 日時設定
    const datetime = this.formatDateTime(event.date, event.startTime, event.endTime);
    this.setFieldValue('datetime', datetime);

    // 場所設定
    const location = event.isOnline ? 'オンライン開催' : event.venue || '未定';
    this.setFieldValue('location', location);

    // 参加者数設定
    this.setFieldValue('participants', event.currentParticipants || 0);
    this.setFieldValue('capacity', event.maxParticipants || 50);

    // 参加費設定
    const fee = event.fee ? `${event.fee}円` : '無料';
    this.setFieldValue('fee', fee);

    // ステータス設定
    this.updateStatus(event);

    // アジェンダ設定
    this.updateAgenda(event.agenda);

    // 対象者設定
    this.updateTargetAudience(event.targetAudience);

    // 持ち物設定
    this.updateRequirements(event.requirements);

    // 緊急連絡先設定
    if (event.emergencyContact) {
      this.setFieldValue('emergencyContact', event.emergencyContact);
      this.setFieldValue('emergencyContactDisplay', this.formatPhoneNumber(event.emergencyContact));
      modal.querySelector('[data-field="emergencyContact"]').parentElement.href =
        `tel:${event.emergencyContact}`;
    }

    // 参加登録ボタンの設定
    const registerButton = modal.querySelector('[data-action="register"]');
    if (registerButton) {
      if (event.currentParticipants >= event.maxParticipants) {
        registerButton.textContent = '満席';
        registerButton.disabled = true;
      } else {
        registerButton.onclick = () => this.handleRegistration(event);
      }
    }
  }

  onModalClose() {
    // クリーンアップ処理
  }

  setFieldValue(field, value) {
    const elements = document.querySelectorAll(`#${this.modalId} [data-field="${field}"]`);
    elements.forEach(element => {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = value || '';
      } else {
        element.textContent = value || '';
      }
    });
  }

  formatDateTime(date, startTime, endTime) {
    if (!date) return '未定';

    const dateObj = new Date(date);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    };

    let formatted = dateObj.toLocaleDateString('ja-JP', options);

    if (startTime) {
      formatted += ` ${startTime}`;
      if (endTime) {
        formatted += ` - ${endTime}`;
      }
    }

    return formatted;
  }

  formatPhoneNumber(number) {
    if (!number) return '-';
    // 電話番号のフォーマット (例: 090-1234-5678)
    return number.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }

  updateStatus(event) {
    const statusElement = document.querySelector(`#${this.modalId} [data-field="status"] .badge`);
    if (!statusElement) return;

    const now = new Date();
    const eventDate = new Date(event.date);

    statusElement.classList.remove(
      'badge--upcoming',
      'badge--ongoing',
      'badge--ended',
      'badge--full'
    );

    if (event.currentParticipants >= event.maxParticipants) {
      statusElement.textContent = '満席';
      statusElement.classList.add('badge--full');
    } else if (eventDate < now) {
      statusElement.textContent = '終了';
      statusElement.classList.add('badge--ended');
    } else if (eventDate.toDateString() === now.toDateString()) {
      statusElement.textContent = '本日開催';
      statusElement.classList.add('badge--ongoing');
    } else {
      statusElement.textContent = '開催予定';
      statusElement.classList.add('badge--upcoming');
    }
  }

  updateAgenda(agenda) {
    const container = document.querySelector(`#${this.modalId} [data-field="agenda"]`);
    if (!container) return;

    if (!agenda || agenda.length === 0) {
      container.innerHTML =
        '<div class="agenda-item"><span class="agenda-content">準備中</span></div>';
      return;
    }

    container.innerHTML = agenda
      .map(
        item => `
      <div class="agenda-item">
        ${item.time ? `<span class="agenda-time">${item.time}</span>` : ''}
        <span class="agenda-content">${item.content}</span>
      </div>
    `
      )
      .join('');
  }

  updateTargetAudience(audience) {
    const container = document.querySelector(`#${this.modalId} [data-field="targetAudience"]`);
    if (!container) return;

    if (!audience || audience.length === 0) {
      container.innerHTML = '<li>どなたでも参加可能です</li>';
      return;
    }

    container.innerHTML = audience.map(item => `<li>${item}</li>`).join('');
  }

  updateRequirements(requirements) {
    const container = document.querySelector(`#${this.modalId} [data-field="requirements"]`);
    if (!container) return;

    if (!requirements || requirements.length === 0) {
      container.innerHTML = '<li>特になし</li>';
      return;
    }

    container.innerHTML = requirements.map(item => `<li>${item}</li>`).join('');
  }

  handleRegistration(event) {
    // 参加登録モーダルを開く
    if (window.registrationModal) {
      window.modalSystem.close(this.modalId);
      window.modalSystem.open('registration-modal', { eventId: event.id });
    } else {
      // フォールバック
      window.location.href = `#register?event=${event.id}`;
    }
  }

  showError(message) {
    // エラー表示
    if (window.modalSystem && window.modalSystem.confirm) {
      window.modalSystem.confirm({
        title: 'エラー',
        message: message,
        type: 'error',
        confirmText: 'OK',
        cancelText: null
      });
    } else {
      alert(message);
    }
  }
}

// スタイルを追加
const style = document.createElement('style');
style.textContent = `
  /* イベントモーダル専用スタイル */
  .modal--event .event-modal-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
  }

  .modal--event .event-modal-badge {
    margin-bottom: var(--spacing-md);
  }

  .modal--event .badge {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }

  .modal--event .badge--upcoming {
    background: var(--color-info);
    color: white;
  }

  .modal--event .badge--ongoing {
    background: var(--color-success);
    color: white;
  }

  .modal--event .badge--ended {
    background: var(--color-text-secondary);
    color: white;
  }

  .modal--event .badge--full {
    background: var(--color-warning);
    color: white;
  }

  .modal--event .event-modal-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .modal--event .event-modal-description {
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
  }

  .modal--event .event-modal-info {
    background: var(--color-background-alt);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-xl);
  }

  .modal--event .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
  }

  .modal--event .info-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .modal--event .info-icon {
    flex-shrink: 0;
    color: var(--color-primary);
    margin-top: 2px;
  }

  .modal--event .info-label {
    display: block;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: 2px;
  }

  .modal--event .info-value {
    display: block;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  .modal--event .event-modal-section {
    margin-bottom: var(--spacing-xl);
  }

  .modal--event .section-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
  }

  .modal--event .agenda-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .modal--event .agenda-item {
    display: flex;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--color-border-light);
  }

  .modal--event .agenda-item:last-child {
    border-bottom: none;
  }

  .modal--event .agenda-time {
    flex-shrink: 0;
    font-weight: var(--font-weight-medium);
    color: var(--color-primary);
  }

  .modal--event .agenda-content {
    color: var(--color-text-primary);
  }

  .modal--event .target-list,
  .modal--event .items-list {
    list-style: none;
    padding: 0;
  }

  .modal--event .target-list li,
  .modal--event .items-list li {
    position: relative;
    padding-left: var(--spacing-lg);
    margin-bottom: var(--spacing-sm);
  }

  .modal--event .target-list li::before,
  .modal--event .items-list li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--color-success);
    font-weight: var(--font-weight-bold);
  }

  .modal--event .event-modal-contact {
    background: var(--color-primary-light);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    margin-top: var(--spacing-xl);
  }

  .modal--event .contact-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-primary-dark);
  }

  .modal--event .contact-icon {
    color: var(--color-primary-dark);
  }

  .modal--event .contact-link {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--color-primary-dark);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
  }

  .modal--event .contact-link:hover {
    text-decoration: underline;
  }

  /* モバイル対応 */
  @media (max-width: 768px) {
    .modal--event .info-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }

    .modal--event .event-modal-title {
      font-size: var(--font-size-xl);
    }
  }
`;
document.head.appendChild(style);

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  window.eventModalIntegrated = new EventModalIntegrated();
});
