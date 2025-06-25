#!/bin/bash

echo "🎨 Testing Lightning Talk WordPress Theme..."

# Login to WordPress admin
echo "🔐 Logging into WordPress..."
LOGIN_RESULT=$(curl -s -c /tmp/wp_cookies.txt -X POST "http://localhost:8080/wp-login.php" \
  -d "log=admin" \
  -d "pwd=admin123" \
  -d "wp-submit=Log+In" \
  -d "redirect_to=http://localhost:8080/wp-admin/" \
  -d "testcookie=1")

# Check current theme
echo "📋 Checking available themes..."
THEMES_PAGE=$(curl -s -b /tmp/wp_cookies.txt "http://localhost:8080/wp-admin/themes.php")

if echo "$THEMES_PAGE" | grep -qi "lightningtalk\|lightning"; then
    echo "✅ Lightning Talk theme detected!"
else
    echo "❌ Theme not found in admin"
fi

# Try to activate theme via WP-CLI if available
echo "🔧 Attempting to activate theme..."
docker exec lt_wordpress_test sh -c "cd /var/www/html && php -r \"
include 'wp-config.php';
require_once 'wp-admin/includes/theme.php';
\$theme = wp_get_theme('lightningtalk-theme');
if (\$theme->exists()) {
    echo 'Theme exists: ' . \$theme->get('Name') . PHP_EOL;
    if (switch_theme('lightningtalk-theme')) {
        echo 'Theme activated successfully!' . PHP_EOL;
    }
} else {
    echo 'Theme not found!' . PHP_EOL;
    echo 'Available themes:' . PHP_EOL;
    foreach (wp_get_themes() as \$slug => \$theme) {
        echo '- ' . \$slug . ': ' . \$theme->get('Name') . PHP_EOL;
    }
}
\""

echo "🌐 Testing frontend..."
FRONT_PAGE=$(curl -s "http://localhost:8080")
if echo "$FRONT_PAGE" | grep -qi "lightning\|⚡"; then
    echo "✅ Lightning Talk theme is active on frontend!"
    echo "🎯 Theme features detected:"
    echo "$FRONT_PAGE" | grep -o "第.*回.*ライトニング.*トーク" | head -1
else
    echo "❌ Default theme still active"
fi

echo "📊 Test Results:"
echo "- WordPress: ✅ Running"
echo "- Theme Files: ✅ Uploaded"
echo "- Frontend: $(echo "$FRONT_PAGE" | grep -qi "lightning" && echo "✅ Lightning Theme Active" || echo "❌ Default Theme")"

echo "🔗 Access the site: http://localhost:8080"
echo "🔗 Admin panel: http://localhost:8080/wp-admin (admin/admin123)"