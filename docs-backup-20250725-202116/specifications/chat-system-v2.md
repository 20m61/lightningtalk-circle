# 💬 Lightning Talk Circle - チャット機能v2.0仕様書

## 🎯 概要

Lightning Talk
Circleにイベントごとの自動チャットルーム作成機能を実装し、参加者間のリアルタイムコミュニケーションを促進する。

---

## 📋 **1. システム要件**

### **1.1 機能要件**

#### **基本機能**

- ✅ **イベント連動**: イベント作成時に自動でチャットルーム生成
- ✅ **リアルタイム通信**: Socket.io使用の即座メッセージ配信
- ✅ **権限管理**: 参加者・スピーカー・モデレーター・管理者の階層化
- ✅ **履歴保存**: メッセージの永続化と検索機能
- ✅ **ファイル共有**: 画像・PDF等の制限付きアップロード

#### **高度機能**

- ✅ **リアクション**: 絵文字リアクション＋カスタム反応
- ✅ **メンション**: @username での通知機能
- ✅ **スレッド**: 特定メッセージへの返信スレッド
- ✅ **モデレーション**: 不適切コンテンツの自動・手動削除
- ✅ **プレゼンス**: オンライン状況・入力中表示

### **1.2 非機能要件**

#### **パフォーマンス**

- 同時接続: 最大500ユーザー/ルーム
- メッセージ遅延: <200ms
- ファイルアップロード: 最大10MB
- 履歴読み込み: 50件/秒

#### **セキュリティ**

- XSS対策: DOMPurifyによるサニタイゼーション
- レート制限: 30メッセージ/分/ユーザー
- 権限チェック: 全API操作で認証・認可確認
- ファイル検証: MIME type・サイズ・内容チェック

---

## 🏗️ **2. アーキテクチャ設計**

### **2.1 データベーススキーマ**

```javascript
// ChatRoom Schema
const chatRoomSchema = {
  id: String, // "event-{eventId}"
  eventId: String, // 関連イベントID
  name: String, // "イベント名 - チャット"
  status: 'active' | 'archived' | 'disabled',
  createdAt: Date,
  settings: {
    preEventAccess: Boolean, // イベント前アクセス可否
    postEventDuration: Number, // 終了後アクセス期間(時間)
    moderated: Boolean, // モデレーション有効
    maxMessages: Number, // 最大メッセージ数
    allowFileUpload: Boolean, // ファイルアップロード許可
    allowedFileTypes: [String], // 許可ファイル拡張子
    maxFileSize: Number // 最大ファイルサイズ(MB)
  },
  participants: [
    {
      userId: String,
      username: String,
      role: 'participant' | 'speaker' | 'moderator' | 'admin',
      joinedAt: Date,
      lastSeenAt: Date,
      permissions: {
        canSendMessages: Boolean,
        canUploadFiles: Boolean,
        canDeleteMessages: Boolean,
        canManageUsers: Boolean
      }
    }
  ],
  statistics: {
    totalMessages: Number,
    activeUsers: Number,
    totalFiles: Number
  }
};

// Message Schema
const messageSchema = {
  id: String,
  roomId: String, // ChatRoom ID
  userId: String, // 送信者ID
  username: String, // 送信者名
  userRole: String, // 送信時の役割
  content: {
    type: 'text' | 'file' | 'system' | 'reaction',
    text: String, // テキストメッセージ
    file: {
      // ファイル添付
      originalName: String,
      storedName: String,
      mimeType: String,
      size: Number,
      url: String,
      thumbnail: String // 画像の場合
    },
    mentions: [String], // メンションされたユーザーID
    replyTo: String // 返信先メッセージID
  },
  reactions: [
    {
      emoji: String,
      users: [String], // リアクションしたユーザーID
      count: Number
    }
  ],
  edited: {
    isEdited: Boolean,
    editedAt: Date,
    editHistory: [
      {
        content: String,
        editedAt: Date
      }
    ]
  },
  moderation: {
    isDeleted: Boolean,
    deletedAt: Date,
    deletedBy: String,
    deleteReason: String,
    isHidden: Boolean
  },
  createdAt: Date,
  updatedAt: Date
};
```

### **2.2 API設計**

