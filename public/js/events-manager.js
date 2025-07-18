/**
 * Events Manager
 * 複数のイベントを管理し、一覧表示機能を提供
 */

class EventsManager {
  constructor() {
    this.events = [];
    this.currentPage = 1;
    this.eventsPerPage = 6;
    this.totalEvents = 0;
    this.currentView = 'grid';
    this.filters = {
      status: 'all',
      format: 'all',
      date: 'all',
      search: ''
    };

    this.init();
  }

  async init() {
    await this.loadEvents();
    this.setupEventListeners();
    
    // CSSが完全に読み込まれてからレンダリング
    if (document.readyState === 'complete') {
      this.renderHeroEvents();
      this.renderAllEvents();
    } else {
      window.addEventListener('load', () => {
        this.renderHeroEvents();
        this.renderAllEvents();
      });
    }
  }

  async loadEvents() {
    try {
      // APIからイベントを取得
      const apiEndpoint = window.APP_CONFIG?.apiEndpoint || '/api';
      const response = await fetch(`${apiEndpoint}/events`);
      const data = await response.json();

      // モックデータを使用（開発時）
      if (!data.events || data.events.length === 0) {
        this.events = this.getMockEvents();
      } else {
        this.events = data.events;
      }

      this.totalEvents = this.events.length;
      Logger.info('EventsManager', 'Events loaded', { count: this.totalEvents });
    } catch (error) {
      Logger.error('EventsManager', 'Failed to load events', error);
      this.events = this.getMockEvents();
      this.totalEvents = this.events.length;
    }
  }

  getMockEvents() {
    return [
      {
        id: '2025-07-15',
        title: '第1回 なんでもライトニングトーク',
        date: '2025-07-15T19:00:00+09:00',
        endDate: '2025-07-15T22:00:00+09:00',
        location: '新宿某所',
        onlineLink: 'https://meet.google.com/ycp-sdec-xsr',
        format: 'hybrid',
        status: 'upcoming',
        description: '技術、趣味、日常の発見など、なんでもテーマのライトニングトークイベント',
        capacity: 50,
        registeredCount: 23,
        tags: ['初回', '技術', '趣味', 'ハイブリッド'],
        organizer: 'Lightning Talk Circle',
        image: '/images/events/event-1.jpg'
      },
      {
        id: '2025-08-12',
        title: '第2回 なんでもライトニングトーク',
        date: '2025-08-12T19:00:00+09:00',
        endDate: '2025-08-12T22:00:00+09:00',
        location: '渋谷',
        format: 'hybrid',
        status: 'planning',
        description: '第2回目のライトニングトークイベント。さらに充実したコンテンツを予定',
        capacity: 80,
        registeredCount: 0,
        tags: ['第2回', '充実', 'ハイブリッド'],
        organizer: 'Lightning Talk Circle',
        image: '/images/events/event-2.jpg'
      },
      {
        id: '2025-09-20',
        title: '第3回 なんでもライトニングトーク',
        date: '2025-09-20T19:00:00+09:00',
        endDate: '2025-09-20T22:00:00+09:00',
        location: '池袋',
        format: 'onsite',
        status: 'planning',
        description: '現地開催に特化したライトニングトークイベント',
        capacity: 60,
        registeredCount: 0,
        tags: ['第3回', '現地', '池袋'],
        organizer: 'Lightning Talk Circle',
        image: '/images/events/event-3.jpg'
      },
      {
        id: '2025-10-18',
        title: '第4回 なんでもライトニングトーク',
        date: '2025-10-18T19:00:00+09:00',
        endDate: '2025-10-18T22:00:00+09:00',
        location: 'オンライン',
        format: 'online',
        status: 'planning',
        description: '完全オンラインで開催するライトニングトークイベント',
        capacity: 100,
        registeredCount: 0,
        tags: ['第4回', 'オンライン', '完全リモート'],
        organizer: 'Lightning Talk Circle',
        image: '/images/events/event-4.jpg'
      },
      {
        id: '2025-05-10',
        title: '第0回 なんでもライトニングトーク（準備会）',
        date: '2025-05-10T19:00:00+09:00',
        endDate: '2025-05-10T21:00:00+09:00',
        location: '新宿',
        format: 'onsite',
        status: 'past',
        description: '初回開催に向けた準備会',
        capacity: 20,
        registeredCount: 15,
        tags: ['準備会', '第0回', '新宿'],
        organizer: 'Lightning Talk Circle',
        image: '/images/events/event-0.jpg'
      }
    ];
  }

