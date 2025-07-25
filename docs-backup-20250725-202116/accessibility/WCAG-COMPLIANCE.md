# WCAG 2.1 AA 準拠ガイド

Lightning Talk Circle プロジェクトは WCAG 2.1 AA レベルでのアクセシビリティ準拠を目指しています。

## 概要

### 実装済み機能

#### 1. 知覚可能性 (Perceivable)
- **テキストの代替手段**
  - 全画像に適切なalt属性を設定
  - 装飾画像には空のalt属性を指定
  - アイコンフォントにはaria-hidden属性を使用

- **カラーコントラスト**
  - WCAG AA準拠の4.5:1以上のコントラスト比を確保
  - ハイコントラストモード対応
  - ユーザー設定によるコントラスト調整機能

- **フォントサイズとレイアウト**
  - 200%まで拡大可能なフォントサイズ
  - レスポンシブデザインによる横スクロール防止
  - ユーザー設定によるフォントサイズ調整（12px-24px）

#### 2. 操作可能性 (Operable)
- **キーボードアクセシビリティ**
  - 全ての機能をキーボードで操作可能
  - 論理的なTab順序の設定
  - フォーカストラップの実装（モーダル等）
  - スキップリンクの提供

- **アニメーション制御**
  - prefers-reduced-motion の尊重
  - ユーザー設定によるアニメーション制御
  - 自動再生コンテンツの制御

- **セッション管理**
  - セッションタイムアウトの警告
  - データ保存の確認ダイアログ

#### 3. 理解可能性 (Understandable)
- **明確な情報構造**
  - 論理的な見出し構造（H1-H6）
  - ランドマークロールの適切な使用
  - パンくずナビゲーション

- **フォーム**
  - 明確なラベルと説明
  - エラーメッセージの提供
  - 入力支援とフォーマット説明
  - 必須フィールドの明示

#### 4. 頑健性 (Robust)
- **セマンティックHTML**
  - 適切なHTML要素の使用
  - WAI-ARIA属性の正しい実装
  - バリデーションエラーのない HTML

- **スクリーンリーダー対応**
  - ライブリージョンの実装
  - 動的コンテンツ変更の通知
  - コンテキスト情報の提供

## 実装詳細

### JavaScript実装
```javascript
// /public/js/accessibility.js
- AccessibilityEnhancer クラス
- WAI-ARIA属性の自動設定
- フォーカス管理とキーボードナビゲーション
- スクリーンリーダー対応
- ユーザー設定の保存・復元
```

### CSS実装
```css
/* /public/css/accessibility.css */
- スクリーンリーダー専用スタイル
- フォーカス表示の強化
- ハイコントラストモード
- モーション削減
- レスポンシブアクセシビリティ
```

### React/TypeScript実装
```typescript
// /lightningtalk-modern/packages/theme/src/hooks/useAccessibility.ts
- アクセシビリティ状態管理
- フォーカス管理フック
- ARIA属性管理
- スクリーンリーダー通知

// /lightningtalk-modern/packages/theme/src/components/AccessibilityProvider.tsx
- アプリケーション全体のアクセシビリティ機能提供
- ユーザー設定コントロール
- フォーカストラップコンポーネント
- ライブリージョンコンポーネント
```

## 検証とテスト

### 自動テスト
```javascript
// /tests/accessibility/wcag-compliance.test.js
- axe-core による自動アクセシビリティ検証
- キーボードナビゲーションテスト
- フォーカス管理テスト
- カラーコントラストテスト
- レスポンシブアクセシビリティテスト
```

### 手動テスト項目

#### 基本チェックリスト
- [ ] キーボードのみでの全機能利用
- [ ] スクリーンリーダーでの音声読み上げ
- [ ] 200%ズームでのレイアウト確認
- [ ] ハイコントラストモードでの表示確認
- [ ] モーション削減設定での動作確認

