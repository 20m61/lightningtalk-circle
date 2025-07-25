# 🗺️ Lightning Talk Circle - 地図・連絡・通知システム仕様書

## 🎯 概要

Lightning Talk
Circleの地図機能、連絡システム、通知機能を統合し、参加者のイベント参加体験を向上させる包括的システム。イベントの位置情報、参加者間の連絡、リアルタイム通知を一元管理する。

---

## 🗺️ **1. 地図システム設計**

### **1.1 Google Maps統合**

#### **基本機能**

```javascript
const mapSystem = {
  // 地図表示機能
  display: {
    eventLocation: 'イベント会場の表示',
    nearbyFacilities: '周辺施設情報',
    transportationRoutes: '交通手段ルート',
    realTimeLocation: 'リアルタイム位置共有',
    offlineMapData: 'オフライン地図データ'
  },

  // インタラクティブ機能
  interaction: {
    zoomControls: 'ズーム操作',
    layerToggle: 'レイヤー切り替え',
    directionsApi: 'ルート検索',
    streetView: 'ストリートビュー',
    markerClustering: 'マーカーグループ化'
  },

  // データ統合
  integration: {
    eventData: 'イベント情報連携',
    participantLocation: '参加者位置情報',
    emergencyContacts: '緊急連絡先',
    facilitiesInfo: '施設詳細情報'
  }
};
```

#### **データスキーマ**

```javascript
// EventLocation Schema
const eventLocationSchema = {
  id: String,
  eventId: String, // 関連イベントID
  venue: {
    name: String, // 会場名
    address: {
      formatted: String, // フォーマット済み住所
      prefecture: String, // 都道府県
      city: String, // 市区町村
      street: String, // 町名番地
      building: String, // 建物名
      floor: String, // 階数・部屋番号
      postalCode: String // 郵便番号
    },
    coordinates: {
      latitude: Number, // 緯度
      longitude: Number, // 経度
      accuracy: Number, // 精度(m)
      source: 'manual' | 'geocoded' | 'gps'
    },
    details: {
      capacity: Number, // 収容人数
      facilities: [String], // 施設設備
      accessibility: {
        wheelchairAccessible: Boolean,
        elevator: Boolean,
        parkingAvailable: Boolean,
        publicTransportNearby: Boolean
      },
      contactInfo: {
        phone: String,
        email: String,
        website: String
      }
    }
  },
  mapSettings: {
    defaultZoom: Number, // デフォルトズームレベル
    mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain',
    showTraffic: Boolean, // 交通情報表示
    showTransit: Boolean, // 公共交通機関表示
    showBicycling: Boolean, // 自転車ルート表示
    restrictBounds: {
      // 表示範囲制限
      northeast: { lat: Number, lng: Number },
      southwest: { lat: Number, lng: Number }
    }
  },
  nearbyPlaces: [
    {
      type: 'restaurant' | 'convenience' | 'parking' | 'station' | 'hotel',
      name: String,
      coordinates: { lat: Number, lng: Number },
      distance: Number, // 距離(m)
      rating: Number, // 評価
      priceLevel: Number, // 価格帯
      openingHours: String,
      website: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
};

// ParticipantLocation Schema (オプション機能)
const participantLocationSchema = {
  id: String,
  eventId: String,
  userId: String,
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },
  privacy: {
    shareLocation: Boolean, // 位置共有許可
    shareWithOrganizers: Boolean, // 主催者との共有
    shareWithParticipants: Boolean, // 参加者間での共有
    shareRadius: Number // 共有精度範囲(m)
  },
  status: 'traveling' | 'arrived' | 'departed',
  estimatedArrival: Date,
  actualArrival: Date,
  notes: String // 移動状況メモ
};
```

### **1.2 地図UI設計**

#### **地図コンポーネント**

