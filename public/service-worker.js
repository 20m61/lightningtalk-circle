/**
 * Lightning Talk Circle - Service Worker
 * オフライン対応、キャッシュ戦略、バックグラウンド同期を実装
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `lightningtalk-${CACHE_VERSION}`;
const RUNTIME_CACHE = 'lightningtalk-runtime';

// キャッシュするリソース
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/design-tokens.css',
  '/css/style.css',
  '/css/components/button.css',
  '/css/components/card.css',
  '/js/main.js',
  '/js/auth.js',
  '/icons/favicon-32x32.png',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png'
];

// キャッシュ戦略の定義
const CACHE_STRATEGIES = {
  // ネットワークファースト（API リクエスト用）
  networkFirst: async request => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  },

  // キャッシュファースト（静的リソース用）
  cacheFirst: async request => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      // オフラインフォールバック
      if (request.destination === 'document') {
        return caches.match('/offline.html');
      }
      throw error;
    }
  },

  // ステイル・ワイル・リバリデート（画像用）
  staleWhileRevalidate: async request => {
    const cachedResponse = await caches.match(request);

    const fetchPromise = fetch(request).then(async networkResponse => {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    });

    return cachedResponse || fetchPromise;
  }
};

// インストールイベント
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// アクティベートイベント
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('lightningtalk-') && cacheName !== CACHE_NAME;
            })
            .map(cacheName => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// フェッチイベント
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 同一オリジンのリクエストのみ処理
  if (url.origin !== location.origin) {
    return;
  }

  // リクエストタイプに基づいてキャッシュ戦略を選択
  let responsePromise;

  if (request.method !== 'GET') {
    responsePromise = fetch(request);
  } else if (url.pathname.startsWith('/api/')) {
    responsePromise = CACHE_STRATEGIES.networkFirst(request);
  } else if (request.destination === 'image') {
    responsePromise = CACHE_STRATEGIES.staleWhileRevalidate(request);
  } else {
    responsePromise = CACHE_STRATEGIES.cacheFirst(request);
  }

  event.respondWith(responsePromise);
});

// バックグラウンド同期
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-votes') {
    event.waitUntil(syncVotes());
  }
});

// メッセージ同期
async function syncMessages() {
  try {
    const db = await openDB();
    const messages = await getUnsyncedMessages(db);

    for (const message of messages) {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      await markMessageAsSynced(db, message.id);
    }
  } catch (error) {
    console.error('[Service Worker] Message sync failed:', error);
    throw error; // リトライのために再スロー
  }
}

// 投票同期
async function syncVotes() {
  try {
    const db = await openDB();
    const votes = await getUnsyncedVotes(db);

    for (const vote of votes) {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vote)
      });

      await markVoteAsSynced(db, vote.id);
    }
  } catch (error) {
    console.error('[Service Worker] Vote sync failed:', error);
    throw error;
  }
}

// プッシュ通知
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received');

  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/android-chrome-192x192.png',
    badge: '/icons/favicon-32x32.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: '表示',
        icon: '/icons/check.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(self.registration.showNotification('Lightning Talk Circle', options));
});

// 通知クリック
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(clients.openWindow('/'));
  }
});

// IndexedDB ヘルパー関数
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lightningtalk-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('votes')) {
        db.createObjectStore('votes', { keyPath: 'id' });
      }
    };
  });
}

async function getUnsyncedMessages(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const messages = request.result.filter(msg => !msg.synced);
      resolve(messages);
    };
  });
}

async function markMessageAsSynced(db, messageId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    const request = store.get(messageId);

    request.onsuccess = () => {
      const message = request.result;
      message.synced = true;

      const updateRequest = store.put(message);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

async function getUnsyncedVotes(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['votes'], 'readonly');
    const store = transaction.objectStore('votes');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const votes = request.result.filter(vote => !vote.synced);
      resolve(votes);
    };
  });
}

async function markVoteAsSynced(db, voteId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['votes'], 'readwrite');
    const store = transaction.objectStore('votes');
    const request = store.get(voteId);

    request.onsuccess = () => {
      const vote = request.result;
      vote.synced = true;

      const updateRequest = store.put(vote);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

// パフォーマンス監視
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Loaded');
