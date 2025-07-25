/**
 * Console Error Monitor
 * リアルタイムでコンソールエラーを検出して報告
 */

(function () {
  'use strict';

  // エラー収集用配列
  const collectedErrors = [];
  const errorPatterns = new Map();

  // 元のconsoleメソッドを保存
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  // エラーパターンのカウント
  function trackError(type, message, stack) {
    const pattern = message.substring(0, 100); // 最初の100文字でパターン化
    const count = errorPatterns.get(pattern) || 0;
    errorPatterns.set(pattern, count + 1);

    // 新しいエラーパターンのみ収集
    if (count === 0) {
      collectedErrors.push({
        type,
        message,
        stack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });

      // 最大20エラーまで保持
      if (collectedErrors.length > 20) {
        collectedErrors.shift();
      }
    }
  }

  // console.errorをオーバーライド
  console.error = function (...args) {
    const message = args
      .map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    const stack = new Error().stack;
    trackError('error', message, stack);

    // 元のconsole.errorを呼び出し
    originalError.apply(console, args);
  };

  // console.warnをオーバーライド
  console.warn = function (...args) {
    const message = args.map(arg => String(arg)).join(' ');

    // 無視するパターン
    const ignorePatterns = [
      'ResizeObserver loop limit exceeded',
      'DevTools failed to load source map',
      'Failed to load resource: the server responded with a status of 404'
    ];

    if (!ignorePatterns.some(pattern => message.includes(pattern))) {
      trackError('warn', message, new Error().stack);
    }

    // 元のconsole.warnを呼び出し
    originalWarn.apply(console, args);
  };

  // グローバルエラーハンドラー
  window.addEventListener('error', event => {
    const { message, filename, lineno, colno, error } = event;
    const errorInfo = `${message} at ${filename}:${lineno}:${colno}`;
    const stack = error ? error.stack : 'No stack trace';

    trackError('uncaught', errorInfo, stack);
  });

  // Promiseの未処理拒否
  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : 'No stack trace';

    trackError('promise', message, stack);
  });

  // エラーレポート関数
  window.getConsoleErrors = function () {
    console.log(
      '%c=== Console Error Report ===',
      'color: #ef4444; font-weight: bold; font-size: 16px;'
    );

    if (collectedErrors.length === 0) {
      console.log('%c✅ No errors detected!', 'color: #10b981; font-weight: bold;');
      return [];
    }

    console.log(
      `%cFound ${collectedErrors.length} unique error(s):`,
      'color: #f59e0b; font-weight: bold;'
    );

    collectedErrors.forEach((error, index) => {
      console.group(
        `%c[${index + 1}] ${error.type.toUpperCase()}`,
        'color: #ef4444; font-weight: bold;'
      );
      console.log('%cMessage:', 'font-weight: bold;', error.message);
      console.log('%cTimestamp:', 'font-weight: bold;', error.timestamp);
      console.log('%cURL:', 'font-weight: bold;', error.url);
      if (error.stack && error.stack !== 'No stack trace') {
        console.log('%cStack trace:', 'font-weight: bold;');
        console.log(error.stack);
      }
      console.groupEnd();
    });

    // エラーパターンの頻度を表示
    if (errorPatterns.size > 0) {
      console.group('%c📊 Error Frequency', 'color: #8b5cf6; font-weight: bold;');
      errorPatterns.forEach((count, pattern) => {
        console.log(`${count}x: ${pattern.substring(0, 80)}...`);
      });
      console.groupEnd();
    }

    return collectedErrors;
  };

  // クリア関数
  window.clearConsoleErrors = function () {
    collectedErrors.length = 0;
    errorPatterns.clear();
    console.log('%c🧹 Error log cleared', 'color: #10b981; font-weight: bold;');
  };

  // 定期的なエラー報告（開発環境のみ）
  if (window.DEBUG_MODE) {
    setInterval(() => {
      if (collectedErrors.length > 0) {
        console.log(
          '%c⚠️  New errors detected. Run getConsoleErrors() to view.',
          'color: #f59e0b;'
        );
      }
    }, 30000); // 30秒ごと
  }

  // 初期化完了メッセージ
  if (window.DEBUG_MODE) {
    console.log('%c🔍 Console Error Monitor Active', 'color: #3b82f6; font-weight: bold;');
    console.log('Commands: getConsoleErrors(), clearConsoleErrors()');
  }
})();
