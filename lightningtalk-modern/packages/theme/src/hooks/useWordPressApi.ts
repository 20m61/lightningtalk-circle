/**
 * WordPress API Hook
 * WordPressのREST APIとの統合を簡素化するカスタムフック
 */

import { useState, useEffect, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  cache?: boolean;
}

// キャッシュストレージ
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * WordPress REST API を使用するためのカスタムフック
 */
export function useWordPressApi<T = any>(
  endpoint: string, 
  options: ApiOptions = {}
): ApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const { method = 'GET', body, headers = {}, cache = true } = options;

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // キャッシュチェック
      const cacheKey = `${method}:${endpoint}:${JSON.stringify(body)}`;
      if (cache && method === 'GET') {
        const cached = apiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          setState({
            data: cached.data,
            loading: false,
            error: null
          });
          return;
        }
      }

      // WordPress API URL の構築
      const wpData = window.wpLightningTalk;
      if (!wpData) {
        throw new Error('WordPress integration data not found');
      }

      const apiUrl = wpData.apiUrl.endsWith('/') 
        ? wpData.apiUrl 
        : wpData.apiUrl + '/';
      
      const url = endpoint.startsWith('/') 
        ? apiUrl + endpoint.slice(1)
        : apiUrl + endpoint;

      // リクエストオプションの設定
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': wpData.nonce,
          ...headers
        },
        credentials: 'same-origin'
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      // API リクエスト実行
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      // キャッシュに保存 (GET リクエストのみ)
      if (cache && method === 'GET') {
        apiCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000 // 5分間のTTL
        });
      }

      setState({
        data,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('WordPress API Error:', error);
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }, [endpoint, method, body, headers, cache]);

  const refetch = useCallback(() => {
    // キャッシュをクリア
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(body)}`;
    apiCache.delete(cacheKey);
    fetchData();
  }, [fetchData, method, endpoint, body]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch
  };
}

/**
 * WordPress API へのポスト操作専用フック
 */
export function useWordPressPost<T = any>(endpoint: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = useCallback(async (data: any): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const wpData = window.wpLightningTalk;
      if (!wpData) {
        throw new Error('WordPress integration data not found');
      }

      const apiUrl = wpData.apiUrl.endsWith('/') 
        ? wpData.apiUrl 
        : wpData.apiUrl + '/';
      
      const url = endpoint.startsWith('/') 
        ? apiUrl + endpoint.slice(1)
        : apiUrl + endpoint;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': wpData.nonce
        },
        credentials: 'same-origin',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      setLoading(false);
      return result;

    } catch (error) {
      console.error('WordPress API Post Error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setLoading(false);
      return null;
    }
  }, [endpoint]);

  return { post, loading, error };
}

/**
 * リアルタイム更新のためのSSE（Server-Sent Events）フック
 */
export function useWordPressSSE(endpoint: string) {
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const wpData = window.wpLightningTalk;
    if (!wpData) {
      setError('WordPress integration data not found');
      return;
    }

    const apiUrl = wpData.apiUrl.endsWith('/') 
      ? wpData.apiUrl 
      : wpData.apiUrl + '/';
    
    const url = endpoint.startsWith('/') 
      ? apiUrl + endpoint.slice(1)
      : apiUrl + endpoint;

    const eventSource = new EventSource(`${url}?nonce=${wpData.nonce}`);

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastUpdate(data);
      } catch (err) {
        console.error('SSE data parse error:', err);
      }
    };

    eventSource.onerror = (event) => {
      setConnected(false);
      setError('Connection error');
      console.error('SSE error:', event);
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [endpoint]);

  return { connected, lastUpdate, error };
}

/**
 * API キャッシュクリア用ユーティリティ
 */
export function clearApiCache(pattern?: string) {
  if (pattern) {
    // パターンマッチングでキャッシュクリア
    for (const key of apiCache.keys()) {
      if (key.includes(pattern)) {
        apiCache.delete(key);
      }
    }
  } else {
    // 全キャッシュクリア
    apiCache.clear();
  }
}

/**
 * API エラーハンドリング用ユーティリティ
 */
export function handleApiError(error: any): string {
  if (error.response) {
    // サーバーレスポンスエラー
    return `サーバーエラー: ${error.response.status} ${error.response.statusText}`;
  } else if (error.request) {
    // ネットワークエラー
    return 'ネットワークエラー: サーバーに接続できません';
  } else {
    // その他のエラー
    return error.message || '不明なエラーが発生しました';
  }
}