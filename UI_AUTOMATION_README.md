# UI自動化テストシステム 🧪

Lightning Talk Circleの包括的UI自動化テストシステムです。スクリーンショット比較、レスポンシブテスト、アクセシビリティ検証、CI/CD統合を提供します。

## 🎯 システム概要

### 主要機能

✅ **自動スクリーンショット撮影** - 複数ビューポート対応  
✅ **UI回帰テスト** - ベースライン比較による変更検出  
✅ **レスポンシブテスト** - デスクトップ/タブレット/モバイル  
✅ **アクセシビリティ検証** - キーボードナビゲーション、フォーカス管理  
✅ **モーダル機能テスト** - インタラクションとアニメーション  
✅ **CI/CD統合** - GitHub Actions での自動実行  

### アーキテクチャ

```
UI自動化テストシステム
├── screenshot-capture.js          # 基本スクリーンショット撮影
├── automated-ui-testing.js        # 包括的テストスイート  
├── package-scripts/ui-testing.js  # NPMスクリプト管理
├── .github/workflows/ui-testing.yml # CI/CD設定
└── screenshots-*/                 # テスト結果ディレクトリ
```

## 🚀 クイックスタート

### 1. 環境セットアップ

```bash
# 必要な依存関係をインストール
npm run ui:test:setup

# 開発サーバーを起動
npm run dev
```

### 2. 基本的なスクリーンショット撮影

```bash
# 単一スクリーンショット撮影
npm run ui:screenshot

# 包括的UIテスト実行
npm run ui:test

# サーバー付きフルテスト
npm run ui:test:full
```

### 3. CI/CD用テスト

```bash
# CI/CD用テスト（exit code付き）
npm run ui:test:ci
```

## 📋 利用可能なコマンド

### NPMスクリプト

| コマンド | 説明 | 用途 |
|---------|------|------|
| `npm run ui:screenshot` | 基本スクリーンショット撮影 | 手動検証 |
| `npm run ui:test` | 包括的UIテスト | 開発時テスト |
| `npm run ui:test:ci` | CI/CD用テスト | 自動化 |
| `npm run ui:test:setup` | 環境セットアップ | 初回設定 |
| `npm run ui:test:baseline` | ベースライン更新 | リリース時 |
| `npm run ui:test:report` | レポート生成 | 結果確認 |
| `npm run ui:test:full` | サーバー付きテスト | 統合テスト |

### パッケージスクリプト

```bash
# スクリプト管理ツール使用
node package-scripts/ui-testing.js <command>

# 使用可能コマンド
node package-scripts/ui-testing.js help
```

## 🧪 テストスイート詳細

### 1. Basic Pages（基本ページ）
- ホームページ読み込み
- スクロール動作
- 基本レイアウト確認

### 2. Modal Interactions（モーダル操作）
- 登録モーダル表示
- フォーカストラップ機能  
- キーボードナビゲーション
- ESCキー終了

### 3. Responsive Layouts（レスポンシブ）
- デスクトップ (1920x1080)
- タブレット (768x1024)
- モバイル (375x812)
- ナビゲーション切り替え

### 4. Accessibility Features（アクセシビリティ）
- キーボード操作
- フォーカス表示
- ハイコントラスト対応
- スクリーンリーダー互換性

### 5. Form Interactions（フォーム）
- 入力検証
- エラー表示  
- 成功状態
- バリデーション

### 6. Animation States（アニメーション）
- ボタンホバー効果
- ローディング状態
- トランジション
- パフォーマンス

## 📊 テスト結果とレポート

### ディレクトリ構造

```
screenshots-automated-ui-tests/    # 最新テスト結果
├── basic-pages_homepage-load_desktop.png
├── modal-interactions_registration-modal-open_mobile.png  
├── automated-ui-test-report.json
└── AUTOMATED_UI_TEST_REPORT.md

screenshots-baseline/              # ベースライン画像
├── basic-pages_homepage-load_desktop.png
└── ...

screenshots-diff/                  # 差分画像
├── diff_basic-pages_homepage-load_desktop.png
└── ...
```

### レポート形式

