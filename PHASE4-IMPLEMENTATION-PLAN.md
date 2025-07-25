# Phase 4: ソースコード構造最適化 実施計画

## 概要

ソースコード構造の最適化により、コードの保守性、拡張性、テスタビリティを向上させます。

## 現状分析

### 現在の構造の問題点

1. **server/ディレクトリ**
   - ルートレベルにすべてのファイルが混在
   - ビジネスロジックとインフラストラクチャの混在
   - 機能別の整理が不十分

2. **public/ディレクトリ**
   - JavaScriptファイルがルートに散在
   - 機能モジュールの分離が不明確
   - 再利用可能なコンポーネントの欠如

3. **テストファイル**
   - テストとソースコードが離れている
   - モック管理が分散

## 実装計画

### Phase 4-1: サーバーサイド構造最適化（優先度: 高）

#### 新構造

```
server/
├── api/                    # APIレイヤー（現在のroutes/）
│   ├── auth/
│   ├── events/
│   ├── participants/
│   └── talks/
├── core/                   # ビジネスロジック
│   ├── auth/
│   │   ├── authService.js
│   │   └── authService.test.js
│   ├── events/
│   │   ├── eventService.js
│   │   └── eventService.test.js
│   └── shared/
├── infrastructure/         # 外部サービスとの統合
│   ├── database/
│   │   ├── repositories/
│   │   └── migrations/
│   ├── email/
│   ├── github/
│   └── monitoring/
├── middleware/            # Express ミドルウェア
├── config/               # 設定管理
└── app.js               # アプリケーションエントリポイント
```

#### 実装手順

1. 新ディレクトリ構造の作成
2. サービスファイルの移動と整理
3. インポートパスの更新
4. テストファイルの同居配置
5. 動作確認とテスト実行

### Phase 4-2: フロントエンド構造最適化（優先度: 中）

#### 新構造

```
public/
├── index.html
├── assets/              # 静的アセット
│   ├── css/
│   ├── images/
│   └── fonts/
├── js/                  # JavaScript モジュール
│   ├── app.js          # メインエントリポイント
│   ├── features/       # 機能別モジュール
│   │   ├── chat/
│   │   │   ├── chat.js
│   │   │   └── chat.css
│   │   ├── registration/
│   │   │   ├── registration.js
│   │   │   └── registration.css
│   │   └── survey/
│   │       ├── survey.js
│   │       └── survey.css
│   ├── components/     # 再利用可能なコンポーネント
│   │   ├── modal/
│   │   └── notification/
│   └── utils/          # ユーティリティ関数
│       ├── api.js
│       ├── storage.js
│       └── validation.js
└── lib/                # サードパーティライブラリ
```

#### 実装手順

1. 機能別にJavaScriptを分割
2. CSSモジュール化
3. 共通コンポーネントの抽出
4. ES6モジュールシステムの活用
5. ビルドプロセスの最適化

### Phase 4-3: プレースホルダーコンテンツ作成（優先度: 高）

#### 対象ファイル（22個）

優先度順に実装：

1. **高優先度**（コア機能に関連）
   - docs/api/reference.md → OpenAPI仕様から自動生成
   - docs/guides/DEVELOPER-GUIDE.md → 開発者向けガイド
   - docs/technical/technical-specifications.md → 技術仕様書

2. **中優先度**（運用に必要）
   - docs/monitoring/MONITORING-SETUP.md → 監視設定ガイド
   - docs/security/SECURITY-POLICY.md → セキュリティポリシー
   - docs/guides/troubleshooting.md → トラブルシューティング

3. **低優先度**（補足情報）
   - その他のプレースホルダーファイル

## リスク評価と対策

### リスク

1. **動作不具合**: ファイル移動によるインポートエラー
2. **テスト失敗**: パス変更によるテストの破損
3. **ビルド失敗**: CI/CDパイプラインへの影響

### 対策

1. **段階的移行**: 一度に全てを変更せず、機能単位で移行
2. **自動化ツール**: インポートパス更新スクリプトの作成
3. **包括的テスト**: 各段階でのテスト実行
4. **ロールバック準備**: git worktreeでの並行開発

## 実装スケジュール

### Week 1: 準備とPhase 4-3

- Day 1-2: 高優先度プレースホルダーの内容作成
- Day 3-4: 中優先度プレースホルダーの内容作成
- Day 5: レビューと調整

### Week 2: Phase 4-1（サーバーサイド）

- Day 1: 新構造作成とツール準備
- Day 2-3: コアサービスの移行
- Day 4: インフラストラクチャ層の整理
- Day 5: テストとCI/CD調整

### Week 3: Phase 4-2（フロントエンド）

- Day 1: 機能モジュール分割
- Day 2-3: コンポーネント抽出
- Day 4: ビルドプロセス更新
- Day 5: 統合テスト

## 成功指標

1. **コード品質**
   - テストカバレッジ80%以上維持
   - ESLintエラー0
   - 循環依存の排除

2. **パフォーマンス**
   - ビルド時間の改善
   - バンドルサイズの削減

3. **開発効率**
   - 新機能追加時間の短縮
   - デバッグ時間の削減

## 次のステップ

1. Phase 4-3（プレースホルダー作成）から開始
2. 並行してPhase 4-1の準備を進める
3. 段階的な実装とテストを繰り返す