```javascript
// Chat API Endpoints
const chatApiRoutes = {
  // ルーム管理
  'POST /api/chat/rooms': 'createChatRoom',
  'GET /api/chat/rooms/:roomId': 'getChatRoom',
  'PUT /api/chat/rooms/:roomId': 'updateChatRoom',
  'DELETE /api/chat/rooms/:roomId': 'deleteChatRoom',

  // 参加者管理
  'POST /api/chat/rooms/:roomId/join': 'joinChatRoom',
  'POST /api/chat/rooms/:roomId/leave': 'leaveChatRoom',
  'GET /api/chat/rooms/:roomId/participants': 'getRoomParticipants',
  'PUT /api/chat/rooms/:roomId/participants/:userId': 'updateParticipantRole',

  // メッセージ管理
  'GET /api/chat/rooms/:roomId/messages': 'getMessages',
  'POST /api/chat/rooms/:roomId/messages': 'sendMessage',
  'PUT /api/chat/messages/:messageId': 'editMessage',
  'DELETE /api/chat/messages/:messageId': 'deleteMessage',

  // リアクション
  'POST /api/chat/messages/:messageId/reactions': 'addReaction',
  'DELETE /api/chat/messages/:messageId/reactions': 'removeReaction',

  // ファイル管理
  'POST /api/chat/rooms/:roomId/upload': 'uploadFile',
  'GET /api/chat/files/:fileId': 'getFile',
  'DELETE /api/chat/files/:fileId': 'deleteFile'
};
```

### **2.3 Socket.io Events**

```javascript
// Client → Server Events
const clientEvents = {
  'chat:join-room': { roomId, userId },
  'chat:leave-room': { roomId, userId },
  'chat:send-message': { roomId, content, mentions, replyTo },
  'chat:edit-message': { messageId, newContent },
  'chat:delete-message': { messageId },
  'chat:add-reaction': { messageId, emoji },
  'chat:remove-reaction': { messageId, emoji },
  'chat:typing-start': { roomId, userId },
  'chat:typing-stop': { roomId, userId },
  'chat:user-presence': { status } // online, away, offline
};

// Server → Client Events
const serverEvents = {
  'chat:message-received': { message, roomId },
  'chat:message-edited': { messageId, newContent, editedAt },
  'chat:message-deleted': { messageId, deletedBy },
  'chat:reaction-added': { messageId, emoji, userId },
  'chat:reaction-removed': { messageId, emoji, userId },
  'chat:user-joined': { roomId, user },
  'chat:user-left': { roomId, userId },
  'chat:user-typing': { roomId, userId, isTyping },
  'chat:user-presence': { userId, status },
  'chat:room-updated': { roomId, settings },
  'chat:error': { error, code }
};
```

---

## 🎨 **3. UI/UX設計**

### **3.1 チャットUI仕様**

#### **レイアウト構成**

```css
.chat-container {
  width: var(--chat-width); /* 350px */
  height: var(--chat-height); /* 450px */
  border-radius: var(--chat-radius); /* 12px */
  box-shadow: var(--chat-shadow); /* XL shadow */
  display: flex;
  flex-direction: column;
  background: var(--color-neutral-0);
}

.chat-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-neutral-200);
  background: var(--color-primary-50);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.chat-input-area {
  padding: var(--space-3);
  border-top: 1px solid var(--color-neutral-200);
}
```

#### **メッセージ表示**

```css
.message-item {
  padding: var(--chat-message-padding);
  margin-bottom: var(--space-2);
  border-radius: var(--chat-message-radius);
  position: relative;
}

.message-own {
  background: var(--color-primary-100);
  margin-left: var(--space-8);
  text-align: right;
}

.message-other {
  background: var(--color-neutral-100);
  margin-right: var(--space-8);
}

.message-system {
  background: var(--color-info-50);
  text-align: center;
  font-style: italic;
  color: var(--color-info-700);
}
```

### **3.2 モバイル最適化**

#### **レスポンシブ変化**

```css
@media (max-width: 767px) {
  .chat-container {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    position: fixed;
    top: 0;
    left: 0;
    z-index: var(--z-index-modal);
  }

  .chat-container.minimized {
    width: 60px;
    height: 60px;
    border-radius: var(--radius-full);
    bottom: var(--space-4);
    right: var(--space-4);
    top: auto;
    left: auto;
  }
}
```

---

## ⚙️ **4. 技術実装詳細**

### **4.1 自動ルーム作成**

