/**
 * Event Detail Modal System
 * イベント詳細モーダルシステム - スクロールなしで全情報表示
 */

class EventModal {
  constructor(options = {}) {
    this.options = {
      animationDuration: 300,
      enableSwipeGestures: true,
      enableKeyboardNav: true,
      compactMobile: true,
      ...options
    };

    this.modal = null;
    this.currentEvent = null;
    this.touchStartY = 0;
    this.touchStartX = 0;

    this.init();
  }

  init() {
    // Create modal structure
    this.createModal();

    // Bind events
    this.bindEvents();

    // Initialize responsive handler
    this.initResponsiveHandler();
  }

  createModal() {
    // Check if modal already exists
    if (document.getElementById('event-detail-modal')) {
      this.modal = document.getElementById('event-detail-modal');
      return;
    }

    // Create modal HTML
    const modalHTML = `
      <div id="event-detail-modal" class="event-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-overlay"></div>
        <div class="modal-container">
          <div class="modal-content">
            <button class="modal-close" aria-label="閉じる">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div class="modal-header">
              <div class="event-status-badge"></div>
              <h2 id="modal-title" class="modal-title"></h2>
              <div class="event-meta">
                <span class="event-date"></span>
                <span class="event-format"></span>
              </div>
            </div>

            <div class="modal-body">
              <!-- タブナビゲーション（モバイル用） -->
              <div class="modal-tabs" role="tablist">
                <button class="tab-button active" role="tab" data-tab="overview" aria-selected="true">概要</button>
                <button class="tab-button" role="tab" data-tab="details" aria-selected="false">詳細</button>
                <button class="tab-button" role="tab" data-tab="participation" aria-selected="false">参加</button>
              </div>

              <!-- コンテンツエリア -->
              <div class="modal-sections">
                <!-- 概要セクション -->
                <section class="modal-section active" id="overview-section" role="tabpanel">
                  <div class="event-overview">
                    <div class="overview-grid">
                      <div class="overview-item">
                        <span class="overview-icon">📅</span>
                        <div class="overview-content">
                          <h4>開催日時</h4>
                          <p class="event-datetime"></p>
                        </div>
                      </div>
                      <div class="overview-item">
                        <span class="overview-icon">📍</span>
                        <div class="overview-content">
                          <h4>会場</h4>
                          <p class="event-venue"></p>
                        </div>
                      </div>
                      <div class="overview-item">
                        <span class="overview-icon">👥</span>
                        <div class="overview-content">
                          <h4>参加者</h4>
                          <p class="event-participants"></p>
                        </div>
                      </div>
                      <div class="overview-item">
                        <span class="overview-icon">🎯</span>
                        <div class="overview-content">
                          <h4>形式</h4>
                          <p class="event-format-detail"></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- 詳細セクション -->
                <section class="modal-section" id="details-section" role="tabpanel">
                  <div class="event-details">
                    <div class="detail-content">
                      <h3>イベント内容</h3>
                      <div class="event-description"></div>
                      
                      <h3>タイムテーブル</h3>
                      <div class="event-schedule"></div>
                      
                      <h3>注意事項</h3>
                      <div class="event-notes"></div>
                    </div>
                  </div>
                </section>

                <!-- 参加セクション -->
                <section class="modal-section" id="participation-section" role="tabpanel">
                  <div class="event-participation">
                    <div class="participation-stats">
                      <div class="stat-item">
                        <span class="stat-number online-count">0</span>
                        <span class="stat-label">オンライン参加</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-number onsite-count">0</span>
                        <span class="stat-label">現地参加</span>
                      </div>
                    </div>
                    
                    <div class="participation-actions">
                      <button class="btn btn-primary btn-lg action-register">
                        <span class="btn-icon">📝</span>
                        参加登録する
                      </button>
                      <button class="btn btn-secondary action-survey">
                        <span class="btn-icon">📊</span>
                        参加意向を回答
                      </button>
                    </div>

                    <div class="contact-info">
                      <h4>お問い合わせ</h4>
                      <p class="event-contact"></p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <!-- フッター（デスクトップ用アクション） -->
            <div class="modal-footer">
              <button class="btn btn-outline action-share">
                <span class="btn-icon">🔗</span>
                共有
              </button>
              <button class="btn btn-outline action-calendar">
                <span class="btn-icon">📅</span>
                カレンダーに追加
              </button>
              <div class="footer-actions">
                <button class="btn btn-primary action-register-footer">参加登録</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('event-detail-modal');
  }

  bindEvents() {
    // Close button
    this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());

    // Overlay click
    this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.close());

    // Tab navigation
    this.modal.querySelectorAll('.tab-button').forEach(tab => {
      tab.addEventListener('click', e => this.switchTab(e.target.dataset.tab));
    });

    // Action buttons
    this.modal.querySelectorAll('.action-register, .action-register-footer').forEach(btn => {
      btn.addEventListener('click', () => this.handleRegistration());
    });

    this.modal.querySelector('.action-survey').addEventListener('click', () => this.handleSurvey());
    this.modal.querySelector('.action-share').addEventListener('click', () => this.handleShare());
    this.modal
      .querySelector('.action-calendar')
      .addEventListener('click', () => this.handleCalendar());

    // Keyboard navigation
    if (this.options.enableKeyboardNav) {
      document.addEventListener('keydown', e => this.handleKeyboard(e));
    }

    // Touch gestures for mobile
    if (this.options.enableSwipeGestures) {
      this.initTouchGestures();
    }

    // Prevent body scroll when modal is open
    this.modal.addEventListener(
      'wheel',
      e => {
        e.preventDefault();
      },
      { passive: false }
    );
  }

  initTouchGestures() {
    const modalContent = this.modal.querySelector('.modal-content');

    modalContent.addEventListener(
      'touchstart',
      e => {
        this.touchStartY = e.touches[0].clientY;
        this.touchStartX = e.touches[0].clientX;
      },
      { passive: true }
    );

    modalContent.addEventListener(
      'touchmove',
      e => {
        if (!this.touchStartY) return;

        const touchEndY = e.touches[0].clientY;
        const touchEndX = e.touches[0].clientX;
        const diffY = this.touchStartY - touchEndY;
        const diffX = this.touchStartX - touchEndX;

        // Swipe down to close (only if at top)
        if (diffY < -50 && Math.abs(diffX) < 50) {
          const scrollTop = modalContent.scrollTop;
          if (scrollTop === 0) {
            this.close();
          }
        }

        // Horizontal swipe to change tabs
        if (Math.abs(diffX) > 50 && Math.abs(diffY) < 30) {
          const tabs = Array.from(this.modal.querySelectorAll('.tab-button'));
          const activeIndex = tabs.findIndex(tab => tab.classList.contains('active'));

          if (diffX > 0 && activeIndex < tabs.length - 1) {
            // Swipe left - next tab
            this.switchTab(tabs[activeIndex + 1].dataset.tab);
          } else if (diffX < 0 && activeIndex > 0) {
            // Swipe right - previous tab
            this.switchTab(tabs[activeIndex - 1].dataset.tab);
          }
        }
      },
      { passive: true }
    );

    modalContent.addEventListener('touchend', () => {
      this.touchStartY = null;
      this.touchStartX = null;
    });
  }

  initResponsiveHandler() {
    // Handle viewport changes
    const handleResize = () => {
      if (this.modal.classList.contains('is-open')) {
        this.adjustModalLayout();
      }
    };

    window.addEventListener('resize', debounce(handleResize, 250));
    window.addEventListener('orientationchange', handleResize);
  }

  adjustModalLayout() {
    const modalContent = this.modal.querySelector('.modal-content');
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // モバイルでコンパクトモード
    if (viewportWidth < 768 && this.options.compactMobile) {
      modalContent.style.maxHeight = `${viewportHeight}px`;
      this.modal.classList.add('compact-mode');

      // タブを表示
      this.modal.querySelector('.modal-tabs').style.display = 'flex';
    } else {
      // デスクトップでは全セクション表示
      modalContent.style.maxHeight = `${Math.min(viewportHeight * 0.9, 800)}px`;
      this.modal.classList.remove('compact-mode');

      // タブを非表示、全セクション表示
      this.modal.querySelector('.modal-tabs').style.display = 'none';
      this.modal.querySelectorAll('.modal-section').forEach(section => {
        section.classList.add('active');
      });
    }
  }

  open(eventData) {
    this.currentEvent = eventData;

    // Populate modal with event data
    this.populateModal(eventData);

    // Adjust layout
    this.adjustModalLayout();

    // Set ARIA attributes
    this.updateARIAAttributes(eventData);

    // Show modal
    this.modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Focus management
    this.modal.querySelector('.modal-close').focus();

    // Announce to screen readers
    this.announceModal('open');

    // Trigger open event
    this.dispatchEvent('eventModalOpen', { event: eventData });
  }

  close() {
    this.modal.classList.add('is-closing');

    // Clear any active timeouts
    this.clearTimeouts();

    setTimeout(() => {
      this.modal.classList.remove('is-open', 'is-closing');
      document.body.style.overflow = '';

      // Reset tabs to first
      this.switchTab('overview');

      // Announce to screen readers
      this.announceModal('close');

      // Trigger close event
      this.dispatchEvent('eventModalClose', { event: this.currentEvent });

      this.currentEvent = null;
    }, this.options.animationDuration);
  }

  populateModal(eventData) {
    // Title and meta
    this.modal.querySelector('.modal-title').textContent = eventData.title || 'イベント詳細';
    this.modal.querySelector('.event-date').textContent = this.formatDate(eventData.date);
    this.modal.querySelector('.event-format').textContent = this.getFormatLabel(eventData.format);

    // Status badge
    const statusBadge = this.modal.querySelector('.event-status-badge');
    statusBadge.className = `event-status-badge status-${eventData.status || 'upcoming'}`;
    statusBadge.textContent = this.getStatusLabel(eventData.status);

    // Overview section
    this.modal.querySelector('.event-datetime').textContent =
      `${this.formatDate(eventData.date)} ${eventData.time || '19:00〜'}`;
    this.modal.querySelector('.event-venue').textContent = eventData.venue || '会場調整中';
    this.modal.querySelector('.event-participants').textContent =
      `${eventData.participants?.total || 0}名 (定員: ${eventData.capacity || '∞'})`;
    this.modal.querySelector('.event-format-detail').textContent = this.getFormatDetail(
      eventData.format
    );

    // Details section
    this.modal.querySelector('.event-description').innerHTML =
      eventData.description || '<p>詳細情報は準備中です。</p>';
    this.modal.querySelector('.event-schedule').innerHTML = this.formatSchedule(eventData.schedule);
    this.modal.querySelector('.event-notes').innerHTML = eventData.notes || '<p>特になし</p>';

    // Participation section
    this.modal.querySelector('.online-count').textContent = eventData.participants?.online || 0;
    this.modal.querySelector('.onsite-count').textContent = eventData.participants?.onsite || 0;
    this.modal.querySelector('.event-contact').innerHTML =
      eventData.contact || '<a href="mailto:info@lightningtalk.example.com">お問い合わせ</a>';

    // Update action buttons based on event status
    this.updateActionButtons(eventData);
  }

  switchTab(tabName) {
    // Update tab buttons
    this.modal.querySelectorAll('.tab-button').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
      tab.setAttribute('aria-selected', tab.dataset.tab === tabName);
    });

    // Update sections
    this.modal.querySelectorAll('.modal-section').forEach(section => {
      const sectionName = section.id.replace('-section', '');
      section.classList.toggle('active', sectionName === tabName);
    });

    // Announce tab change
    this.announceTabChange(tabName);
  }

  handleKeyboard(e) {
    if (!this.modal.classList.contains('is-open')) return;

    switch (e.key) {
      case 'Escape':
        this.close();
        break;
      case 'Tab':
        this.trapFocus(e);
        break;
      case 'Enter':
      case ' ':
        // Handle Enter/Space on tab buttons
        if (e.target.classList.contains('tab-button')) {
          e.preventDefault();
          this.switchTab(e.target.dataset.tab);
        }
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        if (window.innerWidth < 768) {
          this.navigateTabs(e.key === 'ArrowRight' ? 1 : -1);
          e.preventDefault();
        }
        break;
    }
  }

  trapFocus(e) {
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }

  navigateTabs(direction) {
    const tabs = Array.from(this.modal.querySelectorAll('.tab-button'));
    const activeIndex = tabs.findIndex(tab => tab.classList.contains('active'));
    const newIndex = Math.max(0, Math.min(tabs.length - 1, activeIndex + direction));

    if (newIndex !== activeIndex) {
      this.switchTab(tabs[newIndex].dataset.tab);
      tabs[newIndex].focus();
    }
  }

  updateActionButtons(eventData) {
    const registerButtons = this.modal.querySelectorAll(
      '.action-register, .action-register-footer'
    );
    const surveyButton = this.modal.querySelector('.action-survey');

    // Disable registration for past events
    if (eventData.status === 'past') {
      registerButtons.forEach(btn => {
        btn.disabled = true;
        btn.textContent = 'イベント終了';
      });
      surveyButton.disabled = true;
    } else if (eventData.participants?.total >= eventData.capacity) {
      registerButtons.forEach(btn => {
        btn.disabled = true;
        btn.textContent = '満席';
      });
    }
  }

  // Action handlers
  handleRegistration() {
    if (this.currentEvent) {
      // Trigger registration modal or action
      window.dispatchEvent(
        new CustomEvent('openRegistration', {
          detail: { event: this.currentEvent }
        })
      );
      this.close();
    }
  }

  handleSurvey() {
    if (this.currentEvent) {
      // Trigger survey modal or action
      window.dispatchEvent(
        new CustomEvent('openSurvey', {
          detail: { event: this.currentEvent }
        })
      );
    }
  }

  handleShare() {
    if (navigator.share && this.currentEvent) {
      navigator
        .share({
          title: this.currentEvent.title,
          text: `${this.currentEvent.title} - ${this.formatDate(this.currentEvent.date)}`,
          url: window.location.href
        })
        .catch(() => {
          // Fallback to copy link
          this.copyToClipboard(window.location.href);
        });
    } else {
      this.copyToClipboard(window.location.href);
    }
  }

  handleCalendar() {
    if (this.currentEvent) {
      const calendarUrl = this.generateCalendarUrl(this.currentEvent);
      window.open(calendarUrl, '_blank');
    }
  }

  // Utility methods
  formatDate(dateString) {
    if (!dateString) return '日付未定';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('ja-JP', options);
  }

  formatSchedule(schedule) {
    if (!schedule || !Array.isArray(schedule)) {
      return '<p>タイムテーブルは準備中です。</p>';
    }

    return schedule
      .map(
        item => `
      <div class="schedule-item">
        <span class="schedule-time">${item.time}</span>
        <span class="schedule-content">${item.content}</span>
      </div>
    `
      )
      .join('');
  }

  getFormatLabel(format) {
    const formats = {
      onsite: '🏢 現地開催',
      online: '💻 オンライン',
      hybrid: '🔄 ハイブリッド'
    };
    return formats[format] || '📍 形式未定';
  }

  getFormatDetail(format) {
    const details = {
      onsite: '会場での現地開催',
      online: 'オンライン配信のみ',
      hybrid: '現地・オンライン同時開催'
    };
    return details[format] || '開催形式は調整中です';
  }

  getStatusLabel(status) {
    const statuses = {
      upcoming: '開催予定',
      ongoing: '開催中',
      past: '終了',
      cancelled: '中止'
    };
    return statuses[status] || '企画中';
  }

  generateCalendarUrl(event) {
    const startDate = new Date(event.date + ' ' + (event.time || '19:00'));
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours

    const formatDate = date => {
      return date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: event.description || '',
      location: event.venue || 'TBD'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    // Show toast notification
    this.showToast('リンクをコピーしました');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'modal-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  announceModal(action) {
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent =
      action === 'open' ? 'イベント詳細モーダルが開きました' : 'イベント詳細モーダルが閉じました';

    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }

  announceTabChange(tabName) {
    const tabLabels = {
      overview: '概要',
      details: '詳細',
      participation: '参加'
    };

    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = `${tabLabels[tabName]}タブに切り替えました`;

    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }

  updateARIAAttributes(eventData) {
    // Set descriptive attributes
    this.modal.setAttribute('aria-describedby', 'modal-description');

    // Add description element if not exists
    if (!this.modal.querySelector('#modal-description')) {
      const description = document.createElement('div');
      description.id = 'modal-description';
      description.className = 'sr-only';
      this.modal.appendChild(description);
    }

    const descElement = this.modal.querySelector('#modal-description');
    descElement.textContent = `${eventData.title}の詳細情報。${this.getFormatLabel(eventData.format)}で開催。`;

    // Update modal title
    const title = this.modal.querySelector('#modal-title');
    if (title) {
      title.setAttribute('aria-level', '1');
    }

    // Hide non-active sections from screen readers
    this.modal.querySelectorAll('.modal-section').forEach((section, index) => {
      const isActive = section.classList.contains('active');
      section.setAttribute('aria-hidden', !isActive);

      if (isActive) {
        section.setAttribute('tabindex', '0');
      } else {
        section.removeAttribute('tabindex');
      }
    });

    // Update tab attributes
    this.modal.querySelectorAll('.tab-button').forEach((tab, index) => {
      const isSelected = tab.classList.contains('active');
      tab.setAttribute('aria-selected', isSelected);
      tab.setAttribute('aria-controls', `${tab.dataset.tab}-section`);
      tab.setAttribute('aria-expanded', isSelected);
    });
  }

  handleTimeoutWarning(timeoutMs) {
    // Add timeout indicator if long-running operations
    if (timeoutMs > 5000) {
      const indicator = document.createElement('div');
      indicator.className = 'modal-timeout-indicator';
      indicator.setAttribute('aria-label', `処理中 - 約${Math.round(timeoutMs / 1000)}秒`);
      this.modal.appendChild(indicator);

      const timeoutId = setTimeout(() => {
        if (indicator.parentNode) {
          indicator.remove();
        }
        clearTimeout(timeoutId);
      }, timeoutMs);

      // Store timeout ID for potential cleanup
      this.activeTimeouts = this.activeTimeouts || new Set();
      this.activeTimeouts.add(timeoutId);
    }
  }

  clearTimeouts() {
    if (this.activeTimeouts) {
      this.activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      this.activeTimeouts.clear();
    }
  }

  dispatchEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

// Utility function: debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  window.eventModal = new EventModal();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventModal;
}
