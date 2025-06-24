#!/bin/bash

# WordPress自動セットアップスクリプト

echo "WordPress自動セットアップを開始します..."

# WordPressの準備完了まで待機
echo "WordPressの起動を待機中..."
while ! curl -s http://localhost:8080 > /dev/null; do
    sleep 2
done

# WordPressインストール
echo "WordPressの初期設定を実行中..."
curl -X POST http://localhost:8080/wp-admin/install.php \
  -d "weblog_title=Lightning+Talk+Test" \
  -d "user_name=admin" \
  -d "admin_password=password" \
  -d "admin_password2=password" \
  -d "admin_email=admin@example.com" \
  -d "Submit=Install+WordPress" \
  -d "language=" \
  -d "blog_public=0"

echo "WordPress初期設定完了"

# Cocoon親テーマのダウンロードとインストール
echo "Cocoon親テーマをダウンロード中..."
wget -O /tmp/cocoon-master.zip https://wp-cocoon.com/download/791/

# コンテナ内にCocoonテーマをコピー
docker cp /tmp/cocoon-master.zip lightningtalk-circle-wordpress-1:/tmp/
docker exec lightningtalk-circle-wordpress-1 bash -c "cd /var/www/html/wp-content/themes && unzip -q /tmp/cocoon-master.zip"

echo "Cocoonテーマインストール完了"

# テーマの有効化確認
echo "利用可能なテーマを確認中..."
docker exec lightningtalk-circle-wordpress-1 ls -la /var/www/html/wp-content/themes/

echo "セットアップ完了！"
echo "ブラウザで http://localhost:8080 にアクセスしてWordPressを確認してください"
echo "管理画面: http://localhost:8080/wp-admin"
echo "ユーザー名: admin"
echo "パスワード: password"