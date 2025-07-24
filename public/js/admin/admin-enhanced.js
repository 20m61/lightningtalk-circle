/**
 * 管理画面機能拡張
 * イベント管理機能の充実とUI/UX改善
 */

class AdminEnhanced {
  constructor() {
    this.features = {
      bulkActions: false,
      advancedFilters: false,
      exportData: false,
      realTimeUpdates: false,
      analytics: false
    };

    this.selectedEvents = new Set();
    this.sortOptions = {
      field: 'date',
      direction: 'desc'
    };

    this.init();
  }

  init() {
    this.injectEnhancedUI();
    this.setupEnhancedFeatures();
    this.initializeAnalytics();
    console.log('[AdminEnhanced] 機能拡張初期化完了');
  }

  injectEnhancedUI() {
    // 一括操作ツールバー
    const bulkActionsHtml = `
      <div class="admin-bulk-actions" style="display: none;">
        <div class="admin-bulk-actions__container">
          <span class="admin-bulk-actions__count">
            <span class="selected-count">0</span>件選択中
          </span>
          <div class="admin-bulk-actions__buttons">
            <button class="admin-btn admin-btn--small" data-action="publish">
              一括公開
            </button>
            <button class="admin-btn admin-btn--small" data-action="archive">
              一括アーカイブ
            </button>
            <button class="admin-btn admin-btn--small admin-btn--danger" data-action="delete">
              一括削除
            </button>
            <button class="admin-btn admin-btn--small admin-btn--ghost" data-action="cancel">
              選択解除
            </button>
          </div>
        </div>
      </div>
    `;

    // 詳細フィルター
    const advancedFiltersHtml = `
      <div class="admin-advanced-filters" style="display: none;">
        <div class="admin-advanced-filters__grid">
          <div class="admin-filter-group">
            <label>開催期間</label>
            <input type="date" class="admin-input" id="filter-date-from" />
            <span>〜</span>
            <input type="date" class="admin-input" id="filter-date-to" />
          </div>
          <div class="admin-filter-group">
            <label>参加者数</label>
            <input type="number" class="admin-input admin-input--small" id="filter-participants-min" placeholder="最小" min="0" />
            <span>〜</span>
            <input type="number" class="admin-input admin-input--small" id="filter-participants-max" placeholder="最大" min="0" />
          </div>
          <div class="admin-filter-group">
            <label>タグ</label>
            <input type="text" class="admin-input" id="filter-tags" placeholder="カンマ区切りで入力" />
          </div>
          <div class="admin-filter-group">
            <label>開催形式</label>
            <select class="admin-select" id="filter-format">
              <option value="">すべて</option>
              <option value="online">オンライン</option>
              <option value="offline">オフライン</option>
              <option value="hybrid">ハイブリッド</option>
            </select>
          </div>
        </div>
        <div class="admin-advanced-filters__actions">
          <button class="admin-btn admin-btn--primary" id="apply-filters">
            フィルター適用
          </button>
          <button class="admin-btn admin-btn--ghost" id="reset-filters">
            リセット
          </button>
        </div>
      </div>
    `;

    // データエクスポート
    const exportButtonHtml = `
      <div class="admin-export-dropdown">
        <button class="admin-btn admin-btn--icon" id="export-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          エクスポート
        </button>
        <div class="admin-dropdown-menu" style="display: none;">
          <a href="#" data-format="csv">CSVファイル</a>
          <a href="#" data-format="json">JSONファイル</a>
          <a href="#" data-format="pdf">PDFレポート</a>
        </div>
      </div>
    `;

    // UIを適切な場所に挿入
    const actionsBar = document.querySelector('.admin-actions');
    if (actionsBar) {
      actionsBar.insertAdjacentHTML('afterend', bulkActionsHtml);

      const filterSection = document.querySelector('.admin-filters');
      if (filterSection) {
        filterSection.insertAdjacentHTML('afterend', advancedFiltersHtml);
      }

      const createBtn = actionsBar.querySelector('.admin-create-btn');
      if (createBtn) {
        createBtn.insertAdjacentHTML('afterend', exportButtonHtml);
      }
    }

    // 統計ダッシュボード
    this.injectAnalyticsDashboard();
  }

