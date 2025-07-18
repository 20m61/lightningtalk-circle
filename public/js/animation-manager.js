/**
 * Advanced Animation Manager
 * GPU最適化とパフォーマンス監視を備えたアニメーション管理システム
 */

class AnimationManager {
  constructor() {
    this.animations = new Map();
    this.performanceMonitor = new PerformanceMonitor();
    this.gpuOptimizer = new GPUOptimizer();
    this.animationQueue = [];
    this.isAnimating = false;
    this.fps = 60;
    this.frameTime = 1000 / this.fps;
    this.lastFrameTime = 0;

    this.init();
  }

  init() {
    // Web Animations APIのサポートをチェック
    this.supportsWebAnimations = 'animate' in Element.prototype;

    // will-changeプロパティのサポートをチェック
    this.supportsWillChange = CSS.supports('will-change', 'transform');

    // Reduced Motionの検出
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // GPU情報の取得
    this.detectGPUCapabilities();

    // RAF（RequestAnimationFrame）の最適化
    this.setupRAF();

    // リソース管理の初期化
    this.setupResourceManagement();

    // アクセシビリティ対応
    this.setupAccessibility();
  }

  /**
   * GPU機能の検出
   */
  detectGPUCapabilities() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        this.gpuInfo = {
          vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
          renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          hasHighPerformance: this.detectHighPerformanceGPU(gl)
        };
      }
    }
  }

  detectHighPerformanceGPU(gl) {
    const renderer = gl.getParameter(gl.RENDERER).toLowerCase();
    const highPerfKeywords = ['nvidia', 'radeon', 'geforce', 'gtx', 'rtx', 'rx', 'intel iris'];
    return highPerfKeywords.some(keyword => renderer.includes(keyword));
  }

  /**
   * RequestAnimationFrameの最適化セットアップ
   */
  setupRAF() {
    this.raf = window.requestAnimationFrame.bind(window);
    this.caf = window.cancelAnimationFrame.bind(window);

    // 高精度タイマーの使用
    this.now = performance.now ? performance.now.bind(performance) : Date.now;
  }

  /**
   * リソース管理の初期化
   */
  setupResourceManagement() {
    // ページアンロード時のクリーンアップ
    const beforeUnloadHandler = () => {
      this.cleanupAll();
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);

    // グローバルリスナーの追跡
    if (!this.globalListeners) {
      this.globalListeners = [];
    }
    this.globalListeners.push({
      target: window,
      event: 'beforeunload',
      handler: beforeUnloadHandler
    });

    // メモリ使用量の監視
    if ('memory' in performance) {
      this.monitorMemoryUsage();
    }
  }

  /**
   * アクセシビリティ対応
   */
  setupAccessibility() {
    // Reduced Motionの変更を監視
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateReducedMotion = e => {
      this.prefersReducedMotion = e.matches;
      if (this.prefersReducedMotion) {
        // 進行中のアニメーションを停止または軽減
        this.respectReducedMotion();
      }
    };

    mediaQuery.addListener(updateReducedMotion);
    this.globalListeners.push({
      target: mediaQuery,
      event: 'change',
      handler: updateReducedMotion
    });
  }

  /**
   * Reduced Motionの尊重
   */
  respectReducedMotion() {
    this.animations.forEach((animationData, animationId) => {
      if (animationData.animation && animationData.animation.playState === 'running') {
        // アニメーションを即座に完了状態にする
        animationData.animation.finish();
      }
    });
  }

  /**
   * メモリ使用量の監視
   */
  monitorMemoryUsage() {
    const checkMemory = () => {
      if (performance.memory) {
        const memoryInfo = performance.memory;
        const memoryUsageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;

        // メモリ使用率が80%を超えた場合、アニメーションを制限
        if (memoryUsageRatio > 0.8) {
          console.warn('[AnimationManager] High memory usage detected, limiting animations');
          this.limitAnimations();
        }
      }
    };

    setInterval(checkMemory, 10000); // 10秒ごとにチェック
  }

  /**
   * アニメーションの制限
   */
  limitAnimations() {
    // 低優先度のアニメーションをキャンセル
    this.animations.forEach((animationData, animationId) => {
      if (animationData.config.priority === 'low') {
        animationData.animation.cancel();
        this.cleanup(animationId);
      }
    });
  }

  /**
   * アニメーションの作成（アクセシビリティ対応強化）
   */
  createAnimation(element, keyframes, options = {}) {
    const defaultOptions = {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Material Design標準
      fill: 'both',
      useGPU: true,
      priority: 'normal' // low, normal, high
    };

    const config = { ...defaultOptions, ...options };

    // Reduced Motionの場合はアニメーションを軽減または無効化
    if (this.prefersReducedMotion) {
      if (config.respectReducedMotion !== false) {
        // アニメーションを即座に完了状態にする
        this.applyFinalState(element, keyframes);
        if (config.onComplete) {
          config.onComplete();
        }
        return null;
      }
      // または短縮バージョンを使用
      config.duration = Math.min(config.duration, 100);
    }

    const animationId = this.generateId();

    // GPUの最適化
    if (config.useGPU) {
      this.gpuOptimizer.prepare(element, keyframes);
    }

    // Web Animations APIを使用
    if (this.supportsWebAnimations) {
      const animation = element.animate(keyframes, {
        duration: config.duration,
        easing: config.easing,
        fill: config.fill,
        iterations: config.iterations || 1,
        direction: config.direction || 'normal',
        delay: config.delay || 0
      });

      this.animations.set(animationId, {
        animation,
        element,
        config,
        startTime: this.now()
      });

      // パフォーマンス監視
      this.performanceMonitor.trackAnimation(animationId, animation);

      // 完了時のクリーンアップ
      animation.onfinish = () => {
        this.cleanup(animationId);
        if (config.onComplete) {
          config.onComplete();
        }
      };

      return animation;
    } else {
      // フォールバック: CSS Transitionを使用
      return this.createCSSAnimation(element, keyframes, config);
    }
  }

  /**
   * バッチアニメーション（複数要素の同時アニメーション）
   */
  animateBatch(elements, keyframes, options = {}) {
    const animations = [];
    const batchId = this.generateId();

    // フレームの同期を保証
    requestAnimationFrame(() => {
      elements.forEach((element, index) => {
        const delay = options.stagger ? index * options.stagger : 0;
        const animation = this.createAnimation(element, keyframes, {
          ...options,
          delay: (options.delay || 0) + delay
        });
        animations.push(animation);
      });
    });

    return {
      batchId,
      animations,
      play: () => animations.forEach(a => a.play()),
      pause: () => animations.forEach(a => a.pause()),
      cancel: () => animations.forEach(a => a.cancel())
    };
  }

  /**
   * スクロール連動アニメーション
   */
  createScrollAnimation(element, keyframes, options = {}) {
    const config = {
      threshold: 0.5,
      rootMargin: '0px',
      once: false,
      ...options
    };

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const scrollProgress = this.calculateScrollProgress(entry);
            this.updateScrollAnimation(element, keyframes, scrollProgress);

            if (config.once) {
              observer.unobserve(element);
            }
          }
        });
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin
      }
    );

    observer.observe(element);

    return observer;
  }

  /**
   * スプリングアニメーション（物理ベース）
   */
  createSpringAnimation(element, target, options = {}) {
    const config = {
      stiffness: 300,
      damping: 30,
      mass: 1,
      velocity: 0,
      ...options
    };

    let position = this.getElementPosition(element);
    let { velocity } = config;
    let animationId;

    const animate = () => {
      const springForce = -config.stiffness * (position - target);
      const dampingForce = -config.damping * velocity;
      const acceleration = (springForce + dampingForce) / config.mass;

      velocity += acceleration * (this.frameTime / 1000);
      position += velocity * (this.frameTime / 1000);

      // 位置を更新
      this.updateElementPosition(element, position);

      // 終了条件
      if (Math.abs(velocity) < 0.01 && Math.abs(position - target) < 0.01) {
        this.updateElementPosition(element, target);
        cancelAnimationFrame(animationId);
        if (config.onComplete) {
          config.onComplete();
        }
      } else {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return {
      stop: () => cancelAnimationFrame(animationId),
      updateTarget: newTarget => {
        target = newTarget;
      }
    };
  }

  /**
   * モーフィングアニメーション
   */
  morphElements(fromElement, toElement, options = {}) {
    const duration = options.duration || 600;
    const easing = options.easing || 'cubic-bezier(0.4, 0.0, 0.2, 1)';

    // 両要素の位置とサイズを取得
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    // クローン要素を作成
    const clone = fromElement.cloneNode(true);
    clone.style.cssText = `
      position: fixed;
      top: ${fromRect.top}px;
      left: ${fromRect.left}px;
      width: ${fromRect.width}px;
      height: ${fromRect.height}px;
      margin: 0;
      pointer-events: none;
      z-index: 9999;
      will-change: transform, opacity;
    `;

    document.body.appendChild(clone);

    // 元の要素を非表示
    fromElement.style.opacity = '0';
    toElement.style.opacity = '0';

    // モーフィングアニメーション
    const animation = clone.animate(
      [
        {
          transform: 'translate(0, 0) scale(1)',
          opacity: 1
        },
        {
          transform: `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px) scale(${toRect.width / fromRect.width}, ${toRect.height / fromRect.height})`,
          opacity: 1
        }
      ],
      {
        duration,
        easing,
        fill: 'forwards'
      }
    );

    animation.onfinish = () => {
      toElement.style.opacity = '1';
      clone.remove();
      if (options.onComplete) {
        options.onComplete();
      }
    };

    return animation;
  }

  /**
   * パーティクルアニメーション
   */
  createParticleEffect(origin, options = {}) {
    const config = {
      count: 30,
      spread: 50,
      duration: 1000,
      colors: ['#ff6b35', '#4ecdc4', '#45b7d1', '#f9ca24'],
      shapes: ['circle', 'square'],
      gravity: 0.5,
      ...options
    };

    const particles = [];
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(container);

    for (let i = 0; i < config.count; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 10 + 5;
      const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];

      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        ${shape === 'circle' ? 'border-radius: 50%;' : ''}
        left: ${origin.x}px;
        top: ${origin.y}px;
        will-change: transform;
      `;

      container.appendChild(particle);

      // 物理シミュレーション
      const angle = (Math.PI * 2 * i) / config.count;
      const velocity = Math.random() * config.spread + 10;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity - 20;

      this.animateParticle(particle, vx, vy, config.gravity, config.duration);
      particles.push(particle);
    }

    setTimeout(() => container.remove(), config.duration);

    return container;
  }

  animateParticle(particle, vx, vy, gravity, duration) {
    let x = 0,
      y = 0;
    let velocityY = vy;
    const startTime = this.now();

    const animate = () => {
      const elapsed = this.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        particle.remove();
        return;
      }

      x += vx * (this.frameTime / 1000);
      velocityY += gravity;
      y += velocityY * (this.frameTime / 1000);

      particle.style.transform = `translate(${x}px, ${y}px) scale(${1 - progress})`;
      particle.style.opacity = 1 - progress;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * クリーンアップ（メモリリーク防止強化）
   */
  cleanup(animationId) {
    const animationData = this.animations.get(animationId);
    if (animationData) {
      // GPU最適化のクリーンアップ
      this.gpuOptimizer.cleanup(animationData.element);

      // パフォーマンス監視の削除
      this.performanceMonitor.removeAnimation(animationId);

      // イベントリスナーのクリーンアップ
      this.cleanupEventListeners(animationData.element);

      // アニメーションデータの削除
      this.animations.delete(animationId);
    }
  }

  /**
   * イベントリスナーのクリーンアップ
   */
  cleanupEventListeners(element) {
    // WeakMapを使用してイベントリスナーを追跡
    if (this.elementListeners && this.elementListeners.has(element)) {
      const listeners = this.elementListeners.get(element);
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.elementListeners.delete(element);
    }
  }

  /**
   * イベントリスナーの追加（追跡付き）
   */
  addTrackedEventListener(element, event, handler) {
    if (!this.elementListeners) {
      this.elementListeners = new WeakMap();
    }

    if (!this.elementListeners.has(element)) {
      this.elementListeners.set(element, []);
    }

    this.elementListeners.get(element).push({ event, handler });
    element.addEventListener(event, handler);
  }

  /**
   * 全てのアニメーションのクリーンアップ
   */
  cleanupAll() {
    this.animations.forEach((_, animationId) => {
      this.cleanup(animationId);
    });

    // グローバルリスナーのクリーンアップ
    if (this.globalListeners) {
      this.globalListeners.forEach(({ target, event, handler }) => {
        target.removeEventListener(event, handler);
      });
      this.globalListeners = [];
    }
  }

  /**
   * ユーティリティ関数
   */
  generateId() {
    return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getElementPosition(element) {
    const { transform } = window.getComputedStyle(element);
    if (transform === 'none') {
      return 0;
    }
    const matrix = new DOMMatrix(transform);
    return matrix.m41; // X座標
  }

  updateElementPosition(element, position) {
    element.style.transform = `translateX(${position}px)`;
  }

  calculateScrollProgress(entry) {
    const viewportHeight = window.innerHeight;
    const elementTop = entry.boundingClientRect.top;
    const elementHeight = entry.boundingClientRect.height;

    const visibleHeight = Math.min(viewportHeight - elementTop, elementHeight);
    return visibleHeight / elementHeight;
  }

  updateScrollAnimation(element, keyframes, progress) {
    const interpolatedStyles = {};

    keyframes.forEach((keyframe, index) => {
      if (index === 0) {
        return;
      }

      const prevKeyframe = keyframes[index - 1];
      Object.keys(keyframe).forEach(property => {
        if (property !== 'offset') {
          const from = prevKeyframe[property];
          const to = keyframe[property];
          interpolatedStyles[property] = this.interpolate(from, to, progress);
        }
      });
    });

    Object.assign(element.style, interpolatedStyles);
  }

  interpolate(from, to, progress) {
    // 数値の補間
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * progress;
    }

    // 色の補間などは別途実装
    return to;
  }

  /**
   * 最終状態の即座適用（Reduced Motion用）
   */
  applyFinalState(element, keyframes) {
    if (keyframes.length > 0) {
      const finalFrame = keyframes[keyframes.length - 1];
      Object.assign(element.style, finalFrame);
    }
  }
}

/**
 * GPU最適化クラス
 */
class GPUOptimizer {
  constructor() {
    this.optimizedElements = new WeakSet();
  }

  prepare(element, keyframes) {
    // すでに最適化済みの場合はスキップ
    if (this.optimizedElements.has(element)) {
      return;
    }

    // will-changeプロパティの設定
    const properties = this.extractAnimatedProperties(keyframes);
    if (properties.length > 0) {
      element.style.willChange = properties.join(', ');
    }

    // 3D変換を強制してGPUレイヤーを作成
    if (!element.style.transform.includes('translateZ')) {
      element.style.transform += ' translateZ(0)';
    }

    // バックフェース非表示で描画を最適化
    element.style.backfaceVisibility = 'hidden';
    element.style.perspective = '1000px';

    this.optimizedElements.add(element);
  }

  cleanup(element) {
    element.style.willChange = 'auto';
    // translateZ(0)を削除
    element.style.transform = element.style.transform.replace(/\s*translateZ\(0\)/, '');

    this.optimizedElements.delete(element);
  }

  extractAnimatedProperties(keyframes) {
    const properties = new Set();

    keyframes.forEach(keyframe => {
      Object.keys(keyframe).forEach(property => {
        if (property !== 'offset' && property !== 'easing') {
          properties.add(property);
        }
      });
    });

    return Array.from(properties);
  }
}

/**
 * パフォーマンス監視クラス
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.frameDropThreshold = 50; // 50ms以上のフレームドロップを検出
  }

  trackAnimation(animationId, animation) {
    const startTime = performance.now();
    let lastFrameTime = startTime;
    let frameCount = 0;
    let frameDrops = 0;

    const checkFrame = () => {
      if (animation.playState === 'finished') {
        this.recordMetrics(animationId, {
          duration: performance.now() - startTime,
          frameCount,
          frameDrops,
          averageFPS: frameCount / ((performance.now() - startTime) / 1000)
        });
        return;
      }

      const currentTime = performance.now();
      const frameDuration = currentTime - lastFrameTime;

      if (frameDuration > this.frameDropThreshold) {
        frameDrops++;
      }

      frameCount++;
      lastFrameTime = currentTime;

      requestAnimationFrame(checkFrame);
    };

    requestAnimationFrame(checkFrame);
  }

  recordMetrics(animationId, metrics) {
    this.metrics.set(animationId, metrics);

    // パフォーマンスが悪い場合は警告
    if (metrics.averageFPS < 30) {
      console.warn(`Animation ${animationId} performed poorly:`, metrics);
    }

    // パフォーマンス分析をサーバーに送信（オプション）
    if (window.analyticsEnabled && metrics.averageFPS < 50) {
      this.sendPerformanceAnalytics(animationId, metrics);
    }
  }

  /**
   * パフォーマンス分析データの送信
   */
  sendPerformanceAnalytics(animationId, metrics) {
    try {
      fetch('/api/analytics/animation-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          animationId,
          metrics,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          devicePixelRatio: window.devicePixelRatio || 1
        })
      }).catch(error => {
        // 分析データ送信の失敗は無視
        console.debug('Analytics sending failed:', error);
      });
    } catch (error) {
      // エラーを無視（分析は必須機能ではない）
    }
  }

  removeAnimation(animationId) {
    this.metrics.delete(animationId);
  }

  getReport() {
    const report = {
      totalAnimations: this.metrics.size,
      averageMetrics: {
        fps: 0,
        frameDrops: 0,
        duration: 0
      }
    };

    this.metrics.forEach(metric => {
      report.averageMetrics.fps += metric.averageFPS;
      report.averageMetrics.frameDrops += metric.frameDrops;
      report.averageMetrics.duration += metric.duration;
    });

    if (report.totalAnimations > 0) {
      report.averageMetrics.fps /= report.totalAnimations;
      report.averageMetrics.frameDrops /= report.totalAnimations;
      report.averageMetrics.duration /= report.totalAnimations;
    }

    return report;
  }
}

// グローバルに公開
window.AnimationManager = new AnimationManager();

// 使用例
/*
const animManager = window.AnimationManager;

// 基本的なアニメーション
const button = document.querySelector('.btn');
animManager.createAnimation(button, [
  { transform: 'scale(1)', opacity: 1 },
  { transform: 'scale(1.2)', opacity: 0.8 },
  { transform: 'scale(1)', opacity: 1 }
], {
  duration: 300,
  easing: 'ease-out'
});

// バッチアニメーション（スタガー効果）
const cards = document.querySelectorAll('.card');
animManager.animateBatch(cards, [
  { transform: 'translateY(20px)', opacity: 0 },
  { transform: 'translateY(0)', opacity: 1 }
], {
  duration: 500,
  stagger: 50 // 各要素間の遅延
});

// スプリングアニメーション
const modal = document.querySelector('.modal');
animManager.createSpringAnimation(modal, 100, {
  stiffness: 200,
  damping: 20
});

// パーティクルエフェクト
button.addEventListener('click', (e) => {
  animManager.createParticleEffect({
    x: e.clientX,
    y: e.clientY
  });
});

// スクロール連動アニメーション
const sections = document.querySelectorAll('.section');
sections.forEach(section => {
  animManager.createScrollAnimation(section, [
    { transform: 'translateY(50px)', opacity: 0 },
    { transform: 'translateY(0)', opacity: 1 }
  ]);
});
*/
