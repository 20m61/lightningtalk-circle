/**
 * WordPress Integration Module
 * WordPressとの統合機能を提供
 */

/**
 * WordPress統合の適用
 */
export function applyWordPressIntegration(): void {
  // WordPress フック システムとの統合
  setupWordPressHooks();
  
  // Gutenberg ブロックエディターとの統合
  setupGutenbergIntegration();
  
  // カスタマイザーとの統合
  setupCustomizerIntegration();
  
  // SEO最適化
  setupSEOOptimizations();
  
  // アクセシビリティ機能
  setupAccessibilityFeatures();
}

/**
 * WordPress フックシステムとの統合
 */
function setupWordPressHooks(): void {
  // WordPress の wp_hooks があるかチェック
  if (typeof (window as any).wp !== 'undefined' && (window as any).wp.hooks) {
    const { addAction, addFilter, doAction } = (window as any).wp.hooks;

    // Lightning Talk 固有のアクション
    addAction('lightningtalk_registration_complete', 'lightningtalk/theme', (data: any) => {
      console.log('Registration completed:', data);
      
      // カスタムイベントを発火
      const event = new CustomEvent('lightningtalk:registration', {
        detail: data,
        bubbles: true
      });
      document.dispatchEvent(event);
    });

    addAction('lightningtalk_talk_submitted', 'lightningtalk/theme', (data: any) => {
      console.log('Talk submitted:', data);
      
      // カスタムイベントを発火
      const event = new CustomEvent('lightningtalk:talk-submission', {
        detail: data,
        bubbles: true
      });
      document.dispatchEvent(event);
    });

    // フィルターフック
    addFilter('lightningtalk_form_data', 'lightningtalk/theme', (data: any) => {
      // フォームデータの前処理
      return {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'modern-theme'
      };
    });
  }
}

/**
 * Gutenberg ブロックエディターとの統合
 */
function setupGutenbergIntegration(): void {
  // Gutenberg が利用可能かチェック
  if (typeof (window as any).wp !== 'undefined' && (window as any).wp.blocks) {
    const { registerBlockType } = (window as any).wp.blocks;
    const { createElement } = (window as any).wp.element;

    // Lightning Talk イベント表示ブロック
    registerBlockType('lightningtalk/event-display', {
      title: 'Lightning Talk Event',
      category: 'widgets',
      icon: 'microphone',
      attributes: {
        eventId: {
          type: 'string',
          default: ''
        },
        displayType: {
          type: 'string',
          default: 'card'
        }
      },
      edit: (props: any) => {
        const { attributes, setAttributes } = props;
        
        return createElement('div', {
          className: 'lightningtalk-block-editor'
        }, [
          createElement('h3', { key: 'title' }, 'Lightning Talk Event'),
          createElement('p', { key: 'desc' }, 'Event ID: ' + (attributes.eventId || 'Not set'))
        ]);
      },
      save: (props: any) => {
        const { attributes } = props;
        
        return createElement('div', {
          className: 'lightningtalk-event-block',
          'data-event-id': attributes.eventId,
          'data-display-type': attributes.displayType
        });
      }
    });

    // Lightning Talk 登録フォームブロック
    registerBlockType('lightningtalk/registration-form', {
      title: 'Lightning Talk Registration',
      category: 'widgets',
      icon: 'forms',
      attributes: {
        eventId: {
          type: 'string',
          default: ''
        }
      },
      edit: (props: any) => {
        return createElement('div', {
          className: 'lightningtalk-block-editor'
        }, [
          createElement('h3', { key: 'title' }, 'Lightning Talk Registration Form'),
          createElement('p', { key: 'desc' }, 'Registration form will appear here on frontend')
        ]);
      },
      save: (props: any) => {
        const { attributes } = props;
        
        return createElement('div', {
          id: 'lightningtalk-registration',
          'data-event-id': attributes.eventId
        });
      }
    });
  }
}

/**
 * カスタマイザーとの統合
 */
function setupCustomizerIntegration(): void {
  // WordPress カスタマイザー API との連携
  if (typeof (window as any).wp !== 'undefined' && (window as any).wp.customize) {
    const customize = (window as any).wp.customize;

    // カスタマイザー設定の監視
    if (customize.preview) {
      customize.preview.bind('lightningtalk-settings-changed', (data: any) => {
        console.log('Customizer settings changed:', data);
        
        // 設定に応じてテーマの表示を更新
        updateThemeSettings(data);
      });
    }
  }
}

/**
 * テーマ設定の更新
 */
