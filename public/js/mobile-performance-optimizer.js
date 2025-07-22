/**
 * Mobile Performance Optimizer
 * モバイルデバイス専用の包括的パフォーマンス最適化システム
 */

class MobilePerformanceOptimizer {
  constructor() {
    this.metrics = {
      fps: [],
      memoryUsage: [],
      touchLatency: [],
      scrollPerformance: [],
      renderTime: [],
      batteryLevel: null,
      networkQuality: 'unknown'
    };

    this.optimizations = {
      imageOptimization: true,
      lazyLoading: true,
      resourceHints: true,
      criticalCSS: true,
      deferredScripts: true,
      requestIdleCallback: true,
      intersectionObserver: true,
      passiveListeners: true,
      preloadCriticalResources: true
    };

    this.thresholds = {
      goodFPS: 55,
      poorFPS: 30,
      goodMemory: 50, // MB
      poorMemory: 100, // MB
      goodTouchLatency: 16, // ms
      poorTouchLatency: 50, // ms
      goodScrollFPS: 55,
      poorScrollFPS: 30
    };

    this.init();
  }

  init() {
    // デバイス情報の取得
    this.detectDeviceCapabilities();

    // パフォーマンス監視の開始
    this.startPerformanceMonitoring();

    // 最適化の適用
    this.applyOptimizations();

    // ネットワーク品質の監視
    this.monitorNetworkQuality();

    // バッテリー状態の監視
    this.monitorBattery();

    // メモリ最適化
    this.setupMemoryOptimization();

    // 自動調整機能
    this.setupAdaptiveOptimization();
  }

  /**
   * デバイス機能の検出
   */
  detectDeviceCapabilities() {
    this.device = {
      // ハードウェア情報
      hardwareConcurrency: navigator.hardwareConcurrency || 2,
      deviceMemory: navigator.deviceMemory || 2,
      maxTouchPoints: navigator.maxTouchPoints || 0,

      // 画面情報
      screenWidth: screen.width,
      screenHeight: screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      colorDepth: screen.colorDepth,

      // 機能サポート
      supportsWebGL: this.detectWebGLSupport(),
      supportsWebP: this.detectWebPSupport(),
      supportsAVIF: this.detectAVIFSupport(),
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsIntersectionObserver: 'IntersectionObserver' in window,
      supportsRequestIdleCallback: 'requestIdleCallback' in window,

      // パフォーマンス関連
      isLowEndDevice: this.detectLowEndDevice(),
      estimatedPerformanceLevel: this.estimatePerformanceLevel()
    };

    console.log('[MobilePerformanceOptimizer] Device capabilities:', this.device);
  }

  detectWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  detectWebPSupport() {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => resolve(webP.height === 2);
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  detectAVIFSupport() {
    return new Promise(resolve => {
      const avif = new Image();
      avif.onload = avif.onerror = () => resolve(avif.height === 2);
      avif.src =
        'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
    });
  }

  detectLowEndDevice() {
    // 複数の指標でローエンドデバイスを判定
    const factors = [
      navigator.hardwareConcurrency <= 2,
      navigator.deviceMemory <= 2,
      window.devicePixelRatio <= 1.5,
      !this.detectWebGLSupport()
    ];

    return factors.filter(Boolean).length >= 2;
  }

  estimatePerformanceLevel() {
    // デバイスのパフォーマンスレベルを推定
    let score = 0;

    // CPU
    if (navigator.hardwareConcurrency >= 8) {
      score += 3;
    } else if (navigator.hardwareConcurrency >= 4) {
      score += 2;
    } else {
      score += 1;
    }

    // メモリ
    if (navigator.deviceMemory >= 8) {
      score += 3;
    } else if (navigator.deviceMemory >= 4) {
      score += 2;
    } else {
      score += 1;
    }

    // GPU
    if (this.detectWebGLSupport()) {
      score += 2;
    }

    // 画面
    if (window.devicePixelRatio >= 3) {
      score += 2;
    } else if (window.devicePixelRatio >= 2) {
      score += 1;
    }

    if (score >= 8) {
      return 'high';
    }
    if (score >= 5) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * パフォーマンス監視の開始
   */
  startPerformanceMonitoring() {
    // FPS監視
    this.startFPSMonitoring();

    // メモリ使用量監視
    this.startMemoryMonitoring();

    // タッチレイテンシ監視
    this.startTouchLatencyMonitoring();

    // スクロールパフォーマンス監視
    this.startScrollPerformanceMonitoring();

    // レンダリング時間監視
    this.startRenderTimeMonitoring();
  }

  startFPSMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFPS = currentTime => {
      frameCount++;

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.metrics.fps.push(fps);

        // 最新100フレームのみ保持
        if (this.metrics.fps.length > 100) {
          this.metrics.fps.shift();
        }

        // パフォーマンス劣化の検出
        if (fps < this.thresholds.poorFPS) {
          this.handlePoorPerformance('fps', fps);
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  startMemoryMonitoring() {
    if (!performance.memory) {
      return;
    }

    setInterval(() => {
      const memoryInfo = performance.memory;
      const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;

      this.metrics.memoryUsage.push(usedMB);

      // 最新50記録のみ保持
      if (this.metrics.memoryUsage.length > 50) {
        this.metrics.memoryUsage.shift();
      }

      // メモリ使用量が多い場合の対応
      if (usedMB > this.thresholds.poorMemory) {
        this.handleHighMemoryUsage(usedMB);
      }
    }, 5000);
  }

  startTouchLatencyMonitoring() {
    document.addEventListener(
      'touchstart',
      e => {
        const startTime = performance.now();

        requestAnimationFrame(() => {
          const latency = performance.now() - startTime;
          this.metrics.touchLatency.push(latency);

          if (this.metrics.touchLatency.length > 100) {
            this.metrics.touchLatency.shift();
          }

          if (latency > this.thresholds.poorTouchLatency) {
            this.handlePoorTouchLatency(latency);
          }
        });
      },
      { passive: true }
    );
  }

  startScrollPerformanceMonitoring() {
    let lastScrollTime = 0;
    let scrollFrameCount = 0;

    document.addEventListener(
      'scroll',
      () => {
        const now = performance.now();
        scrollFrameCount++;

        if (now - lastScrollTime >= 1000) {
          const scrollFPS = scrollFrameCount;
          this.metrics.scrollPerformance.push(scrollFPS);

          if (this.metrics.scrollPerformance.length > 50) {
            this.metrics.scrollPerformance.shift();
          }

          if (scrollFPS < this.thresholds.poorScrollFPS) {
            this.handlePoorScrollPerformance(scrollFPS);
          }

          scrollFrameCount = 0;
          lastScrollTime = now;
        }
      },
      { passive: true }
    );
  }

  startRenderTimeMonitoring() {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.metrics.renderTime.push(entry.duration);

          if (this.metrics.renderTime.length > 100) {
            this.metrics.renderTime.shift();
          }
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });
  }

  /**
   * 最適化の適用
   */
  applyOptimizations() {
    // 画像最適化
    if (this.optimizations.imageOptimization) {
      this.optimizeImages();
    }

    // 遅延読み込み
    if (this.optimizations.lazyLoading) {
      this.setupLazyLoading();
    }

    // リソースヒント
    if (this.optimizations.resourceHints) {
      this.addResourceHints();
    }

    // クリティカルCSS
    if (this.optimizations.criticalCSS) {
      this.optimizeCriticalCSS();
    }

    // スクリプトの遅延
    if (this.optimizations.deferredScripts) {
      this.deferNonCriticalScripts();
    }

    // パッシブリスナー
    if (this.optimizations.passiveListeners) {
      this.optimizeEventListeners();
    }

    // クリティカルリソースのプリロード
    if (this.optimizations.preloadCriticalResources) {
      this.preloadCriticalResources();
    }
  }

  optimizeImages() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      // WebP/AVIF対応
      if (this.device.supportsWebP || this.device.supportsAVIF) {
        this.convertToModernFormats(img);
      }

      // レスポンシブ画像
      this.addResponsiveAttributes(img);

      // 遅延読み込み
      if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy';
      }
    });
  }

  convertToModernFormats(img) {
    const { src } = img;
    if (src && !src.includes('.webp') && !src.includes('.avif')) {
      // 画像形式の変換ロジック
      const picture = document.createElement('picture');

      if (this.device.supportsAVIF) {
        const avifSource = document.createElement('source');
        avifSource.srcset = src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
        avifSource.type = 'image/avif';
        picture.appendChild(avifSource);
      }

      if (this.device.supportsWebP) {
        const webpSource = document.createElement('source');
        webpSource.srcset = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        webpSource.type = 'image/webp';
        picture.appendChild(webpSource);
      }

      picture.appendChild(img.cloneNode(true));
      img.parentNode.replaceChild(picture, img);
    }
  }

  addResponsiveAttributes(img) {
    if (!img.srcset && !img.sizes) {
      const { src } = img;
      if (src) {
        // デバイスピクセル比に基づくsrcsetの生成
        const srcset = [`${src} 1x`, `${src.replace(/\.(jpg|jpeg|png)$/i, '@2x.$1')} 2x`].join(
          ', '
        );

        img.srcset = srcset;
        img.sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
      }
    }
  }

  setupLazyLoading() {
    if (!this.device.supportsIntersectionObserver) {
      return;
    }

    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;

            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }

            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
              img.removeAttribute('data-srcset');
            }

            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    document.querySelectorAll('img[data-src], img[data-srcset]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  addResourceHints() {
    const { head } = document;

    // DNSプリフェッチ
    const domains = ['fonts.googleapis.com', 'fonts.gstatic.com'];
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      head.appendChild(link);
    });

    // プリコネクト
    const preconnectDomains = ['https://fonts.googleapis.com'];
    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      head.appendChild(link);
    });
  }

  optimizeCriticalCSS() {
    // クリティカルCSS以外を遅延読み込み
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');

    stylesheets.forEach(link => {
      if (link.media !== 'print') {
        link.media = 'print';
        link.onload = () => {
          link.media = 'all';
        };
      }
    });
  }

  deferNonCriticalScripts() {
    const scripts = document.querySelectorAll('script[src]:not([data-critical])');

    scripts.forEach(script => {
      if (!script.defer && !script.async) {
        script.defer = true;
      }
    });
  }

  optimizeEventListeners() {
    // スクロールイベントの最適化
    let scrollTimeout;
    const optimizedScroll = callback => {
      return () => {
        if (scrollTimeout) {
          return;
        }
        scrollTimeout = setTimeout(() => {
          callback();
          scrollTimeout = null;
        }, 16); // 60fps
      };
    };

    // リサイズイベントの最適化
    let resizeTimeout;
    const optimizedResize = callback => {
      return () => {
        if (resizeTimeout) {
          return;
        }
        resizeTimeout = setTimeout(() => {
          callback();
          resizeTimeout = null;
        }, 100);
      };
    };

    // グローバルに公開
    window.optimizedScroll = optimizedScroll;
    window.optimizedResize = optimizedResize;
  }

  preloadCriticalResources() {
    const criticalResources = [
      { href: '/css/critical.css', as: 'style' },
      { href: '/js/critical.js', as: 'script' },
      { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      Object.assign(link, resource);
      document.head.appendChild(link);
    });
  }

  /**
   * ネットワーク品質の監視
   */
  monitorNetworkQuality() {
    if ('connection' in navigator) {
      const { connection } = navigator;

      const updateNetworkInfo = () => {
        this.metrics.networkQuality = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };

        // 低品質ネットワークでの最適化
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.applyLowBandwidthOptimizations();
        }

        // データセーバーモード
        if (connection.saveData) {
          this.applyDataSaverOptimizations();
        }
      };

      connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }
  }

  applyLowBandwidthOptimizations() {
    // 画像品質の削減
    document.querySelectorAll('img').forEach(img => {
      if (img.src && !img.dataset.optimized) {
        img.src = img.src.replace(/\.(jpg|jpeg)$/i, '_low.$1');
        img.dataset.optimized = 'true';
      }
    });

    // 非必須リソースの無効化
    this.optimizations.imageOptimization = false;
    this.optimizations.lazyLoading = true; // 必須
  }

  applyDataSaverOptimizations() {
    // 自動再生の無効化
    document.querySelectorAll('video, audio').forEach(media => {
      media.autoplay = false;
      media.preload = 'none';
    });

    // アニメーションの削減
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
  }

  /**
   * バッテリー状態の監視
   */
  async monitorBattery() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();

        const updateBatteryInfo = () => {
          this.metrics.batteryLevel = {
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          };

          // 低バッテリー時の最適化
          if (battery.level < 0.2 && !battery.charging) {
            this.applyBatteryOptimizations();
          }
        };

        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);
        updateBatteryInfo();
      } catch (error) {
        console.warn('[MobilePerformanceOptimizer] Battery API not supported:', error);
      }
    }
  }

  applyBatteryOptimizations() {
    // CPUインテンシブな処理の制限
    this.optimizations.criticalCSS = false;

    // アニメーションの無効化
    document.documentElement.style.setProperty('--animation-duration', '0s');

    // バックグラウンド処理の停止
    if (this.backgroundTasks) {
      this.backgroundTasks.forEach(task => clearInterval(task));
    }
  }

  /**
   * メモリ最適化
   */
  setupMemoryOptimization() {
    // WeakMapとWeakSetの使用
    this.weakReferences = new WeakMap();
    this.weakSets = new WeakSet();

    // 定期的なガベージコレクション誘発
    setInterval(() => {
      this.triggerGarbageCollection();
    }, 30000);

    // ページ非表示時のクリーンアップ
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cleanupOnHide();
      }
    });
  }

  triggerGarbageCollection() {
    // 不要な参照の削除
    if (this.cachedElements) {
      this.cachedElements.clear();
    }

    // DOMクリーンアップ
    this.cleanupDetachedNodes();

    // イベントリスナーのクリーンアップ
    this.cleanupEventListeners();
  }

  cleanupDetachedNodes() {
    // 切り離されたDOMノードの検出と削除
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: node => {
        return node.parentNode ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });

    const detachedNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      detachedNodes.push(node);
    }

    detachedNodes.forEach(node => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
  }

  cleanupEventListeners() {
    // 使用されていないイベントリスナーの削除
    if (this.eventListeners) {
      this.eventListeners.forEach((listener, element) => {
        if (!document.contains(element)) {
          element.removeEventListener(listener.type, listener.handler);
          this.eventListeners.delete(element);
        }
      });
    }
  }

  cleanupOnHide() {
    // 非表示時の積極的クリーンアップ
    this.pauseAnimations();
    this.pauseVideoPlayback();
    this.clearCaches();
  }

  pauseAnimations() {
    document.querySelectorAll('*').forEach(element => {
      const animations = element.getAnimations ? element.getAnimations() : [];
      animations.forEach(animation => animation.pause());
    });
  }

  pauseVideoPlayback() {
    document.querySelectorAll('video').forEach(video => {
      if (!video.paused) {
        video.pause();
        video.dataset.wasPaused = 'false';
      }
    });
  }

  clearCaches() {
    // キャッシュのクリア
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.includes('temporary')) {
              return caches.delete(cacheName);
            }
          })
        );
      });
    }
  }

  /**
   * 自動調整機能
   */
  setupAdaptiveOptimization() {
    // パフォーマンス状況に応じた自動調整
    setInterval(() => {
      this.evaluateAndAdjust();
    }, 10000);
  }

  evaluateAndAdjust() {
    const currentPerformance = this.getCurrentPerformance();

    if (currentPerformance.overall < 0.5) {
      this.enablePerformanceMode();
    } else if (currentPerformance.overall > 0.8) {
      this.enableQualityMode();
    }
  }

  getCurrentPerformance() {
    const avgFPS =
      this.metrics.fps.length > 0
        ? this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length
        : 60;

    const avgMemory =
      this.metrics.memoryUsage.length > 0
        ? this.metrics.memoryUsage.reduce((a, b) => a + b, 0) / this.metrics.memoryUsage.length
        : 50;

    const avgTouchLatency =
      this.metrics.touchLatency.length > 0
        ? this.metrics.touchLatency.reduce((a, b) => a + b, 0) / this.metrics.touchLatency.length
        : 16;

    const fpsScore = Math.min(avgFPS / 60, 1);
    const memoryScore = Math.max(1 - avgMemory / 100, 0);
    const touchScore = Math.max(1 - avgTouchLatency / 50, 0);

    return {
      fps: fpsScore,
      memory: memoryScore,
      touch: touchScore,
      overall: (fpsScore + memoryScore + touchScore) / 3
    };
  }

  enablePerformanceMode() {
    console.log('[MobilePerformanceOptimizer] Enabling performance mode');

    // 品質を下げてパフォーマンスを向上
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    this.optimizations.imageOptimization = false;
    this.optimizations.lazyLoading = true;

    // 低品質画像への切り替え
    this.switchToLowQualityImages();
  }

  enableQualityMode() {
    console.log('[MobilePerformanceOptimizer] Enabling quality mode');

    // 品質を向上
    document.documentElement.style.setProperty('--animation-duration', '0.3s');
    this.optimizations.imageOptimization = true;

    // 高品質画像への切り替え
    this.switchToHighQualityImages();
  }

  switchToLowQualityImages() {
    document.querySelectorAll('img').forEach(img => {
      if (img.dataset.lowQuality && !img.dataset.currentQuality) {
        img.src = img.dataset.lowQuality;
        img.dataset.currentQuality = 'low';
      }
    });
  }

  switchToHighQualityImages() {
    document.querySelectorAll('img').forEach(img => {
      if (img.dataset.highQuality && img.dataset.currentQuality === 'low') {
        img.src = img.dataset.highQuality;
        img.dataset.currentQuality = 'high';
      }
    });
  }

  /**
   * パフォーマンス問題の処理
   */
  handlePoorPerformance(type, value) {
    console.warn(`[MobilePerformanceOptimizer] Poor ${type} detected:`, value);

    switch (type) {
    case 'fps':
      this.reduceFPSLoad();
      break;
    case 'memory':
      this.reduceMemoryUsage();
      break;
    case 'touch':
      this.optimizeTouchHandling();
      break;
    case 'scroll':
      this.optimizeScrolling();
      break;
    }
  }

  handlePoorTouchLatency(latency) {
    console.warn('[MobilePerformanceOptimizer] Poor touch latency:', latency);
    this.optimizeTouchHandling();
  }

  handleHighMemoryUsage(usage) {
    console.warn('[MobilePerformanceOptimizer] High memory usage:', usage, 'MB');
    this.reduceMemoryUsage();
  }

  handlePoorScrollPerformance(fps) {
    console.warn('[MobilePerformanceOptimizer] Poor scroll performance:', fps);
    this.optimizeScrolling();
  }

  reduceFPSLoad() {
    // アニメーションの無効化
    document.querySelectorAll('.animated').forEach(el => {
      el.style.animation = 'none';
    });

    // 複雑なエフェクトの簡素化
    document.documentElement.style.setProperty('--shadow-complexity', 'none');
  }

  reduceMemoryUsage() {
    // 強制ガベージコレクション
    this.triggerGarbageCollection();

    // 大きな画像の縮小
    document.querySelectorAll('img').forEach(img => {
      if (img.naturalWidth > 1920) {
        img.style.maxWidth = '1920px';
        img.style.height = 'auto';
      }
    });
  }

  optimizeTouchHandling() {
    // タッチイベントの最適化
    document.querySelectorAll('[data-touch]').forEach(element => {
      element.style.touchAction = 'manipulation';
    });
  }

  optimizeScrolling() {
    // スクロール最適化
    document.body.style.overflowAnchor = 'none';
    document.documentElement.style.scrollBehavior = 'auto';
  }

  /**
   * パフォーマンスレポートの生成
   */
  generatePerformanceReport() {
    const currentPerf = this.getCurrentPerformance();

    return {
      timestamp: new Date().toISOString(),
      device: this.device,
      metrics: {
        fps: {
          current: this.metrics.fps.slice(-1)[0] || 0,
          average:
            this.metrics.fps.length > 0
              ? this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length
              : 0,
          min: Math.min(...this.metrics.fps) || 0,
          max: Math.max(...this.metrics.fps) || 0
        },
        memory: {
          current: this.metrics.memoryUsage.slice(-1)[0] || 0,
          average:
            this.metrics.memoryUsage.length > 0
              ? this.metrics.memoryUsage.reduce((a, b) => a + b, 0) /
                this.metrics.memoryUsage.length
              : 0,
          max: Math.max(...this.metrics.memoryUsage) || 0
        },
        touchLatency: {
          average:
            this.metrics.touchLatency.length > 0
              ? this.metrics.touchLatency.reduce((a, b) => a + b, 0) /
                this.metrics.touchLatency.length
              : 0,
          max: Math.max(...this.metrics.touchLatency) || 0
        },
        network: this.metrics.networkQuality,
        battery: this.metrics.batteryLevel
      },
      performance: currentPerf,
      optimizations: this.optimizations,
      recommendations: this.generateRecommendations(currentPerf)
    };
  }

  generateRecommendations(performance) {
    const recommendations = [];

    if (performance.fps < 0.7) {
      recommendations.push('アニメーションを簡素化することを推奨します');
    }

    if (performance.memory < 0.5) {
      recommendations.push('メモリ使用量を削減することを推奨します');
    }

    if (performance.touch < 0.7) {
      recommendations.push('タッチインタラクションを最適化することを推奨します');
    }

    if (this.device.isLowEndDevice) {
      recommendations.push('ローエンドデバイス向けの最適化を適用することを推奨します');
    }

    return recommendations;
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    // 監視の停止
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // タイマーのクリア
    if (this.backgroundTasks) {
      this.backgroundTasks.forEach(task => clearInterval(task));
    }

    // メモリクリーンアップ
    this.triggerGarbageCollection();
  }
}

// グローバルに公開
window.MobilePerformanceOptimizer = new MobilePerformanceOptimizer();

// 使用例とAPIドキュメント
/*
// パフォーマンスレポートの取得
const report = window.MobilePerformanceOptimizer.generatePerformanceReport();
console.log('Performance Report:', report);

// 手動での最適化適用
window.MobilePerformanceOptimizer.enablePerformanceMode();

// 特定の最適化の有効/無効
window.MobilePerformanceOptimizer.optimizations.imageOptimization = false;

// イベントリスナーの追加
document.addEventListener('performanceIssue', (e) => {
  console.log('Performance issue detected:', e.detail);
});
*/
