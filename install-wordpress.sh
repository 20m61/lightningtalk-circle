#!/bin/bash

# WordPress Installation Script for Testing
echo "🚀 Installing WordPress for theme testing..."

# Step 1: Set language to English
echo "📝 Setting up WordPress..."
curl -s -X POST "http://localhost:8080/wp-admin/install.php?step=1" \
  -d "language="

# Step 2: Complete WordPress installation
echo "🔧 Configuring WordPress..."
curl -s -X POST "http://localhost:8080/wp-admin/install.php?step=2" \
  -d "weblog_title=Lightning+Talk+Test+Site" \
  -d "user_name=admin" \
  -d "admin_password=admin123" \
  -d "admin_password2=admin123" \
  -d "admin_email=admin@lightning-talk-test.local" \
  -d "Submit=Install+WordPress"

echo "✅ WordPress installed!"
echo "🌐 Access: http://localhost:8080"
echo "👤 Admin: admin / admin123"

# Step 3: Install theme
echo "📦 Installing Lightning Talk theme..."

# Login and get cookies
LOGIN_RESPONSE=$(curl -s -c /tmp/wp_cookies.txt -X POST "http://localhost:8080/wp-login.php" \
  -d "log=admin" \
  -d "pwd=admin123" \
  -d "wp-submit=Log+In" \
  -d "redirect_to=http://localhost:8080/wp-admin/" \
  -d "testcookie=1")

# Upload theme
echo "📂 Uploading theme file..."
docker exec lt_wordpress_test cp /tmp/theme.zip /var/www/html/wp-content/themes/lightningtalk-theme.zip

# Extract theme
docker exec lt_wordpress_test sh -c "cd /var/www/html/wp-content/themes && unzip -o lightningtalk-theme.zip"

echo "🎨 Theme uploaded and extracted!"
echo "🎯 Ready for testing at http://localhost:8080"