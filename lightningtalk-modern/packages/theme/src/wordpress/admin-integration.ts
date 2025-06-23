/**
 * WordPress Admin Integration Module
 * WordPress管理画面との統合機能
 */

/**
 * WordPress管理画面統合の設定
 */
export function setupAdminIntegration(): void {
  // WordPress管理画面特有のスタイル調整
  setupAdminStyles();
  
  // 管理画面用のアクセシビリティ機能
  setupAdminAccessibility();
  
  // WordPress標準UIコンポーネントとの統合
  setupWordPressUIIntegration();
  
  // 管理画面のパフォーマンス最適化
  setupAdminPerformanceOptimizations();
  
  // エラートラッキング
  setupAdminErrorTracking();
}

/**
 * 管理画面用スタイル調整
 */
function setupAdminStyles(): void {
  // WordPress管理画面のカラースキームに合わせた調整
  const adminColorScheme = getAdminColorScheme();
  if (adminColorScheme) {
    document.documentElement.setAttribute('data-admin-color-scheme', adminColorScheme);
    applyAdminColorScheme(adminColorScheme);
  }

  // 管理画面のレイアウトに合わせたスタイル調整
  adjustAdminLayout();
  
  // ダークモード対応
  setupAdminDarkModeSupport();
}

/**
 * 管理画面カラースキームの取得
 */
function getAdminColorScheme(): string | null {
  // WordPressの管理画面カラースキームを取得
  const bodyClasses = document.body.classList;
  const colorSchemes = ['fresh', 'light', 'blue', 'coffee', 'ectoplasm', 'midnight', 'ocean', 'sunrise'];
  
  for (const scheme of colorSchemes) {
    if (bodyClasses.contains(`admin-color-${scheme}`)) {
      return scheme;
    }
  }
  
  return 'fresh'; // デフォルト
}

/**
 * 管理画面カラースキームの適用
 */
function applyAdminColorScheme(scheme: string): void {
  const colorSchemes: Record<string, any> = {
    fresh: {
      primary: '#0073aa',
      secondary: '#005177',
      accent: '#00a0d2'
    },
    light: {
      primary: '#04a4cc',
      secondary: '#037089',
      accent: '#05b9dc'
    },
    blue: {
      primary: '#096484',
      secondary: '#07526c',
      accent: '#0c7ca7'
    },
    coffee: {
      primary: '#46403c',
      secondary: '#383330',
      accent: '#59524c'
    },
    ectoplasm: {
      primary: '#523f6d',
      secondary: '#46365d',
      accent: '#65527f'
    },
    midnight: {
      primary: '#e14d43',
      secondary: '#dd382d',
      accent: '#e65054'
    },
    ocean: {
      primary: '#627c83',
      secondary: '#576e74',
      accent: '#738e96'
    },
    sunrise: {
      primary: '#dd823b',
      secondary: '#d97426',
      accent: '#e08f4e'
    }
  };

  const colors = colorSchemes[scheme];
  if (colors) {
    document.documentElement.style.setProperty('--wp-admin-theme-color', colors.primary);
    document.documentElement.style.setProperty('--wp-admin-theme-color-darker', colors.secondary);
    document.documentElement.style.setProperty('--wp-admin-accent-color', colors.accent);
  }
}

/**
 * 管理画面レイアウト調整
 */
function adjustAdminLayout(): void {
  // 管理画面のサイドバー状態を監視
  const body = document.body;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const isFolded = body.classList.contains('folded');
        const isMobile = body.classList.contains('mobile');
        
        document.documentElement.setAttribute('data-admin-menu-folded', String(isFolded));
        document.documentElement.setAttribute('data-admin-mobile', String(isMobile));
      }
    });
  });

  observer.observe(body, { attributes: true });

  // 初期状態の設定
  document.documentElement.setAttribute('data-admin-menu-folded', String(body.classList.contains('folded')));
  document.documentElement.setAttribute('data-admin-mobile', String(body.classList.contains('mobile')));
}

/**
 * 管理画面ダークモード対応
 */
function setupAdminDarkModeSupport(): void {
  // ユーザーの設定またはシステム設定を確認
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const userPreference = localStorage.getItem('lightningtalk-admin-dark-mode');
  
  let isDarkMode = false;
  if (userPreference !== null) {
    isDarkMode = userPreference === 'true';
  } else {
    isDarkMode = prefersDark;
  }

  if (isDarkMode) {
    document.documentElement.setAttribute('data-admin-dark-mode', 'true');
  }

  // ダークモード切り替えボタンの追加
  addDarkModeToggle();
}

/**
 * ダークモード切り替えボタンの追加
 */
