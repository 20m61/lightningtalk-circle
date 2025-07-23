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
    if (!container) return;

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
      const editBtn = card.querySelector('.btn:nth-child(2)');
      const detailBtn = card.querySelector('.btn-primary');

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
          <button class="btn btn-sm btn-outline" ${event.status === 'draft' ? 'disabled' : ''}>参加者</button>
          <button class="btn btn-sm btn-outline">編集</button>
          <button class="btn btn-sm btn-primary">詳細</button>
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
    if (!dateString) return '未定';

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
    // TODO: Implement edit functionality
    console.log('Edit event:', event);
  }

  viewEventDetail(event) {
    // TODO: Implement detail view
    console.log('View event detail:', event);
  }

  showEventMenu(e, event) {
    // TODO: Implement context menu
    console.log('Show menu for event:', event);
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
