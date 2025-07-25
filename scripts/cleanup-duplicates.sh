#!/bin/bash
# 重複ファイルクリーンアップスクリプト
# 生成日: 2025-07-25T20:24:22.628Z

echo "🧹 クリーンアップを開始します..."

# 重複ファイルの削除
rm -f "docs-new/development/claude-instructions.md"
rm -f "docs-new/api/reference.md"

# 空ディレクトリの削除
rmdir "docs/design/wireframes" 2>/dev/null
rmdir "docs-new/architecture" 2>/dev/null

echo "✅ クリーンアップ完了"