  setupEventListeners() {
    // Hero events filter
    const heroFilterBtns = document.querySelectorAll('.hero-events-filter .filter-btn');
    heroFilterBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        const { filter } = e.target.dataset;
        this.updateHeroFilter(filter);
      });
    });

    // All events filters
    const statusFilter = document.getElementById('status-filter');
    const formatFilter = document.getElementById('format-filter');
    const dateFilter = document.getElementById('date-filter');
    const searchInput = document.getElementById('event-search');
    const searchBtn = document.querySelector('.search-btn');

    if (statusFilter) {
      statusFilter.addEventListener('change', e => {
        this.filters.status = e.target.value;
        this.renderAllEvents();
      });
    }

    if (formatFilter) {
      formatFilter.addEventListener('change', e => {
        this.filters.format = e.target.value;
        this.renderAllEvents();
      });
    }

    if (dateFilter) {
      dateFilter.addEventListener('change', e => {
        this.filters.date = e.target.value;
        this.renderAllEvents();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', e => {
        this.filters.search = e.target.value;
        this.renderAllEvents();
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.renderAllEvents();
      });
    }

    // View toggle
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    viewToggleBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        const { view } = e.target.dataset;
        this.switchView(view);
      });
    });

    // Pagination
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.goToPrevPage();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.goToNextPage();
      });
    }
  }

  updateHeroFilter(filter) {
    const heroFilterBtns = document.querySelectorAll('.hero-events-filter .filter-btn');
    heroFilterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    this.renderHeroEvents(filter);
  }

  renderHeroEvents(filter = 'all') {
    const container = document.getElementById('hero-events-grid');
    if (!container) {
      return;
    }

    let filteredEvents = this.events;

    if (filter !== 'all') {
      filteredEvents = this.events.filter(event => {
        switch (filter) {
          case 'upcoming':
            return event.status === 'upcoming';
          case 'planning':
            return event.status === 'planning';
          case 'past':
            return event.status === 'past';
          default:
            return true;
        }
      });
    }

    // 最新のイベントを最大3つ表示
    const eventsToShow = filteredEvents.slice(0, 3);

    if (eventsToShow.length === 0) {
      container.innerHTML = '<p class="no-events">該当するイベントがありません</p>';
      return;
    }

    container.innerHTML = eventsToShow.map(event => this.createHeroEventCard(event)).join('');
  }

  createHeroEventCard(event) {
    const statusClass = event.status;
    const statusEmoji = this.getStatusEmoji(event.status);
    const formatEmoji = this.getFormatEmoji(event.format);
    const dateFormatted = this.formatDate(event.date);

    return `
      <div class="hero-event-card ${statusClass}">
        <div class="event-status">${statusEmoji} ${this.getStatusText(event.status)}</div>
        <div class="event-title">${event.title}</div>
        <div class="event-date">📅 ${dateFormatted}</div>
        <div class="event-location">${formatEmoji} ${this.getLocationText(event)}</div>
        <div class="event-actions">
          <a href="#event-detail" class="btn btn-primary">詳細を見る</a>
          <button class="btn btn-outline" data-action="register-listener" data-event-id="${event.id}">
            参加登録
          </button>
        </div>
      </div>
    `;
  }

  renderAllEvents() {
    const container = document.getElementById('all-events-container');
    if (!container) {
      return;
    }

    const filteredEvents = this.getFilteredEvents();
    const paginatedEvents = this.getPaginatedEvents(filteredEvents);

    if (paginatedEvents.length === 0) {
      container.innerHTML = '<p class="no-events">該当するイベントがありません</p>';
      return;
    }

    if (this.currentView === 'grid') {
      container.innerHTML = paginatedEvents.map(event => this.createEventCard(event)).join('');
    } else {
      container.innerHTML = paginatedEvents.map(event => this.createEventListItem(event)).join('');
    }

    this.updatePagination(filteredEvents.length);
  }

  getFilteredEvents() {
    return this.events.filter(event => {
      // Status filter
      if (this.filters.status !== 'all' && event.status !== this.filters.status) {
        return false;
      }

      // Format filter
      if (this.filters.format !== 'all' && event.format !== this.filters.format) {
        return false;
      }

      // Date filter
      if (this.filters.date !== 'all') {
        const eventDate = new Date(event.date);
        const eventMonth = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
        if (eventMonth !== this.filters.date) {
          return false;
        }
      }

      // Search filter
      if (this.filters.search.trim() !== '') {
        const searchTerm = this.filters.search.toLowerCase();
        const searchFields = [event.title, event.description, event.location, event.tags.join(' ')]
          .join(' ')
          .toLowerCase();

        if (!searchFields.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  getPaginatedEvents(events) {
    const startIndex = (this.currentPage - 1) * this.eventsPerPage;
    const endIndex = startIndex + this.eventsPerPage;
    return events.slice(startIndex, endIndex);
  }

  createEventCard(event) {
    const statusClass = event.status;
    const statusEmoji = this.getStatusEmoji(event.status);
    const formatEmoji = this.getFormatEmoji(event.format);
    const dateFormatted = this.formatDate(event.date);

    return `
      <div class="event-card ${statusClass}">
        <div class="event-image">
          <img src="${event.image}" alt="${event.title}" onerror="this.src='/images/default-event.jpg'">
          <div class="event-status-badge">${statusEmoji} ${this.getStatusText(event.status)}</div>
        </div>
        <div class="event-content">
          <h3 class="event-title">${event.title}</h3>
          <p class="event-description">${event.description}</p>
          <div class="event-meta">
            <div class="event-date">📅 ${dateFormatted}</div>
            <div class="event-location">${formatEmoji} ${this.getLocationText(event)}</div>
            <div class="event-capacity">👥 ${event.registeredCount}/${event.capacity}名</div>
          </div>
          <div class="event-tags">
            ${event.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <div class="event-actions">
            <button class="btn btn-primary" data-action="view-detail" data-event-id="${event.id}">
              詳細を見る
            </button>
            <button class="btn btn-outline" data-action="register" data-event-id="${event.id}">
              参加登録
            </button>
          </div>
        </div>
      </div>
    `;
  }

  createEventListItem(event) {
    const statusEmoji = this.getStatusEmoji(event.status);
    const formatEmoji = this.getFormatEmoji(event.format);
    const dateFormatted = this.formatDate(event.date);

    return `
      <div class="event-card list-item">
        <div class="event-image">
          <img src="${event.image}" alt="${event.title}" onerror="this.src='/images/default-event.jpg'">
        </div>
        <div class="event-content">
          <div class="event-header">
            <h3 class="event-title">${event.title}</h3>
            <div class="event-status-badge">${statusEmoji} ${this.getStatusText(event.status)}</div>
          </div>
          <p class="event-description">${event.description}</p>
          <div class="event-meta">
            <span class="event-date">📅 ${dateFormatted}</span>
            <span class="event-location">${formatEmoji} ${this.getLocationText(event)}</span>
            <span class="event-capacity">👥 ${event.registeredCount}/${event.capacity}名</span>
          </div>
        </div>
        <div class="event-actions">
          <button class="btn btn-primary" data-action="view-detail" data-event-id="${event.id}">
            詳細を見る
          </button>
          <button class="btn btn-outline" data-action="register" data-event-id="${event.id}">
            参加登録
          </button>
        </div>
      </div>
    `;
  }

  switchView(view) {
    this.currentView = view;

    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    viewToggleBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    const container = document.getElementById('all-events-container');
    if (container) {
      container.className = `events-container ${view}-view`;
    }

    this.renderAllEvents();
  }

  updatePagination(totalFilteredEvents) {
    const totalPages = Math.ceil(totalFilteredEvents / this.eventsPerPage);

    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (currentPageSpan) {
      currentPageSpan.textContent = this.currentPage;
    }
    if (totalPagesSpan) {
      totalPagesSpan.textContent = totalPages;
    }

    if (prevBtn) {
      prevBtn.disabled = this.currentPage <= 1;
    }

    if (nextBtn) {
      nextBtn.disabled = this.currentPage >= totalPages;
    }
  }

  goToPrevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderAllEvents();
    }
  }

  goToNextPage() {
    const filteredEvents = this.getFilteredEvents();
    const totalPages = Math.ceil(filteredEvents.length / this.eventsPerPage);

    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.renderAllEvents();
    }
  }

  // Helper methods
  getStatusEmoji(status) {
    const statusEmojis = {
      upcoming: '🔥',
      ongoing: '🎯',
      past: '✅',
      planning: '📝'
    };
    return statusEmojis[status] || '📅';
  }

  getStatusText(status) {
    const statusTexts = {
      upcoming: '開催間近',
      ongoing: '開催中',
      past: '終了',
      planning: '企画中'
    };
    return statusTexts[status] || '未定';
  }

  getFormatEmoji(format) {
    const formatEmojis = {
      onsite: '🏢',
      online: '💻',
      hybrid: '🌐'
    };
    return formatEmojis[format] || '📍';
  }

  getLocationText(event) {
    if (event.format === 'online') {
      return 'オンライン開催';
    } else if (event.format === 'hybrid') {
      return `${event.location} + オンライン`;
    } else {
      return event.location;
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}年${month}月${day}日（${weekday}） ${hours}:${minutes}〜`;
  }
}

// Initialize Events Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Logger === 'undefined') {
    window.Logger = {
      info: console.log,
      error: console.error,
      warn: console.warn
    };
  }

  window.eventsManager = new EventsManager();
});
