#!/bin/bash

echo "WordPress テーマテスト開始..."

# WordPress初期設定（簡易版）
echo "WordPress初期設定中..."
curl -s -X POST 'http://localhost:8080/wp-admin/install.php' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'weblog_title=Lightning+Talk+Test&user_name=admin&admin_password=password&admin_password2=password&admin_email=admin@example.com&Submit=Install+WordPress&language='

echo "設定完了、テーマ確認中..."

# テーマが認識されているかチェック
echo "=== WordPress テーマ一覧 ==="
docker exec lightningtalk-circle-wordpress-1 wp theme list --path=/var/www/html --allow-root 2>/dev/null || echo "WP-CLI未インストール"

# フロントエンドアクセステスト
echo ""
echo "=== フロントエンドテスト ==="
response=$(curl -s -w "%{http_code}" http://localhost:8080)
http_code="${response: -3}"
content="${response%???}"

echo "HTTP Status: $http_code"

if [ "$http_code" = "200" ]; then
    echo "✅ フロントエンド正常応答"
    
    # PHP致命的エラーの確認
    if echo "$content" | grep -i "fatal error\|parse error\|critical" > /dev/null; then
        echo "❌ PHP致命的エラー検出"
        echo "$content" | grep -i "fatal error\|parse error\|critical"
    else
        echo "✅ PHP致命的エラーなし"
    fi
    
    # WordPressテーマの動作確認
    if echo "$content" | grep "Lightning Talk" > /dev/null; then
        echo "✅ Lightning Talkテーマ動作中"
    else
        echo "⚠️ Lightning Talkテーマが未有効化"
    fi
    
else
    echo "❌ フロントエンドエラー: $http_code"
fi

echo ""
echo "=== コンテナログ確認 ==="
docker logs lightningtalk-circle-wordpress-1 2>&1 | tail -10

echo ""
echo "テスト完了"
echo "ブラウザで http://localhost:8080 にアクセスして確認してください"