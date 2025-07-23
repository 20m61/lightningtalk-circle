/**
 * PWA Installer
 * プログレッシブウェブアプリのインストール管理
 */

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.installBanner = null;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isInstalled = false;
    this.init();
  }

  init() {
    // インストール状態をチェック
    this.checkInstallState();

    // インストールプロンプトのイベントリスナー
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPromotion();
    });

    // インストール成功イベント
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.hideInstallPromotion();
      this.showSuccessMessage();
      this.isInstalled = true;
      localStorage.setItem('pwa-installed', 'true');
    });

    // iOS用の処理
    if (this.isIOS && !this.isInStandaloneMode()) {
      this.showIOSInstallInstructions();
    }

    // Service Worker登録
    this.registerServiceWorker();

    // インストールUIの初期化
    this.createInstallUI();
  }

  checkInstallState() {
    // スタンドアロンモードかチェック
    if (this.isInStandaloneMode()) {
      this.isInstalled = true;
      return;
    }

    // ローカルストレージでインストール状態を確認
    if (localStorage.getItem('pwa-installed') === 'true') {
      this.isInstalled = true;
    }
  }

  isInStandaloneMode() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://')
    );
  }

  createInstallUI() {
    // インストールバナー
    this.installBanner = document.createElement('div');
    this.installBanner.className = 'pwa-install-banner';
    this.installBanner.innerHTML = `
      <div class="pwa-install-banner__content">
        <div class="pwa-install-banner__icon">
          <img src="/icons/android-chrome-96x96.png" alt="App Icon">
        </div>
        <div class="pwa-install-banner__text">
          <h4>アプリをインストール</h4>
          <p>ホーム画面に追加してオフラインでも使用できます</p>
        </div>
        <div class="pwa-install-banner__actions">
          <button class="pwa-install-banner__dismiss" aria-label="閉じる">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <button class="pwa-install-banner__install btn btn--primary">
            インストール
          </button>
        </div>
      </div>
    `;

    // インストールボタン（ヘッダー用）
    this.installButton = document.createElement('button');
    this.installButton.className = 'pwa-install-button';
    this.installButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      <span>インストール</span>
    `;

    // イベントリスナー設定
    this.installBanner
      .querySelector('.pwa-install-banner__dismiss')
      .addEventListener('click', () => {
        this.hideInstallPromotion();
        this.setDismissed();
      });

    this.installBanner
      .querySelector('.pwa-install-banner__install')
      .addEventListener('click', () => {
        this.handleInstallClick();
      });

    this.installButton.addEventListener('click', () => {
      this.handleInstallClick();
    });

    document.body.appendChild(this.installBanner);

    // ヘッダーにボタンを追加
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
      authContainer.parentNode.insertBefore(this.installButton, authContainer);
    }
  }

  showInstallPromotion() {
    // 既にインストール済みまたは無視された場合は表示しない
    if (this.isInstalled || this.isDismissed()) {
      return;
    }

    // デスクトップでは小さめのボタンのみ表示
    if (!this.isMobile()) {
      this.installButton.style.display = 'flex';
      return;
    }

    // モバイルではバナーを表示
    setTimeout(() => {
      this.installBanner.classList.add('active');
    }, 3000); // 3秒後に表示
  }

  hideInstallPromotion() {
    this.installBanner.classList.remove('active');
    this.installButton.style.display = 'none';
  }

  async handleInstallClick() {
    if (!this.deferredPrompt) {
      return;
    }

    // インストールプロンプトを表示
    this.deferredPrompt.prompt();

    // ユーザーの選択を待つ
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installation accepted');
      this.trackInstallation('accepted');
    } else {
      console.log('PWA installation dismissed');
      this.trackInstallation('dismissed');
    }

    this.deferredPrompt = null;
    this.hideInstallPromotion();
  }

  showIOSInstallInstructions() {
    // iOS用のインストール手順モーダル
    const modal = document.createElement('div');
    modal.className = 'ios-install-modal';
    modal.innerHTML = `
      <div class="ios-install-modal__content">
        <h3>アプリをインストール</h3>
        <p>iOSでは以下の手順でホーム画面に追加できます：</p>
        <ol>
          <li>Safari下部の<strong>共有ボタン</strong>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.42 6.42 8 5l4-4 4 4zm4 7v8c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2v-8c0-1.11.89-2 2-2h3v2H6v8h12v-8h-3v-2h3c1.1 0 2 .89 2 2z"/>
            </svg>
            をタップ
          </li>
          <li>「<strong>ホーム画面に追加</strong>」を選択</li>
          <li>「<strong>追加</strong>」をタップ</li>
        </ol>
        <button class="btn btn--primary" onclick="this.closest('.ios-install-modal').remove()">
          閉じる
        </button>
      </div>
    `;

    // 一度だけ表示
    if (!localStorage.getItem('ios-install-shown')) {
      setTimeout(() => {
        document.body.appendChild(modal);
        localStorage.setItem('ios-install-shown', 'true');
      }, 5000);
    }
  }

  showSuccessMessage() {
    const notification = document.createElement('div');
    notification.className = 'pwa-install-success';
    notification.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      <span>アプリが正常にインストールされました！</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered:', registration);

        // アップデートのチェック
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  showUpdateNotification() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'pwa-update-banner';
    updateBanner.innerHTML = `
      <p>新しいバージョンが利用可能です</p>
      <button class="btn btn--primary btn--sm" onclick="location.reload()">
        更新
      </button>
    `;

    document.body.appendChild(updateBanner);

    setTimeout(() => {
      updateBanner.classList.add('show');
    }, 100);
  }

  isMobile() {
    return window.innerWidth <= 768;
  }

  isDismissed() {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (!dismissedTime) return false;

    // 7日後に再表示
    const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
    return daysSinceDismissed < 7;
  }

  setDismissed() {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }

  trackInstallation(outcome) {
    // アナリティクスイベントを送信
    if (window.gtag) {
      window.gtag('event', 'pwa_install_prompt', {
        event_category: 'PWA',
        event_label: outcome
      });
    }
  }
}

// スタイル追加
const style = document.createElement('style');
style.textContent = `
  /* インストールバナー */
  .pwa-install-banner {
    position: fixed;
    bottom: -100px;
    left: 0;
    right: 0;
    background: var(--color-surface, #ffffff);
    border-top: 1px solid var(--color-border-light);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-sticky, 1020);
    transition: bottom var(--transition-base);
    padding: var(--spacing-md);
    padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
  }

  .pwa-install-banner.active {
    bottom: 0;
  }

  .pwa-install-banner__content {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .pwa-install-banner__icon img {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  .pwa-install-banner__text {
    flex: 1;
  }

  .pwa-install-banner__text h4 {
    margin: 0 0 4px;
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
  }

  .pwa-install-banner__text p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .pwa-install-banner__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .pwa-install-banner__dismiss {
    background: none;
    border: none;
    padding: var(--spacing-xs);
    cursor: pointer;
    color: var(--color-text-secondary);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .pwa-install-banner__dismiss:hover {
    background: var(--color-background-alt);
  }

  /* インストールボタン */
  .pwa-install-button {
    display: none;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: all var(--transition-base);
  }

  .pwa-install-button:hover {
    background: var(--color-primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  /* iOS用モーダル */
  .ios-install-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal, 1050);
    padding: var(--spacing-md);
  }

  .ios-install-modal__content {
    background: var(--color-surface);
    padding: var(--spacing-xl);
    border-radius: var(--radius-lg);
    max-width: 400px;
    width: 100%;
    box-shadow: var(--shadow-xl);
  }

  .ios-install-modal__content h3 {
    margin-top: 0;
  }

  .ios-install-modal__content ol {
    margin: var(--spacing-md) 0;
    padding-left: var(--spacing-lg);
  }

  .ios-install-modal__content li {
    margin-bottom: var(--spacing-sm);
  }

  /* 成功通知 */
  .pwa-install-success {
    position: fixed;
    top: -60px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-success);
    color: white;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    box-shadow: var(--shadow-lg);
    transition: top var(--transition-base);
    z-index: var(--z-tooltip);
  }

  .pwa-install-success.show {
    top: calc(var(--spacing-lg) + env(safe-area-inset-top));
  }

  /* アップデート通知 */
  .pwa-update-banner {
    position: fixed;
    top: -60px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-info);
    color: white;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    box-shadow: var(--shadow-lg);
    transition: top var(--transition-base);
    z-index: var(--z-tooltip);
  }

  .pwa-update-banner.show {
    top: calc(var(--spacing-lg) + env(safe-area-inset-top));
  }
`;
document.head.appendChild(style);

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  window.pwaInstaller = new PWAInstaller();
});
