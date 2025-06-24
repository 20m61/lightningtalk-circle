# Lightning Talk Theme - デプロイメントガイド

## 🚀 クイックスタート

### 1. デプロイパッケージの作成

```bash
# デプロイスクリプトを実行
./deploy.sh
```

これにより以下が生成されます：

- `dist/` - 本番用ファイル一式
- `lightning-talk-theme-v1.0.0.tar.gz` - デプロイ用アーカイブ

### 2. サーバーへのアップロード

#### 方法A: FTP/SFTPを使用

```bash
# distフォルダの中身をサーバーのドキュメントルートにアップロード
scp -r dist/* user@your-server:/var/www/html/
```

#### 方法B: アーカイブを使用

```bash
# アーカイブをサーバーにアップロード
scp lightning-talk-theme-v1.0.0.tar.gz user@your-server:~/

# サーバー上で解凍
ssh user@your-server
cd /var/www/html/
tar -xzf ~/lightning-talk-theme-v1.0.0.tar.gz
```

## 📋 チェックリスト

### デプロイ前

- [ ] イベント情報が正しいか確認
- [ ] 連絡先情報が正しいか確認
- [ ] Google MeetのURLが有効か確認
- [ ] 地図のリンクが正しいか確認

### デプロイ後

- [ ] トップページが表示される
- [ ] 申込みフォームが表示される
- [ ] レスポンシブデザインが機能している
- [ ] リンクが正しく動作する
- [ ] HTTPSでアクセスできる

## 🌐 推奨サーバー設定

### Apache

`.htaccess`ファイルが自動的に含まれています。以下の設定が有効になります：

- Gzip圧縮
- キャッシュ設定
- セキュリティヘッダー
- HTTPS自動リダイレクト

### Nginx

```nginx
server {
    listen 80;
    server_name lightning-talk-event.jp;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lightning-talk-event.jp;

    root /var/www/lightning-talk-theme;
    index index.html;

    # SSL設定
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Gzip圧縮
    gzip on;
    gzip_types text/css application/javascript application/json;

    # キャッシュ設定
    location ~* \.(css|js)$ {
        expires 1M;
        add_header Cache-Control "public";
    }

    location ~* \.(jpg|jpeg|png|gif|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public";
    }

    # セキュリティヘッダー
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
}
```

## 🔧 カスタマイズ

### ドメイン設定

1. `sitemap.xml`内のURLを実際のドメインに変更
2. `robots.txt`内のサイトマップURLを更新
3. HTML内のOGP画像URLを更新

### フォーム連携

申込みフォームを実際に機能させるには：

1. バックエンドAPIの実装
2. `registration-form.html`内のJavaScriptを更新
3. フォーム送信先のエンドポイントを設定

例：

```javascript
// registration-form.html内
fetch('https://your-api.com/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

## 📊 パフォーマンス最適化

### 画像の追加時

1. WebP形式を優先的に使用
2. 適切なサイズにリサイズ
3. 画像圧縮ツールを使用

### CDNの利用

静的ファイルのパフォーマンス向上のため、CDNの利用を推奨：

- Cloudflare
- AWS CloudFront
- Fastly

## 🔍 SEO対策

### 必須項目

- [ ] `sitemap.xml`をGoogle Search Consoleに登録
- [ ] 構造化データの追加を検討
- [ ] ページ速度の最適化

### 推奨項目

- [ ] イベント用構造化データ（JSON-LD）の追加
- [ ] SNSでのシェア用画像（OGP画像）の作成
- [ ] Google Analyticsの設定

## 🆘 トラブルシューティング

### ページが表示されない

- ファイルのパーミッションを確認（通常644）
- .htaccessが機能しているか確認
- エラーログを確認

### スタイルが適用されない

- `style.min.css`が正しくアップロードされているか確認
- ブラウザのキャッシュをクリア
- 開発者ツールでエラーを確認

### フォームが動作しない

- JavaScriptエラーがないか確認
- APIエンドポイントが正しいか確認
- CORSの設定を確認

## 📞 サポート

問題が解決しない場合は、以下にお問い合わせください：

- メール: contact@lightning-talk-event.jp
- 緊急連絡先: 080-4540-7479

---

⚡ デプロイメント成功をお祈りしています！ ⚡
