/**
 * Fetch Wrapper
 * APIエラーを適切に処理するためのfetchラッパー
 */

(function () {
  'use strict';

  // 元のfetchを保存
  const originalFetch = window.fetch;

  // エラーを静かに処理するfetchラッパー
  window.safeFetch = async function (url, options = {}) {
    try {
      const response = await originalFetch(url, options);

      // 404エラーの特別処理
      if (response.status === 404) {
        // 画像リソースの404は警告レベルに
        if (
          url.includes('.webp') ||
          url.includes('.avif') ||
          url.includes('.jpg') ||
          url.includes('.png')
        ) {
          if (window.DEBUG_MODE) {
            console.warn('Image not found (expected):', url);
          }
          throw new Error(`404: Image not found - ${url}`);
        }
      }

      return response;
    } catch (error) {
      // ネットワークエラーなどの処理
      if (window.DEBUG_MODE) {
        console.warn('Fetch error:', url, error.message);
      }
      throw error;
    }
  };

  // グローバルfetchのオーバーライド（オプション）
  // 注意: 既存のコードに影響を与える可能性があるため、デフォルトでは無効
  if (window.OVERRIDE_FETCH) {
    window.fetch = function (url, options) {
      // APIエンドポイントのみラップ
      if (url.startsWith('/api/') || url.includes('/api/')) {
        return window.safeFetch(url, options);
      }
      // その他のリクエストは元のfetchを使用
      return originalFetch(url, options);
    };
  }

  // APIヘルパー関数
  window.apiRequest = async function (endpoint, options = {}) {
    const apiEndpoint = window.APP_CONFIG?.apiEndpoint || '/api';
    const url = endpoint.startsWith('http') ? endpoint : `${apiEndpoint}${endpoint}`;

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      const response = await window.safeFetch(url, mergedOptions);

      if (!response.ok) {
        // エラーレスポンスの処理
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: response.statusText };
        }

        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // 正常なレスポンス
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return response;
    } catch (error) {
      // APIエラーの静かな処理
      if (window.DEBUG_MODE) {
        console.warn(`API request failed: ${endpoint}`, error);
      }

      // エラーを再スロー（呼び出し元で処理）
      throw error;
    }
  };

  // デバッグ情報
  if (window.DEBUG_MODE) {
    console.log('%c✅ Fetch Wrapper Loaded', 'color: #10b981; font-weight: bold;');
    console.log('Use window.safeFetch() or window.apiRequest() for error-handled requests');
  }
})();
