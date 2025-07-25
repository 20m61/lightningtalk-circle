# WordPress Lightning Talk テーマ デプロイメント手順

## 🚀 WordPress サイト: https://発表.com への実装ガイド

### 📋 準備完了項目

- ✅ Lightning Talk Child Theme (lightningtalk-child-theme.zip)
- ✅ 全ショートコード実装（チャット・緊急連絡先・地図リンク含む）
- ✅ Cocoon親テーマとの完全統合
- ✅ REST API エンドポイント
- ✅ 管理画面機能

---

## 📖 ステップ 1: テーマのアップロード

### WordPress管理画面でのインストール

1. **ログイン**
   - URL: https://発表.com/wp-login.php
   - ユーザー名: `wpmaster`
   - パスワード: `fytbuh-3repRu-nucbyf`

2. **テーマアップロード**

   ```
   外観 > テーマ > 新規追加 > テーマのアップロード
   ファイル選択: lightningtalk-child-theme.zip
   → 今すぐインストール → 有効化
   ```

3. **前提条件確認**
   - Cocoon親テーマがインストール済みであることを確認
   - PHP 7.4以上, WordPress 5.0以上

---

## ⚙️ ステップ 2: 初期設定

### パーマリンク設定

```
設定 > パーマリンク > 投稿名 > 変更を保存
```

### Lightning Talk カスタマイザー設定

```
外観 > カスタマイズ > Lightning Talk設定
- API URL: /wp-json/lightningtalk/v1/
- デフォルトイベントID: 1
```

---

## 📝 ステップ 3: 最初のイベント作成

### イベント投稿タイプの作成

1. **管理画面から**

   ```
   Lightning Talk > Lightning Talkイベント > 新規追加
   ```

2. **イベント詳細入力**

   ```
   タイトル: 第1回 なんでもライトニングトーク

   カスタムフィールド:
   - event_date: 2025-06-25 19:00:00
   - venue_name: 新宿会場
   - venue_address: 西新宿8-14-19 小林第二ビル8階
   - map_url: https://maps.app.goo.gl/51TFv825jmuBsjbq5?g_st=ic
   - emergency_phone: 080-4540-7479
   - online_url: https://meet.google.com/ycp-sdec-xsr
   - capacity: 50
   - event_status: active
   ```

3. **コンテンツ（説明文）**

   ```
   5分間で世界を変える！あなたの「なんでも」を聞かせて！

   技術、趣味、日常の発見、面白い話題... 何でも大歓迎！
   当日参加・飛び入り発表も歓迎です。
   ```

---

## 🎯 ステップ 4: Lightning Talk メインページ作成

### 固定ページ作成

1. **新規固定ページ**

   ```
   固定ページ > 新規追加
   タイトル: Lightning Talk イベント
   パーマリンク: /lightning-talk
   ```

2. **ページテンプレート選択**

   ```
   ページ属性 > テンプレート: Lightning Talk Event Page
   ```

3. **ショートコードでコンテンツ構築**

   ```html
   <!-- ヒーローセクション -->
   <div class="hero-section">
     <h1>⚡ なんでもライトニングトーク</h1>
     <p>5分間で世界を変える！あなたの「なんでも」を聞かせて！</p>
   </div>

   <!-- イベント情報表示 -->
   [lightning_talk_event id="1" show="all"]

   <!-- 参加方法セクション -->
   <h2>🚀 参加方法</h2>

   <div class="participation-cards">
     <div class="card">
       <h3>👥 聴講参加</h3>
       <p>様々な発表を聞いて楽しもう！</p>
       [lightning_talk_button type="register-listener" text="聴講参加登録"]
     </div>

     <div class="card">
       <h3>🎤 発表申込み</h3>
       <p>5分間であなたの「なんでも」を発表！</p>
       [lightning_talk_button type="register-speaker" text="発表申込み"]
     </div>
   </div>

   <!-- アンケートセクション -->
   [lightning_talk_survey event_id="1" title="💭 当日参加アンケート"]

   <!-- 緊急連絡先 -->
   [lightning_talk_contact phone="080-4540-7479"]

   <!-- 地図リンク -->
   [lightning_talk_map url="https://maps.app.goo.gl/51TFv825jmuBsjbq5?g_st=ic"]

   <!-- チャットウィジェット -->
   [lightning_talk_chat event_id="1"]
   ```

---

## 🔧 ステップ 5: メニュー設定

### ナビゲーションメニュー作成

1. **メニュー作成**

   ```
   外観 > メニュー > 新規作成
   メニュー名: メインメニュー
   ```

2. **メニュー項目追加**

   ```
   - ホーム (固定ページ)
   - Lightning Talk (作成した固定ページ)
   - イベント一覧 (カスタムリンク: /events/)
   - お問い合わせ (固定ページ)
   ```

