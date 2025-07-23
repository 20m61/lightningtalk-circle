/**
 * PWA Installer
 * プログレッシブウェブアプリのインストール管理
 */

(function () {
  'use strict';

  class PWAInstaller {
    constructor() {
      this.deferredPrompt = null;
      this.installButton = null;
      this.installBanner = null;
      this.updateBanner = null;
      this.setupEventListeners();
      this.createUI();
      this.checkInstallState();
      this.registerServiceWorker();
    }

    setupEventListeners() {
      // インストールプロンプトをキャッチ
      window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.showInstallPromotion();

        // アナリティクスイベント
        if (window.gtag) {
          window.gtag('event', 'pwa_install_available');
        }
      });

      // インストール成功
      window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        this.hideInstallPromotion();

        // アナリティクスイベント
        if (window.gtag) {
          window.gtag('event', 'pwa_installed');
        }
      });

      // ページ表示状態の変更を監視
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkForUpdates();
        }
      });
    }

    createUI() {
      // インストールバナー
      this.installBanner = document.createElement('div');
      this.installBanner.className = 'pwa-install-banner';
      this.installBanner.innerHTML = `
      <div class="pwa-install-content">
        <div class="pwa-install-icon">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
          </svg>
        </div>
        <div class="pwa-install-text">
          <strong>アプリをインストール</strong>
          <span>ホーム画面に追加して、より快適にご利用ください</span>
        </div>
        <button class="pwa-install-button">インストール</button>
        <button class="pwa-install-dismiss" aria-label="閉じる">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
        </button>
      </div>
    `;
      document.body.appendChild(this.installBanner);

      // インストールボタンのイベント
      this.installButton = this.installBanner.querySelector('.pwa-install-button');
      this.installButton.addEventListener('click', () => this.installPWA());

      // 閉じるボタン
      const dismissButton = this.installBanner.querySelector('.pwa-install-dismiss');
      dismissButton.addEventListener('click', () => this.hideInstallPromotion());

      // アップデートバナー
      this.updateBanner = document.createElement('div');
      this.updateBanner.className = 'pwa-update-banner';
      this.updateBanner.innerHTML = `
      <div class="pwa-update-content">
        <span>新しいバージョンが利用可能です</span>
        <button class="pwa-update-button">更新</button>
      </div>
    `;
      document.body.appendChild(this.updateBanner);

      // 更新ボタンのイベント
      const updateButton = this.updateBanner.querySelector('.pwa-update-button');
      updateButton.addEventListener('click', () => this.updatePWA());
    }

    async checkInstallState() {
      // スタンドアロンモードで実行されているかチェック
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA is running in standalone mode');
        return;
      }

      // iOSの場合は特別な処理
      if (this.isIOS()) {
        // iOSではbeforeinstallpromptイベントが発火しない
        const isInstalled = this.isIOSInstalled();
        if (!isInstalled) {
          this.showIOSInstallGuide();
        }
      }
    }

    isIOS() {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    }

    isIOSInstalled() {
      return window.navigator.standalone === true;
    }

    showIOSInstallGuide() {
      // 既に表示したことがある場合はスキップ
      if (localStorage.getItem('pwa-ios-guide-shown')) {
        return;
      }

      const guide = document.createElement('div');
      guide.className = 'pwa-ios-guide';
      guide.innerHTML = `
      <div class="pwa-ios-guide-content">
        <h3>ホーム画面に追加</h3>
        <p>
          1. Safari下部の<span class="pwa-ios-icon">共有</span>ボタンをタップ<br>
          2. 「ホーム画面に追加」を選択<br>
          3. 「追加」をタップ
        </p>
        <button class="pwa-ios-guide-close">閉じる</button>
      </div>
    `;
      document.body.appendChild(guide);

      setTimeout(() => {
        guide.classList.add('show');
      }, 100);

      const closeButton = guide.querySelector('.pwa-ios-guide-close');
      closeButton.addEventListener('click', () => {
        guide.remove();
        localStorage.setItem('pwa-ios-guide-shown', 'true');
      });
    }

    showInstallPromotion() {
      // 既にインストール済みの場合は表示しない
      if (this.isInstalled()) {
        return;
      }

      // 過去に非表示にした場合は一定期間表示しない
      const dismissedTime = localStorage.getItem('pwa-install-dismissed');
      if (dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          return;
        }
      }

      setTimeout(() => {
        this.installBanner.classList.add('show');
      }, 2000); // 2秒後に表示
    }

    hideInstallPromotion() {
      this.installBanner.classList.remove('show');
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }

    async installPWA() {
      if (!this.deferredPrompt) {
        return;
      }

      // インストールプロンプトを表示
      this.deferredPrompt.prompt();

      // ユーザーの選択を待つ
      const { outcome } = await this.deferredPrompt.userChoice;

      console.log(`User response to the install prompt: ${outcome}`);

      // プロンプトは一度しか使えないのでリセット
      this.deferredPrompt = null;

      // バナーを非表示
      this.hideInstallPromotion();

      // アナリティクスイベント
      if (window.gtag) {
        window.gtag('event', 'pwa_install_' + outcome);
      }
    }

    isInstalled() {
      // スタンドアロンモードで実行されているか
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }

      // iOSの場合
      if (this.isIOS() && window.navigator.standalone === true) {
        return true;
      }

      return false;
    }

    async registerServiceWorker() {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service Worker registered:', registration);

          // アップデートチェック
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 新しいバージョンが利用可能
                this.showUpdateBanner();
              }
            });
          });

          // 定期的にアップデートをチェック
          setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000
          ); // 1時間ごと
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    }

    showUpdateBanner() {
      this.updateBanner.classList.add('show');
    }

    updatePWA() {
      // 新しいService Workerをアクティベート
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }

      // ページをリロード
      window.location.reload();
    }

    async checkForUpdates() {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.update();
        }
      }
    }
  }

  // スタイル追加
  const style = document.createElement('style');
  style.textContent = `
  /* インストールバナー */
  .pwa-install-banner {
    position: fixed;
    bottom: calc(-100% - 10px);
    left: var(--spacing-lg);
    right: var(--spacing-lg);
    background: var(--color-surface, #ffffff);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: var(--spacing-md);
    z-index: 1000;
    transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pwa-install-banner.show {
    bottom: calc(var(--spacing-lg) + env(safe-area-inset-bottom));
  }

  .pwa-install-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .pwa-install-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    background: var(--color-primary-light, #e3f2fd);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary, #2196f3);
  }

  .pwa-install-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .pwa-install-text strong {
    font-size: 16px;
    color: var(--color-text-primary, #333);
  }

  .pwa-install-text span {
    font-size: 14px;
    color: var(--color-text-secondary, #666);
  }

  .pwa-install-button {
    flex-shrink: 0;
    background: var(--color-primary, #2196f3);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pwa-install-button:hover {
    background: var(--color-primary-dark, #1976d2);
    transform: translateY(-1px);
  }

  .pwa-install-dismiss {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    background: none;
    border: none;
    color: var(--color-text-secondary, #666);
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .pwa-install-dismiss:hover {
    background: var(--color-background-secondary, #f5f5f5);
  }

  /* iOSインストールガイド */
  .pwa-ios-guide {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s;
    padding: var(--spacing-lg);
  }

  .pwa-ios-guide.show {
    opacity: 1;
  }

  .pwa-ios-guide-content {
    background: white;
    border-radius: 16px;
    padding: var(--spacing-xl);
    max-width: 320px;
    text-align: center;
  }

  .pwa-ios-guide h3 {
    margin: 0 0 var(--spacing-md);
    font-size: 20px;
  }

  .pwa-ios-guide p {
    margin: 0 0 var(--spacing-lg);
    line-height: 1.6;
    color: var(--color-text-secondary, #666);
  }

  .pwa-ios-icon {
    display: inline-block;
    padding: 2px 8px;
    background: var(--color-primary-light, #e3f2fd);
    border-radius: 4px;
    font-weight: 600;
    color: var(--color-primary, #2196f3);
  }

  .pwa-ios-guide-close {
    background: var(--color-primary, #2196f3);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 32px;
    font-weight: 600;
    cursor: pointer;
  }

  /* アップデートバナー */
  .pwa-update-banner {
    position: fixed;
    top: calc(-100% - 10px);
    left: var(--spacing-lg);
    right: var(--spacing-lg);
    background: var(--color-warning-light, #fff3cd);
    border: 1px solid var(--color-warning, #ffc107);
    border-radius: 8px;
    padding: var(--spacing-sm) var(--spacing-md);
    z-index: 1000;
    transition: top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
})(); // IIFE終了
