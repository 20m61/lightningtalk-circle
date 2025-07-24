/**
 * モバイル最適化ローダー
 * 必要最小限のスクリプトのみを読み込む
 */

(function () {
  console.log('[Mobile Optimization] 最適化ローダー開始');

  // デバイス判定
  const isMobile = window.innerWidth < 768;
  const isTouch = 'ontouchstart' in window;

  // 無効化すべきスクリプト（重複機能）
  const scriptsToDisable = [
    'main.js', // main-v2.jsと重複
    'mobile-navigation.js', // unified版で置き換え済み
    'mobile-performance-optimizer.js', // 不要な最適化
    'scroll-fix.js', // v2で置き換え済み
    'responsive-navigation.js', // unified版で置き換え済み
    'ui-ux-integration.js' // 多数の競合
  ];

  // スクリプトタグを無効化
  scriptsToDisable.forEach(scriptName => {
    const scripts = document.querySelectorAll(`script[src*="${scriptName}"]`);
    scripts.forEach(script => {
      // 読み込み前なら削除
      if (!script.loaded) {
        console.log(`[Mobile Optimization] ${scriptName} を無効化`);
        script.remove();
      }
    });
  });

  // 遅延読み込みすべきスクリプト
  const lazyScripts = ['progressive-image.js', 'pwa-installer.js', 'form-enhancements.js'];

  // 遅延読み込み処理
  function lazyLoadScript(src) {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = `/js/${src}`;
      script.async = true;
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }

  // ページ完全ロード後に遅延読み込み
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.log('[Mobile Optimization] 遅延読み込み開始');
      lazyScripts.forEach(src => {
        lazyLoadScript(src).then(() => {
          console.log(`[Mobile Optimization] ${src} 読み込み完了`);
        });
      });
    }, 2000); // 2秒後に読み込み
  });

  // モバイル専用の最適化
  if (isMobile) {
    // 不要なCSSアニメーションを無効化
    const style = document.createElement('style');
    style.textContent = `
      /* モバイルでの過剰なアニメーション無効化 */
      @media (max-width: 767px) {
        * {
          animation-duration: 0.2s !important;
          transition-duration: 0.2s !important;
        }
        
        /* スクロール最適化 */
        body {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
        }
        
        /* タッチ最適化 */
        a, button, input, select, textarea {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // パフォーマンス監視
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      console.log(`[Mobile Optimization] ページロード時間: ${loadTime}ms`);

      if (loadTime > 3000) {
        console.warn('[Mobile Optimization] ロード時間が3秒を超えています');
      }
    });
  }

  console.log('[Mobile Optimization] 最適化完了');
})();