3. **メニュー位置設定**
   ```
   テーマの位置 > ヘッダーメニュー にチェック
   ```

---

## 🎨 ステップ 6: デザイン調整

### Cocoon設定との統合

1. **Cocoon > 全体設定**

   ```
   サイトキーカラー: #ffd700 (Lightning Talk アクセントカラー)
   ```

2. **追加CSS（外観 > カスタマイズ > 追加CSS）**

   ```css
   /* Lightning Talk 専用スタイル調整 */
   .lightningtalk-container {
     margin: 20px 0;
   }

   .lt-event-card {
     background: linear-gradient(45deg, #ff6b6b, #ffd93d);
     color: white;
     padding: 30px;
     border-radius: 15px;
     margin: 20px 0;
   }

   .lt-btn {
     background: var(
       --lt-primary-gradient,
       linear-gradient(45deg, #ff6b6b, #ffd93d)
     );
     color: white;
     border: none;
     padding: 12px 24px;
     border-radius: 25px;
     cursor: pointer;
     font-weight: bold;
     transition: transform 0.2s;
     text-decoration: none;
     display: inline-block;
   }

   .lt-btn:hover {
     transform: scale(1.05);
   }

   .chat-widget {
     position: fixed;
     bottom: 20px;
     right: 20px;
     z-index: 1000;
   }

   .emergency-contact {
     background: #ffe6e6;
     border: 2px solid #ff9999;
     border-radius: 10px;
     padding: 15px;
     margin: 15px 0;
   }

   .phone-link {
     font-size: 1.2em;
     font-weight: bold;
     color: #e74c3c;
     text-decoration: none;
   }

   .map-link {
     color: #3498db;
     font-weight: bold;
     text-decoration: none;
   }
   ```

---

## 🧪 ステップ 7: 機能テスト

### 必須テスト項目

1. **ショートコード表示テスト**
   - [x] イベント情報表示
   - [x] 参加登録ボタン
   - [x] 発表一覧表示
   - [x] アンケート機能
   - [x] チャットウィジェット
   - [x] 緊急連絡先
   - [x] 地図リンク

2. **REST API テスト**

   ```
   https://発表.com/wp-json/lightningtalk/v1/events
   https://発表.com/wp-json/lightningtalk/v1/events/1
   ```

3. **レスポンシブテスト**
   - モバイル表示確認
   - タブレット表示確認
   - デスクトップ表示確認

---

## 📊 ステップ 8: サンプルデータ作成

### 発表データ作成

1. **発表投稿タイプでサンプル作成**

   ```
   Lightning Talk > Lightning Talk発表 > 新規追加

   サンプル発表1:
   - タイトル: 私が最近ハマっているJavaScriptライブラリ
   - カスタムフィールド:
     * speaker_name: 田中太郎
     * event_id: 1
     * category: tech
     * duration: 5

   サンプル発表2:
   - タイトル: 猫カフェ巡りで学んだライフハック
   - カスタムフィールド:
     * speaker_name: 佐藤花子
     * event_id: 1
     * category: pet
     * duration: 5
   ```

---

## 🔒 ステップ 9: セキュリティ設定

### .htaccess 設定（FTPアクセス必要な場合）

```apache
# Lightning Talk REST API用
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^wp-json/lightningtalk/(.*)$ /wp-json/lightningtalk/$1 [QSA,L]

# セキュリティヘッダー
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

---

## ✅ デプロイメント完了チェックリスト

### 基本設定

- [ ] Lightning Talk Child Theme アップロード・有効化
- [ ] パーマリンク設定変更
- [ ] Lightning Talk カスタマイザー設定

### コンテンツ作成

- [ ] 第1回イベント作成
- [ ] Lightning Talk メインページ作成
- [ ] ナビゲーションメニュー設定
- [ ] サンプル発表データ作成

### 機能確認

- [ ] 全ショートコード動作確認
- [ ] REST API エンドポイント確認
- [ ] チャットウィジェット動作確認
- [ ] 緊急連絡先リンク確認
- [ ] 地図リンク確認
- [ ] レスポンシブ表示確認

### 運用準備

- [ ] 管理画面操作説明
- [ ] 参加者管理方法説明
- [ ] バックアップ設定

---

## 🎉 実装完了！

**Lightning Talk
WordPress システムの全機能が https://発表.com で利用可能になります。**

### 📞 サポート

問題が発生した場合は：

1. WordPress管理画面 > ダッシュボード で互換性ステータス確認
2. デバッグモード有効化（wp-config.php）
3. ブラウザ開発者ツールでエラー確認

### 🚀 次のステップ

1. 実際のイベント告知開始
2. 参加者からのフィードバック収集
3. 必要に応じた機能追加・改善

**🌟 Lightning Talkで、みんなの「なんでも」を聞かせてください！**