```css
/* Map Container */
.map-container {
  width: 100%;
  height: var(--map-height); /* 400px default */
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-md);
}

.map-fullscreen {
  height: 100vh;
  border-radius: 0;
}

/* Map Controls */
.map-controls {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: var(--z-index-docked);
}

.map-control-btn {
  width: var(--size-10);
  height: var(--size-10);
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-colors);
  box-shadow: var(--shadow-sm);
}

.map-control-btn:hover {
  background: var(--color-neutral-50);
  box-shadow: var(--shadow-md);
}

/* Map Info Panel */
.map-info-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  color: var(--color-neutral-0);
  padding: var(--space-6) var(--space-4) var(--space-4);
  transform: translateY(calc(100% - 60px));
  transition: var(--transition-transform);
}

.map-info-panel.expanded {
  transform: translateY(0);
}

.map-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  cursor: pointer;
}

.map-info-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-4);
  align-items: start;
}

/* Venue Details */
.venue-details {
  display: grid;
  gap: var(--space-3);
}

.venue-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.venue-address {
  font-size: var(--font-size-sm);
  opacity: 0.9;
  line-height: var(--line-height-relaxed);
}

.venue-facilities {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.facility-tag {
  padding: var(--space-1) var(--space-2);
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  backdrop-filter: blur(10px);
}

/* Direction Actions */
.direction-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.direction-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary-500);
  color: var(--color-neutral-0);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-colors);
  white-space: nowrap;
}

.direction-btn:hover {
  background: var(--color-primary-600);
}
```

---

## 📞 **2. 連絡システム設計**

### **2.1 緊急連絡機能**

#### **連絡手段の階層化**

```javascript
const contactSystem = {
  // 緊急度レベル
  urgencyLevels: {
    critical: {
      level: 'critical',
      description: '緊急事態（災害・事故等）',
      channels: ['sms', 'push', 'email', 'call'],
      response: 'immediate', // 即座
      escalation: 'auto' // 自動エスカレーション
    },
    high: {
      level: 'high',
      description: 'イベント変更・中止',
      channels: ['push', 'email', 'sms'],
      response: 'within_15min',
      escalation: 'manual'
    },
    medium: {
      level: 'medium',
      description: '重要なお知らせ',
      channels: ['push', 'email'],
      response: 'within_1hour',
      escalation: 'none'
    },
    low: {
      level: 'low',
      description: '一般的な連絡',
      channels: ['email', 'in_app'],
      response: 'within_24hours',
      escalation: 'none'
    }
  },

  // 連絡先データベース
  contacts: {
    emergency: {
      police: '110',
      fire: '119',
      medical: '119',
      venue: 'venue_phone_number',
      organizer: 'primary_organizer_contact'
    },
    support: {
      technical: 'tech_support_contact',
      event: 'event_coordinator_contact',
      accessibility: 'accessibility_support_contact'
    }
  }
};
```

#### **連絡先管理スキーマ**

```javascript
// EmergencyContact Schema
const emergencyContactSchema = {
  id: String,
  eventId: String,
  type: 'emergency' | 'support' | 'venue' | 'organizer',
  contacts: [
    {
      role: String, // 役割
      name: String, // 担当者名
      organization: String, // 所属組織
      phone: {
        primary: String, // 主要電話番号
        secondary: String, // 副電話番号
        available24h: Boolean // 24時間対応
      },
      email: {
        primary: String,
        emergency: String // 緊急時専用
      },
      languages: [String], // 対応言語
      availability: {
        timezone: String,
        hours: {
          monday: { start: String, end: String },
          tuesday: { start: String, end: String }
          // ... 他の曜日
        },
        exceptions: [
          {
            // 例外期間
            date: String,
            reason: String,
            alternative: String
          }
        ]
      }
    }
  ],
  procedures: {
    emergency: {
      immediate: [String], // 即座の対応手順
      escalation: [String], // エスカレーション手順
      documentation: String // 記録要領
    },
    normal: {
      response_time: String, // 通常応答時間
      channels: [String], // 利用可能チャンネル
      process: [String] // 対応プロセス
    }
  },
  lastUpdated: Date,
  verifiedAt: Date // 連絡先確認日時
};
```

### **2.2 参加者間連絡機能**

#### **連絡機能設計**

