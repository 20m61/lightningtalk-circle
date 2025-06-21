# テスト戦略ガイド

## 概要

Lightning Talk Circle プロジェクトにおける包括的なテスト戦略を定義します。

## テストピラミッド

```
        ┌─────────────┐
        │    E2E      │  5%
        ├─────────────┤
        │ Integration │  25%
        ├─────────────┤
        │    Unit     │  70%
        └─────────────┘
```

## テストの種類と実装

### 1. ユニットテスト

```javascript
// tests/unit/issue-validator.test.js
import { describe, it, expect } from '@jest/globals';
import { validateIssue } from '../../src/validators/issue-validator.js';

describe('Issue Validator', () => {
  describe('validateIssue', () => {
    it('should validate a valid issue structure', () => {
      const validIssue = {
        title: 'Add user authentication',
        description: 'Implement OAuth2 authentication',
        labels: ['enhancement', 'security'],
        priority: 'high'
      };
      
      expect(validateIssue(validIssue)).toBe(true);
    });

    it('should reject issue without title', () => {
      const invalidIssue = {
        description: 'Missing title',
        labels: ['bug']
      };
      
      expect(() => validateIssue(invalidIssue))
        .toThrow('Issue title is required');
    });
  });
});
```

### 2. 統合テスト

```javascript
// tests/integration/github-api.test.js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { GitHubService } from '../../src/services/github-service.js';
import nock from 'nock';

describe('GitHub API Integration', () => {
  let githubService;

  beforeAll(() => {
    githubService = new GitHubService(process.env.GITHUB_TOKEN);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  it('should create an issue successfully', async () => {
    // APIモックの設定
    const mockIssue = {
      number: 123,
      title: 'Test Issue',
      state: 'open'
    };

    nock('https://api.github.com')
      .post('/repos/owner/repo/issues')
      .reply(201, mockIssue);

    const result = await githubService.createIssue({
      title: 'Test Issue',
      body: 'Test body'
    });

    expect(result.number).toBe(123);
    expect(result.state).toBe('open');
  });
});
```

### 3. E2E テスト

```javascript
// tests/e2e/issue-creation-flow.test.js
import { test, expect } from '@playwright/test';

test.describe('Issue Creation Flow', () => {
  test('should create issue from UI to GitHub', async ({ page }) => {
    // 1. アプリケーションにアクセス
    await page.goto('http://localhost:3000');

    // 2. Issue 作成フォームを開く
    await page.click('button[data-testid="create-issue"]');

    // 3. フォームに入力
    await page.fill('input[name="title"]', 'E2E Test Issue');
    await page.fill('textarea[name="description"]', 'Created by E2E test');
    await page.selectOption('select[name="priority"]', 'high');

    // 4. 送信
    await page.click('button[type="submit"]');

    // 5. 成功メッセージを確認
    await expect(page.locator('.success-message'))
      .toContainText('Issue created successfully');

    // 6. GitHub API で実際に作成されたか確認
    const response = await page.request.get(
      'https://api.github.com/repos/owner/repo/issues?state=open'
    );
    const issues = await response.json();
    
    expect(issues.some(issue => issue.title === 'E2E Test Issue')).toBe(true);
  });
});
```

## Docker を使用したテスト環境

### 1. テスト専用 Dockerfile

```dockerfile
# Dockerfile.test
FROM node:18-alpine

# テストツールのインストール
RUN apk add --no-cache \
    chromium \
    firefox-esr \
    git \
    bash

# Playwright の依存関係
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# テストデータのセットアップ
RUN npm run test:setup

CMD ["npm", "test"]
```

