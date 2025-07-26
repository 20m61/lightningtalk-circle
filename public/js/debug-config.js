/**
 * デバッグ設定
 * 本番環境では自動的にログを無効化
 */

(function() {
  // 本番ドメインの判定
  const isProduction =
    window.location.hostname === 'xn--6wym69a.com' ||
    window.location.hostname === '発表.com' ||
    window.location.hostname.includes('cloudfront.net');

  // URLパラメータでデバッグモードを強制
  const urlParams = new URLSearchParams(window.location.search);
  const forceDebug = urlParams.get('debug') === 'true';

  // デバッグモードの決定
  window.DEBUG_MODE = !isProduction || forceDebug;

  // ログレベル設定
  window.LOG_LEVEL = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  };

  // 現在のログレベル（本番環境ではERRORのみ）
  window.CURRENT_LOG_LEVEL = window.DEBUG_MODE ? window.LOG_LEVEL.DEBUG : window.LOG_LEVEL.ERROR;

  // カスタムロガー
  window.debugLog = {
    error(...args) {
      if (window.CURRENT_LOG_LEVEL >= window.LOG_LEVEL.ERROR) {
        console.error(...args);
      }
    },

    warn(...args) {
      if (window.CURRENT_LOG_LEVEL >= window.LOG_LEVEL.WARN) {
        console.warn(...args);
      }
    },

    info(...args) {
      if (window.CURRENT_LOG_LEVEL >= window.LOG_LEVEL.INFO) {
        console.log(...args);
      }
    },

    debug(...args) {
      if (window.CURRENT_LOG_LEVEL >= window.LOG_LEVEL.DEBUG) {
        console.log(...args);
      }
    }
  };

  // 既存のconsole.logをオーバーライド（オプション）
  if (!window.DEBUG_MODE && !forceDebug) {
    const noop = function() {};
    console.log = noop;
    console.debug = noop;
    // console.warnとconsole.errorは残す
  }

  // デバッグ情報の表示
  if (window.DEBUG_MODE) {
    console.log('%c🔧 Debug Mode Enabled', 'color: #10b981; font-weight: bold;');
    console.log('Production:', isProduction);
    console.log('Force Debug:', forceDebug);
    console.log(
      'Log Level:',
      Object.keys(window.LOG_LEVEL).find(key => window.LOG_LEVEL[key] === window.CURRENT_LOG_LEVEL)
    );
  }
})();