```javascript
const participantContactSystem = {
  // プライバシー保護連絡
  anonymousMessaging: {
    enabled: true,
    throughPlatform: true, // プラットフォーム経由
    directContactRestricted: true, // 直接連絡制限
    moderationRequired: false // モデレーション要否
  },

  // グループ機能
  groups: {
    byRole: ['speakers', 'organizers', 'participants'],
    byInterest: ['技術', 'デザイン', 'ビジネス'],
    byLocation: ['同じ駅', '同じ地域'],
    custom: 'カスタムグループ作成可能'
  },

  // 連絡制限
  restrictions: {
    timeBasedLimits: true, // 時間制限
    frequencyLimits: true, // 頻度制限
    contentFiltering: true, // コンテンツフィルタ
    reportingSystem: true // 報告システム
  }
};
```

---

## 🔔 **3. 通知システム設計**

### **3.1 マルチチャンネル通知**

#### **通知配信アーキテクチャ**

```javascript
const notificationSystem = {
  // 配信チャンネル
  channels: {
    push: {
      provider: 'FCM', // Firebase Cloud Messaging
      platforms: ['web', 'android', 'ios'],
      features: ['rich_content', 'actions', 'images'],
      fallback: 'none'
    },
    email: {
      provider: 'multiple', // SendGrid, AWS SES, Gmail
      templates: 'transactional',
      personalization: true,
      tracking: true,
      fallback: 'sms'
    },
    sms: {
      provider: 'Twilio',
      regions: ['japan'],
      features: ['unicode', 'delivery_receipt'],
      fallback: 'email'
    },
    inApp: {
      realTime: true,
      persistence: '30_days',
      sync: 'cross_device',
      fallback: 'push'
    },
    webhook: {
      external: true, // 外部システム連携
      retry: 'exponential_backoff',
      security: 'hmac_signature'
    }
  },

  // 通知タイプ
  types: {
    eventReminders: {
      schedule: ['1_week', '1_day', '1_hour', '30_min'],
      channels: ['email', 'push'],
      customizable: true
    },
    emergencyAlerts: {
      immediate: true,
      channels: ['sms', 'push', 'email', 'call'],
      bypass_preferences: true
    },
    chatMessages: {
      realTime: true,
      channels: ['push', 'in_app'],
      grouping: true // メッセージグループ化
    },
    systemUpdates: {
      channels: ['email', 'in_app'],
      frequency: 'weekly_digest',
      opt_out: true
    }
  }
};
```

#### **通知設定スキーマ**

```javascript
// NotificationPreferences Schema
const notificationPreferencesSchema = {
  id: String,
  userId: String,
  eventId: String, // イベント固有設定
  preferences: {
    channels: {
      email: {
        enabled: Boolean,
        address: String,
        verified: Boolean,
        frequency: 'immediate' | 'daily' | 'weekly' | 'never'
      },
      push: {
        enabled: Boolean,
        deviceTokens: [String],
        sound: Boolean,
        badge: Boolean,
        banner: Boolean
      },
      sms: {
        enabled: Boolean,
        number: String,
        verified: Boolean,
        country_code: String
      },
      inApp: {
        enabled: Boolean,
        sound: Boolean,
        popup: Boolean
      }
    },
    types: {
      eventReminders: {
        enabled: Boolean,
        timing: [String], // '1_week', '1_day', etc.
        channels: [String]
      },
      chatMessages: {
        enabled: Boolean,
        mentions_only: Boolean,
        sound: Boolean,
        preview: Boolean
      },
      emergencyAlerts: {
        enabled: Boolean, // 常にtrue推奨
        all_channels: Boolean
      },
      systemUpdates: {
        enabled: Boolean,
        digest_frequency: String
      }
    },
    quietHours: {
      enabled: Boolean,
      timezone: String,
      start: String, // "22:00"
      end: String, // "07:00"
      exceptions: ['emergency'] // 例外通知タイプ
    },
    location: {
      timezone: String,
      autoDetect: Boolean
    }
  },
  lastUpdated: Date
};

// NotificationLog Schema
const notificationLogSchema = {
  id: String,
  userId: String,
  eventId: String,
  type: String,
  channel: String,
  content: {
    title: String,
    body: String,
    data: Object // 追加データ
  },
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'clicked',
  attempts: Number,
  sentAt: Date,
  deliveredAt: Date,
  clickedAt: Date,
  error: String, // エラー詳細
  tracking: {
    messageId: String,
    externalId: String, // 外部サービスID
    cost: Number, // 送信コスト
    latency: Number // 配信遅延(ms)
  }
};
```

