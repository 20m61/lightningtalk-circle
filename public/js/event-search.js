/**
 * Event Search Frontend Implementation
 */

class EventSearch {
  constructor() {
    this.searchEndpoint = '/api/events/search';
    this.searchForm = null;
    this.resultsContainer = null;
    this.currentFilters = {
      q: '',
      status: 'all',
      venue: 'all',
      dateFrom: '',
      dateTo: '',
      page: 1,
      perPage: 10,
      sortBy: 'date',
      sortOrder: 'asc'
    };

    this.init();
  }

  init() {
    this.setupSearchForm();
    this.setupEventListeners();
    this.performInitialSearch();
  }

  setupSearchForm() {
    // Create search form if it doesn't exist
    const searchContainer = document.getElementById('event-search-container');
    if (!searchContainer) {
      return;
    }

    searchContainer.innerHTML = `
      <div class="search-form-container">
        <h3>🔍 イベント検索</h3>
        <form id="event-search-form" class="search-form">
          <div class="search-row">
            <input 
              type="text" 
              id="search-query" 
              name="q" 
              placeholder="キーワードで検索..." 
              class="search-input"
              maxlength="200"
            >
            <button type="submit" class="btn search-btn">検索</button>
          </div>
          
          <div class="filter-row">
            <select id="status-filter" name="status" class="filter-select">
              <option value="all">すべてのステータス</option>
              <option value="upcoming">開催予定</option>
              <option value="ongoing">開催中</option>
              <option value="completed">終了</option>
              <option value="cancelled">中止</option>
            </select>
            
            <select id="venue-filter" name="venue" class="filter-select">
              <option value="all">すべての会場</option>
              <option value="online">オンライン</option>
              <option value="offline">オフライン</option>
              <option value="hybrid">ハイブリッド</option>
            </select>
            
            <input 
              type="date" 
              id="date-from" 
              name="dateFrom" 
              class="date-input"
              placeholder="開始日"
            >
            <span class="date-separator">〜</span>
            <input 
              type="date" 
              id="date-to" 
              name="dateTo" 
              class="date-input"
              placeholder="終了日"
            >
          </div>
          
          <div class="sort-row">
            <label>並び替え:</label>
            <select id="sort-by" name="sortBy" class="sort-select">
              <option value="date">開催日</option>
              <option value="createdAt">作成日</option>
              <option value="title">タイトル</option>
            </select>
            <select id="sort-order" name="sortOrder" class="sort-select">
              <option value="asc">昇順</option>
              <option value="desc">降順</option>
            </select>
          </div>
        </form>
      </div>
      
      <div id="search-results" class="search-results">
        <div class="loading">検索中...</div>
      </div>
    `;

    this.searchForm = document.getElementById('event-search-form');
    this.resultsContainer = document.getElementById('search-results');
  }

