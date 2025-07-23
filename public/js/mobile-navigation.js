/**
 * Mobile Navigation Controller
 * モバイルナビゲーションの管理
 */

class MobileNavigation {
  constructor() {
    this.activeTab = 'home';
    this.fabOpen = false;
    this.init();
  }

  init() {
    // ボトムナビゲーションを作成
    this.createBottomNavigation();

    // FABを作成
    this.createFloatingActionButton();

    // イベントリスナーを設定
    this.setupEventListeners();

    // 現在のページに基づいてアクティブタブを設定
    this.setActiveTabFromURL();
  }

  createBottomNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.innerHTML = `
      <a href="#home" class="mobile-bottom-nav__item" data-tab="home">
        <div class="mobile-bottom-nav__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <span class="mobile-bottom-nav__label">ホーム</span>
      </a>

      <a href="#events" class="mobile-bottom-nav__item" data-tab="events">
        <div class="mobile-bottom-nav__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <span class="mobile-bottom-nav__label">イベント</span>
        <span class="mobile-bottom-nav__badge" style="display: none;">3</span>
      </a>

      <a href="#" class="mobile-bottom-nav__item" data-tab="search">
        <div class="mobile-bottom-nav__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
        <span class="mobile-bottom-nav__label">検索</span>
      </a>

      <a href="#" class="mobile-bottom-nav__item" data-tab="profile">
        <div class="mobile-bottom-nav__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <span class="mobile-bottom-nav__label">マイページ</span>
      </a>
    `;

