/**
 * 緊急スクロール修正
 * ページロード後に即座にスクロールを解放
 */

(function() {
  const debug = window.DEBUG_MODE || false;
  const log = debug ? console.log.bind(console, '[緊急スクロール修正]') : () => {};

  log('開始');

  // スクロール関連のスタイルを完全リセット
  function resetScroll() {
    // HTMLとBODYの両方をリセット
    const elements = [document.documentElement, document.body];

    elements.forEach(el => {
      el.style.overflow = '';
      el.style.overflowX = '';
      el.style.overflowY = '';
      el.style.position = '';
      el.style.top = '';
      el.style.left = '';
      el.style.right = '';
      el.style.bottom = '';
      el.style.width = '';
      el.style.height = '';
      el.style.touchAction = '';
    });

    // iOSのスクロール問題対策
    document.body.style.webkitOverflowScrolling = 'touch';

    // スクロール位置をトップに
    window.scrollTo(0, 0);

    log('リセット完了');
  }

  // 即座に実行
  resetScroll();

  // DOMContentLoaded後にも実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resetScroll);
  }

  // 完全ロード後にも実行
  window.addEventListener('load', resetScroll);

  // 1秒後にも念のため実行
  setTimeout(resetScroll, 1000);

  // グローバル関数として提供
  window.emergencyScrollFix = resetScroll;

  // 他のスクリプトがoverflowを設定するのを監視
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const { target } = mutation;
        if (
          (target === document.body || target === document.documentElement) &&
          (target.style.overflow === 'hidden' || target.style.position === 'fixed')
        ) {
          console.warn('[緊急スクロール修正] 不正なスタイル変更を検出');
          // 少し遅延してからリセット（他の処理を妨げないため）
          setTimeout(() => {
            if (
              !document.querySelector('.mobile-menu--active') &&
              !document.querySelector('.modal.show') &&
              !document.querySelector('.admin-modal--active')
            ) {
              log('自動修復実行');
              resetScroll();
            }
          }, 100);
        }
      }
    });
  });

  // body要素の監視を開始
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style']
  });

  // html要素の監視も開始
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style']
  });

  log('監視開始');
})();
