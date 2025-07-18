/**
 * Unified Component System
 * CSS/Reactコンポーネントの統合管理システム
 */

class UnifiedComponentSystem {
  constructor() {
    this.components = new Map();
    this.designTokens = this.loadDesignTokens();
    this.componentStyles = new Map();
    this.reactComponents = new Map();
    this.initializeSystem();
  }

  /**
   * デザイントークンの読み込み
   */
  loadDesignTokens() {
    // CSSカスタムプロパティから値を取得
    const computedStyle = getComputedStyle(document.documentElement);
    const tokens = {
      colors: {
        primary: computedStyle.getPropertyValue('--color-primary').trim() || '#ff6b35',
        primaryDark: computedStyle.getPropertyValue('--color-primary-dark').trim() || '#e55a2b',
        secondary: computedStyle.getPropertyValue('--color-secondary').trim() || '#4ecdc4',
        success: computedStyle.getPropertyValue('--color-success').trim() || '#22c55e',
        error: computedStyle.getPropertyValue('--color-error').trim() || '#ef4444',
        warning: computedStyle.getPropertyValue('--color-warning').trim() || '#f59e0b',
        info: computedStyle.getPropertyValue('--color-info').trim() || '#3b82f6'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem'
      },
      typography: {
        fontFamily:
          computedStyle.getPropertyValue('--font-family-sans').trim() ||
          '"Noto Sans JP", -apple-system, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem'
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75
        }
      },
      animation: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          linear: 'linear',
          ease: 'ease',
          easeIn: 'ease-in',
          easeOut: 'ease-out',
          easeInOut: 'ease-in-out'
        }
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      borders: {
        radius: {
          none: '0',
          sm: '0.125rem',
          base: '0.25rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
          '2xl': '1rem',
          full: '9999px'
        }
      }
    };

    return tokens;
  }

  /**
   * システムの初期化
   */
  initializeSystem() {
    this.defineBaseComponents();
    this.setupAnimations();
    this.injectStyles();
  }

  /**
   * 基本コンポーネントの定義
   */
  defineBaseComponents() {
    // ボタンコンポーネント
    this.registerComponent('Button', {
      props: {
        variant: ['primary', 'secondary', 'success', 'danger', 'outline'],
        size: ['sm', 'md', 'lg'],
        fullWidth: Boolean,
        disabled: Boolean,
        loading: Boolean
      },
      styles: this.generateButtonStyles(),
      render: this.createButtonRenderer()
    });

    // カードコンポーネント
    this.registerComponent('Card', {
      props: {
        variant: ['default', 'elevated', 'outlined'],
        padding: ['none', 'sm', 'md', 'lg'],
        interactive: Boolean
      },
      styles: this.generateCardStyles(),
      render: this.createCardRenderer()
    });

    // 入力フィールドコンポーネント
    this.registerComponent('Input', {
      props: {
        type: ['text', 'email', 'password', 'number', 'search'],
        size: ['sm', 'md', 'lg'],
        error: Boolean,
        fullWidth: Boolean
      },
      styles: this.generateInputStyles(),
      render: this.createInputRenderer()
    });

    // モーダルコンポーネント
    this.registerComponent('Modal', {
      props: {
        size: ['sm', 'md', 'lg', 'xl'],
        centered: Boolean,
        closeOnOverlay: Boolean
      },
      styles: this.generateModalStyles(),
      render: this.createModalRenderer()
    });

    // アラートコンポーネント
    this.registerComponent('Alert', {
      props: {
        type: ['info', 'success', 'warning', 'error'],
        dismissible: Boolean,
        icon: Boolean
      },
      styles: this.generateAlertStyles(),
      render: this.createAlertRenderer()
    });
  }

  /**
   * コンポーネントの登録
   */
  registerComponent(name, config) {
    this.components.set(name, config);
    this.componentStyles.set(name, config.styles);
  }

  /**
   * ボタンスタイルの生成
   */
  generateButtonStyles() {
    const { colors, spacing, typography, animation, borders, shadows } = this.designTokens;

    return `
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: ${typography.fontFamily};
        font-weight: ${typography.fontWeight.medium};
        border: 2px solid transparent;
        cursor: pointer;
        transition: all ${animation.duration.normal} ${animation.easing.easeOut};
        position: relative;
        overflow: hidden;
        text-decoration: none;
        white-space: nowrap;
        user-select: none;
      }

      /* サイズバリエーション */
      .btn-sm {
        padding: ${spacing.xs} ${spacing.md};
        font-size: ${typography.fontSize.sm};
        border-radius: ${borders.radius.md};
      }

      .btn-md {
        padding: ${spacing.sm} ${spacing.lg};
        font-size: ${typography.fontSize.base};
        border-radius: ${borders.radius.lg};
      }

      .btn-lg {
        padding: ${spacing.md} ${spacing.xl};
        font-size: ${typography.fontSize.lg};
        border-radius: ${borders.radius.xl};
      }

      /* バリアントスタイル */
      .btn-primary {
        background: ${colors.primary};
        color: white;
        box-shadow: ${shadows.md};
      }

      .btn-primary:hover:not(:disabled) {
        background: ${colors.primaryDark};
        transform: translateY(-2px);
        box-shadow: ${shadows.lg};
      }

      .btn-primary:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: ${shadows.sm};
      }

      .btn-secondary {
        background: ${colors.secondary};
        color: white;
        box-shadow: ${shadows.md};
      }

      .btn-success {
        background: ${colors.success};
        color: white;
        box-shadow: ${shadows.md};
      }

      .btn-danger {
        background: ${colors.error};
        color: white;
        box-shadow: ${shadows.md};
      }

      .btn-outline {
        background: transparent;
        color: ${colors.primary};
        border-color: ${colors.primary};
      }

      .btn-outline:hover:not(:disabled) {
        background: ${colors.primary};
        color: white;
      }

      /* 状態スタイル */
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
      }

      .btn-loading {
        color: transparent;
      }

      .btn-loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        top: 50%;
        left: 50%;
        margin-left: -8px;
        margin-top: -8px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: btn-spin 0.8s linear infinite;
      }

      @keyframes btn-spin {
        to { transform: rotate(360deg); }
      }

      .btn-full {
        width: 100%;
      }

      /* リップルエフェクト */
      .btn-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
      }

      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
  }

  /**
   * カードスタイルの生成
   */
  generateCardStyles() {
    const { colors, spacing, borders, shadows } = this.designTokens;

    return `
      .card {
        background: white;
        border-radius: ${borders.radius.xl};
        transition: all 0.3s ease;
      }

      .card-default {
        box-shadow: ${shadows.base};
      }

      .card-elevated {
        box-shadow: ${shadows.lg};
      }

      .card-elevated:hover {
        transform: translateY(-4px);
        box-shadow: ${shadows.xl};
      }

      .card-outlined {
        border: 1px solid #e2e8f0;
        box-shadow: none;
      }

      .card-interactive {
        cursor: pointer;
      }

      .card-interactive:hover {
        transform: translateY(-2px);
        box-shadow: ${shadows.lg};
      }

      /* パディングバリエーション */
      .card-padding-sm { padding: ${spacing.sm}; }
      .card-padding-md { padding: ${spacing.md}; }
      .card-padding-lg { padding: ${spacing.lg}; }
    `;
  }

  /**
   * 入力フィールドスタイルの生成
   */
  generateInputStyles() {
    const { colors, spacing, typography, borders } = this.designTokens;

    return `
      .input {
        font-family: ${typography.fontFamily};
        border: 2px solid #e2e8f0;
        background: white;
        transition: all 0.2s ease;
        width: 100%;
      }

      .input:focus {
        outline: none;
        border-color: ${colors.primary};
        box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
      }

      /* サイズバリエーション */
      .input-sm {
        padding: ${spacing.xs} ${spacing.sm};
        font-size: ${typography.fontSize.sm};
        border-radius: ${borders.radius.md};
      }

      .input-md {
        padding: ${spacing.sm} ${spacing.md};
        font-size: ${typography.fontSize.base};
        border-radius: ${borders.radius.lg};
      }

      .input-lg {
        padding: ${spacing.md} ${spacing.lg};
        font-size: ${typography.fontSize.lg};
        border-radius: ${borders.radius.xl};
      }

      /* エラー状態 */
      .input-error {
        border-color: ${colors.error};
      }

      .input-error:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    `;
  }

  /**
   * モーダルスタイルの生成
   */
  generateModalStyles() {
    const { spacing, borders, shadows } = this.designTokens;

    return `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease;
      }

      .modal {
        background: white;
        border-radius: ${borders.radius['2xl']};
        box-shadow: ${shadows.xl};
        max-height: 90vh;
        overflow-y: auto;
        animation: slideUp 0.3s ease;
      }

      /* サイズバリエーション */
      .modal-sm { width: 90%; max-width: 400px; }
      .modal-md { width: 90%; max-width: 600px; }
      .modal-lg { width: 90%; max-width: 800px; }
      .modal-xl { width: 90%; max-width: 1200px; }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
  }

  /**
   * アラートスタイルの生成
   */
  generateAlertStyles() {
    const { colors, spacing, borders, typography } = this.designTokens;

    return `
      .alert {
        padding: ${spacing.md};
        border-radius: ${borders.radius.lg};
        font-size: ${typography.fontSize.base};
        display: flex;
        align-items: center;
        gap: ${spacing.sm};
        animation: slideIn 0.3s ease;
      }

      .alert-info {
        background: #dbeafe;
        color: #1e40af;
        border-left: 4px solid ${colors.info};
      }

      .alert-success {
        background: #d1fae5;
        color: #065f46;
        border-left: 4px solid ${colors.success};
      }

      .alert-warning {
        background: #fef3c7;
        color: #92400e;
        border-left: 4px solid ${colors.warning};
      }

      .alert-error {
        background: #fee2e2;
        color: #991b1b;
        border-left: 4px solid ${colors.error};
      }

      @keyframes slideIn {
        from {
          transform: translateX(-20px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
  }

  /**
   * アニメーションの設定
   */
  setupAnimations() {
    // GPUアクセラレーションを活用したアニメーション
    this.animationManager = {
      enableGPU: element => {
        element.style.willChange = 'transform, opacity';
        element.style.transform = 'translateZ(0)';
      },

      disableGPU: element => {
        element.style.willChange = 'auto';
      },

      animate: (element, keyframes, options = {}) => {
        const defaultOptions = {
          duration: 300,
          easing: 'ease-out',
          fill: 'forwards'
        };

        this.enableGPU(element);
        const animation = element.animate(keyframes, { ...defaultOptions, ...options });

        animation.onfinish = () => {
          this.disableGPU(element);
        };

        return animation;
      }
    };
  }

  /**
   * スタイルの注入
   */
  injectStyles() {
    const styleElement = document.createElement('style');
    styleElement.id = 'unified-component-styles';

    let styles = '';
    this.componentStyles.forEach(style => {
      styles += style + '\n';
    });

    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  /**
   * ボタンレンダラーの作成
   */
  createButtonRenderer() {
    return (props = {}, children = '') => {
      const {
        variant = 'primary',
        size = 'md',
        fullWidth = false,
        disabled = false,
        loading = false,
        onClick = () => {},
        className = ''
      } = props;

      const classes = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth ? 'btn-full' : '',
        loading ? 'btn-loading' : '',
        className
      ]
        .filter(Boolean)
        .join(' ');

      const button = document.createElement('button');
      button.className = classes;
      button.disabled = disabled || loading;
      button.innerHTML = children;

      // リップルエフェクトの追加
      button.addEventListener('click', e => {
        if (disabled || loading) return;

        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.className = 'btn-ripple';

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
        onClick(e);
      });

      return button;
    };
  }

  /**
   * カードレンダラーの作成
   */
  createCardRenderer() {
    return (props = {}, children = '') => {
      const { variant = 'default', padding = 'md', interactive = false, className = '' } = props;

      const classes = [
        'card',
        `card-${variant}`,
        `card-padding-${padding}`,
        interactive ? 'card-interactive' : '',
        className
      ]
        .filter(Boolean)
        .join(' ');

      const card = document.createElement('div');
      card.className = classes;
      card.innerHTML = children;

      return card;
    };
  }

  /**
   * 入力フィールドレンダラーの作成
   */
  createInputRenderer() {
    return (props = {}) => {
      const {
        type = 'text',
        size = 'md',
        error = false,
        placeholder = '',
        value = '',
        onChange = () => {},
        className = ''
      } = props;

      const classes = ['input', `input-${size}`, error ? 'input-error' : '', className]
        .filter(Boolean)
        .join(' ');

      const input = document.createElement('input');
      input.type = type;
      input.className = classes;
      input.placeholder = placeholder;
      input.value = value;

      input.addEventListener('input', e => onChange(e.target.value, e));

      return input;
    };
  }

  /**
   * モーダルレンダラーの作成
   */
  createModalRenderer() {
    return (props = {}, children = '') => {
      const {
        size = 'md',
        centered = true,
        closeOnOverlay = true,
        onClose = () => {},
        className = ''
      } = props;

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';

      const modal = document.createElement('div');
      modal.className = `modal modal-${size} ${className}`;
      modal.innerHTML = children;

      if (closeOnOverlay) {
        overlay.addEventListener('click', e => {
          if (e.target === overlay) {
            onClose();
          }
        });
      }

      overlay.appendChild(modal);

      return overlay;
    };
  }

  /**
   * アラートレンダラーの作成
   */
  createAlertRenderer() {
    return (props = {}, children = '') => {
      const {
        type = 'info',
        dismissible = false,
        icon = true,
        onDismiss = () => {},
        className = ''
      } = props;

      const classes = ['alert', `alert-${type}`, className].filter(Boolean).join(' ');

      const alert = document.createElement('div');
      alert.className = classes;

      if (icon) {
        const iconMap = {
          info: 'ℹ️',
          success: '✅',
          warning: '⚠️',
          error: '❌'
        };
        const iconElement = document.createElement('span');
        iconElement.textContent = iconMap[type];
        alert.appendChild(iconElement);
      }

      const content = document.createElement('div');
      content.innerHTML = children;
      alert.appendChild(content);

      if (dismissible) {
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.marginLeft = 'auto';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '1.5rem';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => {
          alert.style.animation = 'slideOut 0.3s ease forwards';
          setTimeout(() => {
            alert.remove();
            onDismiss();
          }, 300);
        };
        alert.appendChild(closeButton);
      }

      return alert;
    };
  }

  /**
   * コンポーネントの作成（エラーハンドリング強化）
   */
  create(componentName, props, children) {
    try {
      const component = this.components.get(componentName);
      if (!component) {
        console.error(`Component '${componentName}' not found`);
        return this.createFallbackComponent(`Component '${componentName}' not found`);
      }

      const element = component.render(props, children);

      // メモリリーク防止のためのWeakMapでの追跡
      if (!this.componentInstances) {
        this.componentInstances = new WeakMap();
      }
      this.componentInstances.set(element, {
        name: componentName,
        createdAt: Date.now(),
        props: { ...props }
      });

      return element;
    } catch (error) {
      console.error(`Error creating component '${componentName}':`, error);
      return this.createFallbackComponent(`Error: ${error.message}`);
    }
  }

  /**
   * フォールバックコンポーネントの作成
   */
  createFallbackComponent(errorMessage) {
    const fallback = document.createElement('div');
    fallback.className = 'component-error';
    fallback.style.cssText = `
      padding: 1rem;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      color: #991b1b;
      font-family: monospace;
      font-size: 0.875rem;
    `;
    fallback.textContent = `⚠️ Component Error: ${errorMessage}`;

    // 開発環境でのみ表示
    if (process.env.NODE_ENV !== 'production') {
      return fallback;
    }

    // 本番環境では空のdivを返す
    return document.createElement('div');
  }

  /**
   * Reactコンポーネントとの統合
   */
  createReactWrapper(componentName) {
    // React環境での使用を想定したラッパー
    return props => {
      const ref = React.useRef(null);

      React.useEffect(() => {
        if (ref.current) {
          const element = this.create(componentName, props, props.children);
          ref.current.innerHTML = '';
          ref.current.appendChild(element);
        }
      }, [props]);

      return React.createElement('div', { ref });
    };
  }
}

// グローバルに公開
window.UnifiedComponentSystem = new UnifiedComponentSystem();

// 使用例
/*
const system = window.UnifiedComponentSystem;

// ボタンの作成
const button = system.create('Button', {
  variant: 'primary',
  size: 'lg',
  onClick: () => console.log('Clicked!'),
}, 'Click me');

// カードの作成
const card = system.create('Card', {
  variant: 'elevated',
  padding: 'lg',
  interactive: true,
}, '<h2>Card Title</h2><p>Card content</p>');

// アラートの作成
const alert = system.create('Alert', {
  type: 'success',
  dismissible: true,
  icon: true,
}, 'Operation completed successfully!');
*/