function addDarkModeToggle(): void {
  const adminBar = document.getElementById('wpadminbar');
  if (adminBar) {
    const toggleButton = document.createElement('div');
    toggleButton.id = 'lightningtalk-dark-mode-toggle';
    toggleButton.innerHTML = `
      <a href="#" class="ab-item" title="ダークモード切り替え">
        <span class="ab-icon dashicons dashicons-visibility" aria-hidden="true"></span>
        <span class="screen-reader-text">ダークモード切り替え</span>
      </a>
    `;

    toggleButton.addEventListener('click', (e) => {
      e.preventDefault();
      const isDark = document.documentElement.getAttribute('data-admin-dark-mode') === 'true';
      const newMode = !isDark;
      
      document.documentElement.setAttribute('data-admin-dark-mode', String(newMode));
      localStorage.setItem('lightningtalk-admin-dark-mode', String(newMode));
    });

    const adminBarRight = adminBar.querySelector('#wp-admin-bar-top-secondary');
    if (adminBarRight) {
      adminBarRight.appendChild(toggleButton);
    }
  }
}

/**
 * 管理画面アクセシビリティ機能
 */
function setupAdminAccessibility(): void {
  // フォーカス管理の強化
  enhanceFocusManagement();
  
  // スクリーンリーダー対応
  enhanceScreenReaderSupport();
  
  // キーボードナビゲーション
  enhanceKeyboardNavigation();
}

/**
 * フォーカス管理の強化
 */
function enhanceFocusManagement(): void {
  // モーダルやドロップダウンのフォーカストラップ
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // アクティブなモーダルを閉じる
      const activeModal = document.querySelector('.lightningtalk-modal:not([style*="display: none"])');
      if (activeModal) {
        const closeButton = activeModal.querySelector('.modal-close') as HTMLElement;
        closeButton?.click();
      }
    }
  });

  // フォーカス可能要素の検出と管理
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  document.addEventListener('focusin', (e) => {
    const target = e.target as Element;
    if (target.matches('.lightningtalk-component *')) {
      // Lightning Talk コンポーネント内でのフォーカス
      target.classList.add('lt-focused');
    }
  });

  document.addEventListener('focusout', (e) => {
    const target = e.target as Element;
    target.classList.remove('lt-focused');
  });
}

/**
 * スクリーンリーダー対応の強化
 */
function enhanceScreenReaderSupport(): void {
  // 動的コンテンツの変更をアナウンス
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'screen-reader-text';
  announcer.id = 'lightningtalk-announcer';
  document.body.appendChild(announcer);

  // グローバルアナウンス関数
  (window as any).lightningTalkAnnounce = (message: string) => {
    announcer.textContent = message;
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  };

  // 状態変更のアナウンス
  document.addEventListener('lightningtalk:state-change', (event: CustomEvent) => {
    if (event.detail.announcement) {
      (window as any).lightningTalkAnnounce(event.detail.announcement);
    }
  });
}

/**
 * キーボードナビゲーションの強化
 */
function enhanceKeyboardNavigation(): void {
  // カスタムキーボードショートカット
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: 検索フォーカス
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('#adminmenu .wp-filter-search') as HTMLElement;
      searchInput?.focus();
    }

    // Alt + M: メインメニューにフォーカス
    if (e.altKey && e.key === 'm') {
      e.preventDefault();
      const mainMenu = document.querySelector('#adminmenu a') as HTMLElement;
      mainMenu?.focus();
    }

    // Alt + C: コンテンツエリアにフォーカス
    if (e.altKey && e.key === 'c') {
      e.preventDefault();
      const content = document.querySelector('#wpbody-content') as HTMLElement;
      content?.focus();
    }
  });
}

/**
 * WordPress標準UIコンポーネントとの統合
 */
function setupWordPressUIIntegration(): void {
  // WordPress標準のモーダル、ドロップダウンとの連携
  integrateWithWordPressModals();
  
  // WordPress標準のテーブルとの統合
  integrateWithWordPressTables();
  
  // WordPress標準のフォームとの統合
  integrateWithWordPressForms();
}

/**
 * WordPressモーダルとの統合
 */
function integrateWithWordPressModals(): void {
  // thickbox（WordPress標準モーダル）との統合
  if (typeof (window as any).tb_show === 'function') {
    const originalTbShow = (window as any).tb_show;
    (window as any).tb_show = function(caption: string, url: string, imageGroup?: string) {
      // Lightning Talk固有のモーダル処理
      if (url.includes('lightningtalk')) {
        console.log('Lightning Talk modal opened:', caption);
      }
      return originalTbShow.call(this, caption, url, imageGroup);
    };
  }
}

/**
 * WordPressテーブルとの統合
 */
function integrateWithWordPressTables(): void {
  // WP_List_Table との統合
  const listTables = document.querySelectorAll('.wp-list-table');
  listTables.forEach(table => {
    if (table.id.startsWith('lightningtalk')) {
      // Lightning Talk テーブルの機能強化
      enhanceLightningTalkTable(table as HTMLTableElement);
    }
  });
}

/**
 * Lightning Talk テーブルの機能強化
 */