  injectAnalyticsDashboard() {
    const analyticsHtml = `
      <div class="admin-analytics" id="analytics-dashboard" style="display: none;">
        <h3 class="admin-analytics__title">イベント統計</h3>
        <div class="admin-analytics__grid">
          <div class="admin-stat-card">
            <div class="admin-stat-card__icon">📅</div>
            <div class="admin-stat-card__content">
              <div class="admin-stat-card__value" id="total-events">0</div>
              <div class="admin-stat-card__label">総イベント数</div>
            </div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-card__icon">👥</div>
            <div class="admin-stat-card__content">
              <div class="admin-stat-card__value" id="total-participants">0</div>
              <div class="admin-stat-card__label">総参加者数</div>
            </div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-card__icon">⚡</div>
            <div class="admin-stat-card__content">
              <div class="admin-stat-card__value" id="avg-talks">0</div>
              <div class="admin-stat-card__label">平均トーク数</div>
            </div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-card__icon">📈</div>
            <div class="admin-stat-card__content">
              <div class="admin-stat-card__value" id="growth-rate">0%</div>
              <div class="admin-stat-card__label">成長率</div>
            </div>
          </div>
        </div>
        <div class="admin-chart-container">
          <canvas id="participants-chart"></canvas>
        </div>
      </div>
    `;

    const mainContent = document.querySelector('.admin-main');
    if (mainContent) {
      mainContent.insertAdjacentHTML('afterbegin', analyticsHtml);
    }
  }

  setupEnhancedFeatures() {
    // 詳細フィルター表示切り替え
    const filterToggle = document.createElement('button');
    filterToggle.className = 'admin-btn admin-btn--ghost admin-btn--small';
    filterToggle.innerHTML = '詳細フィルター';
    filterToggle.addEventListener('click', () => this.toggleAdvancedFilters());

    const filters = document.querySelector('.admin-filters');
    if (filters) {
      filters.appendChild(filterToggle);
    }

    // 一括選択チェックボックス
    this.addBulkSelectionCheckboxes();

    // エクスポート機能
    this.setupExportFeature();

    // ソート機能
    this.setupSortingFeature();

    // リアルタイム更新
    this.setupRealTimeUpdates();

    // キーボードショートカット
    this.setupKeyboardShortcuts();
  }

  addBulkSelectionCheckboxes() {
    // ヘッダーに全選択チェックボックスを追加
    const eventsHeader = document.querySelector('.admin-events__header');
    if (eventsHeader && !eventsHeader.querySelector('.select-all-checkbox')) {
      const selectAllHtml = `
        <label class="admin-checkbox">
          <input type="checkbox" class="select-all-checkbox" />
          <span class="admin-checkbox__mark"></span>
        </label>
      `;
      eventsHeader.insertAdjacentHTML('afterbegin', selectAllHtml);
    }

    // 各イベントカードにチェックボックスを追加
    const addCheckboxesToCards = () => {
      const eventCards = document.querySelectorAll('.admin-event-card');
      eventCards.forEach(card => {
        if (!card.querySelector('.event-checkbox')) {
          const checkbox = document.createElement('label');
          checkbox.className = 'admin-checkbox event-checkbox';
          checkbox.innerHTML = `
            <input type="checkbox" data-event-id="${card.dataset.eventId}" />
            <span class="admin-checkbox__mark"></span>
          `;
          card.insertAdjacentElement('afterbegin', checkbox);
        }
      });
    };

    // MutationObserverで新しいカードを監視
    const observer = new MutationObserver(addCheckboxesToCards);
    const eventsGrid = document.querySelector('.admin-events__grid');
    if (eventsGrid) {
      observer.observe(eventsGrid, { childList: true, subtree: true });
    }

    addCheckboxesToCards();

    // イベントリスナー設定
    this.setupBulkSelectionListeners();
  }

  setupBulkSelectionListeners() {
    // 全選択チェックボックス
    document.addEventListener('change', e => {
      if (e.target.classList.contains('select-all-checkbox')) {
        const isChecked = e.target.checked;
        document.querySelectorAll('.event-checkbox input').forEach(cb => {
          cb.checked = isChecked;
          this.updateSelectedEvents(cb);
        });
      }

      if (e.target.closest('.event-checkbox')) {
        this.updateSelectedEvents(e.target);
      }
    });

    // 一括操作ボタン
    document.addEventListener('click', e => {
      const action = e.target.dataset.action;
      if (action && e.target.closest('.admin-bulk-actions')) {
        this.handleBulkAction(action);
      }
    });
  }

