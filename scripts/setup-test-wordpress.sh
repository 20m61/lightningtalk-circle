#!/bin/bash

# WordPress テスト環境自動セットアップスクリプト

set -e

echo "🐳 WordPress テスト環境セットアップ開始"
echo "=================================="

# WordPress CLIコンテナでセットアップ実行
echo "1. WordPress基本セットアップ..."
docker-compose -f docker-compose.test.yml run --rm wordpress-cli wp core install \
  --url="http://localhost:8080" \
  --title="Lightning Talk Test Site" \
  --admin_user="admin" \
  --admin_password="admin_password" \
  --admin_email="admin@lightningtalk-test.local" \
  --skip-email

echo "✅ WordPress基本セットアップ完了"

# デバッグ設定
echo "2. デバッグ設定..."
docker-compose -f docker-compose.test.yml run --rm wordpress-cli wp config set WP_DEBUG true --raw
docker-compose -f docker-compose.test.yml run --rm wordpress-cli wp config set WP_DEBUG_LOG true --raw
docker-compose -f docker-compose.test.yml run --rm wordpress-cli wp config set WP_DEBUG_DISPLAY false --raw

echo "✅ デバッグ設定完了"

# Cocoonテーマのインストール
echo "3. Cocoonテーマインストール..."
docker exec lt-wordpress-test bash -c "
  cd /var/www/html/wp-content/themes
  unzip -q /tmp/cocoon-master.zip
  mv cocoon-master cocoon-master-temp
  mkdir -p cocoon-master
  mv cocoon-master-temp/* cocoon-master/
  rmdir cocoon-master-temp
  chown -R www-data:www-data cocoon-master
"

docker-compose -f docker-compose.test.yml run --rm wordpress-cli wp theme activate cocoon-master

echo "✅ Cocoonテーマインストール・有効化完了"

# Lightning Talk子テーマの準備
echo "4. Lightning Talk子テーマ準備..."
docker exec lt-wordpress-test bash -c "
  cd /var/www/html/wp-content/themes
  unzip -q /tmp/lightningtalk-safe-test.zip
  unzip -q /tmp/lightningtalk-child-theme.zip
  chown -R www-data:www-data lightningtalk-child-safe lightningtalk-child
"

echo "✅ Lightning Talk子テーマ準備完了"

# テスト用コンテンツ作成
echo "5. テスト用コンテンツ作成..."
docker-compose -f docker-compose.test.yml run --rm wordpress-cli wp post create \
  --post_type=page \
  --post_title="Lightning Talk Test Page" \
  --post_content="[lightning_talk_safe message='Docker Test Environment'] <h2>Test Content</h2><p>This is a test page for Lightning Talk functionality.</p>" \
  --post_status=publish

echo "✅ テスト用コンテンツ作成完了"

echo ""
echo "🎉 WordPress テスト環境準備完了！"
echo ""
echo "アクセス情報:"
echo "URL: http://localhost:8080"
echo "管理画面: http://localhost:8080/wp-admin"
echo "ユーザー名: admin"
echo "パスワード: admin_password"
echo ""
echo "次のステップ:"
echo "1. ブラウザで http://localhost:8080 にアクセス"
echo "2. 管理画面でLightning Talk子テーマをテスト"
echo "3. エラーが出ないことを確認"