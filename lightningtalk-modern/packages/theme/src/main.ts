/**
 * Lightning Talk Modern Theme - Main Entry Point
 * TypeScript/React統合のメインファイル
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LightningTalkApp } from './components/LightningTalkApp';
import { AccessibilityProvider } from './components/AccessibilityProvider';
import { applyWordPressIntegration } from './wordpress/integration';
import './styles/main.scss';

// WordPress環境データの型定義
declare global {
  interface Window {
    wpLightningTalk: {
      apiUrl: string;
      nonce: string;
      currentUser: any;
      ajaxUrl: string;
      siteUrl: string;
      themeUrl: string;
    };
  }
}

/**
 * アプリケーション初期化
 */
class LightningTalkModernTheme {
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
      console.log('Lightning Talk Modern Theme initializing...');
      
      // WordPress統合の適用
      applyWordPressIntegration();
      
      // React アプリケーションのマウント
      await this.mountReactComponents();
      
      // レガシー機能の初期化
      this.initializeLegacyFeatures();
      
      this.initialized = true;
      console.log('Lightning Talk Modern Theme initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Lightning Talk Modern Theme:', error);
    }
  }

  /**
   * React コンポーネントをマウント
   */
  private async mountReactComponents(): Promise<void> {
    // メインアプリケーションコンテナ
    const appContainer = document.getElementById('lightningtalk-app');
    if (appContainer) {
      const root = createRoot(appContainer);
      root.render(
        <StrictMode>
          <AccessibilityProvider>
            <LightningTalkApp />
          </AccessibilityProvider>
        </StrictMode>
      );
    }

    // イベント登録フォーム
    const registrationContainer = document.getElementById('lightningtalk-registration');
    if (registrationContainer) {
      const { RegistrationForm } = await import('./components/RegistrationForm');
      const root = createRoot(registrationContainer);
      root.render(
        <StrictMode>
          <RegistrationForm />
        </StrictMode>
      );
    }

    // イベント一覧
    const eventsContainer = document.getElementById('lightningtalk-events');
    if (eventsContainer) {
      const { EventsList } = await import('./components/EventsList');
      const root = createRoot(eventsContainer);
      root.render(
        <StrictMode>
          <EventsList />
        </StrictMode>
      );
    }

    // 発表一覧
    const talksContainer = document.getElementById('lightningtalk-talks');
    if (talksContainer) {
      const { TalksList } = await import('./components/TalksList');
      const root = createRoot(talksContainer);
      root.render(
        <StrictMode>
          <TalksList />
        </StrictMode>
      );
    }
  }

  /**
   * レガシー機能の初期化（jQuery等）
   */
  private initializeLegacyFeatures(): void {
    // Cocoon親テーマとの互換性確保
    this.ensureCocoonCompatibility();
    
    // カスタムイベントリスナー
    this.setupCustomEventListeners();
    
    // パフォーマンス最適化
    this.applyPerformanceOptimizations();
  }

  /**
   * Cocoon親テーマとの互換性確保
   */
  private ensureCocoonCompatibility(): void {
    // Cocoonのスタイルとの競合回避
    document.body.classList.add('lightningtalk-modern-theme');
    
    // Cocoonのカスタマイザー設定を継承
    const cocoonSettings = (window as any).cocoonSettings;
    if (cocoonSettings) {
      console.log('Cocoon settings detected, applying compatibility layer');
      
      // カラーテーマの継承
      if (cocoonSettings.colorTheme) {
        document.documentElement.style.setProperty(
          '--cocoon-primary-color', 
          cocoonSettings.colorTheme.primary
        );
      }
    }
  }

  /**
   * カスタムイベントリスナーの設定
   */
  private setupCustomEventListeners(): void {
    // Lightning Talk特有のイベント処理
    document.addEventListener('lightningtalk:registration', (event: CustomEvent) => {
      console.log('Registration event triggered:', event.detail);
    });

    document.addEventListener('lightningtalk:talk-submission', (event: CustomEvent) => {
      console.log('Talk submission event triggered:', event.detail);
    });

    // WordPress Ajax フック
    document.addEventListener('wp-ajax-complete', (event: CustomEvent) => {
      if (event.detail.action?.startsWith('lightningtalk_')) {
        console.log('Lightning Talk Ajax completed:', event.detail);
      }
    });
  }

  /**
   * パフォーマンス最適化
   */
  private applyPerformanceOptimizations(): void {
    // 遅延読み込み画像の設定
    if ('loading' in HTMLImageElement.prototype) {
      const images = document.querySelectorAll('img[data-src]');
      images.forEach((img: HTMLImageElement) => {
        img.src = img.dataset.src || '';
        img.loading = 'lazy';
      });
    } else {
      // Intersection Observer フォールバック
      this.setupIntersectionObserver();
    }

    // Service Worker の登録（PWA対応）
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }

  /**
   * Intersection Observer による遅延読み込み
   */
  private setupIntersectionObserver(): void {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// アプリケーション開始
new LightningTalkModernTheme();

// 開発環境でのHMR設定
if (import.meta.hot) {
  import.meta.hot.accept('./components/LightningTalkApp', () => {
    console.log('HMR: LightningTalkApp updated');
  });
}