### **3.2 通知UI設計**

#### **通知センター**

```css
/* Notification Center */
.notification-center {
  position: fixed;
  top: var(--header-height);
  right: var(--space-4);
  width: var(--container-sm);
  max-height: calc(100vh - var(--header-height) - var(--space-8));
  background: var(--color-neutral-0);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-neutral-200);
  z-index: var(--z-index-dropdown);
  transform: translateX(calc(100% + var(--space-4)));
  transition: var(--transition-transform);
}

.notification-center.open {
  transform: translateX(0);
}

.notification-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-neutral-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notification-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.notification-actions {
  display: flex;
  gap: var(--space-2);
}

/* Notification List */
.notification-list {
  max-height: 400px;
  overflow-y: auto;
  padding: var(--space-2);
}

.notification-item {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
  cursor: pointer;
  transition: var(--transition-colors);
  position: relative;
}

.notification-item:hover {
  background: var(--color-neutral-50);
}

.notification-item.unread {
  background: var(--color-primary-50);
  border-left: 4px solid var(--color-primary-500);
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 8px;
  height: 8px;
  background: var(--color-primary-500);
  border-radius: 50%;
}

/* Notification Content */
.notification-content {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-3);
  align-items: start;
}

.notification-icon {
  width: var(--size-8);
  height: var(--size-8);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon.type-emergency {
  background: var(--color-error-100);
  color: var(--color-error-600);
}

.notification-icon.type-event {
  background: var(--color-primary-100);
  color: var(--color-primary-600);
}

.notification-icon.type-chat {
  background: var(--color-secondary-100);
  color: var(--color-secondary-600);
}

.notification-icon.type-system {
  background: var(--color-neutral-100);
  color: var(--color-neutral-600);
}

.notification-body {
  min-width: 0; /* Allow text truncation */
}

.notification-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin: 0 0 var(--space-1) 0;
  color: var(--color-neutral-900);
}

.notification-message {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  line-height: var(--line-height-relaxed);
  margin: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.notification-time {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-500);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Notification Badge */
.notification-badge {
  position: absolute;
  top: -var(--space-1);
  right: -var(--space-1);
  min-width: var(--size-5);
  height: var(--size-5);
  background: var(--color-error-500);
  color: var(--color-neutral-0);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  border: 2px solid var(--color-neutral-0);
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: calc(var(--header-height) + var(--space-4));
  right: var(--space-4);
  z-index: var(--z-index-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}

.toast {
  background: var(--color-neutral-0);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-neutral-200);
  padding: var(--space-4);
  min-width: 300px;
  max-width: 400px;
  pointer-events: auto;
  transform: translateX(calc(100% + var(--space-4)));
  transition: var(--transition-transform);
  position: relative;
}

.toast.show {
  transform: translateX(0);
}

.toast.hide {
  transform: translateX(calc(100% + var(--space-4)));
}

.toast.type-success {
  border-left: 4px solid var(--color-success-500);
}

.toast.type-warning {
  border-left: 4px solid var(--color-warning-500);
}

.toast.type-error {
  border-left: 4px solid var(--color-error-500);
}

.toast.type-info {
  border-left: 4px solid var(--color-info-500);
}

.toast-content {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-3);
  align-items: start;
}

.toast-icon {
  width: var(--size-6);
  height: var(--size-6);
  flex-shrink: 0;
}

.toast-body {
  min-width: 0;
}

.toast-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin: 0 0 var(--space-1) 0;
  color: var(--color-neutral-900);
}

.toast-message {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.toast-close {
  width: var(--size-6);
  height: var(--size-6);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-neutral-500);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-colors);
}

.toast-close:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-neutral-200);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  overflow: hidden;
}

.toast-progress-bar {
  height: 100%;
  background: var(--color-primary-500);
  width: 100%;
  animation: toast-progress 5s linear forwards;
}

@keyframes toast-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
```

