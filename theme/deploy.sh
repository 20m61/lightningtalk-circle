#!/bin/bash

# Lightning Talk Circle - Static Theme Deployment Script
# Version: 1.2.0

echo "⚡ Lightning Talk Circle - Static Theme v1.2.0 ⚡"
echo "============================================"

# Create dist directory
echo "📁 Creating distribution directory..."
mkdir -p dist

# Copy HTML files
echo "📄 Copying HTML files..."
cp index.html dist/
cp registration-form.html dist/

# Copy minified CSS
echo "🎨 Copying minified CSS..."
cp style.min.css dist/

# Copy meta files
echo "📋 Copying meta files..."
cp robots.txt dist/
cp sitemap.xml dist/
cp manifest.json dist/
cp README.md dist/

# Create images directory structure
echo "🖼️  Creating images directory..."
mkdir -p dist/images

# Create a simple favicon if it doesn't exist
echo "🎯 Creating placeholder favicon..."
echo '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>' > dist/favicon.svg

# Create deployment info
echo "📝 Creating deployment info..."
cat > dist/VERSION.txt << EOF
Lightning Talk Circle - Static Theme
Version: 1.2.0
Build Date: $(date +"%Y-%m-%d %H:%M:%S")
EOF

# Create basic .htaccess for Apache servers
echo "⚙️  Creating .htaccess..."
cat > dist/.htaccess << 'EOF'
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Redirect to HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
EOF

# Create deployment archive
echo "📦 Creating deployment archive..."
cd dist
tar -czf ../lightningtalk-circle-static-theme-v1.2.0.tar.gz .
cd ..

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📁 Files ready in: ./dist/"
echo "📦 Archive created: ./lightningtalk-circle-static-theme-v1.2.0.tar.gz"
echo ""
echo "🚀 Next steps:"
echo "   1. Upload contents of ./dist/ to your web server"
echo "   2. Or extract lightning-talk-theme-v1.0.0.tar.gz on your server"
echo "   3. Ensure your server points to index.html as the default"
echo "   4. Test both pages and form functionality"
echo ""
echo "⚡ Good luck with your Lightning Talk event! ⚡"