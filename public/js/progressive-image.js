/**
 * Progressive Image Loading System
 * 画像の段階的読み込みとパフォーマンス最適化
 */

class ProgressiveImageLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.01,
      placeholderClass: options.placeholderClass || 'image-placeholder',
      loadedClass: options.loadedClass || 'image-loaded',
      errorClass: options.errorClass || 'image-error',
      enableBlurUp: options.enableBlurUp !== false,
      enableWebP: options.enableWebP !== false,
      enableAVIF: options.enableAVIF !== false,
      ...options
    };

    this.imageObserver = null;
    this.loadedImages = new Set();
    this.init();
  }

  init() {
    // Intersection Observer の設定
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver(entries => this.handleIntersection(entries), {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      });
    }

    // 初期画像の監視開始
    this.observeImages();

    // 動的に追加される画像の監視
    this.setupMutationObserver();

    // ネットワーク状態の監視
    this.setupNetworkMonitoring();
  }

  observeImages() {
    const images = document.querySelectorAll('[data-src]:not(.observed)');
    images.forEach(img => {
      img.classList.add('observed');

      if (this.imageObserver) {
        this.imageObserver.observe(img);
      } else {
        // Intersection Observer が使えない場合は即座に読み込み
        this.loadImage(img);
      }
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.loadedImages.has(entry.target)) {
        this.loadImage(entry.target);
        this.imageObserver.unobserve(entry.target);
      }
    });
  }

  async loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    const sizes = img.dataset.sizes;
    const placeholder = img.dataset.placeholder;

    if (!src) return;

    // すでに読み込み済みの画像はスキップ
    if (this.loadedImages.has(img)) return;
    this.loadedImages.add(img);

    try {
      // プレースホルダー表示
      if (placeholder && this.options.enableBlurUp) {
        await this.showPlaceholder(img, placeholder);
      }

      // 最適な画像フォーマットの選択
      const optimalSrc = await this.getOptimalImageSource(src);

      // 画像の読み込み
      const loadedSrc = await this.preloadImage(optimalSrc, srcset, sizes);

      // 画像の適用
      this.applyImage(img, loadedSrc, srcset, sizes);

      // 成功クラスの追加
      img.classList.remove(this.options.placeholderClass);
      img.classList.add(this.options.loadedClass);

      // 読み込み完了イベントの発火
      this.dispatchImageEvent(img, 'progressive-image-loaded', { src: loadedSrc });
    } catch (error) {
      console.error('Progressive image loading failed:', error);
      this.handleImageError(img, error);
    }
  }

  async showPlaceholder(img, placeholder) {
    return new Promise(resolve => {
      img.classList.add(this.options.placeholderClass);
      img.style.filter = 'blur(10px)';
      img.style.transform = 'scale(1.05)';
      img.src = placeholder;

      if (img.complete) {
        resolve();
      } else {
        img.onload = resolve;
      }
    });
  }

  async getOptimalImageSource(originalSrc) {
    // ブラウザのサポート状況をチェック
    const supportsAVIF = this.options.enableAVIF && (await this.checkAVIFSupport());
    const supportsWebP = this.options.enableWebP && (await this.checkWebPSupport());

    // ファイル拡張子の取得
    const extension = originalSrc.split('.').pop().toLowerCase();
    const basePath = originalSrc.substring(0, originalSrc.lastIndexOf('.'));

    // 最適なフォーマットの選択
    if (supportsAVIF && this.isConvertibleFormat(extension)) {
      const avifSrc = `${basePath}.avif`;
      if (await this.checkImageExists(avifSrc)) {
        return avifSrc;
      }
    }

    if (supportsWebP && this.isConvertibleFormat(extension)) {
      const webpSrc = `${basePath}.webp`;
      if (await this.checkImageExists(webpSrc)) {
        return webpSrc;
      }
    }

    return originalSrc;
  }

  isConvertibleFormat(extension) {
    return ['jpg', 'jpeg', 'png'].includes(extension);
  }

  async checkAVIFSupport() {
    if (!this._avifSupport) {
      this._avifSupport = new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src =
          'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
      });
    }
    return this._avifSupport;
  }

  async checkWebPSupport() {
    if (!this._webpSupport) {
      this._webpSupport = new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
      });
    }
    return this._webpSupport;
  }

  async checkImageExists(src) {
    try {
      const response = await fetch(src, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  preloadImage(src, srcset, sizes) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      if (srcset) img.srcset = srcset;
      if (sizes) img.sizes = sizes;

      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));

      // デバイスピクセル比を考慮
      if ('connection' in navigator && navigator.connection.saveData) {
        // データセーバーモードの場合は低解像度を使用
        img.src = this.getLowQualityVersion(src);
      } else {
        img.src = src;
      }
    });
  }

  getLowQualityVersion(src) {
    // URLパラメータで品質を調整
    const url = new URL(src, window.location.origin);
    url.searchParams.set('quality', '60');
    return url.toString();
  }

  applyImage(img, src, srcset, sizes) {
    // トランジションの準備
    img.style.transition = 'filter 0.3s ease-out, transform 0.3s ease-out';

    // 画像の適用
    img.src = src;
    if (srcset) img.srcset = srcset;
    if (sizes) img.sizes = sizes;

    // トランジション効果
    requestAnimationFrame(() => {
      img.style.filter = 'none';
      img.style.transform = 'scale(1)';
    });

    // data属性のクリーンアップ
    delete img.dataset.src;
    delete img.dataset.srcset;
    delete img.dataset.sizes;
    delete img.dataset.placeholder;
  }

  handleImageError(img, error) {
    img.classList.add(this.options.errorClass);

    // フォールバック画像の設定
    if (img.dataset.fallback) {
      img.src = img.dataset.fallback;
    } else {
      // デフォルトのエラー画像
      img.src =
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
    }

    // エラーイベントの発火
    this.dispatchImageEvent(img, 'progressive-image-error', { error });
  }

  setupMutationObserver() {
    if ('MutationObserver' in window) {
      const observer = new MutationObserver(() => {
        this.observeImages();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  setupNetworkMonitoring() {
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.handleNetworkChange();
      });
    }
  }

  handleNetworkChange() {
    // ネットワーク状態に応じて画像品質を調整
    const connection = navigator.connection;
    const isSlowConnection =
      connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';

    if (isSlowConnection) {
      // 低速接続時は高品質画像の読み込みを延期
      this.options.rootMargin = '200px';
    } else {
      // 高速接続時は先読み範囲を広げる
      this.options.rootMargin = '500px';
    }

    // Observerの再設定
    if (this.imageObserver) {
      this.imageObserver.disconnect();
      this.init();
    }
  }

  dispatchImageEvent(img, eventName, detail) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true
    });
    img.dispatchEvent(event);
  }

  // Public メソッド
  refresh() {
    this.observeImages();
  }

  destroy() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
    this.loadedImages.clear();
  }
}

// 自動初期化
document.addEventListener('DOMContentLoaded', () => {
  window.progressiveImageLoader = new ProgressiveImageLoader({
    rootMargin: '100px',
    enableBlurUp: true,
    enableWebP: true,
    enableAVIF: true
  });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressiveImageLoader;
}
