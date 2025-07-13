/**
 * Service Worker for Lightning Talk Circle
 * オフライン機能とパフォーマンス最適化
 */

const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  static: `static-cache-${CACHE_VERSION}`,
  dynamic: `dynamic-cache-${CACHE_VERSION}`,
  images: `image-cache-${CACHE_VERSION}`
};

// キャッシュする静的リソース
const STATIC_ASSETS = [
  '/',
  '/css/critical.css',
  '/css/style.css',
  '/js/core.js',
  '/manifest.json',
  '/offline.html'
];

// キャッシュ戦略の設定
const CACHE_STRATEGIES = {
  // Cache First - 静的アセット用
  cacheFirst: [
    /\.(?:css|js)$/,
    /\.(?:woff|woff2|ttf|otf)$/,
    /^https:\/\/fonts\.(?:googleapis|gstatic)\.com/
  ],

  // Network First - API用
  networkFirst: [/\/api\//],

  // Stale While Revalidate - 画像用
  staleWhileRevalidate: [/\.(?:jpg|jpeg|png|gif|webp|svg)$/, /^https:\/\/\w+\.cloudinary\.com/]
};

// Service Worker インストール
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker');

  event.waitUntil(
    caches
      .open(CACHE_NAMES.static)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Service Worker アクティベート
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker');

  event.waitUntil(
    // 古いキャッシュを削除
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return !Object.values(CACHE_NAMES).includes(cacheName);
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// フェッチイベントハンドラ
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 同一オリジンのリクエストのみ処理
  if (url.origin !== location.origin) {
    return;
  }

  // キャッシュ戦略を決定
  if (matchesPatterns(request.url, CACHE_STRATEGIES.cacheFirst)) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (matchesPatterns(request.url, CACHE_STRATEGIES.networkFirst)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (matchesPatterns(request.url, CACHE_STRATEGIES.staleWhileRevalidate)) {
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    // デフォルト: Network First
    event.respondWith(networkFirstStrategy(request));
  }
});

// Cache First 戦略
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAMES.static);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('[SW] Cache hit:', request.url);
    return cachedResponse;
  }

  console.log('[SW] Cache miss, fetching:', request.url);
  try {
    const networkResponse = await fetch(request);

    // 成功したレスポンスをキャッシュ
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    // オフラインページを返す
    return caches.match('/offline.html');
  }
}

// Network First 戦略
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // 成功したレスポンスをキャッシュ
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // APIリクエストの場合はエラーレスポンスを返す
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({ error: 'オフラインです' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // その他の場合はオフラインページを返す
    return caches.match('/offline.html');
  }
}

// Stale While Revalidate 戦略
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAMES.images);
  const cachedResponse = await cache.match(request);

  // キャッシュがあれば即座に返す
  const fetchPromise = fetch(request).then(networkResponse => {
    // バックグラウンドでキャッシュを更新
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

// パターンマッチング
function matchesPatterns(url, patterns) {
  return patterns.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(url);
    }
    return url.includes(pattern);
  });
}

// プッシュ通知
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '新しいイベントが追加されました',
    icon: '/icon/icon-192x192.png',
    badge: '/icon/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: '詳細を見る'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Lightning Talk Circle', options)
  );
});

// 通知クリック
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const url = event.notification.data.url;
    event.waitUntil(clients.openWindow(url));
  }
});

// バックグラウンド同期
self.addEventListener('sync', event => {
  if (event.tag === 'sync-events') {
    event.waitUntil(syncEvents());
  }
});

async function syncEvents() {
  try {
    const response = await fetch('/api/events/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('[SW] Events synced successfully');
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// メッセージハンドラ
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      })
    );
  }
});
