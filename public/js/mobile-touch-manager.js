/**
 * Mobile Touch Interaction Manager
 * モバイルデバイス専用のタッチインタラクション管理システム
 */

class MobileTouchManager {
  constructor() {
    this.touches = new Map();
    this.gestures = new Map();
    this.touchStartTime = 0;
    this.doubleTapDelay = 300;
    this.longPressDelay = 500;
    this.swipeThreshold = 50;
    this.pinchThreshold = 10;

    // パフォーマンス監視
    this.performance = {
      touchLatency: [],
      gestureRecognitionTime: [],
      frameDrops: 0
    };

    this.init();
  }

  init() {
    // デバイス判定
    this.deviceInfo = this.detectDevice();

    // タッチイベントリスナーの設定
    this.setupTouchListeners();

    // ジェスチャー認識の初期化
    this.initializeGestureRecognition();

    // ハプティックフィードバックの設定
    this.setupHapticFeedback();

    // パフォーマンス監視の開始
    this.startPerformanceMonitoring();
  }

  /**
   * デバイス情報の検出
   */
  detectDevice() {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);

    // 画面サイズ情報
    const screenInfo = {
      width: window.screen.width,
      height: window.screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: screen.orientation?.type || 'unknown'
    };

    // タッチ機能の検出
    const touchCapabilities = {
      maxTouchPoints: navigator.maxTouchPoints || 0,
      supportsTouch: 'ontouchstart' in window,
      supportsPointer: 'onpointerdown' in window,
      supportsVibration: 'vibrate' in navigator
    };