### 2. テスト用 Docker Compose

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  # アプリケーションサーバー
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgres://test:test@db:5432/lightningtalk_test
    depends_on:
      - db
    ports:
      - "3000:3000"

  # テストデータベース
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
      - POSTGRES_DB=lightningtalk_test
    volumes:
      - test-db-data:/var/lib/postgresql/data

  # テストランナー
  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.test
    depends_on:
      - app
      - db
    environment:
      - NODE_ENV=test
      - TEST_APP_URL=http://app:3000
      - DATABASE_URL=postgres://test:test@db:5432/lightningtalk_test
    volumes:
      - ./tests:/app/tests
      - ./coverage:/app/coverage
    command: npm run test:all

  # ブラウザテスト用
  selenium:
    image: selenium/standalone-chrome:latest
    ports:
      - "4444:4444"

volumes:
  test-db-data:
```

## テストデータ管理

### 1. Fixture 管理

```javascript
// tests/fixtures/issues.js
export const issueFixtures = {
  valid: {
    infrastructure: {
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing",
      labels: ["infrastructure", "automation"],
      priority: "high"
    },
    feature: {
      title: "Add user dashboard",
      description: "Create dashboard for user statistics",
      labels: ["enhancement", "frontend"],
      priority: "medium"
    }
  },
  invalid: {
    missingTitle: {
      description: "No title provided",
      labels: ["bug"]
    },
    emptyLabels: {
      title: "Issue with no labels",
      description: "This should fail validation",
      labels: []
    }
  }
};
```

### 2. テストデータのシード

```javascript
// tests/seeds/test-data.js
import { issueFixtures } from '../fixtures/issues.js';

export async function seedTestData(db) {
  // テストユーザーの作成
  const users = await db.users.createMany([
    { email: 'test1@example.com', name: 'Test User 1' },
    { email: 'test2@example.com', name: 'Test User 2' }
  ]);

  // テストプロジェクトの作成
  const project = await db.projects.create({
    name: 'Test Lightning Talk',
    ownerId: users[0].id
  });

  // テストイシューの作成
  for (const [key, issue] of Object.entries(issueFixtures.valid)) {
    await db.issues.create({
      ...issue,
      projectId: project.id,
      createdBy: users[0].id
    });
  }

  return { users, project };
}
```

## 継続的テスト実行

### 1. Git Hooks

```bash
#!/bin/bash
# .husky/pre-commit

# ステージされたファイルに対してテストを実行
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx)$')

if [ -n "$STAGED_FILES" ]; then
  # 関連するテストのみ実行
  npm run test:related -- $STAGED_FILES
  
  if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Commit aborted."
    exit 1
  fi
fi
```

### 2. Watch モード開発

```json
// package.json
{
  "scripts": {
    "dev": "concurrently \"npm run start:dev\" \"npm run test:watch\"",
    "test:watch": "jest --watch --notify",
    "test:watch:coverage": "jest --watch --coverage --coverageReporters=text"
  }
}
```

## パフォーマンステスト

```javascript
// tests/performance/issue-creation.perf.js
import { test } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should create 100 issues within 30 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await page.request.post('/api/issues', {
        data: {
          title: `Performance Test Issue ${i}`,
          description: 'Auto-generated for performance testing',
          labels: ['test']
        }
      });
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    expect(duration).toBeLessThan(30);
    console.log(`Created 100 issues in ${duration} seconds`);
  });
});
```

## テストレポートとカバレッジ

### 1. Jest 設定

```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/test-utils/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

### 2. レポート生成

```bash
# テスト実行とレポート生成
npm run test:coverage

# HTML レポートを開く
open coverage/lcov-report/index.html
```

## ベストプラクティス

1. **テストの独立性**: 各テストは他のテストに依存しない
2. **データのクリーンアップ**: afterEach/afterAll で必ずクリーンアップ
3. **適切なモック**: 外部依存はモック化
4. **意味のあるテスト名**: 何をテストしているか明確に
5. **DRY原則**: テストコードも重複を避ける

## まとめ

この包括的なテスト戦略により：

- 高品質なコードの維持
- リグレッションの早期発見
- 安全なリファクタリング
- ドキュメントとしてのテスト

が実現できます。