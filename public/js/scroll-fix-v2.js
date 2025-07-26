/**
 * スクロール問題修正スクリプト v2
 * より安全なスクロール管理を実装
 */

class ScrollManagerV2 {
  constructor() {
    this.locks = new Map(); // ロック要求者を管理
    this.scrollPosition = 0;
    this.isLocked = false;

    // デバッグモード
    this.debug = window.DEBUG_MODE || false;
    this.log = this.debug ? this.log.bind(console, '[ScrollManagerV2]') : () => {};

    this.init();
  }

  init() {
    // 初期状態を確実にリセット
    this.forceUnlock();

    // グローバル関数として公開
    window.scrollManager = this;
    window.fixScroll = () => this.forceUnlock();

    this.log('[ScrollManagerV2] 初期化完了');
  }

  lock(source = 'unknown') {
    this.log(`[ScrollManagerV2] ロック要求: ${source}`);

    if (!this.isLocked) {
      // 初回ロック時のみ処理
      this.scrollPosition = window.scrollY;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollPosition}px`;
      document.body.style.width = '100%';
      this.isLocked = true;
    }

    this.locks.set(source, true);
    this.log(`[ScrollManagerV2] アクティブロック数: ${this.locks.size}`);
  }

  unlock(source = 'unknown') {
    this.log(`[ScrollManagerV2] ロック解除要求: ${source}`);

    this.locks.delete(source);

    if (this.locks.size === 0 && this.isLocked) {
      // 全てのロックが解除された時のみスクロールを復元
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';

      // スクロール位置を復元
      window.scrollTo(0, this.scrollPosition);
      this.isLocked = false;

      this.log('[ScrollManagerV2] スクロール復元完了');
    }

    this.log(`[ScrollManagerV2] 残りロック数: ${this.locks.size}`);
  }

  forceUnlock() {
    this.log('[ScrollManagerV2] 強制ロック解除');

    // 全てのロックをクリア
    this.locks.clear();
    this.isLocked = false;

    // スタイルを完全にリセット
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';

    // スクロール位置をリセット
    if (this.scrollPosition) {
      window.scrollTo(0, this.scrollPosition);
      this.scrollPosition = 0;
    }
  }

  // 現在のロック状態を取得
  isScrollLocked() {
    return this.isLocked;
  }

  // デバッグ情報
  debug() {
    this.log('[ScrollManagerV2] デバッグ情報:');
    this.log('- ロック状態:', this.isLocked);
    this.log('- アクティブロック:', Array.from(this.locks.keys()));
    this.log('- 保存スクロール位置:', this.scrollPosition);
    this.log('- body.style.overflow:', document.body.style.overflow);
    this.log('- body.style.position:', document.body.style.position);
  }
}

// 既存のScrollManagerを置き換え
(() => {
  // 古いScrollManagerのクリーンアップ
  if (window.scrollManager && window.scrollManager.forceUnlockScroll) {
    window.scrollManager.forceUnlockScroll();
  }

  // 新しいScrollManagerV2を作成
  const manager = new ScrollManagerV2();

  // デバッグ関数
  window.debugScroll = () => manager.debug();

  // ページ離脱時の安全装置
  window.addEventListener('beforeunload', () => {
    manager.forceUnlock();
  });

  // 5秒後に自動チェック（安全装置）
  setTimeout(() => {
    if (manager.isScrollLocked() && manager.locks.size === 0) {
      if (window.DEBUG_MODE) {console.warn('[ScrollManagerV2] 不正なロック状態を検出、自動修復');}
      manager.forceUnlock();
    }
  }, 5000);
})();

this.log('[ScrollManagerV2] ロード完了');
