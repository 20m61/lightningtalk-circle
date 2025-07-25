#!/bin/bash

# Generate Modal System Screenshot
# モーダルシステムのスクリーンショット生成

OUTPUT_DIR="screenshots-temp"
mkdir -p "$OUTPUT_DIR"

# Create SVG for modal system demo
cat > "$OUTPUT_DIR/event-modal-demo.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
  <!-- Background -->
  <rect width="1200" height="800" fill="#f5f5f5"/>
  
  <!-- Title -->
  <text x="600" y="40" text-anchor="middle" font-size="28" font-weight="bold" fill="#22c55e">
    イベント詳細モーダルシステム
  </text>
  
  <!-- Desktop View -->
  <g transform="translate(50, 80)">
    <rect x="0" y="0" width="500" height="300" fill="white" stroke="#ddd" stroke-width="2" rx="8"/>
    <rect x="0" y="0" width="500" height="50" fill="#22c55e" rx="8 8 0 0"/>
    <text x="250" y="30" text-anchor="middle" fill="white" font-size="16" font-weight="bold">
      デスクトップ表示
    </text>
    
    <!-- Modal -->
    <rect x="50" y="80" width="400" height="200" fill="white" stroke="#333" stroke-width="2" rx="12" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.2))"/>
    <circle cx="420" cy="100" r="15" fill="#ef4444"/>
    <text x="420" y="105" text-anchor="middle" fill="white" font-size="20">×</text>
    
    <!-- Content sections -->
    <rect x="70" y="110" width="360" height="40" fill="#f9fafb" rx="4"/>
    <text x="250" y="135" text-anchor="middle" font-size="14">概要・詳細・参加情報を一画面表示</text>
    
    <rect x="70" y="160" width="170" height="60" fill="#e0f2fe" rx="4"/>
    <text x="155" y="195" text-anchor="middle" font-size="12">開催情報</text>
    
    <rect x="250" y="160" width="170" height="60" fill="#dbeafe" rx="4"/>
    <text x="335" y="195" text-anchor="middle" font-size="12">参加状況</text>
    
    <rect x="70" y="230" width="150" height="30" fill="#22c55e" rx="15"/>
    <text x="145" y="250" text-anchor="middle" fill="white" font-size="12">参加登録</text>
  </g>
  
  <!-- Mobile View -->
  <g transform="translate(650, 80)">
    <rect x="0" y="0" width="200" height="350" fill="white" stroke="#ddd" stroke-width="2" rx="20"/>
    <rect x="0" y="0" width="200" height="40" fill="#22c55e" rx="20 20 0 0"/>
    <text x="100" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
      モバイル表示
    </text>
    
    <!-- Bottom sheet modal -->
    <rect x="10" y="120" width="180" height="220" fill="white" stroke="#333" stroke-width="2" rx="12 12 0 0" filter="drop-shadow(0 -5px 10px rgba(0,0,0,0.2))"/>
    
    <!-- Swipe indicator -->
    <rect x="85" y="128" width="30" height="4" fill="#ddd" rx="2"/>
    
    <!-- Tabs -->
    <g transform="translate(10, 140)">
      <rect x="10" y="0" width="50" height="30" fill="#22c55e" rx="4"/>
      <text x="35" y="20" text-anchor="middle" fill="white" font-size="10">概要</text>
      
      <rect x="65" y="0" width="50" height="30" fill="#f3f4f6" rx="4"/>
      <text x="90" y="20" text-anchor="middle" font-size="10">詳細</text>
      
      <rect x="120" y="0" width="50" height="30" fill="#f3f4f6" rx="4"/>
      <text x="145" y="20" text-anchor="middle" font-size="10">参加</text>
    </g>
    
    <!-- Content (no scroll) -->
    <rect x="20" y="180" width="160" height="120" fill="#f9fafb" rx="4"/>
    <text x="100" y="200" text-anchor="middle" font-size="11">スクロール不要</text>
    <text x="100" y="220" text-anchor="middle" font-size="11">タブで切り替え</text>
    
    <!-- Action button -->
    <rect x="30" y="260" width="140" height="30" fill="#22c55e" rx="15"/>
    <text x="100" y="280" text-anchor="middle" fill="white" font-size="12">参加登録</text>
  </g>
  
  <!-- Features -->
  <g transform="translate(50, 420)">
    <text x="0" y="0" font-size="20" font-weight="bold" fill="#1f2937">主な機能</text>
    
    <g transform="translate(0, 30)">
      <circle cx="10" cy="10" r="5" fill="#22c55e"/>
      <text x="25" y="15" font-size="14">レスポンシブデザイン - デバイスに最適化された表示</text>
    </g>
    
    <g transform="translate(0, 60)">
      <circle cx="10" cy="10" r="5" fill="#22c55e"/>
      <text x="25" y="15" font-size="14">スワイプジェスチャー - 下スワイプで閉じる、横スワイプでタブ切替</text>
    </g>
    
    <g transform="translate(0, 90)">
      <circle cx="10" cy="10" r="5" fill="#22c55e"/>
      <text x="25" y="15" font-size="14">キーボード操作 - ESCで閉じる、矢印キーでナビゲーション</text>
    </g>
    
    <g transform="translate(0, 120)">
      <circle cx="10" cy="10" r="5" fill="#22c55e"/>
      <text x="25" y="15" font-size="14">アクセシビリティ - ARIA属性、フォーカストラップ、スクリーンリーダー対応</text>
    </g>
    
    <g transform="translate(0, 150)">
      <circle cx="10" cy="10" r="5" fill="#22c55e"/>
      <text x="25" y="15" font-size="14">ダークモード対応 - システム設定に応じた自動切り替え</text>
    </g>
  </g>
  
  <!-- Gestures illustration -->
  <g transform="translate(900, 420)">
    <text x="0" y="0" font-size="20" font-weight="bold" fill="#1f2937">ジェスチャー操作</text>
    
    <!-- Swipe down -->
    <g transform="translate(0, 30)">
      <rect x="0" y="0" width="80" height="120" fill="white" stroke="#ddd" rx="10"/>
      <path d="M 40 30 L 40 80" stroke="#22c55e" stroke-width="3" marker-end="url(#arrowdown)"/>
      <text x="40" y="105" text-anchor="middle" font-size="11">下スワイプ</text>
    </g>
    
    <!-- Swipe horizontal -->
    <g transform="translate(100, 30)">
      <rect x="0" y="0" width="80" height="120" fill="white" stroke="#ddd" rx="10"/>
      <path d="M 20 60 L 60 60" stroke="#22c55e" stroke-width="3" marker-end="url(#arrowright)"/>
      <text x="40" y="105" text-anchor="middle" font-size="11">横スワイプ</text>
    </g>
  </g>
  
  <!-- Arrow markers -->
  <defs>
    <marker id="arrowdown" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#22c55e"/>
    </marker>
    <marker id="arrowright" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#22c55e"/>
    </marker>
  </defs>
</svg>
EOF

echo "✅ Modal system screenshot created: $OUTPUT_DIR/event-modal-demo.svg"