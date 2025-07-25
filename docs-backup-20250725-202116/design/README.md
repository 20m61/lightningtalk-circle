# 🎨 デザイン・モックアップ管理

このディレクトリは、Lightning Talkプロジェクトのデザイン関連ファイルを管理します。

## 📁 ディレクトリ構造

```
design/
├── mockups/           # デザインモックアップ（HTML版）
├── assets/            # デザイン関連アセット・テストファイル
├── wireframes/        # ワイヤーフレーム（将来使用）
└── README.md          # このファイル
```

## 🎭 モックアップファイル

### `/mockups/` ディレクトリ
実際に動作するHTMLモックアップファイルが格納されています。

| ファイル名 | バージョン | 特徴 | 更新日 |
|------------|------------|------|--------|
| `design-v1-complete.html` | v1.0 | 基本機能完全実装版 | 2025-06-20 |
| `design-v2-enhanced.html` | v2.0 | デザインシステム強化版 | 2025-06-20 |
| `design-v3-mobile-first.html` | v3.0 | モバイルファースト最適化版 | 2025-06-20 |

### 現在のメインデザイン
**ファイル**: `/lightning-talk.html` (プロジェクトルート)  
**ベース**: Super Fun UX版（v4.0相当）  
**特徴**: ゲーミフィケーション + 高度なUX

## 🛠️ アセット管理

### `/assets/` ディレクトリ
- `functional-test-suite.html` - 機能テストスイート（デザイン動作確認用）

## 📋 デザイン仕様

### カラーパレット
```css
--primary: #FF6B35;      /* オレンジ */
--secondary: #4ECDC4;    /* ターコイズ */
--success: #10B981;      /* グリーン */
--warning: #F59E0B;      /* イエロー */
--error: #EF4444;        /* レッド */
```

### タイポグラフィ
- **フォント**: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui
- **ベースサイズ**: 16px (1rem)
- **スケール**: 0.75rem ～ 2.25rem

### レスポンシブブレークポイント
- **Mobile**: < 768px
- **Tablet**: 768px ～ 1024px  
- **Desktop**: > 1024px

## 🔄 デザイン進化の履歴

1. **v1.0** (Complete) - 基本機能実装
2. **v2.0** (Enhanced) - デザインシステム導入
3. **v3.0** (Mobile-First) - モバイル最適化
4. **v4.0** (Super-Fun) - ゲーミフィケーション追加 ← **現在のメイン**

## 🎯 使用方法

### モックアップの閲覧
```bash
# 任意のHTMLファイルをブラウザで開く
open docs/design/mockups/design-v2-enhanced.html

# ローカルサーバーで確認
python3 -m http.server 8080
# http://localhost:8080/docs/design/mockups/ にアクセス
```

### 新しいデザインバリエーション作成時
1. 既存のモックアップをベースにコピー
2. `design-v{次のバージョン}-{特徴}.html` として保存
3. このREADMEのテーブルを更新
4. 必要に応じてアセットを `/assets/` に追加

## 📝 注意事項

- モックアップファイルは**スタンドアロン**（単一HTMLファイル）として作成
- 外部依存関係を最小限に抑制
- 新機能テスト時は `/assets/` にテストファイルを作成
- デザイン変更は段階的にバージョン管理

---

**最終更新**: 2025-06-21  
**管理者**: Claude Code