```javascript
// Event作成時のフック
async function createEventChatRoom(eventData) {
  const chatRoom = {
    id: `event-${eventData.id}`,
    eventId: eventData.id,
    name: `${eventData.title} - チャット`,
    status: 'active',
    createdAt: new Date(),
    settings: {
      preEventAccess: true,
      postEventDuration: 24, // 24時間後まで
      moderated: true,
      maxMessages: 10000,
      allowFileUpload: true,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
      maxFileSize: 10
    },
    participants: [],
    statistics: {
      totalMessages: 0,
      activeUsers: 0,
      totalFiles: 0
    }
  };

  return await database.create('chatRooms', chatRoom);
}
```

### **4.2 権限システム**

```javascript
// 権限チェック関数
function checkChatPermission(user, room, action) {
  const participant = room.participants.find(p => p.userId === user.id);
  if (!participant) return false;

  const permissions = {
    participant: ['sendMessages'],
    speaker: ['sendMessages', 'uploadFiles'],
    moderator: ['sendMessages', 'uploadFiles', 'deleteMessages'],
    admin: ['sendMessages', 'uploadFiles', 'deleteMessages', 'manageUsers']
  };

  return permissions[participant.role]?.includes(action) || false;
}
```

### **4.3 リアルタイム通信**

```javascript
// Socket.io サーバー側実装
io.on('connection', socket => {
  // ルーム参加
  socket.on('chat:join-room', async ({ roomId, userId }) => {
    try {
      const room = await chatService.joinRoom(roomId, userId);
      socket.join(roomId);
      socket.to(roomId).emit('chat:user-joined', { roomId, user: userId });
      socket.emit('chat:room-joined', { room });
    } catch (error) {
      socket.emit('chat:error', { error: error.message, code: 'JOIN_FAILED' });
    }
  });

  // メッセージ送信
  socket.on(
    'chat:send-message',
    async ({ roomId, content, mentions, replyTo }) => {
      try {
        const message = await chatService.sendMessage(socket.userId, roomId, {
          content,
          mentions,
          replyTo
        });

        io.to(roomId).emit('chat:message-received', { message, roomId });

        // メンション通知
        if (mentions?.length > 0) {
          mentions.forEach(userId => {
            io.to(`user-${userId}`).emit('chat:mention', { message, roomId });
          });
        }
      } catch (error) {
        socket.emit('chat:error', {
          error: error.message,
          code: 'SEND_FAILED'
        });
      }
    }
  );
});
```

---

## 🔧 **5. 実装フェーズ**

### **Phase 1: 基盤実装 (Week 1-2)**

- ✅ ChatRoom・Messageスキーマ設計
- ✅ 基本API実装
- ✅ Socket.io基盤構築
- ✅ 自動ルーム作成機能

### **Phase 2: コア機能 (Week 3-4)**

- ✅ リアルタイムメッセージング
- ✅ 権限管理システム
- ✅ ファイルアップロード
- ✅ 基本的なモデレーション

### **Phase 3: 高度機能 (Week 5-6)**

- ✅ リアクション・メンション
- ✅ メッセージ編集・削除
- ✅ プレゼンス機能
- ✅ 検索・フィルタリング

### **Phase 4: UI/UX改善 (Week 7-8)**

- ✅ モバイル最適化
- ✅ アクセシビリティ対応
- ✅ パフォーマンス最適化
- ✅ 管理者ダッシュボード

---

## 📊 **6. 監視・分析**

### **6.1 メトリクス**

- **エンゲージメント**: メッセージ数/イベント、参加率
- **パフォーマンス**: 接続数、レスポンス時間、エラー率
- **コンテンツ**: ファイル共有数、リアクション数、モデレーション率

### **6.2 ダッシュボード**

- リアルタイム接続数表示
- メッセージ統計グラフ
- モデレーション活動ログ
- ユーザーエンゲージメント分析

---

## 🔒 **7. セキュリティ考慮事項**

### **7.1 入力検証**

- XSS対策: DOMPurify使用
- SQLインジェクション対策: パラメータ化クエリ
- ファイルアップロード: MIME type検証、ウイルススキャン

### **7.2 レート制限**

```javascript
const rateLimits = {
  sendMessage: '30/minute',
  uploadFile: '5/minute',
  joinRoom: '10/minute',
  createRoom: '2/minute'
};
```

### **7.3 モデレーション**

- 自動検出: 不適切語句フィルター
- 手動削除: モデレーター権限
- 報告機能: ユーザー報告→審査フロー

---

この仕様書に基づいて、次はロゴ・アイコン最適化とイベントメインイメージ機能の設計に進みましょうか？