  setupEventListeners() {
    if (!this.searchForm) {
      return;
    }

    // Form submission
    this.searchForm.addEventListener('submit', e => {
      e.preventDefault();
      this.performSearch();
    });

    // Filter changes
    const filters = ['status-filter', 'venue-filter', 'sort-by', 'sort-order'];
    filters.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.performSearch());
      }
    });

    // Date input changes (with debounce)
    ['date-from', 'date-to'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.performSearch());
      }
    });
  }

  async performSearch(page = 1) {
    // Update current filters
    const formData = new FormData(this.searchForm);
    this.currentFilters = {
      q: formData.get('q') || '',
      status: formData.get('status') || 'all',
      venue: formData.get('venue') || 'all',
      dateFrom: formData.get('dateFrom') || '',
      dateTo: formData.get('dateTo') || '',
      page,
      perPage: 10,
      sortBy: formData.get('sortBy') || 'date',
      sortOrder: formData.get('sortOrder') || 'asc'
    };

    // Show loading state
    this.resultsContainer.innerHTML = '<div class="loading">検索中...</div>';

    try {
      const queryParams = new URLSearchParams();
      Object.entries(this.currentFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${this.searchEndpoint}?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        this.displayResults(data);
      } else {
        this.displayError(data.message || '検索中にエラーが発生しました');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.displayError('ネットワークエラーが発生しました');
    }
  }

  displayResults(data) {
    const { events, pagination, summary } = data;

    let html = `
      <div class="search-summary">
        <p>検索結果: ${pagination.total}件</p>
        <div class="summary-stats">
          <span class="stat">開催予定: ${summary.upcomingEvents}件</span>
          <span class="stat">開催中: ${summary.ongoingEvents}件</span>
          <span class="stat">終了: ${summary.completedEvents}件</span>
          <span class="stat">中止: ${summary.cancelledEvents}件</span>
        </div>
      </div>
    `;

    if (events.length === 0) {
      html += '<div class="no-results">該当するイベントが見つかりませんでした</div>';
    } else {
      html += '<div class="event-list">';
      events.forEach(event => {
        html += this.renderEventCard(event);
      });
      html += '</div>';

      // Pagination
      if (pagination.totalPages > 1) {
        html += this.renderPagination(pagination);
      }
    }

    this.resultsContainer.innerHTML = html;

    // Setup pagination event listeners
    this.setupPaginationListeners();
  }

  renderEventCard(event) {
    const date = new Date(event.date);
    const formattedDate = date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusClass = `status-${event.status}`;
    const statusText = this.getStatusText(event.status);

    const venueType = this.getVenueType(event.venue);
    const venueIcon = this.getVenueIcon(venueType);

    return `
      <div class="event-card">
        <div class="event-header">
          <h4 class="event-title">${this.escapeHtml(event.title)}</h4>
          <span class="event-status ${statusClass}">${statusText}</span>
        </div>
        <div class="event-meta">
          <span class="event-date">📅 ${formattedDate}</span>
          <span class="event-venue">${venueIcon} ${venueType}</span>
        </div>
        <p class="event-description">${this.escapeHtml(event.description)}</p>
        ${
  event.stats
    ? `
          <div class="event-stats">
            <span>👥 参加者: ${event.stats.participantCount}人</span>
            <span>🎤 発表: ${event.stats.talkCount}件</span>
            <span>📍 残り枠: ${event.stats.spotsRemaining}件</span>
          </div>
        `
    : ''
}
        <div class="event-actions">
          <a href="/event/${event.id}" class="btn btn-small">詳細を見る</a>
        </div>
      </div>
    `;
  }

  renderPagination(pagination) {
    const { page, totalPages, hasMore } = pagination;
    let html = '<div class="pagination">';

    // Previous button
    if (page > 1) {
      html += `<button class="page-btn" data-page="${page - 1}">前へ</button>`;
    }

    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    if (startPage > 1) {
      html += '<button class="page-btn" data-page="1">1</button>';
      if (startPage > 2) {
        html += '<span class="page-ellipsis">...</span>';
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === page ? 'active' : '';
      html += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += '<span class="page-ellipsis">...</span>';
      }
      html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next button
    if (hasMore) {
      html += `<button class="page-btn" data-page="${page + 1}">次へ</button>`;
    }

    html += '</div>';
    return html;
  }

  setupPaginationListeners() {
    const pageButtons = document.querySelectorAll('.page-btn');
    pageButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const page = parseInt(e.target.dataset.page);
        this.performSearch(page);
      });
    });
  }

  getStatusText(status) {
    const statusMap = {
      upcoming: '開催予定',
      ongoing: '開催中',
      completed: '終了',
      cancelled: '中止'
    };
    return statusMap[status] || status;
  }

  getVenueType(venue) {
    if (!venue) {
      return '未定';
    }

    const hasOnline = venue.online;
    const hasOffline = venue.address || venue.name;

    if (hasOnline && hasOffline) {
      return 'ハイブリッド';
    }
    if (hasOnline) {
      return 'オンライン';
    }
    if (hasOffline) {
      return 'オフライン';
    }
    return '未定';
  }

  getVenueIcon(venueType) {
    const iconMap = {
      オンライン: '💻',
      オフライン: '🏢',
      ハイブリッド: '🔄',
      未定: '❓'
    };
    return iconMap[venueType] || '📍';
  }

  displayError(message) {
    this.resultsContainer.innerHTML = `
      <div class="error-message">
        <p>⚠️ ${message}</p>
        <button onclick="eventSearch.performSearch()" class="btn">再試行</button>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  performInitialSearch() {
    // Perform an initial search to show upcoming events
    this.performSearch();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.eventSearch = new EventSearch();
  });
} else {
  window.eventSearch = new EventSearch();
}
