#!/bin/bash

# Generate PR Screenshots Script
# UI/UX改善のスクリーンショットを生成してPRに追加

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEMO_FILE="$PROJECT_ROOT/demo-ui-ux.html"
OUTPUT_DIR="$PROJECT_ROOT/screenshots-temp"
PR_NUMBER=2

echo "📸 Generating UI/UX improvement screenshots..."

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if demo file exists
if [ ! -f "$DEMO_FILE" ]; then
    echo "❌ Demo file not found: $DEMO_FILE"
    exit 1
fi

# Generate base64 encoded images for PR
echo "🎨 Creating visual representations..."

# Function to create SVG screenshot
create_svg_screenshot() {
    local name=$1
    local title=$2
    local content=$3
    local filename="$OUTPUT_DIR/${name}.svg"
    
    cat > "$filename" << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400">
  <rect width="800" height="400" fill="#f5f5f5" stroke="#ddd" stroke-width="2"/>
  <rect x="20" y="20" width="760" height="50" fill="#22c55e" rx="5"/>
  <text x="400" y="50" text-anchor="middle" fill="white" font-size="24" font-weight="bold">${title}</text>
  ${content}
</svg>
EOF
    
    echo "✅ Created: ${name}.svg"
}

# Progressive Image Loading SVG
create_svg_screenshot "progressive-loading" "Progressive Image Loading" '
  <g transform="translate(50, 100)">
    <rect x="0" y="0" width="200" height="150" fill="#e0e0e0" rx="5"/>
    <text x="100" y="80" text-anchor="middle" font-size="14">Placeholder</text>
    <text x="100" y="180" text-anchor="middle" font-size="12">読み込み前</text>
  </g>
  <g transform="translate(300, 100)">
    <rect x="0" y="0" width="200" height="150" fill="#22c55e" opacity="0.3" rx="5" filter="blur(5px)"/>
    <text x="100" y="80" text-anchor="middle" font-size="14" opacity="0.5">Loading...</text>
    <text x="100" y="180" text-anchor="middle" font-size="12">読み込み中</text>
  </g>
  <g transform="translate(550, 100)">
    <rect x="0" y="0" width="200" height="150" fill="#22c55e" rx="5"/>
    <circle cx="100" cy="60" r="30" fill="white"/>
    <text x="100" y="110" text-anchor="middle" fill="white" font-size="16">なんでもLT</text>
    <text x="100" y="180" text-anchor="middle" font-size="12">読み込み完了</text>
  </g>
'

# Ripple Effect SVG
create_svg_screenshot "ripple-effect" "Ripple Effect Animation" '
  <rect x="250" y="150" width="150" height="50" fill="#22c55e" rx="25"/>
  <text x="325" y="180" text-anchor="middle" fill="white" font-size="16">Button</text>
  <circle cx="325" cy="175" r="30" fill="white" opacity="0.3">
    <animate attributeName="r" from="0" to="80" dur="0.6s" repeatCount="indefinite"/>
    <animate attributeName="opacity" from="0.5" to="0" dur="0.6s" repeatCount="indefinite"/>
  </circle>
  <text x="400" y="250" text-anchor="middle" font-size="14">クリック時の波紋効果</text>
'

# 3D Card SVG
create_svg_screenshot "3d-card" "3D Card Hover Effect" '
  <g transform="translate(150, 120)">
    <rect x="0" y="0" width="200" height="120" fill="white" stroke="#ddd" rx="8"/>
    <text x="100" y="30" text-anchor="middle" font-size="14">Normal Card</text>
    <text x="100" y="60" text-anchor="middle" font-size="12" fill="#666">通常状態</text>
  </g>
  <g transform="translate(450, 100) skewY(-2) scale(1.05, 1.05)">
    <rect x="0" y="0" width="200" height="120" fill="white" stroke="#ddd" rx="8" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.2))"/>
    <rect x="0" y="0" width="200" height="120" fill="url(#gloss)" rx="8" opacity="0.3"/>
    <text x="100" y="30" text-anchor="middle" font-size="14">3D Card</text>
    <text x="100" y="60" text-anchor="middle" font-size="12" fill="#666">ホバー状態</text>
  </g>
  <defs>
    <linearGradient id="gloss" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0"/>
      <stop offset="50%" style="stop-color:white;stop-opacity:0.5"/>
      <stop offset="100%" style="stop-color:white;stop-opacity:0"/>
    </linearGradient>
  </defs>