  updateSelectedEvents(checkbox) {
    const eventId = checkbox.dataset.eventId;
    if (checkbox.checked) {
      this.selectedEvents.add(eventId);
    } else {
      this.selectedEvents.delete(eventId);
    }

    // 一括操作バーの表示/非表示
    const bulkActions = document.querySelector('.admin-bulk-actions');
    const selectedCount = document.querySelector('.selected-count');

    if (bulkActions) {
      bulkActions.style.display = this.selectedEvents.size > 0 ? 'block' : 'none';
      if (selectedCount) {
        selectedCount.textContent = this.selectedEvents.size;
      }
    }
  }

  async handleBulkAction(action) {
    if (this.selectedEvents.size === 0) return;

    const confirmMessages = {
      publish: `${this.selectedEvents.size}件のイベントを公開しますか？`,
      archive: `${this.selectedEvents.size}件のイベントをアーカイブしますか？`,
      delete: `${this.selectedEvents.size}件のイベントを削除しますか？この操作は取り消せません。`,
      cancel: null
    };

    if (action === 'cancel') {
      this.clearSelection();
      return;
    }

    if (confirm(confirmMessages[action])) {
      try {
        // API呼び出し（モック）
        console.log(`Bulk action: ${action}`, Array.from(this.selectedEvents));

        // 成功通知
        this.showNotification(
          `${this.selectedEvents.size}件のイベントを${action === 'publish' ? '公開' : action === 'archive' ? 'アーカイブ' : '削除'}しました`,
          'success'
        );

        // 選択クリア
        this.clearSelection();

        // リロード
        if (window.adminDashboard) {
          window.adminDashboard.loadEvents();
        }
      } catch (error) {
        this.showNotification('操作に失敗しました', 'error');
      }
    }
  }

  clearSelection() {
    this.selectedEvents.clear();
    document.querySelectorAll('.event-checkbox input').forEach(cb => (cb.checked = false));
    document.querySelector('.select-all-checkbox').checked = false;
    document.querySelector('.admin-bulk-actions').style.display = 'none';
  }

  toggleAdvancedFilters() {
    const filters = document.querySelector('.admin-advanced-filters');
    if (filters) {
      const isVisible = filters.style.display !== 'none';
      filters.style.display = isVisible ? 'none' : 'block';
      this.features.advancedFilters = !isVisible;
    }
  }

  setupExportFeature() {
    const exportBtn = document.getElementById('export-button');
    const dropdown = document.querySelector('.admin-dropdown-menu');

    if (exportBtn && dropdown) {
      exportBtn.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      });

      dropdown.addEventListener('click', e => {
        e.preventDefault();
        if (e.target.dataset.format) {
          this.exportData(e.target.dataset.format);
          dropdown.style.display = 'none';
        }
      });

