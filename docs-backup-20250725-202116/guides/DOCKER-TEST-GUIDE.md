# 🐳 Docker WordPress テスト環境ガイド

## ✅ 環境準備完了

### 🚀 **Docker環境構成**

- **WordPress**: 6.4 + PHP 8.2 + Apache
- **MySQL**: 8.0
- **アクセスURL**: http://localhost:8080
- **管理画面**: http://localhost:8080/wp-admin

### 📦 **準備済みテーマファイル**

- ✅ `lightningtalk-child-theme.zip` (修正版フルテーマ)
- ✅ `lightningtalk-safe-test.zip` (安全テスト版)
- ✅ `cocoon-master.zip` (Cocoon親テーマ)

---

## 🧪 **テスト実行手順**

### **Step 1: WordPress初期セットアップ**

**ブラウザで初期設定:**

```
1. http://localhost:8080 にアクセス
2. 言語選択: 日本語
3. データベース情報入力:
   - データベース名: wordpress_test
   - ユーザー名: wordpress
   - パスワード: wordpress_password
   - データベースホスト: mysql-test
4. WordPressインストール実行
5. 管理者アカウント作成:
   - ユーザー名: admin
   - パスワード: test_password
   - メール: admin@test.local
```

### **Step 2: Cocoon親テーマインストール**

**管理画面での操作:**

```
1. http://localhost:8080/wp-admin にログイン
2. 外観 > テーマ > 新規追加
3. テーマのアップロード > cocoon-master.zip
4. インストール > 有効化
```

### **Step 3: Lightning Talk子テーマテスト**

#### **安全版テーマでの予備テスト**

```
1. 外観 > テーマ > 新規追加
2. テーマのアップロード > lightningtalk-safe-test.zip
3. インストール > 有効化
4. エラーが出ないことを確認
5. フロントエンドでデザイン確認
```

#### **フル機能版テーマテスト**

```
1. 外観 > テーマ > 新規追加
2. テーマのアップロード > lightningtalk-child-theme.zip
3. インストール > 有効化
4. 重大エラーが出ないことを確認
5. 管理画面に「Lightning Talk」メニューが表示されることを確認
```

---

## 🎯 **機能テスト項目**

### **基本機能テスト**

#### **1. テーマ有効化テスト**

- [ ] Lightning Talk Childテーマが正常に有効化される
- [ ] 「重大エラー」が発生しない
- [ ] フロントエンドが正常に表示される
- [ ] Cocoonのデザインが継承される

#### **2. 管理画面機能テスト**

- [ ] 管理画面に「Lightning Talk」メニューが表示される
- [ ] Lightning Talk > Lightning Talkイベント が表示される
- [ ] Lightning Talk > Lightning Talk発表 が表示される
- [ ] Lightning Talk > 参加者 が表示される

#### **3. カスタム投稿タイプテスト**

```
1. Lightning Talk > Lightning Talkイベント > 新規追加
2. 以下の内容で作成:
   タイトル: テストイベント
   内容: Docker環境でのテストイベントです
3. カスタムフィールド設定:
   - event_date: 2025-06-25 19:00:00
   - venue_name: テスト会場
   - emergency_phone: 080-1234-5678
4. 公開ボタンクリック
5. エラーなく作成できることを確認
```

### **ショートコードテスト**

#### **4. ショートコード動作テスト**

```
1. 固定ページ > 新規追加
2. タイトル: Lightning Talk テストページ
3. 以下のショートコードを追加:

[lightning_talk_event id="1" show="all"]
[lightning_talk_button type="register" text="テスト登録"]
[lightning_talk_survey event_id="1"]
[lightning_talk_chat event_id="1"]
[lightning_talk_contact phone="080-1234-5678"]
[lightning_talk_map url="https://maps.app.goo.gl/test"]

4. 公開
5. フロントエンドで正常に表示されることを確認
```

#### **5. UI/UXテスト**

- [ ] ショートコードが正しいHTMLで出力される
- [ ] CSSスタイルが適用される
- [ ] ボタンのホバーエフェクトが動作する
- [ ] レスポンシブデザインが機能する
- [ ] Lightning Talkのグラデーションが表示される

### **デザイン仕様確認**

#### **6. オリジナルデザインとの一致確認**

```
確認項目:
- [ ] Lightning Talkカードのグラデーション背景
- [ ] ボタンのスタイル・ホバーエフェクト
- [ ] 絵文字アイコンの表示
- [ ] フォントサイズ・行間
- [ ] カラースキーム
- [ ] レスポンシブブレークポイント
```

---

## 🔍 **トラブルシューティング**

### **よくある問題と解決法**

#### **問題1: 重大エラーが発生**

```
解決策:
1. 安全版テーマ (lightningtalk-safe-test.zip) でテスト
2. エラーログ確認: docker logs lt-wordpress-test
3. 段階的機能追加で問題箇所特定
```

#### **問題2: ショートコードが表示されない**

```
解決策:
1. パーマリンク設定確認: 設定 > パーマリンク > 投稿名
2. テーマファイルの権限確認
3. キャッシュクリア
```

#### **問題3: スタイルが適用されない**

```
解決策:
1. ブラウザ開発者ツールでCSS確認
2. CSSファイルの読み込み確認
3. Cocoon設定との競合確認
```

---

## 📊 **テスト結果記録**

### **テスト実行ログ**

```
日時: 2025-06-20
環境: Docker WordPress 6.4 + PHP 8.2
テスター: [名前]

✅ 基本機能テスト
□ テーマ有効化: 成功/失敗
□ 管理画面表示: 成功/失敗
□ カスタム投稿タイプ: 成功/失敗

✅ ショートコードテスト
□ イベント表示: 成功/失敗
□ ボタン表示: 成功/失敗
□ チャット機能: 成功/失敗

✅ UI/UXテスト
□ デザイン一致: 成功/失敗
□ レスポンシブ: 成功/失敗
□ アニメーション: 成功/失敗

問題点:
[発見された問題を記録]

対処法:
[実施した対処法を記録]
```

---

## 🎉 **テスト完了後の次ステップ**

### **成功時**

```
1. テスト結果をドキュメント化
2. 本番環境 (https://xn--6wym69a.com) へのデプロイ実行
3. 本番環境での最終確認
```

### **問題発見時**

```
1. 問題の詳細分析
2. コード修正
3. 修正版テーマの再作成
4. Docker環境での再テスト
```

---

## 🛠️ **環境操作コマンド**

### **Docker環境管理**

```bash
# 環境開始
docker-compose -f docker-compose.test.yml up -d

# 環境停止
docker-compose -f docker-compose.test.yml down

# ログ確認
docker logs lt-wordpress-test
docker logs lt-mysql-test

# コンテナ内でのコマンド実行
docker exec -it lt-wordpress-test bash
```

### **テーマファイル操作**

```bash
# 新しいテーマファイルをコンテナに追加
docker cp new-theme.zip lt-wordpress-test:/tmp/

# テーマディレクトリ確認
docker exec lt-wordpress-test ls -la /var/www/html/wp-content/themes/
```

**Docker環境でのテストが完了次第、本番環境への安全なデプロイが可能になります！**
🚀

---

_作成日時: 2025-06-20 13:45 JST_ _状態: Docker環境構築完了・テスト準備完了_ ✅
