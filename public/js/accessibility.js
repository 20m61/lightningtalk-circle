/**
 * Lightning Talk Circle - Accessibility Enhancement
 * WCAG 2.1 AA準拠のアクセシビリティ機能
 */

class AccessibilityEnhancer {
  constructor() {
    this.init();
  }

  init() {
    // ページ読み込み完了後に初期化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupAccessibility());
    } else {
      this.setupAccessibility();
    }
  }

  setupAccessibility() {
    // WAI-ARIA属性の自動設定
    this.setupAriaAttributes();
    
    // フォーカス管理の強化
    this.enhanceFocusManagement();
    
    // キーボードナビゲーション
    this.setupKeyboardNavigation();
    
    // スクリーンリーダー対応
    this.setupScreenReaderSupport();
    
    // カラーコントラスト監視
    this.monitorColorContrast();
    
    // アニメーション制御
    this.setupMotionControls();
    
    // フォーム改善
    this.enhanceFormAccessibility();
    
    // 画像とメディアの改善
    this.enhanceMediaAccessibility();
    
    // ランドマークの設定
    this.setupLandmarks();
    
    // ライブリージョンの設定
    this.setupLiveRegions();
  }

  /**
   * WAI-ARIA属性の自動設定
   */
  setupAriaAttributes() {
    // ボタンのaria-label設定
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
      const text = button.textContent?.trim() || button.title;
      if (text) {
        button.setAttribute('aria-label', text);
      }
    });

    // リンクのaria-label設定
    document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])').forEach(link => {
      const text = link.textContent?.trim();
      if (!text || text.length < 3) {
        const title = link.title || link.href;
        if (title) {
          link.setAttribute('aria-label', title);
        }
      }
    });

    // モーダルのaria属性
    document.querySelectorAll('.modal').forEach(modal => {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      
      const title = modal.querySelector('.modal-title, h1, h2, h3');
      if (title && !modal.hasAttribute('aria-labelledby')) {
        if (!title.id) {
          title.id = `modal-title-${Date.now()}`;
        }
        modal.setAttribute('aria-labelledby', title.id);
      }
    });

    // タブパネルのaria属性
    document.querySelectorAll('.tab-panel, .tabpanel').forEach(panel => {
      panel.setAttribute('role', 'tabpanel');
      if (!panel.hasAttribute('aria-labelledby')) {
        const tabId = panel.id ? panel.id.replace('-panel', '-tab') : null;
        if (tabId) {
          panel.setAttribute('aria-labelledby', tabId);
        }
      }
    });

    // ナビゲーションのaria-current
    this.setupAriaCurrent();
  }

  /**
   * aria-current属性の設定
   */
  setupAriaCurrent() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('nav a').forEach(link => {
      const linkPath = new URL(link.href, window.location.origin).pathname;
      if (linkPath === currentPath) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /**
   * フォーカス管理の強化
   */
  enhanceFocusManagement() {
    // フォーカス可能要素の定義
    this.focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'details summary',
      '[contenteditable="true"]'
    ].join(', ');

    // フォーカストラップの実装
    this.setupFocusTrap();
    
    // フォーカス表示の強化
    this.enhanceFocusVisibility();
    
    // スキップリンクの追加
    this.addSkipLinks();
  }

  /**
   * フォーカストラップの実装
   */
  setupFocusTrap() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const activeModal = document.querySelector('.modal[aria-modal="true"]:not([style*="display: none"])');
        if (activeModal) {
          this.trapFocusInElement(e, activeModal);
        }
      }
    });
  }

  /**
   * 要素内でのフォーカストラップ
   */
  trapFocusInElement(event, element) {
    const focusableElements = element.querySelectorAll(this.focusableSelectors);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * フォーカス表示の強化
   */
  enhanceFocusVisibility() {
    // マウス使用時のフォーカス表示を抑制
    let isMouseUser = false;
    
    document.addEventListener('mousedown', () => {
      isMouseUser = true;
      document.body.classList.add('mouse-user');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isMouseUser = false;
        document.body.classList.remove('mouse-user');
      }
    });

    // フォーカス時のスタイル適用
    document.addEventListener('focusin', (e) => {
      if (!isMouseUser) {
        e.target.classList.add('keyboard-focused');
      }
    });

    document.addEventListener('focusout', (e) => {
      e.target.classList.remove('keyboard-focused');
    });
  }

  /**
   * スキップリンクの追加
   */
  addSkipLinks() {
    const skipLinks = document.createElement('nav');
    skipLinks.className = 'skip-links';
    skipLinks.setAttribute('aria-label', 'スキップリンク');
    
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">メインコンテンツへスキップ</a>
      <a href="#navigation" class="skip-link">ナビゲーションへスキップ</a>
      <a href="#footer" class="skip-link">フッターへスキップ</a>
    `;

    document.body.insertBefore(skipLinks, document.body.firstChild);

    // ターゲット要素にIDを設定
    this.ensureSkipTargets();
  }

  /**
   * スキップリンクのターゲット要素確保
   */
  ensureSkipTargets() {
    const targets = [
      { selector: 'main, .main-content, #main', id: 'main-content' },
      { selector: 'nav, .navigation, #navigation', id: 'navigation' },
      { selector: 'footer, .footer, #footer', id: 'footer' }
    ];

    targets.forEach(({ selector, id }) => {
      const element = document.querySelector(selector);
      if (element && !element.id) {
        element.id = id;
      }
    });
  }

  /**
   * キーボードナビゲーション
   */
  setupKeyboardNavigation() {
    // Escapeキーでモーダル/ドロップダウンを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }
    });

    // Enter/Spaceキーでボタン動作
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'button') {
        e.preventDefault();
        e.target.click();
      }
    });

    // 矢印キーでのナビゲーション
    this.setupArrowKeyNavigation();
  }

  /**
   * Escapeキーの処理
   */
  handleEscapeKey() {
    // アクティブなモーダルを閉じる
    const activeModal = document.querySelector('.modal[aria-modal="true"]:not([style*="display: none"])');
    if (activeModal) {
      const closeButton = activeModal.querySelector('.modal-close, [data-dismiss="modal"]');
      if (closeButton) {
        closeButton.click();
        return;
      }
    }

    // 開いているドロップダウンを閉じる
    const openDropdowns = document.querySelectorAll('.dropdown.open, .dropdown.show');
    openDropdowns.forEach(dropdown => {
      dropdown.classList.remove('open', 'show');
    });

    // メニューを閉じる
    const openMenus = document.querySelectorAll('.nav-menu.active, .mobile-menu.active');
    openMenus.forEach(menu => {
      menu.classList.remove('active');
    });
  }

  /**
   * 矢印キーナビゲーション
   */
  setupArrowKeyNavigation() {
    // タブリスト内の矢印キーナビゲーション
    document.querySelectorAll('[role="tablist"]').forEach(tablist => {
      const tabs = tablist.querySelectorAll('[role="tab"]');
      
      tablist.addEventListener('keydown', (e) => {
        const currentIndex = Array.from(tabs).indexOf(e.target);
        let targetIndex;

        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            targetIndex = (currentIndex + 1) % tabs.length;
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            break;
          case 'Home':
            targetIndex = 0;
            break;
          case 'End':
            targetIndex = tabs.length - 1;
            break;
          default:
            return;
        }

        e.preventDefault();
        tabs[targetIndex].focus();
      });
    });
  }

  /**
   * スクリーンリーダー対応
   */
  setupScreenReaderSupport() {
    // ライブリージョンの作成
    this.createAnnouncer();
    
    // ページタイトルの動的更新
    this.setupDynamicTitles();
    
    // 状態変更のアナウンス
    this.setupStateAnnouncements();
  }

  /**
   * アナウンサーの作成
   */
  createAnnouncer() {
    if (!document.getElementById('accessibility-announcer')) {
      const announcer = document.createElement('div');
      announcer.id = 'accessibility-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }

    // グローバルアナウンス関数
    window.announceToScreenReader = (message, priority = 'polite') => {
      const announcer = document.getElementById('accessibility-announcer');
      if (announcer) {
        announcer.setAttribute('aria-live', priority);
        announcer.textContent = message;
        
        // メッセージをクリア
        setTimeout(() => {
          announcer.textContent = '';
        }, 1000);
      }
    };
  }

  /**
   * 動的タイトル更新
   */
  setupDynamicTitles() {
    // SPA風のページ遷移時のタイトル更新
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const newTitle = document.querySelector('h1');
          if (newTitle && newTitle !== this.lastTitle) {
            this.lastTitle = newTitle;
            window.announceToScreenReader(`ページが変更されました: ${newTitle.textContent}`);
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * 状態変更のアナウンス
   */
  setupStateAnnouncements() {
    // フォーム送信状態
    document.addEventListener('submit', (e) => {
      window.announceToScreenReader('フォームを送信中です');
    });

    // 読み込み状態
    const loadingObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList?.contains('loading')) {
            window.announceToScreenReader('読み込み中です');
          }
        });
      });
    });

    loadingObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * カラーコントラスト監視
   */
  monitorColorContrast() {
    // ハイコントラストモードの検出
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      document.body.classList.add('high-contrast');
    }

    // コントラスト設定の変更を監視
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      document.body.classList.toggle('high-contrast', e.matches);
    });

    // カスタムコントラスト調整
    this.addContrastControls();
  }

  /**
   * コントラスト調整コントロール
   */
  addContrastControls() {
    const contrastControl = document.createElement('div');
    contrastControl.className = 'contrast-control';
    contrastControl.innerHTML = `
      <button type="button" class="contrast-toggle" aria-label="高コントラストモード切り替え">
        <span aria-hidden="true">🌓</span>
        コントラスト
      </button>
    `;

    contrastControl.addEventListener('click', () => {
      const isHighContrast = document.body.classList.toggle('user-high-contrast');
      localStorage.setItem('high-contrast-mode', isHighContrast);
      window.announceToScreenReader(
        isHighContrast ? '高コントラストモードが有効になりました' : '高コントラストモードが無効になりました'
      );
    });

    // 設定の復元
    if (localStorage.getItem('high-contrast-mode') === 'true') {
      document.body.classList.add('user-high-contrast');
    }

    document.body.appendChild(contrastControl);
  }

  /**
   * アニメーション制御
   */
  setupMotionControls() {
    // prefers-reduced-motionの適用
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduce-motion');
    }

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      document.body.classList.toggle('reduce-motion', e.matches);
    });

    // ユーザー制御可能なアニメーション設定
    this.addMotionControls();
  }

  /**
   * アニメーション制御コントロール
   */
  addMotionControls() {
    const motionControl = document.createElement('div');
    motionControl.className = 'motion-control';
    motionControl.innerHTML = `
      <button type="button" class="motion-toggle" aria-label="アニメーション切り替え">
        <span aria-hidden="true">🎭</span>
        アニメーション
      </button>
    `;

    motionControl.addEventListener('click', () => {
      const reduceMotion = document.body.classList.toggle('user-reduce-motion');
      localStorage.setItem('reduce-motion', reduceMotion);
      window.announceToScreenReader(
        reduceMotion ? 'アニメーションが無効になりました' : 'アニメーションが有効になりました'
      );
    });

    // 設定の復元
    if (localStorage.getItem('reduce-motion') === 'true') {
      document.body.classList.add('user-reduce-motion');
    }

    document.body.appendChild(motionControl);
  }

  /**
   * フォームアクセシビリティの強化
   */
  enhanceFormAccessibility() {
    // フォームコントロールとラベルの関連付け
    this.associateLabelsWithControls();
    
    // エラーメッセージの改善
    this.enhanceFormErrors();
    
    // 必須フィールドの明示
    this.markRequiredFields();
    
    // フォーム説明の追加
    this.addFormDescriptions();
  }

  /**
   * ラベルとコントロールの関連付け
   */
  associateLabelsWithControls() {
    document.querySelectorAll('input, select, textarea').forEach(control => {
      if (!control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')) {
        // 隣接するラベルを探す
        const label = control.previousElementSibling?.tagName === 'LABEL' 
          ? control.previousElementSibling
          : control.parentElement?.querySelector('label');
        
        if (label) {
          const labelId = label.id || `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          label.id = labelId;
          control.setAttribute('aria-labelledby', labelId);
        }
      }
    });
  }

  /**
   * フォームエラーの改善
   */
  enhanceFormErrors() {
    document.addEventListener('invalid', (e) => {
      const input = e.target;
      const errorMessage = this.getErrorMessage(input);
      
      // エラーメッセージ要素の作成または更新
      let errorElement = document.getElementById(`${input.id}-error`);
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = `${input.id}-error`;
        errorElement.className = 'error-message';
        errorElement.setAttribute('role', 'alert');
        input.parentElement.appendChild(errorElement);
      }
      
      errorElement.textContent = errorMessage;
      input.setAttribute('aria-describedby', errorElement.id);
      input.setAttribute('aria-invalid', 'true');
      
      // スクリーンリーダーへの通知
      window.announceToScreenReader(`エラー: ${errorMessage}`, 'assertive');
    });

    // エラー解消時の処理
    document.addEventListener('input', (e) => {
      const input = e.target;
      if (input.getAttribute('aria-invalid') === 'true' && input.validity.valid) {
        input.removeAttribute('aria-invalid');
        const errorElement = document.getElementById(`${input.id}-error`);
        if (errorElement) {
          errorElement.remove();
        }
      }
    });
  }

  /**
   * エラーメッセージの取得
   */
  getErrorMessage(input) {
    if (input.validity.valueMissing) {
      return `${this.getFieldName(input)}は必須項目です`;
    }
    if (input.validity.typeMismatch) {
      return `${this.getFieldName(input)}の形式が正しくありません`;
    }
    if (input.validity.tooShort) {
      return `${this.getFieldName(input)}は${input.minLength}文字以上で入力してください`;
    }
    if (input.validity.tooLong) {
      return `${this.getFieldName(input)}は${input.maxLength}文字以下で入力してください`;
    }
    if (input.validity.rangeUnderflow) {
      return `${this.getFieldName(input)}は${input.min}以上で入力してください`;
    }
    if (input.validity.rangeOverflow) {
      return `${this.getFieldName(input)}は${input.max}以下で入力してください`;
    }
    if (input.validity.patternMismatch) {
      return `${this.getFieldName(input)}の形式が正しくありません`;
    }
    return `${this.getFieldName(input)}の値が正しくありません`;
  }

  /**
   * フィールド名の取得
   */
  getFieldName(input) {
    const label = document.querySelector(`label[for="${input.id}"]`) 
      || input.previousElementSibling?.tagName === 'LABEL' ? input.previousElementSibling : null;
    return label?.textContent?.replace(/[*:：]/g, '').trim() || input.name || 'このフィールド';
  }

  /**
   * 必須フィールドの明示
   */
  markRequiredFields() {
    document.querySelectorAll('[required]').forEach(field => {
      const label = document.querySelector(`label[for="${field.id}"]`) 
        || field.previousElementSibling?.tagName === 'LABEL' ? field.previousElementSibling : null;
      
      if (label && !label.querySelector('.required-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'required-indicator';
        indicator.textContent = ' *';
        indicator.setAttribute('aria-label', '必須');
        label.appendChild(indicator);
      }
      
      field.setAttribute('aria-required', 'true');
    });
  }

  /**
   * フォーム説明の追加
   */
  addFormDescriptions() {
    document.querySelectorAll('form').forEach(form => {
      if (!form.querySelector('.form-description')) {
        const description = document.createElement('p');
        description.className = 'form-description';
        description.textContent = '*印は必須項目です。';
        form.insertBefore(description, form.firstChild);
      }
    });
  }

  /**
   * メディアアクセシビリティの強化
   */
  enhanceMediaAccessibility() {
    // 画像のalt属性チェック
    this.checkImageAltTexts();
    
    // 動画のコントロール確保
    this.ensureVideoControls();
    
    // 音声の自動再生防止
    this.preventAutoplay();
  }

  /**
   * 画像alt属性のチェック
   */
  checkImageAltTexts() {
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('alt')) {
        // 装飾画像の場合は空のalt属性
        if (img.closest('.decoration, .icon') || img.classList.contains('decoration')) {
          img.setAttribute('alt', '');
        } else {
          // 意味のある画像の場合はファイル名から推測
          const filename = img.src.split('/').pop().split('.')[0];
          img.setAttribute('alt', filename.replace(/[-_]/g, ' '));
        }
      }
    });
  }

  /**
   * 動画コントロールの確保
   */
  ensureVideoControls() {
    document.querySelectorAll('video').forEach(video => {
      video.setAttribute('controls', '');
      
      // キーボードアクセス可能性
      if (!video.hasAttribute('tabindex')) {
        video.setAttribute('tabindex', '0');
      }
    });
  }

  /**
   * 自動再生の防止
   */
  preventAutoplay() {
    document.querySelectorAll('video[autoplay], audio[autoplay]').forEach(media => {
      if (!media.muted) {
        media.removeAttribute('autoplay');
        console.warn('Autoplay removed from media element for accessibility');
      }
    });
  }

  /**
   * ランドマークの設定
   */
  setupLandmarks() {
    // セマンティック要素のrole属性確保
    const landmarks = [
      { selector: 'header:not([role])', role: 'banner' },
      { selector: 'nav:not([role])', role: 'navigation' },
      { selector: 'main:not([role])', role: 'main' },
      { selector: 'aside:not([role])', role: 'complementary' },
      { selector: 'footer:not([role])', role: 'contentinfo' }
    ];

    landmarks.forEach(({ selector, role }) => {
      document.querySelectorAll(selector).forEach(element => {
        element.setAttribute('role', role);
      });
    });

    // ナビゲーションのラベル付け
    document.querySelectorAll('nav').forEach((nav, index) => {
      if (!nav.hasAttribute('aria-label') && !nav.hasAttribute('aria-labelledby')) {
        const heading = nav.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) {
          if (!heading.id) {
            heading.id = `nav-heading-${index}`;
          }
          nav.setAttribute('aria-labelledby', heading.id);
        } else {
          nav.setAttribute('aria-label', `ナビゲーション ${index + 1}`);
        }
      }
    });
  }

  /**
   * ライブリージョンの設定
   */
  setupLiveRegions() {
    // 通知エリア
    document.querySelectorAll('.notification, .alert, .status').forEach(element => {
      if (!element.hasAttribute('aria-live')) {
        element.setAttribute('aria-live', 'polite');
      }
    });

    // 重要な通知
    document.querySelectorAll('.error, .warning').forEach(element => {
      element.setAttribute('aria-live', 'assertive');
    });

    // 検索結果など
    document.querySelectorAll('.search-results, .filter-results').forEach(element => {
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
    });
  }
}