      // クリック外で閉じる
      document.addEventListener('click', () => {
        dropdown.style.display = 'none';
      });
    }
  }

  async exportData(format) {
    try {
      console.log(`Exporting data as ${format}`);

      // データ取得（モック）
      const data = await this.fetchAllEvents();

      switch (format) {
        case 'csv':
          this.downloadCSV(data);
          break;
        case 'json':
          this.downloadJSON(data);
          break;
        case 'pdf':
          this.generatePDFReport(data);
          break;
      }

      this.showNotification(`${format.toUpperCase()}形式でエクスポートしました`, 'success');
    } catch (error) {
      this.showNotification('エクスポートに失敗しました', 'error');
    }
  }

  downloadCSV(data) {
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `events_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  convertToCSV(data) {
    const headers = ['ID', 'タイトル', '日時', '場所', '形式', '参加者数', 'ステータス'];
    const rows = data.map(event => [
      event.id,
      event.title,
      event.date,
      event.location,
      event.format,
      event.participants,
      event.status
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  downloadJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `events_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  }

  generatePDFReport(data) {
    // PDF生成はサーバーサイドで実装が必要
    console.log('PDF generation would require server-side implementation');
    window.open('/api/events/export/pdf', '_blank');
  }

  setupSortingFeature() {
    // カラムヘッダーにソート機能を追加
    const addSortableHeaders = () => {
      const headers = document.querySelectorAll('.admin-events__header th');
      headers.forEach(header => {
        if (!header.querySelector('.sort-indicator')) {
          header.style.cursor = 'pointer';
          header.innerHTML += ' <span class="sort-indicator">⇅</span>';

          header.addEventListener('click', () => {
            const field = header.dataset.sortField || header.textContent.toLowerCase();
            this.sortEvents(field);
          });
        }
      });
    };

    // 既存のテーブルに適用
    addSortableHeaders();
  }

  sortEvents(field) {
    if (this.sortOptions.field === field) {
      this.sortOptions.direction = this.sortOptions.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortOptions.field = field;
      this.sortOptions.direction = 'asc';
    }

    console.log(`Sorting by ${field} ${this.sortOptions.direction}`);

    // ソート実行（実際の実装では adminDashboard.loadEvents() を呼び出し）
    if (window.adminDashboard) {
      window.adminDashboard.loadEvents();
    }
  }

  setupRealTimeUpdates() {
    // WebSocket接続（実装例）
    if ('WebSocket' in window) {
      // this.ws = new WebSocket('wss://dev.xn--6wym69a.com/ws');
      // this.ws.onmessage = (event) => this.handleRealtimeUpdate(event);
    }

    // ポーリングによる更新（フォールバック）
    setInterval(() => {
      if (this.features.realTimeUpdates && window.adminDashboard) {
        window.adminDashboard.loadEvents(true); // silent update
      }
    }, 30000); // 30秒ごと
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      // Ctrl/Cmd + N: 新規作成
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const createBtn = document.querySelector('.admin-create-btn');
        if (createBtn) createBtn.click();
      }

      // Ctrl/Cmd + F: 検索フォーカス
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.admin-search__input');
        if (searchInput) searchInput.focus();
      }

      // Ctrl/Cmd + A: 全選択（イベント一覧表示時）
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && document.querySelector('.admin-events')) {
        e.preventDefault();
        const selectAll = document.querySelector('.select-all-checkbox');
        if (selectAll) {
          selectAll.checked = !selectAll.checked;
          selectAll.dispatchEvent(new Event('change'));
        }
      }

      // ESC: モーダルを閉じる
      if (e.key === 'Escape') {
        const modal = document.querySelector('.admin-modal');
        if (modal && modal.style.display !== 'none') {
          if (window.adminDashboard) {
            window.adminDashboard.hideModal();
          }
        }
      }
    });
  }

  initializeAnalytics() {
    // 統計タブクリック時に表示
    const statsLink = document.querySelector('a[href="#statistics"]');
    if (statsLink) {
      statsLink.addEventListener('click', e => {
        e.preventDefault();
        this.showAnalytics();
      });
    }
  }

  async showAnalytics() {
    const dashboard = document.getElementById('analytics-dashboard');
    const eventsSection = document.querySelector('.admin-events');

    if (dashboard && eventsSection) {
      // セクション切り替え
      eventsSection.style.display = 'none';
      dashboard.style.display = 'block';

      // データ取得と表示
      await this.loadAnalyticsData();
    }
  }

  async loadAnalyticsData() {
    try {
      // API呼び出し（モック）
      const stats = await this.fetchStatistics();

      // 統計カードを更新
      document.getElementById('total-events').textContent = stats.totalEvents || 0;
      document.getElementById('total-participants').textContent = stats.totalParticipants || 0;
      document.getElementById('avg-talks').textContent = stats.avgTalks || 0;
      document.getElementById('growth-rate').textContent = `${stats.growthRate || 0}%`;

      // チャート描画（Chart.jsが必要）
      // this.drawParticipantsChart(stats.monthlyData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }

  async fetchAllEvents() {
    // モックデータ
    return [
      {
        id: 1,
        title: 'Lightning Talk #1',
        date: '2024-01-15',
        location: 'オンライン',
        format: 'online',
        participants: 25,
        status: 'completed'
      },
      {
        id: 2,
        title: 'Lightning Talk #2',
        date: '2024-02-20',
        location: '東京',
        format: 'offline',
        participants: 30,
        status: 'completed'
      }
    ];
  }

  async fetchStatistics() {
    // モック統計データ
    return {
      totalEvents: 15,
      totalParticipants: 450,
      avgTalks: 6,
      growthRate: 25,
      monthlyData: [
        { month: '1月', participants: 25 },
        { month: '2月', participants: 30 },
        { month: '3月', participants: 45 }
      ]
    };
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification--${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // アニメーション
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  window.adminEnhanced = new AdminEnhanced();
  console.log('[AdminEnhanced] 管理画面拡張機能を初期化しました');
});
