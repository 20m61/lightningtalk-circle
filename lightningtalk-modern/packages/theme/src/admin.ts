/**
 * Lightning Talk Modern Theme - Admin Entry Point
 * WordPress管理画面用のTypeScript/React統合
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { setupAdminIntegration } from './wordpress/admin-integration';
import './styles/admin.scss';

// WordPress管理画面データの型定義
declare global {
  interface Window {
    wpLightningTalkAdmin: {
      apiUrl: string;
      nonce: string;
      currentUser: any;
      ajaxUrl: string;
      siteUrl: string;
      themeUrl: string;
      page: string;
      translations: Record<string, string>;
    };
  }
}

/**
 * 管理画面アプリケーション初期化
 */
class LightningTalkAdminApp {
  private initialized = false;

  constructor() {
    // DOM読み込み完了後に初期化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  private async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log('Lightning Talk Admin App initializing...');
      
      // WordPress管理画面統合の設定
      setupAdminIntegration();
      
      // React アプリケーションのマウント
      await this.mountAdminComponents();
      
      // 管理画面固有の機能初期化
      this.initializeAdminFeatures();
      
      this.initialized = true;
      console.log('Lightning Talk Admin App initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Lightning Talk Admin App:', error);
    }
  }

  /**
   * 管理画面React コンポーネントのマウント
   */
  private async mountAdminComponents(): Promise<void> {
    const adminData = window.wpLightningTalkAdmin;
    if (!adminData) {
      console.warn('WordPress admin data not available');
      return;
    }

    // メインダッシュボード
    const dashboardContainer = document.getElementById('lightningtalk-admin-dashboard');
    if (dashboardContainer) {
      const root = createRoot(dashboardContainer);
      root.render(
        <StrictMode>
          <AdminDashboard />
        </StrictMode>
      );
    }

    // 設定ページ
    const settingsContainer = document.getElementById('lightningtalk-admin-settings');
    if (settingsContainer) {
      const { AdminSettings } = await import('./components/admin/AdminSettings');
      const root = createRoot(settingsContainer);
      root.render(
        <StrictMode>
          <AdminSettings />
        </StrictMode>
      );
    }

    // 統計ページ
    const analyticsContainer = document.getElementById('lightningtalk-admin-analytics');
    if (analyticsContainer) {
      const { AdminAnalytics } = await import('./components/admin/AdminAnalytics');
      const root = createRoot(analyticsContainer);
      root.render(
        <StrictMode>
          <AdminAnalytics />
        </StrictMode>
      );
    }

    // イベント管理ページ
    const eventsContainer = document.getElementById('lightningtalk-admin-events');
    if (eventsContainer) {
      const { AdminEvents } = await import('./components/admin/AdminEvents');
      const root = createRoot(eventsContainer);
      root.render(
        <StrictMode>
          <AdminEvents />
        </StrictMode>
      );
    }
  }

  /**
   * 管理画面固有の機能初期化
   */
  private initializeAdminFeatures(): void {
    // WordPress メディアライブラリとの統合
    this.setupMediaLibraryIntegration();
    
    // カスタマイザープレビューとの連携
    this.setupCustomizerIntegration();
    
    // 管理画面メニューの拡張
    this.setupAdminMenuEnhancements();
    
    // 管理画面通知システム
    this.setupAdminNotifications();
  }

  /**
   * WordPress メディアライブラリとの統合
   */
  private setupMediaLibraryIntegration(): void {
    // WordPress メディアライブラリが利用可能かチェック
    if (typeof (window as any).wp !== 'undefined' && (window as any).wp.media) {
      const wp = (window as any).wp;
      
      // カスタムメディアフレームの作成
      (window as any).lightningTalkMediaFrame = wp.media({
        title: 'Lightning Talk イベント画像を選択',
        button: {
          text: '画像を使用'
        },
        multiple: false,
        library: {
          type: 'image'
        }
      });

      // メディア選択時のイベントハンドラ
      (window as any).lightningTalkMediaFrame.on('select', () => {
        const attachment = (window as any).lightningTalkMediaFrame.state().get('selection').first().toJSON();
        
        // カスタムイベントを発火
        const event = new CustomEvent('lightningtalk:media-selected', {
          detail: attachment,
          bubbles: true
        });
        document.dispatchEvent(event);
      });
    }
  }

  /**
   * カスタマイザープレビューとの連携
   */
  private setupCustomizerIntegration(): void {
    if (typeof (window as any).wp !== 'undefined' && (window as any).wp.customize) {
      const customize = (window as any).wp.customize;

      // Lightning Talk設定の監視
      customize('lightningtalk_color_scheme', (value: any) => {
        value.bind((newValue: string) => {
          document.documentElement.setAttribute('data-color-scheme', newValue);
        });
      });

      customize('lightningtalk_typography_scale', (value: any) => {
        value.bind((newValue: string) => {
          document.documentElement.style.setProperty('--font-scale', newValue);
        });
      });
    }
  }

  /**
   * 管理画面メニューの拡張
   */
  private setupAdminMenuEnhancements(): void {
    // Lightning Talk メニューアイコンの動的更新
    const ltMenuIcon = document.querySelector('#toplevel_page_lightningtalk-admin .wp-menu-image');
    if (ltMenuIcon) {
      // アクティブ状態に応じてアイコンを変更
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const target = mutation.target as Element;
            if (target.classList.contains('current')) {
              ltMenuIcon.classList.add('active');
            } else {
              ltMenuIcon.classList.remove('active');
            }
          }
        });
      });

      const menuItem = ltMenuIcon.closest('#toplevel_page_lightningtalk-admin');
      if (menuItem) {
        observer.observe(menuItem, { attributes: true });
      }
    }

    // サブメニューの強化
    this.enhanceSubMenus();
  }

  /**
   * サブメニューの強化
   */
  private enhanceSubMenus(): void {
    const subMenus = document.querySelectorAll('#toplevel_page_lightningtalk-admin .wp-submenu li');
    
    subMenus.forEach((menuItem, index) => {
      const link = menuItem.querySelector('a');
      if (link) {
        // ページ読み込みインジケーター
        link.addEventListener('click', () => {
          const loadingIndicator = document.createElement('span');
          loadingIndicator.className = 'spinner is-active';
          loadingIndicator.style.float = 'none';
          loadingIndicator.style.marginLeft = '5px';
          link.appendChild(loadingIndicator);
        });

        // キーボードナビゲーション
        link.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextItem = menuItem.nextElementSibling?.querySelector('a') as HTMLElement;
            nextItem?.focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevItem = menuItem.previousElementSibling?.querySelector('a') as HTMLElement;
            prevItem?.focus();
          }
        });
      }
    });
  }

  /**
   * 管理画面通知システム
   */
  private setupAdminNotifications(): void {
    // Lightning Talk 固有の通知表示
    const showAdminNotice = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      const notice = document.createElement('div');
      notice.className = `notice notice-${type} is-dismissible lightningtalk-notice`;
      notice.innerHTML = `
        <p>${message}</p>
        <button type="button" class="notice-dismiss">
          <span class="screen-reader-text">この通知を閉じる</span>
        </button>
      `;

      // 通知を管理画面の適切な場所に挿入
      const noticesContainer = document.querySelector('.wrap h1') || document.querySelector('.wrap h2');
      if (noticesContainer) {
        noticesContainer.parentNode?.insertBefore(notice, noticesContainer.nextSibling);
      }

      // 閉じるボタンの機能
      const dismissButton = notice.querySelector('.notice-dismiss');
      dismissButton?.addEventListener('click', () => {
        notice.remove();
      });

      // 自動非表示（エラー以外）
      if (type !== 'error') {
        setTimeout(() => {
          notice.style.opacity = '0';
          setTimeout(() => notice.remove(), 300);
        }, 5000);
      }
    };

    // グローバル関数として公開
    (window as any).lightningTalkShowNotice = showAdminNotice;

    // Ajax完了時の通知
    document.addEventListener('wp-ajax-complete', (event: CustomEvent) => {
      if (event.detail.action?.startsWith('lightningtalk_')) {
        if (event.detail.success) {
          showAdminNotice('操作が完了しました', 'success');
        } else {
          showAdminNotice('操作に失敗しました: ' + event.detail.message, 'error');
        }
      }
    });
  }
}

// 管理画面アプリケーション開始
new LightningTalkAdminApp();

// 開発環境でのHMR設定
if (import.meta.hot) {
  import.meta.hot.accept('./components/admin/AdminDashboard', () => {
    console.log('HMR: AdminDashboard updated');
  });
}