function updateThemeSettings(settings: any): void {
  // カラースキームの更新
  if (settings.colorScheme) {
    document.documentElement.setAttribute('data-color-scheme', settings.colorScheme);
  }

  // タイポグラフィの更新
  if (settings.typography) {
    const style = document.createElement('style');
    style.id = 'lightningtalk-custom-typography';
    style.textContent = `
      :root {
        --font-family-primary: ${settings.typography.primaryFont};
        --font-size-base: ${settings.typography.baseSize}px;
      }
    `;
    
    // 既存のスタイルを削除して新しいものを追加
    const existing = document.getElementById('lightningtalk-custom-typography');
    if (existing) existing.remove();
    document.head.appendChild(style);
  }
}

/**
 * SEO最適化
 */
function setupSEOOptimizations(): void {
  // 構造化データの追加
  addStructuredData();
  
  // メタタグの最適化
  optimizeMetaTags();
  
  // Open Graph の設定
  setupOpenGraph();
}

/**
 * 構造化データの追加
 */
function addStructuredData(): void {
  const events = document.querySelectorAll('[data-event-id]');
  
  events.forEach(eventElement => {
    const eventId = eventElement.getAttribute('data-event-id');
    if (!eventId) return;

    // イベント情報を取得してJSON-LDを生成
    fetchEventData(eventId).then(eventData => {
      if (eventData) {
        const structuredData = {
          "@context": "https://schema.org",
          "@type": "Event",
          "name": eventData.title,
          "description": eventData.description,
          "startDate": eventData.date,
          "location": {
            "@type": "Place",
            "name": eventData.venue
          },
          "organizer": {
            "@type": "Organization",
            "name": "Lightning Talk Circle"
          }
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
      }
    });
  });
}

/**
 * イベントデータの取得
 */
async function fetchEventData(eventId: string): Promise<any> {
  try {
    const wpData = window.wpLightningTalk;
    if (!wpData) return null;

    const response = await fetch(`${wpData.apiUrl}lightningtalk/v1/events/${eventId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch event data:', error);
  }
  return null;
}

/**
 * メタタグの最適化
 */
function optimizeMetaTags(): void {
  // ビューポートの最適化
  let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }
  viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';

  // テーマカラーの設定
  let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    document.head.appendChild(themeColor);
  }
  themeColor.content = '#2271b1'; // WordPress ブルー
}

/**
 * Open Graph の設定
 */
function setupOpenGraph(): void {
  // Lightning Talk 固有のOG設定
  const ogTags = [
    { property: 'og:site_name', content: 'Lightning Talk Circle' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@lightningtalk' }
  ];

  ogTags.forEach(tag => {
    const key = tag.property || tag.name;
    const existing = document.querySelector(`meta[${tag.property ? 'property' : 'name'}="${key}"]`);
    
    if (!existing) {
      const meta = document.createElement('meta');
      if (tag.property) meta.setAttribute('property', tag.property);
      if (tag.name) meta.setAttribute('name', tag.name);
      meta.content = tag.content;
      document.head.appendChild(meta);
    }
  });
}

/**
 * アクセシビリティ機能
 */
function setupAccessibilityFeatures(): void {
  // スキップリンクの追加
  addSkipLinks();
  
  // フォーカス管理
  setupFocusManagement();
  
  // ARIA ラベルの動的更新
  setupDynamicARIA();
}

/**
 * スキップリンクの追加
 */
function addSkipLinks(): void {
  const skipLinks = document.createElement('div');
  skipLinks.className = 'skip-links';
  skipLinks.innerHTML = `
    <a href="#main" class="skip-link">メインコンテンツにスキップ</a>
    <a href="#navigation" class="skip-link">ナビゲーションにスキップ</a>
  `;
  document.body.insertBefore(skipLinks, document.body.firstChild);
}

/**
 * フォーカス管理
 */
function setupFocusManagement(): void {
  // モーダルが開いた時のフォーカストラップ
  document.addEventListener('lightningtalk:modal-open', (event: CustomEvent) => {
    const modal = event.detail.modal;
    if (modal) {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  });
}

/**
 * 動的 ARIA ラベルの設定
 */
function setupDynamicARIA(): void {
  // 読み込み状態の ARIA ラベル更新
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // ローディングスピナーの ARIA ラベル
            if (element.classList.contains('loading-spinner')) {
              element.setAttribute('aria-label', '読み込み中');
              element.setAttribute('role', 'status');
            }
            
            // エラーメッセージの ARIA ラベル
            if (element.classList.contains('error-message')) {
              element.setAttribute('role', 'alert');
              element.setAttribute('aria-live', 'polite');
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}