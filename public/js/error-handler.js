/**
 * グローバルエラーハンドラー
 * コンソールエラーを捕捉して適切に処理
 */

(function() {
  'use strict';

  // エラーを記録するかどうか
  const logErrors = window.DEBUG_MODE || false;

  // よくあるエラーパターンとその解決策
  const commonErrors = {
    'Cannot read properties of null': {
      solution: 'DOM要素の存在確認を追加',
      severity: 'warning'
    },
    'Cannot read properties of undefined': {
      solution: 'オブジェクトの初期化確認を追加',
      severity: 'warning'
    },
    'is not a function': {
      solution: '関数の定義を確認',
      severity: 'error'
    },
    'Failed to fetch': {
      solution: 'ネットワーク接続を確認',
      severity: 'info'
    },
    'ResizeObserver loop limit exceeded': {
      solution: '無視可能 - ブラウザの最適化による',
      severity: 'ignore'
    },
    'Non-Error promise rejection captured': {
      solution: 'Promiseのエラーハンドリングを追加',
      severity: 'warning'
    }
  };

  // エラーハンドリング関数
  function handleError(message, source, lineno, colno, error) {
    // ResizeObserverエラーは無視
    if (message && message.includes('ResizeObserver')) {
      return true;
    }

    // 開発環境以外では詳細ログを出さない
    if (!logErrors) {
      return true;
    }

    // エラーパターンマッチング
    let errorInfo = null;
    for (const [pattern, info] of Object.entries(commonErrors)) {
      if (message && message.includes(pattern)) {
        errorInfo = info;
        break;
      }
    }

    // 無視すべきエラーはスキップ
    if (errorInfo && errorInfo.severity === 'ignore') {
      return true;
    }

    // エラー情報をフォーマット
    const errorDetails = {
      message,
      source,
      line: lineno,
      column: colno,
      stack: error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      solution: errorInfo ? errorInfo.solution : '原因を調査中'
    };

    // 開発環境でのみ詳細を表示
    if (window.DEBUG_MODE) {
      console.group('%c⚠️ エラーが検出されました', 'color: #ef4444; font-weight: bold;');
      console.error('エラー詳細:', errorDetails);
      if (errorInfo) {
        console.info('推奨される解決策:', errorInfo.solution);
      }
      console.groupEnd();
    }

    // エラーレポート（将来的にサーバーに送信）
    if (window.errorReporter) {
      window.errorReporter.report(errorDetails);
    }

    return true;
  }

  // グローバルエラーハンドラーを設定
  window.addEventListener('error', (event) => {
    handleError(event.message, event.filename, event.lineno, event.colno, event.error);
  });

  // Promiseの未処理拒否を捕捉
  window.addEventListener('unhandledrejection', (event) => {
    handleError(`Unhandled Promise Rejection: ${event.reason}`, '', 0, 0, event.reason);
  });

  // よくある問題の事前チェック
  function performHealthCheck() {
    const checks = [
      {
        name: 'Socket.IO',
        check: () => typeof io !== 'undefined',
        solution: 'Socket.IOライブラリが読み込まれていません'
      },
      {
        name: 'jQuery',
        check: () => typeof $ !== 'undefined' || typeof jQuery !== 'undefined',
        solution: 'jQueryが必要な場合は読み込んでください',
        optional: true
      },
      {
        name: 'EventsManager',
        check: () => typeof EventsManager !== 'undefined',
        solution: 'events-manager.jsが正しく読み込まれていません'
      }
    ];

    const issues = [];
    checks.forEach(check => {
      if (!check.check() && !check.optional) {
        issues.push({
          name: check.name,
          solution: check.solution
        });
      }
    });

    if (issues.length > 0 && window.DEBUG_MODE) {
      console.group('%c⚠️ 起動時チェックで問題を検出', 'color: #f59e0b; font-weight: bold;');
      issues.forEach(issue => {
        console.warn(`${issue.name}: ${issue.solution}`);
      });
      console.groupEnd();
    }
  }

  // DOMContentLoaded後にヘルスチェック実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performHealthCheck);
  } else {
    performHealthCheck();
  }

  // デバッグ用ユーティリティ
  window.errorHandler = {
    // エラーログをクリア
    clearErrors() {
      console.clear();
      console.log('%c✅ エラーログをクリアしました', 'color: #10b981; font-weight: bold;');
    },

    // 現在のエラー状態を確認
    checkStatus() {
      console.log('%c🔍 エラーハンドラー状態', 'color: #3b82f6; font-weight: bold;');
      console.log('デバッグモード:', window.DEBUG_MODE);
      console.log('エラーログ記録:', logErrors);
      performHealthCheck();
    },

    // 手動でエラーをテスト
    testError(type = 'null') {
      switch (type) {
      case 'null': {
        const nullObj = null;
        nullObj.test(); // エラーを発生させる
        break;
      }
      case 'undefined': {
        const undefinedObj = {};
        undefinedObj.method.call(); // エラーを発生させる
        break;
      }
      case 'promise':
        Promise.reject('テスト用のPromise拒否');
        break;
      default:
        throw new Error('テスト用のエラー');
      }
    }
  };
})();