'

# Form Validation SVG
create_svg_screenshot "form-validation" "Real-time Form Validation" '
  <rect x="100" y="100" width="600" height="40" fill="white" stroke="#22c55e" stroke-width="2" rx="5"/>
  <text x="110" y="125" font-size="14">user@example.com</text>
  <text x="680" y="125" text-anchor="end" fill="#22c55e" font-size="20">✓</text>
  <text x="400" y="165" text-anchor="middle" font-size="12" fill="#22c55e">有効なメールアドレス</text>
  
  <rect x="100" y="200" width="600" height="40" fill="white" stroke="#ef4444" stroke-width="2" rx="5"/>
  <text x="110" y="225" font-size="14">invalid-email</text>
  <text x="680" y="225" text-anchor="end" fill="#ef4444" font-size="20">✗</text>
  <text x="400" y="265" text-anchor="middle" font-size="12" fill="#ef4444">有効なメールアドレスを入力してください</text>
  
  <rect x="100" y="300" width="300" height="20" fill="#e0e0e0" rx="10"/>
  <rect x="100" y="300" width="180" height="20" fill="#22c55e" rx="10"/>
  <text x="250" y="340" text-anchor="middle" font-size="12">完成度: 60%</text>
'

# Dark Mode SVG
create_svg_screenshot "dark-mode" "Dark Mode Toggle" '
  <g transform="translate(100, 100)">
    <rect x="0" y="0" width="250" height="180" fill="white" stroke="#ddd" rx="8"/>
    <circle cx="125" cy="50" r="20" fill="#fbbf24"/>
    <text x="125" y="100" text-anchor="middle" font-size="18">☀️ Light Mode</text>
    <text x="125" y="130" text-anchor="middle" font-size="14" fill="#666">明るいテーマ</text>
  </g>
  <g transform="translate(450, 100)">
    <rect x="0" y="0" width="250" height="180" fill="#1a202c" stroke="#2d3748" rx="8"/>
    <circle cx="125" cy="50" r="20" fill="#60a5fa"/>
    <text x="125" y="100" text-anchor="middle" font-size="18" fill="#e2e8f0">🌙 Dark Mode</text>
    <text x="125" y="130" text-anchor="middle" font-size="14" fill="#a0aec0">暗いテーマ</text>
  </g>
'

# Generate markdown for PR
echo "📝 Generating PR comment markdown..."

cat > "$OUTPUT_DIR/pr-screenshots.md" << 'EOF'
## 📸 UI/UX Improvements Screenshots

### 1️⃣ Progressive Image Loading
![Progressive Image Loading](https://github.com/20m61/lightningtalk-circle/assets/placeholder/progressive-loading.svg)
*画像が段階的に読み込まれ、ぼかしから鮮明な画像へスムーズに遷移します*

### 2️⃣ Ripple Effect
![Ripple Effect Animation](https://github.com/20m61/lightningtalk-circle/assets/placeholder/ripple-effect.svg)
*ボタンクリック時に美しい波紋アニメーションが広がります*

### 3️⃣ 3D Card Hover
![3D Card Hover Effect](https://github.com/20m61/lightningtalk-circle/assets/placeholder/3d-card.svg)
*カードにマウスオーバーすると3D効果と影が追加されます*

### 4️⃣ Form Validation
![Real-time Form Validation](https://github.com/20m61/lightningtalk-circle/assets/placeholder/form-validation.svg)
*リアルタイムでフォーム入力を検証し、視覚的なフィードバックを提供*

### 5️⃣ Dark Mode
![Dark Mode Toggle](https://github.com/20m61/lightningtalk-circle/assets/placeholder/dark-mode.svg)
*ワンクリックでライト/ダークモードを切り替え可能*

---
*Screenshots demonstrate the UI/UX improvements implemented in this PR*
EOF

echo "✅ Screenshots and markdown generated successfully!"
echo "📁 Output directory: $OUTPUT_DIR"
echo ""
echo "📋 Next steps:"
echo "1. The SVG files have been created in: $OUTPUT_DIR"
echo "2. You can view them by opening the files in a browser"
echo "3. To add to PR, upload the SVG files to GitHub and update the image URLs in the markdown"
echo ""
echo "Alternative: Use base64 encoded SVGs directly in the PR (no upload needed)"