#### スクリーンリーダーテスト
- **推奨ツール**
  - NVDA (Windows)
  - JAWS (Windows)
  - VoiceOver (macOS)
  - Orca (Linux)
  - TalkBack (Android)
  - VoiceOver (iOS)

#### 検証ツール
- **axe DevTools** - ブラウザ拡張機能
- **WAVE** - Web Accessibility Evaluation Tool
- **Lighthouse** - Chrome DevTools内蔵
- **Colour Contrast Analyser** - コントラスト測定

## ユーザー設定機能

### アクセシビリティコントロール
右上の車椅子アイコンからアクセス可能：

1. **ハイコントラストモード**
   - コントラスト比の向上
   - 境界線の強調表示

2. **アニメーション制御**
   - アニメーションの無効化
   - トランジション効果の削減

3. **フォントサイズ調整**
   - 12px から 24px まで調整可能
   - ベースフォントサイズの変更

### 設定の保存
- ローカルストレージに設定を保存
- ページリロード時に設定を復元
- システム設定（prefers-*）の尊重

## 継続的改善

### 定期的な検証
1. **月次検証**
   - 新機能のアクセシビリティ確認
   - 自動テストの実行
   - ユーザーフィードバックの検討

2. **四半期検証**
   - 包括的なアクセシビリティ監査
   - 支援技術での実機テスト
   - WCAG ガイドラインの更新確認

### 改善計画
- **短期目標**
  - 音声ナビゲーション機能の追加
  - 多言語対応でのアクセシビリティ確保
  - モバイルアクセシビリティの強化

- **長期目標**
  - WCAG 2.2 準拠への移行
  - AI支援によるアクセシビリティ向上
  - ユーザビリティテストの継続実施

## トラブルシューティング

### よくある問題と解決策

#### フォーカスが見えない
```css
/* keyboard navigation クラスが適用されていない場合 */
*:focus-visible {
  outline: 2px solid #0066ff !important;
  outline-offset: 2px !important;
}
```

#### スクリーンリーダーで読み上げられない
```html
<!-- aria-label または aria-labelledby の追加 -->
<button aria-label="メニューを開く">☰</button>
<div aria-labelledby="heading-id">
  <h2 id="heading-id">セクションタイトル</h2>
</div>
```

#### モーダルからフォーカスが外れる
```javascript
// フォーカストラップの実装確認
const focusableElements = modal.querySelectorAll(focusableSelectors);
// 最初と最後の要素間でのループ処理
```

### サポート

#### 報告方法
アクセシビリティの問題を発見した場合：

1. **GitHub Issues** での報告
   - 使用環境（OS、ブラウザ、支援技術）
   - 具体的な問題の説明
   - 再現手順

2. **メールでの報告**
   - accessibility@lightningtalk-circle.com
   - 機密性の高い情報がある場合

#### 対応時間
- **重大な問題**: 24時間以内
- **一般的な問題**: 1週間以内
- **改善提案**: 月次レビューで検討

## 参考資料

### WCAG 2.1 ガイドライン
- [WCAG 2.1 クイックリファレンス](https://www.w3.org/WAI/WCAG21/quickref/)
- [WCAG 2.1 達成基準](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA 1.1 仕様](https://www.w3.org/TR/wai-aria-1.1/)

### 日本語リソース
- [JIS X 8341-3:2016](https://www.jisc.go.jp/)
- [ウェブアクセシビリティ基盤委員会](https://waic.jp/)
- [総務省 みんなの公共サイト運用ガイドライン](https://www.soumu.go.jp/main_sosiki/joho_tsusin/b_free/guideline.html)

### 開発ツール
- [axe-core](https://github.com/dequelabs/axe-core)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- [Pa11y](https://pa11y.org/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## 更新履歴

- **2024-06-22**: WCAG 2.1 AA 準拠実装完了
  - 基本的なアクセシビリティ機能の実装
  - React/TypeScript フックとコンポーネントの追加
  - 自動テストスイートの作成
  - ドキュメントの整備