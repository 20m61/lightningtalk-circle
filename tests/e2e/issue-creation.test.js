/**
 * Issue作成フロー E2Eテスト
 */

import { test, expect } from '@playwright/test';
import { issueFixtures } from '../fixtures/issues.js';

test.describe('Issue Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にホームページへアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display issue creation interface', async ({ page }) => {
    // Issue作成ボタンが表示されることを確認
    const createButton = page.locator('[data-testid="create-issue-button"]');
    await expect(createButton).toBeVisible();
    
    // ボタンテキストの確認
    await expect(createButton).toHaveText(/create.*issue/i);
  });

  test('should open issue creation form', async ({ page }) => {
    // Issue作成ボタンをクリック
    await page.click('[data-testid="create-issue-button"]');
    
    // フォームが表示されることを確認
    const form = page.locator('[data-testid="issue-form"]');
    await expect(form).toBeVisible();
    
    // 必要なフィールドが存在することを確認
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('select[name="priority"]')).toBeVisible();
  });

  test('should create issue successfully', async ({ page }) => {
    const testIssue = issueFixtures.valid.infrastructure;
    
    // Issue作成フォームを開く
    await page.click('[data-testid="create-issue-button"]');
    
    // フォームに入力
    await page.fill('input[name="title"]', testIssue.title);
    await page.fill('textarea[name="description"]', testIssue.description);
    await page.selectOption('select[name="priority"]', testIssue.priority);
    
    // ラベルを選択
    for (const label of testIssue.labels) {
      await page.check(`input[name="labels"][value="${label}"]`);
    }
    
    // フォーム送信
    await page.click('button[type="submit"]');
    
    // 成功メッセージの確認
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Issue created successfully');
    
    // Issue一覧に追加されたことを確認
    await expect(page.locator(`[data-testid="issue-${testIssue.title}"]`)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Issue作成フォームを開く
    await page.click('[data-testid="create-issue-button"]');
    
    // 何も入力せずに送信
    await page.click('button[type="submit"]');
    
    // バリデーションエラーメッセージの確認
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Title is required');
  });

  test('should handle form submission errors gracefully', async ({ page }) => {
    // ネットワークエラーをシミュレート
    await page.route('**/api/issues', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Issue作成フォームを開く
    await page.click('[data-testid="create-issue-button"]');
    
    // フォームに入力
    await page.fill('input[name="title"]', 'Test Issue');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.selectOption('select[name="priority"]', 'medium');
    
    // フォーム送信
    await page.click('button[type="submit"]');
    
    // エラーメッセージの確認
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Failed to create issue');
  });

  test('should support batch issue creation', async ({ page }) => {
    const batchIssues = issueFixtures.batch;
    
    // バッチ作成ボタンをクリック
    await page.click('[data-testid="batch-create-button"]');
    
    // バッチフォームが表示されることを確認
    await expect(page.locator('[data-testid="batch-form"]')).toBeVisible();
    
    // JSON形式でバッチデータを入力
    const jsonInput = JSON.stringify(batchIssues, null, 2);
    await page.fill('textarea[name="batch-data"]', jsonInput);
    
    // バッチ作成実行
    await page.click('button[data-testid="execute-batch"]');
    
    // 進捗表示の確認
    await expect(page.locator('.progress-bar')).toBeVisible();
    
    // 完了メッセージの確認
    await expect(page.locator('.batch-success-message')).toBeVisible();
    await expect(page.locator('.batch-success-message')).toContainText(`${batchIssues.length} issues created`);
  });

  test('should display issue list with pagination', async ({ page }) => {
    // Issue一覧ページへ移動
    await page.goto('/issues');
    
    // Issue一覧が表示されることを確認
    await expect(page.locator('[data-testid="issues-list"]')).toBeVisible();
    
    // ページネーションが表示されることを確認（複数ページある場合）
    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.isVisible()) {
      // 次のページボタンをクリック
      await page.click('[data-testid="next-page"]');
      
      // URL変更の確認
      await expect(page).toHaveURL(/page=2/);
    }
  });

  test('should filter issues by labels', async ({ page }) => {
    await page.goto('/issues');
    
    // フィルターセクションが表示されることを確認
    await expect(page.locator('[data-testid="filters"]')).toBeVisible();
    
    // 'enhancement' ラベルでフィルター
    await page.check('input[name="filter-labels"][value="enhancement"]');
    
    // フィルター適用ボタンをクリック
    await page.click('[data-testid="apply-filters"]');
    
    // フィルター結果の確認
    const issueItems = page.locator('[data-testid^="issue-"]');
    const count = await issueItems.count();
    
    if (count > 0) {
      // 各アイテムが 'enhancement' ラベルを持つことを確認
      for (let i = 0; i < count; i++) {
        const issueItem = issueItems.nth(i);
        await expect(issueItem.locator('.label-enhancement')).toBeVisible();
      }
    }
  });

  test('should search issues by title', async ({ page }) => {
    await page.goto('/issues');
    
    // 検索ボックスに入力
    const searchTerm = 'dashboard';
    await page.fill('input[data-testid="search-input"]', searchTerm);
    
    // 検索実行
    await page.click('button[data-testid="search-button"]');
    
    // 検索結果の確認
    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();
    
    // 結果のタイトルに検索語が含まれることを確認
    const resultItems = searchResults.locator('[data-testid^="issue-"]');
    const count = await resultItems.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const title = await resultItems.nth(i).locator('.issue-title').textContent();
        expect(title.toLowerCase()).toContain(searchTerm.toLowerCase());
      }
    }
  });
});