#### JSON Report
```json
{
  "summary": {
    "timestamp": "2025-07-22T14:30:00.000Z",
    "totalTests": 24,
    "totalPassed": 23,
    "totalFailed": 1,
    "successRate": "96%",
    "duration": "45s"
  },
  "testSuites": [...]
}
```

#### Markdown Report
- 実行サマリー
- テストスイート別結果
- スクリーンショット一覧
- 失敗詳細

## 🔄 CI/CD統合

### GitHub Actions

自動実行トリガー:
- プッシュ (main, develop, feature/*)
- プルリクエスト
- スケジュール実行 (毎日午前2時)
- 手動実行

### ワークフロー機能

✅ **マトリックス実行** - Node.js 18.x & 20.x  
✅ **並列テスト** - 複数テストスイート同時実行  
✅ **アーティファクト保存** - スクリーンショット & レポート  
✅ **PR コメント** - 自動結果通知  
✅ **ベースライン更新** - メインブランチマージ時  

### 設定例

```yaml
- name: 🧪 Run UI Tests
  run: node automated-ui-testing.js --ci --suite=${{ matrix.test-suite }}

- name: 📸 Upload Screenshots  
  uses: actions/upload-artifact@v4
  with:
    name: ui-test-screenshots-${{ matrix.node-version }}
    path: screenshots-automated-ui-tests/
```

## 🔧 カスタマイズ

### テスト設定

```javascript
// automated-ui-testing.js
const TEST_CONFIG = {
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 }
  },
  waitForNetworkIdle: 2000,
  screenshotOptions: {
    type: 'png',
    fullPage: true,
    quality: 90
  }
};
```

### 新しいテストの追加

```javascript
getCustomTests() {
  return [
    {
      name: 'custom-test',
      url: BASE_URL,
      description: 'Custom test description',
      customAction: async (page) => {
        // カスタムテストロジック
        await page.click('.custom-element');
        await page.waitForTimeout(1000);
      }
    }
  ];
}
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. Puppeteerインストールエラー
```bash
# 解決方法
npm run ui:test:setup
```

#### 2. サーバー接続失敗
```bash  
# 開発サーバーが起動しているか確認
curl -I http://localhost:3000

# ポート競合確認
lsof -i :3000
```

#### 3. スクリーンショット差分
```bash
# ベースライン更新
npm run ui:test:baseline

# 差分確認
ls screenshots-diff/
```

#### 4. メモリエラー
```bash
# Node.js メモリ増加
NODE_OPTIONS='--max-old-space-size=4096' npm run ui:test
```

### デバッグ情報

```bash
# 詳細ログ付き実行
DEBUG=puppeteer* npm run ui:test

# ヘッドレスモード無効化（デバッグ用）
HEADLESS=false npm run ui:test
```

## 📈 パフォーマンス最適化

### 実行時間短縮

- **並列実行** - 複数テストスイート同時実行
- **スマートキャッシュ** - 依存関係キャッシュ
- **最適なタイムアウト** - 必要最小限の待機時間

### リソース効率化

- **ヘッドレスモード** - 本番環境用
- **メモリ管理** - プロセス間でのブラウザ共有
- **並列制限** - システム負荷調整

## 🔒 セキュリティ考慮事項

✅ **サンドボックス実行** - Puppeteer安全設定  
✅ **機密情報除外** - スクリーンショットから除外  
✅ **アクセス制限** - テスト環境分離  
✅ **ログ管理** - 機密情報ログ出力防止  

## 🚀 今後の拡張計画

### フェーズ1 (現在)
- [x] 基本UIテスト
- [x] スクリーンショット比較  
- [x] CI/CD統合
- [x] レポート生成

### フェーズ2 (計画中)
- [ ] ビジュアル回帰テスト詳細比較
- [ ] パフォーマンステスト統合
- [ ] A/Bテスト支援
- [ ] 多言語テスト対応

### フェーズ3 (将来)
- [ ] AIベースの異常検知
- [ ] 自動修復提案
- [ ] 統計分析ダッシュボード

---

## 📚 参考資料

- [Puppeteer Documentation](https://pptr.dev/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Lightning Talk Circle Project](./README.md)

---

**🤖 Lightning Talk Circle UI自動化テストシステム**  
**⚡ より良いUI/UXを、自動化で実現**