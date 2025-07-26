/**
 * Admin Main JavaScript
 * 管理画面のメインJavaScript
 */

class AdminDashboard {
  constructor() {
    this.currentPage = 1;
    this.totalPages = 1;
    this.events = [];
    this.filters = {
      status: '',
      format: '',
      search: ''
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadEvents();
    this.checkAuthentication();
  }

  setupEventListeners() {
    // Create button
    const createBtn = document.querySelector('.admin-create-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateModal());
    }

    // Modal close
    const modalClose = document.querySelector('.admin-modal__close');
    if (modalClose) {
      modalClose.addEventListener('click', () => this.hideModal());
    }

    // Search
    const searchInput = document.querySelector('.admin-search__input');
    const searchBtn = document.querySelector('.admin-search__btn');
    if (searchInput) {
      searchInput.addEventListener('keyup', e => {
        if (e.key === 'Enter') {
          this.handleSearch();
        }
      });
    }
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.handleSearch());
    }

    // Filters
    const statusFilter = document.querySelector('.admin-filter__select');
    if (statusFilter) {
      statusFilter.addEventListener('change', e => {
        this.filters.status = e.target.value;
        this.loadEvents();
      });
    }

    // Pagination
    const prevBtn = document.querySelector('.admin-pagination__btn:first-child');
    const nextBtn = document.querySelector('.admin-pagination__btn:last-child');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.changePage(-1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.changePage(1));
    }

    // Mobile menu toggle
    const navToggle = document.querySelector('.admin-nav__toggle');
    if (navToggle) {
      navToggle.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Form submission
    const eventForm = document.querySelector('.admin-form');
    if (eventForm) {
      eventForm.addEventListener('submit', e => this.handleFormSubmit(e));
    }

    // Logout button
    const logoutBtn = document.querySelector('.admin-user__logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  async checkAuthentication() {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      window.location.href = '/admin-login.html';
      return;
    }

    // For development mode with mock token
    try {
      // Check if it's a mock token (simple string check)
      if (
        token ===
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ImFkbWluLTAwMSIsImVtYWlsIjoiYWRtaW5AbGlnaHRuaW5ndGFsay5sb2NhbCIsIm5hbWUiOiLjgrfjgrnjg4bjg6DnrqHnkIbogIUiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9'
      ) {
        // Mock token detected, allow access
        const userName = document.querySelector('.admin-user__name');
        if (userName) {
          userName.textContent = 'システム管理者';
        }
        return;
      }

      // Try to decode other token formats
      const mockData = JSON.parse(atob(token));
      if (mockData.role === 'admin' && mockData.exp > Date.now()) {
        // Update user name
        const userName = document.querySelector('.admin-user__name');
        if (userName) {
          userName.textContent = mockData.name || '管理者';
        }
        return;
      }
    } catch (e) {
      // Not a mock token, try real API
    }

    // Verify token with API
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      const data = await response.json();
      if (data.role !== 'admin') {
        alert('管理者権限が必要です');
        window.location.href = '/';
      }

      // Update user name
      const userName = document.querySelector('.admin-user__name');
      if (userName) {
        userName.textContent = data.name || '管理者';
      }
    } catch (error) {
      console.error('Authentication error:', error);
      localStorage.removeItem('authToken');
      window.location.href = '/admin-login.html';
    }
  }

  async loadEvents() {
    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        status: this.filters.status,
        search: this.filters.search
      });

      const token = localStorage.getItem('authToken');

      // For development with mock data
      if (
        token ===
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ImFkbWluLTAwMSIsImVtYWlsIjoiYWRtaW5AbGlnaHRuaW5ndGFsay5sb2NhbCIsIm5hbWUiOiLjgrfjgrnjg4bjg6DnrqHnkIbogIUiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9'
      ) {
        // Mock events data for development
        this.events = [
          {
            id: 'event-001',
            title: '第1回 なんでもライトニングトーク',
            date: '2025-06-25T19:00:00+09:00',
            status: 'upcoming',
            capacity: 50,
            participants: [],
            participantCount: 12,
            venue: { name: '新宿会場' },
            createdAt: new Date().toISOString()
          },
          {
            id: 'event-002',
            title: 'AI・機械学習 LT会',
            date: '2025-07-15T19:30:00+09:00',
            status: 'draft',
            capacity: 30,
            participants: [],
            participantCount: 0,
            venue: { name: 'オンライン' },
            createdAt: new Date().toISOString()
          }
        ];
        this.totalPages = 1;
        this.renderEvents();
        this.updatePagination();
        return;
      }

      const response = await fetch(`/api/admin/events?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load events');
      }

      const data = await response.json();
      this.events = data.events;
      this.totalPages = data.totalPages;

      this.renderEvents();
      this.updatePagination();
    } catch (error) {
      console.error('Error loading events:', error);
      this.showError('イベントの読み込みに失敗しました');
    }
  }

  renderEvents() {
    const container = document.querySelector('.admin-events-list');
    if (!container) {return;}

    if (this.events.length === 0) {
      container.innerHTML = this.renderEmptyState();
      return;
    }

    container.innerHTML = this.events.map(event => this.renderEventCard(event)).join('');

    // Add event listeners to cards
    container.querySelectorAll('.admin-event-card').forEach((card, index) => {
      const event = this.events[index];

      // Menu button
      const menuBtn = card.querySelector('.admin-event-menu');
      if (menuBtn) {
        menuBtn.addEventListener('click', e => this.showEventMenu(e, event));
      }

      // Action buttons
      const participantsBtn = card.querySelector('.admin-participants-btn');
      const editBtn = card.querySelector('.admin-edit-btn');
      const detailBtn = card.querySelector('.admin-detail-btn');

      if (participantsBtn && !participantsBtn.disabled) {
        participantsBtn.addEventListener('click', () => this.showParticipantsModal(event));
      }
      if (editBtn) {
        editBtn.addEventListener('click', () => this.editEvent(event));
      }
      if (detailBtn) {
        detailBtn.addEventListener('click', () => this.viewEventDetail(event));
      }
    });
  }

  renderEventCard(event) {
    const statusClass = `admin-event-status--${event.status}`;
    const statusText = this.getStatusText(event.status);
    const formattedDate = this.formatDate(event.date);
    const capacity = event.capacity || '∞';
    const participantCount = event.participants?.length || 0;
    const participationRate =
      capacity !== '∞' ? Math.round((participantCount / capacity) * 100) : '-';

    return `
      <div class="admin-event-card" data-event-id="${event.id}">
        <div class="admin-event-card__header">
          <span class="admin-event-status ${statusClass}">${statusText}</span>
          <button class="admin-event-menu" aria-label="メニュー">⋮</button>
        </div>
        
        <div class="admin-event-card__body">
          <h3 class="admin-event-title">${this.escapeHtml(event.title)}</h3>
          <div class="admin-event-meta">
            <span class="admin-event-date">📅 ${formattedDate}</span>
            <span class="admin-event-location">📍 ${this.escapeHtml(event.location || 'オンライン')}</span>
          </div>
          <div class="admin-event-stats">
            <span class="admin-event-stat">
              <strong>${participantCount}</strong> / ${capacity}名
            </span>
            <span class="admin-event-stat">
              ${event.status === 'draft' ? '未公開' : `参加率 <strong>${participationRate}%</strong>`}
            </span>
          </div>
        </div>
        
        <div class="admin-event-card__actions">
          <button class="btn btn-sm btn-outline admin-participants-btn" ${event.status === 'draft' || participantCount === 0 ? 'disabled' : ''}>参加者</button>
          <button class="btn btn-sm btn-outline admin-edit-btn">編集</button>
          <button class="btn btn-sm btn-primary admin-detail-btn">詳細</button>
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="admin-empty-state">
        <div class="admin-empty-state__icon">📅</div>
        <h3 class="admin-empty-state__title">イベントがありません</h3>
        <p class="admin-empty-state__text">新しいイベントを作成してください</p>
        <button class="btn btn-primary" onclick="adminDashboard.showCreateModal()">
          <span class="btn-icon">+</span>
          イベントを作成
        </button>
      </div>
    `;
  }

  showCreateModal() {
    const modal = document.getElementById('eventFormModal');
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';

      // Reset form
      const form = modal.querySelector('.admin-form');
      if (form) {
        form.reset();
      }
    }
  }

  hideModal() {
    const modal = document.getElementById('eventFormModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  async handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const eventData = {
      title: formData.get('event-title'),
      date: formData.get('event-date'),
      time: formData.get('event-time'),
      format: formData.get('event-format'),
      capacity: parseInt(formData.get('event-capacity')) || null,
      description: formData.get('event-description'),
      status: 'draft'
    };

    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      this.hideModal();
      this.loadEvents();
      this.showSuccess('イベントを作成しました');
    } catch (error) {
      console.error('Error creating event:', error);
      this.showError('イベントの作成に失敗しました');
    }
  }

  handleSearch() {
    const searchInput = document.querySelector('.admin-search__input');
    if (searchInput) {
      this.filters.search = searchInput.value;
      this.currentPage = 1;
      this.loadEvents();
    }
  }

  changePage(direction) {
    const newPage = this.currentPage + direction;
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadEvents();
    }
  }

  updatePagination() {
    const info = document.querySelector('.admin-pagination__info');
    const prevBtn = document.querySelector('.admin-pagination__btn:first-child');
    const nextBtn = document.querySelector('.admin-pagination__btn:last-child');

    if (info) {
      info.textContent = `${this.currentPage} / ${this.totalPages}`;
    }

    if (prevBtn) {
      prevBtn.disabled = this.currentPage === 1;
    }

    if (nextBtn) {
      nextBtn.disabled = this.currentPage === this.totalPages;
    }
  }

  // Utility methods
  getStatusText(status) {
    const statusMap = {
      draft: '下書き',
      published: '公開中',
      upcoming: '開催予定',
      ongoing: '開催中',
      past: '終了'
    };
    return statusMap[status] || status;
  }

  formatDate(dateString) {
    if (!dateString) {return '未定';}

    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    };

    return date.toLocaleDateString('ja-JP', options);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showSuccess(message) {
    // TODO: Implement toast notification
    alert(message);
  }

  showError(message) {
    // TODO: Implement toast notification
    alert(message);
  }

  editEvent(event) {
    this.showEditModal(event);
  }

  viewEventDetail(event) {
    this.showDetailModal(event);
  }

  showEventMenu(e, event) {
    e.stopPropagation();
    this.createContextMenu(e, event);
  }

  showEditModal(event) {
    const modal = this.createModal('イベント編集', this.renderEditForm(event));

    // フォーム送信処理
    const form = modal.querySelector('#editEventForm');
    form.addEventListener('submit', async(e) => {
      e.preventDefault();
      await this.handleEditSubmit(e, event.id);
    });
  }

  showDetailModal(event) {
    const modal = this.createModal('イベント詳細', this.renderDetailView(event));

    // 参加者ボタンのハンドラー
    const participantsBtn = modal.querySelector('.view-participants-btn');
    if (participantsBtn) {
      participantsBtn.addEventListener('click', () => {
        this.closeModal();
        this.showParticipantsModal(event);
      });
    }
  }

  showParticipantsModal(event) {
    const modal = this.createModal(`参加者一覧 - ${event.title}`, this.renderParticipantsList(event));
  }

  createModal(title, content) {
    // 既存のモーダルを削除
    const existingModal = document.querySelector('.admin-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHtml = `
      <div class="admin-modal">
        <div class="admin-modal__backdrop"></div>
        <div class="admin-modal__content">
          <div class="admin-modal__header">
            <h2 class="admin-modal__title">${this.escapeHtml(title)}</h2>
            <button class="admin-modal__close" aria-label="閉じる">&times;</button>
          </div>
          <div class="admin-modal__body">
            ${content}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.querySelector('.admin-modal');
    const closeBtn = modal.querySelector('.admin-modal__close');
    const backdrop = modal.querySelector('.admin-modal__backdrop');

    // 閉じるイベント
    closeBtn.addEventListener('click', () => this.closeModal());
    backdrop.addEventListener('click', () => this.closeModal());

    // アニメーション
    requestAnimationFrame(() => {
      modal.classList.add('admin-modal--open');
    });

    return modal;
  }

  closeModal() {
    const modal = document.querySelector('.admin-modal');
    if (modal) {
      modal.classList.remove('admin-modal--open');
      setTimeout(() => modal.remove(), 300);
    }
  }

  renderEditForm(event) {
    const statusOptions = ['draft', 'published', 'upcoming', 'ongoing', 'past']
      .map(status => `
        <option value="${status}" ${event.status === status ? 'selected' : ''}>
          ${this.getStatusText(status)}
        </option>
      `).join('');

    return `
      <form id="editEventForm" class="admin-form">
        <div class="admin-form__group">
          <label for="editTitle" class="admin-form__label">イベントタイトル</label>
          <input type="text" id="editTitle" name="title" class="admin-form__input" 
                 value="${this.escapeHtml(event.title)}" required>
        </div>

        <div class="admin-form__group">
          <label for="editDate" class="admin-form__label">開催日時</label>
          <input type="datetime-local" id="editDate" name="date" class="admin-form__input" 
                 value="${event.date ? event.date.slice(0, 16) : ''}" required>
        </div>

        <div class="admin-form__group">
          <label for="editLocation" class="admin-form__label">開催場所</label>
          <input type="text" id="editLocation" name="location" class="admin-form__input" 
                 value="${this.escapeHtml(event.location || '')}" placeholder="オンライン">
        </div>

        <div class="admin-form__row">
          <div class="admin-form__group">
            <label for="editCapacity" class="admin-form__label">定員</label>
            <input type="number" id="editCapacity" name="capacity" class="admin-form__input" 
                   value="${event.capacity || ''}" min="1">
          </div>

          <div class="admin-form__group">
            <label for="editStatus" class="admin-form__label">ステータス</label>
            <select id="editStatus" name="status" class="admin-form__select">
              ${statusOptions}
            </select>
          </div>
        </div>

        <div class="admin-form__group">
          <label for="editDescription" class="admin-form__label">説明</label>
          <textarea id="editDescription" name="description" class="admin-form__textarea" rows="4">${this.escapeHtml(event.description || '')}</textarea>
        </div>

        <div class="admin-form__actions">
          <button type="button" class="btn btn-outline" onclick="window.adminDashboard.closeModal()">
            キャンセル
          </button>
          <button type="submit" class="btn btn-primary">
            保存
          </button>
        </div>
      </form>
    `;
  }

  renderDetailView(event) {
    const participantCount = event.participants?.length || 0;
    const capacity = event.capacity || '∞';
    const participationRate = capacity !== '∞' ? Math.round((participantCount / capacity) * 100) : '-';

    return `
      <div class="admin-detail">
        <div class="admin-detail__section">
          <h3 class="admin-detail__subtitle">基本情報</h3>
          <dl class="admin-detail__list">
            <dt>ステータス</dt>
            <dd><span class="admin-event-status admin-event-status--${event.status}">${this.getStatusText(event.status)}</span></dd>
            
            <dt>開催日時</dt>
            <dd>${this.formatDate(event.date)}</dd>
            
            <dt>開催場所</dt>
            <dd>${this.escapeHtml(event.location || 'オンライン')}</dd>
            
            <dt>定員</dt>
            <dd>${capacity}名</dd>
          </dl>
        </div>

        <div class="admin-detail__section">
          <h3 class="admin-detail__subtitle">参加状況</h3>
          <div class="admin-stats">
            <div class="admin-stat-card">
              <div class="admin-stat-value">${participantCount}</div>
              <div class="admin-stat-label">参加者数</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-value">${participationRate}%</div>
              <div class="admin-stat-label">参加率</div>
            </div>
          </div>
          ${participantCount > 0 ? `
            <button class="btn btn-primary view-participants-btn" style="margin-top: 1rem;">
              参加者一覧を表示
            </button>
          ` : ''}
        </div>

        ${event.description ? `
          <div class="admin-detail__section">
            <h3 class="admin-detail__subtitle">説明</h3>
            <p class="admin-detail__description">${this.escapeHtml(event.description)}</p>
          </div>
        ` : ''}

        <div class="admin-detail__section">
          <h3 class="admin-detail__subtitle">管理情報</h3>
          <dl class="admin-detail__list">
            <dt>作成日時</dt>
            <dd>${this.formatDate(event.createdAt)}</dd>
            
            <dt>最終更新</dt>
            <dd>${this.formatDate(event.updatedAt)}</dd>
            
            <dt>イベントID</dt>
            <dd><code>${event.id}</code></dd>
          </dl>
        </div>
      </div>
    `;
  }

  renderParticipantsList(event) {
    const participants = event.participants || [];

    if (participants.length === 0) {
      return '<p class="admin-empty">参加者はまだいません</p>';
    }

    return `
      <div class="admin-participants">
        <div class="admin-participants__summary">
          参加者数: ${participants.length}名 / 定員: ${event.capacity || '∞'}名
        </div>
        <div class="admin-participants__list">
          ${participants.map((p, index) => `
            <div class="admin-participant-card">
              <div class="admin-participant-number">${index + 1}</div>
              <div class="admin-participant-info">
                <div class="admin-participant-name">${this.escapeHtml(p.name)}</div>
                <div class="admin-participant-meta">
                  <span>${this.escapeHtml(p.email)}</span>
                  <span>登録: ${this.formatDate(p.registeredAt)}</span>
                </div>
              </div>
              <div class="admin-participant-type">
                ${p.participationType === 'online' ? 'オンライン' : 'オフライン'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  createContextMenu(e, event) {
    // 既存のメニューを削除
    const existingMenu = document.querySelector('.admin-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const menuHtml = `
      <div class="admin-context-menu" style="top: ${e.clientY}px; left: ${e.clientX}px;">
        <button class="admin-context-menu__item" data-action="edit">
          <span>編集</span>
        </button>
        <button class="admin-context-menu__item" data-action="duplicate">
          <span>複製</span>
        </button>
        <button class="admin-context-menu__item" data-action="view">
          <span>詳細表示</span>
        </button>
        <div class="admin-context-menu__divider"></div>
        <button class="admin-context-menu__item admin-context-menu__item--danger" data-action="delete">
          <span>削除</span>
        </button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', menuHtml);

    const menu = document.querySelector('.admin-context-menu');

    // メニュー項目のクリックハンドラー
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-action]');
      if (!item) {return;}

      const { action } = item.dataset;
      this.handleContextMenuAction(action, event);
      menu.remove();
    });

    // 外側クリックで閉じる
    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
  }

  async handleContextMenuAction(action, event) {
    switch (action) {
    case 'edit':
      this.editEvent(event);
      break;
    case 'duplicate':
      this.duplicateEvent(event);
      break;
    case 'view':
      this.viewEventDetail(event);
      break;
    case 'delete':
      if (confirm(`「${event.title}」を削除しますか？`)) {
        await this.deleteEvent(event.id);
      }
      break;
    }
  }

  async handleEditSubmit(e, eventId) {
    const formData = new FormData(e.target);
    const updates = Object.fromEntries(formData);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      this.showSuccess('イベントを更新しました');
      this.closeModal();
      await this.loadEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      this.showError('更新に失敗しました');
    }
  }

  async duplicateEvent(event) {
    const newEvent = {
      ...event,
      title: `${event.title} (コピー)`,
      status: 'draft',
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined
    };

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEvent)
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate event');
      }

      this.showSuccess('イベントを複製しました');
      await this.loadEvents();
    } catch (error) {
      console.error('Error duplicating event:', error);
      this.showError('複製に失敗しました');
    }
  }

  async deleteEvent(eventId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete event');
      }

      this.showSuccess('イベントを削除しました');
      await this.loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      this.showError(error.message || '削除に失敗しました');
    }
  }

  toggleMobileMenu() {
    // TODO: Implement mobile menu toggle
    console.log('Toggle mobile menu');
  }

  handleLogout() {
    if (confirm('ログアウトしますか？')) {
      localStorage.removeItem('authToken');
      window.location.href = '/admin-login.html';
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.adminDashboard = new AdminDashboard();
});