function enhanceLightningTalkTable(table: HTMLTableElement): void {
  // ソート機能の強化
  const sortableHeaders = table.querySelectorAll('th.sortable a, th.sorted a');
  sortableHeaders.forEach(header => {
    header.addEventListener('click', (e) => {
      // AJAX読み込み中のインジケーター
      const th = header.closest('th');
      if (th) {
        th.classList.add('sorting');
        setTimeout(() => th.classList.remove('sorting'), 2000);
      }
    });
  });

  // 行の選択状態管理
  const checkboxes = table.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const row = checkbox.closest('tr');
      if (row) {
        row.classList.toggle('selected', (checkbox as HTMLInputElement).checked);
      }
    });
  });
}

/**
 * WordPressフォームとの統合
 */
function integrateWithWordPressForms(): void {
  // WordPress標準のフォーム検証との統合
  const forms = document.querySelectorAll('form[name*="lightningtalk"]');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      // Lightning Talk固有のフォーム検証
      if (!validateLightningTalkForm(form as HTMLFormElement)) {
        e.preventDefault();
      }
    });
  });
}

/**
 * Lightning Talk フォーム検証
 */
function validateLightningTalkForm(form: HTMLFormElement): boolean {
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    const input = field as HTMLInputElement;
    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;
    } else {
      input.classList.remove('error');
    }
  });

  return isValid;
}

/**
 * 管理画面パフォーマンス最適化
 */
function setupAdminPerformanceOptimizations(): void {
  // 遅延読み込みの実装
  setupLazyLoading();
  
  // 無限スクロールの実装
  setupInfiniteScroll();
  
  // キャッシュ管理
  setupAdminCaching();
}

/**
 * 遅延読み込みの実装
 */
function setupLazyLoading(): void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement;
        if (target.dataset.lazyLoad) {
          loadLazyContent(target);
          observer.unobserve(target);
        }
      }
    });
  });

  document.querySelectorAll('[data-lazy-load]').forEach(element => {
    observer.observe(element);
  });
}

/**
 * 遅延コンテンツの読み込み
 */
function loadLazyContent(element: HTMLElement): void {
  const url = element.dataset.lazyLoad;
  if (url) {
    fetch(url)
      .then(response => response.text())
      .then(html => {
        element.innerHTML = html;
        element.removeAttribute('data-lazy-load');
      })
      .catch(error => {
        console.error('Lazy loading failed:', error);
        element.innerHTML = '<p>コンテンツの読み込みに失敗しました</p>';
      });
  }
}

/**
 * 無限スクロールの実装
 */
function setupInfiniteScroll(): void {
  const infiniteScrollContainers = document.querySelectorAll('[data-infinite-scroll]');
  
  infiniteScrollContainers.forEach(container => {
    let loading = false;
    let page = 1;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !loading) {
          loading = true;
          loadMoreContent(container as HTMLElement, ++page).finally(() => {
            loading = false;
          });
        }
      });
    });
    
    const sentinel = container.querySelector('.infinite-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }
  });
}

/**
 * 追加コンテンツの読み込み
 */
async function loadMoreContent(container: HTMLElement, page: number): Promise<void> {
  const baseUrl = container.dataset.infiniteScroll;
  if (!baseUrl) return;
  
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('page', page.toString());
    
    const response = await fetch(url.toString());
    const html = await response.text();
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const newItems = tempDiv.querySelectorAll('.infinite-scroll-item');
    newItems.forEach(item => {
      container.insertBefore(item, container.querySelector('.infinite-scroll-sentinel'));
    });
    
  } catch (error) {
    console.error('Failed to load more content:', error);
  }
}

/**
 * 管理画面キャッシュ管理
 */
function setupAdminCaching(): void {
  // 簡易的なインメモリキャッシュ
  const cache = new Map();
  
  (window as any).lightningTalkCache = {
    get: (key: string) => cache.get(key),
    set: (key: string, value: any, ttl: number = 300000) => {
      cache.set(key, {
        value,
        expires: Date.now() + ttl
      });
    },
    clear: () => cache.clear(),
    cleanup: () => {
      const now = Date.now();
      for (const [key, item] of cache.entries()) {
        if (item.expires < now) {
          cache.delete(key);
        }
      }
    }
  };
  
  // 定期的なキャッシュクリーンアップ
  setInterval(() => {
    (window as any).lightningTalkCache.cleanup();
  }, 60000); // 1分ごと
}

/**
 * 管理画面エラートラッキング
 */
function setupAdminErrorTracking(): void {
  // JavaScript エラーの監視
  window.addEventListener('error', (event) => {
    console.error('Lightning Talk Admin Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
    
    // エラーレポートの送信（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      sendErrorReport({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }
  });
  
  // Promise rejection の監視
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Lightning Talk Admin Promise Rejection:', event.reason);
    
    if (process.env.NODE_ENV === 'production') {
      sendErrorReport({
        type: 'promise-rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }
  });
}

/**
 * エラーレポートの送信
 */
function sendErrorReport(errorData: any): void {
  const adminData = window.wpLightningTalkAdmin;
  if (adminData?.ajaxUrl) {
    fetch(adminData.ajaxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action: 'lightningtalk_log_admin_error',
        nonce: adminData.nonce,
        error_data: JSON.stringify(errorData)
      })
    }).catch(error => {
      console.error('Failed to send error report:', error);
    });
  }
}