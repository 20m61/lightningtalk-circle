# 📚 Lightning Talk Circle - ドキュメント

このディレクトリには、Lightning Talk Circleプロジェクトの全ドキュメントが含まれています。

## 📁 ディレクトリ構成

```
docs/
├── README.md              # このファイル
├── analysis/              # 分析・テスト関連
├── deployment/            # デプロイメント関連
├── design/                # デザイン・モックアップ
├── development/           # 開発関連
├── features/              # 機能仕様
├── guides/                # ガイド・チュートリアル
├── project/               # プロジェクト管理
├── technical/             # 技術仕様
└── usage/                 # 使用方法
```

## 🎯 目的別ドキュメント索引

### 🚀 はじめに読むべきドキュメント
1. [`/README.md`](../README.md) - プロジェクト概要
2. [`project/WORDPRESS-DEVELOPMENT-SPEC.md`](project/WORDPRESS-DEVELOPMENT-SPEC.md) - 開発仕様
3. [`deployment/DEPLOYMENT-GUIDE.md`](deployment/DEPLOYMENT-GUIDE.md) - デプロイガイド

### 👨‍💻 開発者向け
- [`development/`](development/) - 開発環境・手順
- [`technical/`](technical/) - 技術仕様・アーキテクチャ
- [`features/`](features/) - 機能詳細

### 🎨 デザイナー向け
- [`design/`](design/) - デザインモックアップ・仕様
- [`design/mockups/`](design/mockups/) - 実動作モックアップ

### 🚢 運用・デプロイ担当者向け
- [`deployment/`](deployment/) - デプロイ手順・設定
- [`guides/`](guides/) - 運用ガイド

### 📊 分析・テスト担当者向け
- [`analysis/`](analysis/) - テストレポート・分析結果
- [`analysis/test-report.md`](analysis/test-report.md) - 機能テスト結果

### 📋 プロジェクト管理者向け
- [`project/`](project/) - プロジェクト管理文書
- [`project/PROJECT-CLEANUP-REPORT.md`](project/PROJECT-CLEANUP-REPORT.md) - 整理結果

## 📖 各ディレクトリの詳細

### `/analysis/` - 分析・テスト
- テスト結果レポート
- パフォーマンス分析
- 品質評価

### `/deployment/` - デプロイメント
- デプロイ手順書
- 環境設定ガイド
- WordPress展開手順

### `/design/` - デザイン
- UIモックアップ
- デザインシステム
- ユーザビリティテスト

### `/development/` - 開発
- 開発環境構築
- コーディング規約
- トラブルシューティング

### `/features/` - 機能仕様
- 機能詳細仕様
- API仕様
- ユーザーストーリー

### `/guides/` - ガイド
- チュートリアル
- HOWTOガイド
- ベストプラクティス

### `/project/` - プロジェクト管理
- プロジェクト計画
- 進捗管理
- 課題管理

### `/technical/` - 技術仕様
- アーキテクチャ設計
- システム仕様
- インフラ構成

### `/usage/` - 使用方法
- ユーザーマニュアル
- 操作ガイド
- FAQ

## 🔄 ドキュメント更新ルール

### 新規ドキュメント作成時
1. 適切なディレクトリを選択
2. ファイル名は`kebab-case`で統一
3. 必要に応じてディレクトリのREADME.mdを更新

### 既存ドキュメント更新時
1. 更新日をドキュメント末尾に記載
2. 大きな変更時はバージョン番号を更新
3. 関連ドキュメントへのリンクを確認

## 🔍 ドキュメント検索

### ファイル名検索
```bash
find docs/ -name "*キーワード*" -type f
```

### 内容検索
```bash
grep -r "検索キーワード" docs/
```

### 最近更新されたファイル
```bash
find docs/ -name "*.md" -mtime -7  # 過去7日間
```

---

**📅 最終更新**: 2025-06-21  
**👨‍💻 管理者**: Claude Code  
**📧 問い合わせ**: プロジェクト管理者まで