// スタイルの追加
const accessibilityStyles = `
<style>
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.skip-links {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9999;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 0 0 4px 4px;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
}

.keyboard-focused {
  outline: 2px solid #0066ff !important;
  outline-offset: 2px !important;
}

.mouse-user *:focus {
  outline: none;
}

.high-contrast,
.user-high-contrast {
  filter: contrast(150%);
}

.high-contrast *,
.user-high-contrast * {
  border-color: currentColor !important;
  text-shadow: none !important;
  box-shadow: none !important;
}

.reduce-motion *,
.user-reduce-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

.required-indicator {
  color: #d32f2f;
  font-weight: bold;
}

.error-message {
  color: #d32f2f;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.contrast-control,
.motion-control {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  padding: 0.5rem;
}

.contrast-control + .motion-control {
  top: 60px;
}

.contrast-toggle,
.motion-toggle {
  background: transparent;
  border: 1px solid #fff;
  color: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.contrast-toggle:hover,
.motion-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-contrast: high) {
  * {
    filter: contrast(150%);
  }
}

[aria-invalid="true"] {
  border-color: #d32f2f !important;
}

[role="alert"] {
  padding: 0.75rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  margin: 0.5rem 0;
}

[role="alert"][aria-live="assertive"] {
  background: #f8d7da;
  border-color: #f5c6cb;
}
</style>
`;

// スタイルをheadに追加
if (!document.getElementById('accessibility-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'accessibility-styles';
  styleElement.textContent = accessibilityStyles.replace(/<\/?style>/g, '');
  document.head.appendChild(styleElement);
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  window.accessibilityEnhancer = new AccessibilityEnhancer();
});

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityEnhancer;
}