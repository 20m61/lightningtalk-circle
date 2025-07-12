#!/bin/bash
# Setup local environment from GitHub Secrets
# This script helps developers set up their local .env file

set -euo pipefail

echo "🔐 Lightning Talk Circle - Local Environment Setup"
echo "================================================"
echo ""

# Check if .env.local already exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Aborted."
        exit 1
    fi
fi

# Copy from example
echo "📋 Creating .env.local from .env.example..."
cp .env.example .env.local

# Generate secure secrets
echo "🔑 Generating secure secrets..."
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Update .env.local with generated secrets
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/JWT_SECRET=\"\"/JWT_SECRET=\"$JWT_SECRET\"/" .env.local
    sed -i '' "s/SESSION_SECRET=\"\"/SESSION_SECRET=\"$SESSION_SECRET\"/" .env.local
else
    # Linux
    sed -i "s/JWT_SECRET=\"\"/JWT_SECRET=\"$JWT_SECRET\"/" .env.local
    sed -i "s/SESSION_SECRET=\"\"/SESSION_SECRET=\"$SESSION_SECRET\"/" .env.local
fi

echo ""
echo "✅ .env.local created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local and add your specific values:"
echo "   - GitHub token (GITHUB_TOKEN)"
echo "   - Email credentials (if needed)"
echo "   - WordPress credentials (for deployment)"
echo ""
echo "2. For team members, ask your team lead for:"
echo "   - Shared development database credentials"
echo "   - API keys for external services"
echo "   - Test WordPress credentials"
echo ""
echo "3. Never commit .env.local to git!"
echo ""
echo "🔒 Security reminder:"
echo "   - Keep your .env.local file secure"
echo "   - Don't share credentials via email or chat"
echo "   - Use a password manager for team credential sharing"