    document.body.appendChild(nav);
    this.bottomNav = nav;
  }

  createFloatingActionButton() {
    // FABオーバーレイ
    const overlay = document.createElement('div');
    overlay.className = 'fab-overlay';
    document.body.appendChild(overlay);
    this.fabOverlay = overlay;

    // FABメニュー
    const fabMenu = document.createElement('div');
    fabMenu.className = 'fab-menu';
    fabMenu.innerHTML = `
      <a href="#" class="fab-menu__item" data-action="create-event">
        <svg class="fab-menu__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>イベント作成</span>
      </a>

      <a href="#" class="fab-menu__item" data-action="register-talk">
        <svg class="fab-menu__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
        <span>発表申込</span>
      </a>

      <a href="#" class="fab-menu__item" data-action="quick-register">
        <svg class="fab-menu__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
        <span>参加登録</span>
      </a>
    `;
    document.body.appendChild(fabMenu);
    this.fabMenu = fabMenu;

    // FABボタン
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.setAttribute('aria-label', 'メニューを開く');
    fab.innerHTML = `
      <svg class="fab__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    `;
    document.body.appendChild(fab);
    this.fab = fab;
  }

  setupEventListeners() {
    // ボトムナビゲーションのクリック
    this.bottomNav.addEventListener('click', e => {
      const item = e.target.closest('.mobile-bottom-nav__item');
      if (item) {
        e.preventDefault();
        const tab = item.dataset.tab;
        this.setActiveTab(tab);
        this.handleNavigation(tab);
      }
    });

    // FABのクリック
    this.fab.addEventListener('click', () => {
      this.toggleFab();
    });

    // FABオーバーレイのクリック
    this.fabOverlay.addEventListener('click', () => {
      this.closeFab();
    });

    // FABメニューアイテムのクリック
    this.fabMenu.addEventListener('click', e => {
      const item = e.target.closest('.fab-menu__item');
      if (item) {
        e.preventDefault();
        const action = item.dataset.action;
        this.handleFabAction(action);
        this.closeFab();
      }
    });

    // スクロールイベント
    let lastScrollTop = 0;
    window.addEventListener(
      'scroll',
      () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > 100) {
          // 下スクロール時は非表示
          this.bottomNav.style.transform = 'translateY(100%)';
        } else {
          // 上スクロール時は表示
          this.bottomNav.style.transform = 'translateY(0)';
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
      },
      { passive: true }
    );

    // URLハッシュ変更の監視
    window.addEventListener('hashchange', () => {
      this.setActiveTabFromURL();
    });
  }

  setActiveTab(tab) {
    this.activeTab = tab;

    // すべてのタブからactiveクラスを削除
    this.bottomNav.querySelectorAll('.mobile-bottom-nav__item').forEach(item => {
      item.classList.remove('active');
    });

    // 選択されたタブにactiveクラスを追加
    const activeItem = this.bottomNav.querySelector(`[data-tab="${tab}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }

  setActiveTabFromURL() {
    const hash = window.location.hash.slice(1);
    let tab = 'home';

    if (hash.includes('events')) {
      tab = 'events';
    } else if (hash.includes('search')) {
      tab = 'search';
    } else if (hash.includes('profile') || hash.includes('account')) {
      tab = 'profile';
    }

    this.setActiveTab(tab);
  }

  handleNavigation(tab) {
    switch (tab) {
      case 'home':
        window.location.hash = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'events':
        window.location.hash = 'events';
        break;
      case 'search':
        this.openSearchModal();
        break;
      case 'profile':
        if (window.googleAuth && window.googleAuth.isAuthenticated()) {
          this.openProfileModal();
        } else {
          window.googleAuth.login();
        }
        break;
    }
  }

  toggleFab() {
    this.fabOpen = !this.fabOpen;

    if (this.fabOpen) {
      this.openFab();
    } else {
      this.closeFab();
    }
  }

  openFab() {
    this.fabOpen = true;
    this.fab.classList.add('active');
    this.fabMenu.classList.add('active');
    this.fabOverlay.classList.add('active');

    // アイコンを×に変更
    this.fab.innerHTML = `
      <svg class="fab__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;

    // 背景スクロールを無効化
    document.body.style.overflow = 'hidden';
  }

  closeFab() {
    this.fabOpen = false;
    this.fab.classList.remove('active');
    this.fabMenu.classList.remove('active');
    this.fabOverlay.classList.remove('active');

    // アイコンを+に戻す
    this.fab.innerHTML = `
      <svg class="fab__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    `;

    // 背景スクロールを有効化
    document.body.style.overflow = '';
  }

  handleFabAction(action) {
    switch (action) {
      case 'create-event':
        if (window.googleAuth && window.googleAuth.isAuthenticated()) {
          // 管理者権限チェック
          const user = window.googleAuth.getUser();
          if (user.role === 'admin') {
            window.location.href = '/admin#create-event';
          } else {
            this.showPermissionError();
          }
        } else {
          window.googleAuth.login();
        }
        break;
      case 'register-talk':
        // 発表申込モーダルを開く
        if (window.modalSystem) {
          window.modalSystem.open('talk-submission-modal');
        }
        break;
      case 'quick-register':
        // 参加登録モーダルを開く
        if (window.modalSystem) {
          window.modalSystem.open('registration-modal');
        }
        break;
    }
  }

  openSearchModal() {
    // 検索モーダルの実装
    if (window.modalSystem && window.modalSystem.confirm) {
      window.modalSystem.confirm({
        title: '検索',
        message: '検索機能は現在開発中です。',
        type: 'info',
        confirmText: 'OK',
        cancelText: null
      });
    }
  }

  openProfileModal() {
    // プロフィールモーダルの実装
    if (window.modalSystem && window.modalSystem.confirm) {
      window.modalSystem.confirm({
        title: 'マイページ',
        message: 'マイページ機能は現在開発中です。',
        type: 'info',
        confirmText: 'OK',
        cancelText: null
      });
    }
  }

  showPermissionError() {
    if (window.modalSystem && window.modalSystem.confirm) {
      window.modalSystem.confirm({
        title: '権限エラー',
        message: 'イベントの作成には管理者権限が必要です。',
        type: 'error',
        confirmText: 'OK',
        cancelText: null
      });
    }
  }

  // 新着通知バッジを更新
  updateNotificationBadge(count) {
    const badge = this.bottomNav.querySelector('[data-tab="events"] .mobile-bottom-nav__badge');
    if (badge) {
      if (count > 0) {
        badge.style.display = 'flex';
        badge.textContent = count > 99 ? '99+' : count;
      } else {
        badge.style.display = 'none';
      }
    }
  }
}

// モバイルデバイスでのみ初期化
if (window.innerWidth <= 768) {
  document.addEventListener('DOMContentLoaded', () => {
    window.mobileNavigation = new MobileNavigation();
  });

  // ウィンドウサイズ変更時の処理
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && window.mobileNavigation) {
      // デスクトップサイズになったら削除
      if (window.mobileNavigation.bottomNav) {
        window.mobileNavigation.bottomNav.remove();
      }
      if (window.mobileNavigation.fab) {
        window.mobileNavigation.fab.remove();
      }
      if (window.mobileNavigation.fabMenu) {
        window.mobileNavigation.fabMenu.remove();
      }
      if (window.mobileNavigation.fabOverlay) {
        window.mobileNavigation.fabOverlay.remove();
      }
      window.mobileNavigation = null;
    } else if (window.innerWidth <= 768 && !window.mobileNavigation) {
      // モバイルサイズになったら再初期化
      window.mobileNavigation = new MobileNavigation();
    }
  });
}