---

## ⚙️ **4. 実装統合設計**

### **4.1 システム間連携**

#### **統合API設計**

```javascript
// Location & Contact Integration API
const integratedApiRoutes = {
  // 地図関連API
  'GET /api/events/:eventId/location': 'getEventLocation',
  'PUT /api/events/:eventId/location': 'updateEventLocation',
  'GET /api/events/:eventId/directions': 'getDirections',
  'GET /api/events/:eventId/nearby': 'getNearbyPlaces',

  // 参加者位置共有API（オプション）
  'POST /api/events/:eventId/location/share': 'shareLocation',
  'GET /api/events/:eventId/participants/locations': 'getParticipantLocations',
  'DELETE /api/events/:eventId/location/share': 'stopLocationSharing',

  // 連絡先管理API
  'GET /api/events/:eventId/contacts': 'getEmergencyContacts',
  'PUT /api/events/:eventId/contacts': 'updateEmergencyContacts',
  'POST /api/events/:eventId/contacts/verify': 'verifyContacts',

  // 通知管理API
  'GET /api/notifications/preferences': 'getNotificationPreferences',
  'PUT /api/notifications/preferences': 'updateNotificationPreferences',
  'POST /api/notifications/send': 'sendNotification',
  'GET /api/notifications/history': 'getNotificationHistory',
  'POST /api/notifications/test': 'testNotification',

  // 緊急通報API
  'POST /api/emergency/alert': 'sendEmergencyAlert',
  'GET /api/emergency/contacts': 'getEmergencyContacts',
  'POST /api/emergency/report': 'submitEmergencyReport'
};
```

### **4.2 権限・プライバシー管理**

#### **権限レベル定義**

```javascript
const privacyPermissions = {
  // 位置情報権限
  location: {
    none: 'no_location_access',
    event_only: 'venue_location_only',
    approximate: 'approximate_user_location',
    precise: 'precise_user_location',
    realtime: 'realtime_location_sharing'
  },

  // 連絡先権限
  contact: {
    none: 'no_contact_sharing',
    emergency_only: 'emergency_contacts_only',
    organizers: 'organizer_contact_allowed',
    participants: 'participant_contact_allowed',
    public: 'public_contact_info'
  },

  // 通知権限
  notification: {
    none: 'no_notifications',
    emergency_only: 'emergency_alerts_only',
    event_related: 'event_notifications',
    all: 'all_notifications'
  }
};
```

### **4.3 パフォーマンス最適化**

#### **最適化戦略**

```javascript
const performanceOptimization = {
  // 地図最適化
  maps: {
    lazyLoading: true, // 必要時のみ読み込み
    tileOptimization: true, // タイル最適化
    markerClustering: true, // マーカークラスタリング
    viewportCulling: true, // 表示範囲外除去
    cachingStrategy: 'aggressive' // 積極的キャッシュ
  },

  // 通知最適化
  notifications: {
    batchProcessing: true, // バッチ処理
    queueManagement: true, // キュー管理
    rateLimiting: true, // レート制限
    deliveryOptimization: true, // 配信最適化
    failureHandling: 'exponential_backoff'
  },

  // データベース最適化
  database: {
    indexOptimization: ['eventId', 'userId', 'timestamp'],
    queryOptimization: true,
    connectionPooling: true,
    caching: 'redis_cluster'
  }
};
```

---

## 🔒 **5. セキュリティ・プライバシー**

### **5.1 データ保護**

#### **個人情報保護**

```javascript
const dataProtection = {
  // 位置データ暗号化
  locationData: {
    encryption: 'AES-256-GCM',
    storage: 'encrypted_at_rest',
    transmission: 'TLS_1.3',
    retention: '30_days_max',
    anonymization: 'automatic'
  },

  // 連絡先保護
  contactData: {
    access_control: 'role_based',
    encryption: 'field_level',
    masking: 'partial_display',
    audit_log: 'complete',
    consent_tracking: 'granular'
  },

  // 通知ログ保護
  notificationLogs: {
    retention: '90_days',
    anonymization: 'user_id_hashing',
    access_restriction: 'admin_only',
    compliance: 'GDPR_compliant'
  }
};
```

