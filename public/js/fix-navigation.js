/**
 * ナビゲーション修正スクリプト
 * Service Workerとリンク動作の問題を解決
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 Navigation fix script loaded');

  // 1. Service Worker のナビゲーション処理を修正
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // Service Worker にメッセージを送信してナビゲーション処理を更新
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_NAVIGATION_HANDLING'
    });
  }

  // 2. フッターリンクの修正
  const footerLinks = document.querySelectorAll('.footer-links a');

  footerLinks.forEach(link => {
    // data属性を追加してService Workerに通常のナビゲーションであることを示す
    link.setAttribute('data-navigation', 'true');

    // 既存のイベントリスナーを削除してクリーンな状態にする
    const newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);

    // クリックイベントのログを追加（デバッグ用）
    newLink.addEventListener(
      'click',
      e => {
        console.log('Footer link clicked:', newLink.href);

        // 内部リンクの場合
        if (newLink.hostname === window.location.hostname) {
          // HTMLファイルへの直接リンクの場合は、Service Workerをバイパス
          if (newLink.pathname.endsWith('.html')) {
            e.preventDefault();

            // Service Worker をバイパスして直接ナビゲーション
            window.location.href = newLink.href;
          }
        }
      },
      true
    ); // キャプチャフェーズで実行
  });

  // 3. すべてのaタグに対する汎用的な修正
  document.addEventListener(
    'click',
    e => {
      const link = e.target.closest('a');

      if (link && link.href && !link.href.startsWith('#')) {
        // 同一オリジンのHTMLファイルへのリンク
        if (
          link.hostname === window.location.hostname &&
          (link.pathname.endsWith('.html') ||
            link.pathname === '/privacy' ||
            link.pathname === '/terms' ||
            link.pathname === '/contact')
        ) {
          console.log('Intercepted link click:', link.href);

          // 他のイベントハンドラーがpreventDefault()を呼んでいる可能性があるため
          // 強制的にナビゲーションを実行
          setTimeout(() => {
            if (!e.defaultPrevented) {
              return; // デフォルト動作が阻止されていなければ何もしない
            }

            // デフォルト動作が阻止されている場合は手動でナビゲーション
            console.log('Forcing navigation to:', link.href);
            window.location.href = link.href;
          }, 0);
        }
      }
    },
    true
  ); // キャプチャフェーズで実行

  console.log('✅ Navigation fixes applied');
});

// Service Worker の更新を促す
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    if (registration.waiting) {
      // 新しいService Workerが待機中の場合、アクティベートを促す
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });

  // Service Worker の更新をチェック
  navigator.serviceWorker.getRegistration().then(registration => {
    if (registration) {
      registration.update();
    }
  });
}