    return {
      isMobile,
      isTablet,
      isIOS,
      isAndroid,
      screenInfo,
      touchCapabilities,
      hasNotch: this.detectNotch(),
      supportsSafeArea: CSS.supports('padding: env(safe-area-inset-top)')
    };
  }

  /**
   * ノッチの検出（iPhone X以降）
   */
  detectNotch() {
    if (!this.deviceInfo?.isIOS) return false;

    // iOS 11以降で利用可能
    if (CSS.supports('padding: env(safe-area-inset-top)')) {
      const testElement = document.createElement('div');
      testElement.style.paddingTop = 'env(safe-area-inset-top)';
      document.body.appendChild(testElement);
      const hasNotch = getComputedStyle(testElement).paddingTop !== '0px';
      document.body.removeChild(testElement);
      return hasNotch;
    }

    return false;
  }

  /**
   * タッチイベントリスナーの設定
   */
  setupTouchListeners() {
    const options = { passive: false, capture: true };

    document.addEventListener('touchstart', this.handleTouchStart.bind(this), options);
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), options);
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), options);
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), options);

    // ポインターイベントもサポート
    if (this.deviceInfo.touchCapabilities.supportsPointer) {
      document.addEventListener('pointerdown', this.handlePointerDown.bind(this), options);
      document.addEventListener('pointermove', this.handlePointerMove.bind(this), options);
      document.addEventListener('pointerup', this.handlePointerUp.bind(this), options);
    }
  }

  /**
   * タッチ開始処理
   */
  handleTouchStart(event) {
    const startTime = performance.now();

    // タッチ情報を記録
    Array.from(event.touches).forEach(touch => {
      this.touches.set(touch.identifier, {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: startTime,
        target: event.target,
        moved: false
      });
    });

    // シングルタッチの処理
    if (event.touches.length === 1) {
      this.handleSingleTouchStart(event.touches[0], event);
    }

    // マルチタッチの処理
    if (event.touches.length === 2) {
      this.handleMultiTouchStart(event.touches, event);
    }

    // パフォーマンス記録
    this.recordTouchLatency(startTime);
  }

  /**
   * シングルタッチ開始処理
   */
  handleSingleTouchStart(touch, event) {
    const touchData = this.touches.get(touch.identifier);

    // 長押し判定のタイマー設定
    touchData.longPressTimer = setTimeout(() => {
      this.triggerLongPress(touch, event);
    }, this.longPressDelay);

    // ダブルタップ判定
    const now = Date.now();
    if (this.lastTapTime && now - this.lastTapTime < this.doubleTapDelay) {
      this.triggerDoubleTap(touch, event);
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = now;
    }
  }

  /**
   * マルチタッチ開始処理
   */
  handleMultiTouchStart(touches, event) {
    const touch1 = touches[0];
    const touch2 = touches[1];

    // ピンチ/ズーム用の初期距離を計算
    const distance = this.calculateDistance(
      touch1.clientX,
      touch1.clientY,
      touch2.clientX,
      touch2.clientY
    );

    this.initialPinchDistance = distance;
    this.currentPinchDistance = distance;
  }

  /**
   * タッチ移動処理
   */
  handleTouchMove(event) {
    // デフォルト動作の制御（スクロール等）
    if (this.shouldPreventDefault(event)) {
      event.preventDefault();
    }

    Array.from(event.touches).forEach(touch => {
      const touchData = this.touches.get(touch.identifier);
      if (!touchData) return;

      // 移動距離の計算
      const deltaX = touch.clientX - touchData.currentX;
      const deltaY = touch.clientY - touchData.currentY;
      const totalDeltaX = touch.clientX - touchData.startX;
      const totalDeltaY = touch.clientY - touchData.startY;

      // 移動フラグの更新
      if (Math.abs(totalDeltaX) > 5 || Math.abs(totalDeltaY) > 5) {
        touchData.moved = true;

        // 長押しタイマーをクリア
        if (touchData.longPressTimer) {
          clearTimeout(touchData.longPressTimer);
          touchData.longPressTimer = null;
        }
      }

      // 座標の更新
      touchData.currentX = touch.clientX;
      touchData.currentY = touch.clientY;
    });

    // スワイプ判定
    if (event.touches.length === 1) {
      this.handleSwipeMove(event.touches[0], event);
    }

    // ピンチ判定
    if (event.touches.length === 2) {
      this.handlePinchMove(event.touches, event);
    }
  }

  /**
   * スワイプ移動処理
   */
  handleSwipeMove(touch, event) {
    const touchData = this.touches.get(touch.identifier);
    if (!touchData) return;

    const deltaX = touch.clientX - touchData.startX;
    const deltaY = touch.clientY - touchData.startY;

    // スワイプ方向の判定
    if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
      const direction = this.getSwipeDirection(deltaX, deltaY);
      this.triggerSwipe(direction, { deltaX, deltaY }, event);
    }
  }

  /**
   * ピンチ移動処理
   */
  handlePinchMove(touches, event) {
    const touch1 = touches[0];
    const touch2 = touches[1];

    const currentDistance = this.calculateDistance(
      touch1.clientX,
      touch1.clientY,
      touch2.clientX,
      touch2.clientY
    );

    const scale = currentDistance / this.initialPinchDistance;
    const deltaScale = currentDistance - this.currentPinchDistance;

    this.triggerPinch(scale, deltaScale, event);
    this.currentPinchDistance = currentDistance;
  }

  /**
   * タッチ終了処理
   */
  handleTouchEnd(event) {
    const endTime = performance.now();

    Array.from(event.changedTouches).forEach(touch => {
      const touchData = this.touches.get(touch.identifier);
      if (!touchData) return;

      // 長押しタイマーのクリア
      if (touchData.longPressTimer) {
        clearTimeout(touchData.longPressTimer);
      }

      // タップ判定
      if (!touchData.moved) {
        this.triggerTap(touch, event, endTime - touchData.startTime);
      }

      // タッチデータの削除
      this.touches.delete(touch.identifier);
    });

    // ピンチ状態のリセット
    if (event.touches.length < 2) {
      this.initialPinchDistance = null;
      this.currentPinchDistance = null;
    }
  }

  /**
   * タッチキャンセル処理
   */
  handleTouchCancel(event) {
    Array.from(event.changedTouches).forEach(touch => {
      const touchData = this.touches.get(touch.identifier);
      if (touchData && touchData.longPressTimer) {
        clearTimeout(touchData.longPressTimer);
      }
      this.touches.delete(touch.identifier);
    });
  }

  /**
   * ポインターイベント処理
   */
  handlePointerDown(event) {
    // タッチイベントと重複しないよう制御
    if (event.pointerType === 'touch') {
      return; // タッチイベントで処理済み
    }

    // マウス/ペンの処理
    this.handleMousePenInput(event);
  }

  handlePointerMove(event) {
    if (event.pointerType !== 'touch') {
      this.handleMousePenMove(event);
    }
  }

  handlePointerUp(event) {
    if (event.pointerType !== 'touch') {
      this.handleMousePenEnd(event);
    }
  }

  /**
   * ジェスチャー認識の初期化
   */
  initializeGestureRecognition() {
    // カスタムジェスチャーの登録
    this.registerGesture('pullToRefresh', {
      recognizer: this.recognizePullToRefresh.bind(this),
      threshold: 100,
      direction: 'down'
    });

    this.registerGesture('swipeToDelete', {
      recognizer: this.recognizeSwipeToDelete.bind(this),
      threshold: 80,
      direction: 'left'
    });

    this.registerGesture('twoFingerTap', {
      recognizer: this.recognizeTwoFingerTap.bind(this),
      fingers: 2
    });
  }

  /**
   * ジェスチャーの登録
   */
  registerGesture(name, config) {
    this.gestures.set(name, config);
  }

  /**
   * プルリフレッシュの認識
   */
  recognizePullToRefresh(touchData, event) {
    if (window.scrollY === 0 && touchData.deltaY > 100) {
      this.triggerCustomGesture('pullToRefresh', touchData, event);
      return true;
    }
    return false;
  }

  /**
   * スワイプ削除の認識
   */
  recognizeSwipeToDelete(touchData, event) {
    const target = touchData.target.closest('.swipe-to-delete-item');
    if (target && touchData.deltaX < -80 && Math.abs(touchData.deltaY) < 30) {
      this.triggerCustomGesture('swipeToDelete', touchData, event, target);
      return true;
    }
    return false;
  }

  /**
   * 2本指タップの認識
   */
  recognizeTwoFingerTap(touchData, event) {
    if (event.touches.length === 2 && !touchData.moved) {
      this.triggerCustomGesture('twoFingerTap', touchData, event);
      return true;
    }
    return false;
  }

  /**
   * ハプティックフィードバックの設定
   */
  setupHapticFeedback() {
    this.hapticPatterns = {
      light: [10],
      medium: [50],
      heavy: [100],
      success: [10, 30, 10],
      error: [50, 50, 50],
      warning: [30, 50, 30],
      selection: [5],
      impact: [20, 10, 20]
    };
  }

  /**
   * ハプティックフィードバックの実行
   */
  triggerHapticFeedback(pattern = 'light') {
    if (!this.deviceInfo.touchCapabilities.supportsVibration) {
      return;
    }

    const vibrationPattern = this.hapticPatterns[pattern] || this.hapticPatterns.light;
    navigator.vibrate(vibrationPattern);
  }

  /**
   * ユーティリティメソッド群
   */
  calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  getSwipeDirection(deltaX, deltaY) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  shouldPreventDefault(event) {
    // スクロール防止が必要な要素の判定
    const preventScrollElements = ['.no-scroll', '.touch-interactive', '.draggable', '.pinch-zoom'];

    return preventScrollElements.some(selector => event.target.closest(selector));
  }

  /**
   * イベントトリガー群
   */
  triggerTap(touch, originalEvent, duration) {
    const customEvent = new CustomEvent('mobiletap', {
      detail: {
        x: touch.clientX,
        y: touch.clientY,
        target: originalEvent.target,
        duration,
        touchId: touch.identifier
      },
      bubbles: true
    });

    originalEvent.target.dispatchEvent(customEvent);
    this.triggerHapticFeedback('selection');
  }

  triggerDoubleTap(touch, originalEvent) {
    const customEvent = new CustomEvent('mobiledoubletap', {
      detail: {
        x: touch.clientX,
        y: touch.clientY,
        target: originalEvent.target,
        touchId: touch.identifier
      },
      bubbles: true
    });

    originalEvent.target.dispatchEvent(customEvent);
    this.triggerHapticFeedback('medium');
  }

  triggerLongPress(touch, originalEvent) {
    const customEvent = new CustomEvent('mobilelongpress', {
      detail: {
        x: touch.clientX,
        y: touch.clientY,
        target: originalEvent.target,
        touchId: touch.identifier
      },
      bubbles: true
    });

    originalEvent.target.dispatchEvent(customEvent);
    this.triggerHapticFeedback('heavy');
  }

  triggerSwipe(direction, delta, originalEvent) {
    const customEvent = new CustomEvent('mobileswipe', {
      detail: {
        direction,
        deltaX: delta.deltaX,
        deltaY: delta.deltaY,
        target: originalEvent.target
      },
      bubbles: true
    });

    originalEvent.target.dispatchEvent(customEvent);
    this.triggerHapticFeedback('light');
  }

  triggerPinch(scale, deltaScale, originalEvent) {
    const customEvent = new CustomEvent('mobilepinch', {
      detail: {
        scale,
        deltaScale,
        target: originalEvent.target
      },
      bubbles: true
    });

    originalEvent.target.dispatchEvent(customEvent);
  }

  triggerCustomGesture(gestureType, touchData, originalEvent, target = null) {
    const customEvent = new CustomEvent(`mobilegesture:${gestureType}`, {
      detail: {
        gestureType,
        touchData,
        target: target || originalEvent.target
      },
      bubbles: true
    });

    (target || originalEvent.target).dispatchEvent(customEvent);
    this.triggerHapticFeedback('medium');
  }

  /**
   * パフォーマンス監視
   */
  startPerformanceMonitoring() {
    // 60FPS監視
    let lastFrameTime = performance.now();

    const checkFrameRate = () => {
      const currentTime = performance.now();
      const frameDelta = currentTime - lastFrameTime;

      if (frameDelta > 16.67) {
        // 60FPS以下
        this.performance.frameDrops++;
      }

      lastFrameTime = currentTime;
      requestAnimationFrame(checkFrameRate);
    };

    requestAnimationFrame(checkFrameRate);
  }

  recordTouchLatency(startTime) {
    const latency = performance.now() - startTime;
    this.performance.touchLatency.push(latency);

    // 最新100件のみ保持
    if (this.performance.touchLatency.length > 100) {
      this.performance.touchLatency.shift();
    }
  }

  /**
   * パフォーマンスレポート取得
   */
  getPerformanceReport() {
    const touchLatency = this.performance.touchLatency;
    const avgLatency =
      touchLatency.length > 0 ? touchLatency.reduce((a, b) => a + b, 0) / touchLatency.length : 0;

    return {
      deviceInfo: this.deviceInfo,
      averageTouchLatency: avgLatency,
      frameDrops: this.performance.frameDrops,
      activeTouches: this.touches.size,
      registeredGestures: Array.from(this.gestures.keys())
    };
  }

  /**
   * マウス/ペン入力処理（ハイブリッドデバイス対応）
   */
  handleMousePenInput(event) {
    // ペン固有の処理（筆圧、傾きなど）
    if (event.pointerType === 'pen') {
      this.handlePenInput(event);
    }
  }

  handlePenInput(event) {
    const penData = {
      pressure: event.pressure || 0,
      tiltX: event.tiltX || 0,
      tiltY: event.tiltY || 0,
      twist: event.twist || 0
    };

    const customEvent = new CustomEvent('mobilepen', {
      detail: {
        x: event.clientX,
        y: event.clientY,
        penData,
        target: event.target
      },
      bubbles: true
    });

    event.target.dispatchEvent(customEvent);
  }
}

// グローバルに公開
window.MobileTouchManager = new MobileTouchManager();

// 使用例とAPIドキュメント
/*
使用例:

// カスタムイベントリスナーの追加
document.addEventListener('mobiletap', (e) => {
  console.log('Mobile tap detected:', e.detail);
});

document.addEventListener('mobileswipe', (e) => {
  console.log('Swipe direction:', e.detail.direction);
});

document.addEventListener('mobilelongpress', (e) => {
  console.log('Long press detected');
  // コンテキストメニューを表示など
});

document.addEventListener('mobilegesture:pullToRefresh', (e) => {
  console.log('Pull to refresh triggered');
  // リフレッシュ処理
});

// パフォーマンス監視
setInterval(() => {
  const report = window.MobileTouchManager.getPerformanceReport();
  console.log('Touch performance:', report);
}, 10000);

// カスタムジェスチャーの追加
window.MobileTouchManager.registerGesture('customSwipe', {
  recognizer: (touchData, event) => {
    // カスタム認識ロジック
    return touchData.deltaX > 150;
  },
  threshold: 150
});
*/