### **5.2 アクセス制御**

#### **権限マトリックス**

```javascript
const accessMatrix = {
  participant: {
    location: ['view_event_location', 'share_own_location'],
    contact: ['view_emergency_contacts', 'contact_organizers'],
    notification: ['manage_own_preferences', 'receive_all_types']
  },

  speaker: {
    location: [
      'view_event_location',
      'share_own_location',
      'view_participant_count'
    ],
    contact: [
      'view_emergency_contacts',
      'contact_organizers',
      'contact_other_speakers'
    ],
    notification: [
      'manage_own_preferences',
      'receive_all_types',
      'send_speaker_updates'
    ]
  },

  moderator: {
    location: [
      'view_event_location',
      'update_venue_info',
      'view_participant_locations'
    ],
    contact: [
      'view_all_contacts',
      'update_emergency_contacts',
      'contact_all_users'
    ],
    notification: [
      'manage_all_preferences',
      'send_event_notifications',
      'send_emergency_alerts'
    ]
  },

  admin: {
    location: ['full_access'],
    contact: ['full_access'],
    notification: ['full_access']
  }
};
```

---

## 📱 **6. モバイル対応**

### **6.1 レスポンシブ設計**

```css
/* Mobile Map Optimizations */
@media (max-width: 767px) {
  .map-container {
    height: 250px;
    margin: 0 calc(-1 * var(--space-4));
    border-radius: 0;
  }

  .map-info-panel {
    position: static;
    transform: none;
    background: var(--color-neutral-0);
    color: var(--color-neutral-900);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    margin-top: calc(-1 * var(--radius-lg));
  }

  .map-controls {
    top: var(--space-2);
    right: var(--space-2);
  }

  .map-control-btn {
    width: var(--size-8);
    height: var(--size-8);
  }

  /* Notification Center Mobile */
  .notification-center {
    top: 0;
    right: 0;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    max-height: none;
  }

  .notification-center.open {
    transform: translateX(0);
  }

  /* Toast Mobile */
  .toast-container {
    top: var(--space-4);
    right: var(--space-4);
    left: var(--space-4);
  }

  .toast {
    min-width: 0;
    max-width: none;
    width: 100%;
  }
}

/* Touch Optimizations */
@media (pointer: coarse) {
  .map-control-btn {
    min-width: var(--size-11);
    min-height: var(--size-11);
  }

  .notification-item {
    min-height: var(--size-11);
    padding: var(--space-4);
  }

  .toast-close {
    min-width: var(--size-11);
    min-height: var(--size-11);
  }
}
```

---

## 📊 **7. 分析・監視**

### **7.1 メトリクス収集**

```javascript
const analyticsMetrics = {
  // 地図利用状況
  mapUsage: {
    viewCount: 'map_views_per_event',
    interactionRate: 'user_interactions_per_session',
    directionsRequested: 'directions_api_calls',
    locationSharesAccepted: 'location_sharing_opt_in_rate'
  },

  // 通知効果測定
  notificationEffectiveness: {
    deliveryRate: 'successful_deliveries / total_sent',
    openRate: 'notifications_opened / notifications_delivered',
    clickThroughRate: 'actions_taken / notifications_opened',
    unsubscribeRate: 'opt_outs / total_recipients'
  },

  // 緊急連絡使用状況
  emergencyContactUsage: {
    contactsAccessed: 'emergency_contact_views',
    reportsSubmitted: 'emergency_reports_count',
    responseTime: 'average_emergency_response_time'
  }
};
```

---

この包括的な地図・連絡・通知システム仕様により、Lightning Talk
Circleの参加者体験が大幅に向上し、安全で便利なイベント参加が実現されます。次はイベントメインイメージ機能の設計に進みましょうか？
